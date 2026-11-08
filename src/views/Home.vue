<template>
  <div class="page">
    <div class="topbar">
      <router-link v-if="!auth.isLoggedIn" class="top-link" to="/login">登录 / 注册</router-link>
      <template v-else>
        <router-link class="top-link" to="/my">我的报名</router-link>
        <button class="top-link logout" @click="logout">退出</button>
      </template>
    </div>

    <div v-if="loadError" class="load-error">
      <p>{{ loadError }}</p>
      <button class="retry-btn" @click="loadAll">重新加载</button>
    </div>

    <template v-else-if="data">
      <HeroBanner
        ref="heroRef"
        :activity="data.activity"
        :tiers="data.tiers"
        :server-time="data.server_time"
      />
      <CouponSection
        v-model="selectedTierId"
        :tiers="data.tiers"
        :disabled="activityStatus !== 'ongoing' || Boolean(mySignup)"
      />

      <div v-if="activityStatus === 'not_started'" class="section notice">活动尚未开始，开始后即可报名</div>
      <div v-else-if="activityStatus === 'ended'" class="section notice">活动已结束，报名通道已关闭</div>

      <SignupForm
        :tier-id="selectedTierId"
        :activity-ended="activityStatus === 'ended'"
        :my-signup="mySignup"
        :is-logged-in="auth.isLoggedIn"
        @success="onSignupSuccess"
        @require-auth="goLogin"
      />

      <RuleSection :rules-text="data.activity.rules_text" />
      <FooterBar
        :activity-name="data.activity.name"
        :start-time="data.activity.start_time"
        :end-time="data.activity.end_time"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeroBanner from '../components/HeroBanner.vue'
import CouponSection from '../components/CouponSection.vue'
import SignupForm from '../components/SignupForm.vue'
import RuleSection from '../components/RuleSection.vue'
import FooterBar from '../components/FooterBar.vue'
import request from '../utils/request'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const data = ref(null)
const loadError = ref('')
const selectedTierId = ref(null)
const mySignup = ref(null)
const heroRef = ref(null)

// 活动三态由 HeroBanner 基于服务端时间派生；初始按进行中处理，挂载后立即修正。
const activityStatus = computed(() => heroRef.value?.status || 'ongoing')

async function loadAll() {
  loadError.value = ''
  try {
    data.value = await request('/activity/public')
    if (data.value.tiers.length) {
      const fromQuery = Number(route.query.tier_id)
      selectedTierId.value = data.value.tiers.some((t) => t.id === fromQuery)
        ? fromQuery
        : data.value.tiers[0].id
    }
    if (auth.isLoggedIn) await loadMySignup()
  } catch (err) {
    loadError.value = err.message
  }
}

async function loadMySignup() {
  try {
    const res = await request('/signups/me')
    mySignup.value = res.signup
  } catch {
    mySignup.value = null
  }
}

function onSignupSuccess() {
  loadMySignup()
}

// 未登录点报名：记录回跳地址与所选档位，登录成功后回来（AC-3）。
function goLogin() {
  const query = { redirect: route.fullPath }
  if (selectedTierId.value) query.tier_id = String(selectedTierId.value)
  router.push({ name: 'login', query })
}

function logout() {
  auth.logout()
  mySignup.value = null
  router.replace('/')
}

onMounted(loadAll)
</script>

<style scoped>
.page { padding-bottom: 32px; }

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
}
.logout { cursor: pointer; }

.notice {
  text-align: center;
  color: #b3541e;
  font-size: 14px;
  font-weight: 600;
}

.load-error {
  margin: 80px 24px;
  text-align: center;
  background: #fff9ef;
  border-radius: 16px;
  padding: 32px 20px;
  color: #8a6a4f;
}
.retry-btn {
  margin-top: 16px;
  padding: 10px 32px;
  border-radius: 22px;
  background: linear-gradient(135deg, #e0453a, #b91c1c);
  color: #ffe9b8;
  font-size: 14px;
  font-weight: 600;
}
</style>
