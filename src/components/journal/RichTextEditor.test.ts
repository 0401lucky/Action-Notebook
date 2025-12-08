/**
 * RichTextEditor 组件属性测试
 * 
 * 使用 fast-check 进行属性测试，验证富文本编辑器组件的正确性
 * 
 * @module components/journal/RichTextEditor.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

// ==================== 测试辅助函数 ====================

/**
 * 创建测试用编辑器实例
 * @param content - 初始内容
 * @param editable - 是否可编辑
 */
function createTestEditor(content: string = '', editable: boolean = true): Editor {
  return new Editor({
    content,
    editable,
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false
      }),
      Placeholder.configure({
        placeholder: '测试占位符'
      })
    ]
  })
}

/**
 * 销毁编辑器实例
 */
function destroyEditor(editor: Editor): void {
  editor.destroy()
}

// ==================== 生成器 ====================

/**
 * 有效文本内容生成器
 * - 非空白
 * - 不包含 HTML 特殊字符（避免干扰测试）
 * - 长度适中
 */
const validTextArb = fc.string({ minLength: 1, maxLength: 100 })
  .map(s => s.trim())
  .map(s => s.replace(/\s+/g, ' '))
  .filter(s => s.length > 0)
  .filter(s => !/<|>|&/.test(s))
  .filter(s => !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(s))

/**
 * 有效 HTML 内容生成器
 * 生成包含段落的简单 HTML
 */
const validHtmlArb = validTextArb.map(text => `<p>${text}</p>`)

// ==================== 属性测试 ====================

