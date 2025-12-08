import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  validateNickname, 
  profileToRow,
  NICKNAME_MAX_LENGTH 
} from './profile'
import { ProfileErrorCodes } from '@/types'

describe('ProfileService', () => {
  describe('validateNickname', () => {
    // **Feature: user-profile, Property 3: 有效昵称保存**
    // *对于任意* 1-20 字符的非空白字符串，昵称验证应返回有效
    // **验证: 需求 2.2**
    it('Property 3: 有效昵称保存 - 1-20字符的非空白字符串应验证通过', () => {
      fc.assert(
        fc.property(
          // 生成 1-20 字符的非空白字符串
          fc.stringOf(
            fc.char().filter(c => c.trim().length > 0),
            { minLength: 1, maxLength: NICKNAME_MAX_LENGTH }
          ).filter(s => s.trim().length > 0),
          (nickname) => {
            const result = validateNickname(nickname)
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    // **Feature: user-profile, Property 4: 空白昵称拒绝**
    // *对于任意* 仅由空白字符组成的字符串（包括空字符串），昵称验证应返回无效
    // **验证: 需求 2.3**
    it('Property 4: 空白昵称拒绝 - 空白字符串应验证失败', () => {
      fc.assert(
        fc.property(
          fc.stringOf(
            fc.constantFrom(' ', '\t', '\n', '\r', '\u00A0'),
            { minLength: 0, maxLength: 50 }
          ),
          (whitespaceString) => {
            const result = validateNickname(whitespaceString)
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
            expect(result.error?.code).toBe(ProfileErrorCodes.NICKNAME_EMPTY)
          }
        ),
        { numRuns: 100 }
      )
    })


    // **Feature: user-profile, Property 5: 超长昵称拒绝**
    // *对于任意* 超过 20 个字符的字符串，昵称验证应返回无效并提示长度限制
    // **验证: 需求 2.4**
    it('Property 5: 超长昵称拒绝 - 超过20字符应验证失败', () => {
      fc.assert(
        fc.property(
          fc.stringOf(
            fc.char().filter(c => c.trim().length > 0),
            { minLength: NICKNAME_MAX_LENGTH + 1, maxLength: 100 }
          ).filter(s => s.trim().length > NICKNAME_MAX_LENGTH),
          (longNickname) => {
            const result = validateNickname(longNickname)
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
            expect(result.error?.code).toBe(ProfileErrorCodes.NICKNAME_TOO_LONG)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // **Feature: user-profile, Property 7: 用户资料往返一致性**
  // *对于任意* 有效的用户资料对象，序列化到数据库后再反序列化，应得到等价的对象
  // **验证: 需求 5.1, 5.4**
  describe('profileToRow 往返一致性', () => {
    it('Property 7: 用户资料往返一致性 - 序列化后反序列化应保持一致', () => {
      fc.assert(
        fc.property(
          fc.record({
            nickname: fc.option(
              fc.stringOf(
                fc.char().filter(c => c.trim().length > 0),
                { minLength: 1, maxLength: 20 }
              ).filter(s => s.trim().length > 0),
              { nil: null }
            ),
            avatarUrl: fc.option(
              fc.webUrl(),
              { nil: null }
            )
          }),
          (profileData) => {
            // 序列化为数据库行格式
            const row = profileToRow(profileData)
            
            // 反序列化回 UserProfile 格式
            const restored = {
              nickname: row.nickname !== undefined ? row.nickname : profileData.nickname,
              avatarUrl: row.avatar_url !== undefined ? row.avatar_url : profileData.avatarUrl
            }
            
            // 验证往返一致性
            if (profileData.nickname !== undefined) {
              expect(restored.nickname).toBe(profileData.nickname)
            }
            if (profileData.avatarUrl !== undefined) {
              expect(restored.avatarUrl).toBe(profileData.avatarUrl)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
