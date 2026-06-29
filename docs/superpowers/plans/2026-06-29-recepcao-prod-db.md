# Recepção — Prod DB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar o sistema de Recepção (equipe-2) para funcionar com o banco de produção no Railway, implementando as 4 funcionalidades requeridas e as 2 integrações.

**Architecture:** Backend Laravel + Inertia + React consumindo o DB `hospital` no Railway (mysql). Médicos vêm da API da equipe-1 (JWT do usuário logado em sessão). Consultas do dia são expostas via endpoint público para equipe-3. JWT middleware já está implantado para autenticação.

**Tech Stack:** Laravel 11, Inertia.js, React, MySQL (Railway), Tailwind CSS, Lucide React, classes `.input/.btn-primary/.card` já definidas no app.css.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `app/Models/Consulta.php` | Modificar | Timestamps customizados, status corretos, hora como datetime |
| `app/Models/Medico.php` | Modificar | Status 'A'/'I', timestamps customizados |
| `app/Models/Usuario.php` | Modificar | Timestamps customizados, relação com Plano |
| `app/Models/Pessoa.php` | Modificar | Timestamps customizados |
| `app/Models/Agenda.php` | Modificar | Timestamps customizados |
| `app/Models/Plano.php` | Criar | Modelo para planos de saúde |
| `database/migrations/XXXX_add_id_plano_to_usuario.php` | Criar | Adiciona id_plano nullable em usuario |
| `app/Http/Controllers/Recepcao/AgendamentoController.php` | Modificar | Médicos via API equipe-1, status corretos, datetime handling |
| `app/Http/Controllers/Recepcao/PacienteController.php` | Criar | CRUD de pacientes (pessoa + usuario + endereco + plano) |
| `app/Http/Controllers/Recepcao/AgendaController.php` | Criar | CRUD de horários disponíveis |
| `app/Http/Controllers/Recepcao/CheckinController.php` | Criar | Muda status para 'sala_espera', grava data_check_in |
| `app/Http/Controllers/Api/ConsultasDoDiaController.php` | Criar | Endpoint público para equipe-3 |
| `routes/web.php` | Modificar | Rotas de pacientes, agenda, checkin |
| `routes/api.php` | Modificar | GET /api/consultas-do-dia |
| `resources/js/Pages/Recepcao/Pacientes.jsx` | Criar | CRUD de pacientes |
| `resources/js/Pages/Recepcao/Agenda.jsx` | Criar | Gestão de horários |
| `resources/js/Pages/Recepcao/Checkin.jsx` | Criar | Lista para check-in |
| `resources/js/Layouts/RecepcaoLayout.jsx` | Modificar | Links para novas páginas na sidebar |

---

## Dados críticos do banco de produção

```
consulta.hora_inicio  → DATETIME (ex: "2026-06-29 08:00:00") — NÃO é TIME
consulta.status       → varchar: 'agendada' | 'sala_espera' | 'cancelada' | 'concluida'
medico.status         → varchar: 'A' (ativo) | 'I' (inativo)
usuario.id_plano      → NÃO existe ainda — será criado na Task 1
agenda.hora_inicio    → TIME (ex: "08:00:00")
```

---

## Task 1: Corrigir Models e adicionar coluna id_plano

**Files:**
- Modify: `app/Models/Consulta.php`
- Modify: `app/Models/Medico.php`
- Modify: `app/Models/Usuario.php`
- Modify: `app/Models/Pessoa.php`
- Modify: `app/Models/Agenda.php`
- Create: `app/Models/Plano.php`
- Create: `database/migrations/2026_06_29_000001_add_id_plano_to_usuario.php`

- [ ] **Reescrever `app/Models/Consulta.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consulta extends Model
{
    protected $table = 'consulta';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'id_paciente', 'id_medico', 'id_tipo_consulta',
        'data', 'hora_inicio', 'hora_fim',
        'status', 'descricao', 'data_check_in',
    ];

    // Status válidos neste sistema
    const STATUS_AGENDADA   = 'agendada';
    const STATUS_SALA       = 'sala_espera';
    const STATUS_CANCELADA  = 'cancelada';
    const STATUS_CONCLUIDA  = 'concluida';

    public function paciente()
    {
        return $this->belongsTo(Usuario::class, 'id_paciente');
    }

    public function medico()
    {
        return $this->belongsTo(Medico::class, 'id_medico');
    }

    public function tipoConsulta()
    {
        return $this->belongsTo(TipoConsulta::class, 'id_tipo_consulta');
    }
}
```

- [ ] **Reescrever `app/Models/Medico.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medico extends Model
{
    protected $table = 'medico';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'id_pessoa', 'especialidade', 'sub_especialidade',
        'crm', 'uf_crm', 'tipo', 'status',
    ];

    // Status no banco: 'A' = ativo, 'I' = inativo
    public function scopeAtivos($query)
    {
        return $query->where('status', 'A');
    }

    public function pessoa()
    {
        return $this->belongsTo(Pessoa::class, 'id_pessoa');
    }

    public function agendas()
    {
        return $this->hasMany(Agenda::class, 'id_medico');
    }

    public function consultas()
    {
        return $this->hasMany(Consulta::class, 'id_medico');
    }
}
```

- [ ] **Reescrever `app/Models/Usuario.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Usuario extends Model
{
    protected $table = 'usuario';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'usuario', 'email', 'senha', 'funcao',
        'id_pessoa', 'id_cadastro', 'id_plano', 'primeiro_acesso',
    ];

    protected $hidden = ['senha'];

    public function pessoa()
    {
        return $this->belongsTo(Pessoa::class, 'id_pessoa');
    }

    public function plano()
    {
        return $this->belongsTo(Plano::class, 'id_plano');
    }

    public function consultas()
    {
        return $this->hasMany(Consulta::class, 'id_paciente');
    }
}
```

