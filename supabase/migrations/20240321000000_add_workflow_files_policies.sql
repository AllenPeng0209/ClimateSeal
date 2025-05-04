/*
  # Add RLS Policies for workflow_files table

  1. Security
    - Enable RLS on workflow_files table
    - Add policies for authenticated users to manage their own workflow files
*/

-- Enable RLS on workflow_files table
ALTER TABLE workflow_files ENABLE ROW LEVEL SECURITY;

-- Allow users to read files associated with their workflows
CREATE POLICY "Users can read their workflow files"
  ON workflow_files
  FOR SELECT
  TO authenticated
  USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert files into their workflows
CREATE POLICY "Users can insert files into their workflows"
  ON workflow_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete files from their workflows
CREATE POLICY "Users can delete files from their workflows"
  ON workflow_files
  FOR DELETE
  TO authenticated
  USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  ); 