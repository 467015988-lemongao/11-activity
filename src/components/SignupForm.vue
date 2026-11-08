<template>
  <div class="section" id="signup">
    <div class="section-title">立即报名 · 锁定优惠</div>

    <div v-if="mySignup" class="success-box">
      <div class="success-icon">🎉</div>
      <div class="success-title">您已报名成功</div>
      <div class="voucher">
        <div class="voucher-row"><span>报名 ID</span><b>#{{ mySignup.id }}</b></div>
        <div class="voucher-row">
          <span>优惠档位</span><b>满{{ mySignup.threshold }}送{{ mySignup.bonus }}</b>
        </div>
        <div class="voucher-row"><span>核销手机号</span><b>{{ mySignup.contact_phone }}</b></div>
        <div class="voucher-row"><span>报名时间</span><b>{{ formatDateTime(mySignup.created_at) }}</b></div>
        <div class="voucher-row">
          <span>状态</span>
          <b :class="mySignup.status === 'redeemed' ? 'status-done' : 'status-pending'">
            {{ mySignup.status === 'redeemed' ? '已核销' : '待核销' }}
          </b>
        </div>
      </div>
      <router-link class="again-btn" to="/my">查看我的报名</router-link>
    </div>

    <form v-else class="form" @submit.prevent="submit">
      <div class="form-item">
        <label class="label">联系人姓名</label>
        <input v-model.trim="form.contact_name" class="input" type="text" maxlength="20" placeholder="请输入您的姓名">
        <div v-if="errors.contact_name" class="error">{{ errors.contact_name }}</div>
      </div>

      <div class="form-item">
        <label class="label">核销手机号</label>
        <input
          v-model.trim="form.contact_phone"
          class="input"
          type="tel"
          maxlength="11"
          placeholder="请输入 11 位手机号"
          @input="form.contact_phone = form.contact_phone.replace(/\D/g, '')"
        >
        <div v-if="errors.contact_phone" class="error">{{ errors.contact_phone }}</div>
      </div>

      <div v-if="serverError" class="server-error">{{ serverError }}</div>

      <button class="submit-btn" type="submit" :disabled="submitting || activityEnded">
        {{ submitLabel }}
      </button>
      <p class="agree-tip">报名即表示同意活动规则，手机号仅用于本次活动核销</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import request from '../utils/request'
import { formatDateTime } from '../utils/format'

const props = defineProps({
  tierId: { type: Number, default: null },
  activityEnded: { type: Boolean, default: false },
  mySignup: { type: Object, default: null },
  isLoggedIn: { type: Boolean, default: false }
})
const emit = defineEmits(['success', 'require-auth'])

const form = reactive({ contact_name: '', contact_phone: '' })
const errors = reactive({ contact_name: '', contact_phone: '' })
const submitting = ref(false)
const serverError = ref('')

const submitLabel = computed(() => {
  if (props.activityEnded) return '活动已结束'
  if (submitting.value) return '提交中...'
  return '立即报名'
})

function validate() {
  errors.contact_name = form.contact_name ? '' : '请输入联系人姓名'
  errors.contact_phone = /^1[3-9]\d{9}$/.test(form.contact_phone) ? '' : '请输入正确的 11 位手机号'
  return !errors.contact_name && !errors.contact_phone
}

async function submit() {
  serverError.value = ''
  if (!props.tierId) {
    serverError.value = '请先选择优惠档位'
    return
  }
  if (!validate()) return
  // 提交中禁用按钮防重复点击，服务端唯一索引兜底并发重复（AC-6/8）。
  submitting.value = true
  try {
    const { signup } = await request('/signups', {
      method: 'POST',
      body: {
        tier_id: props.tierId,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone
      }
    })
    emit('success', signup)
  } catch (err) {
    if (err.details) {
      if (err.details.contact_name) errors.contact_name = err.details.contact_name
      if (err.details.contact_phone) errors.contact_phone = err.details.contact_phone
    }
    serverError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-item { margin-bottom: 16px; }
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
}
.input:focus { border-color: #d05a4e; }
.input::placeholder { color: #c9b8a3; }
.error { margin-top: 6px; font-size: 12px; color: #d0342c; }
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
}
.submit-btn:disabled { opacity: .6; }
.agree-tip {
  margin-top: 12px;
  text-align: center;
  font-size: 11px;
  color: #b39b83;
}
.success-box { text-align: center; padding: 8px 0 6px; }
.success-icon { font-size: 52px; }
.success-title {
  margin-top: 10px;
  font-size: 21px;
  font-weight: 800;
  color: #b91c1c;
}
.voucher {
  margin-top: 14px;
  background: #fff;
  border: 1px dashed #e0a98f;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
}
.voucher-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #8a6a4f;
  line-height: 2.1;
}
.voucher-row b { color: #5c2a17; font-weight: 700; }
.status-pending { color: #c77716; }
.status-done { color: #1f8a4c; }
.again-btn {
  display: inline-block;
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