- [ ] **Reescrever `app/Models/Pessoa.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pessoa extends Model
{
    protected $table = 'pessoa';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'nome', 'cpf', 'data_nascimento', 'email', 'telefone', 'id_endereco',
    ];

    public function endereco()
    {
        return $this->belongsTo(Endereco::class, 'id_endereco');
    }
}
```

- [ ] **Reescrever `app/Models/Agenda.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Agenda extends Model
{
    protected $table = 'agenda';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'id_medico', 'data_disponibilidade', 'hora_inicio', 'hora_fim', 'plantao',
    ];

    public function medico()
    {
        return $this->belongsTo(Medico::class, 'id_medico');
    }
}
```

- [ ] **Criar `app/Models/Plano.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plano extends Model
{
    protected $table = 'plano';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = ['descricao', 'id_tipo_cobranca', 'id_convenio'];

    public function convenio()
    {
        return $this->belongsTo(Convenio::class, 'id_convenio');
    }
}
```

- [ ] **Criar migration para id_plano**

```php
// database/migrations/2026_06_29_000001_add_id_plano_to_usuario.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->unsignedBigInteger('id_plano')->nullable()->after('id_pessoa');
        });
    }

    public function down(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->dropColumn('id_plano');
        });
    }
};
```

- [ ] **Executar migration**

```bash
php artisan migrate
```

Resultado esperado: `Migrating: 2026_06_29_000001_add_id_plano_to_usuario` → `Migrated`.

---

## Task 2: Corrigir AgendamentoController

**Files:**
- Modify: `app/Http/Controllers/Recepcao/AgendamentoController.php`

Problemas a corrigir:
1. `medicos()` — chamar API equipe-1 (não DB local)
2. `pacientes()` — sem `id_pessoa` nulo, incluir plano
3. `disponibilidade()` — `hora_inicio` no banco é DATETIME, comparar apenas o componente de tempo
4. `store()` — status `'agendada'`, hora_inicio como datetime completo, hora_fim calculada
5. `update()` — mesmo que store
6. `destroy()` — status `'cancelada'` (não `'cancelado'`)
7. `index()` — remover `TipoConsulta::all()` (já é relação), serializar corretamente

- [ ] **Reescrever `app/Http/Controllers/Recepcao/AgendamentoController.php`**

