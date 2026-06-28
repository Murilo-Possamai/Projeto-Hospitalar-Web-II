<?php

namespace App\Http\Controllers\Recepcao;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use Inertia\Inertia;

class AgendadosController extends Controller
{
    public function index()
    {
        $consultas = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])
            ->where('status', Consulta::STATUS_AGENDADA)
            ->orderBy('data')
            ->orderByRaw("TIME(hora_inicio)")
            ->get()
            ->map(fn($c) => [
                'id'           => $c->id,
                'data'         => $c->data,
                'hora_inicio'  => strlen($c->hora_inicio) > 8
                    ? substr($c->hora_inicio, 11, 5)
                    : substr($c->hora_inicio, 0, 5),
                'paciente'     => $c->paciente?->pessoa?->nome ?? $c->paciente?->usuario ?? '—',
                'medico'       => $c->medico?->pessoa?->nome ?? '—',
                'tipo'         => $c->tipoConsulta?->descricao ?? '—',
                'descricao'    => $c->descricao,
            ]);

        return Inertia::render('Recepcao/Agendados', ['consultas' => $consultas]);
    }

    public function finalizar($id)
    {
        Consulta::findOrFail($id)->update(['status' => Consulta::STATUS_CONCLUIDA]);
        return redirect()->route('recepcao.agendados');
    }

    public function cancelar($id)
    {
        Consulta::findOrFail($id)->update(['status' => Consulta::STATUS_CANCELADA]);
        return redirect()->route('recepcao.agendados');
    }
}
