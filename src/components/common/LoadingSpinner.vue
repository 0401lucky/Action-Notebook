<template>
  <div class="loading-spinner" :class="[`size-${size}`]">
    <span class="hourglass spin-animation">⏳</span>
    <div class="arc spin-animation"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * LoadingSpinner 加载动画组件
 * 沙漏 + 旋转圆弧的加载效果
 */

interface Props {
  /** 尺寸: sm | md | lg */
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  size: 'md'
})
</script>

<style lang="scss">
.loading-spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  --arc-thickness: 5px;
  
  &.size-sm {
    width: 56px;
    height: 56px;
    .hourglass { font-size: 20px; }
    --arc-thickness: 4px;
  }
  
  &.size-md {
    width: 120px;
    height: 120px;
    .hourglass { font-size: 34px; }
    --arc-thickness: 6px;
  }
  
  &.size-lg {
    width: 170px;
    height: 170px;
    .hourglass { font-size: 64px; }
    --arc-thickness: 8px;
  }
  
  .hourglass {
    display: inline-block;
    z-index: 2;
  }

  .arc {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-sizing: border-box;
    background: conic-gradient(
      var(--color-primary) 0deg,
      var(--color-primary) var(--arc-progress),
      transparent var(--arc-progress),
      transparent 360deg
    );
    mask: radial-gradient(
      farthest-side,
      transparent calc(50% - var(--arc-thickness)),
      #000 calc(50% - var(--arc-thickness) + 1px),
      #000 50%,
      transparent 50%
    );
    -webkit-mask: radial-gradient(
      farthest-side,
      transparent calc(50% - var(--arc-thickness)),
      #000 calc(50% - var(--arc-thickness) + 1px),
      #000 50%,
      transparent 50%
    );
    animation: arc-fill 1.4s ease-in-out infinite;
  }
}

@property --arc-progress {
  syntax: '<angle>';
  inherits: false;
  initial-value: 45deg;
}

@keyframes arc-fill {
  0%   { --arc-progress: 45deg; }
  50%  { --arc-progress: 320deg; }
  100% { --arc-progress: 360deg; }
}
</style>
