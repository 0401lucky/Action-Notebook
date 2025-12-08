-- 专注记录表迁移脚本
-- 创建日期: 2024-12-02
-- 需求: 7.2 - 用户已登录且专注时段完成时，将专注记录同步到数据库

-- ============================================
-- 1. 创建专注记录表
-- ============================================
CREATE TABLE IF NOT EXISTS focus_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_description TEXT,
  duration INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加表注释
COMMENT ON TABLE focus_records IS '专注记录表，存储用户的番茄钟专注时段记录';
COMMENT ON COLUMN focus_records.id IS '记录 ID，UUID 自动生成';
COMMENT ON COLUMN focus_records.task_id IS '关联的任务 ID，任务删除时设为 NULL';
COMMENT ON COLUMN focus_records.task_description IS '任务描述快照，保留任务删除后的历史信息';
COMMENT ON COLUMN focus_records.duration IS '专注时长（分钟）';
COMMENT ON COLUMN focus_records.completed_at IS '专注完成时间';
COMMENT ON COLUMN focus_records.date IS '专注日期（YYYY-MM-DD）';
COMMENT ON COLUMN focus_records.user_id IS '用户 ID，关联 auth.users 表';
COMMENT ON COLUMN focus_records.created_at IS '记录创建时间';

-- ============================================
-- 2. 配置行级安全策略 (RLS)
-- ============================================
ALTER TABLE focus_records ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的专注记录
CREATE POLICY "用户只能查看自己的专注记录"
  ON focus_records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能创建自己的专注记录
CREATE POLICY "用户只能创建自己的专注记录"
  ON focus_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的专注记录
CREATE POLICY "用户只能更新自己的专注记录"
  ON focus_records FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能删除自己的专注记录
CREATE POLICY "用户只能删除自己的专注记录"
  ON focus_records FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 3. 创建索引优化查询性能
-- ============================================

-- 按用户和日期查询的复合索引（用于获取今日专注记录）
CREATE INDEX idx_focus_records_user_date ON focus_records(user_id, date);

-- 按任务 ID 查询的索引（用于统计任务的专注时长）
CREATE INDEX idx_focus_records_task_id ON focus_records(task_id);

-- 按完成时间查询的索引（用于时间范围查询）
CREATE INDEX idx_focus_records_completed_at ON focus_records(completed_at);
