<template>
  <div>
    <h3 class="page-title">活动配置</h3>
    <el-card v-loading="loading" shadow="never">
      <el-form :model="form" label-width="110px" style="max-width: 820px">
        <el-form-item label="活动名称" required>
          <el-input v-model="form.activity.name" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="活动时间" required>
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item label="活动规则">
          <el-input
            v-model="form.activity.rules_text"
            type="textarea"
            :rows="5"
            placeholder="纯文本规则，每行一条"
          />
        </el-form-item>

        <el-form-item label="优惠档位" required>
          <div class="tier-table">
            <div v-for="(tier, index) in form.tiers" :key="index" class="tier-row">
              <el-input-number v-model="tier.threshold" :min="1" :step="10" placeholder="门槛" />
              <span class="tier-text">元送</span>
              <el-input-number v-model="tier.bonus" :min="1" :step="10" placeholder="赠送" />
              <span class="tier-text">元</span>
              <el-switch
                v-model="tier.enabled"
                active-text="启用"
                inactive-text="停用"
                inline-prompt
              />
              <el-input-number v-model="tier.sort_order" :min="0" controls-position="right" />
              <el-button type="danger" link @click="removeTier(index)">删除</el-button>
            </div>
            <el-button class="add-btn" @click="addTier">+ 新增档位</el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="danger" :loading="saving" @click="save">保存配置</el-button>
          <el-button @click="load">重置为已保存内容</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// 提交失败时保留页面编辑值并展示服务端 message（AC-11）。
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const timeRange = ref(null)
const form = reactive({
  activity: { name: '', start_time: '', end_time: '', rules_text: '' },
  tiers: []
})

async function load() {
  loading.value = true
  try {
    const data = await request('/admin/config')
    form.activity = { ...data.activity }
    form.tiers = data.tiers.map((t) => ({ ...t }))
    timeRange.value = [new Date(data.activity.start_time), new Date(data.activity.end_time)]
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    loading.value = false
  }
}

function addTier() {
  form.tiers.push({
    id: null,
    threshold: 100,
    bonus: 20,
    enabled: true,
    sort_order: form.tiers.length
  })
}

function removeTier(index) {
  form.tiers.splice(index, 1)
}

// 前端做与服务端同规则的预校验，减少无效提交。
function validate() {
  if (!form.activity.name.trim()) return '活动名称不能为空'
  if (!timeRange.value || timeRange.value.length !== 2) return '请选择活动起止时间'
  if (new Date(timeRange.value[1]) <= new Date(timeRange.value[0])) {
    return '结束时间必须晚于开始时间'
  }
  if (!form.tiers.length) return '至少保留一个优惠档位'
  if (!form.tiers.some((t) => t.enabled)) return '至少保留一个启用档位'
  for (const t of form.tiers) {
    if (!Number.isInteger(t.threshold) || !Number.isInteger(t.bonus) || t.threshold <= 0 || t.bonus <= 0) {
      return '档位门槛与赠送金额必须为正整数'
    }
  }
  return ''
}

async function save() {
  const error = validate()
  if (error) {
    ElMessage.warning(error)
    return
  }
  saving.value = true
  try {
    const body = {
      activity: {
        ...form.activity,
        start_time: new Date(timeRange.value[0]).toISOString(),
        end_time: new Date(timeRange.value[1]).toISOString()
      },
      tiers: form.tiers.map((t, index) => ({
        id: t.id,
        threshold: t.threshold,
        bonus: t.bonus,
        enabled: t.enabled ? 1 : 0,
        sort_order: t.sort_order ?? index
      }))
    }
    const saved = await request('/admin/config', { method: 'PUT', body })
    ElMessage.success('配置已保存，C 端刷新后即时生效')
    form.activity = { ...saved.activity }
    form.tiers = saved.tiers.map((t) => ({ ...t }))
    timeRange.value = [new Date(saved.activity.start_time), new Date(saved.activity.end_time)]
  } catch (err) {
    // 不覆盖编辑值，仅提示服务端返回的原因。
    ElMessage.error(err.message)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-title { margin-bottom: 16px; color: #7f1010; }
.tier-table { width: 100%; }
.tier-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.tier-text { color: #606266; font-size: 14px; }
.add-btn { margin-top: 4px; }
</style>
