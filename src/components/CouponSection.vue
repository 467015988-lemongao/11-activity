<template>
  <div class="section">
    <div class="section-title">元旦豪礼 · 两档优惠</div>
    <div class="coupons">
      <div
        v-for="item in coupons"
        :key="item.id"
        class="coupon"
        :class="{ active: selected === item.id }"
        @click="selected = item.id"
      >
        <div class="coupon-left">
          <div class="bonus"><span class="rmb">¥</span>{{ item.bonus }}</div>
          <div class="bonus-label">无门槛消费券</div>
        </div>
        <div class="coupon-right">
          <div class="threshold">满 {{ item.threshold }} 可用</div>
          <div class="coupon-btn">{{ selected === item.id ? '已选择' : '点击选择' }}</div>
        </div>
        <div class="check" v-if="selected === item.id">✓</div>
      </div>
    </div>
    <p class="tip">报名时选择意向档位，名额有限，先报先得</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selected: { type: String, required: true }
})
const emit = defineEmits(['update:selected'])

const coupons = [
  { id: 'A200', threshold: 200, bonus: 50 },
  { id: 'A300', threshold: 300, bonus: 100 }
]

const selected = computed({
  get: () => props.selected,
  set: v => emit('update:selected', v)
})
</script>

<style scoped>
.coupons {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.coupon {
  position: relative;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: transform .15s, border-color .15s, box-shadow .15s;
}

.coupon:active {
  transform: scale(.98);
}

.coupon.active {
  border-color: #b91c1c;
  box-shadow: 0 4px 14px rgba(185, 28, 28, .3);
}

.coupon-left {
  width: 132px;
  background: linear-gradient(135deg, #e0453a, #b91c1c);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 8px;
  position: relative;
}

.coupon-left::after {
  content: "";
  position: absolute;
  right: -7px;
  top: 0;
  bottom: 0;
  width: 14px;
  background:
    radial-gradient(circle at 50% 0, transparent 6px, #fff9ef 6.5px) top / 14px 50% no-repeat,
    radial-gradient(circle at 50% 100%, transparent 6px, #fff9ef 6.5px) bottom / 14px 50% no-repeat;
}

.bonus {
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
}

.rmb {
  font-size: 18px;
  font-weight: 700;
  margin-right: 2px;
}

.bonus-label {
  margin-top: 6px;
  font-size: 11px;
  opacity: .9;
}

.coupon-right {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
}

.threshold {
  font-size: 17px;
  font-weight: 700;
  color: #7f2917;
}

.coupon-btn {
  font-size: 12px;
  color: #b91c1c;
  border: 1px solid #d97a6e;
  border-radius: 999px;
  padding: 3px 14px;
}

.coupon.active .coupon-btn {
  background: #b91c1c;
  color: #ffe9b8;
  border-color: #b91c1c;
}

.check {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 30px solid #b91c1c;
  border-left: 30px solid transparent;
}

.check::after {
  content: "✓";
  position: absolute;
  top: -28px;
  left: -16px;
  color: #ffe9b8;
  font-size: 14px;
  font-weight: 700;
}

.tip {
  margin-top: 14px;
  text-align: center;
  font-size: 12px;
  color: #a9826b;
}
</style>
