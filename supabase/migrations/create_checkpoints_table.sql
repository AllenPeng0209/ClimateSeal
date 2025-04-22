/*
  # Create Carbon Workflow Checkpoints Table

  1. New Tables
    - `carbon_workflow_checkpoints`
      - `id` (text, primary key)
      - `name` (text, not null)
      - `timestamp` (bigint, not null)
      - `data` (jsonb, not null)
      - `metadata` (jsonb)
      - `user_id` (uuid, not null)
      - `last_updated` (timestamp with time zone)
  2. Security
    - Enable RLS on `carbon_workflow_checkpoints` table
    - Add policies for authenticated users to manage their own checkpoints
*/

CREATE TABLE IF NOT EXISTS carbon_workflow_checkpoints (
  id text PRIMARY KEY,
  name text NOT NULL,
  timestamp bigint NOT NULL,
  data jsonb NOT NULL,
  metadata jsonb,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE carbon_workflow_checkpoints ENABLE ROW LEVEL SECURITY;

-- 允许用户读取自己的检查点
CREATE POLICY "Users can read own checkpoints"
  ON carbon_workflow_checkpoints
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 允许用户创建自己的检查点
CREATE POLICY "Users can create own checkpoints"
  ON carbon_workflow_checkpoints
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的检查点
CREATE POLICY "Users can update own checkpoints"
  ON carbon_workflow_checkpoints
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的检查点
CREATE POLICY "Users can delete own checkpoints"
  ON carbon_workflow_checkpoints
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_checkpoints_user_id ON carbon_workflow_checkpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_timestamp ON carbon_workflow_checkpoints(timestamp); 