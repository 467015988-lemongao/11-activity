<template>
  <div class="section" id="signup">
    <div class="section-title">立即报名 · 锁定优惠</div>

    <div v-if="success" class="success-box">
      <div class="success-icon">🎉</div>
      <div class="success-title">报名成功！</div>
      <div class="success-desc">
        您已成功报名「{{ successLabel }}」活动<br>凭报名手机号到店即可参与
      </div>
      <button class="again-btn" @click="reset">再帮朋友报一个</button>
    </div>

    <form v-else class="form" @submit.prevent="submit">
      <div class="form-item">
        <label class="label">姓名</label>
        <input
          v-model.trim="form.name"
          class="input"
          type="text"
          maxlength="20"
          placeholder="请输入您的姓名"
        >
        <div v-if="errors.name" class="error">{{ errors.name }}</div>
      </div>

      <div class="form-item">
        <label class="label">手机号</label>
        <input
          v-model.trim="form.phone"
          class="input"
          type="tel"
          maxlength="11"
          placeholder="请输入11位手机号"
          @input="form.phone = form.phone.replace(/\D/g, '')"
        >
        <div v-if="errors.phone" class="error">{{ errors.phone }}</div>
      </div>

      <div class="form-item">
        <label class="label">省份</label>
        <select v-model="form.province" class="input select">
          <option value="" disabled>请选择省份</option>
          <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
        </select>
        <div v-if="errors.province" class="error">{{ errors.province }}</div>
      </div>

      <div class="form-item">
        <label class="label">活动档位</label>
        <div class="type-group">
          <div
            v-for="t in typeOptions"
            :key="t.id"
            class="type-item"
            :class="{ active: form.activityType === t.id }"
            @click="form.activityType = t.id"
          >{{ t.label }}</div>
        </div>
        <div v-if="errors.activityType" class="error">{{ errors.activityType }}</div>
      </div>

      <div v-if="serverError" class="server-error">{{ serverError }}</div>

      <button class="submit-btn" type="submit" :disabled="submitting">
        {{ submitting ? '提交中...' : '立即报名' }}
      </button>
      <p class="agree-tip">报名即表示同意活动规则，手机号仅用于本次活动核销</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  activityType: { type: String, required: true }
})

const typeOptions = [
  { id: 'A200', label: '满200送50' },
  { id: 'A300', label: '满300送100' }
]

const provinces = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆',
  '香港', '澳门', '台湾'
]

const form = reactive({
  name: '',
  phone: '',
  province: '',
  activityType: props.activityType
})

watch(() => props.activityType, v => {
  if (!success.value) form.activityType = v
})

const errors = reactive({ name: '', phone: '', province: '', activityType: '' })
const submitting = ref(false)
const serverError = ref('')
const success = ref(false)
const successLabel = ref('')

function validate() {
  errors.name = form.name ? '' : '请输入姓名'
  errors.phone = /^1[3-9]\d{9}$/.test(form.phone) ? '' : '请输入正确的11位手机号'
  errors.province = provinces.includes(form.province) ? '' : '请选择省份'
  errors.activityType = ['A200', 'A300'].includes(form.activityType) ? '' : '请选择活动档位'
  return !errors.name && !errors.phone && !errors.province && !errors.activityType
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        province: form.province,
        activityType: form.activityType
      })
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      successLabel.value = typeOptions.find(t => t.id === form.activityType)?.label || ''
      success.value = true
    } else if (data.errors) {
      if (data.errors.name) errors.name = data.errors.name
      if (data.errors.phone) errors.phone = data.errors.phone
      if (data.errors.province) errors.province = data.errors.province
      if (data.errors.activityType) errors.activityType = data.errors.activityType
    } else {
      serverError.value = data.message || '报名失败，请稍后重试'
    }
  } catch {
    serverError.value = '网络异常，请检查网络后重试'
  } finally {
    submitting.value = false
  }
}

function reset() {
  form.name = ''
  form.phone = ''
  success.value = false
}
</script>

<style scoped>
.form-item {
  margin-bottom: 16px;
}

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
  color: #3d1d0d;
  outline: none;
  transition: border-color .15s;
}

.input:focus {
  border-color: #d05a4e;
}

.input::placeholder {
  color: #c9b8a3;
}

.select {
  appearance: none;
  padding-right: 36px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23b39b83' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-color: #fff;
}

.select:invalid {
  color: #c9b8a3;
}

.error {
  margin-top: 6px;
  font-size: 12px;
  color: #d0342c;
}

.type-group {
  display: flex;
  gap: 12px;
}

.type-item {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #e8d5bd;
  border-radius: 10px;
  background: #fff;
  font-size: 15px;
  font-weight: 600;
  color: #8a6a4f;
  transition: all .15s;
}

.type-item.active {
  border-color: #b91c1c;
  background: #fdeeed;
  color: #b91c1c;
}

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
  box-shadow: 0 6px 16px rgba(185, 28, 28, .35);
  transition: transform .15s, opacity .15s;
}

.submit-btn:active {
  transform: scale(.98);
}

.submit-btn:disabled {
  opacity: .6;
}

.agree-tip {
  margin-top: 12px;
  text-align: center;
  font-size: 11px;
  color: #b39b83;
}

.success-box {
  text-align: center;
  padding: 18px 0 6px;
}

.success-icon {
  font-size: 52px;
}

.success-title {
  margin-top: 10px;
  font-size: 21px;
  font-weight: 800;
  color: #b91c1c;
}

.success-desc {
  margin-top: 10px;
  font-size: 14px;
  color: #8a6a4f;
  line-height: 1.7;
}

.again-btn {
  margin-top: 18px;
  padding: 10px 32px;
  border-radius: 22px;
  background: #fff;
  border: 1.5px solid #b91c1c;
  color: #b91c1c;
  font-size: 14px;
  font-weight: 600;
}
</style>
