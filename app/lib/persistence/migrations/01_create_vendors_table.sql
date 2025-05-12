-- Create vendors table for vendor management
CREATE TABLE IF NOT EXISTS public.vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  contact_person VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(50) NOT NULL,
  address VARCHAR(200),
  remarks TEXT,
  status VARCHAR(10) CHECK (status IN ('启用', '禁用')) NOT NULL DEFAULT '启用',
  updated_by VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policy for reading vendors (all authenticated users can read)
-- CREATE POLICY "Allow authenticated users to read vendors"
--   ON public.vendors
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Create policy for inserting vendors (all authenticated users can insert)
-- CREATE POLICY "Allow authenticated users to insert vendors"
--   ON public.vendors
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- Create policy for updating vendors (all authenticated users can update)
-- CREATE POLICY "Allow authenticated users to update vendors"
--   ON public.vendors
--   FOR UPDATE
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- Create policy for deleting vendors (all authenticated users can delete)
-- CREATE POLICY "Allow authenticated users to delete vendors"
--   ON public.vendors
--   FOR DELETE
--   TO authenticated
--   USING (true);

-- Add some initial test data
INSERT INTO public.vendors (name, contact_person, phone, email, address, remarks, status, updated_by)
VALUES 
  ('测试供应商1', '联系人1', '13800000001', 'test1@example.com', '北京市海淀区', '备注信息1', '启用', 'System'),
  ('测试供应商2', '联系人2', '13800000002', 'test2@example.com', '上海市浦东新区', '备注信息2', '启用', 'System'),
  ('测试供应商3', '联系人3', '13800000003', 'test3@example.com', '广州市天河区', '', '禁用', 'System');