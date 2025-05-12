-- Create vendor_data table
CREATE TABLE IF NOT EXISTS vendor_data (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL, -- 供应商数据类型 (e.g., 供应商因子)
    vendor_name VARCHAR(100) NOT NULL, -- 供应商名称
    deadline TIMESTAMP WITH TIME ZONE NOT NULL, -- 截止时间
    email VARCHAR(255) NOT NULL, -- 邮箱
    emission_source_name VARCHAR(255) NOT NULL, -- 排放源名称
    value NUMERIC(20, 10) NULL, -- 数值，允许小数点后10位
    unit VARCHAR(50) NULL, -- 单位
    evidence_file TEXT NULL, -- 证明材料（文件URL）
    data_submission_url TEXT NOT NULL, -- 数据填报链接
    status VARCHAR(20) NOT NULL CHECK (status IN ('待回复', '已回复', '已关闭')), -- 状态
    respondent VARCHAR(100) NULL, -- 回复人
    response_time TIMESTAMP WITH TIME ZONE NULL, -- 回复时间
    token VARCHAR(100) NOT NULL UNIQUE, -- 用于验证的唯一令牌
    remarks TEXT NULL, -- 备注
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 更新时间
    created_by VARCHAR(100) NOT NULL, -- 创建人
    updated_by VARCHAR(100) NOT NULL -- 更新人
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vendor_data_status ON vendor_data(status);
CREATE INDEX IF NOT EXISTS idx_vendor_data_vendor_name ON vendor_data(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_data_token ON vendor_data(token);

-- Create storage bucket for vendor data files
-- Note: This is a Supabase-specific command and would be executed in the Supabase dashboard
-- or via their API, not directly in SQL
-- CREATE STORAGE BUCKET vendor_data_files;

-- Create RLS policies for the vendor_data table
-- These are examples and should be adjusted according to your authentication setup

-- Enable RLS
-- ALTER TABLE vendor_data ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to select vendor data
-- CREATE POLICY "Authenticated users can view vendor data"
--     ON vendor_data
--     FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert vendor data
-- CREATE POLICY "Authenticated users can insert vendor data"
--     ON vendor_data
--     FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update vendor data they created
-- CREATE POLICY "Authenticated users can update their own vendor data"
--     ON vendor_data
--     FOR UPDATE
--     USING (auth.uid()::text = created_by)
--     WITH CHECK (auth.uid()::text = created_by);

-- Function to update the updated_at timestamp
-- CREATE OR REPLACE FUNCTION update_timestamp()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Trigger to automatically update the updated_at column
-- CREATE TRIGGER update_vendor_data_timestamp
-- BEFORE UPDATE ON vendor_data
-- FOR EACH ROW
-- EXECUTE FUNCTION update_timestamp(); 