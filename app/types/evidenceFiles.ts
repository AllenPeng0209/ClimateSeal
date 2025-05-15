/**
 * app/types/evidenceFiles.ts
 * Defines the type for evidence file records associated with nodes.
 */

export interface EvidenceFile {
  id: string;
  name: string;
  type: string; // Type of the file, e.g., 'pdf', 'jpg', 'xlsx'
  uploadTime: string; // ISO Timestamp
  url?: string; // Optional URL for preview/download
  status: string; // Status of the file itself (e.g., 'uploaded', 'parsing', 'parsed', 'verified', 'error')
  size?: number; // File size in bytes
  mimeType?: string; // MIME type of the file
  content?: string; // Optional: Cached text content if parsed, or other relevant data
  /*
   * Consider adding fields related to verification if they are specific to the file itself
   * verificationStatus?: 'verified' | 'unverified' | 'verification_failed';
   * verificationNotes?: string;
   */
} 