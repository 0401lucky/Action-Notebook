import { supabase, isSupabaseConfigured } from './supabase'
import type { 
  AvatarResult, 
  AvatarValidationResult,
  ProfileError,
  ProfileErrorCode 
} from '@/types'
import { ProfileErrorCodes, profileErrorMessages } from '@/types'

/**
 * 允许的图片格式
 */
export const ALLOWED_FORMATS = ['image/jpeg', 'image/png']

/**
 * 允许的文件扩展名
 */
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

/**
 * 最大文件大小（5MB）
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * 头像存储桶名称
 */
const AVATAR_BUCKET = 'avatars'

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
 * 验证文件格式和大小
 */
export function validateFile(file: File): AvatarValidationResult {
  // 检查文件格式
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: profileErrorMessages[ProfileErrorCodes.AVATAR_INVALID_FORMAT]
    }
  }
  
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: profileErrorMessages[ProfileErrorCodes.AVATAR_TOO_LARGE]
    }
  }
  
  return { valid: true }
}

/**
 * 根据 MIME 类型判断文件格式是否有效
 */
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_FORMATS.includes(mimeType)
}

/**
 * 根据文件扩展名判断文件格式是否有效
 */
export function isValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  return ALLOWED_EXTENSIONS.includes(ext)
}


/**
 * 生成头像文件路径
 */
function generateAvatarPath(userId: string, file: File): string {
  const ext = file.name.slice(file.name.lastIndexOf('.'))
  const timestamp = Date.now()
  return `${userId}/avatar_${timestamp}${ext}`
}

/**
 * 头像服务
 */
export const AvatarService = {
  /**
   * 上传头像
   */
  async uploadAvatar(userId: string, file: File): Promise<AvatarResult> {
    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: createError(
          validation.error?.includes('格式') 
            ? ProfileErrorCodes.AVATAR_INVALID_FORMAT 
            : ProfileErrorCodes.AVATAR_TOO_LARGE
        )
      }
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }

    try {
      // 生成文件路径
      const filePath = generateAvatarPath(userId, file)

      // 上传文件到 Storage
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        return {
          success: false,
          error: createError(ProfileErrorCodes.AVATAR_UPLOAD_FAILED)
        }
      }

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath)

      // 更新用户资料中的头像 URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        return {
          success: false,
          error: createError(ProfileErrorCodes.DB_QUERY_ERROR)
        }
      }

      return {
        success: true,
        url: publicUrl
      }
    } catch {
      return {
        success: false,
        error: createError(ProfileErrorCodes.AVATAR_UPLOAD_FAILED)
      }
    }
  },

  /**
   * 删除头像
   */
  async deleteAvatar(userId: string): Promise<AvatarResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: createError(ProfileErrorCodes.DB_CONNECTION_ERROR)
      }
    }

    try {
      // 列出用户的所有头像文件
      const { data: files, error: listError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .list(userId)

      if (listError) {
        return {
          success: false,
          error: createError(ProfileErrorCodes.DB_QUERY_ERROR)
        }
      }

      // 删除所有头像文件
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`)
        const { error: deleteError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .remove(filePaths)

        if (deleteError) {
          return {
            success: false,
            error: createError(ProfileErrorCodes.AVATAR_UPLOAD_FAILED)
          }
        }
      }

      // 清除用户资料中的头像 URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) {
        return {
          success: false,
          error: createError(ProfileErrorCodes.DB_QUERY_ERROR)
        }
      }

      return {
        success: true,
        url: ''
      }
    } catch {
      return {
        success: false,
        error: createError(ProfileErrorCodes.AVATAR_UPLOAD_FAILED)
      }
    }
  }
}

export default AvatarService