```php
<?php

namespace App\Http\Controllers\Recepcao;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use App\Models\TipoConsulta;
use App\Models\Agenda;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class AgendamentoController extends Controller
{
    private function apiUrl(): string
    {
        return env('HOSPITAL_API_URL', 'https://projeto-hospitalar-web-ii-production.up.railway.app/api');
    }

    public function index()
    {
        $consultas = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])
            ->whereYear('data', now()->year)
            ->whereMonth('data', now()->month)
            ->get()
            ->map(fn($c) => [
                'id'           => $c->id,
                'data'         => $c->data,
                'hora_inicio'  => substr($c->hora_inicio, 11, 5), // extrai HH:MM do datetime
                'hora_fim'     => substr($c->hora_fim, 11, 5),
                'status'       => $c->status,
                'descricao'    => $c->descricao,
                'data_check_in'=> $c->data_check_in,
                'paciente'     => ['pessoa' => ['nome' => $c->paciente?->pessoa?->nome]],
                'medico'       => ['pessoa' => ['nome' => $c->medico?->pessoa?->nome]],
                'tipo_consulta'=> ['descricao' => $c->tipoConsulta?->descricao],
            ]);

        $tiposConsulta = TipoConsulta::select('id', 'descricao', 'valor')->get();

        return Inertia::render('Recepcao/Agendamento', [
            'consultas'     => $consultas,
            'tiposConsulta' => $tiposConsulta,
        ]);
    }

    public function medicos()
    {
        // Integração Entrada: lista de médicos vem da API equipe-1
        $token = session('jwt_token');

        $response = Http::withToken($token)
            ->get($this->apiUrl() . '/medicos', ['status' => 'A']);

        if (!$response->successful()) {
            return response()->json([]);
        }

        $medicos = collect($response->json())->map(fn($m) => [
            'id'          => $m['id'],
            'nome'        => $m['nome'],
            'especialidade' => $m['especialidade'] ?? '',
        ]);

        return response()->json($medicos);
    }

    public function pacientes()
    {
        $pacientes = Usuario::with('pessoa')
            ->where('funcao', 'paciente')
            ->whereNotNull('id_pessoa')
            ->get()
            ->map(fn($u) => [
                'id'   => $u->id,
                'nome' => $u->pessoa->nome,
                'cpf'  => $u->pessoa->cpf,
            ]);

        return response()->json($pacientes);
    }

    public function disponibilidade(Request $request)
    {
        $request->validate([
            'medico_id' => 'required|integer',
            'data'      => 'required|date',
        ]);

        $agendas = Agenda::where('id_medico', $request->medico_id)
            ->where('data_disponibilidade', $request->data)
            ->get();

        // hora_inicio em consulta é DATETIME — comparar apenas HH:MM
        $ocupados = Consulta::where('id_medico', $request->medico_id)
            ->where('data', $request->data)
            ->whereNotIn('status', [Consulta::STATUS_CANCELADA])
            ->get()
            ->pluck('hora_inicio')
            ->map(fn($h) => substr($h, 11, 5)) // "2026-06-29 08:00:00" → "08:00"
            ->toArray();

        $slots = [];
        foreach ($agendas as $agenda) {
            $current = strtotime($agenda->hora_inicio);
            $fim     = strtotime($agenda->hora_fim);

            while ($current < $fim) {
                $hora    = date('H:i', $current);
                $slots[] = [
                    'hora'      => $hora,
                    'disponivel' => !in_array($hora, $ocupados),
                ];
                $current += 30 * 60;
            }
        }

        return response()->json($slots);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_paciente'      => 'required|integer',
            'id_medico'        => 'required|integer',
            'id_tipo_consulta' => 'required|integer',
            'data'             => 'required|date',
            'hora_inicio'      => 'required|date_format:H:i',
            'descricao'        => 'nullable|string',
        ]);

        // Verifica conflito usando componente de tempo do datetime
        $horaInicioDatetime = $request->data . ' ' . $request->hora_inicio . ':00';
        $conflito = Consulta::where('id_medico', $request->id_medico)
            ->where('data', $request->data)
            ->whereRaw("TIME(hora_inicio) = ?", [$request->hora_inicio . ':00'])
            ->whereNotIn('status', [Consulta::STATUS_CANCELADA])
            ->exists();

        if ($conflito) {
            return back()->withErrors(['hora_inicio' => 'Horário já ocupado.']);
        }

        $horaFimDatetime = $request->data . ' ' . date('H:i', strtotime($request->hora_inicio) + 30 * 60) . ':00';

        Consulta::create([
            'id_paciente'      => $request->id_paciente,
            'id_medico'        => $request->id_medico,
            'id_tipo_consulta' => $request->id_tipo_consulta,
            'data'             => $request->data,
            'hora_inicio'      => $horaInicioDatetime,
            'hora_fim'         => $horaFimDatetime,
            'status'           => Consulta::STATUS_AGENDADA,
            'descricao'        => $request->descricao,
        ]);

        return redirect()->route('recepcao.agendamento');
    }

    public function edit($id)
    {
        $consulta = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])
            ->findOrFail($id);

        return response()->json([
            'id'               => $consulta->id,
            'data'             => $consulta->data,
            'hora_inicio'      => substr($consulta->hora_inicio, 11, 5),
            'id_paciente'      => $consulta->id_paciente,
            'id_medico'        => $consulta->id_medico,
            'id_tipo_consulta' => $consulta->id_tipo_consulta,
            'status'           => $consulta->status,
            'descricao'        => $consulta->descricao,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_paciente'      => 'required|integer',
            'id_medico'        => 'required|integer',
            'id_tipo_consulta' => 'required|integer',
            'data'             => 'required|date',
            'hora_inicio'      => 'required|date_format:H:i',
            'descricao'        => 'nullable|string',
            'status'           => 'nullable|string|in:agendada,cancelada,sala_espera,concluida',
        ]);

        $conflito = Consulta::where('id_medico', $request->id_medico)
            ->where('data', $request->data)
            ->whereRaw("TIME(hora_inicio) = ?", [$request->hora_inicio . ':00'])
            ->whereNotIn('status', [Consulta::STATUS_CANCELADA])
            ->where('id', '!=', $id)
            ->exists();

        if ($conflito) {
            return back()->withErrors(['hora_inicio' => 'Horário já ocupado.']);
        }

        $consulta        = Consulta::findOrFail($id);
        $horaFimDatetime = $request->data . ' ' . date('H:i', strtotime($request->hora_inicio) + 30 * 60) . ':00';

        $consulta->update([
            'id_paciente'      => $request->id_paciente,
            'id_medico'        => $request->id_medico,
            'id_tipo_consulta' => $request->id_tipo_consulta,
            'data'             => $request->data,
            'hora_inicio'      => $request->data . ' ' . $request->hora_inicio . ':00',
            'hora_fim'         => $horaFimDatetime,
            'descricao'        => $request->descricao,
            'status'           => $request->status ?? $consulta->status,
        ]);

        return redirect()->route('recepcao.agendamento');
    }

    public function destroy($id)
    {
        $consulta         = Consulta::findOrFail($id);
        $consulta->status = Consulta::STATUS_CANCELADA;
        $consulta->save();

        return redirect()->route('recepcao.agendamento');
    }
}
```

- [ ] **Verificar que a rota `/recepcao/medicos` usa este controller** (já existe em routes/web.php)

---

## Task 3: Gestão de Pacientes — Backend

**Files:**
- Create: `app/Http/Controllers/Recepcao/PacienteController.php`
- Modify: `routes/web.php`

- [ ] **Criar `app/Http/Controllers/Recepcao/PacienteController.php`**

