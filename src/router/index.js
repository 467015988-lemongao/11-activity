import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/Home.vue') },
    { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
    { path: '/register', name: 'register', component: () => import('../views/Register.vue') },
    {
      path: '/my',
      name: 'my-signup',
      component: () => import('../views/MySignup.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

// 登录守卫：未登录访问受保护路由跳登录，携带 redirect 与所选档位（AC-3）。
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    const query = { redirect: to.fullPath }
    if (to.query.tier_id) query.tier_id = to.query.tier_id
    return { name: 'login', query }
  }
  return true
})

export default router
