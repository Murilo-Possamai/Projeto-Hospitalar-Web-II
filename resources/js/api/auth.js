import client from './client'

export const authApi = {
    login:  (email, senha) => client.post('/auth/login', { email, senha }),
    logout: ()             => client.post('/auth/logout'),
    me:     ()             => client.get('/auth/me'),
}