```php
<?php

namespace App\Http\Controllers\Recepcao;

use App\Http\Controllers\Controller;
use App\Models\Endereco;
use App\Models\Pessoa;
use App\Models\Plano;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PacienteController extends Controller
{
    public function index()
    {
        $pacientes = Usuario::with(['pessoa.endereco', 'plano'])
            ->where('funcao', 'paciente')
            ->get()
            ->map(fn($u) => [
                'id'     => $u->id,
                'nome'   => $u->pessoa?->nome ?? $u->usuario,
                'cpf'    => $u->pessoa?->cpf,
                'email'  => $u->email,
                'plano'  => $u->plano?->descricao,
                'id_plano' => $u->id_plano,
                'endereco' => $u->pessoa?->endereco,
            ]);

        $planos = Plano::select('id', 'descricao')->orderBy('descricao')->get();

        return Inertia::render('Recepcao/Pacientes', [
            'pacientes' => $pacientes,
            'planos'    => $planos,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome'            => 'required|string|max:100',
            'cpf'             => 'required|string|size:11',
            'data_nascimento' => 'nullable|date',
            'email'           => 'nullable|email|max:345',
            'telefone'        => 'nullable|string|max:11',
            'logradouro'      => 'nullable|string|max:100',
            'numero'          => 'nullable|string|max:10',
            'complemento'     => 'nullable|string|max:100',
            'cidade'          => 'nullable|string|max:100',
            'estado'          => 'nullable|string|size:2',
            'cep'             => 'nullable|string|max:8',
            'id_plano'        => 'nullable|integer|exists:plano,id',
        ]);

        DB::transaction(function () use ($request) {
            $enderecoId = null;
            if ($request->filled('logradouro')) {
                $endereco   = Endereco::create($request->only('logradouro', 'numero', 'complemento', 'cidade', 'estado', 'cep'));
                $enderecoId = $endereco->id;
            }

            $pessoa = Pessoa::create([
                'nome'            => $request->nome,
                'cpf'             => $request->cpf,
                'data_nascimento' => $request->data_nascimento,
                'email'           => $request->email,
                'telefone'        => $request->telefone,
                'id_endereco'     => $enderecoId,
            ]);

            Usuario::create([
                'usuario'    => $request->nome,
                'email'      => $request->email ?? ($request->cpf . '@paciente.local'),
                'senha'      => bcrypt($request->cpf), // senha inicial = CPF
                'funcao'     => 'paciente',
                'id_pessoa'  => $pessoa->id,
                'id_plano'   => $request->id_plano,
                'id_cadastro'=> session('jwt_user')['id'] ?? null,
                'primeiro_acesso' => true,
            ]);
        });

        return redirect()->route('recepcao.pacientes');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nome'            => 'required|string|max:100',
            'cpf'             => 'required|string|size:11',
            'data_nascimento' => 'nullable|date',
            'email'           => 'nullable|email|max:345',
            'telefone'        => 'nullable|string|max:11',
            'logradouro'      => 'nullable|string|max:100',
            'numero'          => 'nullable|string|max:10',
            'complemento'     => 'nullable|string|max:100',
            'cidade'          => 'nullable|string|max:100',
            'estado'          => 'nullable|string|size:2',
            'cep'             => 'nullable|string|max:8',
            'id_plano'        => 'nullable|integer|exists:plano,id',
        ]);

        $usuario = Usuario::with('pessoa.endereco')->findOrFail($id);

        DB::transaction(function () use ($request, $usuario) {
            // Atualiza ou cria endereço
            if ($request->filled('logradouro')) {
                if ($usuario->pessoa?->id_endereco) {
                    $usuario->pessoa->endereco->update(
                        $request->only('logradouro', 'numero', 'complemento', 'cidade', 'estado', 'cep')
                    );
                } else {
                    $endereco = Endereco::create(
                        $request->only('logradouro', 'numero', 'complemento', 'cidade', 'estado', 'cep')
                    );
                    $usuario->pessoa->update(['id_endereco' => $endereco->id]);
                }
            }

            // Atualiza Pessoa
            $usuario->pessoa?->update([
                'nome'            => $request->nome,
                'cpf'             => $request->cpf,
                'data_nascimento' => $request->data_nascimento,
                'email'           => $request->email,
                'telefone'        => $request->telefone,
            ]);

            // Atualiza Usuario
            $usuario->update([
                'usuario'  => $request->nome,
                'email'    => $request->email ?? $usuario->email,
                'id_plano' => $request->id_plano,
            ]);
        });

        return redirect()->route('recepcao.pacientes');
    }

    public function destroy($id)
    {
        // Soft-delete: mudamos funcao para 'paciente_inativo' para preservar histórico
        $usuario = Usuario::findOrFail($id);
        $usuario->update(['funcao' => 'paciente_inativo']);

        return redirect()->route('recepcao.pacientes');
    }
}
```

- [ ] **Adicionar rotas em `routes/web.php`** (dentro do grupo `middleware('jwt')`)

```php
// Pacientes
Route::prefix('recepcao')->name('recepcao.')->group(function () {
    Route::get('/pacientes',          [\App\Http\Controllers\Recepcao\PacienteController::class, 'index'])->name('pacientes');
    Route::post('/pacientes',         [\App\Http\Controllers\Recepcao\PacienteController::class, 'store'])->name('pacientes.store');
    Route::put('/pacientes/{id}',     [\App\Http\Controllers\Recepcao\PacienteController::class, 'update'])->name('pacientes.update');
    Route::delete('/pacientes/{id}',  [\App\Http\Controllers\Recepcao\PacienteController::class, 'destroy'])->name('pacientes.destroy');
});
```

---

## Task 4: Gestão de Pacientes — Frontend

**Files:**
- Create: `resources/js/Pages/Recepcao/Pacientes.jsx`

- [ ] **Criar `resources/js/Pages/Recepcao/Pacientes.jsx`**

