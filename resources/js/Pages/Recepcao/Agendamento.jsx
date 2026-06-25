import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import RecepcaoLayout from '@/Layouts/RecepcaoLayout';
import Calendario from '@/Components/Recepcao/Calendario';
import SlotHorario from '@/Components/Recepcao/SlotHorario';
import ModalConfirmacao from '@/Components/Recepcao/ModalConfirmacao';
import ModalEdicao from '@/Components/Recepcao/ModalEdicao';

export default function Agendamento({ consultas = [], tiposConsulta = [], medicos = [], pacientes = [] }) {
    const hoje = new Date();
    const [ano, setAno] = useState(hoje.getFullYear());
    const [mes, setMes] = useState(hoje.getMonth());
    const [diaSelecionado, setDiaSelecionado] = useState(null);

    const [slots, setSlots] = useState([]);

    const [medicoId, setMedicoId] = useState('');
    const [pacienteId, setPacienteId] = useState('');
    const [horaSelecionada, setHoraSelecionada] = useState('');
    const [tipoConsultaId, setTipoConsultaId] = useState('');
    const [descricao, setDescricao] = useState('');

    const [modalAberto, setModalAberto] = useState(false);
    const [consultasDoDia, setConsultasDoDia] = useState([]);

    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
    const [consultaEmEdicao, setConsultaEmEdicao] = useState(null);

    useEffect(() => {
        if (!medicoId || !diaSelecionado) {
            setSlots([]);
            setHoraSelecionada('');
            return;
        }

        const token = localStorage.getItem('token');
        fetch(route('recepcao.disponibilidade') + `?medico_id=${medicoId}&data=${diaSelecionado}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                setSlots(data);
                setHoraSelecionada('');
            })
            .catch(() => setSlots([]));
    }, [medicoId, diaSelecionado]);

    useEffect(() => {
        if (!diaSelecionado) {
            setConsultasDoDia([]);
            return;
        }
        setConsultasDoDia(consultas.filter((c) => c.data === diaSelecionado));
    }, [diaSelecionado]);

    function handleMesChange(delta) {
        const d = new Date(ano, mes + delta, 1);
        setAno(d.getFullYear());
        setMes(d.getMonth());
    }

    function handleDiaClick(data) {
        setDiaSelecionado(data);
        setHoraSelecionada('');
    }

    function resumoAgendamento() {
        const medico = medicos.find((m) => m.id == medicoId);
        const paciente = pacientes.find((p) => p.id == pacienteId);
        const tipo = tiposConsulta.find((t) => t.id == tipoConsultaId);
        return {
            paciente: paciente ? `${paciente.nome} (${paciente.cpf})` : '',
            medico: medico ? `${medico.nome} — ${medico.especialidade}` : '',
            data: diaSelecionado ?? '',
            hora: horaSelecionada,
            tipo: tipo ? `${tipo.descricao} — R$ ${tipo.valor}` : '',
        };
    }

    function handleAgendar(e) {
        e.preventDefault();
        setModalAberto(true);
    }

    function handleConfirmar() {
        router.post(route('recepcao.agendamento.store'), {
            id_paciente: pacienteId,
            id_medico: medicoId,
            id_tipo_consulta: tipoConsultaId,
            data: diaSelecionado,
            hora_inicio: horaSelecionada,
            descricao,
        });
        setModalAberto(false);
    }

    function handleCancelarConsulta(id) {
        if (confirm('Cancelar esta consulta?')) {
            router.delete(route('recepcao.agendamento.destroy', id));
        }
    }

    function handleEditarConsulta(consulta) {
        setConsultaEmEdicao(consulta);
        setModalEdicaoAberto(true);
    }

    const statusLabel = { agendado: 'Agendado', cancelado: 'Cancelado', realizado: 'Realizado' };
    const statusCor = {
        agendado: 'text-teal-700 bg-teal-50',
        cancelado: 'text-red-700 bg-red-50',
        realizado: 'text-gray-700 bg-gray-100',
    };

    const podeSalvar = medicoId && pacienteId && diaSelecionado && horaSelecionada && tipoConsultaId;

    return (
        <RecepcaoLayout>
            <Head title="Agendamento" />

            <div className="flex gap-6">
                {/* Coluna esquerda — Calendário */}
                <div className="w-72 flex-shrink-0 space-y-4">
                    <Calendario
                        ano={ano}
                        mes={mes}
                        consultas={consultas}
                        diaSelecionado={diaSelecionado}
                        onDiaClick={handleDiaClick}
                        onMesChange={handleMesChange}
                    />

                    {diaSelecionado && consultasDoDia.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                Consultas em {diaSelecionado}
                            </h3>
                            {consultasDoDia.map((c) => (
                                <div
                                    key={c.id}
                                    className="text-xs border border-gray-100 rounded p-2 space-y-0.5"
                                >
                                    <div className="font-medium text-gray-800">
                                        {c.hora_inicio} — {c.paciente?.pessoa?.nome}
                                    </div>
                                    <div className="text-gray-500">
                                        Dr. {c.medico?.pessoa?.nome}
                                    </div>
                                    <div className="text-gray-400">
                                        {c.tipo_consulta?.descricao}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusCor[c.status] ?? ''}`}
                                        >
                                            {statusLabel[c.status] ?? c.status}
                                        </span>
                                        {c.status === 'agendado' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditarConsulta(c)}
                                                    className="text-teal-600 hover:text-teal-800 text-xs"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleCancelarConsulta(c.id)}
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Coluna direita — Formulário */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-5">
                        Novo Agendamento
                    </h2>

                    <form onSubmit={handleAgendar} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Médico
                            </label>
                            <select
                                value={medicoId}
                                onChange={(e) => setMedicoId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Selecione o médico</option>
                                {medicos.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.nome} — {m.especialidade}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Paciente
                            </label>
                            <select
                                value={pacienteId}
                                onChange={(e) => setPacienteId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Selecione o paciente</option>
                                {pacientes.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nome} ({p.cpf})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data selecionada
                            </label>
                            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50">
                                {diaSelecionado ?? 'Clique em um dia no calendário'}
                            </div>
                        </div>

                        {slots.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Horários disponíveis
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {slots.map((s) => (
                                        <SlotHorario
                                            key={s.hora}
                                            hora={s.hora}
                                            disponivel={s.disponivel}
                                            selecionado={horaSelecionada === s.hora}
                                            onClick={setHoraSelecionada}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {medicoId && diaSelecionado && slots.length === 0 && (
                            <p className="text-sm text-gray-400">
                                Nenhum horário disponível para este dia.
                            </p>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Consulta
                            </label>
                            <select
                                value={tipoConsultaId}
                                onChange={(e) => setTipoConsultaId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Selecione o tipo</option>
                                {tiposConsulta.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.descricao} — R$ {t.valor}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descrição (opcional)
                            </label>
                            <textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                placeholder="Observações sobre a consulta..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!podeSalvar}
                            className={
                                'w-full py-2 rounded-lg font-medium text-sm transition-colors ' +
                                (podeSalvar
                                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                            }
                        >
                            Agendar
                        </button>
                    </form>
                </div>
            </div>

            <ModalConfirmacao
                isOpen={modalAberto}
                onClose={() => setModalAberto(false)}
                onConfirm={handleConfirmar}
                resumo={resumoAgendamento()}
            />

            <ModalEdicao
                isOpen={modalEdicaoAberto}
                onClose={() => {
                    setModalEdicaoAberto(false);
                    setConsultaEmEdicao(null);
                }}
                consulta={consultaEmEdicao}
                medicos={medicos}
                pacientes={pacientes}
                tiposConsulta={tiposConsulta}
            />
        </RecepcaoLayout>
    );
}
