<script setup lang="ts">
/**
 * JournalPageCard 组件 - 手帐页面卡片
 * 
 * 功能：
 * - 纸张纹理背景（CSS 点阵/网格图案）
 * - 微妙的纸张边缘效果
 * - 支持深色模式适配
 * 
 * @module components/profile/JournalPageCard
 */

// 无特殊 props，作为布局容器
// Slots: default - 卡片内容
</script>

<template>
  <div class="journal-page-card">
    <!-- 纸张纹理层 -->
    <div class="paper-texture" aria-hidden="true"></div>
    
    <!-- 内容区域 -->
    <div class="journal-content">
      <slot></slot>
    </div>
    
    <!-- 纸张边缘装饰 -->
    <div class="paper-edge paper-edge--left" aria-hidden="true"></div>
    <div class="paper-edge paper-edge--right" aria-hidden="true"></div>
  </div>
</template>

<style scoped lang="scss">
.journal-page-card {
  position: relative;
  background: var(--paper-bg, #fffef8);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  
  // 纸张基础效果 - 微微泛黄的纸张色
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 253, 240, 0.8) 0%,
      rgba(255, 255, 255, 0.9) 50%,
      rgba(255, 253, 240, 0.8) 100%
    );
    pointer-events: none;
    z-index: 0;
  }
}

// 纸张纹理层 - 点阵图案
// Property 5: Decorative Non-Interference - 装饰元素不阻挡交互
.paper-texture {
  position: absolute;
  inset: 0;
  pointer-events: none;  // 确保不阻挡交互 - Requirements 5.3
  z-index: 1;
  
  // 点阵图案
  background-image: radial-gradient(
    circle,
    var(--dot-color, rgba(99, 102, 241, 0.08)) 1px,
    transparent 1px
  );
  background-size: 16px 16px;
  background-position: 8px 8px;
  
  // 添加微妙的纸张纹理噪点
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;  // 伪元素也需要设置 - Requirements 5.3
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.02;
    mix-blend-mode: multiply;
  }
}

// 内容区域
.journal-content {
  position: relative;
  z-index: 2;
}

// 纸张边缘效果 - 模拟纸张厚度
.paper-edge {
  position: absolute;
  top: 8px;
  bottom: 8px;
  width: 3px;
  pointer-events: none;
  z-index: 0;
  
  &--left {
    left: 0;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.03),
      transparent
    );
    border-left: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  &--right {
    right: 0;
    background: linear-gradient(
      to left,
      rgba(0, 0, 0, 0.03),
      transparent
    );
    border-right: 1px solid rgba(0, 0, 0, 0.05);
  }
}

// 深色模式适配
[data-theme='dark'] {
  .journal-page-card {
    --paper-bg: #1e293b;
    --dot-color: rgba(129, 140, 248, 0.1);
    
    &::before {
      background: linear-gradient(
        135deg,
        rgba(30, 41, 59, 0.9) 0%,
        rgba(30, 41, 59, 0.95) 50%,
        rgba(30, 41, 59, 0.9) 100%
      );
    }
  }
  
  .paper-texture {
    &::after {
      opacity: 0.03;
      mix-blend-mode: screen;
    }
  }
  
  .paper-edge {
    &--left {
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0.03),
        transparent
      );
      border-left-color: rgba(255, 255, 255, 0.05);
    }
    
    &--right {
      background: linear-gradient(
        to left,
        rgba(255, 255, 255, 0.03),
        transparent
      );
      border-right-color: rgba(255, 255, 255, 0.05);
    }
  }
}

// 响应式适配 - 平板端
@media (max-width: 768px) {
  .journal-page-card {
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
  }
  
  .paper-texture {
    background-size: 14px 14px;
  }
}

// 响应式适配 - 手机端
@media (max-width: 640px) {
  .journal-page-card {
    padding: var(--spacing-md);
    border-radius: var(--radius-sm);
  }
  
  .paper-texture {
    background-size: 12px 12px;
    background-position: 6px 6px;
  }
  
  .paper-edge {
    width: 2px;
    top: 4px;
    bottom: 4px;
  }
}

// 响应式适配 - 超小屏幕
@media (max-width: 480px) {
  .journal-page-card {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-md);
  }
  
  .paper-texture {
    // 简化纹理以提升性能
    background-size: 10px 10px;
    
    &::after {
      display: none;
    }
  }
  
  .paper-edge {
    display: none;
  }
}
</style>