```jsx
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import { UserPlus, Pencil, Trash2, X, Check } from 'lucide-react';

const VAZIO = {
    nome: '', cpf: '', data_nascimento: '', email: '', telefone: '',
    logradouro: '', numero: '', complemento: '', cidade: '', estado: '', cep: '',
    id_plano: '',
};

function Modal({ titulo, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">{titulo}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

function Campo({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            {children}
        </div>
    );
}

export default function Pacientes({ pacientes = [], planos = [] }) {
    const [modal, setModal]   = useState(null); // null | 'criar' | 'editar'
    const [alvo, setAlvo]     = useState(null);
    const [form, setForm]     = useState(VAZIO);
    const [loading, setLoading] = useState(false);
    const [busca, setBusca]   = useState('');

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    function abrirCriar() {
        setForm(VAZIO);
        setAlvo(null);
        setModal('criar');
    }

    function abrirEditar(p) {
        setAlvo(p);
        setForm({
            nome:          p.nome ?? '',
            cpf:           p.cpf ?? '',
            data_nascimento: '',
            email:         p.email ?? '',
            telefone:      '',
            logradouro:    p.endereco?.logradouro ?? '',
            numero:        p.endereco?.numero ?? '',
            complemento:   p.endereco?.complemento ?? '',
            cidade:        p.endereco?.cidade ?? '',
            estado:        p.endereco?.estado ?? '',
            cep:           p.endereco?.cep ?? '',
            id_plano:      p.id_plano ?? '',
        });
        setModal('editar');
    }

    function salvar() {
        setLoading(true);
        const opts = { onFinish: () => setLoading(false), onSuccess: () => setModal(null) };
        if (modal === 'criar') {
            router.post(route('recepcao.pacientes.store'), form, opts);
        } else {
            router.put(route('recepcao.pacientes.update', alvo.id), form, opts);
        }
    }

    function excluir(id) {
        if (confirm('Inativar este paciente?')) {
            router.delete(route('recepcao.pacientes.destroy', id));
        }
    }

    const filtrados = pacientes.filter(p =>
        p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        p.cpf?.includes(busca)
    );

    return (
        <RecepcaoLayout>
            <Head title="Pacientes" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Pacientes</h1>
                    <p className="text-sm text-slate-400 mt-0.5">{pacientes.length} cadastrados</p>
                </div>
                <button onClick={abrirCriar} className="btn-primary flex items-center gap-2">
                    <UserPlus size={16} /> Novo Paciente
                </button>
            </div>

            <div className="card">
                <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="input mb-4"
                />

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                                <th className="pb-2 font-medium">Nome</th>
                                <th className="pb-2 font-medium">CPF</th>
                                <th className="pb-2 font-medium">E-mail</th>
                                <th className="pb-2 font-medium">Plano</th>
                                <th className="pb-2 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtrados.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 font-medium text-slate-800">{p.nome}</td>
                                    <td className="py-3 text-slate-500">{p.cpf}</td>
                                    <td className="py-3 text-slate-500">{p.email}</td>
                                    <td className="py-3 text-slate-500">{p.plano ?? '—'}</td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => abrirEditar(p)}
                                                className="text-slate-400 hover:text-brand transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => excluir(p.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                                        Nenhum paciente encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal
                    titulo={modal === 'criar' ? 'Novo Paciente' : 'Editar Paciente'}
                    onClose={() => setModal(null)}
                >
                    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <Campo label="Nome completo *">
                                    <input className="input" value={form.nome} onChange={set('nome')} />
                                </Campo>
                            </div>
                            <Campo label="CPF * (somente números)">
                                <input className="input" maxLength={11} value={form.cpf} onChange={set('cpf')} />
                            </Campo>
                            <Campo label="Data de nascimento">
                                <input className="input" type="date" value={form.data_nascimento} onChange={set('data_nascimento')} />
                            </Campo>
                            <Campo label="E-mail">
                                <input className="input" type="email" value={form.email} onChange={set('email')} />
                            </Campo>
                            <Campo label="Telefone">
                                <input className="input" maxLength={11} value={form.telefone} onChange={set('telefone')} />
                            </Campo>
                            <div className="col-span-2">
                                <Campo label="Plano de Saúde">
                                    <select className="input" value={form.id_plano} onChange={set('id_plano')}>
                                        <option value="">Sem plano (particular)</option>
                                        {planos.map(pl => (
                                            <option key={pl.id} value={pl.id}>{pl.descricao}</option>
                                        ))}
                                    </select>
                                </Campo>
                            </div>

                            <p className="col-span-2 text-xs text-slate-400 pt-1 border-t border-slate-100">Endereço</p>

                            <div className="col-span-2">
                                <Campo label="Logradouro">
                                    <input className="input" value={form.logradouro} onChange={set('logradouro')} />
                                </Campo>
                            </div>
                            <Campo label="Número">
                                <input className="input" value={form.numero} onChange={set('numero')} />
                            </Campo>
                            <Campo label="Complemento">
                                <input className="input" value={form.complemento} onChange={set('complemento')} />
                            </Campo>
                            <Campo label="Cidade">
                                <input className="input" value={form.cidade} onChange={set('cidade')} />
                            </Campo>
                            <Campo label="Estado (UF)">
                                <input className="input" maxLength={2} value={form.estado} onChange={set('estado')} />
                            </Campo>
                            <Campo label="CEP">
                                <input className="input" maxLength={8} value={form.cep} onChange={set('cep')} />
                            </Campo>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                        <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
                        <button onClick={salvar} disabled={loading} className="btn-primary flex items-center gap-2">
                            <Check size={15} />
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </Modal>
            )}
        </RecepcaoLayout>
    );
}
```

---

## Task 5: Gestão de Agenda — Backend

**Files:**
- Create: `app/Http/Controllers/Recepcao/AgendaController.php`
- Modify: `routes/web.php`

- [ ] **Criar `app/Http/Controllers/Recepcao/AgendaController.php`**

