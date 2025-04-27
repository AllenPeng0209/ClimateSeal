-- Migration file for creating certification related tables

-- Table to store main certification records linked to PCF projects
CREATE TABLE public.certification_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    pcf_project_id uuid NOT NULL, -- Assuming pcf_projects table uses uuid as PK
    certifier_org_id uuid,       -- Assuming organizations table uses uuid as PK
    auditor_user_id uuid,        -- Assuming users table uses uuid as PK (nullable if not assigned yet)
    certification_standard character varying NOT NULL,
    status character varying DEFAULT 'DRAFT'::character varying NOT NULL, -- DRAFT, PENDING_AUDIT, IN_AUDIT, NEED_REVISION, COMPLETED, CANCELLED
    creation_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    submission_time timestamp with time zone,
    completion_time timestamp with time zone,
    final_report_path character varying,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    -- Add foreign key constraints if pcf_projects, organizations, users tables exist
    -- CONSTRAINT fk_pcf_project FOREIGN KEY (pcf_project_id) REFERENCES public.pcf_projects(id),
    -- CONSTRAINT fk_certifier_org FOREIGN KEY (certifier_org_id) REFERENCES public.organizations(id),
    -- CONSTRAINT fk_auditor_user FOREIGN KEY (auditor_user_id) REFERENCES public.users(id)
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_certification_records_status ON public.certification_records(status);
CREATE INDEX idx_certification_records_pcf_project_id ON public.certification_records(pcf_project_id);
CREATE INDEX idx_certification_records_auditor_user_id ON public.certification_records(auditor_user_id);

-- Add comment on table
COMMENT ON TABLE public.certification_records IS 'Stores records for Product Carbon Footprint certification tasks.';

-- Table to store documents required and submitted for a certification record
CREATE TABLE public.certification_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    certification_record_id uuid NOT NULL,
    requirement_name character varying NOT NULL,
    description text,
    is_optional boolean DEFAULT false NOT NULL,
    source_type character varying DEFAULT 'NONE'::character varying NOT NULL, -- NONE, AUTO_LINKED_PCF, MANUAL_UPLOAD
    pcf_file_id uuid,            -- If source is AUTO_LINKED_PCF, the ID of the original file in PCF context
    file_path character varying, -- Path to the stored file (e.g., Supabase Storage path)
    file_name character varying,
    upload_time timestamp with time zone,
    audit_status character varying DEFAULT 'PENDING'::character varying NOT NULL, -- PENDING, APPROVED, REJECTED, CLARIFICATION_NEEDED
    audit_comment text,
    auditor_id uuid,             -- User ID of the auditor who reviewed this document
    audit_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_certification_record FOREIGN KEY (certification_record_id) REFERENCES public.certification_records(id) ON DELETE CASCADE -- Cascade delete if the record is deleted
    -- CONSTRAINT fk_auditor FOREIGN KEY (auditor_id) REFERENCES public.users(id) -- If linking auditor directly
);

-- Add indexes
CREATE INDEX idx_certification_documents_record_id ON public.certification_documents(certification_record_id);
CREATE INDEX idx_certification_documents_audit_status ON public.certification_documents(audit_status);

-- Add comment on table
COMMENT ON TABLE public.certification_documents IS 'Stores individual document requirements and submissions for a certification record.';

-- Optional: Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the tables
CREATE TRIGGER set_timestamp_records
BEFORE UPDATE ON public.certification_records
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_documents
BEFORE UPDATE ON public.certification_documents
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 