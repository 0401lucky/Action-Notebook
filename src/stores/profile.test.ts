import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfileStore } from './profile'
import { ProfileService } from '@/services/profile'
import { AvatarService } from '@/services/avatar'
import type { UserProfile } from '@/types'
import { ProfileErrorCodes, profileErrorMessages } from '@/types'

// Mock 服务
vi.mock('@/services/profile', () => ({
  ProfileService: {
    getProfile: vi.fn(),
    updateNickname: vi.fn()
  }
}))

vi.mock('@/services/avatar', () => ({
  AvatarService: {
    uploadAvatar: vi.fn(),
    deleteAvatar: vi.fn()
  }
}))

// 测试用的模拟数据
const mockProfile: UserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  nickname: '测试用户',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

const mockProfileNoNickname: UserProfile = {
  ...mockProfile,
  nickname: null
}

const mockProfileNoAvatar: UserProfile = {
  ...mockProfile,
  avatarUrl: null
}

describe('ProfileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('初始状态应为空', () => {
      const store = useProfileStore()
      
      expect(store.profile).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('displayNickname getter', () => {
    it('有昵称时应返回实际昵称', () => {
      const store = useProfileStore()
      store.profile = mockProfile
      
      expect(store.displayNickname).toBe('测试用户')
    })

    it('昵称为 null 时应返回"未设置昵称"', () => {
      const store = useProfileStore()
      store.profile = mockProfileNoNickname
      
      expect(store.displayNickname).toBe('未设置昵称')
    })

    it('昵称为空字符串时应返回"未设置昵称"', () => {
      const store = useProfileStore()
      store.profile = { ...mockProfile, nickname: '' }
      
      expect(store.displayNickname).toBe('未设置昵称')
    })

    it('昵称为纯空白字符时应返回"未设置昵称"', () => {
      const store = useProfileStore()
      store.profile = { ...mockProfile, nickname: '   ' }
      
      expect(store.displayNickname).toBe('未设置昵称')
    })

    it('profile 为 null 时应返回"未设置昵称"', () => {
      const store = useProfileStore()
      
      expect(store.displayNickname).toBe('未设置昵称')
    })
  })

  describe('hasNickname getter', () => {
    it('有昵称时应返回 true', () => {
      const store = useProfileStore()
      store.profile = mockProfile
      
      expect(store.hasNickname).toBe(true)
    })

    it('昵称为 null 时应返回 false', () => {
      const store = useProfileStore()
      store.profile = mockProfileNoNickname
      
      expect(store.hasNickname).toBe(false)
    })
  })

  describe('displayAvatarUrl getter', () => {
    it('有头像时应返回头像 URL', () => {
      const store = useProfileStore()
      store.profile = mockProfile
      
      expect(store.displayAvatarUrl).toBe('https://example.com/avatar.jpg')
    })

    it('头像为 null 时应返回 null', () => {
      const store = useProfileStore()
      store.profile = mockProfileNoAvatar
      
      expect(store.displayAvatarUrl).toBeNull()
    })
  })

  describe('hasAvatar getter', () => {
    it('有头像时应返回 true', () => {
      const store = useProfileStore()
      store.profile = mockProfile
      
      expect(store.hasAvatar).toBe(true)
    })

    it('头像为 null 时应返回 false', () => {
      const store = useProfileStore()
      store.profile = mockProfileNoAvatar
      
      expect(store.hasAvatar).toBe(false)
    })
  })

  describe('loadProfile action', () => {
    it('加载成功时应更新 profile 状态', async () => {
      vi.mocked(ProfileService.getProfile).mockResolvedValue({
        success: true,
        data: mockProfile
      })

      const store = useProfileStore()
      const result = await store.loadProfile('test-user-id')

      expect(result).toBe(true)
      expect(store.profile).toEqual(mockProfile)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('加载失败时应设置错误状态', async () => {
      const mockError = {
        code: ProfileErrorCodes.NOT_FOUND,
        message: profileErrorMessages[ProfileErrorCodes.NOT_FOUND]
      }
      vi.mocked(ProfileService.getProfile).mockResolvedValue({
        success: false,
        error: mockError
      })

      const store = useProfileStore()
      const result = await store.loadProfile('test-user-id')

      expect(result).toBe(false)
      expect(store.profile).toBeNull()
      expect(store.error).toEqual(mockError)
    })

    it('加载时应设置 isLoading 为 true', async () => {
      let loadingDuringCall = false
      vi.mocked(ProfileService.getProfile).mockImplementation(async () => {
        const store = useProfileStore()
        loadingDuringCall = store.isLoading
        return { success: true, data: mockProfile }
      })

      const store = useProfileStore()
      await store.loadProfile('test-user-id')

      expect(loadingDuringCall).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('updateNickname action', () => {
    it('更新成功时应更新本地状态', async () => {
      vi.mocked(ProfileService.updateNickname).mockResolvedValue({
        success: true,
        data: undefined
      })

      const store = useProfileStore()
      store.profile = mockProfile
      
      const result = await store.updateNickname('test-user-id', '新昵称')

      expect(result).toBe(true)
      expect(store.profile?.nickname).toBe('新昵称')
      expect(store.error).toBeNull()
    })

    it('更新失败时应设置错误状态', async () => {
      const mockError = {
        code: ProfileErrorCodes.NICKNAME_EMPTY,
        message: profileErrorMessages[ProfileErrorCodes.NICKNAME_EMPTY]
      }
      vi.mocked(ProfileService.updateNickname).mockResolvedValue({
        success: false,
        error: mockError
      })

      const store = useProfileStore()
      store.profile = mockProfile
      
      const result = await store.updateNickname('test-user-id', '')

      expect(result).toBe(false)
      expect(store.error).toEqual(mockError)
      // 原昵称应保持不变
      expect(store.profile?.nickname).toBe('测试用户')
    })
  })

  describe('updateAvatar action', () => {
    it('上传成功时应更新本地状态', async () => {
      const newAvatarUrl = 'https://example.com/new-avatar.jpg'
      vi.mocked(AvatarService.uploadAvatar).mockResolvedValue({
        success: true,
        url: newAvatarUrl
      })

      const store = useProfileStore()
      store.profile = mockProfile
      
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const result = await store.updateAvatar('test-user-id', mockFile)

      expect(result).toBe(true)
      expect(store.profile?.avatarUrl).toBe(newAvatarUrl)
      expect(store.error).toBeNull()
    })

    it('上传失败时应设置错误状态', async () => {
      const mockError = {
        code: ProfileErrorCodes.AVATAR_INVALID_FORMAT,
        message: profileErrorMessages[ProfileErrorCodes.AVATAR_INVALID_FORMAT]
      }
      vi.mocked(AvatarService.uploadAvatar).mockResolvedValue({
        success: false,
        error: mockError
      })

      const store = useProfileStore()
      store.profile = mockProfile
      
      const mockFile = new File([''], 'test.gif', { type: 'image/gif' })
      const result = await store.updateAvatar('test-user-id', mockFile)

      expect(result).toBe(false)
      expect(store.error).toEqual(mockError)
    })
  })

  describe('deleteAvatar action', () => {
    it('删除成功时应清除头像 URL', async () => {
      vi.mocked(AvatarService.deleteAvatar).mockResolvedValue({
        success: true,
        url: ''
      })

      const store = useProfileStore()
      store.profile = mockProfile
      
      const result = await store.deleteAvatar('test-user-id')

      expect(result).toBe(true)
      expect(store.profile?.avatarUrl).toBeNull()
      expect(store.error).toBeNull()
    })

    it('删除失败时应设置错误状态', async () => {
      const mockError = {
        code: ProfileErrorCodes.DB_QUERY_ERROR,
        message: profileErrorMessages[ProfileErrorCodes.DB_QUERY_ERROR]
      }
      vi.mocked(AvatarService.deleteAvatar).mockResolvedValue({
        success: false,
        error: mockError
      })

      const store = useProfileStore()
      store.profile = mockProfile
      
      const result = await store.deleteAvatar('test-user-id')

      expect(result).toBe(false)
      expect(store.error).toEqual(mockError)
      // 原头像应保持不变
      expect(store.profile?.avatarUrl).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('clearError action', () => {
    it('应清除错误状态', () => {
      const store = useProfileStore()
      store.error = {
        code: ProfileErrorCodes.DB_CONNECTION_ERROR,
        message: profileErrorMessages[ProfileErrorCodes.DB_CONNECTION_ERROR]
      }
      
      store.clearError()
      
      expect(store.error).toBeNull()
    })
  })

  describe('$reset action', () => {
    it('应重置所有状态', () => {
      const store = useProfileStore()
      store.profile = mockProfile
      store.isLoading = true
      store.error = {
        code: ProfileErrorCodes.DB_CONNECTION_ERROR,
        message: profileErrorMessages[ProfileErrorCodes.DB_CONNECTION_ERROR]
      }
      
      store.$reset()
      
      expect(store.profile).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
