# 设计文档 - 行动手账 (Action Log)

## 概述

行动手账是一个基于 Vue 3 的响应式单页应用，将待办事项管理与每日心情日记深度融合。应用采用现代前端架构，使用 Composition API 进行组件开发，Pinia 进行状态管理，Vue Router 实现页面导航，并通过 LocalStorage 实现数据持久化。

核心设计理念：
- **模块化**: 功能按职责划分为独立模块，便于维护和扩展
- **响应式**: 支持桌面端和移动端的自适应布局
- **数据驱动**: 通过 Pinia Store 集中管理状态，实现单向数据流
- **用户体验优先**: 流畅的动画过渡和即时的视觉反馈

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        Vue 应用                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   视图层    │  │   组件层    │  │     组合式函数       │  │
│  │  ─────────  │  │  ─────────  │  │  ─────────────────  │  │
│  │  HomeView   │  │  TaskList   │  │  useLocalStorage    │  │
│  │  ArchiveView│  │  TaskItem   │  │  useTheme           │  │
│  │  DetailView │  │  JournalEdit│  │  useExport          │  │
│  │  StatsView  │  │  MoodPicker │  │                     │  │
│  │             │  │  ProgressBar│  │                     │  │
│  │             │  │  StatsChart │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Pinia 状态管理                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │ dailyStore  │  │ archiveStore│  │  settingsStore  │ ││
│  │  │ (今日数据)   │  │ (历史归档)   │  │  (主题/设置)    │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     服务层                               ││
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  ││
│  │  │ StorageService  │  │     ExportService           │  ││
│  │  │ (本地存储)       │  │  (JSON/Markdown 导出)       │  ││
│  │  └─────────────────┘  └─────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Vue Router                           ││
│  │    /home  │  /archive  │  /detail/:id  │  /stats        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
src/
├── assets/
│   └── styles/
│       ├── variables.scss      # CSS 变量 (主题色)
│       ├── transitions.scss    # 过渡动画
│       └── responsive.scss     # 响应式断点
├── components/
│   ├── task/
│   │   ├── TaskList.vue        # 任务列表容器
│   │   ├── TaskItem.vue        # 单个任务项
│   │   ├── TaskInput.vue       # 任务输入框
│   │   └── ProgressBar.vue     # 进度条
│   ├── journal/
│   │   ├── JournalEditor.vue   # 日记编辑器
│   │   └── MoodPicker.vue      # 心情选择器
│   ├── stats/
│   │   ├── CompletionChart.vue # 完成率折线图
│   │   ├── MoodChart.vue       # 心情分布饼图
│   │   └── TagStats.vue        # 标签统计
│   ├── archive/
│   │   ├── ArchiveList.vue     # 归档列表
│   │   ├── ArchiveCard.vue     # 归档卡片
│   │   └── SearchFilter.vue    # 搜索筛选
│   └── common/
│       ├── AppHeader.vue       # 顶部导航
│       ├── ThemeToggle.vue     # 主题切换
│       └── BaseButton.vue      # 基础按钮
├── views/
│   ├── HomeView.vue            # 首页/今日视图
│   ├── ArchiveView.vue         # 历史归档页
│   ├── DetailView.vue          # 详情页
│   └── StatsView.vue           # 统计页
├── stores/
│   ├── daily.ts                # 今日数据 Store
│   ├── archive.ts              # 归档数据 Store
│   └── settings.ts             # 设置 Store
├── services/
│   ├── storage.ts              # LocalStorage 服务
│   └── export.ts               # 数据导出服务
├── composables/
│   ├── useLocalStorage.ts      # 本地存储 Hook
│   ├── useTheme.ts             # 主题切换 Hook
│   └── useExport.ts            # 导出功能 Hook
├── types/
│   └── index.ts                # TypeScript 类型定义
├── router/
│   └── index.ts                # 路由配置
├── App.vue
└── main.ts
```

## 组件与接口

### 核心组件

#### TaskList.vue
负责渲染任务列表，支持拖拽排序。

```typescript
interface TaskListProps {
  tasks: Task[]
  editable: boolean
}