```php
<?php

namespace App\Http\Controllers\Recepcao;

use App\Http\Controllers\Controller;
use App\Models\Agenda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class AgendaController extends Controller
{
    private function apiUrl(): string
    {
        return env('HOSPITAL_API_URL', 'https://projeto-hospitalar-web-ii-production.up.railway.app/api');
    }

    private function getMedicos(): array
    {
        $response = Http::withToken(session('jwt_token'))
            ->get($this->apiUrl() . '/medicos', ['status' => 'A']);

        return $response->successful()
            ? collect($response->json())->map(fn($m) => [
                'id'           => $m['id'],
                'nome'         => $m['nome'],
                'especialidade' => $m['especialidade'] ?? '',
              ])->values()->toArray()
            : [];
    }

    public function index()
    {
        $agendas = Agenda::with('medico.pessoa')
            ->orderBy('data_disponibilidade', 'desc')
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn($a) => [
                'id'                  => $a->id,
                'id_medico'           => $a->id_medico,
                'nome_medico'         => $a->medico?->pessoa?->nome,
                'data_disponibilidade' => $a->data_disponibilidade,
                'hora_inicio'         => substr($a->hora_inicio, 0, 5),
                'hora_fim'            => substr($a->hora_fim, 0, 5),
                'plantao'             => (bool) $a->plantao,
            ]);

        return Inertia::render('Recepcao/Agenda', [
            'agendas' => $agendas,
            'medicos' => $this->getMedicos(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_medico'           => 'required|integer',
            'data_disponibilidade' => 'required|date',
            'hora_inicio'         => 'required|date_format:H:i',
            'hora_fim'            => 'required|date_format:H:i|after:hora_inicio',
            'plantao'             => 'boolean',
        ]);

        Agenda::create($request->only(
            'id_medico', 'data_disponibilidade', 'hora_inicio', 'hora_fim', 'plantao'
        ));

        return redirect()->route('recepcao.agenda');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_medico'           => 'required|integer',
            'data_disponibilidade' => 'required|date',
            'hora_inicio'         => 'required|date_format:H:i',
            'hora_fim'            => 'required|date_format:H:i|after:hora_inicio',
            'plantao'             => 'boolean',
        ]);

        Agenda::findOrFail($id)->update($request->only(
            'id_medico', 'data_disponibilidade', 'hora_inicio', 'hora_fim', 'plantao'
        ));

        return redirect()->route('recepcao.agenda');
    }

    public function destroy($id)
    {
        Agenda::findOrFail($id)->delete();
        return redirect()->route('recepcao.agenda');
    }
}
```

- [ ] **Adicionar rotas em `routes/web.php`** (dentro do grupo `middleware('jwt')`)

```php
Route::get('/recepcao/agenda',        [\App\Http\Controllers\Recepcao\AgendaController::class, 'index'])->name('recepcao.agenda');
Route::post('/recepcao/agenda',       [\App\Http\Controllers\Recepcao\AgendaController::class, 'store'])->name('recepcao.agenda.store');
Route::put('/recepcao/agenda/{id}',   [\App\Http\Controllers\Recepcao\AgendaController::class, 'update'])->name('recepcao.agenda.update');
Route::delete('/recepcao/agenda/{id}',[\App\Http\Controllers\Recepcao\AgendaController::class, 'destroy'])->name('recepcao.agenda.destroy');
```

---

## Task 6: Gestão de Agenda — Frontend

**Files:**
- Create: `resources/js/Pages/Recepcao/Agenda.jsx`

- [ ] **Criar `resources/js/Pages/Recepcao/Agenda.jsx`**

```jsx
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import { CalendarPlus, Pencil, Trash2, X, Check } from 'lucide-react';

const VAZIO = { id_medico: '', data_disponibilidade: '', hora_inicio: '', hora_fim: '', plantao: false };

function Modal({ titulo, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">{titulo}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

export default function Agenda({ agendas = [], medicos = [] }) {
    const [modal, setModal]   = useState(null);
    const [alvo, setAlvo]     = useState(null);
    const [form, setForm]     = useState(VAZIO);
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) =>
        setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    function abrirCriar() {
        setForm(VAZIO);
        setAlvo(null);
        setModal('form');
    }

    function abrirEditar(a) {
        setAlvo(a);
        setForm({
            id_medico:             String(a.id_medico),
            data_disponibilidade:  a.data_disponibilidade,
            hora_inicio:           a.hora_inicio,
            hora_fim:              a.hora_fim,
            plantao:               a.plantao,
        });
        setModal('form');
    }

    function salvar() {
        setLoading(true);
        const opts = { onFinish: () => setLoading(false), onSuccess: () => setModal(null) };
        if (!alvo) {
            router.post(route('recepcao.agenda.store'), form, opts);
        } else {
            router.put(route('recepcao.agenda.update', alvo.id), form, opts);
        }
    }

    function excluir(id) {
        if (confirm('Excluir este horário?')) router.delete(route('recepcao.agenda.destroy', id));
    }

    return (
        <RecepcaoLayout>
            <Head title="Agenda" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Agenda Médica</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Horários disponíveis cadastrados</p>
                </div>
                <button onClick={abrirCriar} className="btn-primary flex items-center gap-2">
                    <CalendarPlus size={16} /> Novo Horário
                </button>
            </div>

            <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                            <th className="pb-2 font-medium">Médico</th>
                            <th className="pb-2 font-medium">Data</th>
                            <th className="pb-2 font-medium">Início</th>
                            <th className="pb-2 font-medium">Fim</th>
                            <th className="pb-2 font-medium">Plantão</th>
                            <th className="pb-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {agendas.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-medium text-slate-800">{a.nome_medico}</td>
                                <td className="py-3 text-slate-600">{a.data_disponibilidade}</td>
                                <td className="py-3 text-slate-600">{a.hora_inicio}</td>
                                <td className="py-3 text-slate-600">{a.hora_fim}</td>
                                <td className="py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.plantao ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {a.plantao ? 'Sim' : 'Não'}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button onClick={() => abrirEditar(a)}
                                            className="text-slate-400 hover:text-brand transition-colors">
                                            <Pencil size={15} />
                                        </button>
                                        <button onClick={() => excluir(a.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {agendas.length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhum horário cadastrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modal && (
                <Modal titulo={alvo ? 'Editar Horário' : 'Novo Horário'} onClose={() => setModal(null)}>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Médico *</label>
                            <select className="input" value={form.id_medico} onChange={set('id_medico')}>
                                <option value="">Selecione</option>
                                {medicos.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome} — {m.especialidade}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Data *</label>
                            <input type="date" className="input" value={form.data_disponibilidade} onChange={set('data_disponibilidade')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Hora início *</label>
                                <input type="time" className="input" value={form.hora_inicio} onChange={set('hora_inicio')} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Hora fim *</label>
                                <input type="time" className="input" value={form.hora_fim} onChange={set('hora_fim')} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input type="checkbox" checked={form.plantao} onChange={set('plantao')} className="rounded" />
                            Plantão
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                        <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
                        <button onClick={salvar} disabled={loading} className="btn-primary flex items-center gap-2">
                            <Check size={15} /> {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </Modal>
            )}
        </RecepcaoLayout>
    );
}
```

