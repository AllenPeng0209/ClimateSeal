-- Create vendor_import_results table to store import history
CREATE TABLE IF NOT EXISTS public.vendor_import_results (
    id BIGSERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('导入成功', '导入失败')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_file_path TEXT NOT NULL,
    error_file_path TEXT
);

-- Add RLS policies for vendor_import_results table
-- ALTER TABLE public.vendor_import_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view vendor import results
-- CREATE POLICY "Allow authenticated users to view vendor import results"
--     ON public.vendor_import_results
--     FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert vendor import results
-- CREATE POLICY "Allow authenticated users to insert vendor import results"
--     ON public.vendor_import_results
--     FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');

-- Create storage bucket for import files if it doesn't exist
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('imports', 'imports', false)
-- ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the imports bucket
-- CREATE POLICY "Allow authenticated users to upload import files"
--     ON storage.objects
    -- FOR INSERT
    -- WITH CHECK (
--         auth.role() = 'authenticated' AND
--         bucket_id = 'imports'
--     );

-- Allow authenticated users to download files from the imports bucket
-- CREATE POLICY "Allow authenticated users to download import files"
--     ON storage.objects
--     FOR SELECT
--     USING (
--         auth.role() = 'authenticated' AND
--         bucket_id = 'imports'
--     );

-- Add comment to the table
COMMENT ON TABLE public.vendor_import_results IS 'Stores the results of vendor import operations';