interface TaskListEmits {
  (e: 'reorder', tasks: Task[]): void
}
```

#### TaskItem.vue
单个任务项组件，显示任务信息并处理交互。

```typescript
interface TaskItemProps {
  task: Task
  editable: boolean
}

interface TaskItemEmits {
  (e: 'toggle', id: string): void
  (e: 'delete', id: string): void
  (e: 'update', task: Task): void
}
```

#### JournalEditor.vue
日记编辑器组件，提供文本输入和心情选择。

```typescript
interface JournalEditorProps {
  content: string
  mood: MoodType | null
  readonly: boolean
}

interface JournalEditorEmits {
  (e: 'update:content', value: string): void
  (e: 'update:mood', value: MoodType): void
}
```

#### ProgressBar.vue
进度条组件，显示任务完成率。

```typescript
interface ProgressBarProps {
  percentage: number
  animated: boolean
}
```

### Store 接口

#### DailyStore
管理当日手账数据。

```typescript
interface DailyStoreState {
  currentRecord: DailyRecord | null
  isSealed: boolean
}

interface DailyStoreActions {
  addTask(description: string, priority: Priority, tags: string[]): void
  removeTask(id: string): void
  toggleTask(id: string): void
  updateTaskOrder(tasks: Task[]): void
  updateJournal(content: string): void
  updateMood(mood: MoodType): void
  sealDay(): boolean
  loadToday(): void
}

interface DailyStoreGetters {
  completionRate: number
  taskCount: number
  completedCount: number
  canSeal: boolean
}
```

#### ArchiveStore
管理历史归档数据。

```typescript
interface ArchiveStoreState {
  records: DailyRecord[]
  searchQuery: SearchQuery
}

interface ArchiveStoreActions {
  loadRecords(): void
  getRecordById(id: string): DailyRecord | null
  searchRecords(query: SearchQuery): DailyRecord[]
}
```

## 数据模型

### Task（任务）

```typescript
interface Task {
  id: string                    // 唯一标识 (UUID)
  description: string           // 任务描述
  completed: boolean            // 完成状态
  priority: Priority            // 优先级
  tags: string[]                // 标签数组
  order: number                 // 排序顺序
  createdAt: string             // 创建时间 (ISO 8601)
  completedAt: string | null    // 完成时间
}

type Priority = 'high' | 'medium' | 'low'
```

### DailyRecord（每日记录）

```typescript
interface DailyRecord {
  id: string                    // 唯一标识 (日期格式 YYYY-MM-DD)
  date: string                  // 日期
  tasks: Task[]                 // 任务列表
  journal: string               // 日记内容
  mood: MoodType | null         // 心情
  isSealed: boolean             // 是否已封存
  completionRate: number        // 完成率 (0-100)
  createdAt: string             // 创建时间
  sealedAt: string | null       // 封存时间
}

type MoodType = 'happy' | 'neutral' | 'sad' | 'excited' | 'tired'
```

### SearchQuery（搜索条件）

```typescript
interface SearchQuery {
  startDate: string | null      // 开始日期
  endDate: string | null        // 结束日期
  mood: MoodType | null         // 心情筛选
  keyword: string               // 关键词
  tags: string[]                // 标签筛选
}
```

### Statistics（统计数据）

```typescript
interface Statistics {
  totalTasks: number            // 总任务数
  completedTasks: number        // 已完成任务数
  consecutiveDays: number       // 连续打卡天数
  completionTrend: TrendPoint[] // 完成率趋势
  moodDistribution: MoodCount[] // 心情分布
  tagStats: TagStat[]           // 标签统计
}

interface TrendPoint {
  date: string
  rate: number
}

interface MoodCount {
  mood: MoodType
  count: number
}

