import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ProfileService } from '@/services/profile'
import { AvatarService } from '@/services/avatar'
import type { UserProfile, ProfileError } from '@/types'
import { ProfileErrorCodes, profileErrorMessages } from '@/types'

/**
 * Profile Store - 用户资料状态管理
 * 
 * 负责管理用户资料状态，包括：
 * - 用户资料加载和缓存 (Requirements 1.1, 1.2, 1.3, 1.4)
 * - 昵称更新 (Requirements 2.2)
 * - 头像更新 (Requirements 3.2)
 * 
 * @module stores/profile
 */

export const useProfileStore = defineStore('profile', () => {
  // State
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<ProfileError | null>(null)

  // Getters
  
  /**
   * 显示用的昵称
   * 如果昵称为空或 null，返回"未设置昵称"
   */
  const displayNickname = computed(() => {
    if (!profile.value?.nickname || profile.value.nickname.trim() === '') {
      return '未设置昵称'
    }
    return profile.value.nickname
  })

  /**
   * 是否有自定义昵称
   */
  const hasNickname = computed(() => {
    return !!profile.value?.nickname && profile.value.nickname.trim() !== ''
  })

  /**
   * 显示用的头像 URL
   * 如果头像 URL 为空或 null，返回 null（组件可使用默认头像）
   */
  const displayAvatarUrl = computed(() => {
    return profile.value?.avatarUrl || null
  })

  /**
   * 是否有自定义头像
   */
  const hasAvatar = computed(() => {
    return !!profile.value?.avatarUrl
  })

  // Actions

  /**
   * 加载用户资料
   * @param userId - 用户 ID
   */
  async function loadProfile(userId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = await ProfileService.getProfile(userId)
      
      if (!result.success) {
        error.value = result.error
        return false
      }

      profile.value = result.data
      return true
    } catch (err) {
      error.value = {
        code: ProfileErrorCodes.DB_CONNECTION_ERROR,
        message: profileErrorMessages[ProfileErrorCodes.DB_CONNECTION_ERROR]
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新昵称
   * @param userId - 用户 ID
   * @param nickname - 新昵称
   */
  async function updateNickname(userId: string, nickname: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = await ProfileService.updateNickname(userId, nickname)
      
      if (!result.success) {
        error.value = result.error
        return false
      }

      // 更新本地状态
      if (profile.value) {
        profile.value = {
          ...profile.value,
          nickname: nickname.trim(),
          updatedAt: new Date().toISOString()
        }
      }

      return true
    } catch (err) {
      error.value = {
        code: ProfileErrorCodes.DB_CONNECTION_ERROR,
        message: profileErrorMessages[ProfileErrorCodes.DB_CONNECTION_ERROR]
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新头像
   * @param userId - 用户 ID
   * @param file - 图片文件
   */
  async function updateAvatar(userId: string, file: File): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = await AvatarService.uploadAvatar(userId, file)
      
      if (!result.success) {
        error.value = result.error
        return false
      }

      // 更新本地状态
      if (profile.value) {
        profile.value = {
          ...profile.value,
          avatarUrl: result.url,
          updatedAt: new Date().toISOString()
        }
      }

      return true
    } catch (err) {
      error.value = {
        code: ProfileErrorCodes.AVATAR_UPLOAD_FAILED,
        message: profileErrorMessages[ProfileErrorCodes.AVATAR_UPLOAD_FAILED]
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除头像
   * @param userId - 用户 ID
   */
  async function deleteAvatar(userId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = await AvatarService.deleteAvatar(userId)
      
      if (!result.success) {
        error.value = result.error
        return false
      }

      // 更新本地状态
      if (profile.value) {
        profile.value = {
          ...profile.value,
          avatarUrl: null,
          updatedAt: new Date().toISOString()
        }
      }

      return true
    } catch (err) {
      error.value = {
        code: ProfileErrorCodes.AVATAR_UPLOAD_FAILED,
        message: profileErrorMessages[ProfileErrorCodes.AVATAR_UPLOAD_FAILED]
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * 重置 store（用于测试和登出）
   */
  function $reset(): void {
    profile.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    profile,
    isLoading,
    error,
    // Getters
    displayNickname,
    hasNickname,
    displayAvatarUrl,
    hasAvatar,
    // Actions
    loadProfile,
    updateNickname,
    updateAvatar,
    deleteAvatar,
    clearError,
    $reset
  }
})
