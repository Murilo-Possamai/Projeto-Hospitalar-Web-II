import axios from 'axios'

const API_URL = import.meta.env.VITE_HOSPITAL_API_URL
    || 'https://projeto-hospitalar-web-ii-production.up.railway.app/api'

const client = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

client.interceptors.response.use(
    (res) => res,
    (err) => {
        const dados = err.response?.data || {}
        err.mensagemAmigavel =
            dados.mensagem
            || dados.message
            || (dados.erros  && Object.values(dados.erros).flat()[0])
            || (dados.errors && Object.values(dados.errors).flat()[0])
            || 'Não foi possível concluir a operação. Tente novamente.'

        err.errosPorCampo = dados.erros || dados.errors || {}
        return Promise.reject(err)
    }
)

export default client

export function extrairMensagemErro(err, fallback = 'Erro ao executar a operação.') {
    return err?.mensagemAmigavel || fallback
}
