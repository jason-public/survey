import React from 'react';
import { Question, SurveyTemplate } from '../types';

interface DocumentTemplateProps {
  template: SurveyTemplate;
  answers: Record<string, string | string[]>;
  signatureDataUrl: string;
  signerName: string;
  signedAt: string;
  documentRef: React.RefObject<HTMLDivElement | null>;
}

export default function DocumentTemplate({
  template,
  answers,
  signatureDataUrl,
  signerName,
  signedAt,
  documentRef
}: DocumentTemplateProps) {
  
  // Format dates or other specialized values
  const getDisplayValue = (question: Question) => {
    const val = answers[question.id];
    if (val === undefined || val === '') return 'N/A';
    if (Array.isArray(val)) {
      return val.join(', ');
    }
    return val;
  };

  // Group questions by category
  const categories = Array.from(new Set(template.questions.map(q => q.category)));

  return (
    <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-3xl bg-gray-50 p-6 flex justify-center shadow-inner">
      {/* 
        This is the actual page rendered to PDF. 
        It has a fixed aspect ratio of A4 (210mm x 297mm) inside the print context,
        but has styled sizing for screen display.
      */}
      <div 
        ref={documentRef}
        id="pdf-document-root"
        className="w-[794px] min-h-[1123px] bg-white p-12 relative flex flex-col justify-between text-gray-800 shadow-lg text-sm font-sans shrink-0 border border-gray-100"
        style={{ width: '794px', minHeight: '1123px' }}
      >
        <div>
          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-6 mb-8 text-center">
            <div className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2">
              Official Document Certification
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
              {template.title}
            </h1>
            <p className="text-sm text-gray-500">
              {template.subtitle}
            </p>
          </div>

          {/* Description Block */}
          <div className="bg-gray-50 rounded-xl p-5 mb-8 text-xs text-gray-600 border border-gray-100 leading-relaxed">
            <span className="font-bold block text-gray-800 mb-1">■ 서류 발급 목적 및 취지</span>
            {template.description}
          </div>

          {/* Core Content - Survey Answers */}
          <div className="space-y-6 mb-8">
            <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#3182F6] pl-2.5 mb-4">
              기재 사항 및 문항 응답 정보
            </h2>
            
            <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
              {template.questions.map((question) => (
                <div key={question.id} className="py-3 flex flex-row items-start">
                  <div className="w-1/3 text-xs font-bold text-gray-500 pr-4 pt-0.5">
                    {question.label}
                  </div>
                  <div className="w-2/3 text-sm font-semibold text-gray-900 break-words whitespace-pre-wrap">
                    {getDisplayValue(question)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal and Privacy Clauses */}
          <div className="mb-12">
            <h2 className="text-base font-bold text-gray-900 border-l-4 border-gray-400 pl-2.5 mb-4">
              법률적 고지 및 확인 서약
            </h2>
            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 text-xs text-gray-500 leading-relaxed text-justify">
              {template.legalText}
              <div className="mt-4 font-semibold text-gray-700">
                위 확인 사항 및 약관에 대해 충분히 숙지하였으며, 본 서명으로써 그 이행 및 책임에 완전한 동의를 표명합니다.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Signature Block */}
        <div className="border-t border-gray-200 pt-8 mt-auto flex justify-between items-end">
          <div>
            <div className="text-xs text-gray-400 mb-1">문서 번호</div>
            <div className="text-xs font-mono font-semibold text-gray-600 uppercase mb-4">
              DOC-{(template.id.slice(0, 4) + '-' + signedAt.replace(/[^0-9]/g, '').slice(2, 10))}
            </div>
            <div className="text-xs text-gray-500">
              본 문서는 본인 확인 절차를 거쳐 전자 자필 서명과 결합되어 효력을 갖는 증빙 서류입니다.
            </div>
          </div>

          <div className="flex flex-col items-end min-w-[200px]">
            <div className="text-xs text-gray-400 mb-1">제출 일시: {signedAt}</div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-bold text-gray-700">작성 및 서명인:</span>
              <span className="text-base font-extrabold text-gray-900 underline underline-offset-4 decoration-2 decoration-[#3182F6]">
                {signerName || '홍길동'}
              </span>
              <span className="text-sm font-semibold text-gray-500">(인)</span>
            </div>

            {/* Signature Placement with aspect-ratio care */}
            <div className="relative mt-4 w-40 h-20 border border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50/20 overflow-hidden">
              {signatureDataUrl ? (
                <img 
                  src={signatureDataUrl} 
                  alt="자필 서명" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs text-gray-300 font-medium">서명 미완료</span>
              )}
              {/* Seal or stamp bg watermark for credibility */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-rose-400/20 rounded-full flex items-center justify-center text-[8px] font-bold text-rose-500/20 pointer-events-none select-none rotate-12">
                서명 검인
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
