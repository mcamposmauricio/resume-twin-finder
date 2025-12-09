// Types for CompareCV

export interface SoftSkill {
  name: string;
  score: number; // 0-100
}

export interface CulturalFit {
  results_orientation: number; // 0-100
  process_orientation: number; // 0-100
  people_orientation: number; // 0-100
  innovation_orientation: number; // 0-100
}

export interface InferredInfo {
  seniority_level: string;
  estimated_salary_range: string;
  tools_and_technologies: string[];
  industry_experience: string[];
  education_level: string;
  languages: string[];
  certifications: string[];
  leadership_experience: string;
  remote_work_compatibility: string;
  availability: string;
}

export interface GapAnalysis {
  strong_match: string[];
  moderate_match: string[];
  weak_or_missing: string[];
}

export interface CandidateResult {
  candidate_name: string;
  file_name: string;
  match_score: number; // 0-100
  technical_fit: number; // 0-100
  potential_fit: number; // 0-100
  summary: string;
  years_experience: number;
  soft_skills: SoftSkill[];
  cultural_fit: CulturalFit;
  red_flags: string[];
  gap_analysis: GapAnalysis;
  inferred_info: InferredInfo;
}

export interface AnalysisResult {
  candidates: CandidateResult[];
  recommendation: string;
  comparison_summary: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  content: string; // base64 or text content
}

export type AppStep = 'welcome' | 'input' | 'loading' | 'results' | 'error';
