<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SearchQuery, MoodType } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  modelValue: SearchQuery
}

interface Emits {
  (e: 'update:modelValue', value: SearchQuery): void
  (e: 'search'): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localQuery = ref<SearchQuery>({ ...props.modelValue })

const moodOptions: { value: MoodType | ''; label: string; emoji: string }[] = [
  { value: '', label: '全部心情', emoji: '' },
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'neutral', label: '平淡', emoji: '😐' },
  { value: 'sad', label: '沮丧', emoji: '😢' },
  { value: 'excited', label: '兴奋', emoji: '🎉' },
  { value: 'tired', label: '疲惫', emoji: '😴' }
]

watch(() => props.modelValue, (newVal) => {
  localQuery.value = { ...newVal }
}, { deep: true })

function handleSearch() {
  emit('update:modelValue', { ...localQuery.value })
  emit('search')
}

function handleReset() {
  localQuery.value = {
    startDate: null,
    endDate: null,
    mood: null,
    keyword: '',
    tags: []
  }
  emit('update:modelValue', { ...localQuery.value })
  emit('reset')
}

function handleMoodChange(event: Event) {
  const target = event.target as HTMLSelectElement
  localQuery.value.mood = target.value ? (target.value as MoodType) : null
}
</script>

<template>
  <BaseCard class="search-filter" :padded="true">
    <div class="search-filter__grid">
      <div class="search-filter__field search-filter__field--keyword">
        <BaseInput
          v-model="localQuery.keyword"
          label="关键词"
          placeholder="搜索日记或任务..."
          @keyup.enter="handleSearch"
        >
          <template #prefix>🔍</template>
        </BaseInput>
      </div>

      <div class="search-filter__field search-filter__field--mood">
        <label class="search-filter__label">心情</label>
        <div class="search-filter__select-wrapper">
          <select
            class="search-filter__select"
            :value="localQuery.mood || ''"
            @change="handleMoodChange"
          >
            <option
              v-for="option in moodOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.emoji }} {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="search-filter__field search-filter__field--start">
        <BaseInput
          v-model="localQuery.startDate"
          type="date"
          label="开始日期"
        />
      </div>

      <div class="search-filter__field search-filter__field--end">
        <BaseInput
          v-model="localQuery.endDate"
          type="date"
          label="结束日期"
        />
      </div>

      <div class="search-filter__actions">
        <BaseButton
          variant="primary"
          @click="handleSearch"
        >
          搜索
        </BaseButton>
        <BaseButton
          variant="ghost"
          @click="handleReset"
        >
          重置
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.search-filter {
  @include flex-column;
  gap: var(--spacing-md);

  &__grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr auto;
    grid-template-areas: "keyword mood start end actions";
    gap: var(--spacing-md);
    align-items: end;

    @include until-md {
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        "keyword keyword"
        "mood mood"
        "start end"
        "actions actions";
    }

    @include until-sm {
      grid-template-columns: 1fr;
      grid-template-areas:
        "keyword"
        "mood"
        "start"
        "end"
        "actions";
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex: 1;

    &--keyword {
      grid-area: keyword;
    }

    &--mood {
      grid-area: mood;
      min-width: 160px;
    }

    &--start { grid-area: start; }
    &--end { grid-area: end; }
  }

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
    margin-left: var(--spacing-xs);
  }

  &__select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    color: var(--text-primary);
    font-size: var(--font-size-base);
    transition: all var(--transition-fast);
    min-height: 48px; // Match BaseInput height
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-fade);
    }

    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
  }

  &__actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-start;
    grid-area: actions;
    padding-bottom: 2px; // 与输入框底部对齐
    
    @include until-sm {
      flex-direction: column-reverse;
      margin-top: var(--spacing-sm);
      padding-bottom: 0;
    }
  }
}
</style>
