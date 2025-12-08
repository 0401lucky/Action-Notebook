-- 用户资料表迁移脚本
-- 创建日期: 2024-12-02
-- 需求: 5.1 - 用户资料数据持久化到 Supabase 数据库

-- ============================================
-- 1. 创建用户资料表
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加表注释
COMMENT ON TABLE user_profiles IS '用户资料表，存储用户的昵称和头像等个人信息';
COMMENT ON COLUMN user_profiles.id IS '用户 ID，关联 auth.users 表';
COMMENT ON COLUMN user_profiles.nickname IS '用户昵称，1-20 个字符';
COMMENT ON COLUMN user_profiles.avatar_url IS '用户头像 URL';
COMMENT ON COLUMN user_profiles.created_at IS '记录创建时间';
COMMENT ON COLUMN user_profiles.updated_at IS '记录更新时间';

-- ============================================
-- 2. 创建更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. 配置行级安全策略 (RLS)
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的资料
CREATE POLICY "用户只能查看自己的资料"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 用户只能更新自己的资料
CREATE POLICY "用户只能更新自己的资料"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 用户只能插入自己的资料
CREATE POLICY "用户只能插入自己的资料"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. 创建头像存储桶
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. 配置存储桶安全策略
-- ============================================

-- 用户可以上传自己的头像
CREATE POLICY "用户可以上传自己的头像"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 任何人可以查看头像（公开访问）
CREATE POLICY "任何人可以查看头像"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 用户可以更新自己的头像
CREATE POLICY "用户可以更新自己的头像"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 用户可以删除自己的头像
CREATE POLICY "用户可以删除自己的头像"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 6. 创建新用户自动创建资料的触发器（可选）
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 当新用户注册时自动创建资料记录
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
