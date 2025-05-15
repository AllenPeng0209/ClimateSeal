import type { User } from './users'; // Assuming User type is defined

// Represents the context_specific_data from the knowledge_contexts table
export interface KnowledgeUnitContextData {
  industryId?: string;
  enterpriseId?: string;
  countryCode?: string; // Example for law jurisdiction if represented by country code
  lawNumber?: string;
  // Add other potential context-specific fields as needed
  [key: string]: any; // Allows for flexibility
}

// Represents a single entry from the knowledge_units table, potentially enriched with context
export interface KnowledgeUnit {
  unitId: string; // Corresponds to unit_id (UUID)
  unitType: string; // e.g., 'ARTICLE', 'INDUSTRY_DATA_POINT', 'LAW', 'ENTERPRISE_POLICY'
  title: string;
  abstract?: string | null;
  contentMain: any; // JSONB in DB, can be a more specific type or Record<string, any>
  contentReferences?: any | null; // JSONB in DB
  sourceOriginal?: string | null;
  sourceInternalId?: string | null;
  publicationDate?: string | null; // ISO date string
  status: string; // e.g., 'DRAFT', 'PUBLISHED', 'ARCHIVED'
  languageCode: string; // Foreign key to languages table
  createdByUser?: User; // If you join with users table
  createdByUserId?: string; // UUID, direct foreign key
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  version: number;
  isDeleted: boolean;

  // --- Fields from knowledge_contexts (if joined/embedded) ---
  contextId?: number; // SERIAL PRIMARY KEY from knowledge_contexts
  contextType?: string | null; // e.g., 'INDUSTRY_CONTEXT', 'ENTERPRISE_CONTEXT', 'LAW_CONTEXT'
  contextSpecificData?: KnowledgeUnitContextData | null;

  /*
   * --- Fields from related entities (if joined/embedded) ---
   * These would typically be fetched separately or joined as needed
   * Example:
   * categories?: KnowledgeCategory[];
   * tags?: KnowledgeTag[];
   */
}

/*
 * You might also want types for categories and tags if not already defined
 * export interface KnowledgeCategory {
 *   id: number;
 *   name: string;
 *   // ... other fields
 * }
 *
 * export interface KnowledgeTag {
 *   id: number;
 *   name: string;
 *   // ... other fields
 * }
 */ 