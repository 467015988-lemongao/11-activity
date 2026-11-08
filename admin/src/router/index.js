import { createRouter, createWebHistory } from 'vue-router'
import { useAdminAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
    {
      path: '/',
      component: () => import('../layout/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
        { path: 'signups', name: 'signups', component: () => import('../views/SignupList.vue') },
        { path: 'config', name: 'config', component: () => import('../views/Config.vue') },
        { path: 'redeem', name: 'redeem', component: () => import('../views/Redeem.vue') }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// 管理员守卫：无 token 访问业务路由一律重定向登录（AC-9）。
router.beforeEach((to) => {
  const auth = useAdminAuthStore()
  if (to.meta.requiresAdmin && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
