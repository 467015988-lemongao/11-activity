<template>
  <div>
    <h3 class="page-title">到店核销</h3>
    <el-card shadow="never" class="search-card">
      <el-radio-group v-model="searchType" class="type-group">
        <el-radio-button value="phone">按手机号</el-radio-button>
        <el-radio-button value="id">按报名 ID</el-radio-button>
      </el-radio-group>
      <el-input
        v-model="keyword"
        class="keyword"
        :placeholder="searchType === 'phone' ? '请输入报名预留的 11 位手机号' : '请输入报名 ID'"
        clearable
        @keyup.enter="search"
      />
      <el-button type="danger" :loading="searching" @click="search">查询报名</el-button>
    </el-card>

    <el-card v-if="record" shadow="never" class="result-card">
      <el-descriptions title="报名信息确认" :column="1" border>
        <el-descriptions-item label="报名 ID">#{{ record.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ record.username }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ record.contact_name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ record.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="优惠档位">
          满{{ record.tier.threshold }}送{{ record.tier.bonus }}
        </el-descriptions-item>
        <el-descriptions-item label="报名时间">{{ record.created_at }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="record.status === 'redeemed' ? 'success' : 'warning'">
            {{ record.status === 'redeemed' ? '已核销' : '待核销' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="record.redeemed_at" label="核销时间">
          {{ record.redeemed_at }}（操作人：{{ record.redeemed_by_name || '-' }}）
        </el-descriptions-item>
      </el-descriptions>
      <div class="action">
        <el-button
          type="danger"
          size="large"
          :disabled="record.status === 'redeemed'"
          :loading="redeeming"
          @click="confirmRedeem"
        >确认核销</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const searchType = ref('phone')
const keyword = ref('')
const searching = ref(false)
const redeeming = ref(false)
const record = ref(null)

async function search() {
  record.value = null
  const kw = keyword.value.trim()
  if (!kw) {
    ElMessage.warning('请输入查询内容')
    return
  }
  searching.value = true
  try {
    if (searchType.value === 'phone') {
      if (!/^1[3-9]\d{9}$/.test(kw)) {
        ElMessage.warning('请输入正确的 11 位手机号')
        return
      }
      const data = await request(`/admin/signups?phone=${encodeURIComponent(kw)}`)
      if (!data.total) {
        ElMessage.error('未找到对应的报名记录')
        return
      }
      record.value = data.list[0]
    } else {
      const id = Number(kw)
      if (!Number.isInteger(id) || id <= 0) {
        ElMessage.warning('报名 ID 必须为正整数')
        return
      }
      record.value = await request(`/admin/signups/${id}`)
    }
    if (record.value.status === 'redeemed') {
      ElMessage.warning('该报名记录已核销，请勿重复核销')
    }
  } catch (err) {
    // SIGNUP_NOT_FOUND 等服务端错误码直接透传中文提示（AC-12）。
    ElMessage.error(err.message)
  } finally {
    searching.value = false
  }
}

async function confirmRedeem() {
  try {
    await ElMessageBox.confirm(
      `确认核销 #${record.value.id}（${record.value.contact_name} / ${record.value.contact_phone}）？`,
      '核销确认',
      { confirmButtonText: '确认核销', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  redeeming.value = true
  try {
    const body =
      searchType.value === 'phone'
        ? { phone: keyword.value.trim() }
        : { signup_id: record.value.id }
    const { signup } = await request('/admin/redeem', { method: 'POST', body })
    record.value = { ...record.value, ...signup }
    ElMessage.success('核销成功')
  } catch (err) {
    if (err.code === 'ALREADY_REDEEMED') {
      ElMessage.error('该报名记录已核销，请勿重复核销')
      await search()
    } else {
      ElMessage.error(err.message)
    }
  } finally {
    redeeming.value = false
  }
}
</script>

<style scoped>
.page-title { margin-bottom: 16px; color: #7f1010; }
.search-card {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 760px;
}
.type-group { flex-shrink: 0; }
.keyword { width: 320px; }
.result-card { margin-top: 18px; max-width: 760px; }
.action { margin-top: 18px; text-align: center; }
</style>