---

## Task 7: Check-in

**Files:**
- Create: `app/Http/Controllers/Recepcao/CheckinController.php`
- Create: `resources/js/Pages/Recepcao/Checkin.jsx`
- Modify: `routes/web.php`

- [ ] **Criar `app/Http/Controllers/Recepcao/CheckinController.php`**

```php
<?php

namespace App\Http\Controllers\Recepcao;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use Inertia\Inertia;

class CheckinController extends Controller
{
    public function index()
    {
        $consultas = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])
            ->where('data', today()->toDateString())
            ->whereIn('status', [Consulta::STATUS_AGENDADA, Consulta::STATUS_SALA])
            ->orderByRaw("TIME(hora_inicio)")
            ->get()
            ->map(fn($c) => [
                'id'           => $c->id,
                'hora_inicio'  => substr($c->hora_inicio, 11, 5),
                'status'       => $c->status,
                'data_check_in'=> $c->data_check_in,
                'paciente'     => $c->paciente?->pessoa?->nome ?? $c->paciente?->usuario,
                'medico'       => $c->medico?->pessoa?->nome,
                'tipo'         => $c->tipoConsulta?->descricao,
            ]);

        return Inertia::render('Recepcao/Checkin', ['consultas' => $consultas]);
    }

    public function store($id)
    {
        $consulta = Consulta::findOrFail($id);

        if ($consulta->status !== Consulta::STATUS_AGENDADA) {
            return back()->withErrors(['status' => 'Apenas consultas agendadas podem fazer check-in.']);
        }

        $consulta->update([
            'status'        => Consulta::STATUS_SALA,
            'data_check_in' => now(),
        ]);

        return redirect()->route('recepcao.checkin');
    }
}
```

- [ ] **Adicionar rotas em `routes/web.php`**

```php
Route::get('/recepcao/checkin',        [\App\Http\Controllers\Recepcao\CheckinController::class, 'index'])->name('recepcao.checkin');
Route::post('/recepcao/checkin/{id}',  [\App\Http\Controllers\Recepcao\CheckinController::class, 'store'])->name('recepcao.checkin.store');
```

- [ ] **Criar `resources/js/Pages/Recepcao/Checkin.jsx`**

```jsx
import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import { UserCheck, Clock } from 'lucide-react';

const STATUS = {
    agendada:   { label: 'Agendado',        cor: 'bg-blue-50 text-blue-700' },
    sala_espera: { label: 'Sala de Espera', cor: 'bg-amber-50 text-amber-700' },
};

export default function Checkin({ consultas = [] }) {
    function fazerCheckin(id) {
        if (confirm('Confirmar check-in deste paciente?')) {
            router.post(route('recepcao.checkin.store', id));
        }
    }

    return (
        <RecepcaoLayout>
            <Head title="Check-in" />

            <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-800">Check-in</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                    Consultas de hoje — {new Date().toLocaleDateString('pt-BR')}
                </p>
            </div>

            <div className="space-y-3">
                {consultas.map(c => (
                    <div key={c.id} className="card flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                <Clock size={20} className="text-brand" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800">{c.paciente}</p>
                                <p className="text-sm text-slate-500">{c.hora_inicio} · Dr(a). {c.medico}</p>
                                <p className="text-xs text-slate-400">{c.tipo}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS[c.status]?.cor}`}>
                                {STATUS[c.status]?.label ?? c.status}
                            </span>

                            {c.status === 'agendada' && (
                                <button
                                    onClick={() => fazerCheckin(c.id)}
                                    className="btn-primary flex items-center gap-1.5 py-1.5 px-3"
                                >
                                    <UserCheck size={14} /> Check-in
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {consultas.length === 0 && (
                    <div className="card text-center py-12 text-slate-400">
                        Nenhuma consulta agendada para hoje.
                    </div>
                )}
            </div>
        </RecepcaoLayout>
    );
}
```

---

## Task 8: API de Saída — Consultas do Dia para Equipe-3

**Files:**
- Create: `app/Http/Controllers/Api/ConsultasDoDiaController.php`
- Modify: `routes/api.php`

- [ ] **Criar `app/Http/Controllers/Api/ConsultasDoDiaController.php`**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use Illuminate\Http\Request;

class ConsultasDoDiaController extends Controller
{
    /**
     * GET /api/consultas-do-dia
     * Integração Saída: lista de consultas do dia para equipe-3.
     * Aceita ?data=YYYY-MM-DD (padrão: hoje).
     */
    public function index(Request $request)
    {
        $data = $request->input('data', today()->toDateString());

        $consultas = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])
            ->where('data', $data)
            ->orderByRaw("TIME(hora_inicio)")
            ->get()
            ->map(fn($c) => [
                'id'           => $c->id,
                'data'         => $c->data,
                'hora_inicio'  => substr($c->hora_inicio, 11, 5),
                'hora_fim'     => substr($c->hora_fim,    11, 5),
                'status'       => $c->status,
                'data_check_in'=> $c->data_check_in,
                'paciente'     => [
                    'id'   => $c->id_paciente,
                    'nome' => $c->paciente?->pessoa?->nome ?? $c->paciente?->usuario,
                    'cpf'  => $c->paciente?->pessoa?->cpf,
                ],
                'medico'       => [
                    'id'           => $c->id_medico,
                    'nome'         => $c->medico?->pessoa?->nome,
                    'especialidade' => $c->medico?->especialidade,
                ],
                'tipo_consulta' => [
                    'id'      => $c->id_tipo_consulta,
                    'descricao' => $c->tipoConsulta?->descricao,
                ],
            ]);

        return response()->json([
            'data'      => $data,
            'total'     => $consultas->count(),
            'consultas' => $consultas,
        ]);
    }
}
```

