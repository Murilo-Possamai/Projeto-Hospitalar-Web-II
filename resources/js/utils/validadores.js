export function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((valor || '').trim())
}
