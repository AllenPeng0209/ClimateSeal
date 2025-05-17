/**
 * app/types/industries.ts
 * Defines the type for industry information.
 */

export interface Industry {
  industryId: string; // Corresponds to industry_id (uuid) in the database
  name: string;
  code?: string | null;
  description?: string | null;
  parentIndustryId?: string | null; // For hierarchical structure
  // subIndustries?: Industry[]; // Optional: for directly embedding children, if API provides it
  createdAt?: string; // Corresponds to created_at (timestamp with time zone)
  updatedAt?: string; // Corresponds to updated_at (timestamp with time zone)
} 