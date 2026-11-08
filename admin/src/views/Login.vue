<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2 class="title">双十一活动管理后台</h2>
      <el-form :model="form" label-position="top" @submit.prevent="submit">
        <el-form-item label="管理员账号">
          <el-input v-model="form.username" placeholder="请输入管理员账号" clearable />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-button
          type="danger"
          class="login-btn"
          :loading="submitting"
          @click="submit"
        >登 录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useAdminAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAdminAuthStore()

const form = reactive({ username: '', password: '' })
const submitting = ref(false)

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  submitting.value = true
  try {
    const data = await request('/admin/login', { method: 'POST', body: { ...form } })
    auth.setAuth(data)
    ElMessage.success('登录成功')
    router.replace(route.query.redirect ? String(route.query.redirect) : '/dashboard')
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #b91c1c, #7f1010);
}
.login-card {
  width: 400px;
  padding: 12px 18px 24px;
  border-radius: 14px;
}
.title {
  text-align: center;
  color: #b91c1c;
  margin-bottom: 24px;
  font-size: 20px;
}
.login-btn { width: 100%; }
</style>
