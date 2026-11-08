import { defineStore } from 'pinia'

// 管理员登录态，单角色全权限（A2），不做菜单/按钮级分级。
export const useAdminAuthStore = defineStore('admin-auth', {
  state: () => ({
    token: localStorage.getItem('double11_admin_token') || '',
    admin: JSON.parse(localStorage.getItem('double11_admin') || 'null')
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token)
  },
  actions: {
    setAuth({ token, admin }) {
      this.token = token
      this.admin = admin
      localStorage.setItem('double11_admin_token', token)
      localStorage.setItem('double11_admin', JSON.stringify(admin))
    },
    logout() {
      this.token = ''
      this.admin = null
      localStorage.removeItem('double11_admin_token')
      localStorage.removeItem('double11_admin')
    }
  }
})
