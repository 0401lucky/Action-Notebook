<script setup lang="ts">
/**
 * AvatarSticker 组件 - 贴纸风格的头像组件
 * 
 * 功能：
 * - 贴纸效果（白边、阴影、微旋转）
 * - 旋转角度随机生成在 -3° 到 3° 范围内
 * - 悬停抬起动画
 * - 支持点击上传功能
 * - 无头像时显示手绘风格占位符
 * 
 * @module components/profile/AvatarSticker
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
import { ref, computed, onMounted } from 'vue'

// Props
interface Props {
  src?: string | null      // 头像 URL
  size?: 'sm' | 'md' | 'lg' // 默认 'lg'
  editable?: boolean        // 是否可编辑，默认 true
  loading?: boolean         // 是否正在上传
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  size: 'lg',
  editable: true,
  loading: false
})

// Emits
const emit = defineEmits<{
  (e: 'upload', file: File): void
  (e: 'click'): void
}>()

// 文件输入引用
const fileInputRef = ref<HTMLInputElement | null>(null)

// 随机旋转角度（-3° 到 3°）
const rotation = ref(0)

/**
 * 生成随机旋转角度
 * Property 2: Avatar Rotation Range - 旋转角度应在 [-3, 3] 范围内
 */
function generateRotation(): number {
  return Math.random() * 6 - 3 // -3 到 3
}

onMounted(() => {
  rotation.value = generateRotation()
})

// 计算属性
const hasAvatar = computed(() => !!props.src)

const sizeClass = computed(() => `size-${props.size}`)

const stickerStyle = computed(() => ({
  '--rotation': `${rotation.value}deg`
}))

// 方法
function handleClick() {
  emit('click')
  if (props.editable && !props.loading) {
    fileInputRef.value?.click()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (file) {
    emit('upload', file)
  }
  
  // 清除选择，允许重复选择同一文件
  input.value = ''
}

// 暴露旋转角度供测试使用
defineExpose({
  rotation,
  generateRotation
})
</script>

<template>
  <div 
    class="avatar-sticker"
    :class="[sizeClass, { 'is-editable': editable, 'is-loading': loading }]"
    :style="stickerStyle"
    @click="handleClick"
    @keydown="handleKeydown"
    :role="editable ? 'button' : 'img'"
    :tabindex="editable ? 0 : -1"
    :aria-label="hasAvatar ? (editable ? '点击更换头像' : '用户头像') : (editable ? '点击上传头像' : '默认头像')"
  >
    <!-- 贴纸主体 -->
    <div class="sticker-body">
      <!-- 有头像时显示图片 -->
      <img 
        v-if="hasAvatar" 
        :src="src!" 
        alt="用户头像"
        class="avatar-image"
      />
      <!-- 无头像时显示手绘风格占位符 -->
      <div v-else class="avatar-placeholder" data-testid="avatar-placeholder">
        <svg 
          class="placeholder-icon" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 手绘风格头部 -->
          <circle 
            cx="50" cy="35" r="20" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round"
            stroke-dasharray="2 4"
          />
          <!-- 手绘风格身体 -->
          <path 
            d="M20 85 C20 60 35 50 50 50 C65 50 80 60 80 85" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round"
            stroke-dasharray="3 5"
            fill="none"
          />
        </svg>
      </div>
      
      <!-- 上传遮罩（仅可编辑时显示） -->
      <div v-if="editable" class="upload-overlay">
        <span v-if="loading" class="loading-indicator">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4 31.4" />
          </svg>
        </span>
        <span v-else class="upload-hint">📷</span>
      </div>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input
      v-if="editable"
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png"
      class="file-input"
      @change="handleFileChange"
      :disabled="loading"
    />
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.avatar-sticker {
  --rotation: 0deg;
  position: relative;
  display: inline-block;
  
  // 贴纸旋转效果 - Requirements 2.2
  transform: rotate(var(--rotation));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &.is-editable {
    cursor: pointer;
    
    &:focus {
      outline: none;
      
      .sticker-body {
        box-shadow: 
          0 0 0 3px var(--color-primary-fade),
          0 8px 20px rgba(0, 0, 0, 0.15);
      }
    }
  }
  
  // 悬停抬起动画 - Requirements 2.3
  &.is-editable:hover:not(.is-loading) {
    transform: rotate(var(--rotation)) translateY(-8px) scale(1.02);
    
    .sticker-body {
      box-shadow: 
        0 12px 30px rgba(0, 0, 0, 0.2),
        0 4px 10px rgba(0, 0, 0, 0.1);
    }
    
    .upload-overlay {
      opacity: 1;
    }
  }
  
  &.is-loading {
    pointer-events: none;
    
    .upload-overlay {
      opacity: 1;
      background: rgba(255, 255, 255, 0.8);
    }
  }
}

// 尺寸变体
.size-sm {
  .sticker-body {
    width: 60px;
    height: 60px;
    border-width: 3px;
  }
  
  .placeholder-icon {
    width: 30px;
    height: 30px;
  }
  
  .upload-hint {
    font-size: 16px;
  }
}

.size-md {
  .sticker-body {
    width: 90px;
    height: 90px;
    border-width: 4px;
  }
  
  .placeholder-icon {
    width: 45px;
    height: 45px;
  }
  
  .upload-hint {
    font-size: 20px;
  }
}

.size-lg {
  .sticker-body {
    width: 120px;
    height: 120px;
    border-width: 5px;
  }
  
  .placeholder-icon {
    width: 60px;
    height: 60px;
  }
  
  .upload-hint {
    font-size: 28px;
  }
}

// 贴纸主体 - Requirements 2.1
.sticker-body {
  position: relative;
  border-radius: var(--radius-full);
  overflow: hidden;
  
  // 白边效果
  border: 5px solid white;
  background: white;
  
  // 阴影效果
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08);
  
  transition: box-shadow 0.3s ease;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: var(--radius-full);
}

