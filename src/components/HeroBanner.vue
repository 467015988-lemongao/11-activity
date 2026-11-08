<template>
  <div class="hero">
    <div class="hero-content">
      <div class="festival-badge">双 11</div>
      <h1 class="title">{{ activity.name }}</h1>
      <p class="subtitle">{{ tierSummary }}</p>
      <div class="countdown">
        <div class="cd-item">
          <span class="cd-num">{{ days }}</span>
          <span class="cd-label">天</span>
        </div>
        <div class="cd-item">
          <span class="cd-num">{{ hours }}</span>
          <span class="cd-label">时</span>
        </div>
        <div class="cd-item">
          <span class="cd-num">{{ minutes }}</span>
          <span class="cd-label">分</span>
        </div>
        <div class="cd-item">
          <span class="cd-num">{{ seconds }}</span>
          <span class="cd-label">秒</span>
        </div>
      </div>
      <div class="cd-tip">{{ countdownTip }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  activity: { type: Object, required: true },
  tiers: { type: Array, default: () => [] },
  serverTime: { type: String, required: true }
})

// 以服务端时间为准校准本地时钟，倒计时只作展示；报名有效性由服务端再次校验。
const clockOffset = Date.parse(props.serverTime) - Date.now()
const now = ref(Date.now() + clockOffset)
let timer = null
onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() + clockOffset }, 1000)
})
onUnmounted(() => clearInterval(timer))

const startAt = computed(() => Date.parse(props.activity.start_time))
const endAt = computed(() => Date.parse(props.activity.end_time))
const status = computed(() => {
  if (now.value < startAt.value) return 'not_started'
  if (now.value >= endAt.value) return 'ended'
  return 'ongoing'
})

const remain = computed(() => {
  if (status.value === 'not_started') return Math.max(0, startAt.value - now.value)
  if (status.value === 'ongoing') return Math.max(0, endAt.value - now.value)
  return 0
})

const days = computed(() => String(Math.floor(remain.value / 86400000)).padStart(2, '0'))
const hours = computed(() => String(Math.floor(remain.value / 3600000) % 24).padStart(2, '0'))
const minutes = computed(() => String(Math.floor(remain.value / 60000) % 60).padStart(2, '0'))
const seconds = computed(() => String(Math.floor(remain.value / 1000) % 60).padStart(2, '0'))

const countdownTip = computed(() => {
  if (status.value === 'ended') return '活动已结束，感谢参与'
  if (status.value === 'ongoing') return '活动进行中，先报名先享优惠'
  return '距离活动开始'
})

const tierSummary = computed(() =>
  props.tiers.map((t) => `满${t.threshold}送${t.bonus}`).join(' · ')
)

defineExpose({ status })
</script>

<style scoped>
.hero {
  position: relative;
  padding: 48px 20px 40px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0, #d92c2c 0%, transparent 60%),
    repeating-linear-gradient(45deg, rgba(255, 215, 130, 0.05) 0 12px, transparent 12px 24px);
  overflow: hidden;
}

.festival-badge {
  display: inline-block;
  font-size: 15px;
  font-weight: 700;
  color: #fff5e0;
  background: linear-gradient(135deg, #b91c1c, #7f1010);
  border: 1px solid rgba(255, 215, 130, .6);
  padding: 5px 18px;
  border-radius: 999px;
  letter-spacing: 4px;
  margin-bottom: 14px;
}

.title {
  font-size: 30px;
  font-weight: 800;
  color: #ffe9b8;
  text-shadow: 0 2px 0 #7f1010, 0 4px 12px rgba(0, 0, 0, .35);
  letter-spacing: 2px;
}

.subtitle {
  margin-top: 12px;
  font-size: 16px;
  color: #ffd98a;
  letter-spacing: 1px;
}

.countdown {
  margin-top: 22px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.cd-item {
  background: rgba(63, 7, 7, 0.55);
  border: 1px solid rgba(255, 215, 130, .45);
  border-radius: 10px;
  padding: 8px 10px;
  min-width: 58px;
}

.cd-num {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #ffdf8e;
  font-variant-numeric: tabular-nums;
}

.cd-label {
  display: block;
  font-size: 11px;
  color: rgba(255, 233, 184, .75);
  margin-top: 2px;
}

.cd-tip {
  margin-top: 14px;
  font-size: 13px;
  color: rgba(255, 217, 138, .9);
  letter-spacing: 2px;
}
</style>
