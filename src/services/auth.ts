import { supabase, isSupabaseConfigured } from './supabase'
import type { AuthError as SupabaseAuthError, Session, User } from '@supabase/supabase-js'

/**
 * 认证结果接口
 */
export interface AuthResult<T = void> {
  success: boolean
  data?: T
  error?: AuthError
}

/**
 * 认证错误接口
 */
export interface AuthError {
  code: string
  message: string
}

/**
 * 认证状态变化回调类型
 */
export type AuthStateCallback = (session: Session | null, user: User | null) => void

/**
 * 取消订阅函数类型
 */
export type Unsubscribe = () => void

/**
 * 邮箱验证正则表达式
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  return EMAIL_REGEX.test(email.trim())
}

/**
 * Supabase 错误码到中文消息的映射
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'invalid_email': '请输入有效的邮箱地址',
  'user_not_found': '该邮箱尚未注册',
  'email_exists': '该邮箱已被注册',
  'invalid_otp': '验证码错误，请重新输入',
  'otp_expired': '验证码已过期，请重新获取',
  'over_request_rate_limit': '请求过于频繁，请稍后再试',
  'email_not_confirmed': '邮箱尚未验证',
  'invalid_credentials': '验证码错误，请重新输入',
  'signup_disabled': '注册功能暂时关闭',
  'email_address_invalid': '请输入有效的邮箱地址',
  'otp_disabled': '验证码功能未启用',
}

/**
 * 将 Supabase 错误映射为中文消息
 */
export function mapSupabaseError(error: SupabaseAuthError | Error | null): string {
  if (!error) {
    return '操作失败，请稍后重试'
  }

  // 检查是否是 Supabase AuthError
  const errorCode = (error as SupabaseAuthError).code || ''
  const errorMessage = error.message?.toLowerCase() || ''

  // 先尝试通过错误码匹配（使用 hasOwnProperty 避免原型链污染）
  if (errorCode && Object.prototype.hasOwnProperty.call(ERROR_MESSAGE_MAP, errorCode)) {
    return ERROR_MESSAGE_MAP[errorCode]
  }

  // 通过错误消息内容匹配
  if (errorMessage.includes('invalid email') || errorMessage.includes('email address invalid')) {
    return ERROR_MESSAGE_MAP['invalid_email']
  }
  if (errorMessage.includes('user not found') || errorMessage.includes('no user found')) {
    return ERROR_MESSAGE_MAP['user_not_found']
  }
  if (errorMessage.includes('already registered') || errorMessage.includes('email exists')) {
    return ERROR_MESSAGE_MAP['email_exists']
  }
  if (errorMessage.includes('invalid otp') || errorMessage.includes('token has expired') || errorMessage.includes('invalid token')) {
    return ERROR_MESSAGE_MAP['invalid_otp']
  }
  if (errorMessage.includes('otp expired') || errorMessage.includes('expired')) {
    return ERROR_MESSAGE_MAP['otp_expired']
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return ERROR_MESSAGE_MAP['over_request_rate_limit']
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return '网络连接失败，请检查网络'
  }

  // 默认错误消息
  return '操作失败，请稍后重试'
}

/**
 * 检查错误消息是否为中文
 */
export function isChineseMessage(message: string): boolean {
  // 检查是否包含中文字符
  return /[\u4e00-\u9fa5]/.test(message)
}

/**
 * 认证服务
 */
export const AuthService = {
  /**
   * 发送 Magic Link 到邮箱
   */
  async sendMagicLink(email: string): Promise<AuthResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: {
          code: 'SUPABASE_NOT_CONFIGURED',
          message: '服务未配置，请稍后重试'
        }
      }
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return {
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: '请输入有效的邮箱地址'
        }
      }
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, // 允许新用户注册
          emailRedirectTo: window.location.origin // 登录后跳转回应用
        }
      })

      if (error) {
        return {
          success: false,
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: mapSupabaseError(error)
          }
        }
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络连接失败，请检查网络'
        }
      }
    }
  },

  /**
   * 获取当前会话
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data } = await supabase.auth.getSession()
      return data.session
    } catch {
      return null
    }
  },

  /**
   * 登出
   */
  async signOut(): Promise<AuthResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: {
          code: 'SUPABASE_NOT_CONFIGURED',
          message: '服务未配置，请稍后重试'
        }
      }
    }

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: mapSupabaseError(error)
          }
        }
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络连接失败，请检查网络'
        }
      }
    }
  },

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: AuthStateCallback): Unsubscribe {
    if (!isSupabaseConfigured || !supabase) {
      return () => {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        callback(session, session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }
}

export default AuthService
