<template>
  <div class="verification-code-input">
    <div class="code-boxes">
      <input
        v-for="(_, index) in length"
        :key="index"
        ref="inputRefs"
        type="text"
        inputmode="numeric"
        maxlength="1"
        class="code-box"
        :class="{ 'has-value': digits[index] }"
        :value="digits[index]"
        :disabled="disabled"
        @input="handleInput(index, $event)"
        @keydown="handleKeydown(index, $event)"
        @paste="handlePaste($event)"
        @focus="handleFocus(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

// Props 定义
interface Props {
  modelValue?: string[]
  length?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  length: 6,
  disabled: false
})

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'complete': [code: string]
}>()

// 内部状态
const digits = ref<string[]>(Array(props.length).fill(''))
const inputRefs = ref<HTMLInputElement[]>([])

// 同步外部值到内部状态
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      digits.value = [...newValue, ...Array(props.length - newValue.length).fill('')].slice(0, props.length)
    }
  },
  { immediate: true }
)

// 处理输入事件
function handleInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  // 只允许数字
  if (value && !/^\d$/.test(value)) {
    target.value = digits.value[index]
    return
  }

  // 更新当前位置的值
  digits.value[index] = value
  emitUpdate()

  // 如果输入了数字，自动聚焦下一格
  if (value && index < props.length - 1) {
    nextTick(() => {
      focusInput(index + 1)
    })
  }

  // 检查是否所有数字都已填满
  checkComplete()
}

// 处理键盘事件
function handleKeydown(index: number, event: KeyboardEvent) {
  const target = event.target as HTMLInputElement

  // 退格键处理
  if (event.key === 'Backspace') {
    if (!target.value && index > 0) {
      // 当前格为空时，聚焦上一格
      event.preventDefault()
      focusInput(index - 1)
    }
  }

  // 左箭头
  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    focusInput(index - 1)
  }

  // 右箭头
  if (event.key === 'ArrowRight' && index < props.length - 1) {
    event.preventDefault()
    focusInput(index + 1)
  }
}

// 处理粘贴事件
function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''

  // 提取数字
  const numbers = pastedData.replace(/\D/g, '').slice(0, props.length)

  if (numbers.length > 0) {
    // 分发数字到各个输入框
    for (let i = 0; i < props.length; i++) {
      digits.value[i] = numbers[i] || ''
    }
    emitUpdate()

    // 聚焦到最后一个填充的位置或下一个空位
    const focusIndex = Math.min(numbers.length, props.length - 1)
    nextTick(() => {
      focusInput(focusIndex)
    })

    // 检查是否完成
    checkComplete()
  }
}

// 处理聚焦事件
function handleFocus(index: number) {
  // 选中当前输入框的内容
  nextTick(() => {
    inputRefs.value[index]?.select()
  })
}

// 聚焦指定输入框
function focusInput(index: number) {
  if (index >= 0 && index < props.length) {
    inputRefs.value[index]?.focus()
  }
}

// 发送更新事件
function emitUpdate() {
  emit('update:modelValue', [...digits.value])
}

// 检查是否所有数字都已填满
function checkComplete() {
  const allFilled = digits.value.every((d) => d !== '')
  if (allFilled) {
    const code = digits.value.join('')
    emit('complete', code)
  }
}

// 暴露方法供外部调用
defineExpose({
  focus: () => focusInput(0),
  clear: () => {
    digits.value = Array(props.length).fill('')
    emitUpdate()
    focusInput(0)
  }
})
</script>

<style scoped lang="scss">
.verification-code-input {
  width: 100%;
}

.code-boxes {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

.code-box {
  width: 48px;
  height: 56px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  backdrop-filter: var(--backdrop-blur);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  color: var(--text-primary);
  transition: all var(--transition-normal);
  outline: none;
  caret-color: var(--color-primary);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-fade);
    transform: translateY(-2px);
  }

  &.has-value {
    border-color: var(--color-primary-light);
    background: var(--color-primary-fade);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--bg-tertiary);
  }

  // 隐藏数字输入框的上下箭头
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  // Firefox
  &[type='number'] {
    -moz-appearance: textfield;
  }
}

// 响应式调整
@media (max-width: 480px) {
  .code-boxes {
    gap: var(--spacing-xs);
  }

  .code-box {
    width: 40px;
    height: 48px;
    font-size: var(--font-size-xl);
  }
}
</style>
