/**
 * 优先级类型
 */
export type Priority = 'high' | 'medium' | 'low'

/**
 * 心情类型
 */
export type MoodType = 'happy' | 'neutral' | 'sad' | 'excited' | 'tired'

/**
 * 任务接口
 */
export interface Task {
  id: string                    // 唯一标识 (UUID)
  description: string           // 任务描述
  completed: boolean            // 完成状态
  priority: Priority            // 优先级
  tags: string[]                // 标签数组
  order: number                 // 排序顺序
  createdAt: string             // 创建时间 (ISO 8601)
  completedAt: string | null    // 完成时间
}

/**
 * 日记条目接口
 * 单条日记记录，包含内容、创建时间和可选心情
 */
export interface JournalEntry {
  id: string                    // 唯一标识 (UUID)
  content: string               // 日记内容
  mood: MoodType | null         // 心情（可选）
  createdAt: string             // 创建时间 (ISO 8601)
}

/**
 * 每日记录接口
 */
export interface DailyRecord {
  id: string                    // 唯一标识 (日期格式 YYYY-MM-DD)
  date: string                  // 日期
  tasks: Task[]                 // 任务列表
  journal: string               // 日记内容（旧字段，保留兼容）
  mood: MoodType | null         // 心情（旧字段，保留兼容）
  journalEntries: JournalEntry[] // 日记条目列表（新字段）
  isSealed: boolean             // 是否已封存
  completionRate: number        // 完成率 (0-100)
  createdAt: string             // 创建时间
  sealedAt: string | null       // 封存时间
}

/**
 * 搜索条件接口
 */
export interface SearchQuery {
  startDate: string | null      // 开始日期
  endDate: string | null        // 结束日期
  mood: MoodType | null         // 心情筛选
  keyword: string               // 关键词
  tags: string[]                // 标签筛选
}


/**
 * 趋势数据点
 */
export interface TrendPoint {
  date: string
  rate: number
}

/**
 * 心情统计
 */
export interface MoodCount {
  mood: MoodType
  count: number
}

/**
 * 标签统计
 */
export interface TagStat {
  tag: string
  total: number
  completed: number
}

/**
 * 统计数据接口
 */
export interface Statistics {
  totalTasks: number            // 总任务数
  completedTasks: number        // 已完成任务数
  consecutiveDays: number       // 连续打卡天数
  completionTrend: TrendPoint[] // 完成率趋势
  moodDistribution: MoodCount[] // 心情分布
  tagStats: TagStat[]           // 标签统计
}

/**
 * 应用错误接口
 */
export interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
}

/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark'


// ==================== 认证相关类型 ====================

/**
 * 认证用户接口
 * 表示已登录用户的基本信息
 */
export interface AuthUser {
  id: string              // Supabase user UUID
  email: string           // 用户邮箱
  createdAt: string       // 注册时间 (ISO 8601)
  lastSignInAt: string    // 最后登录时间 (ISO 8601)
}

/**
 * 会话接口
 * 表示用户的认证会话信息
 */
export interface Session {
  accessToken: string     // 访问令牌
  refreshToken: string    // 刷新令牌
  expiresAt: number       // 过期时间戳 (Unix timestamp)
  user: AuthUser          // 关联的用户信息
}

/**
 * 认证错误接口
 * 表示认证过程中的错误信息
 */
export interface AuthError {
  code: string            // 错误代码
  message: string         // 错误消息（中文）
}

/**
 * 认证结果类型
 * 泛型类型，用于表示认证操作的结果
 */
export interface AuthResult<T = void> {
  success: boolean        // 操作是否成功
  data?: T                // 成功时返回的数据
  error?: AuthError       // 失败时的错误信息
}

/**
 * 认证状态接口
 * 用于 AuthStore 的状态管理
 */
export interface AuthState {
  user: AuthUser | null   // 当前用户
  session: Session | null // 当前会话
  isLoading: boolean      // 是否正在加载
  error: string | null    // 错误消息
}


// ==================== 用户资料相关类型 ====================

/**
 * 用户资料接口
 * 存储用户的个人信息
 */
export interface UserProfile {
  id: string                    // 用户 ID (与 auth.users.id 关联)
  email: string                 // 邮箱（只读，来自 auth）
  nickname: string | null       // 昵称 (1-20 字符)
  avatarUrl: string | null      // 头像 URL
  createdAt: string             // 注册时间 (ISO 8601)
  updatedAt: string             // 更新时间 (ISO 8601)
}