// 占位符 - Requirements 2.4
.avatar-placeholder {
  width: 100%;
  height: 100%;
  @include flex-center;
  background: linear-gradient(
    135deg,
    var(--color-primary-light) 0%,
    var(--color-accent-light) 100%
  );
  border-radius: var(--radius-full);
}

.placeholder-icon {
  color: var(--color-primary);
  opacity: 0.6;
  transition: transform 0.3s ease;
  
  .avatar-sticker:hover & {
    transform: scale(1.1);
  }
}

// 上传遮罩
.upload-overlay {
  position: absolute;
  inset: 0;
  @include flex-center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-full);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-hint {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  .avatar-sticker:hover & {
    transform: scale(1.2);
  }
}

.loading-indicator {
  @include flex-center;
}

.spinner {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.file-input {
  display: none;
}

// 深色模式适配 - 流光玻璃风格
:root[data-theme="dark"] {
  .avatar-sticker {
    // 双层光环效果
    &::before,
    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: -1;
    }
    
    // 外层光环 - 青色
    &::before {
      inset: -14px;
      background: radial-gradient(
        circle,
        rgba(34, 211, 238, 0.35) 0%,
        rgba(34, 211, 238, 0.1) 40%,
        transparent 70%
      );
      animation: avatar-glow-outer 3s ease-in-out infinite;
    }
    
    // 内层光环 - 紫色
    &::after {
      inset: -22px;
      background: radial-gradient(
        circle,
        rgba(167, 139, 250, 0.25) 0%,
        rgba(167, 139, 250, 0.06) 45%,
        transparent 70%
      );
      animation: avatar-glow-inner 3s ease-in-out infinite;
      animation-delay: 1.5s;
    }
  }
  
  .sticker-body {
    border-color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 
      // 青色光晕
      0 0 0 2px rgba(34, 211, 238, 0.2),
      0 0 30px rgba(34, 211, 238, 0.15),
      // 深度阴影
      0 8px 24px rgba(0, 0, 0, 0.4);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  
  .avatar-sticker:hover .sticker-body {
    box-shadow: 
      0 0 0 3px rgba(34, 211, 238, 0.3),
      0 0 40px rgba(34, 211, 238, 0.25),
      0 0 60px rgba(167, 139, 250, 0.15),
      0 12px 32px rgba(0, 0, 0, 0.5);
  }
  
  .avatar-placeholder {
    background: linear-gradient(
      135deg,
      rgba(34, 211, 238, 0.15) 0%,
      rgba(167, 139, 250, 0.15) 100%
    );
  }
  
  .placeholder-icon {
    color: rgba(167, 139, 250, 0.6);
  }
  
  .upload-overlay {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
  
  .is-loading .upload-overlay {
    background: rgba(15, 23, 42, 0.8);
  }
  
  .upload-hint {
    filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.4));
  }
}

// 头像光环呼吸动画 - 外层
@keyframes avatar-glow-outer {
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.8;
  }
}

// 头像光环呼吸动画 - 内层
@keyframes avatar-glow-inner {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.65;
  }
}

// 减少动画偏好支持 - Requirements 6.4
@media (prefers-reduced-motion: reduce) {
  .avatar-sticker {
    transition: none;
    
    &.is-editable:hover:not(.is-loading) {
      transform: rotate(var(--rotation));
    }
  }
  
  .sticker-body,
  .placeholder-icon,
  .upload-hint,
  .upload-overlay {
    transition: none;
  }
  
  .spinner {
    animation: none;
  }
}

// 响应式
@include until-md {
  .size-lg {
    .sticker-body {
      width: 100px;
      height: 100px;
    }
    
    .placeholder-icon {
      width: 50px;
      height: 50px;
    }
  }
}
</style>
