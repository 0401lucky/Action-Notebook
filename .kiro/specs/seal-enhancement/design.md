# 设计文档

## 概述

本功能优化包含三个主要部分：
1. **解封功能**：允许用户解封已封存的记录，继续编辑后再次封存
2. **日记本功能**：将单一日记文本框改为多条目日记本模式
3. **日记本书架**：提供书架式的日记浏览界面

## 架构

```mermaid
graph TB
    subgraph Views
        HV[HomeView.vue]
        DV[DetailView.vue]
        JBV[JournalBookshelfView.vue]
        DBV[DashboardView.vue]
    end
    
    subgraph Components
        SB[SealButton.vue]
        JE[JournalEditor.vue]
        JEL[JournalEntryList.vue]
        JEI[JournalEntryItem.vue]
        JBS[JournalBookshelf.vue]
        JBC[JournalBookCard.vue]
        CD[ConfirmDialog.vue]
    end
    
    subgraph Stores
        DS[daily store]
        AS[archive store]
    end
    
    subgraph Services
        SS[seal.ts]
        JS[journal.ts]
    end
    
    HV --> SB
    HV --> JE
    JE --> JEL
    JEL --> JEI
    
    DV --> SB
    JBV --> JBS
    JBS --> JBC
    DBV --> JBS
    
    SB --> CD
    SB --> DS
    SB --> SS
    
    JE --> DS
    JE --> JS
    
    JBS --> AS
</mermaid>
```

## 组件和接口

### 1. 解封功能组件

#### SealButton.vue (更新)

```typescript
interface SealButtonProps {
  // 无 props，从 daily store 获取状态
}

// 组件职责
// - 显示封存/解封按钮
// - 已封存时显示"已封存 · 点击解封"
// - 未封存时显示"封存"
// - 触发确认对话框
```

#### ConfirmDialog.vue (新增)

```typescript
interface ConfirmDialogProps {
  visible: boolean
  title: string
  message: string
  confirmText?: string  // 默认"确认"
  cancelText?: string   // 默认"取消"
}

interface ConfirmDialogEmits {
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:visible', value: boolean): void
}
```

### 2. 日记本功能组件

#### JournalEntryList.vue (新增)

```typescript
interface JournalEntryListProps {
  entries: JournalEntry[]
  readonly: boolean
}

interface JournalEntryListEmits {
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
}
```

#### JournalEntryItem.vue (新增)

```typescript
interface JournalEntryItemProps {
  entry: JournalEntry
  readonly: boolean
}

interface JournalEntryItemEmits {
  (e: 'edit'): void
  (e: 'delete'): void
}
```

#### JournalEditor.vue (更新)

```typescript
// 更新为支持多条目模式
interface JournalEditorProps {
  entries: JournalEntry[]
  readonly: boolean
}

interface JournalEditorEmits {
  (e: 'add', entry: { content: string; mood: MoodType | null }): void
  (e: 'edit', id: string, content: string): void
  (e: 'delete', id: string): void
}
```

### 3. 日记本书架组件

#### JournalBookshelf.vue (新增)

```typescript
interface JournalBookshelfProps {
  records: DailyRecord[]
  maxItems?: number  // 用于仪表盘预览，限制显示数量
  compact?: boolean  // 紧凑模式，用于仪表盘
}

interface JournalBookshelfEmits {
  (e: 'select', recordId: string): void
}
```

#### JournalBookCard.vue (新增)

```typescript
interface JournalBookCardProps {
  record: DailyRecord
  compact?: boolean
}

interface JournalBookCardEmits {
  (e: 'click'): void
}
```

#### JournalBookshelfView.vue (新增)

```typescript
// 完整的日记本书架页面
// 按月份分组显示所有日记
```

## 数据模型

### 新增类型

```typescript
// 日记条目
interface JournalEntry {
  id: string
  content: string
  mood: MoodType | null
  createdAt: string  // ISO 8601 时间戳
}

// 更新 DailyRecord
interface DailyRecord {
  id: string
  date: string
  tasks: Task[]
  // 旧字段（保留兼容）
  journal: string
  mood: MoodType | null
  // 新字段
  journalEntries: JournalEntry[]
  // 其他字段
  isSealed: boolean
  completionRate: number
  createdAt: string
  sealedAt: string | null
}
```

### 数据迁移

```typescript
// 将旧的单一 journal 字段迁移到 journalEntries
function migrateJournalData(record: DailyRecord): DailyRecord {
  if (record.journal && record.journalEntries.length === 0) {
    record.journalEntries = [{
      id: generateUUID(),
      content: record.journal,
      mood: record.mood,
      createdAt: record.createdAt
    }]
  }
  return record
}
```