/**
 * 用户资料错误码
 */
export const ProfileErrorCodes = {
  // 验证错误
  NICKNAME_EMPTY: 'PROFILE_NICKNAME_EMPTY',
  NICKNAME_TOO_LONG: 'PROFILE_NICKNAME_TOO_LONG',
  
  // 头像错误
  AVATAR_INVALID_FORMAT: 'PROFILE_AVATAR_INVALID_FORMAT',
  AVATAR_TOO_LARGE: 'PROFILE_AVATAR_TOO_LARGE',
  AVATAR_UPLOAD_FAILED: 'PROFILE_AVATAR_UPLOAD_FAILED',
  
  // 数据库错误
  DB_CONNECTION_ERROR: 'PROFILE_DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'PROFILE_DB_QUERY_ERROR',
  NOT_FOUND: 'PROFILE_NOT_FOUND',
  AUTH_REQUIRED: 'PROFILE_AUTH_REQUIRED'
} as const

/**
 * 用户资料错误码类型
 */
export type ProfileErrorCode = typeof ProfileErrorCodes[keyof typeof ProfileErrorCodes]

/**
 * 用户资料错误接口
 */
export interface ProfileError {
  code: ProfileErrorCode        // 错误代码
  message: string               // 错误消息（中文）
}

/**
 * 用户资料操作结果类型
 * 泛型类型，用于表示资料操作的结果
 */
export type ProfileResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ProfileError }

/**
 * 头像验证结果接口
 */
export interface AvatarValidationResult {
  valid: boolean                // 是否有效
  error?: string                // 错误消息
}

/**
 * 头像操作结果类型
 */
export type AvatarResult = 
  | { success: true; url: string }
  | { success: false; error: ProfileError }

/**
 * 用户资料错误消息映射
 */
export const profileErrorMessages: Record<ProfileErrorCode, string> = {
  PROFILE_NICKNAME_EMPTY: '昵称不能为空',
  PROFILE_NICKNAME_TOO_LONG: '昵称不能超过20个字符',
  PROFILE_AVATAR_INVALID_FORMAT: '请选择 JPG 或 PNG 格式的图片',
  PROFILE_AVATAR_TOO_LARGE: '图片大小不能超过 5MB',
  PROFILE_AVATAR_UPLOAD_FAILED: '头像上传失败，请重试',
  PROFILE_DB_CONNECTION_ERROR: '网络连接失败，请检查网络',
  PROFILE_DB_QUERY_ERROR: '数据操作失败，请重试',
  PROFILE_NOT_FOUND: '用户资料不存在',
  PROFILE_AUTH_REQUIRED: '请先登录'
}

/**
 * 用户资料状态接口
 * 用于 ProfileStore 的状态管理
 */
export interface ProfileState {
  profile: UserProfile | null   // 当前用户资料
  isLoading: boolean            // 是否正在加载
  error: ProfileError | null    // 错误信息
}


// ==================== 番茄钟相关类型 ====================

/**
 * 计时器状态
 * - idle: 空闲状态
 * - focusing: 专注中
 * - break: 休息中
 * - paused: 暂停状态
 */
export type TimerState = 'idle' | 'focusing' | 'break' | 'paused'

/**
 * 计时器模式
 * - focus: 专注模式
 * - shortBreak: 短休息
 * - longBreak: 长休息
 */
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

/**
 * 番茄钟设置接口
 */
export interface PomodoroSettings {
  focusDuration: number           // 专注时长（分钟），默认 25，范围 1-60
  shortBreakDuration: number      // 短休息时长（分钟），默认 5，范围 1-30
  longBreakDuration: number       // 长休息时长（分钟），默认 15，范围 1-30
  pomodorosUntilLongBreak: number // 长休息前的专注次数，默认 4
}

/**
 * 专注记录接口
 */
export interface FocusRecord {
  id: string                      // UUID
  taskId: string | null           // 关联的任务 ID
  taskDescription: string | null  // 任务描述快照
  duration: number                // 实际专注时长（分钟）
  completedAt: string             // 完成时间 (ISO 8601)
  date: string                    // 日期 (YYYY-MM-DD)
}

/**
 * 番茄钟默认设置
 */
export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosUntilLongBreak: 4
}
