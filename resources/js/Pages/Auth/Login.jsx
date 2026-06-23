import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { router } from '@inertiajs/react'
import AuthLayout from '@/Layouts/AuthLayout'
import { authApi } from '@/api/auth'
import { emailValido } from '@/utils/validadores'

export default function Login() {
    const [form, setForm]       = useState({ email: '', senha: '' })
    const [erro, setErro]       = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErro('')

        if (!emailValido(form.email)) {
            setErro('Informe um e-mail válido.')
            return
        }
        if (!form.senha) {
            setErro('Informe sua senha.')
            return
        }

        setLoading(true)
        try {
            const { data } = await authApi.login(form.email, form.senha)
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.usuario))
            router.visit('/recepcao/agendamento')
        } catch (err) {
            setErro(err.mensagemAmigavel || 'E-mail ou senha incorretos.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout etiqueta="Acesso ao sistema">
            <Head title="Login" />

            <h1 className="text-2xl font-semibold text-slate-800 mb-1">Bem-vindo(a)</h1>
            <p className="text-sm text-slate-400 mb-7">Entre com suas credenciais para continuar.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
                    <input
                        type="email"
                        required
                        autoFocus
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="seu@email.com"
                        className="input"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Senha</label>
                    <input
                        type="password"
                        required
                        value={form.senha}
                        onChange={(e) => setForm({ ...form, senha: e.target.value })}
                        placeholder="••••••••"
                        className="input"
                    />
                </div>

                {erro && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {erro}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                >
                    {loading
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : 'Entrar'
                    }
                </button>
            </form>
        </AuthLayout>
    )
}