### 数据库更新

```sql
-- 日记条目表
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id TEXT REFERENCES daily_records(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 启用 RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can manage own journal entries"
  ON journal_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

## 正确性属性

*属性是系统在所有有效执行中应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 解封状态切换

*对于任意* 已封存的记录，执行解封操作后，isSealed 应变为 false，且原有数据（任务、日记条目）保持不变

**Validates: Requirements 1.2, 1.5**

### Property 2: 解封后可编辑

*对于任意* 解封后的记录，添加任务、删除任务、修改任务、添加日记条目操作应全部成功

**Validates: Requirements 1.3, 1.4**

### Property 3: 再次封存时间更新

*对于任意* 解封后再次封存的记录，sealedAt 应更新为新的封存时间，且新时间晚于原封存时间

**Validates: Requirements 5.2**

### Property 4: 日记条目添加

*对于任意* 非空内容字符串，添加日记条目后，条目列表长度应增加 1，且新条目包含正确的内容和创建时间

**Validates: Requirements 6.1, 6.2**

### Property 5: 日记条目排序

*对于任意* 包含多条日记条目的记录，条目应按创建时间倒序排列（最新的在前）

**Validates: Requirements 6.3**

### Property 6: 空白日记拒绝

*对于任意* 仅包含空白字符的内容字符串，添加日记条目操作应被拒绝，条目列表保持不变

**Validates: Requirements 8.3**

### Property 7: 日记条目删除

*对于任意* 未封存记录中的日记条目，删除操作后，该条目应从列表中移除，其他条目保持不变

**Validates: Requirements 7.3**

### Property 8: 封存后不可编辑日记

*对于任意* 已封存的记录，添加、编辑、删除日记条目操作应全部失败

**Validates: Requirements 7.4**

### Property 9: 整体心情取值

*对于任意* 包含带心情日记条目的记录，整体心情应等于最后一条带心情条目的心情值

**Validates: Requirements 9.4**

### Property 10: 日记本按月分组

*对于任意* 日记记录集合，按月分组后，同一月份的记录应在同一组内，且组按时间倒序排列

**Validates: Requirements 10.2**

## 错误处理

### 解封错误

- 网络错误时显示重试提示
- 数据库更新失败时回滚本地状态

### 日记条目错误

- 空白内容提示"请输入日记内容"
- 保存失败时保留输入内容，显示错误提示

### 数据迁移错误

- 迁移失败时保留原有数据格式
- 记录迁移日志便于排查

## 测试策略

### 单元测试

使用 Vitest 进行单元测试：

1. **解封功能测试**
   - unsealRecord 函数的状态切换
   - 解封后的编辑权限验证
   - 再次封存的时间更新

2. **日记条目测试**
   - addJournalEntry 函数的条目创建
   - deleteJournalEntry 函数的条目删除
   - editJournalEntry 函数的条目编辑
   - 空白内容验证

3. **日记本书架测试**
   - groupRecordsByMonth 函数的分组逻辑
   - 排序正确性验证

### 属性测试

使用 fast-check 进行属性测试：

1. **Property 1**: 解封状态切换
   - 生成随机已封存记录
   - 验证解封后状态和数据完整性

2. **Property 2**: 解封后可编辑
   - 生成随机解封记录
   - 验证各种编辑操作成功

3. **Property 3**: 再次封存时间更新
   - 生成随机解封记录和原封存时间
   - 验证新封存时间晚于原时间

4. **Property 4**: 日记条目添加
   - 生成随机非空字符串
   - 验证条目正确添加

5. **Property 5**: 日记条目排序
   - 生成随机多条目记录
   - 验证倒序排列

6. **Property 6**: 空白日记拒绝
   - 生成随机空白字符串
   - 验证添加被拒绝

7. **Property 7**: 日记条目删除
   - 生成随机记录和条目 ID
   - 验证删除正确执行

8. **Property 8**: 封存后不可编辑日记
   - 生成随机已封存记录
   - 验证编辑操作失败

9. **Property 9**: 整体心情取值
   - 生成随机带心情条目的记录
   - 验证整体心情正确

10. **Property 10**: 日记本按月分组
    - 生成随机日期的记录集合
    - 验证分组和排序正确

### 测试标注格式

每个属性测试必须使用以下格式标注：

```typescript
/**
 * **Feature: seal-enhancement, Property 1: 解封状态切换**
 * **Validates: Requirements 1.2, 1.5**
 */
```

### 测试配置

- 属性测试最少运行 100 次迭代
- 使用 fast-check 作为属性测试库
