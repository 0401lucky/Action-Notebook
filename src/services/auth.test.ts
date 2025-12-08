import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateEmail, mapSupabaseError, isChineseMessage } from './auth'

// Arbitraries (生成器)

/**
 * 生成无效邮箱格式的字符串
 * - 不包含 @ 符号
 * - 或者 @ 后面没有点号
 * - 或者是空字符串/纯空白
 */
const invalidEmailArb: fc.Arbitrary<string> = fc.oneof(
  // 不包含 @ 的字符串
  fc.string().filter(s => !s.includes('@')),
  // 包含 @ 但 @ 后面没有点号
  fc.tuple(
    fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes('.')),
    fc.string().filter(s => !s.includes('.'))
  ).map(([local, domain]) => `${local}@${domain}`),
  // 空字符串
  fc.constant(''),
  // 纯空白字符串
  fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
  // @ 在开头
  fc.string().map(s => `@${s.replace('@', '')}`),
  // @ 在结尾
  fc.string().map(s => `${s.replace('@', '')}@`),
  // 多个 @ 符号
  fc.tuple(fc.string(), fc.string(), fc.string()).map(([a, b, c]) => `${a}@${b}@${c}`),
  // 点号在 @ 之前但 @ 之后没有点号
  fc.tuple(
    fc.string({ minLength: 1 }).filter(s => !s.includes('@')),
    fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes('.'))
  ).map(([local, domain]) => `${local}.test@${domain}`)
)

/**
 * 生成有效邮箱格式的字符串
 */
const validEmailArb: fc.Arbitrary<string> = fc.tuple(
  // 本地部分：字母数字和一些特殊字符
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789._-'), { minLength: 1, maxLength: 20 })
    .filter(s => s.length > 0 && !s.startsWith('.') && !s.endsWith('.') && !s.includes('..')),
  // 域名部分
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'), { minLength: 1, maxLength: 10 })
    .filter(s => s.length > 0 && !s.startsWith('-') && !s.endsWith('-')),
  // 顶级域名
  fc.constantFrom('com', 'org', 'net', 'cn', 'io', 'co')
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

/**
 * Supabase 错误码生成器
 */
const supabaseErrorCodeArb: fc.Arbitrary<string> = fc.constantFrom(
  'invalid_email',
  'user_not_found',
  'email_exists',
  'invalid_otp',
  'otp_expired',
  'over_request_rate_limit',
  'email_not_confirmed',
  'invalid_credentials',
  'signup_disabled',
  'email_address_invalid',
  'otp_disabled'
)

/**
 * 模拟 Supabase AuthError
 */
const supabaseAuthErrorArb: fc.Arbitrary<{ code: string; message: string }> = fc.record({
  code: supabaseErrorCodeArb,
  message: fc.string()
})

describe('AuthService Property Tests', () => {
  /**
   * **Feature: user-auth, Property 1: 邮箱格式验证拒绝无效格式**
   * *对于任意*不符合有效邮箱模式的字符串（缺少@、无效域名等），
   * 邮箱验证函数应返回 false 并阻止表单提交。
   * **Validates: Requirements 1.2**
   */
  it('Property 1: Email validation rejects invalid formats', () => {
    fc.assert(
      fc.property(
        invalidEmailArb,
        (invalidEmail) => {
          const result = validateEmail(invalidEmail)
          expect(result).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 补充测试：有效邮箱应该通过验证
   */
  it('Valid emails should pass validation', () => {
    fc.assert(
      fc.property(
        validEmailArb,
        (validEmail) => {
          const result = validateEmail(validEmail)
          expect(result).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: user-auth, Property 6: 错误消息为中文**
   * *对于任意*认证错误，显示的错误消息应包含中文字符且对用户友好（非原始错误码）。
   * **Validates: Requirements 6.3**
   */
  it('Property 6: Error messages are in Chinese', () => {
    fc.assert(
      fc.property(
        supabaseAuthErrorArb,
        (error) => {
          const message = mapSupabaseError(error as any)
          // 验证消息包含中文字符
          expect(isChineseMessage(message)).toBe(true)
          // 验证消息不是原始错误码
          expect(message).not.toBe(error.code)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 补充测试：null 错误也应返回中文消息
   */
  it('Null error returns Chinese message', () => {
    const message = mapSupabaseError(null)
    expect(isChineseMessage(message)).toBe(true)
  })

  /**
   * 补充测试：未知错误也应返回中文消息
   */
  it('Unknown error returns Chinese message', () => {
    fc.assert(
      fc.property(
        fc.record({
          code: fc.string().filter(s => !['invalid_email', 'user_not_found', 'email_exists', 'invalid_otp', 'otp_expired', 'over_request_rate_limit'].includes(s)),
          message: fc.string().filter(s => !s.toLowerCase().includes('email') && !s.toLowerCase().includes('otp') && !s.toLowerCase().includes('rate'))
        }),
        (unknownError) => {
          const message = mapSupabaseError(unknownError as any)
          expect(isChineseMessage(message)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })
})
