<template>
  <div class="page">
    <HeroBanner />
    <CouponSection v-model:selected="selectedType" />
    <SignupForm :activity-type="selectedType" />
    <RuleSection />
    <FooterBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HeroBanner from './components/HeroBanner.vue'
import CouponSection from './components/CouponSection.vue'
import SignupForm from './components/SignupForm.vue'
import RuleSection from './components/RuleSection.vue'
import FooterBar from './components/FooterBar.vue'

const selectedType = ref('A200')
</script>

<style scoped>
.page {
  padding-bottom: 32px;
}
</style>
