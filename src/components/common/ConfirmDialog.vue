<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="visible" class="dialog-overlay" @click.self="handleCancel">
        <Transition name="dialog-scale" appear>
          <div class="dialog-container">
            <div class="dialog-header">
              <h3 class="dialog-title">{{ title }}</h3>
            </div>
            
            <div class="dialog-body">
              <p class="dialog-message">{{ message }}</p>
            </div>
            
            <div class="dialog-footer">
              <BaseButton
                variant="ghost"
                @click="handleCancel"
              >
                {{ cancelText }}
              </BaseButton>
              <BaseButton
                variant="primary"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </BaseButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'

/**
 * 通用确认对话框组件
 * 使用玻璃拟态风格，支持确认和取消操作
 */

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消'
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:visible', value: boolean): void
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:visible', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  padding: var(--spacing-md);
}

.dialog-container {
  width: 100%;
  max-width: 400px;
  @include glass-effect(0.9, 16px);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.dialog-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
}

.dialog-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-align: center;
}

.dialog-body {
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-lg);
}

.dialog-message {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  text-align: center;
  line-height: var(--line-height-relaxed);
}

.dialog-footer {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  justify-content: center;
  
  :deep(.base-button) {
    flex: 1;
  }
}

// 对话框动画
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-scale-leave-active {
  transition: all 0.2s ease;
}

.dialog-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
