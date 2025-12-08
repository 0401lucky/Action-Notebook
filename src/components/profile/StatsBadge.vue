<script setup lang="ts">
/**
 * StatsBadge 组件 - 手绘风格统计徽章
 * 
 * 功能：
 * - 手绘风格边框（CSS border-radius 变化）
 * - 数字计数动画（从 0 到目标值）
 * - 悬停印章按压效果
 * 
 * @module components/profile/StatsBadge
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
import { ref, computed, watch, onMounted } from 'vue'

// Props
interface Props {
  value: number
  label: string
  icon: string
  color?: string  // CSS 颜色值
  animate?: boolean  // 是否启用数字动画，默认 true
}

const props = withDefaults(defineProps<Props>(), {
  color: 'var(--color-primary)',
  animate: true
})

// 显示值（用于动画）
const displayValue = ref(0)

// 动画是否完成
const animationComplete = ref(false)

// 是否应该减少动画
const prefersReducedMotion = ref(false)

onMounted(() => {
  // 检测用户是否偏好减少动画
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mediaQuery.matches
  
  mediaQuery.addEventListener('change', (e) => {
    prefersReducedMotion.value = e.matches
  })
  
  // 初始化动画
  if (props.animate && !prefersReducedMotion.value) {
    animateValue(0, props.value, 1500)
  } else {
    displayValue.value = props.value
    animationComplete.value = true
  }
})

/**
 * 数字滚动动画
 * Property 4: Counting Animation Interpolation
 * 动画应从 0 插值到 N，最终显示值等于 N
 */
function animateValue(start: number, end: number, duration: number) {
  if (start === end) {
    displayValue.value = end
    animationComplete.value = true
    return
  }
  
  const range = end - start
  const startTime = performance.now()
  
  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Ease out quart - 缓出效果
    const ease = 1 - Math.pow(1 - progress, 4)
    
    displayValue.value = Math.floor(start + range * ease)
    
    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      displayValue.value = end
      animationComplete.value = true
    }
  }
  
  requestAnimationFrame(step)
}

// 监听 value 变化
watch(() => props.value, (newVal, oldVal) => {
  if (props.animate && !prefersReducedMotion.value) {
    animationComplete.value = false
    animateValue(oldVal || 0, newVal, 800)
  } else {
    displayValue.value = newVal
    animationComplete.value = true
  }
})

// 计算样式
const badgeStyle = computed(() => ({
  '--badge-color': props.color
}))

// 暴露给测试使用
defineExpose({
  displayValue,
  animationComplete,
  animateValue
})
</script>

<template>
  <div 
    class="stats-badge"
    :style="badgeStyle"
    role="group"
    :aria-label="`${label}: ${value}`"
  >
    <!-- 手绘风格边框容器 -->
    <div class="badge-container">
      <!-- 图标 -->
      <span class="badge-icon" aria-hidden="true">{{ icon }}</span>
      
      <!-- 数值 -->
      <span class="badge-value" :data-testid="`badge-value-${label}`">
        {{ displayValue }}
      </span>
      
      <!-- 标签 -->
      <span class="badge-label">{{ label }}</span>
    </div>
    
    <!-- 印章按压效果层 -->
    <div class="stamp-effect" aria-hidden="true"></div>
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.stats-badge {
  --badge-color: var(--color-primary);
  position: relative;
  display: inline-flex;
  cursor: default;
  
  // 悬停印章按压效果 - Requirements 3.4
  &:hover {
    .badge-container {
      transform: scale(0.95) rotate(-2deg);
      box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.1),
        0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    .stamp-effect {
      opacity: 1;
      transform: scale(1);
    }
    
    .badge-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }
  
  &:active {
    .badge-container {
      transform: scale(0.92) rotate(-3deg);
    }
  }
}

// 手绘风格边框容器 - Requirements 3.1
.badge-container {
  @include flex-column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--glass-bg);
  
  // 手绘风格边框 - 不规则圆角
  border-radius: 45% 55% 50% 50% / 50% 45% 55% 50%;
  border: 2px dashed var(--badge-color);
  
  // 纸张质感
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  // 手绘风格背景纹理
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(var(--badge-color), 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(var(--badge-color), 0.03) 0%, transparent 50%);
}

// 图标 - Requirements 3.2
.badge-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

// 数值 - Requirements 3.3
.badge-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--badge-color);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  
  // 手写风格
  font-family: 'Comic Sans MS', 'Chalkboard', 'Comic Neue', cursive, sans-serif;
  letter-spacing: -0.5px;
}

// 标签
.badge-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}

// 印章按压效果层
// Property 5: Decorative Non-Interference - 装饰元素不阻挡交互
.stamp-effect {
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 3px solid var(--badge-color);
  opacity: 0;
  transform: scale(1.1);
  transition: all 0.2s ease-out;
  pointer-events: none;  // 确保不阻挡交互 - Requirements 5.3
  
  // 印章墨迹效果
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--badge-color);
    opacity: 0.05;
    pointer-events: none;  // 伪元素也需要设置 - Requirements 5.3
  }
}

// 深色模式适配 - 流光玻璃风格
:root[data-theme="dark"] {
  .stats-badge {
    // 渐变色变量
    --gradient-start: var(--aurora-cyan, #22d3ee);
    --gradient-end: var(--aurora-violet, #a78bfa);
  }
  
  .badge-container {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 
      // 内发光
      inset 0 1px 1px rgba(255, 255, 255, 0.08),
      inset 0 0 20px rgba(255, 255, 255, 0.02),
      // 外阴影
      0 4px 16px rgba(0, 0, 0, 0.3);
    
    // 发光边框
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.12) 0%,
        rgba(255, 255, 255, 0.04) 100%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
  }
  
  // 渐变数字 - 视觉焦点
  .badge-value {
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.25));
  }
  
  .badge-label {
    color: rgba(203, 213, 225, 0.75);
  }
  
  .badge-icon {
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.15));
  }
  
  // 印章效果
  .stamp-effect {
    border-color: var(--gradient-start);
    
    &::before {
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      opacity: 0.08;
    }
  }
  
  // 悬停效果增强
  &:hover {
    .badge-container {
      background: rgba(255, 255, 255, 0.05);
      box-shadow: 
        inset 0 1px 2px rgba(255, 255, 255, 0.1),
        0 6px 24px rgba(0, 0, 0, 0.4),
        0 0 30px rgba(34, 211, 238, 0.08);
    }
  }
}

// 减少动画偏好支持 - Requirements 6.4
@media (prefers-reduced-motion: reduce) {
  .stats-badge {
    &:hover {
      .badge-container {
        transform: none;
      }
      
      .stamp-effect {
        opacity: 0;
      }
      
      .badge-icon {
        transform: none;
      }
    }
  }
  
  .badge-container,
  .badge-icon,
  .stamp-effect {
    transition: none;
  }
}

// 响应式
@include until-md {
  .badge-container {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .badge-icon {
    font-size: 24px;
  }
  
  .badge-value {
    font-size: var(--font-size-xl);
  }
  
  .badge-label {
    font-size: 10px;
  }
}

@include until-sm {
  .badge-container {
    flex-direction: row;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 40% 60% 55% 45% / 55% 40% 60% 45%;
  }
  
  .badge-icon {
    font-size: 20px;
  }
  
  .badge-value {
    font-size: var(--font-size-lg);
  }
}
</style>
