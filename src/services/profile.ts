import { supabase, isSupabaseConfigured } from './supabase'
import type { 
  UserProfile, 
  ProfileResult, 
  ProfileError,
  ProfileErrorCode 
} from '@/types'
import { ProfileErrorCodes, profileErrorMessages } from '@/types'

/**
 * 昵称最大长度
 */
export const NICKNAME_MAX_LENGTH = 20

/**
 * 昵称最小长度
 */
export const NICKNAME_MIN_LENGTH = 1

/**
 * 昵称验证结果接口
 */
export interface NicknameValidationResult {
  valid: boolean
  error?: ProfileError
}

/**
 * 创建 ProfileError 对象
 */
function createError(code: ProfileErrorCode): ProfileError {
  return {
    code,
    message: profileErrorMessages[code]
  }
}

/**
 * 验证昵称
 * - 不能为空或仅包含空白字符
 * - 长度必须在 1-20 字符之间
 */
export function validateNickname(nickname: string): NicknameValidationResult {
  // 检查是否为空或仅包含空白字符
  const trimmed = nickname.trim()
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: createError(ProfileErrorCodes.NICKNAME_EMPTY)
    }
  }
  
  // 检查长度是否超过限制
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return {
      valid: false,
      error: createError(ProfileErrorCodes.NICKNAME_TOO_LONG)
    }
  }
  
  return { valid: true }
}


/**
 * 数据库行类型（snake_case）
 */
interface ProfileRow {
  id: string
  nickname: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

/**
 * 将数据库行转换为 UserProfile 对象
 */
function rowToProfile(row: ProfileRow, email: string): UserProfile {
  return {
    id: row.id,
    email,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * 将 UserProfile 对象转换为数据库行（用于更新）
 */
export function profileToRow(profile: Partial<UserProfile>): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = {}
  
  if (profile.nickname !== undefined) {
    row.nickname = profile.nickname
  }
  if (profile.avatarUrl !== undefined) {
    row.avatar_url = profile.avatarUrl
  }
  
  return row
}

/**
 * 用户资料服务
 */
export const ProfileService = {
  /**
   * 获取用户资料
   */
  async getProfile(userId: string): Promise<ProfileResult<UserProfile>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }

    try {
      // 获取用户邮箱
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email || ''

      // 查询用户资料
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // 如果资料不存在，创建新资料
        if (error.code === 'PGRST116') {
          return await this.createProfile(userId, email)
        }
        
        return {
          success: false,
          error: createError(ProfileErrorCodes.DB_QUERY_ERROR)
        }
      }

      return {
        success: true,
        data: rowToProfile(data as ProfileRow, email)
      }
    } catch {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }
  },

  /**
   * 创建用户资料（内部方法）
   */
  async createProfile(userId: string, email: string): Promise<ProfileResult<UserProfile>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({ id: userId })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: createError(ProfileErrorCodes.DB_QUERY_ERROR)
        }
      }

      return {
        success: true,
        data: rowToProfile(data as ProfileRow, email)
      }
    } catch {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }
  },

  /**
   * 更新用户资料
   */
  async updateProfile(
    userId: string, 
    data: Partial<UserProfile>
  ): Promise<ProfileResult<UserProfile>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }

    try {
      // 获取用户邮箱
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email || ''

      // 转换为数据库格式
      const rowData = profileToRow(data)

      const { data: result, error } = await supabase
        .from('user_profiles')
        .update(rowData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: createError(ProfileErrorCodes.DB_QUERY_ERROR)
        }
      }

      return {
        success: true,
        data: rowToProfile(result as ProfileRow, email)
      }
    } catch {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }
  },

  /**
   * 更新昵称
   */
  async updateNickname(
    userId: string, 
    nickname: string
  ): Promise<ProfileResult<void>> {
    // 验证昵称
    const validation = validateNickname(nickname)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error!
      }
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ nickname: nickname.trim() })
        .eq('id', userId)

      if (error) {
        return {
          success: false,
          error: createError(ProfileErrorCodes.DB_QUERY_ERROR)
        }
      }

      return { success: true, data: undefined }
    } catch {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }
  }
}

export default ProfileService
