-- ==========================================
-- 迁移脚本：为现有表添加 user_id 列
-- 问题：modules/categories/notes/study_records 表创建时缺少 user_id 列
-- 导致 INSERT 操作报错 "column modules.user_id does not exist"
-- ==========================================

-- 1. 为 modules 表添加 user_id 列
ALTER TABLE modules 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. 为 categories 表添加 user_id 列
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. 为 notes 表添加 user_id 列
ALTER TABLE notes 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. 为 study_records 表添加 user_id 列
ALTER TABLE study_records 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==========================================
-- 配置行级权限 Row Level Security (RLS)
-- 确保每个人只能看到和修改自己的数据
-- ==========================================

-- 开启所有表的 RLS（如果尚未开启）
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

-- 删除可能已存在的旧策略（避免冲突）
DROP POLICY IF EXISTS "Users can manage their own modules" ON modules;
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their own notes" ON notes;
DROP POLICY IF EXISTS "Users can manage their own study records" ON study_records;

-- 重新创建 RLS 策略
CREATE POLICY "Users can manage their own modules" 
  ON modules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own categories" 
  ON categories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notes" 
  ON notes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own study records" 
  ON study_records FOR ALL USING (auth.uid() = user_id);
