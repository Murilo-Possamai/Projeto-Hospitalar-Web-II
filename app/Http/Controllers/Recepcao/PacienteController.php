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
                'id'       => $u->id,
                'nome'     => $u->pessoa?->nome ?? $u->usuario,
                'cpf'      => $u->pessoa?->cpf,
                'email'    => $u->email,
                'telefone' => $u->pessoa?->telefone,
                'plano'    => $u->plano?->descricao,
                'id_plano' => $u->id_plano,
                'endereco' => $u->pessoa?->endereco ? [
                    'logradouro' => $u->pessoa->endereco->logradouro,
                    'numero'     => $u->pessoa->endereco->numero,
                    'complemento'=> $u->pessoa->endereco->complemento,
                    'cidade'     => $u->pessoa->endereco->cidade,
                    'estado'     => $u->pessoa->endereco->estado,
                    'cep'        => $u->pessoa->endereco->cep,
                ] : null,
                'data_nascimento' => $u->pessoa?->data_nascimento,
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
            'cpf'             => 'required|string|max:14',
            'data_nascimento' => 'nullable|date',
            'email'           => 'nullable|email|max:345',
            'telefone'        => 'nullable|string|max:11',
            'logradouro'      => 'nullable|string|max:100',
            'numero'          => 'nullable|string|max:10',
            'complemento'     => 'nullable|string|max:100',
            'cidade'          => 'nullable|string|max:100',
            'estado'          => 'nullable|string|max:2',
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
                'cpf'             => preg_replace('/\D/', '', $request->cpf),
                'data_nascimento' => $request->data_nascimento,
                'email'           => $request->email,
                'telefone'        => $request->telefone,
                'id_endereco'     => $enderecoId,
            ]);

            $cpfLimpo = preg_replace('/\D/', '', $request->cpf);
            Usuario::create([
                'usuario'         => $request->nome,
                'email'           => $request->email ?? ($cpfLimpo . '@paciente.local'),
                'senha'           => bcrypt($cpfLimpo),
                'funcao'          => 'paciente',
                'id_pessoa'       => $pessoa->id,
                'id_plano'        => $request->id_plano ?: null,
                'id_cadastro'     => session('jwt_user.id') ?? session('jwt_user')['id'] ?? null,
                'primeiro_acesso' => true,
            ]);
        });

        return redirect()->route('recepcao.pacientes');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nome'            => 'required|string|max:100',
            'cpf'             => 'required|string|max:14',
            'data_nascimento' => 'nullable|date',
            'email'           => 'nullable|email|max:345',
            'telefone'        => 'nullable|string|max:11',
            'logradouro'      => 'nullable|string|max:100',
            'numero'          => 'nullable|string|max:10',
            'complemento'     => 'nullable|string|max:100',
            'cidade'          => 'nullable|string|max:100',
            'estado'          => 'nullable|string|max:2',
            'cep'             => 'nullable|string|max:8',
            'id_plano'        => 'nullable|integer|exists:plano,id',
        ]);

        $usuario = Usuario::with('pessoa.endereco')->findOrFail($id);

        DB::transaction(function () use ($request, $usuario) {
            if ($request->filled('logradouro')) {
                if ($usuario->pessoa?->id_endereco) {
                    $usuario->pessoa->endereco->update(
                        $request->only('logradouro', 'numero', 'complemento', 'cidade', 'estado', 'cep')
                    );
                } else {
                    $endereco = Endereco::create(
                        $request->only('logradouro', 'numero', 'complemento', 'cidade', 'estado', 'cep')
                    );
                    $usuario->pessoa?->update(['id_endereco' => $endereco->id]);
                }
            }

            $cpfLimpo = preg_replace('/\D/', '', $request->cpf);

            $usuario->pessoa?->update([
                'nome'            => $request->nome,
                'cpf'             => $cpfLimpo,
                'data_nascimento' => $request->data_nascimento,
                'email'           => $request->email,
                'telefone'        => $request->telefone,
            ]);

            $usuario->update([
                'usuario'  => $request->nome,
                'email'    => $request->email ?? $usuario->email,
                'id_plano' => $request->id_plano ?: null,
            ]);
        });

        return redirect()->route('recepcao.pacientes');
    }

    public function destroy($id)
    {
        Usuario::findOrFail($id)->update(['funcao' => 'paciente_inativo']);
        return redirect()->route('recepcao.pacientes');
    }
}
