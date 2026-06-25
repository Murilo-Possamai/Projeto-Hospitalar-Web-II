import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import { CalendarPlus, Pencil, Trash2, X, Check } from 'lucide-react';

const VAZIO = {
    id_medico: '', data_disponibilidade: '', hora_inicio: '', hora_fim: '', plantao: false,
};

function Modal({ titulo, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
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

export default function Agenda({ agendas = [], medicos = [] }) {
    const [modal, setModal]     = useState(false);
    const [alvo, setAlvo]       = useState(null);
    const [form, setForm]       = useState(VAZIO);
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) =>
        setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    function abrirCriar() {
        setForm(VAZIO);
        setAlvo(null);
        setModal(true);
    }

    function abrirEditar(a) {
        setAlvo(a);
        setForm({
            id_medico:            String(a.id_medico),
            data_disponibilidade: a.data_disponibilidade,
            hora_inicio:          a.hora_inicio,
            hora_fim:             a.hora_fim,
            plantao:              a.plantao,
        });
        setModal(true);
    }

    function salvar() {
        setLoading(true);
        const opts = {
            onFinish:  () => setLoading(false),
            onSuccess: () => setModal(false),
        };
        if (!alvo) {
            router.post(route('recepcao.agenda.store'), form, opts);
        } else {
            router.put(route('recepcao.agenda.update', alvo.id), form, opts);
        }
    }

    function excluir(id) {
        if (confirm('Excluir este horário da agenda?')) {
            router.delete(route('recepcao.agenda.destroy', id));
        }
    }

    return (
        <RecepcaoLayout>
            <Head title="Agenda Médica" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Agenda Médica</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Horários disponíveis para agendamento</p>
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
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        a.plantao
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {a.plantao ? 'Sim' : 'Não'}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => abrirEditar(a)}
                                            className="text-slate-400 hover:text-brand transition-colors"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => excluir(a.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {agendas.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                    Nenhum horário cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modal && (
                <Modal titulo={alvo ? 'Editar Horário' : 'Novo Horário'} onClose={() => setModal(false)}>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Médico *</label>
                            <select className="input" value={form.id_medico} onChange={set('id_medico')}>
                                <option value="">Selecione</option>
                                {medicos.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.nome}{m.especialidade ? ` — ${m.especialidade}` : ''}
                                    </option>
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
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={form.plantao}
                                onChange={set('plantao')}
                                className="rounded border-slate-300"
                            />
                            Plantão
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                        <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
                        <button onClick={salvar} disabled={loading} className="btn-primary flex items-center gap-2">
                            <Check size={15} /> {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </Modal>
            )}
        </RecepcaoLayout>
    );
}
