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
                'hora_inicio'  => strlen($c->hora_inicio) > 8
                    ? substr($c->hora_inicio, 11, 5)
                    : substr($c->hora_inicio, 0, 5),
                'status'       => $c->status,
                'data_check_in'=> $c->data_check_in,
                'paciente'     => $c->paciente?->pessoa?->nome ?? $c->paciente?->usuario ?? 'Paciente',
                'medico'       => $c->medico?->pessoa?->nome ?? 'Médico',
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
