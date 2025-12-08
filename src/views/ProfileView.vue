<script setup lang="ts">
/**
 * ProfileView - 个人中心页面（数字手帐风格）
 */
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LoadingSpinner, ConfirmDialog } from '@/components/common'
import { AvatarSticker, StatsBadge, TapeDecoration } from '@/components/profile'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import { useArchiveStore } from '@/stores/archive'
import { calculateConsecutiveDays, calculateCumulativeTaskCount } from '@/services/stats'
import { validateFile } from '@/services/avatar'
import { NICKNAME_MAX_LENGTH } from '@/services/profile'

const router = useRouter()
const profileStore = useProfileStore()
const authStore = useAuthStore()
const archiveStore = useArchiveStore()

// 状态
const isInitialLoading = ref(true)
const isUploadingAvatar = ref(false)
const avatarError = ref('')
const isEditingNickname = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')
const showConfirmDialog = ref(false)
const isSigningOut = ref(false)

// 用户信息
const userId = computed(() => authStore.user?.id || '')
const userEmail = computed(() => authStore.user?.email || '')
const displayNickname = computed(() => profileStore.displayNickname)
const hasNickname = computed(() => profileStore.hasNickname)
const avatarUrl = computed(() => profileStore.displayAvatarUrl)
const isLoading = computed(() => profileStore.isLoading)

// 格式化注册时间
const formattedCreatedAt = computed(() => {
  const profile = profileStore.profile
  if (!profile?.createdAt) return ''
  const date = new Date(profile.createdAt)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// 统计数据
const completedTasks = computed(() => {
  const records = archiveStore.records
  const { completed } = calculateCumulativeTaskCount(records)
  return completed
})

const consecutiveDays = computed(() => {
  const records = archiveStore.records
  return calculateConsecutiveDays(records)
})

const sealedRecords = computed(() => {
  return archiveStore.records.filter(r => r.isSealed).length
})

const totalTasks = computed(() => {
  const records = archiveStore.records
  const { total } = calculateCumulativeTaskCount(records)
  return total
})

const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

// 初始化
onMounted(async () => {
  try {
    if (!userId.value) {
      isInitialLoading.value = false
      return
    }
    await Promise.all([
      profileStore.loadProfile(userId.value),
      archiveStore.loadRecords()
    ])
  } catch (err) {
    console.error('加载用户资料失败:', err)
  } finally {
    isInitialLoading.value = false
  }
})

// 头像上传
async function handleAvatarUpload(file?: File) {
  if (!file) return
  if (!userId.value) {
    avatarError.value = '当前未登录，无法上传头像'
    return
  }

  avatarError.value = ''
  const validation = validateFile(file)
  if (!validation.valid) {
    avatarError.value = validation.error || '文件验证失败'
    return
  }

  isUploadingAvatar.value = true
  try {
    const success = await profileStore.updateAvatar(userId.value, file)
    if (!success) {
      avatarError.value = profileStore.error?.message || '头像上传失败'
    }
  } finally {
    isUploadingAvatar.value = false
  }
}

// 昵称编辑
function startEditNickname() {
  nicknameInput.value = profileStore.profile?.nickname || ''
  nicknameError.value = ''
  isEditingNickname.value = true
}

function cancelEditNickname() {
  isEditingNickname.value = false
  nicknameInput.value = ''
  nicknameError.value = ''
}

async function saveNickname() {
  const trimmed = nicknameInput.value.trim()
  if (trimmed.length === 0) {
    nicknameError.value = '昵称不能为空'
    return
  }
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    nicknameError.value = `昵称不能超过${NICKNAME_MAX_LENGTH}个字符`
    return
  }
  
  const success = await profileStore.updateNickname(userId.value, trimmed)
  if (success) {
    isEditingNickname.value = false
  } else {
    nicknameError.value = profileStore.error?.message || '保存失败'
  }
}

function handleNicknameKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveNickname()
  } else if (event.key === 'Escape') {
    cancelEditNickname()
  }
}

// 退出登录
function handleSignOutClick() {
  showConfirmDialog.value = true
}

