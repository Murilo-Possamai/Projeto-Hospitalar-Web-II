import { ShieldPlus, Activity, CalendarDays, Lock, ClipboardList } from 'lucide-react'

const DESTAQUES = [
    { icon: Activity,      label: 'Gestão clínica integrada'  },
    { icon: CalendarDays,  label: 'Agendamentos e plantões'   },
    { icon: Lock,          label: 'Acesso seguro com JWT'     },
    { icon: ClipboardList, label: 'Histórico auditável'       },
]

export default function AuthLayout({ children, etiqueta = 'Sistema Hospitalar' }) {
    return (
        <div className="min-h-screen flex">
            {/* Lado esquerdo: branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white flex-col p-12 relative overflow-hidden">
                <div className="absolute top-24 -right-16 w-72 h-72 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-brand-light/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center">
                            <ShieldPlus size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white text-2xl font-semibold leading-none">Saúde+Vc</p>
                            <p className="text-white/40 text-xs mt-1">{etiqueta}</p>
                        </div>
                    </div>

                    <div className="my-auto py-12">
                        <h2 className="text-white text-4xl font-semibold leading-tight mb-5">
                            Cuidado integrado,<br />
                            decisões com <span className="text-brand-light">clareza</span>.
                        </h2>
                        <p className="text-white/60 text-sm leading-relaxed max-w-md">
                            A plataforma que conecta médicos, recepção, farmácia e laboratório
                            em um fluxo único, simples e seguro.
                        </p>
                    </div>

                    <ul className="space-y-3">
                        {DESTAQUES.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-3 text-white/70 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <Icon size={15} className="text-brand-light" />
                                </div>
                                {label}
                            </li>
                        ))}
                    </ul>

                    <p className="text-white/30 text-xs mt-10">
                        © 2026 IFSC Tubarão · Sistema Hospitalar
                    </p>
                </div>
            </div>

            {/* Lado direito: formulário */}
            <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 lg:p-12 bg-slate-50">
                <div className="w-full max-w-sm">
                    {/* Logo compacto (mobile) */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                            <ShieldPlus size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-slate-800 text-lg font-semibold leading-none">Saúde+Vc</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{etiqueta}</p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    )
}
