-- 日记条目表迁移脚本
-- 创建日期: 2024-12-02
-- 需求: 6.1 - 支持多条日记条目功能

-- ============================================
-- 1. 创建日记条目表
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id TEXT NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 添加表注释
COMMENT ON TABLE journal_entries IS '日记条目表，存储用户的多条日记记录';
COMMENT ON COLUMN journal_entries.id IS '日记条目唯一标识 (UUID)';
COMMENT ON COLUMN journal_entries.record_id IS '关联的每日记录 ID (日期格式 YYYY-MM-DD)';
COMMENT ON COLUMN journal_entries.content IS '日记内容';
COMMENT ON COLUMN journal_entries.mood IS '心情类型: happy, neutral, sad, excited, tired';
COMMENT ON COLUMN journal_entries.created_at IS '创建时间 (精确到分钟)';
COMMENT ON COLUMN journal_entries.user_id IS '用户 ID，关联 auth.users 表';

-- ============================================
-- 2. 创建索引
-- ============================================
-- 按记录 ID 查询的索引
CREATE INDEX IF NOT EXISTS idx_journal_entries_record_id 
  ON journal_entries(record_id);

-- 按用户 ID 查询的索引
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id 
  ON journal_entries(user_id);

-- 按创建时间排序的索引
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at 
  ON journal_entries(created_at DESC);

-- ============================================
-- 3. 配置行级安全策略 (RLS)
-- ============================================
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的日记条目
CREATE POLICY "用户只能查看自己的日记条目"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能插入自己的日记条目
CREATE POLICY "用户只能插入自己的日记条目"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的日记条目
CREATE POLICY "用户只能更新自己的日记条目"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能删除自己的日记条目
CREATE POLICY "用户只能删除自己的日记条目"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
