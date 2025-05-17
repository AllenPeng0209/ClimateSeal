/**
 * app/types/productFootprintReport.ts
 * Defines the structure for a summarized Product Carbon Footprint (PCF) report,
 * derived from a completed workflow. This is intended for sharing and downstream use.
 */

import type { ModelScoreType } from './scores';

export interface LifecycleStageContribution {
  stageName: string; // e.g., "Raw Material Acquisition", "Manufacturing", "Distribution"
  carbonFootprintKgCO2e: number;
  percentageOfTotal: number;
}

export interface ProductFootprintReportData {
  reportId: string; // Unique ID for this specific report instance
  reportVersion: string; // Version of this report (e.g., "1.0", "1.1")
  generatedAt: string; // ISO Timestamp of when this report was generated
  validUntil?: string; // Optional: ISO Timestamp indicating how long this PCF is considered valid

  // Product Identification
  productName: string;
  productIdentifier?: string; // e.g., SKU, Part Number
  productDescription?: string;
  functionalUnit: string; // e.g., "1 kg of product", "one item"

  // Core Footprint Values
  totalCarbonFootprintKgCO2e: number;

  // System Boundaries and Methodology
  systemBoundary: string; // e.g., "Cradle-to-Gate", "Cradle-to-Grave"
  calculationStandard: string; // e.g., "ISO 14067:2018", "GHG Protocol Product Standard"
  dataCollectionPeriod?: { // Optional if not always available/relevant for summary
    start?: string; // ISO Timestamp
    end?: string;   // ISO Timestamp
  };
  exclusions?: string; // Brief description of any notable exclusions

  // Data Quality and Assurance
  primaryDataShare?: number; // Percentage (0-100)
  secondaryDataSources?: string; // Summary of main secondary data sources
  keyAssumptions?: string;
  uncertaintyStatement?: string;
  modelScores?: Pick<ModelScoreType, 'credibilityScore' | 'completeness' | 'traceability' | 'validation'>;

  verificationStatus: 'Not Verified' | 'Self-Assessed' | 'Third-Party Assured' | 'Third-Party Verified';
  verifierName?: string;
  verificationReportLink?: string;
  verificationDate?: string; // ISO Timestamp

  // Breakdown
  lifecycleBreakdown?: LifecycleStageContribution[];

  // Issuing Company
  issuerName: string;
  issuerIdentifier?: string; // e.g., LEI, VAT ID
  issuerContact?: string; // Email or contact point

  // Link back to original detailed data
  relatedWorkflowId: string;
  notes?: string;
} 