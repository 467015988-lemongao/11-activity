<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-title">注册账号</div>
      <form @submit.prevent="submit">
        <div class="form-item">
          <label class="label">用户名</label>
          <input v-model.trim="form.username" class="input" maxlength="20" placeholder="4-20 位字母、数字或下划线">
          <div v-if="errors.username" class="error">{{ errors.username }}</div>
        </div>
        <div class="form-item">
          <label class="label">密码</label>
          <input v-model="form.password" class="input" type="password" maxlength="32" placeholder="8-32 位密码">
          <div v-if="errors.password" class="error">{{ errors.password }}</div>
        </div>
        <div class="form-item">
          <label class="label">确认密码</label>
          <input v-model="form.confirm" class="input" type="password" maxlength="32" placeholder="再次输入密码">
          <div v-if="errors.confirm" class="error">{{ errors.confirm }}</div>
        </div>
        <div v-if="errorMsg" class="server-error">{{ errorMsg }}</div>
        <button class="submit-btn" type="submit" :disabled="submitting">
          {{ submitting ? '注册中...' : '注册并登录' }}
        </button>
      </form>
      <div class="auth-link">
        已有账号？<router-link :to="loginLink">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({ username: '', password: '', confirm: '' })
const errors = reactive({ username: '', password: '', confirm: '' })
const submitting = ref(false)
const errorMsg = ref('')

const loginLink = computed(() => ({
  name: 'login',
  query: route.query.redirect ? { redirect: route.query.redirect, tier_id: route.query.tier_id } : {}
}))

function validate() {
  errors.username = /^[A-Za-z0-9_]{4,20}$/.test(form.username) ? '' : '用户名为 4-20 位字母、数字或下划线'
  errors.password = form.password.length >= 8 && form.password.length <= 32 ? '' : '密码长度为 8-32 位'
  errors.confirm = form.confirm === form.password && form.confirm ? '' : '两次输入的密码不一致'
  return !errors.username && !errors.password && !errors.confirm
}

async function submit() {
  errorMsg.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    const data = await request('/auth/register', {
      method: 'POST',
      body: { username: form.username, password: form.password }
    })
    auth.setAuth(data)
    router.replace(route.query.redirect ? String(route.query.redirect) : '/')
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 36px 20px;
}
.auth-card {
  background: #fff9ef;
  border-radius: 16px;
  padding: 28px 22px;
  box-shadow: 0 6px 18px rgba(80, 8, 8, .25);
}
.auth-title {
  font-size: 22px;
  font-weight: 800;
  color: #b91c1c;
  text-align: center;
  margin-bottom: 22px;
  letter-spacing: 2px;
}
.form-item { margin-bottom: 16px; }
.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #7f2917;
  margin-bottom: 8px;
}
.input {
  width: 100%;
  height: 46px;
  border: 1.5px solid #e8d5bd;
  border-radius: 10px;
  background: #fff;
  padding: 0 14px;
  font-size: 15px;
  outline: none;
}
.input:focus { border-color: #d05a4e; }
.error { margin-top: 6px; font-size: 12px; color: #d0342c; }
.server-error {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #fdecec;
  border: 1px solid #f5b5b0;
  border-radius: 8px;
  font-size: 13px;
  color: #c0261f;
}
.submit-btn {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  background: linear-gradient(135deg, #e0453a, #b91c1c);
  color: #ffe9b8;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 4px;
}
.submit-btn:disabled { opacity: .6; }
.auth-link {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: #8a6a4f;
}
.auth-link a { color: #b91c1c; font-weight: 600; }
</style>