- [ ] **Verificar/criar `routes/api.php`** e adicionar rota pública:

```php
<?php

use App\Http\Controllers\Api\ConsultasDoDiaController;
use Illuminate\Support\Facades\Route;

// Integração Saída: endpoint público para equipe-3
Route::get('/consultas-do-dia', [ConsultasDoDiaController::class, 'index']);
```

- [ ] **Testar o endpoint manualmente**

```bash
curl "http://localhost:8000/api/consultas-do-dia" | python -m json.tool
# Ou com data específica:
curl "http://localhost:8000/api/consultas-do-dia?data=2026-05-05"
```

Resultado esperado: JSON com `{ data, total, consultas: [...] }`.

---

## Task 9: Atualizar Sidebar e Rotas finais

**Files:**
- Modify: `resources/js/Layouts/RecepcaoLayout.jsx`
- Modify: `routes/web.php` (verificar que todas as rotas novas estão no grupo jwt)

- [ ] **Atualizar sidebar em `RecepcaoLayout.jsx`** — substituir o bloco `<nav>` pelo seguinte:

```jsx
<nav className="flex-1 px-3 pb-4 pt-2 space-y-0.5">
    <SidebarGroup label="Recepção">
        <SidebarItem href="/recepcao/agendamento" icon={CalendarDays} label="Agendamento" />
        <SidebarItem href="/recepcao/checkin"     icon={UserCheck}    label="Check-in" />
    </SidebarGroup>
    <SidebarGroup label="Cadastros">
        <SidebarItem href="/recepcao/pacientes"   icon={Users}        label="Pacientes" />
        <SidebarItem href="/recepcao/agenda"      icon={Clock}        label="Agenda Médica" />
    </SidebarGroup>
</nav>
```

Adicionar ao import: `import { CalendarDays, UserCheck, Users, Clock } from 'lucide-react';`

- [ ] **Verificar `routes/web.php`** — confirmar que o arquivo final tem esta estrutura:

```php
Route::middleware('jwt')->group(function () {
    // dashboard
    Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');

    // Agendamento (já existente, rotas do AgendamentoController)
    Route::prefix('recepcao')->name('recepcao.')->group(function () {
        Route::get('/agendamento',                  [AgendamentoController::class, 'index'])->name('agendamento');
        Route::get('/medicos',                      [AgendamentoController::class, 'medicos'])->name('medicos');
        Route::get('/pacientes-lista',              [AgendamentoController::class, 'pacientes'])->name('pacientes-lista');
        Route::get('/disponibilidade',              [AgendamentoController::class, 'disponibilidade'])->name('disponibilidade');
        Route::post('/agendamento',                 [AgendamentoController::class, 'store'])->name('agendamento.store');
        Route::get('/agendamento/{id}/editar',      [AgendamentoController::class, 'edit'])->name('agendamento.edit');
        Route::put('/agendamento/{id}',             [AgendamentoController::class, 'update'])->name('agendamento.update');
        Route::delete('/agendamento/{id}',          [AgendamentoController::class, 'destroy'])->name('agendamento.destroy');

        // Pacientes CRUD
        Route::get('/pacientes',                    [PacienteController::class, 'index'])->name('pacientes');
        Route::post('/pacientes',                   [PacienteController::class, 'store'])->name('pacientes.store');
        Route::put('/pacientes/{id}',               [PacienteController::class, 'update'])->name('pacientes.update');
        Route::delete('/pacientes/{id}',            [PacienteController::class, 'destroy'])->name('pacientes.destroy');

        // Agenda Médica
        Route::get('/agenda',                       [AgendaController::class, 'index'])->name('agenda');
        Route::post('/agenda',                      [AgendaController::class, 'store'])->name('agenda.store');
        Route::put('/agenda/{id}',                  [AgendaController::class, 'update'])->name('agenda.update');
        Route::delete('/agenda/{id}',               [AgendaController::class, 'destroy'])->name('agenda.destroy');

        // Check-in
        Route::get('/checkin',                      [CheckinController::class, 'index'])->name('checkin');
        Route::post('/checkin/{id}',                [CheckinController::class, 'store'])->name('checkin.store');
    });
});
```

Adicionar os `use` necessários no topo de `routes/web.php`:
```php
use App\Http\Controllers\Recepcao\AgendamentoController;
use App\Http\Controllers\Recepcao\PacienteController;
use App\Http\Controllers\Recepcao\AgendaController;
use App\Http\Controllers\Recepcao\CheckinController;
```

- [ ] **Limpar cache e verificar rotas**

```bash
php artisan route:clear && php artisan route:list --path=recepcao
```

---

## Self-Review

| Requisito | Task |
|---|---|
| CRUD Pacientes (Nome, CPF, Endereço, Plano de Saúde) | Task 3, 4 |
| Gestão de Agenda (horários disponíveis para médicos) | Task 5, 6 |
| Marcação de Consulta com validação de conflitos | Task 2 (AgendamentoController) |
| Check-in (muda status para "Paciente na Sala de Espera") | Task 7 |
| Integração Entrada: lista de Médicos da equipe-1 | Task 2 e 5 (método `getMedicos()`) |
| Integração Saída: Consultas do Dia para equipe-3 | Task 8 |
| Models corretos para o DB de prod | Task 1 |
| `consulta.hora_inicio` como DATETIME | Task 1 e 2 |
| `medico.status = 'A'` | Task 1 |
| `id_plano` na tabela `usuario` | Task 1 |
