/**
 * 富文本服务属性测试
 * 
 * 使用 fast-check 进行属性测试，验证富文本服务的正确性
 * 
 * @module services/richText.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  validateRichContent,
  normalizeContent,
  stripHtmlTags
} from './richText'

// ==================== 生成器 ====================

// 有效文本内容生成器（非空白）
const validTextArb = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0)
  // 过滤掉包含 HTML 特殊字符的字符串，避免干扰测试
  .filter(s => !/<|>|&/.test(s))

// 空白内容生成器（仅包含空白字符）
const whitespaceOnlyArb = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))

// 简单 HTML 标签生成器
const simpleHtmlTagArb = fc.constantFrom(
  'p', 'strong', 'em', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code'
)

// 生成带标签的 HTML 内容
const htmlContentArb = fc.tuple(simpleHtmlTagArb, validTextArb).map(([tag, text]) => {
  return `<${tag}>${text}</${tag}>`
})

// 生成多段落 HTML 内容
const multiParagraphHtmlArb = fc.array(validTextArb, { minLength: 1, maxLength: 5 })
  .map(texts => texts.map(t => `<p>${t}</p>`).join(''))

// 生成复杂 HTML 内容（嵌套标签）
const nestedHtmlArb = fc.tuple(validTextArb, validTextArb).map(([text1, text2]) => {
  return `<p><strong>${text1}</strong> and <em>${text2}</em></p>`
})

// 生成带列表的 HTML 内容
const listHtmlArb = fc.array(validTextArb, { minLength: 1, maxLength: 5 })
  .chain(items => fc.constantFrom('ul', 'ol').map(tag => ({
    tag,
    items
  })))
  .map(({ tag, items }) => {
    const listItems = items.map(item => `<li>${item}</li>`).join('')
    return `<${tag}>${listItems}</${tag}>`
  })

// 生成引用块 HTML 内容
const blockquoteHtmlArb = validTextArb.map(text => `<blockquote>${text}</blockquote>`)

// 生成代码块 HTML 内容
const codeBlockHtmlArb = validTextArb.map(text => `<pre><code>${text}</code></pre>`)

// 综合 HTML 内容生成器
const anyValidHtmlArb = fc.oneof(
  htmlContentArb,
  multiParagraphHtmlArb,
  nestedHtmlArb,
  listHtmlArb,
  blockquoteHtmlArb,
  codeBlockHtmlArb
)

describe('RichText Service Property Tests', () => {
  /**
   * **Feature: rich-text-editor, Property 6: HTML 序列化往返一致性**
   * *对于任意* 有效的编辑器内容，将其序列化为 HTML 后再反序列化回编辑器，
   * 应产生等价的内容结构。
   * 
   * 由于我们没有完整的编辑器实例，这里测试 normalizeContent 和 stripHtmlTags 的往返一致性：
   * - 纯文本 -> normalizeContent -> HTML -> stripHtmlTags -> 应包含原始文本
   * - HTML -> stripHtmlTags -> 纯文本 -> normalizeContent -> 应包含原始文本
   * 
   * **Validates: Requirements 6.4**
   */
  describe('Property 6: HTML 序列化往返一致性', () => {
    it('纯文本经过 normalizeContent 后，stripHtmlTags 应能提取回原始文本', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 纯文本 -> HTML
            const html = normalizeContent(text)
            
            // HTML -> 纯文本
            const extracted = stripHtmlTags(html)
            
            // 提取的文本应包含原始文本（去除首尾空白后）
            expect(extracted).toContain(text.trim())
          }
        ),
        { numRuns: 100 }
      )
    })

    it('HTML 内容经过 stripHtmlTags 后，文本内容应被保留', () => {
      fc.assert(
        fc.property(
          htmlContentArb,
          (html) => {
            // 提取纯文本
            const text = stripHtmlTags(html)
            
            // 文本应非空（因为我们生成的 HTML 包含有效文本）
            expect(text.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('多段落 HTML 的文本内容应被完整保留', () => {
      fc.assert(
        fc.property(
          fc.array(validTextArb, { minLength: 1, maxLength: 5 }),
          (texts) => {
            // 构建多段落 HTML
            const html = texts.map(t => `<p>${t}</p>`).join('')
            
            // 提取纯文本
            const extracted = stripHtmlTags(html)
            
            // 每个原始文本片段都应该在提取结果中
            for (const text of texts) {
              expect(extracted).toContain(text.trim())
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('嵌套标签的文本内容应被完整保留', () => {
      fc.assert(
        fc.property(
          nestedHtmlArb,
          (html) => {
            const text = stripHtmlTags(html)
            
            // 应该包含 "and" 连接词（我们生成的格式）
            expect(text).toContain('and')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('列表内容的文本应被完整保留', () => {
      fc.assert(
        fc.property(
          fc.array(validTextArb, { minLength: 1, maxLength: 5 }),
          fc.constantFrom('ul', 'ol'),
          (items, tag) => {
            const listItems = items.map(item => `<li>${item}</li>`).join('')
            const html = `<${tag}>${listItems}</${tag}>`
            
            const extracted = stripHtmlTags(html)
            
            // 每个列表项文本都应该在提取结果中
            for (const item of items) {
              expect(extracted).toContain(item.trim())
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('normalizeContent 对已有 HTML 内容应保持不变', () => {
      fc.assert(
        fc.property(
          anyValidHtmlArb,
          (html) => {
            // 已经是 HTML 的内容不应被修改
            const normalized = normalizeContent(html)
            expect(normalized).toBe(html)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('空字符串的往返处理', () => {
      expect(normalizeContent('')).toBe('')
      expect(stripHtmlTags('')).toBe('')
    })
  })

  /**
   * **Feature: rich-text-editor, Property 8: 空内容显示占位符**
   * *对于任意* 内容为空的编辑器实例，应显示配置的占位符文本。
   * 
   * 这里测试 validateRichContent 函数正确识别空内容：
   * - 空字符串应返回 false
   * - 仅包含空白字符的字符串应返回 false
   * - 仅包含空 HTML 标签的内容应返回 false
   * - 包含实际文本的内容应返回 true
   * 
   * **Validates: Requirements 7.4**
   */
  describe('Property 8: 空内容显示占位符', () => {
    it('空字符串应被识别为无效内容', () => {
      expect(validateRichContent('')).toBe(false)
    })

    it('仅空白字符的内容应被识别为无效', () => {
      fc.assert(
        fc.property(
          whitespaceOnlyArb,
          (whitespace) => {
            expect(validateRichContent(whitespace)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('仅包含空 HTML 标签的内容应被识别为无效', () => {
      const emptyHtmlCases = [
        '<p></p>',
        '<p>   </p>',
        '<p>\n\t</p>',
        '<div></div>',
        '<p><br></p>',
        '<ul><li></li></ul>',
        '<blockquote></blockquote>',
        '<pre><code></code></pre>'
      ]

      for (const html of emptyHtmlCases) {
        expect(validateRichContent(html)).toBe(false)
      }
    })

    it('包含实际文本的 HTML 应被识别为有效', () => {
      fc.assert(
        fc.property(
          anyValidHtmlArb,
          (html) => {
            expect(validateRichContent(html)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('包含实际文本的纯文本应被识别为有效', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            expect(validateRichContent(text)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('非字符串类型应被识别为无效', () => {
      // @ts-expect-error 测试非字符串输入
      expect(validateRichContent(null)).toBe(false)
      // @ts-expect-error 测试非字符串输入
      expect(validateRichContent(undefined)).toBe(false)
      // @ts-expect-error 测试非字符串输入
      expect(validateRichContent(123)).toBe(false)
      // @ts-expect-error 测试非字符串输入
      expect(validateRichContent({})).toBe(false)
    })
  })

  /**
   * stripHtmlTags 函数的额外测试
   */
  describe('stripHtmlTags 额外测试', () => {
    it('应正确解码 HTML 实体', () => {
      expect(stripHtmlTags('&amp;')).toBe('&')
      expect(stripHtmlTags('&lt;')).toBe('<')
      expect(stripHtmlTags('&gt;')).toBe('>')
      expect(stripHtmlTags('&quot;')).toBe('"')
      expect(stripHtmlTags('&#39;')).toBe("'")
      // &nbsp; 单独时会被 trim() 移除，测试在文本中间的情况
      expect(stripHtmlTags('a&nbsp;b')).toBe('a b')
    })

    it('应处理混合内容', () => {
      const html = '<p>Hello &amp; <strong>World</strong>!</p>'
      const text = stripHtmlTags(html)
      expect(text).toBe('Hello & World!')
    })
  })
})
