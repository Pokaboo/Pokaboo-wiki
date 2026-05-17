-- 开启 uuid 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 模块表
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 分类表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- 3. 笔记表
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  status TEXT CHECK (status IN ('learning', 'completed', 'review')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 学习记录表
CREATE TABLE study_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- ==========================================
-- 配置行级权限 Row Level Security (RLS)
-- 确保每个人只能看到和修改自己的数据
-- ==========================================

-- 开启所有表的 RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

-- Modules 策略
CREATE POLICY "Users can manage their own modules" 
ON modules FOR ALL USING (auth.uid() = user_id);

-- Categories 策略
CREATE POLICY "Users can manage their own categories" 
ON categories FOR ALL USING (auth.uid() = user_id);

-- Notes 策略
CREATE POLICY "Users can manage their own notes" 
ON notes FOR ALL USING (auth.uid() = user_id);

-- Study Records 策略
CREATE POLICY "Users can manage their own study records" 
ON study_records FOR ALL USING (auth.uid() = user_id);
