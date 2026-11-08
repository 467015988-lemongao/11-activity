import { defineStore } from 'pinia'
import request from '../utils/request'

// C 端登录态：token 与当前用户持久化到 localStorage，刷新不丢。
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('double11_token') || '',
    user: JSON.parse(localStorage.getItem('double11_user') || 'null')
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token)
  },
  actions: {
    setAuth({ token, user }) {
      this.token = token
      this.user = user
      localStorage.setItem('double11_token', token)
      localStorage.setItem('double11_user', JSON.stringify(user))
    },
    async fetchMe() {
      const { user } = await request('/auth/me')
      this.user = user
      localStorage.setItem('double11_user', JSON.stringify(user))
      return user
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('double11_token')
      localStorage.removeItem('double11_user')
    }
  }
})
