<template>
  <div class="section">
    <div class="section-title">活动规则</div>
    <!-- 规则文案为后台配置的纯文本，按换行展示，不渲染 HTML -->
    <p class="rule-text">{{ rulesText }}</p>
  </div>
</template>

<script setup>
defineProps({
  rulesText: { type: String, default: '' }
})
</script>

<style scoped>
.rule-text {
  font-size: 13px;
  line-height: 2.1;
  color: #7a5a41;
  white-space: pre-line;
}
</style>
