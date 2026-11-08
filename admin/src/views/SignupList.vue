<template>
  <div>
    <h3 class="page-title">名单管理</h3>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="手机号">
          <el-input v-model="filters.phone" placeholder="精确匹配" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="档位">
          <el-select v-model="filters.tier_id" placeholder="全部档位" clearable style="width: 160px">
            <el-option
              v-for="t in tierOptions"
              :key="t.id"
              :label="`满${t.threshold}送${t.bonus}`"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="待核销" value="pending" />
            <el-option label="已核销" value="redeemed" />
          </el-select>
        </el-form-item>
        <el-form-item label="报名时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="search">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="warning" :loading="exporting" @click="exportCsv">导出 CSV</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="报名ID" width="90" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="contact_name" label="联系人" width="110" />
        <el-table-column prop="contact_phone" label="手机号" width="130" />
        <el-table-column label="档位" min-width="130">
          <template #default="{ row }">满{{ row.tier.threshold }}送{{ row.tier.bonus }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'redeemed' ? 'success' : 'warning'">
              {{ row.status === 'redeemed' ? '已核销' : '待核销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="报名时间" min-width="180" />
        <el-table-column prop="redeemed_at" label="核销时间" min-width="180">
          <template #default="{ row }">{{ row.redeemed_at || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, sizes, prev, pager, next"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </el-card>

    <el-drawer v-model="detailVisible" title="报名详情" size="380px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="报名ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detail.contact_name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="档位">满{{ detail.tier.threshold }}送{{ detail.tier.bonus }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ detail.status === 'redeemed' ? '已核销' : '待核销' }}
        </el-descriptions-item>
        <el-descriptions-item label="报名时间">{{ detail.created_at }}</el-descriptions-item>
        <el-descriptions-item label="核销时间">{{ detail.redeemed_at || '—' }}</el-descriptions-item>
        <el-descriptions-item label="核销操作人">{{ detail.redeemed_by_name || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const exporting = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const tierOptions = ref([])
const dateRange = ref(null)
const filters = reactive({ phone: '', tier_id: null, status: '' })

const detailVisible = ref(false)
const detail = ref(null)

function buildQuery(extra = {}) {
  const params = new URLSearchParams()
  if (filters.phone) params.set('phone', filters.phone.trim())
  if (filters.tier_id) params.set('tier_id', filters.tier_id)
  if (filters.status) params.set('status', filters.status)
  if (dateRange.value?.length === 2) {
    params.set('start', new Date(dateRange.value[0]).toISOString())
    params.set('end', new Date(dateRange.value[1]).toISOString())
  }
  Object.entries(extra).forEach(([k, v]) => v != null && params.set(k, v))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function loadTiers() {
  const config = await request('/admin/config')
  tierOptions.value = config.tiers
}

async function loadList() {
  loading.value = true
  try {
    const data = await request(
      `/admin/signups${buildQuery({ page: page.value, page_size: pageSize.value })}`
    )
    list.value = data.list
    total.value = data.total
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadList()
}

function resetFilters() {
  filters.phone = ''
  filters.tier_id = null
  filters.status = ''
  dateRange.value = null
  page.value = 1
  loadList()
}

function onPageChange(p) {
  page.value = p
  loadList()
}

function onSizeChange(size) {
  pageSize.value = size
  page.value = 1
  loadList()
}

// 导出内容严格等于当前筛选条件，Blob 下载（AC-10）。
async function exportCsv() {
  exporting.value = true
  try {
    const token = localStorage.getItem('double11_admin_token')
    const res = await fetch(`/api/admin/signups/export${buildQuery()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('导出失败，请稍后重试')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'signups.csv'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    exporting.value = false
  }
}

async function openDetail(id) {
  try {
    detail.value = await request(`/admin/signups/${id}`)
    detailVisible.value = true
  } catch (err) {
    ElMessage.error(err.message)
  }
}

onMounted(async () => {
  await loadTiers()
  await loadList()
})
</script>

<style scoped>
.page-title { margin-bottom: 16px; color: #7f1010; }
.filter-card { margin-bottom: 16px; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
