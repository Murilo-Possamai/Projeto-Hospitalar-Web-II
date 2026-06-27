import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import { UserCheck, Clock } from 'lucide-react';

const STATUS = {
    agendada:    { label: 'Agendado',          cor: 'bg-blue-50 text-blue-700' },
    sala_espera: { label: 'Sala de Espera',    cor: 'bg-amber-50 text-amber-700' },
};

export default function Checkin({ consultas = [] }) {
    function fazerCheckin(id) {
        if (confirm('Confirmar check-in? O paciente será colocado na sala de espera.')) {
            router.post(route('recepcao.checkin.store', id));
        }
    }

    const agendadas  = consultas.filter(c => c.status === 'agendada');
    const emEspera   = consultas.filter(c => c.status === 'sala_espera');

    return (
        <RecepcaoLayout>
            <Head title="Check-in" />

            <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-800">Check-in</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                    Consultas de hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
            </div>

            {emEspera.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                        Na Sala de Espera ({emEspera.length})
                    </h2>
                    <div className="space-y-2">
                        {emEspera.map(c => (
                            <div key={c.id} className="card flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                        <Clock size={18} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{c.paciente}</p>
                                        <p className="text-sm text-slate-500">{c.hora_inicio} · Dr(a). {c.medico}</p>
                                        {c.tipo && <p className="text-xs text-slate-400">{c.tipo}</p>}
                                    </div>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700 shrink-0">
                                    Sala de Espera
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                    Aguardando Check-in ({agendadas.length})
                </h2>
                <div className="space-y-2">
                    {agendadas.map(c => (
                        <div key={c.id} className="card flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                    <UserCheck size={18} className="text-brand" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{c.paciente}</p>
                                    <p className="text-sm text-slate-500">{c.hora_inicio} · Dr(a). {c.medico}</p>
                                    {c.tipo && <p className="text-xs text-slate-400">{c.tipo}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => fazerCheckin(c.id)}
                                className="btn-primary flex items-center gap-1.5 py-1.5 px-3 shrink-0"
                            >
                                <UserCheck size={14} /> Check-in
                            </button>
                        </div>
                    ))}

                    {agendadas.length === 0 && emEspera.length === 0 && (
                        <div className="card text-center py-12 text-slate-400">
                            Nenhuma consulta agendada para hoje.
                        </div>
                    )}
                    {agendadas.length === 0 && emEspera.length > 0 && (
                        <div className="card text-center py-6 text-slate-400 text-sm">
                            Todos os pacientes já fizeram check-in.
                        </div>
                    )}
                </div>
            </div>
        </RecepcaoLayout>
    );
}
