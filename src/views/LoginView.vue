<template>
  <div class="login-view">
    <!-- 渐变背景 -->
    <div class="login-view__background"></div>

    <!-- 登录卡片 -->
    <BaseCard class="login-view__card" :padded="false">
      <div class="card-content">
        <!-- Logo 和标题 -->
        <div class="login-view__header">
          <div class="login-view__logo">📔</div>
          <h1 class="login-view__title">行动手帐</h1>
          <p class="login-view__subtitle">
            {{ codeSent ? '输入验证码' : '欢迎使用' }}
          </p>
        </div>

        <!-- 表单区域 -->
        <Transition name="slide-fade" mode="out-in">
          <!-- 邮箱输入 -->
          <div v-if="!codeSent" key="email" class="login-view__form">
            <BaseInput
              ref="emailInputRef"
              v-model="email"
              label="邮箱地址"
              placeholder="请输入邮箱"
              type="email"
              :error="emailError"
              :disabled="authStore.isLoading"
              @keyup.enter="handleSendEmailOtp"
              @update:modelValue="clearEmailError"
            >
              <template #prefix>📧</template>
            </BaseInput>

            <BaseButton
              variant="primary"
              block
              :loading="authStore.isLoading"
              :disabled="!email"
              @click="handleSendEmailOtp"
            >
              发送验证码
            </BaseButton>
          </div>

          <!-- 验证码输入 -->
          <div v-else key="sent" class="login-view__form login-view__sent">
            <div class="sent-icon">✉️</div>
            <p class="sent-title">验证码已发送</p>
            <p class="sent-hint">
              我们已向 <strong>{{ email }}</strong> 发送 6 位验证码，请在下方输入完成登录。
            </p>
            <p class="sent-note">如果没有收到邮件，请检查垃圾邮件文件夹。</p>

            <VerificationCodeInput
              ref="codeInputRef"
              v-model="codeDigits"
              :disabled="authStore.isLoading"
              @complete="handleVerifyCode"
            />

            <BaseButton
              variant="primary"
              block
              :loading="authStore.isLoading"
              :disabled="codeDigits.join('').length !== 6"
              @click="() => handleVerifyCode(codeDigits.join(''))"
            >
              验证并登录
            </BaseButton>

            <!-- 重新发送 -->
            <div class="login-view__resend">
              <BaseButton
                v-if="countdown > 0"
                variant="ghost"
                size="sm"
                disabled
              >
                {{ countdown }}秒后可重新发送
              </BaseButton>
              <BaseButton
                v-else
                variant="ghost"
                size="sm"
                :loading="authStore.isLoading"
                @click="handleResendEmailOtp"
              >
                重新发送验证码
              </BaseButton>
            </div>

            <BaseButton
              variant="secondary"
              block
              :disabled="authStore.isLoading"
              @click="handleBackToEmail"
            >
              使用其他邮箱
            </BaseButton>
          </div>
        </Transition>

        <!-- 错误提示 -->
        <Transition name="fade">
          <div v-if="authStore.error" class="login-view__error">
            {{ authStore.error }}
          </div>
        </Transition>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { VerificationCodeInput } from '@/components/auth'

// 状态
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 组件引用
const emailInputRef = ref<InstanceType<typeof BaseInput> | null>(null)
const codeInputRef = ref<InstanceType<typeof VerificationCodeInput> | null>(null)

// 表单状态
const email = ref('')
const emailError = ref('')
const codeSent = ref(false)
const codeDigits = ref<string[]>([])

// 倒计时状态
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 邮箱验证正则（更严格）
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// 常见邮箱域名拼写错误检测
const COMMON_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gami.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'qq.co': 'qq.com',
  '163.co': '163.com',
  '126.co': '126.com',
  'sina.co': 'sina.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com'
}

// 邮箱域名拼写建议
const emailSuggestion = ref('')

/**
 * 验证邮箱格式
 */
