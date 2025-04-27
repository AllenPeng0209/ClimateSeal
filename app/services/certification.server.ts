// Use type-only import for SupabaseClient to avoid CJS/ESM issues with Vite
import type { SupabaseClient } from '@supabase/supabase-js';
// Assuming you have a way to get the Supabase client instance
// import { getSupabaseClient } from '~/lib/supabase';
// Import the actual client instance
import { supabase } from '~/lib/supabase'; // Corrected import path based on search results
// Removed import for non-existent module
// import { getCertificationTemplate } from './certification-templates';

// Placeholder types - replace with actual types if defined elsewhere
// Consider defining these in a shared types file, e.g., ~/types/certification.ts
export interface CertificationRecord {
    id: string;
    pcf_project_id: string;
    certifier_org_id?: string | null;
    auditor_user_id?: string | null;
    certification_standard: string;
    status: string; // DRAFT, PENDING_AUDIT, IN_AUDIT, NEED_REVISION, COMPLETED, CANCELLED
    creation_time: string;
    submission_time?: string | null;
    completion_time?: string | null;
    final_report_path?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CertificationDocument {
    id: string;
    certification_record_id: string;
    requirement_name: string;
    description?: string | null;
    is_optional: boolean;
    source_type: string; // NONE, AUTO_LINKED_PCF, MANUAL_UPLOAD
    pcf_file_id?: string | null;
    file_path?: string | null;
    file_name?: string | null;
    upload_time?: string | null;
    audit_status: string; // PENDING, APPROVED, REJECTED, CLARIFICATION_NEEDED
    audit_comment?: string | null;
    auditor_id?: string | null;
    audit_time?: string | null;
    created_at: string;
    updated_at: string;
}

type User = any; // Assuming a user type exists
type PCFProject = any; // Assuming a PCF project type exists
type PCFFile = any; // Assuming a type for files within PCF context

// Example placeholder for template fetching logic - Kept near the top
function getCertificationTemplate(standard: string): { name: string; description: string; isOptional?: boolean }[] {
    if (standard === 'ISO 14067') {
        return [
            { name: 'LCA Report', description: 'Full Life Cycle Assessment report.' },
            { name: 'Goal and Scope Definition', description: "Documentation of the study's goal and scope." },
            { name: 'Life Cycle Inventory (LCI) Data', description: 'Aggregated LCI results and underlying data sources.' },
            { name: 'Data Quality Assessment', description: 'Evaluation of data quality according to defined metrics.' },
            { name: 'Critical Review Statement', description: 'Statement from critical reviewer (if applicable).', isOptional: true },
            { name: 'Uncertainty Analysis', description: 'Analysis of uncertainty in the results.', isOptional: true },
            // Add other ISO 14067 requirements
        ];
    }
    console.warn(`Certification template not found for standard: ${standard}`);
    return [];
}

/**
 * Service functions for managing certification processes.
 */

interface InitiateCertificationArgs {
    // supabase client is now imported directly
    pcfProjectId: string;
    userId: string; // ID of the user initiating
    certifierOrgId?: string;
    certificationStandard: string;
}

/**
 * Initiates a new certification record for a PCF project.
 * Creates initial document requirements based on the standard.
 * Attempts to auto-link existing PCF documents.
 */
export async function initiateCertification(
    args: InitiateCertificationArgs
): Promise<{ record: CertificationRecord; documents: CertificationDocument[] }> {
    const { pcfProjectId, userId, certifierOrgId, certificationStandard } = args;
    console.log('Initiating certification for PCF Project:', pcfProjectId);

    // 1. Create CertificationRecord in the database
    const { data: newRecord, error: recordError } = await supabase
        .from('certification_records')
        .insert({
            pcf_project_id: pcfProjectId,
            certifier_org_id: certifierOrgId,
            certification_standard: certificationStandard,
            status: 'DRAFT',
            // Assuming user initiating might not be the auditor initially
            // auditor_user_id: userId, // Or maybe set later?
        })
        .select()
        .single();

    if (recordError || !newRecord) {
        console.error('Error creating certification record:', recordError);
        throw new Error(`Failed to create certification record: ${recordError?.message}`);
    }

    // 2. Generate initial CertificationDocument entries based on standard
    const templateDocuments = getCertificationTemplate(certificationStandard);
    if (templateDocuments.length === 0) {
         console.warn(`No document requirements found for standard ${certificationStandard}. Proceeding without initial documents.`);
         // Return early if no template found? Or allow creation of empty record?
         // For now, return the record with empty documents array.
          return { record: newRecord, documents: [] };
    }

    const initialDocsData = templateDocuments.map(req => ({
        certification_record_id: newRecord.id,
        requirement_name: req.name,
        description: req.description,
        is_optional: req.isOptional || false,
        source_type: 'NONE',
        audit_status: 'PENDING',
    }));

    const { data: createdDocsResult, error: docsError } = await supabase
        .from('certification_documents')
        .insert(initialDocsData)
        .select();

    // Ensure createdDocs is always an array, even if insert returns null/error
    let createdDocs: CertificationDocument[] = createdDocsResult || [];

    if (docsError) {
        console.error('Error creating initial certification documents:', docsError);
        // Decide on cleanup strategy or log and proceed
        // For now, log the error and proceed with potentially empty/partial createdDocs
    }

    // 3. Attempt to auto-link documents from PCF project (Simplified example)
    // This requires knowing how PCF files are stored and identified
    if (createdDocs.length > 0) {
        try {
            const { data: pcfFiles, error: pcfFilesError } = await supabase
                .from('pcf_project_files') // ASSUMING this table exists
                .select('id, file_name, file_path, metadata_tag') // Assuming relevant columns
                .eq('pcf_project_id', pcfProjectId);

            if (pcfFilesError) {
                console.warn('Could not fetch PCF files for auto-linking:', pcfFilesError);
            } else if (pcfFiles && pcfFiles.length > 0) {
                const updates: Partial<CertificationDocument>[] = [];
                for (const doc of createdDocs) {
                    // Example matching logic: match requirement name to a file tag/name
                    const matchingPcfFile = pcfFiles.find(f =>
                        f.metadata_tag === doc.requirement_name || // Match by tag
                        f.file_name?.includes(doc.requirement_name) // Simple name check
                    );

                    if (matchingPcfFile) {
                        updates.push({
                            id: doc.id, // Need the ID to update
                            source_type: 'AUTO_LINKED_PCF',
                            pcf_file_id: matchingPcfFile.id,
                            file_path: matchingPcfFile.file_path, // Use path from PCF file
                            file_name: matchingPcfFile.file_name,
                            upload_time: new Date().toISOString(), // Or use PCF file upload time if available
                        });
                    }
                }

                if (updates.length > 0) {
                    // Perform batch update - Supabase upsert might be better if IDs are known
                     for (const update of updates) {
                         const { error: updateError } = await supabase
                             .from('certification_documents')
                             .update({
                                 source_type: update.source_type,
                                 pcf_file_id: update.pcf_file_id,
                                 file_path: update.file_path,
                                 file_name: update.file_name,
                                 upload_time: update.upload_time,
                             })
                             .eq('id', update.id);
                         if (updateError) {
                             console.warn(`Failed to auto-link document ${update.id}:`, updateError);
                         }
                     }
                    // Refresh documents data after potential updates
                     const { data: refreshedDocs, error: refreshError } = await supabase
                         .from('certification_documents')
                         .select('*')
                         .eq('certification_record_id', newRecord.id);

                     if (refreshError) {
                          console.error('Error refreshing documents after auto-link:', refreshError);
                          // Proceed with potentially stale createdDocs data?
                     } else {
                         createdDocs = refreshedDocs || []; // Update the docs array
                     }
                }
            }
        } catch (linkError) {
            console.error("Error during auto-linking attempt:", linkError);
            // Non-fatal, proceed without auto-linking
        }
    }

    // 4. Return the created record and documents
    return { record: newRecord, documents: createdDocs };
}

interface GetCertificationDataArgs {
    // supabase client is now imported directly
    pcfProjectId: string;
}

/**
 * Fetches the certification record and associated documents for a given PCF project ID.
 * Returns the latest active (non-cancelled) record if multiple exist, or null.
 */
export async function getCertificationDataByPcfId(
    args: GetCertificationDataArgs
): Promise<{ record: CertificationRecord | null; documents: CertificationDocument[] }> {
    const { pcfProjectId } = args;
    console.log('Fetching certification data for PCF Project:', pcfProjectId);

    // 1. Query the latest non-cancelled certification_records table for the pcfProjectId
    const { data: records, error: recordError } = await supabase
        .from('certification_records')
        .select('*')
        .eq('pcf_project_id', pcfProjectId)
        .neq('status', 'CANCELLED') // Exclude cancelled records
        .order('created_at', { ascending: false }) // Get the latest first
        .limit(1); // We only care about the most recent active one for the UI

    if (recordError) {
        console.error('Error fetching certification record:', recordError);
        throw new Error(`Failed to fetch certification record: ${recordError.message}`);
    }

    const record = records?.[0] || null;

    if (!record) {
        // No active certification record found for this project
        return { record: null, documents: [] };
    }

    // 2. If record found, query certification_documents for the record ID
    const { data: documents, error: docsError } = await supabase
        .from('certification_documents')
        .select('*')
        .eq('certification_record_id', record.id)
        .order('created_at', { ascending: true }); // Order consistently

    if (docsError) {
        console.error('Error fetching certification documents:', docsError);
        throw new Error(`Failed to fetch certification documents: ${docsError.message}`);
    }

    // 3. Return data
    return { record, documents: documents || [] };
}

interface UploadDocumentArgs {
    // supabase client is now imported directly
    certificationRecordId: string;
    documentId: string; // ID of the document entry to update
    file: File; // The uploaded file object
    userId: string; // User performing the upload
}

/**
 * Uploads a document file to storage and updates the corresponding
 * certification_documents entry. This handles MANUAL uploads/replacements.
 */
export async function uploadCertificationDocument(args: UploadDocumentArgs): Promise<CertificationDocument> {
    const { certificationRecordId, documentId, file, userId } = args;
    console.log('Uploading manual document for doc ID:', documentId, 'in record:', certificationRecordId);

    // Define a storage path (example structure)
    const filePath = `certification/${certificationRecordId}/${documentId}/${file.name}`;

    // 1. Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certification-files') // ASSUMING a bucket named 'certification-files' exists
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Replace if file already exists at this path
        });

    if (uploadError || !uploadData) {
        console.error('Error uploading file to storage:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError?.message}`);
    }

    // 2. Update the certification_documents entry
    const { data: updatedDoc, error: updateError } = await supabase
        .from('certification_documents')
        .update({
            file_path: uploadData.path, // Use the path returned by storage
            file_name: file.name,
            upload_time: new Date().toISOString(),
            source_type: 'MANUAL_UPLOAD',
            audit_status: 'PENDING', // Reset audit status on new upload
            audit_comment: null,    // Clear previous comment
            audit_time: null,
            auditor_id: null,
        })
        .eq('id', documentId)
        .select()
        .single();

    if (updateError || !updatedDoc) {
        console.error('Error updating certification document record:', updateError);
        // Consider cleanup: delete the uploaded file from storage?
        throw new Error(`Failed to update document record: ${updateError?.message}`);
    }

    // 3. Return the updated document record
    return updatedDoc;
}

