/**
 * 微交互动画组合式函数
 * 提供任务完成、列表进入/离开、按钮点击、卡片悬停等动画控制
 */

export interface UseAnimationOptions {
  duration?: number      // 动画时长，默认 300ms
  easing?: string        // 缓动函数，默认 'ease-out'
}

export interface UseAnimationReturn {
  // 触发任务完成动画
  animateTaskComplete: (el: HTMLElement) => Promise<void>
  // 触发列表项进入动画
  animateListEnter: (el: HTMLElement, index: number) => void
  // 触发列表项离开动画
  animateListLeave: (el: HTMLElement) => Promise<void>
  // 触发按钮点击动画
  animateButtonPress: (el: HTMLElement) => void
  // 触发卡片悬停动画
  animateCardHover: (el: HTMLElement, isHover: boolean) => void
  // 创建涟漪效果
  createRipple: (el: HTMLElement, event: MouseEvent) => void
}

const defaultOptions: UseAnimationOptions = {
  duration: 300,
  easing: 'ease-out'
}

export function useAnimation(options: UseAnimationOptions = {}): UseAnimationReturn {
  const { duration, easing } = { ...defaultOptions, ...options }

  /**
   * 触发任务完成动画
   * 包含复选框弹跳和脉冲效果
   */
  const animateTaskComplete = (el: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      // 添加复选框弹跳动画类
      el.classList.add('task-checkbox-animate')
      
      // 添加脉冲效果
      el.classList.add('task-complete-pulse')
      
      // 动画结束后移除类
      const handleAnimationEnd = () => {
        el.classList.remove('task-checkbox-animate')
        el.classList.remove('task-complete-pulse')
        el.removeEventListener('animationend', handleAnimationEnd)
        resolve()
      }
      
      el.addEventListener('animationend', handleAnimationEnd)
      
      // 超时保护
      setTimeout(() => {
        el.classList.remove('task-checkbox-animate')
        el.classList.remove('task-complete-pulse')
        resolve()
      }, duration + 400)
    })
  }

  /**
   * 触发列表项进入动画
   * 支持交错延迟效果
   */
  const animateListEnter = (el: HTMLElement, index: number): void => {
    // 设置初始状态
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.transition = `all ${duration}ms ${easing}`
    
    // 计算交错延迟
    const delay = Math.min(index * 50, 300) // 最大延迟 300ms
    
    // 使用 requestAnimationFrame 确保初始状态已应用
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      }, delay)
    })
    
    // 动画结束后清理内联样式
    setTimeout(() => {
      el.style.transition = ''
      el.style.opacity = ''
      el.style.transform = ''
    }, duration + delay + 50)
  }

  /**
   * 触发列表项离开动画
   */
  const animateListLeave = (el: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      el.style.transition = `all ${duration}ms ${easing}`
      el.style.opacity = '0'
      el.style.transform = 'translateX(20px)'
      
      setTimeout(() => {
        resolve()
      }, duration)
    })
  }

  /**
   * 触发按钮点击动画
   */
  const animateButtonPress = (el: HTMLElement): void => {
    // 添加按压动画类
    el.classList.add('btn-press-animate')
    
    // 动画结束后移除类
    const handleAnimationEnd = () => {
      el.classList.remove('btn-press-animate')
      el.removeEventListener('animationend', handleAnimationEnd)
    }
    
    el.addEventListener('animationend', handleAnimationEnd)
    
    // 超时保护
    setTimeout(() => {
      el.classList.remove('btn-press-animate')
    }, 250)
  }

  /**
   * 触发卡片悬停动画
   */
  const animateCardHover = (el: HTMLElement, isHover: boolean): void => {
    if (isHover) {
      el.style.transform = 'translateY(-4px)'
      el.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
    } else {
      el.style.transform = ''
      el.style.boxShadow = ''
    }
  }

  /**
   * 创建涟漪效果
   */
  const createRipple = (el: HTMLElement, event: MouseEvent): void => {
    // 确保元素有相对定位和溢出隐藏
    const computedStyle = window.getComputedStyle(el)
    if (computedStyle.position === 'static') {
      el.style.position = 'relative'
    }
    el.style.overflow = 'hidden'
    
    // 创建涟漪元素
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    
    // 计算涟漪大小和位置
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    
    el.appendChild(ripple)
    
    // 动画结束后移除涟漪元素
    setTimeout(() => {
      ripple.remove()
    }, 600)
  }

  return {
    animateTaskComplete,
    animateListEnter,
    animateListLeave,
    animateButtonPress,
    animateCardHover,
    createRipple
  }
}

export default useAnimation
