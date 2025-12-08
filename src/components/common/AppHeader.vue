<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import ExportButton from './ExportButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

// 用户信息
const userId = computed(() => authStore.user?.id || '')
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 头像相关
const avatarUrl = computed(() => profileStore.displayAvatarUrl)
const hasAvatar = computed(() => profileStore.hasAvatar)

// 加载用户资料
onMounted(async () => {
  if (isAuthenticated.value && userId.value) {
    await profileStore.loadProfile(userId.value)
  }
})

// 跳转到个人中心
function navigateToProfile() {
  router.push('/profile')
}

interface NavItem {
  path: string
  name: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/dashboard', name: 'dashboard', label: '首页', icon: '🏠' },
  { path: '/home', name: 'home', label: '今日', icon: '📝' },
  { path: '/pomodoro', name: 'pomodoro', label: '专注', icon: '🍅' },
  { path: '/journals', name: 'journals', label: '日记本', icon: '📖' },
  { path: '/archive', name: 'archive', label: '归档', icon: '📚' },
  { path: '/stats', name: 'stats', label: '统计', icon: '📊' }
]

const currentRouteName = computed(() => route.name as string)

const navigateTo = (path: string) => {
  router.push(path)
}

const isActive = (name: string) => {
  return currentRouteName.value === name
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo" @click="navigateTo('/dashboard')">
        <div class="logo-icon-wrapper">
          <span class="logo-icon">📓</span>
        </div>
        <span class="logo-text">行动手账</span>
      </div>

      <nav class="nav-links">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="nav-link"
          :class="{ active: isActive(item.name) }"
          @click="navigateTo(item.path)"
          :aria-current="isActive(item.name) ? 'page' : undefined"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <div class="active-indicator" v-if="isActive(item.name)"></div>
        </button>
      </nav>

      <div class="header-actions">
        <ExportButton />
        <ThemeToggle />
        
        <!-- 用户头像 - 点击跳转到个人中心 -->
        <div v-if="isAuthenticated" class="user-section">
          <button 
            class="avatar-btn" 
            @click="navigateToProfile"
            aria-label="个人中心"
          >
            <img 
              v-if="hasAvatar && avatarUrl" 
              :src="avatarUrl" 
              alt="用户头像"
              class="avatar-image"
            />
            <span v-else class="avatar-placeholder">👤</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  @include glass-effect(0.8, 20px);
  border-bottom: 1px solid var(--glass-border);
  transition: all var(--transition-normal);
}

.header-content {
  @include flex-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-page);
  height: 64px;
  
  @include until-sm {
    height: 56px;
    padding: 0 var(--spacing-md);
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;

  .logo-icon-wrapper {
    width: 36px;
    height: 36px;
    @include flex-center;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-bounce);
  }

  .logo-icon {
    font-size: 20px;
  }

  .logo-text {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    letter-spacing: -0.5px;
    
    @include until-sm {
      display: none;
    }
  }

  &:hover .logo-icon-wrapper {
    transform: rotate(-10deg) scale(1.1);
  }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-inner);
  border: 1px solid var(--border-color-light);
  
  @include until-sm {
    gap: 0;
    background: transparent;
    box-shadow: none;
    border: none;
    padding: 0;
  }
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-normal);
  overflow: hidden;
  border: none;
  background: transparent;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }

  &.active {
    color: var(--color-primary);
    background-color: var(--bg-primary);
    box-shadow: var(--shadow-sm);
    font-weight: var(--font-weight-semibold);
  }

  .nav-icon {
    font-size: 1.1em;
  }
  
  @include until-sm {
    padding: 8px;
    background: transparent !important;
    box-shadow: none !important;
    
    .nav-label {
      display: none;
    }

    .nav-icon {
      font-size: 1.4em;
    }

    &.active {
      color: var(--color-primary);
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--color-primary);
      }
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

// 用户区域样式
.user-section {
  display: flex;
  align-items: center;
  padding-left: var(--spacing-sm);
  border-left: 1px solid var(--border-color-light);
  margin-left: var(--spacing-xs);
  
  @include until-sm {
    padding-left: var(--spacing-xs);
    margin-left: 0;
    border-left: none;
  }
}

.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border-color-light);
  background: var(--bg-secondary);
  cursor: pointer;
  overflow: hidden;
  @include flex-center;
  transition: all var(--transition-normal);
  padding: 0;

  &:hover {
    border-color: var(--color-primary);
    transform: scale(1.05);
  }

  &:focus {
    @include focus-ring;
  }
  
  @include until-sm {
    width: 32px;
    height: 32px;
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 18px;
  opacity: 0.8;
  
  @include until-sm {
    font-size: 16px;
  }
}
</style>