// --- Other function signatures (to be implemented later) ---

interface SubmitAuditArgs {
    // supabase is imported
    certificationRecordId: string;
    userId: string; // User submitting
}
export async function submitCertificationForAudit(args: SubmitAuditArgs): Promise<CertificationRecord> {
    const { certificationRecordId } = args;
    console.log('Submitting record for audit:', certificationRecordId);

    const { data: updatedRecord, error } = await supabase
        .from('certification_records')
        .update({
            status: 'PENDING_AUDIT',
            submission_time: new Date().toISOString(),
         })
        .eq('id', certificationRecordId)
        .select()
        .single();

    if (error || !updatedRecord) {
        console.error('Error updating record status to PENDING_AUDIT:', error);
        throw new Error(`Failed to submit for audit: ${error?.message}`);
    }
    return updatedRecord;
}

interface UpdateAuditStatusArgs {
    // supabase is imported
    documentId: string;
    auditStatus: string; // e.g., 'APPROVED', 'REJECTED', 'CLARIFICATION_NEEDED'
    auditComment?: string;
    auditorId: string; // User ID of the auditor
}
export async function updateDocumentAuditStatus(args: UpdateAuditStatusArgs): Promise<CertificationDocument> {
    const { documentId, auditStatus, auditComment, auditorId } = args;
    console.log('Updating audit status for doc:', documentId, 'to', auditStatus);

    const { data: updatedDoc, error } = await supabase
        .from('certification_documents')
        .update({
            audit_status: auditStatus,
            audit_comment: auditComment,
            auditor_id: auditorId,
            audit_time: new Date().toISOString(),
         })
        .eq('id', documentId)
        .select()
        .single();

     if (error || !updatedDoc) {
        console.error('Error updating document audit status:', error);
        throw new Error(`Failed to update audit status: ${error?.message}`);
    }

    // Optional: Check if all docs are approved to update the main record status
    // This might be better handled in a separate function or trigger

    return updatedDoc;
}

