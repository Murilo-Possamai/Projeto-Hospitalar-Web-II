<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use Illuminate\Http\Request;

class ConsultasDoDiaController extends Controller
{
    /**
     * GET /api/consultas-do-dia
     * Integração Saída: consultas do dia para equipe-3.
     * ?data=YYYY-MM-DD  (padrão: hoje)
     * ?status=sala_espera  (fila de check-in para o médico)
     * ?id_medico=X
     */
    public function index(Request $request)
    {
        $data = $request->input('data', today()->toDateString());

        $consultas = Consulta::with(['paciente.pessoa', 'medico.pessoa', 'tipoConsulta'])
            ->where('data', $data)
            ->when($request->filled('status'),    fn($q) => $q->where('status', $request->status))
            ->when($request->filled('id_medico'), fn($q) => $q->where('id_medico', $request->id_medico))
            ->orderByRaw("TIME(hora_inicio)")
            ->get()
            ->map(fn($c) => [
                'id'            => $c->id,
                'data'          => $c->data,
                'hora_inicio'   => strlen($c->hora_inicio) > 8
                    ? substr($c->hora_inicio, 11, 5)
                    : substr($c->hora_inicio, 0, 5),
                'hora_fim'      => strlen($c->hora_fim) > 8
                    ? substr($c->hora_fim, 11, 5)
                    : substr($c->hora_fim, 0, 5),
                'status'        => $c->status,
                'data_check_in' => $c->data_check_in,
                'paciente'      => [
                    'id'   => $c->id_paciente,
                    'nome' => $c->paciente?->pessoa?->nome ?? $c->paciente?->usuario,
                    'cpf'  => $c->paciente?->pessoa?->cpf,
                ],
                'medico'        => [
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