interface TagStat {
  tag: string
  total: number
  completed: number
}
```


## 正确性属性

*属性是指在系统所有有效执行中都应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范与机器可验证正确性保证之间的桥梁。*

基于验收标准分析，以下正确性属性已被识别用于属性测试：

### 属性 1：任务添加不变量
*对于任意*有效的（非空、非纯空白）任务描述，将其添加到任务列表后，列表长度应恰好增加1，且新任务应存在于列表中并具有正确的描述。
**验证：需求 1.1**

### 属性 2：空任务拒绝
*对于任意*完全由空白字符组成的字符串（包括空字符串），尝试将其作为任务添加应被拒绝，且任务列表应保持不变。
**验证：需求 1.2**

### 属性 3：任务删除不变量
*对于任意*存在于任务列表中的任务，删除它后列表长度应恰好减少1，且被删除的任务应不再存在于列表中。
**验证：需求 1.3**

### 属性 4：任务切换幂等性
*对于任意*任务，切换其完成状态两次后应返回到原始完成状态。
**验证：需求 1.4**

### 属性 5：优先级排序不变量
*对于任意*按优先级排序后的任务列表，所有高优先级任务应出现在所有中优先级任务之前，所有中优先级任务应出现在所有低优先级任务之前。
**验证：需求 2.2**

### 属性 6：重排序置换不变量
*对于任意*任务列表重排序操作，结果列表应包含与原列表完全相同的任务（按ID），无添加或删除。
**验证：需求 2.4**

### 属性 7：完成率计算
*对于任意*至少包含一个任务的任务列表，完成率应等于（已完成任务数 / 总任务数）× 100，四舍五入到最近的整数。
**验证：需求 3.1**

### 属性 8：日记内容持久化
*对于任意*日记内容字符串，更新每日记录的日记后，检索时记录应包含该确切内容。
**验证：需求 4.1**

### 属性 9：心情选择持久化
*对于任意*有效的心情类型选择，更新每日记录的心情后，检索时记录应包含该确切心情值。
**验证：需求 4.2**

### 属性 10：封存验证规则
*对于任意*每日记录，封存操作应当且仅当满足以下条件之一时成功：(a) 所有标记为核心的任务已完成，或 (b) 日记内容长度达到最低要求（50字符）。
**验证：需求 4.3**

### 属性 11：已封存记录不可变性
*对于任意*已封存的每日记录，所有修改操作（添加任务、删除任务、更新日记、更新心情）应被拒绝，且记录应保持不变。
**验证：需求 4.5**

### 属性 12：存储往返一致性
*对于任意*保存到本地存储的每日记录，重新加载后应产生与原记录深度相等的记录。
**验证：需求 5.2**

### 属性 13：JSON 导出往返
*对于任意*每日记录集合，导出为 JSON 并解析回来后应产生与原集合深度相等的集合。
**验证：需求 5.3**

### 属性 14：导出完整性
*对于任意*导出操作，导出的数据应包含归档中存在的所有每日记录，每条记录包括其完整的任务数组、日记内容和心情值。
**验证：需求 5.4**

### 属性 15：心情分布总和
*对于任意*带有心情的每日记录集合，所有心情分布计数的总和应等于已分配心情的记录总数。
**验证：需求 6.2**

### 属性 16：累计任务计数
*对于任意*每日记录集合，累计已完成任务数应等于所有记录中已完成任务的总和。
**验证：需求 6.3**

### 属性 17：搜索筛选正确性
*对于任意*带有日期范围、心情或关键词条件的搜索查询，所有返回的每日记录应匹配所有指定的条件。
**验证：需求 7.3**

### 属性 18：主题切换一致性
*对于任意*主题状态，切换主题应将其从浅色变为深色或从深色变为浅色，切换两次后应返回原始主题。
**验证：需求 9.1**

## 错误处理

### 输入验证错误

| 错误类型 | 触发条件 | 用户提示 |
|----------|----------|----------|
| 空任务描述 | 任务描述为空或纯空白 | "任务描述不能为空" |
| 无效优先级 | 优先级值不在 ['high', 'medium', 'low'] 中 | "无效的优先级" |
| 无效心情 | 心情值不在有效心情类型中 | "无效的心情类型" |
| 无效日期格式 | 日期字符串不是 YYYY-MM-DD 格式 | "日期格式无效" |

### 业务逻辑错误

| 错误类型 | 触发条件 | 用户提示 |
|----------|----------|----------|
| 封存验证失败 | 任务未完成且日记字数不足 | "请完成核心任务或撰写至少50字的日记后再封存" |
| 已封存记录修改 | 尝试修改已封存的记录 | "已封存的记录无法修改" |
| 记录未找到 | 请求的记录ID不存在 | "未找到该记录" |
| 重复任务ID | 相同ID的任务已存在 | "任务ID重复" |

### 存储错误

| 错误类型 | 触发条件 | 用户提示 |
|----------|----------|----------|
| 存储配额超限 | LocalStorage 配额已满 | "存储空间不足，请导出并清理历史数据" |
| 存储读取错误 | 从 LocalStorage 读取失败 | "读取数据失败，请刷新页面重试" |
| 存储写入错误 | 向 LocalStorage 写入失败 | "保存数据失败，请检查浏览器设置" |
| 导出错误 | 生成导出文件失败 | "导出失败，请重试" |

### 错误处理策略

```typescript
// 统一错误处理接口
interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// 错误处理组合式函数
function useErrorHandler() {
  const showError = (error: AppError) => {
    // 显示错误提示 toast
  }
  
  const handleStorageError = (error: Error) => {
    if (error.name === 'QuotaExceededError') {
      return { code: 'STORAGE_QUOTA', message: '存储空间不足' }
    }
    return { code: 'STORAGE_ERROR', message: '存储操作失败' }
  }
  
  return { showError, handleStorageError }
}
```

## 测试策略

### 单元测试

使用 Vitest 作为测试框架，对以下模块进行单元测试：

**Store 测试**
- dailyStore: 测试任务 CRUD 操作、完成率计算、封存逻辑
- archiveStore: 测试记录加载、搜索筛选功能
- settingsStore: 测试主题切换、设置持久化

**Service 测试**
- StorageService: 测试数据读写、错误处理
- ExportService: 测试 JSON/Markdown 导出格式

**组合式函数测试**
- useLocalStorage: 测试响应式存储同步
- useTheme: 测试主题切换逻辑

### 属性测试

使用 fast-check 库进行属性测试，验证系统的正确性属性。

**测试配置**
- 每个属性测试运行最少 100 次迭代
- 使用 fast-check 的 arbitrary 生成随机测试数据

**属性测试覆盖**

每个正确性属性都将实现为一个独立的属性测试，测试文件中使用以下格式标注：

```typescript
// **Feature: action-log, Property 1: Task Addition Invariant**
// **验证：需求 1.1**
test.prop([validTaskDescription], (description) => {
  // 测试实现
})
```

**生成器设计**

```typescript
// 任务描述生成器 - 非空字符串
const validTaskDescription = fc.string({ minLength: 1 })
  .filter(s => s.trim().length > 0)

