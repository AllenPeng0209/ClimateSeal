export interface AISummaryReport {
  credibilityScore: number;
  missingLifecycleStages: string[];
  isExpanded: boolean;
  modelCompleteness: {
    score: number;
    lifecycleCompleteness: number;
    nodeCompleteness: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  massBalance: {
    score: number;
    ratio: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  dataTraceability: {
    score: number;
    coverage: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  validation: {
    score: number;
    consistency: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  expandedSection: 'overview' | 'details' | null;
}

export const initialAiSummaryReport: AISummaryReport = {
  credibilityScore: 0,
  missingLifecycleStages: [],
  isExpanded: true,
  modelCompleteness: {
    score: 0,
    lifecycleCompleteness: 0,
    nodeCompleteness: 0,
    incompleteNodes: [],
  },
  massBalance: {
    score: 0,
    ratio: 0,
    incompleteNodes: [],
  },
  dataTraceability: {
    score: 0,
    coverage: 0,
    incompleteNodes: [],
  },
  validation: {
    score: 0,
    consistency: 0,
    incompleteNodes: [],
  },
  expandedSection: null,
}; 