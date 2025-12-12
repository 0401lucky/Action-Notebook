<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { AppHeader, LoadingSpinner } from '@/components/common'
import { useSettingsStore } from '@/stores/settings'
import { initializeAuth } from '@/router'

const settingsStore = useSettingsStore()
const route = useRoute()

// 认证初始化状态
const isAuthInitialized = ref(false)

// 是否显示 Header（登录页不显示）
const showHeader = computed(() => route.name !== 'login')

// 是否显示加载状态（认证初始化中）
const showLoading = computed(() => !isAuthInitialized.value)

/**
 * 初始化应用
 * 
 * 认证初始化已移至路由守卫中统一处理，确保：
 * - 3.1: 应用启动时自动恢复会话
 * - 3.2: 会话过期时自动刷新令牌
 * - 3.3: 令牌刷新失败时重定向到登录页
   * - 认证回调处理
   */
onMounted(async () => {
  // 加载设置
  settingsStore.loadSettings()
  
  // 初始化认证状态（与路由守卫共享同一个 Promise）
  await initializeAuth()
  isAuthInitialized.value = true
})

// 监听路由变化，确保在路由完成后更新初始化状态
watch(() => route.name, () => {
  if (!isAuthInitialized.value) {
    isAuthInitialized.value = true
  }
}, { immediate: true })
</script>

<template>
  <div id="app">
    <div class="bg-decoration"></div>
    
    <!-- 认证初始化加载状态 -->
    <div v-if="showLoading" class="auth-loading">
      <LoadingSpinner size="md" />
      <p class="loading-text">加载中...</p>
    </div>
    
    <!-- 主应用内容 -->
    <template v-else>
      <AppHeader v-if="showHeader" />
      <main class="main-content">
        <RouterView v-slot="{ Component }">
          <transition name="page-fade-up" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </template>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

#app {
  min-height: 100vh;
  @include flex-column;
  position: relative;
  overflow-x: hidden;
}

.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    animation: float 20s infinite ease-in-out;
  }
  
  &::before {
    top: -10%;
    left: -10%;
    width: 50vw;
    height: 50vw;
    background: radial-gradient(circle, var(--color-primary-light), transparent 70%);
    animation-delay: 0s;
  }
  
  &::after {
    bottom: -10%;
    right: -10%;
    width: 60vw;
    height: 60vw;
    background: radial-gradient(circle, var(--color-accent-light), transparent 70%);
    animation-delay: -10s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(5%, 5%); }
  50% { transform: translate(0, 10%); }
  75% { transform: translate(-5%, 5%); }
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: var(--spacing-page);
  position: relative;
  z-index: 1;

  @include until-md {
    padding: var(--spacing-md);
  }
}

// 认证初始化加载状态
.auth-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  @include flex-column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  z-index: 1000;
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
}
</style>
