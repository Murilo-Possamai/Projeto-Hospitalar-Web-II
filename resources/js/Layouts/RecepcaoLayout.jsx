import { Link, usePage, router } from '@inertiajs/react';
import { CalendarDays, UserCheck, Users, Clock, Search, Bell, LogOut, ClipboardList } from 'lucide-react';

function SidebarGroup({ label, children }) {
    return (
        <div className="mb-4">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-300/60">
                {label}
            </span>
            <div className="mt-1 space-y-0.5">{children}</div>
        </div>
    );
}

function SidebarItem({ href, icon: Icon, label }) {
    const { url } = usePage();
    const active = url.startsWith(href);

    return (
        <Link
            href={href}
            className={
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                (active
                    ? 'bg-white/10 text-white'
                    : 'text-teal-100/70 hover:text-white hover:bg-white/5')
            }
        >
            <Icon size={16} />
            {label}
        </Link>
    );
}

export default function RecepcaoLayout({ children }) {
    const user = usePage().props.auth.user;

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.post(route('logout'));
    }

    const nomeExibido = user?.nome ?? user?.usuario ?? user?.name ?? '—';
    const inicial = nomeExibido.charAt(0).toUpperCase();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-56 flex flex-col shrink-0" style={{ backgroundColor: '#0a3732' }}>
                <div className="flex flex-col items-center px-5 py-6 border-b border-white/10">
                    <p className="text-white font-bold text-base tracking-wide">SAÚDE+VC</p>
                    <p className="text-teal-300/50 text-xs mt-0.5">Recepção</p>
                </div>

                <nav className="flex-1 px-3 pt-3 pb-4">
                    <SidebarGroup label="Atendimento">
                        <SidebarItem href="/recepcao/agendamento" icon={CalendarDays}   label="Agendamento" />
                        <SidebarItem href="/recepcao/agendados"   icon={ClipboardList}  label="Agendados" />
                        <SidebarItem href="/recepcao/checkin"     icon={UserCheck}      label="Check-in" />
                    </SidebarGroup>

                    <SidebarGroup label="Cadastros">
                        <SidebarItem href="/recepcao/pacientes" icon={Users}  label="Pacientes" />
                        <SidebarItem href="/recepcao/agenda"    icon={Clock}  label="Agenda Médica" />
                    </SidebarGroup>
                </nav>

                <div className="px-4 py-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-teal-100/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <LogOut size={15} /> Sair
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-md px-2.5 py-1.5 w-64">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none border-none w-full"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
                            <Bell size={18} />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-green-400 flex items-center justify-center shadow-sm">
                                    <span className="text-gray-500 text-xs font-semibold">{inicial}</span>
                                </div>
                                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{nomeExibido}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
