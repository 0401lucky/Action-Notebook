<template>
  <BaseCard class="task-input" :padded="true">
    <form @submit.prevent="handleSubmit">
      <div class="task-input__main">
        <div class="input-wrapper">
          <input
            ref="inputRef"
            v-model="description"
            type="text"
            class="task-input__field"
            placeholder="添加新任务..."
            :disabled="disabled"
            @keydown.enter="handleSubmit"
          />
          <div class="input-focus-border"></div>
        </div>
        <BaseButton
          type="submit"
          variant="primary"
          :disabled="disabled || !isValid"
          class="task-input__submit"
        >
          <template #icon>＋</template>
          添加
        </BaseButton>
      </div>
      
      <div class="task-input__options">
        <div class="task-input__priority">
          <label class="task-input__label">优先级</label>
          <div class="priority-buttons">
            <button
              v-for="p in priorities"
              :key="p.value"
              type="button"
              class="priority-btn"
              :class="[
                `priority-btn--${p.value}`,
                { 'priority-btn--active': priority === p.value }
              ]"
              :disabled="disabled"
              @click="priority = p.value"
            >
              <span class="priority-dot"></span>
              {{ p.label }}
            </button>
          </div>
        </div>
        
        <div class="task-input__tags">
          <label class="task-input__label">标签</label>
          <div class="tags-input-wrapper">
            <input
              v-model="tagInput"
              type="text"
              class="tags-input__field"
              placeholder="输入标签后按回车"
              :disabled="disabled"
              @keydown.enter.prevent="addTag"
            />
            <div v-if="tags.length > 0" class="tags-list">
              <TransitionGroup name="list">
                <span
                  v-for="tag in tags"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                  <button
                    type="button"
                    class="tag__remove"
                    @click="removeTag(tag)"
                  >
                    ×
                  </button>
                </span>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </div>
      
      <Transition name="fade">
        <p v-if="errorMessage" class="task-input__error">
          {{ errorMessage }}
        </p>
      </Transition>
    </form>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Priority } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'add', payload: { description: string; priority: Priority; tags: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement | null>(null)
const description = ref('')
const priority = ref<Priority>('medium')
const tags = ref<string[]>([])
const tagInput = ref('')
const errorMessage = ref('')

const priorities = [
  { value: 'high' as Priority, label: '高' },
  { value: 'medium' as Priority, label: '中' },
  { value: 'low' as Priority, label: '低' }
]

const isValid = computed(() => description.value.trim().length > 0)

function handleSubmit() {
  errorMessage.value = ''
  
  if (props.disabled) {
    return
  }
  
  const trimmedDescription = description.value.trim()
  
  if (trimmedDescription.length === 0) {
    errorMessage.value = '任务描述不能为空'
    return
  }
  
  emit('add', {
    description: trimmedDescription,
    priority: priority.value,
    tags: [...tags.value]
  })
  
  // Reset form
  description.value = ''
  priority.value = 'medium'
  tags.value = []
  tagInput.value = ''
  
  // Focus input for next entry
  inputRef.value?.focus()
}

function addTag() {
  const trimmedTag = tagInput.value.trim()
  
  if (trimmedTag.length > 0 && !tags.value.includes(trimmedTag)) {
    tags.value.push(trimmedTag)
  }
  
  tagInput.value = ''
}

function removeTag(tag: string) {
  const index = tags.value.indexOf(tag)
  if (index > -1) {
    tags.value.splice(index, 1)
  }
}

// Expose focus method for parent components
function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.task-input {
  // BaseCard handles container styles
  
  &__main {
    display: flex;
    gap: var(--spacing-sm);
    
    @include until-xs {
      flex-direction: column;
    }
  }
  
  .input-wrapper {
    flex: 1;
    position: relative;
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    box-shadow: var(--shadow-inner);
    transition: all var(--transition-fast);
  }
  
  &__field {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-md);
    transition: all var(--transition-fast);
    min-height: 50px;
    
    &:focus {
      outline: none;
      background: var(--bg-secondary);
    }
    
    &::placeholder {
      color: var(--text-placeholder);
    }
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
  
  .input-focus-border {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    transition: all var(--transition-normal);
    transform: translateX(-50%);
  }
  
  &__field:focus + .input-focus-border {
    width: 100%;
  }
  
  &__submit {
    min-height: 50px;
    
    @include until-xs {
      width: 100%;
    }
  }
  
  &__options {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 1.4fr;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color-light);
    
    @include until-md {
      grid-template-columns: 1fr 1fr;
    }

    @include until-sm {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
  }
  
  &__label {
    display: block;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-sm);
  }
  
  &__priority {
    flex-shrink: 0;
  }
  
  &__tags {
    flex: 1;
    min-width: 200px;
  }
  
  &__error {
    margin-top: var(--spacing-sm);
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    
    &::before {
      content: '⚠️';
    }
  }
}

.priority-buttons {
  display: flex;
  gap: var(--spacing-sm);
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color-light);
}

.priority-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  @include until-sm {
    flex: 1;
    justify-content: center;
  }
  
  .priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.5;
  }
  
  &:hover:not(:disabled) {
    color: var(--text-primary);
    background: var(--bg-hover);
  }
  
  &--active {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    box-shadow: var(--shadow-sm);
    
    .priority-dot {
      opacity: 1;
    }
  }
  
  &--high.priority-btn--active .priority-dot { color: var(--priority-high); }
  &--medium.priority-btn--active .priority-dot { color: var(--priority-medium); }
  &--low.priority-btn--active .priority-dot { color: var(--priority-low); }
}

.tags-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color-light);
}

.tags-input__field {
  width: 100%;
  padding: 8px 0;
  border: none;
  border-bottom: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  &::placeholder {
    color: var(--text-placeholder);
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--color-primary-fade);
  color: var(--color-primary);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  
  &__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: rgba(0, 0, 0, 0.1);
    color: inherit;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    transition: background var(--transition-fast);
    
    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

// Transitions
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.list-leave-active {
  position: absolute;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