// 空白字符串生成器
const whitespaceString = fc.stringOf(fc.constantFrom(' ', '\t', '\n', ''))

// 优先级生成器
const priorityArb = fc.constantFrom('high', 'medium', 'low')

// 心情类型生成器
const moodArb = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

// 任务生成器
const taskArb = fc.record({
  id: fc.uuid(),
  description: validTaskDescription,
  completed: fc.boolean(),
  priority: priorityArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  order: fc.nat(),
  createdAt: fc.date().map(d => d.toISOString()),
  completedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
})

// 每日记录生成器
const dailyRecordArb = fc.record({
  id: fc.date().map(d => d.toISOString().split('T')[0]),
  date: fc.date().map(d => d.toISOString().split('T')[0]),
  tasks: fc.array(taskArb, { maxLength: 20 }),
  journal: fc.string({ maxLength: 1000 }),
  mood: fc.option(moodArb, { nil: null }),
  isSealed: fc.boolean(),
  completionRate: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.date().map(d => d.toISOString()),
  sealedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
})
```

### 组件测试

使用 Vue Test Utils 和 Vitest 进行组件测试：

- 测试组件渲染和 props 传递
- 测试用户交互事件
- 测试组件与 Store 的集成

### 端到端测试（可选）

使用 Cypress 或 Playwright 进行端到端测试：

- 完整用户流程测试
- 响应式布局测试
- 路由导航测试
