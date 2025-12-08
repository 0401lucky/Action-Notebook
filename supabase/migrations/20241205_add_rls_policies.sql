-- 为 daily_records 和 tasks 表添加 RLS 策略
-- 创建日期: 2024-12-05
-- 需求: 用户数据隔离

-- ============================================
-- 1. daily_records 表 RLS 策略
-- ============================================
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "用户只能查看自己的记录" ON daily_records;
DROP POLICY IF EXISTS "用户只能插入自己的记录" ON daily_records;
DROP POLICY IF EXISTS "用户只能更新自己的记录" ON daily_records;
DROP POLICY IF EXISTS "用户只能删除自己的记录" ON daily_records;

-- 用户只能查看自己的记录
CREATE POLICY "用户只能查看自己的记录"
  ON daily_records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能插入自己的记录
CREATE POLICY "用户只能插入自己的记录"
  ON daily_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的记录
CREATE POLICY "用户只能更新自己的记录"
  ON daily_records FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能删除自己的记录
CREATE POLICY "用户只能删除自己的记录"
  ON daily_records FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 2. tasks 表 RLS 策略
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "用户只能查看自己的任务" ON tasks;
DROP POLICY IF EXISTS "用户只能插入自己的任务" ON tasks;
DROP POLICY IF EXISTS "用户只能更新自己的任务" ON tasks;
DROP POLICY IF EXISTS "用户只能删除自己的任务" ON tasks;

-- 用户只能查看自己的任务
CREATE POLICY "用户只能查看自己的任务"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能插入自己的任务
CREATE POLICY "用户只能插入自己的任务"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的任务
CREATE POLICY "用户只能更新自己的任务"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能删除自己的任务
CREATE POLICY "用户只能删除自己的任务"
  ON tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 3. journal_entries 表 RLS 策略
-- ============================================
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "用户只能查看自己的日记条目" ON journal_entries;
DROP POLICY IF EXISTS "用户只能插入自己的日记条目" ON journal_entries;
DROP POLICY IF EXISTS "用户只能更新自己的日记条目" ON journal_entries;
DROP POLICY IF EXISTS "用户只能删除自己的日记条目" ON journal_entries;

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