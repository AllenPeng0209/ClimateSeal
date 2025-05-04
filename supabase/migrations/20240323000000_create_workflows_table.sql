/*
  # Create Workflows Table

  1. New Tables
    - `workflows`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `status` (text, not null)
      - `industry` (text)
      - `type` (text)
      - `total_carbon_footprint` (numeric)
      - `user_id` (uuid, not null)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `workflows` table
    - Add policies for authenticated users to manage their own workflows
*/

CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  industry text,
  type text,
  total_carbon_footprint numeric DEFAULT 0,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own workflows
CREATE POLICY "Users can read own workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create their own workflows
CREATE POLICY "Users can create own workflows"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own workflows
CREATE POLICY "Users can update own workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own workflows
CREATE POLICY "Users can delete own workflows"
  ON workflows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at); 