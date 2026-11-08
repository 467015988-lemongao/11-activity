<template>
  <div class="hero">
    <div class="lanterns">
      <div class="lantern left">🏮</div>
      <div class="lantern right">🏮</div>
    </div>
    <div class="hero-content">
      <div class="year-badge">2027</div>
      <h1 class="title">元旦狂欢·满减豪礼</h1>
      <p class="subtitle">消费满200送50 · 满300送100</p>
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

const TARGET = new Date('2027-01-01T00:00:00+08:00').getTime()
const END = new Date('2027-01-04T00:00:00+08:00').getTime()

const now = ref(Date.now())
let timer = null

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => clearInterval(timer))

const remain = computed(() => Math.max(0, TARGET - now.value))

const days = computed(() => String(Math.floor(remain.value / 86400000)).padStart(2, '0'))
const hours = computed(() => String(Math.floor(remain.value / 3600000) % 24).padStart(2, '0'))
const minutes = computed(() => String(Math.floor(remain.value / 60000) % 60).padStart(2, '0'))
const seconds = computed(() => String(Math.floor(remain.value / 1000) % 60).padStart(2, '0'))

const countdownTip = computed(() => {
  if (now.value >= END) return '活动已结束，感谢参与'
  if (now.value >= TARGET) return '活动进行中，先报名先享优惠'
  return '距离活动开始'
})
</script>

<style scoped>
.hero {
  position: relative;
  padding: 56px 20px 40px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0, #d92c2c 0%, transparent 60%),
    repeating-linear-gradient(45deg, rgba(255, 215, 130, 0.05) 0 12px, transparent 12px 24px);
  overflow: hidden;
}

.lanterns .lantern {
  position: absolute;
  top: -8px;
  font-size: 44px;
  animation: sway 3s ease-in-out infinite;
  transform-origin: top center;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,.3));
}
.lanterns .left { left: 12px; }
.lanterns .right { right: 12px; animation-delay: 1.5s; }

@keyframes sway {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}

.year-badge {
  display: inline-block;
  font-size: 15px;
  font-weight: 700;
  color: #fff5e0;
  background: linear-gradient(135deg, #b91c1c, #7f1010);
  border: 1px solid rgba(255, 215, 130, .6);
  padding: 5px 16px;
  border-radius: 999px;
  letter-spacing: 4px;
  margin-bottom: 14px;
}

.title {
  font-size: 34px;
  font-weight: 800;
  color: #ffe9b8;
  text-shadow: 0 2px 0 #7f1010, 0 4px 12px rgba(0, 0, 0, .35);
  letter-spacing: 3px;
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
