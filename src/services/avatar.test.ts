import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  validateFile, 
  isValidMimeType,
  ALLOWED_FORMATS,
  MAX_FILE_SIZE 
} from './avatar'

/**
 * 创建模拟 File 对象
 */
function createMockFile(
  name: string, 
  size: number, 
  type: string
): File {
  // 创建指定大小的内容
  const content = new Uint8Array(Math.min(size, 1024)) // 限制实际内容大小
  const blob = new Blob([content], { type })
  
  // 创建 File 对象并覆盖 size 属性
  const file = new File([blob], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  
  return file
}

describe('AvatarService', () => {
  describe('validateFile', () => {
    // **Feature: user-profile, Property 6: 无效文件格式拒绝**
    // *对于任意* 非 JPG/PNG 格式的文件，头像验证应返回格式错误
    // **验证: 需求 3.3**
    it('Property 6: 无效文件格式拒绝 - 非JPG/PNG格式应验证失败', () => {
      // 定义无效的 MIME 类型
      const invalidMimeTypes = [
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml',
        'image/tiff',
        'application/pdf',
        'text/plain',
        'video/mp4',
        'audio/mp3'
      ]

      fc.assert(
        fc.property(
          fc.constantFrom(...invalidMimeTypes),
          fc.nat({ max: MAX_FILE_SIZE - 1 }).map(n => n + 1), // 1 到 MAX_FILE_SIZE
          fc.string({ minLength: 1, maxLength: 50 }),
          (mimeType, fileSize, fileName) => {
            const file = createMockFile(
              `${fileName}.gif`, 
              fileSize, 
              mimeType
            )
            
            const result = validateFile(file)
            
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
            expect(result.error).toContain('格式')
          }
        ),
        { numRuns: 100 }
      )
    })

    // 补充测试：有效格式应通过验证
    it('有效格式（JPG/PNG）且大小合适应验证通过', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALLOWED_FORMATS),
          fc.nat({ max: MAX_FILE_SIZE - 1 }).map(n => n + 1), // 1 到 MAX_FILE_SIZE
          fc.string({ minLength: 1, maxLength: 50 }),
          (mimeType, fileSize, fileName) => {
            const ext = mimeType === 'image/jpeg' ? '.jpg' : '.png'
            const file = createMockFile(
              `${fileName}${ext}`, 
              fileSize, 
              mimeType
            )
            
            const result = validateFile(file)
            
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    // 补充测试：超大文件应拒绝
    it('超过5MB的文件应验证失败', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALLOWED_FORMATS),
          fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 3 }),
          (mimeType, fileSize) => {
            const file = createMockFile('test.jpg', fileSize, mimeType)
            
            const result = validateFile(file)
            
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
            expect(result.error).toContain('5MB')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isValidMimeType', () => {
    it('应正确识别有效的 MIME 类型', () => {
      expect(isValidMimeType('image/jpeg')).toBe(true)
      expect(isValidMimeType('image/png')).toBe(true)
    })

    it('应正确拒绝无效的 MIME 类型', () => {
      expect(isValidMimeType('image/gif')).toBe(false)
      expect(isValidMimeType('image/webp')).toBe(false)
      expect(isValidMimeType('application/pdf')).toBe(false)
    })
  })
})
