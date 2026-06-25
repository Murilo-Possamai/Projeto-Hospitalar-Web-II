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

    private function getPacientes(): array
    {
        return Usuario::with('pessoa')
            ->where('funcao', 'paciente')
            ->get()
            ->map(fn($u) => [
                'id'   => $u->id,
                'nome' => $u->pessoa?->nome ?? $u->usuario,
                'cpf'  => $u->pessoa?->cpf ?? '—',
            ])->values()->toArray();
    }

    public function index()
    {
        $consultas = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])
            ->whereYear('data', now()->year)
            ->whereMonth('data', now()->month)
            ->get()
            ->map(fn($c) => [
                'id'            => $c->id,
                'data'          => $c->data,
                'hora_inicio'   => strlen($c->hora_inicio) > 8
                    ? substr($c->hora_inicio, 11, 5)
                    : substr($c->hora_inicio, 0, 5),
                'hora_fim'      => strlen($c->hora_fim ?? '') > 8
                    ? substr($c->hora_fim, 11, 5)
                    : substr($c->hora_fim ?? '', 0, 5),
                'status'        => $c->status,
                'descricao'     => $c->descricao,
                'data_check_in' => $c->data_check_in,
                'paciente'      => ['pessoa' => ['nome' => $c->paciente?->pessoa?->nome ?? $c->paciente?->usuario]],
                'medico'        => ['pessoa' => ['nome' => $c->medico?->pessoa?->nome]],
                'tipo_consulta' => ['descricao' => $c->tipoConsulta?->descricao],
            ]);

        $tiposConsulta = TipoConsulta::select('id', 'descricao', 'valor')->get();

        return Inertia::render('Recepcao/Agendamento', [
            'consultas'     => $consultas,
            'tiposConsulta' => $tiposConsulta,
            'medicos'       => $this->getMedicos(),
            'pacientes'     => $this->getPacientes(),
        ]);
    }

    // Integração Entrada: lista de médicos vem da API equipe-1
    public function medicos()
    {
        $response = Http::withToken(session('jwt_token'))
            ->get($this->apiUrl() . '/medicos', ['status' => 'A']);

        if (!$response->successful()) {
            return response()->json([]);
        }

        $medicos = collect($response->json())->map(fn($m) => [
            'id'           => $m['id'],
            'nome'         => $m['nome'],
            'especialidade' => $m['especialidade'] ?? '',
        ]);

        return response()->json($medicos);
    }

    public function pacientes()
    {
        $pacientes = Usuario::with('pessoa')
            ->where('funcao', 'paciente')
            ->get()
            ->map(fn($u) => [
                'id'   => $u->id,
                'nome' => $u->pessoa?->nome ?? $u->usuario,
                'cpf'  => $u->pessoa?->cpf ?? '—',
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

        // hora_inicio em consulta é DATETIME — extrair apenas HH:MM
        $ocupados = Consulta::where('id_medico', $request->medico_id)
            ->where('data', $request->data)
            ->whereNotIn('status', [Consulta::STATUS_CANCELADA])
            ->get()
            ->pluck('hora_inicio')
            ->map(fn($h) => strlen($h) > 8 ? substr($h, 11, 5) : substr($h, 0, 5))
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
            'hora_inicio'      => 'required',
            'descricao'        => 'nullable|string',
        ]);

        $hora = strlen($request->hora_inicio) === 5
            ? $request->hora_inicio
            : substr($request->hora_inicio, 0, 5);

        $conflito = Consulta::where('id_medico', $request->id_medico)
            ->where('data', $request->data)
            ->whereRaw("TIME(hora_inicio) = ?", [$hora . ':00'])
            ->whereNotIn('status', [Consulta::STATUS_CANCELADA])
            ->exists();

        if ($conflito) {
            return back()->withErrors(['hora_inicio' => 'Horário já ocupado.']);
        }

        $horaFim = date('H:i', strtotime($hora) + 30 * 60);

        Consulta::create([
            'id_paciente'      => $request->id_paciente,
            'id_medico'        => $request->id_medico,
            'id_tipo_consulta' => $request->id_tipo_consulta,
            'data'             => $request->data,
            'hora_inicio'      => $request->data . ' ' . $hora . ':00',
            'hora_fim'         => $request->data . ' ' . $horaFim . ':00',
            'status'           => Consulta::STATUS_AGENDADA,
            'descricao'        => $request->descricao,
        ]);

        return redirect()->route('recepcao.agendamento');
    }

    public function edit($id)
    {
        $c = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])->findOrFail($id);

        $horaInicio = strlen($c->hora_inicio) > 8
            ? substr($c->hora_inicio, 11, 5)
            : substr($c->hora_inicio, 0, 5);

        return response()->json([
            'id'               => $c->id,
            'data'             => $c->data,
            'hora_inicio'      => $horaInicio,
            'id_paciente'      => $c->id_paciente,
            'id_medico'        => $c->id_medico,
            'id_tipo_consulta' => $c->id_tipo_consulta,
            'status'           => $c->status,
            'descricao'        => $c->descricao,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_paciente'      => 'required|integer',
            'id_medico'        => 'required|integer',
            'id_tipo_consulta' => 'required|integer',
            'data'             => 'required|date',
            'hora_inicio'      => 'required',
            'descricao'        => 'nullable|string',
            'status'           => 'nullable|string|in:agendada,cancelada,sala_espera,concluida',
        ]);

        $hora = strlen($request->hora_inicio) === 5
            ? $request->hora_inicio
            : substr($request->hora_inicio, 0, 5);

        $conflito = Consulta::where('id_medico', $request->id_medico)
            ->where('data', $request->data)
            ->whereRaw("TIME(hora_inicio) = ?", [$hora . ':00'])
            ->whereNotIn('status', [Consulta::STATUS_CANCELADA])
            ->where('id', '!=', $id)
            ->exists();

        if ($conflito) {
            return back()->withErrors(['hora_inicio' => 'Horário já ocupado.']);
        }

        $consulta = Consulta::findOrFail($id);
        $horaFim  = date('H:i', strtotime($hora) + 30 * 60);

        $consulta->update([
            'id_paciente'      => $request->id_paciente,
            'id_medico'        => $request->id_medico,
            'id_tipo_consulta' => $request->id_tipo_consulta,
            'data'             => $request->data,
            'hora_inicio'      => $request->data . ' ' . $hora . ':00',
            'hora_fim'         => $request->data . ' ' . $horaFim . ':00',
            'descricao'        => $request->descricao,
            'status'           => $request->status ?? $consulta->status,
        ]);

        return redirect()->route('recepcao.agendamento');
    }

    public function destroy($id)
    {
        $consulta = Consulta::findOrFail($id);
        $consulta->update(['status' => Consulta::STATUS_CANCELADA]);

        return redirect()->route('recepcao.agendamento');
    }
}
