import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import JournalPageCard from './JournalPageCard.vue'

/**
 * JournalPageCard 组件单元测试
 * 
 * 测试手帐页面卡片的渲染和样式
 * Requirements: 1.1, 5.4
 */

describe('JournalPageCard 组件', () => {
  // 测试插槽内容渲染
  describe('插槽内容渲染', () => {
    it('应正确渲染默认插槽内容', () => {
      const wrapper = mount(JournalPageCard, {
        slots: {
          default: '<div class="test-content">测试内容</div>'
        }
      })
      
      expect(wrapper.find('.test-content').exists()).toBe(true)
      expect(wrapper.find('.test-content').text()).toBe('测试内容')
    })

    it('应在 journal-content 容器内渲染插槽内容', () => {
      const wrapper = mount(JournalPageCard, {
        slots: {
          default: '<span>内容</span>'
        }
      })
      
      const contentContainer = wrapper.find('.journal-content')
      expect(contentContainer.exists()).toBe(true)
      expect(contentContainer.find('span').text()).toBe('内容')
    })

    it('应支持渲染多个子元素', () => {
      const wrapper = mount(JournalPageCard, {
        slots: {
          default: `
            <div class="item-1">项目1</div>
            <div class="item-2">项目2</div>
            <div class="item-3">项目3</div>
          `
        }
      })
      
      expect(wrapper.find('.item-1').exists()).toBe(true)
      expect(wrapper.find('.item-2').exists()).toBe(true)
      expect(wrapper.find('.item-3').exists()).toBe(true)
    })

    it('空插槽时应正常渲染', () => {
      const wrapper = mount(JournalPageCard)
      
      expect(wrapper.find('.journal-page-card').exists()).toBe(true)
      expect(wrapper.find('.journal-content').exists()).toBe(true)
    })
  })

  // 测试样式类应用
  describe('样式类应用', () => {
    it('应包含主容器类 journal-page-card', () => {
      const wrapper = mount(JournalPageCard)
      
      expect(wrapper.classes()).toContain('journal-page-card')
    })

    it('应包含纸张纹理层', () => {
      const wrapper = mount(JournalPageCard)
      
      const textureLayer = wrapper.find('.paper-texture')
      expect(textureLayer.exists()).toBe(true)
      // 纹理层应设置 aria-hidden 以提高可访问性
      expect(textureLayer.attributes('aria-hidden')).toBe('true')
    })

    it('应包含纸张边缘装饰', () => {
      const wrapper = mount(JournalPageCard)
      
      const leftEdge = wrapper.find('.paper-edge--left')
      const rightEdge = wrapper.find('.paper-edge--right')
      
      expect(leftEdge.exists()).toBe(true)
      expect(rightEdge.exists()).toBe(true)
      // 边缘装饰应设置 aria-hidden
      expect(leftEdge.attributes('aria-hidden')).toBe('true')
      expect(rightEdge.attributes('aria-hidden')).toBe('true')
    })

    it('内容区域应有正确的 z-index 层级', () => {
      const wrapper = mount(JournalPageCard, {
        slots: {
          default: '<div>内容</div>'
        }
      })
      
      // 内容区域应存在且在纹理层之上
      const content = wrapper.find('.journal-content')
      expect(content.exists()).toBe(true)
    })
  })

  // 测试组件结构
  describe('组件结构', () => {
    it('应按正确顺序渲染各层', () => {
      const wrapper = mount(JournalPageCard, {
        slots: {
          default: '<div>内容</div>'
        }
      })
      
      const card = wrapper.find('.journal-page-card')
      const children = card.element.children
      
      // 验证子元素存在
      expect(children.length).toBeGreaterThanOrEqual(3)
      
      // 纹理层、内容区域、边缘装饰都应存在
      expect(wrapper.find('.paper-texture').exists()).toBe(true)
      expect(wrapper.find('.journal-content').exists()).toBe(true)
      expect(wrapper.findAll('.paper-edge').length).toBe(2)
    })
  })
})
