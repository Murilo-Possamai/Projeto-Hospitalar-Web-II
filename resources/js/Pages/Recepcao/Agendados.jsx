import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import { CheckCircle, XCircle, CalendarDays } from 'lucide-react';

export default function Agendados({ consultas = [] }) {
    function finalizar(id) {
        if (confirm('Marcar esta consulta como concluída?')) {
            router.patch(route('recepcao.agendados.finalizar', id));
        }
    }

    function cancelar(id) {
        if (confirm('Cancelar esta consulta?')) {
            router.patch(route('recepcao.agendados.cancelar', id));
        }
    }

    const hoje = new Date().toISOString().slice(0, 10);

    const passadas  = consultas.filter(c => c.data < hoje);
    const deHoje    = consultas.filter(c => c.data === hoje);
    const futuras   = consultas.filter(c => c.data > hoje);

    function Grupo({ titulo, lista }) {
        if (!lista.length) return null;
        return (
            <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    {titulo} ({lista.length})
                </h2>
                <div className="space-y-2">
                    {lista.map(c => (
                        <div key={c.id} className="card flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                    <CalendarDays size={18} className="text-brand" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{c.paciente}</p>
                                    <p className="text-sm text-slate-500">
                                        {c.data} · {c.hora_inicio} · Dr(a). {c.medico}
                                    </p>
                                    <p className="text-xs text-slate-400">{c.tipo}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => finalizar(c.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors"
                                >
                                    <CheckCircle size={14} /> Finalizar
                                </button>
                                <button
                                    onClick={() => cancelar(c.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                    <XCircle size={14} /> Cancelar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <RecepcaoLayout>
            <Head title="Agendados" />

            <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-800">Consultas Agendadas</h1>
                <p className="text-sm text-slate-400 mt-0.5">{consultas.length} aguardando atendimento</p>
            </div>

            {consultas.length === 0 ? (
                <div className="card text-center py-12 text-slate-400">
                    Nenhuma consulta agendada no momento.
                </div>
            ) : (
                <>
                    <Grupo titulo="Hoje" lista={deHoje} />
                    <Grupo titulo="Próximas" lista={futuras} />
                    <Grupo titulo="Passadas" lista={passadas} />
                </>
            )}
        </RecepcaoLayout>
    );
}