async function confirmSignOut() {
  isSigningOut.value = true
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="profile-view">
    <div class="bg-aurora" aria-hidden="true"></div>
    <div class="bg-noise" aria-hidden="true"></div>
    <div class="bg-dots" aria-hidden="true"></div>

    <div v-if="isInitialLoading" class="loading-container">
      <LoadingSpinner size="md" />
      <p>加载中...</p>
    </div>

    <div v-else class="profile-grid">
      <section class="header-card glass-card">
        <TapeDecoration position="top-left" color="accent" />
        <TapeDecoration position="top-right" color="warning" />
        <TapeDecoration position="bottom-left" color="primary" />
        <div class="header-inner">
          <div class="avatar-column">
            <AvatarSticker
              :src="avatarUrl || undefined"
              size="lg"
              :editable="!isUploadingAvatar"
              :loading="isUploadingAvatar"
              @upload="handleAvatarUpload"
            />
            <p class="hint-text">点击贴纸更换头像</p>
          </div>
          <div class="info-column">
            <div v-if="!isEditingNickname" class="nickname-row">
              <div class="nickname-block">
                <h1 class="nickname" :class="{ 'is-placeholder': !hasNickname }">
                  {{ displayNickname }}
                </h1>
                <p class="email">{{ userEmail }}</p>
              </div>
              <button class="pill-button" @click="startEditNickname" :disabled="isLoading">
                <span class="pill-icon">✏️</span>
                编辑昵称
              </button>
            </div>
            <div v-else class="nickname-edit">
              <input
                v-model="nicknameInput"
                type="text"
                class="nickname-input"
                :maxlength="NICKNAME_MAX_LENGTH"
                placeholder="输入昵称"
                @keydown="handleNicknameKeydown"
                autofocus
              />
              <div class="pill-actions">
                <button class="pill-button solid" @click="saveNickname" :disabled="isLoading">保存</button>
                <button class="pill-button ghost" @click="cancelEditNickname">取消</button>
              </div>
            </div>
            <div class="error-row">
              <p v-if="nicknameError" class="error-text">{{ nicknameError }}</p>
              <p v-if="avatarError" class="error-text">{{ avatarError }}</p>
            </div>
            <div class="meta-row">
              <span class="meta-chip">
                <span class="meta-icon">📅</span>
                {{ formattedCreatedAt ? `${formattedCreatedAt} 加入` : '欢迎来到行动手帐' }}
              </span>
              <span class="meta-chip soft">
                完成率 {{ completionRate }}%
              </span>
            </div>
          </div>
        </div>
        <div class="header-wave" aria-hidden="true"></div>
      </section>

      <section class="stat-card glass-card completed">
        <StatsBadge :value="completedTasks" label="已完成任务" icon="✅" color="#10b981" />
        <div class="stat-visual ring" :style="{ '--progress': completionRate }">
          <div class="ring-shell">
            <div class="ring-fill"></div>
            <div class="ring-center">
              <span class="ring-value">{{ completionRate }}%</span>
              <span class="ring-label">完成率</span>
            </div>
          </div>
        </div>
      </section>

      <section class="stat-card glass-card streak">
        <StatsBadge :value="consecutiveDays" label="连续打卡" icon="🔥" color="#f97316" />
        <div class="stat-visual streak-visual">
          <span class="streak-number">{{ consecutiveDays }}</span>
          <div class="flame-row">
            <span v-for="i in Math.min(consecutiveDays, 7)" :key="i" class="flame">🔥</span>
          </div>
        </div>
      </section>

      <section class="stat-card glass-card sealed">
        <StatsBadge :value="sealedRecords" label="封存记录" icon="📚" color="#6366f1" />
        <div class="stat-visual book-visual">
          <div class="book-stack">
            <div class="book base"></div>
            <div
              v-for="i in Math.min(sealedRecords, 4)"
              :key="i"
              class="book layer"
              :style="{ '--offset': i }"
            ></div>
          </div>
          <p v-if="sealedRecords === 0" class="book-empty">暂无封存，试着保存一条特别的记录吧。</p>
        </div>
      </section>

      <section class="footer-rail glass-card">
        <TapeDecoration position="top-center" color="warning" />
        <button class="logout-btn" @click="handleSignOutClick" :disabled="isSigningOut">
          <span class="logout-label">退出登录</span>
          <span aria-hidden="true" class="logout-arrow">→</span>
        </button>
      </section>
    </div>

    <ConfirmDialog
      :visible="showConfirmDialog"
      title="确认退出"
      message="确定要退出登录吗？"
      confirm-text="确认退出"
      cancel-text="取消"
      @confirm="confirmSignOut"
      @cancel="showConfirmDialog = false"
      @update:visible="showConfirmDialog = $event"
    />
  </div>
</template>


<style scoped lang="scss">
.profile-view {
  min-height: calc(100vh - 64px);
  padding: 32px 18px 40px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 30%, #fef2f2 100%);
}

.bg-aurora {
  position: absolute;
  inset: -10%;
  background: radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.18), transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(244, 114, 182, 0.18), transparent 38%),
    radial-gradient(circle at 60% 70%, rgba(16, 185, 129, 0.16), transparent 42%);
  filter: blur(30px);
  pointer-events: none;
}