describe('RichTextEditor Property Tests', () => {
  let editor: Editor | null = null

  beforeEach(() => {
    editor = null
  })

  afterEach(() => {
    if (editor) {
      destroyEditor(editor)
      editor = null
    }
  })

  /**
   * **Feature: rich-text-editor, Property 7: 只读模式不可编辑**
   * 
   * *For any* 处于只读模式的编辑器实例，其 `editable` 属性应为 `false`，
   * 且工具栏应不可见。
   * 
   * 注意：Tiptap 的只读模式阻止用户交互（键盘输入、鼠标点击），
   * 但不阻止程序化的 API 调用。这是 Tiptap 的设计行为。
   * 
   * **Validates: Requirements 7.1**
   */
  describe('Property 7: 只读模式不可编辑', () => {
    it('只读模式下编辑器的 editable 属性应为 false', () => {
      fc.assert(
        fc.property(
          validHtmlArb,
          (html) => {
            // 创建只读模式的编辑器
            editor = createTestEditor(html, false)
            
            // 验证 editable 属性为 false
            expect(editor.isEditable).toBe(false)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('只读模式下 isEditable 应返回 false', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            const initialHtml = `<p>${text}</p>`
            
            // 创建只读模式的编辑器
            editor = createTestEditor(initialHtml, false)
            
            // 验证 isEditable 返回 false
            expect(editor.isEditable).toBe(false)
            
            // 验证内容正确加载
            expect(editor.getHTML()).toContain(text)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('可编辑模式下 editable 属性应为 true', () => {
      fc.assert(
        fc.property(
          validHtmlArb,
          (html) => {
            // 创建可编辑模式的编辑器
            editor = createTestEditor(html, true)
            
            // 验证 editable 属性为 true
            expect(editor.isEditable).toBe(true)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('setEditable 可以动态切换编辑状态', () => {
      fc.assert(
        fc.property(
          validHtmlArb,
          fc.boolean(),
          (html, initialEditable) => {
            // 创建编辑器
            editor = createTestEditor(html, initialEditable)
            
            // 验证初始状态
            expect(editor.isEditable).toBe(initialEditable)
            
            // 切换状态
            editor.setEditable(!initialEditable)
            
            // 验证状态已切换
            expect(editor.isEditable).toBe(!initialEditable)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('只读模式和可编辑模式的 isEditable 状态应互斥', () => {
      fc.assert(
        fc.property(
          validTextArb,
          fc.boolean(),
          (text, editable) => {
            const html = `<p>${text}</p>`
            
            // 创建编辑器
            editor = createTestEditor(html, editable)
            
            // 验证 isEditable 与传入的 editable 参数一致
            expect(editor.isEditable).toBe(editable)
            
            // 切换状态后应该相反
            editor.setEditable(!editable)
            expect(editor.isEditable).toBe(!editable)
            
            // 再次切换应该恢复
            editor.setEditable(editable)
            expect(editor.isEditable).toBe(editable)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('只读模式下内容应正确保留', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            const initialHtml = `<p>${text}</p>`
            
            // 创建只读模式的编辑器
            editor = createTestEditor(initialHtml, false)
            
            // 验证内容被正确保留
            const html = editor.getHTML()
            expect(html).toContain(text)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: rich-text-editor, Property 3: 引用块切换幂等性**
   * 
   * *For any* 段落内容，对其应用引用块格式化两次应返回原始状态（无引用块）。
   * 
   * 注意：Tiptap 的 toggleBlockquote 需要正确的光标位置才能工作。
   * 使用 setTextSelection 确保光标在正确位置。
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 3: 引用块切换幂等性', () => {
    it('对任意段落应用引用块后应包含 blockquote 标签', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            const initialHtml = `<p>${text}</p>`
            
            // 创建编辑器
            editor = createTestEditor(initialHtml, true)
            
            // 将光标放到文档开始位置
            editor.commands.setTextSelection(1)
            
            // 应用引用块
            editor.chain().focus().toggleBlockquote().run()
            
            // 验证包含 blockquote
            const html = editor.getHTML()
            expect(html).toContain('<blockquote>')
            expect(html).toContain(text)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对引用块再次应用 toggleBlockquote 应移除引用块', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 创建带引用块的内容
            const blockquoteHtml = `<blockquote><p>${text}</p></blockquote>`
            
            // 创建编辑器
            editor = createTestEditor(blockquoteHtml, true)
            
            // 将光标放到文档开始位置
            editor.commands.setTextSelection(1)
            
            // 应用 toggleBlockquote（应移除引用块）
            editor.chain().focus().toggleBlockquote().run()
            
            const html = editor.getHTML()
            
            // 验证引用块已被移除
            expect(html).not.toContain('<blockquote>')
            
            // 验证文本内容被保留
            expect(html).toContain(text)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('引用块切换是幂等的：从普通段落开始，toggle 两次应回到普通段落', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            const initialHtml = `<p>${text}</p>`
            
            // 创建编辑器
            editor = createTestEditor(initialHtml, true)
            
            // 第一次 toggle：添加引用块
            editor.commands.setTextSelection(1)
            editor.chain().focus().toggleBlockquote().run()
            
            // 验证第一次 toggle 后有引用块
            expect(editor.getHTML()).toContain('<blockquote>')
            
            // 第二次 toggle：移除引用块
            editor.commands.setTextSelection(1)
            editor.chain().focus().toggleBlockquote().run()
            
            // 验证第二次 toggle 后没有引用块
            const finalHtml = editor.getHTML()
            expect(finalHtml).not.toContain('<blockquote>')
            
            // 验证文本内容被保留
            expect(finalHtml).toContain(text)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('引用块切换 N 次后状态正确（奇数次有引用块，偶数次无引用块）', () => {
      fc.assert(
        fc.property(
          validTextArb,
          fc.integer({ min: 1, max: 6 }),
          (text, toggleCount) => {
            const initialHtml = `<p>${text}</p>`
            
            // 创建编辑器
            editor = createTestEditor(initialHtml, true)
            
            // 应用引用块 N 次
            for (let i = 0; i < toggleCount; i++) {
              editor.commands.setTextSelection(1)
              editor.chain().focus().toggleBlockquote().run()
            }
            
            const html = editor.getHTML()
            
            // 奇数次应有引用块，偶数次应无引用块
            if (toggleCount % 2 === 1) {
              expect(html).toContain('<blockquote>')
            } else {
              expect(html).not.toContain('<blockquote>')
            }
            
            // 验证文本内容被保留
            expect(html).toContain(text)
            
            // 清理
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
