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
                'id'                   => $a->id,
                'id_medico'            => $a->id_medico,
                'nome_medico'          => $a->medico?->pessoa?->nome ?? 'Médico #' . $a->id_medico,
                'data_disponibilidade' => $a->data_disponibilidade,
                'hora_inicio'          => substr($a->hora_inicio, 0, 5),
                'hora_fim'             => substr($a->hora_fim, 0, 5),
                'plantao'              => (bool) $a->plantao,
            ]);

        return Inertia::render('Recepcao/Agenda', [
            'agendas' => $agendas,
            'medicos' => $this->getMedicos(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_medico'            => 'required|integer',
            'data_disponibilidade' => 'required|date',
            'hora_inicio'          => 'required',
            'hora_fim'             => 'required',
            'plantao'              => 'boolean',
        ]);

        Agenda::create([
            'id_medico'            => $request->id_medico,
            'data_disponibilidade' => $request->data_disponibilidade,
            'hora_inicio'          => $request->hora_inicio,
            'hora_fim'             => $request->hora_fim,
            'plantao'              => $request->boolean('plantao'),
        ]);

        return redirect()->route('recepcao.agenda');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_medico'            => 'required|integer',
            'data_disponibilidade' => 'required|date',
            'hora_inicio'          => 'required',
            'hora_fim'             => 'required',
            'plantao'              => 'boolean',
        ]);

        Agenda::findOrFail($id)->update([
            'id_medico'            => $request->id_medico,
            'data_disponibilidade' => $request->data_disponibilidade,
            'hora_inicio'          => $request->hora_inicio,
            'hora_fim'             => $request->hora_fim,
            'plantao'              => $request->boolean('plantao'),
        ]);

        return redirect()->route('recepcao.agenda');
    }

    public function destroy($id)
    {
        Agenda::findOrFail($id)->delete();
        return redirect()->route('recepcao.agenda');
    }
}