.bg-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
  opacity: 0.6;
  pointer-events: none;
}

.bg-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.05) 1px, transparent 0);
  background-size: 26px 26px;
  opacity: 0.4;
  pointer-events: none;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  gap: 12px;
  color: var(--text-secondary);
}

.profile-grid {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
  position: relative;
  z-index: 1;
}

.glass-card {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
    border-color: rgba(255, 255, 255, 0.8);

    &::after {
      opacity: 1;
    }
  }
}

.header-card {
  grid-column: 1 / -1;
  padding: 28px 28px 32px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.72));
}

.header-inner {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hint-text {
  font-size: 12px;
  color: var(--text-tertiary);
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed rgba(0, 0, 0, 0.05);
  padding: 6px 12px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nickname-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.nickname-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nickname {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(120deg, #1d4ed8, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  &.is-placeholder {
    color: var(--text-tertiary);
    background: none;
    -webkit-text-fill-color: var(--text-tertiary);
    font-style: italic;
  }
}

.email {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.pill-button {
  appearance: none;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &.solid {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 8px 22px rgba(99, 102, 241, 0.28);
  }

  &.ghost {
    background: rgba(0, 0, 0, 0.04);
  }
}

.pill-icon {
  font-size: 16px;
}

.nickname-edit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.nickname-input {
  padding: 10px 14px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 14px;
  border: 2px solid var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  outline: none;
  min-width: 220px;

  &:focus {
    box-shadow: 0 0 0 3px var(--color-primary-fade);
  }
}

.pill-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.error-row {
  min-height: 18px;
}

.error-text {
  color: var(--color-danger);
  font-size: 13px;
  margin: 0;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px dashed rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
  font-weight: 600;

  &.soft {
    background: rgba(16, 185, 129, 0.12);
    color: #0f766e;
    border-color: rgba(16, 185, 129, 0.18);
  }
}

.meta-icon {
  font-size: 14px;
}

.header-wave {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.18), transparent 32%),
    radial-gradient(circle at 80% 0%, rgba(236, 72, 153, 0.18), transparent 30%);
  opacity: 0.55;
  pointer-events: none;
}

.stat-card {
  --accent: var(--color-primary);
  --accent-soft: rgba(79, 70, 229, 0.12);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: space-between;
  aspect-ratio: 1 / 1;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));

  &.completed {
    --accent: #10b981;
    --accent-soft: rgba(16, 185, 129, 0.14);
  }

  &.streak {
    --accent: #f97316;
    --accent-soft: rgba(249, 115, 22, 0.16);
  }

  &.sealed {
    --accent: #6366f1;
    --accent-soft: rgba(99, 102, 241, 0.14);
  }
}

.stat-visual {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.55));
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.stat-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, var(--accent-soft), transparent 45%);
  opacity: 0.9;
  pointer-events: none;
}

.ring {
  --progress: 0;
}

.ring-shell {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4));
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.ring-fill {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    var(--accent) calc(var(--progress) * 1%),
    rgba(255, 255, 255, 0.2) calc(var(--progress) * 1%),
    rgba(255, 255, 255, 0.08) 100%
  );
  mask: radial-gradient(circle 58% at 50% 50%, transparent 60%, #000 61%);
}

