<template>
  <div class="my-page">
    <div class="topbar">
      <router-link class="top-link" to="/">返回活动页</router-link>
      <button class="top-link" @click="logout">退出登录</button>
    </div>

    <div class="section card">
      <div class="section-title">我的报名</div>

      <div v-if="loading" class="hint">加载中...</div>

      <div v-else-if="errorMsg" class="hint">
        <p>{{ errorMsg }}</p>
        <button class="retry-btn" @click="load">重新加载</button>
      </div>

      <div v-else-if="!signup" class="hint">
        <p>您还没有报名本次活动</p>
        <router-link class="retry-btn link-btn" to="/">去报名</router-link>
      </div>

      <div v-else class="voucher">
        <div class="voucher-row"><span>报名 ID</span><b>#{{ signup.id }}</b></div>
        <div class="voucher-row">
          <span>优惠档位</span><b>满{{ signup.threshold }}送{{ signup.bonus }}</b>
        </div>
        <div class="voucher-row"><span>联系人</span><b>{{ signup.contact_name }}</b></div>
        <div class="voucher-row"><span>核销手机号</span><b>{{ signup.contact_phone }}</b></div>
        <div class="voucher-row"><span>报名时间</span><b>{{ formatDateTime(signup.created_at) }}</b></div>
        <div class="voucher-row">
          <span>核销时间</span><b>{{ signup.redeemed_at ? formatDateTime(signup.redeemed_at) : '—' }}</b>
        </div>
        <div class="voucher-row">
          <span>状态</span>
          <b :class="signup.status === 'redeemed' ? 'status-done' : 'status-pending'">
            {{ signup.status === 'redeemed' ? '已核销' : '待核销' }}
          </b>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 进入页面即刷新，核销后回到此页可看到最新状态（AC-7）。
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { useAuthStore } from '../stores/auth'
import { formatDateTime } from '../utils/format'

const router = useRouter()
const auth = useAuthStore()

const signup = ref(null)
const loading = ref(true)
const errorMsg = ref('')

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await request('/signups/me')
    signup.value = res.signup
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

function logout() {
  auth.logout()
  router.replace('/login')
}

onMounted(load)
</script>

<style scoped>
.my-page { min-height: 100vh; padding-bottom: 32px; }
.topbar {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding: 12px 16px 0;
}
.top-link {
  color: #ffe9b8;
  font-size: 13px;
  background: rgba(63, 7, 7, .45);
  border: 1px solid rgba(255, 215, 130, .4);
  border-radius: 999px;
  padding: 5px 14px;
  cursor: pointer;
}
.card { margin-top: 8px; }
.hint {
  text-align: center;
  color: #8a6a4f;
  font-size: 14px;
  padding: 24px 0;
}
.voucher {
  background: #fff;
  border: 1px dashed #e0a98f;
  border-radius: 12px;
  padding: 14px 16px;
}
.voucher-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #8a6a4f;
  line-height: 2.3;
}
.voucher-row b { color: #5c2a17; font-weight: 700; }
.status-pending { color: #c77716; }
.status-done { color: #1f8a4c; }
.retry-btn {
  margin-top: 16px;
  padding: 10px 32px;
  border-radius: 22px;
  background: linear-gradient(135deg, #e0453a, #b91c1c);
  color: #ffe9b8;
  font-size: 14px;
  font-weight: 600;
}
.link-btn { display: inline-block; }
</style>
