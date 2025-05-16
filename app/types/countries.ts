/**
 * app/types/countries.ts
 * Defines the type for country information.
 */

export interface Country {
  countryId: string; // Corresponds to country_id (uuid) in the database
  name: string;
  isoCode2?: string | null; // Corresponds to iso_code_2 (character)
  isoCode3?: string | null; // Corresponds to iso_code_3 (character)
  numericCode?: string | null; // Corresponds to numeric_code (character)
  notes?: string | null;
  createdAt?: string; // Corresponds to created_at (timestamp with time zone)
  updatedAt?: string; // Corresponds to updated_at (timestamp with time zone)
} 