interface UploadFinalReportArgs {
    // supabase is imported
    certificationRecordId: string;
    file: File;
    auditorId: string;
}
export async function uploadFinalCertificationReport(args: UploadFinalReportArgs): Promise<CertificationRecord> {
    const { certificationRecordId, file, auditorId } = args;
    console.log('Uploading final report for record:', certificationRecordId);

    // 1. Upload final report to Supabase Storage
    const filePath = `certification/${certificationRecordId}/final_report/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certification-files') // Use the same bucket or a dedicated one
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

     if (uploadError || !uploadData) {
        console.error('Error uploading final report to storage:', uploadError);
        throw new Error(`Failed to upload final report: ${uploadError?.message}`);
    }

    // 2. Update certification_records with finalReportPath and status = 'COMPLETED'
    const { data: updatedRecord, error: updateError } = await supabase
        .from('certification_records')
        .update({
            final_report_path: uploadData.path,
            status: 'COMPLETED',
            completion_time: new Date().toISOString(),
            // Optionally record who uploaded the final report if needed
            // auditor_user_id: auditorId, // Or a dedicated field?
        })
        .eq('id', certificationRecordId)
        .select()
        .single();

    if (updateError || !updatedRecord) {
        console.error('Error updating record status to COMPLETED:', updateError);
        // Consider cleanup?
        throw new Error(`Failed to finalize certification record: ${updateError?.message}`);
    }

    return updatedRecord;
}

// TODO: Add permission checks within these functions or in the calling actions/loaders.
// TODO: Define potential PCF file query logic more concretely (table name, columns).
// TODO: Define storage bucket name ('certification-files') and ensure it exists with proper policies. 