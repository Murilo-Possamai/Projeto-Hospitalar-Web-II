import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import { UserPlus, Pencil, Trash2, X, Check } from 'lucide-react';

const VAZIO = {
    nome: '', cpf: '', data_nascimento: '', email: '', telefone: '',
    logradouro: '', numero: '', complemento: '', cidade: '', estado: '', cep: '',
    id_plano: '',
};

function Modal({ titulo, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
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

function Campo({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            {children}
        </div>
    );
}

export default function Pacientes({ pacientes = [], planos = [] }) {
    const [modal, setModal]     = useState(null);
    const [alvo, setAlvo]       = useState(null);
    const [form, setForm]       = useState(VAZIO);
    const [loading, setLoading] = useState(false);
    const [busca, setBusca]     = useState('');

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    function abrirCriar() {
        setForm(VAZIO);
        setAlvo(null);
        setModal('form');
    }

    function abrirEditar(p) {
        setAlvo(p);
        setForm({
            nome:            p.nome ?? '',
            cpf:             p.cpf ?? '',
            data_nascimento: p.data_nascimento ?? '',
            email:           p.email ?? '',
            telefone:        p.telefone ?? '',
            logradouro:      p.endereco?.logradouro ?? '',
            numero:          p.endereco?.numero ?? '',
            complemento:     p.endereco?.complemento ?? '',
            cidade:          p.endereco?.cidade ?? '',
            estado:          p.endereco?.estado ?? '',
            cep:             p.endereco?.cep ?? '',
            id_plano:        p.id_plano ?? '',
        });
        setModal('form');
    }

    function salvar() {
        setLoading(true);
        const opts = {
            onFinish:  () => setLoading(false),
            onSuccess: () => setModal(null),
        };
        if (!alvo) {
            router.post(route('recepcao.pacientes.store'), form, opts);
        } else {
            router.put(route('recepcao.pacientes.update', alvo.id), form, opts);
        }
    }

    function excluir(id) {
        if (confirm('Inativar este paciente? O histórico de consultas será mantido.')) {
            router.delete(route('recepcao.pacientes.destroy', id));
        }
    }

    const filtrados = pacientes.filter(p =>
        p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        p.cpf?.includes(busca)
    );

    return (
        <RecepcaoLayout>
            <Head title="Pacientes" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Pacientes</h1>
                    <p className="text-sm text-slate-400 mt-0.5">{pacientes.length} cadastrados</p>
                </div>
                <button onClick={abrirCriar} className="btn-primary flex items-center gap-2">
                    <UserPlus size={16} /> Novo Paciente
                </button>
            </div>

            <div className="card">
                <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="input mb-4"
                />

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                                <th className="pb-2 font-medium">Nome</th>
                                <th className="pb-2 font-medium">CPF</th>
                                <th className="pb-2 font-medium">Telefone</th>
                                <th className="pb-2 font-medium">Plano</th>
                                <th className="pb-2 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtrados.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 font-medium text-slate-800">{p.nome}</td>
                                    <td className="py-3 text-slate-500">{p.cpf}</td>
                                    <td className="py-3 text-slate-500">{p.telefone ?? '—'}</td>
                                    <td className="py-3 text-slate-500">{p.plano ?? '—'}</td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => abrirEditar(p)}
                                                className="text-slate-400 hover:text-brand transition-colors"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => excluir(p.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                                        {busca ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal
                    titulo={alvo ? 'Editar Paciente' : 'Novo Paciente'}
                    onClose={() => setModal(null)}
                >
                    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <Campo label="Nome completo *">
                                    <input className="input" value={form.nome} onChange={set('nome')} />
                                </Campo>
                            </div>
                            <Campo label="CPF *">
                                <input className="input" maxLength={14} value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
                            </Campo>
                            <Campo label="Data de nascimento">
                                <input className="input" type="date" value={form.data_nascimento} onChange={set('data_nascimento')} />
                            </Campo>
                            <Campo label="E-mail">
                                <input className="input" type="email" value={form.email} onChange={set('email')} />
                            </Campo>
                            <Campo label="Telefone">
                                <input className="input" maxLength={11} value={form.telefone} onChange={set('telefone')} placeholder="48999999999" />
                            </Campo>
                            <div className="col-span-2">
                                <Campo label="Plano de Saúde">
                                    <select className="input" value={form.id_plano} onChange={set('id_plano')}>
                                        <option value="">Sem plano (particular)</option>
                                        {planos.map(pl => (
                                            <option key={pl.id} value={pl.id}>{pl.descricao}</option>
                                        ))}
                                    </select>
                                </Campo>
                            </div>

                            <p className="col-span-2 text-xs text-slate-400 pt-1 border-t border-slate-100">Endereço (opcional)</p>

                            <div className="col-span-2">
                                <Campo label="Logradouro">
                                    <input className="input" value={form.logradouro} onChange={set('logradouro')} />
                                </Campo>
                            </div>
                            <Campo label="Número">
                                <input className="input" value={form.numero} onChange={set('numero')} />
                            </Campo>
                            <Campo label="Complemento">
                                <input className="input" value={form.complemento} onChange={set('complemento')} />
                            </Campo>
                            <Campo label="Cidade">
                                <input className="input" value={form.cidade} onChange={set('cidade')} />
                            </Campo>
                            <Campo label="Estado (UF)">
                                <input className="input" maxLength={2} value={form.estado} onChange={set('estado')} placeholder="SC" />
                            </Campo>
                            <div className="col-span-2">
                                <Campo label="CEP">
                                    <input className="input" maxLength={8} value={form.cep} onChange={set('cep')} placeholder="88000000" />
                                </Campo>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                        <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
                        <button onClick={salvar} disabled={loading} className="btn-primary flex items-center gap-2">
                            <Check size={15} />
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </Modal>
            )}
        </RecepcaoLayout>
    );
}
