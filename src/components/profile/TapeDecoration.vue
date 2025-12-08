<script setup lang="ts">
/**
 * TapeDecoration 组件 - 胶带装饰
 * 
 * 功能：
 * - 模拟手帐中的和纸胶带效果
 * - 支持 5 种预设位置
 * - 支持多种颜色变体
 * - 半透明、条纹纹理效果
 * 
 * @module components/profile/TapeDecoration
 */
import { computed } from 'vue'

// Props 定义
export interface TapeDecorationProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center'
  color?: 'primary' | 'accent' | 'warning' | 'success'
  rotation?: number
}

const props = withDefaults(defineProps<TapeDecorationProps>(), {
  color: 'primary',
  rotation: undefined
})

// 计算旋转角度（如果未指定则随机生成 -15 到 15 度）
const computedRotation = computed(() => {
  if (props.rotation !== undefined) {
    return props.rotation
  }
  // 基于 position 生成伪随机但稳定的旋转角度
  const positionSeed: Record<string, number> = {
    'top-left': -12,
    'top-right': 8,
    'bottom-left': 15,
    'bottom-right': -10,
    'top-center': 3
  }
  return positionSeed[props.position] || 0
})

// 计算样式
const tapeStyle = computed(() => ({
  transform: `rotate(${computedRotation.value}deg)`
}))
</script>

<template>
  <div 
    class="tape-decoration"
    :class="[`tape--${position}`, `tape--${color}`]"
    :style="tapeStyle"
    aria-hidden="true"
  >
    <div class="tape-stripe"></div>
  </div>
</template>

<style scoped lang="scss">
// Property 5: Decorative Non-Interference - 装饰元素不阻挡交互
.tape-decoration {
  position: absolute;
  width: 80px;
  height: 24px;
  pointer-events: none;  // 确保不阻挡交互 - Requirements 5.3
  z-index: 10;
  
  // 胶带基础样式
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--tape-color) 5%,
    var(--tape-color) 95%,
    transparent 100%
  );
  opacity: 0.75;
  border-radius: 2px;
  
  // 胶带边缘撕裂效果
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 6px;
    background: inherit;
    opacity: 0.5;
    pointer-events: none;  // 伪元素也需要设置 - Requirements 5.3
  }
  
  &::before {
    left: -3px;
    clip-path: polygon(
      100% 0%, 100% 100%, 
      0% 90%, 30% 70%, 0% 50%, 30% 30%, 0% 10%
    );
  }
  
  &::after {
    right: -3px;
    clip-path: polygon(
      0% 0%, 0% 100%, 
      100% 90%, 70% 70%, 100% 50%, 70% 30%, 100% 10%
    );
  }
  
  // 条纹纹理
  .tape-stripe {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 3px,
      rgba(255, 255, 255, 0.15) 3px,
      rgba(255, 255, 255, 0.15) 6px
    );
    border-radius: inherit;
  }
}

// 位置变体
.tape--top-left {
  top: -8px;
  left: -16px;
}

.tape--top-right {
  top: -8px;
  right: -16px;
}

.tape--bottom-left {
  bottom: -8px;
  left: -16px;
}

.tape--bottom-right {
  bottom: -8px;
  right: -16px;
}

.tape--top-center {
  top: -8px;
  left: 50%;
  margin-left: -40px;
}

// 颜色变体
.tape--primary {
  --tape-color: var(--color-primary);
}

.tape--accent {
  --tape-color: var(--color-accent);
}

.tape--warning {
  --tape-color: var(--color-warning);
}

.tape--success {
  --tape-color: var(--color-success);
}

// 深色模式适配 - 磨砂胶带质感
[data-theme='dark'] {
  .tape-decoration {
    opacity: 0.55;
    // 磨砂玻璃效果
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    // 微弱发光
    filter: blur(0.2px);
    
    // 半透明磨砂背景
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--tape-color) 5%,
      var(--tape-color) 95%,
      transparent 100%
    );
    
    // 边缘柔化
    &::before,
    &::after {
      opacity: 0.4;
    }
    
    .tape-stripe {
      background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 4px,
        rgba(255, 255, 255, 0.06) 4px,
        rgba(255, 255, 255, 0.06) 8px
      );
    }
  }
  
  // 暗色模式颜色变体 - 更柔和的发光色
  .tape--primary {
    --tape-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.04);
  }
  
  .tape--accent {
    --tape-color: rgba(167, 139, 250, 0.18);
    box-shadow: 0 0 12px rgba(167, 139, 250, 0.06);
  }
  
  .tape--warning {
    --tape-color: rgba(251, 191, 36, 0.16);
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.05);
  }
  
  .tape--success {
    --tape-color: rgba(94, 234, 212, 0.16);
    box-shadow: 0 0 12px rgba(94, 234, 212, 0.05);
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .tape-decoration {
    transition: none;
  }
}

// 响应式适配 - 移动端缩小胶带尺寸
@media (max-width: 640px) {
  .tape-decoration {
    width: 60px;
    height: 18px;
  }
  
  .tape--top-left {
    top: -6px;
    left: -12px;
  }
  
  .tape--top-right {
    top: -6px;
    right: -12px;
  }
  
  .tape--bottom-left {
    bottom: -6px;
    left: -12px;
  }
  
  .tape--bottom-right {
    bottom: -6px;
    right: -12px;
  }
  
  .tape--top-center {
    top: -6px;
    margin-left: -30px;
  }
}

// 超小屏幕隐藏部分胶带装饰
@media (max-width: 480px) {
  .tape-decoration {
    width: 50px;
    height: 16px;
    opacity: 0.6;
  }
}
</style>