function validateEmail(emailValue: string): boolean {
  if (!EMAIL_REGEX.test(emailValue)) {
    return false
  }
  
  // 检查常见拼写错误
  const domain = emailValue.split('@')[1]?.toLowerCase()
  if (domain && COMMON_TYPOS[domain]) {
    emailSuggestion.value = COMMON_TYPOS[domain]
    return false
  }
  
  emailSuggestion.value = ''
  return true
}

/**
 * 清除邮箱错误
 */
function clearEmailError() {
  emailError.value = ''
  authStore.clearError()
}

/**
 * 发送邮箱验证码
 */
async function handleSendEmailOtp() {
  // 验证邮箱格式
  if (!validateEmail(email.value)) {
    if (emailSuggestion.value) {
      emailError.value = `您是否想输入 @${emailSuggestion.value}？`
    } else {
      emailError.value = '请输入有效的邮箱地址'
    }
    return
  }

  authStore.clearError()
  const success = await authStore.sendEmailOtp(email.value)

  if (success) {
    codeSent.value = true
    codeDigits.value = []
    startCountdown()
    nextTick(() => codeInputRef.value?.focus())
  }
}

/**
 * 重新发送邮箱验证码
 */
async function handleResendEmailOtp() {
  authStore.clearError()
  const success = await authStore.sendEmailOtp(email.value)

  if (success) {
    codeDigits.value = []
    startCountdown()
    nextTick(() => codeInputRef.value?.focus())
  }
}

/**
 * 返回邮箱输入
 */
function handleBackToEmail() {
  codeSent.value = false
  codeDigits.value = []
  authStore.clearError()
  stopCountdown()

  nextTick(() => {
    // Focus logic might need adjustment depending on BaseInput implementation
    // Assuming BaseInput exposes focus method or we access the input element
  })
}

/**
 * 验证验证码并登录
 */
async function handleVerifyCode(code: string) {
  authStore.clearError()
  const success = await authStore.verifyEmailOtp(email.value, code)
  if (success) {
    const redirectPath = (route.query.redirect as string | undefined) || '/dashboard'
    router.push(redirectPath)
  } else {
    codeInputRef.value?.clear()
  }
}

/**
 * 开始倒计时
 */
function startCountdown() {
  countdown.value = 60
  stopCountdown()

  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      stopCountdown()
    }
  }, 1000)
}

/**
 * 停止倒计时
 */
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 生命周期
onMounted(() => {
  // Focus logic
})

onUnmounted(() => {
  stopCountdown()
})

// 导出供测试使用
defineExpose({
  countdown,
  startCountdown,
  stopCountdown
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.login-view {
  min-height: 100vh;
  min-height: 100dvh;
  @include flex-center;
  padding: var(--spacing-page);
  position: relative;
  overflow: hidden;

  // 渐变背景
  &__background {
    position: fixed;
    inset: 0;
    background: var(--bg-gradient);
    z-index: -1;

    &::before,
    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      animation: float 20s ease-in-out infinite;
    }

    &::before {
      width: 400px;
      height: 400px;
      background: var(--color-primary);
      top: -100px;
      right: -100px;
    }

    &::after {
      width: 300px;
      height: 300px;
      background: var(--color-accent);
      bottom: -50px;
      left: -50px;
      animation-delay: -10s;
    }
  }

  // 登录卡片
  &__card {
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
  }
  
  .card-content {
    padding: var(--spacing-xl);
    
    @include until-sm {
      padding: var(--spacing-lg);
    }
  }

  &__header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  &__logo {
    font-size: 48px;
    margin-bottom: var(--spacing-sm);
    animation: bounce-in 0.6s ease-out;
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    @include text-gradient;
  }

  &__subtitle {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  &__sent {
    text-align: center;
  }

  &__resend {
    text-align: center;
    margin: var(--spacing-sm) 0;
  }

  &__error {
    margin-top: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-danger-light);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-md);
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    text-align: center;
  }
}

// 发送成功样式
.sent-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.sent-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.sent-hint {
  margin: var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;

  strong {
    color: var(--text-primary);
  }
}

.sent-note {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(20px, 10px) scale(1.05); }
}

@keyframes bounce-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
