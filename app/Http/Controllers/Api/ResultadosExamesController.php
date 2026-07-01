<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultadosExamesController extends Controller
{
    /**
     * GET /api/resultados-exames
     * Integração Saída: resultados de exames para equipe-7.
     * Filtros opcionais:
     *   ?id_consulta=X  — exames de uma consulta específica
     *   ?status=Concluído — filtrar por status
     */
    public function index(Request $request)
    {
        $query = DB::table('itens_exame as ie')
            ->join('solicitacao_exame as se', 'se.id', '=', 'ie.id_solicitacao')
            ->join('tipo_exame as te', 'te.id', '=', 'ie.id_tipo_exame')
            ->leftJoin('consulta as c', 'c.id', '=', 'se.id_consulta')
            ->select(
                'ie.id',
                'ie.id_solicitacao',
                'ie.status',
                'ie.laudo',
                'ie.arquivo',
                'ie.data_resultado',
                'se.id_consulta',
                'se.justificativa',
                'se.prioridade',
                'te.id as id_tipo_exame',
                'te.nome as tipo_exame',
                'te.tipo as categoria',
                'te.preco',
            );

        if ($request->filled('id_consulta')) {
            $query->where('se.id_consulta', $request->id_consulta);
        }

        if ($request->filled('status')) {
            $query->where('ie.status', $request->status);
        }

        $itens = $query->orderBy('ie.data_resultado', 'desc')->get()->map(fn($i) => [
            'id'             => $i->id,
            'id_solicitacao' => $i->id_solicitacao,
            'id_consulta'    => $i->id_consulta,
            'tipo_exame'     => [
                'id'        => $i->id_tipo_exame,
                'nome'      => $i->tipo_exame,
                'categoria' => $i->categoria,
                'preco'     => $i->preco,
            ],
            'status'         => $i->status,
            'laudo'          => $i->laudo,
            'arquivo_url'    => $i->arquivo
                ? url('storage/' . $i->arquivo)
                : null,
            'data_resultado' => $i->data_resultado,
            'justificativa'  => $i->justificativa,
            'prioridade'     => $i->prioridade,
        ]);

        return response()->json([
            'total'  => $itens->count(),
            'itens'  => $itens,
        ]);
    }
}
