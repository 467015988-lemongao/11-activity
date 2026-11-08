<template>
  <el-container class="layout">
    <el-aside width="210px" class="aside">
      <div class="logo">双十一活动管理</div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#7f1010"
        text-color="#f3d9d9"
        active-text-color="#ffd98a"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon><span>统计看板</span>
        </el-menu-item>
        <el-menu-item index="/signups">
          <el-icon><Tickets /></el-icon><span>名单管理</span>
        </el-menu-item>
        <el-menu-item index="/config">
          <el-icon><Setting /></el-icon><span>活动配置</span>
        </el-menu-item>
        <el-menu-item index="/redeem">
          <el-icon><CircleCheck /></el-icon><span>到店核销</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span>管理员：{{ auth.admin?.username || '-' }}</span>
        <el-button link type="primary" @click="logout">退出登录</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { DataLine, Tickets, Setting, CircleCheck } from '@element-plus/icons-vue'
import { useAdminAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAdminAuthStore()

function logout() {
  auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
.layout { height: 100vh; }
.aside {
  background: #7f1010;
  color: #fff;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #ffd98a;
  letter-spacing: 1px;
}
.aside :deep(.el-menu) { border-right: none; }
.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}
</style>