.ring-center {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  padding: 12px 16px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.ring-value {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: var(--accent);
}

.ring-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.streak-visual {
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.streak-number {
  font-size: 48px;
  font-family: 'Comic Sans MS', 'Comic Neue', 'Chalkboard', cursive;
  color: var(--accent);
  text-shadow: 0 6px 18px rgba(249, 115, 22, 0.25);
  line-height: 1;
}

.flame-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.flame {
  font-size: 18px;
  animation: bounce 1s ease-in-out infinite alternate;
}

.book-visual {
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.book-stack {
  position: relative;
  width: 160px;
  height: 120px;
}

.book {
  position: absolute;
  left: 16px;
  right: 16px;
  height: 26px;
  border-radius: 10px;
  background: linear-gradient(120deg, rgba(99, 102, 241, 0.18), rgba(99, 102, 241, 0.36));
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
}

.book.base {
  bottom: 6px;
  background: linear-gradient(120deg, rgba(99, 102, 241, 0.16), rgba(56, 189, 248, 0.2));
}

.book.layer {
  bottom: calc(6px + var(--offset) * 18px);
  transform: translateY(calc(var(--offset) * -2px)) rotate(calc(-3deg + var(--offset) * 1deg));
  background: linear-gradient(120deg, rgba(99, 102, 241, 0.22), rgba(236, 72, 153, 0.24));
}

.book-empty {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.footer-rail {
  grid-column: 1 / -1;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.7));
}

.logout-btn {
  width: 100%;
  border: 1px solid rgba(239, 68, 68, 0.18);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.14));
  color: var(--text-primary);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 700;

  &:hover {
    background: rgba(239, 68, 68, 0.18);
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.18);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.logout-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.logout-arrow {
  color: var(--color-danger);
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}

@keyframes ripple {
  0% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@media (max-width: 1080px) {
  .profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .header-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .profile-view {
    padding: 20px 14px 28px;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .header-inner {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .nickname-row {
    flex-direction: column;
    align-items: center;
  }

  .info-column {
    align-items: center;
  }

  .stat-card {
    aspect-ratio: unset;
  }
}

@media (prefers-reduced-motion: reduce) {
  .glass-card,
  .pill-button,
  .stat-card,
  .flame {
    transition: none;
    animation: none;
  }
}

// ============================================
// 暗色模式 - 流光玻璃 + 极光手账风格
// ============================================
:root[data-theme='dark'] {
  // 极光色彩变量
  --glow-cyan: #22d3ee;
  --glow-violet: #a78bfa;
  --glow-indigo: #818cf8;
  --glow-pink: #f472b6;
  --glow-teal: #5eead4;

  .profile-view {
    background: transparent;
    color: #e5e7eb;
  }

  // 极光背景层 - Mesh Gradient
  .bg-aurora {
    background: 
      radial-gradient(ellipse 70% 50% at 12% 15%, rgba(67, 56, 202, 0.4), transparent 50%),
      radial-gradient(ellipse 60% 45% at 85% 20%, rgba(139, 92, 246, 0.35), transparent 45%),
      radial-gradient(ellipse 50% 35% at 55% 80%, rgba(34, 211, 238, 0.25), transparent 40%),
      radial-gradient(ellipse 80% 60% at 35% 55%, rgba(79, 70, 229, 0.15), transparent 50%);
    filter: blur(60px);
    animation: aurora-pulse 20s ease-in-out infinite alternate;
  }

  // 噪点纹理
  .bg-noise {
    opacity: 0.5;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  }

  .bg-dots {
    opacity: 0.08;
    background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.3) 1px, transparent 0);
  }

  // 高级玻璃拟态卡片 - 流光玻璃 (Luminous Glass)
  .glass-card {
    // 极低透明度背景 - 让背景色透过来
    background: rgba(255, 255, 255, 0.025);
    border: none;
    // 加大磨砂模糊力度
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    // 复合阴影：内发光 + 顶光边缘 + 外阴影
    box-shadow:
      // 内发光 - 玻璃通透感
      inset 0 1px 1px rgba(255, 255, 255, 0.12),
      inset 0 0 30px rgba(255, 255, 255, 0.025),
      // 顶部亮边 - 模拟顶光反射
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      // 底部暗边 - 增加厚度感
      inset 0 -1px 0 rgba(0, 0, 0, 0.2),
      // 外阴影
      0 8px 32px rgba(0, 0, 0, 0.45),
      0 2px 8px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;

    // 发光渐变边框 - 顶光效果（顶亮底暗）
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.22) 0%,
        rgba(255, 255, 255, 0.08) 25%,
        rgba(255, 255, 255, 0.03) 50%,
        rgba(255, 255, 255, 0.01) 100%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    // 噪点纹理层 - 消除塑料感，增加纸张/胶片触感
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
      opacity: 0.6;
      pointer-events: none;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.04);
      box-shadow:
        // 增强内发光
        inset 0 1px 2px rgba(255, 255, 255, 0.15),
        inset 0 0 40px rgba(255, 255, 255, 0.03),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.15),
        // 增强外阴影 + 微弱光晕
        0 12px 40px rgba(0, 0, 0, 0.5),
        0 4px 12px rgba(0, 0, 0, 0.35),
        0 0 50px rgba(129, 140, 248, 0.06);

      &::before {
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.3) 0%,
          rgba(255, 255, 255, 0.12) 25%,
          rgba(255, 255, 255, 0.04) 50%,
          rgba(255, 255, 255, 0.01) 100%
        );
      }
    }
  }

  .header-card {
    // 深紫色半透明渐变 - 与背景融合
    background: linear-gradient(
      145deg,
      rgba(139, 92, 246, 0.04) 0%,
      rgba(99, 102, 241, 0.025) 50%,
      rgba(255, 255, 255, 0.02) 100%
    );
  }

  .header-wave {
    background: 
      radial-gradient(circle at 25% 15%, rgba(99, 102, 241, 0.25), transparent 40%),
      radial-gradient(circle at 80% 10%, rgba(167, 139, 250, 0.2), transparent 35%),
      radial-gradient(circle at 60% 90%, rgba(34, 211, 238, 0.12), transparent 30%);
    opacity: 0.8;
  }

  // 昵称发光效果
  .nickname {
    color: #ffffff;
    -webkit-text-fill-color: unset;
    background: none;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.35), 0 0 40px rgba(255, 255, 255, 0.15);
    letter-spacing: 0.02em;
  }

  .email {
    color: rgba(226, 232, 240, 0.8);
  }

  .hint-text {
    color: rgba(203, 213, 225, 0.7);
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
  }

  .meta-chip {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
    color: rgba(226, 232, 240, 0.85);
    backdrop-filter: blur(8px);

    &.soft {
      background: rgba(94, 234, 212, 0.1);
      color: #a7f3d0;
      border-color: rgba(94, 234, 212, 0.15);
      box-shadow: 0 0 20px rgba(94, 234, 212, 0.08);
    }
  }

  .pill-button {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e5e7eb;
    backdrop-filter: blur(12px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 20px rgba(129, 140, 248, 0.1);
    }

    &.solid {
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.9), rgba(167, 139, 250, 0.9));
      border: none;
      color: #0f172a;
      font-weight: 700;
      box-shadow: 0 0 30px rgba(34, 211, 238, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3);

      &:hover {
        box-shadow: 0 0 40px rgba(34, 211, 238, 0.4), 0 6px 20px rgba(0, 0, 0, 0.4);
      }
    }

    &.ghost {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.06);
    }
  }

  .nickname-input {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(129, 140, 248, 0.4);
    color: #f1f5f9;

    &:focus {
      border-color: rgba(129, 140, 248, 0.6);
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15), 0 0 20px rgba(129, 140, 248, 0.1);
    }
  }

  // 统计卡片 - 流光玻璃效果
  .stat-card {
    // 深紫色半透明背景 - 与极光背景融合
    background: linear-gradient(
      145deg,
      rgba(139, 92, 246, 0.035) 0%,
      rgba(255, 255, 255, 0.02) 100%
    );
    --accent-start: #22d3ee;
    --accent-end: #a78bfa;
    --accent: var(--accent-start);
    --accent-soft: rgba(34, 211, 238, 0.12);

    &.completed {
      --accent-start: #5eead4;
      --accent-end: #818cf8;
      background: linear-gradient(
        145deg,
        rgba(94, 234, 212, 0.03) 0%,
        rgba(255, 255, 255, 0.02) 100%
      );
    }

    &.streak {
      --accent-start: #f472b6;
      --accent-end: #22d3ee;
      --accent: var(--accent-start);
      --accent-soft: rgba(244, 114, 182, 0.12);
      background: linear-gradient(
        145deg,
        rgba(244, 114, 182, 0.03) 0%,
        rgba(255, 255, 255, 0.02) 100%
      );
    }

    &.sealed {
      --accent-start: #c4b5fd;
      --accent-end: #22d3ee;
      --accent: var(--accent-start);
      --accent-soft: rgba(196, 181, 253, 0.12);
      background: linear-gradient(
        145deg,
        rgba(196, 181, 253, 0.03) 0%,
        rgba(255, 255, 255, 0.02) 100%
      );
    }
  }

  .stat-visual {
    // 深色内部区域 - 带噪点纹理
    background: rgba(8, 12, 24, 0.5);
    border-color: rgba(255, 255, 255, 0.04);
    box-shadow: 
      // 内发光
      inset 0 1px 1px rgba(255, 255, 255, 0.06),
      inset 0 0 30px rgba(255, 255, 255, 0.015),
      // 顶光边缘
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    position: relative;
    
    // 噪点纹理
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
      opacity: 0.5;
      pointer-events: none;
    }
  }

  .ring-fill {
    background: conic-gradient(from 180deg, var(--accent-start) 0deg, var(--accent-end) calc(var(--progress) * 3.6deg), rgba(255, 255, 255, 0.06) calc(var(--progress) * 3.6deg), rgba(255, 255, 255, 0.03) 360deg);
  }

  .ring-shell {
    background: rgba(255, 255, 255, 0.03);
    box-shadow: 0 0 40px rgba(34, 211, 238, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.02);
  }

  .ring-center {
    background: rgba(8, 12, 24, 0.8);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 20px rgba(0, 0, 0, 0.3);
  }

  .ring-value {
    background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.3));
  }

  .ring-label {
    color: rgba(203, 213, 225, 0.7);
  }

  .streak-number {
    background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    filter: drop-shadow(0 0 12px rgba(244, 114, 182, 0.4));
  }

  :deep(.stats-badge .badge-value) {
    background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.25));
  }

  .book {
    background: linear-gradient(120deg, rgba(129, 140, 248, 0.2), rgba(167, 139, 250, 0.25));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .book.base {
    background: linear-gradient(120deg, rgba(99, 102, 241, 0.18), rgba(139, 92, 246, 0.22));
  }

  .book.layer {
    background: linear-gradient(120deg, rgba(167, 139, 250, 0.22), rgba(34, 211, 238, 0.18));
  }

  .book-empty {
    color: rgba(148, 163, 184, 0.7);
  }

  .footer-rail {
    background: rgba(255, 255, 255, 0.02);
  }

  .logout-btn {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.18));
    border-color: rgba(239, 68, 68, 0.2);
    color: #fca5a5;

    &:hover {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(239, 68, 68, 0.25));
      box-shadow: 0 0 30px rgba(239, 68, 68, 0.15), 0 8px 24px rgba(0, 0, 0, 0.3);
    }
  }

  .logout-arrow {
    color: #f87171;
  }

  // 头像双层光环效果
  :deep(.avatar-sticker) {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: -12px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, rgba(34, 211, 238, 0.1) 40%, transparent 70%);
      opacity: 0.6;
      animation: avatar-ripple 3s ease-in-out infinite;
      pointer-events: none;
      z-index: -1;
    }

    &::after {
      content: '';
      position: absolute;
      inset: -20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, rgba(167, 139, 250, 0.08) 45%, transparent 70%);
      opacity: 0.5;
      animation: avatar-ripple 3s ease-in-out infinite;
      animation-delay: 1.5s;
      pointer-events: none;
      z-index: -2;
    }
  }

  :deep(.avatar-sticker .sticker-body) {
    border-color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2), 0 0 30px rgba(34, 211, 238, 0.15), 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  // 胶带磨砂质感
  :deep(.tape-decoration) {
    opacity: 0.5;
    filter: blur(0.3px);
    backdrop-filter: blur(4px);

    &.tape--primary { 
      --tape-color: rgba(255, 255, 255, 0.18);
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.05);
    }
    &.tape--accent { 
      --tape-color: rgba(167, 139, 250, 0.2);
      box-shadow: 0 0 12px rgba(167, 139, 250, 0.08);
    }
    &.tape--warning { 
      --tape-color: rgba(251, 191, 36, 0.18);
      box-shadow: 0 0 12px rgba(251, 191, 36, 0.06);
    }
    &.tape--success { 
      --tape-color: rgba(94, 234, 212, 0.18);
      box-shadow: 0 0 12px rgba(94, 234, 212, 0.06);
    }

    .tape-stripe {
      background: repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255, 255, 255, 0.08) 4px, rgba(255, 255, 255, 0.08) 8px);
    }
  }
}

// 极光脉动动画
@keyframes aurora-pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}

// 头像光环呼吸动画
@keyframes avatar-ripple {
  0%, 100% { transform: scale(0.95); opacity: 0.4; }
  50% { transform: scale(1.05); opacity: 0.7; }
}
</style>
