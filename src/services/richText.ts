/**
 * 富文本工具服务
 * 
 * 提供富文本内容的验证、转换和处理功能
 * 
 * @module services/richText
 */

/**
 * 验证 HTML 内容是否有效（非空白）
 * 移除 HTML 标签后检查是否有实际文本内容
 * 
 * @param html - HTML 格式的内容
 * @returns 是否有效（包含非空白文本）
 * 
 * Requirements: 6.1
 */
export function validateRichContent(html: string): boolean {
  if (typeof html !== 'string') {
    return false
  }
  
  // 移除 HTML 标签后检查是否有实际内容
  const textContent = stripHtmlTags(html)
  return textContent.length > 0
}

/**
 * 将纯文本转换为 HTML 兼容格式
 * 如果内容不包含 HTML 标签，则包装为段落标签
 * 用于向后兼容旧的纯文本数据
 * 
 * @param content - 原始内容（可能是纯文本或 HTML）
 * @returns HTML 格式的内容
 * 
 * Requirements: 6.2
 */
export function normalizeContent(content: string): string {
  if (!content) {
    return ''
  }
  
  // 如果不包含 HTML 标签，视为纯文本，包装为段落
  if (!/<[^>]+>/.test(content)) {
    // 将换行符转换为段落分隔
    const paragraphs = content.split(/\n\n+/)
    return paragraphs
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('')
  }
  
  return content
}

/**
 * 移除 HTML 标签，提取纯文本内容
 * 用于预览显示和内容验证
 * 
 * @param html - HTML 格式的内容
 * @returns 纯文本内容
 * 
 * Requirements: 6.2
 */
export function stripHtmlTags(html: string): string {
  if (!html) {
    return ''
  }
  
  // 移除所有 HTML 标签
  let text = html.replace(/<[^>]*>/g, '')
  
  // 解码常见的 HTML 实体
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // 去除首尾空白
  return text.trim()
}

/**
 * 富文本服务对象
 * 提供所有富文本相关操作的统一接口
 */
export const RichTextService = {
  validateRichContent,
  normalizeContent,
  stripHtmlTags
}
