<template>
  <footer class="footer">
    <div class="brand">{{ activityName }}</div>
    <div class="copy">活动时间：{{ formatDate(startTime) }} - {{ formatDate(endTime) }}</div>
    <div class="copy">如有疑问请联系门店工作人员</div>
  </footer>
</template>

<script setup>
import { formatDate } from '../utils/format'

defineProps({
  activityName: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
})
</script>

<style scoped>
.footer {
  text-align: center;
  padding: 24px 16px 30px;
  color: rgba(255, 217, 138, .8);
}
.brand {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.copy {
  font-size: 11px;
  line-height: 1.9;
  opacity: .8;
}
</style>
