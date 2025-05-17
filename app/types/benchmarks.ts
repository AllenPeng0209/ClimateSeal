import { type Industry } from './industries';

export interface IndustryBenchmark {
  id: number;
  industry?: string; // This was 'industry' (varchar) in DB, but seems like it should relate to the Industry table
  industryId?: string | null; // Foreign key to industries.industry_id
  process: string;
  unit: string;
  benchmarkValue: number;
  bestPracticeValue: number;
  source?: string | null;
  referenceYear?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // Relationships
  industryRel?: Industry | null; // Optional: if you want to nest the related Industry object
} 