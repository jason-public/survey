export interface Question {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  category: string;
}

export interface SurveyTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  questions: Question[];
  legalText: string;
}

export interface SurveyResponse {
  templateId: string;
  answers: Record<string, string | string[]>;
  signatureType: 'draw' | 'upload';
  signatureDataUrl: string; // Base64 encoded png
  signerName: string;
  signedAt: string;
  consentAgreed: boolean;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  signerName: string;
  signedAt: string;
  pdfDataUrl?: string; // Optional cached or state-bound PDF download link
}
