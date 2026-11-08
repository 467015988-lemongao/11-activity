<template>
  <div>
    <h3 class="page-title">统计看板</h3>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">报名总量</div>
          <div class="stat-value">{{ stats.total_signups ?? '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">已核销数</div>
          <div class="stat-value green">{{ stats.total_redeemed ?? '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">核销率</div>
          <div class="stat-value orange">{{ percent(stats.redemption_rate) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="tier-card" shadow="never">
      <template #header>档位报名分布</template>
      <el-table :data="stats.by_tier || []" stripe>
        <el-table-column label="档位" min-width="160">
          <template #default="{ row }">满 {{ row.threshold }} 送 {{ row.bonus }}</template>
        </el-table-column>
        <el-table-column prop="count" label="报名人数" width="120" />
        <el-table-column label="占比" min-width="220">
          <template #default="{ row }">
            <el-progress :percentage="Math.round(row.ratio * 100)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
// 不引入额外图表库，用 Element Plus 进度条 + 表格呈现（ai_spec §5.2）。
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const stats = ref({})

function percent(value) {
  return value == null ? '-' : `${(value * 100).toFixed(1)}%`
}

onMounted(async () => {
  stats.value = await request('/admin/stats')
})
</script>

<style scoped>
.page-title { margin-bottom: 16px; color: #7f1010; }
.stat-label { font-size: 13px; color: #909399; }
.stat-value { font-size: 32px; font-weight: 800; color: #b91c1c; margin-top: 8px; }
.stat-value.green { color: #1f8a4c; }
.stat-value.orange { color: #c77716; }
.tier-card { margin-top: 16px; }
</style>
