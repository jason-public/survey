import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  FileCheck, 
  CheckCircle2, 
  RefreshCw, 
  PenTool, 
  X, 
  AlertCircle,
  FileText,
  User,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

import { SURVEY_TEMPLATES } from './data';
import { SurveyTemplate, GeneratedDocument, Question } from './types';
import BentoOverview from './components/BentoOverview';
import SignatureCanvas from './components/SignatureCanvas';
import DocumentTemplate from './components/DocumentTemplate';

export default function App() {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [signatureType, setSignatureType] = useState<'draw' | 'upload'>('draw');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [signerName, setSignerName] = useState<string>('');
  const [consentAgreed, setConsentAgreed] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const documentRef = useRef<HTMLDivElement | null>(null);

  // Load documents from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('signed_documents');
    if (saved) {
      try {
        setGeneratedDocs(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading documents', e);
      }
    }
  }, []);

  // Update signerName when name-like fields are filled in the survey
  useEffect(() => {
    if (selectedTemplate) {
      // Find the first field that contains "name" or "성명" or "참여자" and auto-populate signerName
      const nameQuestion = selectedTemplate.questions.find(
        q => q.id.includes('name') || q.label.includes('성명') || q.label.includes('이름')
      );
      if (nameQuestion && answers[nameQuestion.id]) {
        setSignerName(String(answers[nameQuestion.id]));
      }
    }
  }, [answers, selectedTemplate]);

  // Handle template selection
  const handleSelectTemplate = (template: SurveyTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(0);
    setAnswers({});
    setSignatureDataUrl('');
    setSignerName('');
    setConsentAgreed(false);
    setValidationError('');
  };

  // Answer state modifiers
  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setValidationError('');
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const current = (answers[questionId] as string[]) || [];
    let updated: string[];
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter(o => o !== option);
    }
    handleAnswerChange(questionId, updated);
  };

  // Drag-and-drop for signature file upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSignatureFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSignatureFile(e.target.files[0]);
    }
  };

  const processSignatureFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError('PNG, JPG, JPEG 이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const maxFileSize = 3 * 1024 * 1024; // 3MB limit
    if (file.size > maxFileSize) {
      setValidationError('서명 이미지는 3MB 이하만 지원됩니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSignatureDataUrl(event.target.result as string);
        setValidationError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle step navigation with validation
  const handleNextStep = () => {
    if (!selectedTemplate) return;

    if (currentStep === 0) {
      // Validate step 0 (questions)
      const missingFields: string[] = [];
      selectedTemplate.questions.forEach(q => {
        if (q.required) {
          const val = answers[q.id];
          if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
            missingFields.push(q.label);
          }
        }
      });

      if (missingFields.length > 0) {
        setValidationError(`필수 입력 사항이 누락되었습니다: ${missingFields[0]}`);
        return;
      }
      
      setValidationError('');
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate step 1 (signature & agreement)
      if (!signatureDataUrl) {
        setValidationError('계약서에 첨부할 자필 서명을 그려주시거나 종이 서명 사진을 업로드해 주세요.');
        return;
      }
      if (!consentAgreed) {
        setValidationError('상단 서약서 약관 및 법적 고지 사항에 동의해야 문서 발급이 완료됩니다.');
        return;
      }
      if (!signerName.trim()) {
        setValidationError('서명인의 이름을 기재해 주세요.');
        return;
      }

      setValidationError('');
      setCurrentStep(2);
    }
  };

  // Generate and download PDF on clientside
  const handleDownloadPdf = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setValidationError('');

    const disabledStylesheets: (HTMLLinkElement | HTMLStyleElement)[] = [];

    try {
      // Small pause to allow styles to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = document.getElementById('pdf-document-root');
      if (!element) {
        throw new Error('PDF Element not found');
      }

      // Wait for all custom fonts to finish loading to prevent layout shifts or empty text
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (fontErr) {
          console.warn('Font loading promise failed, proceeding anyway:', fontErr);
        }
      }

      let imgData: string;

      try {
        // Primary modern approach: html-to-image (Uses native SVG foreignObject, crash-proof against CSS variables & Tailwind layer bugs)
        imgData = await toPng(element, {
          quality: 0.95,
          pixelRatio: 2.0, // Balanced high-resolution
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          }
        });
      } catch (toPngError) {
        console.warn('Primary toPng rendering failed, falling back to html2canvas...', toPngError);

        // Safe defense against cross-origin or extension-injected stylesheets that crash html2canvas
        const styleElements = document.querySelectorAll('link[rel="stylesheet"], style');
        styleElements.forEach((el) => {
          const htmlEl = el as HTMLLinkElement | HTMLStyleElement;
          try {
            if (htmlEl.sheet) {
              // Force access to cssRules. If it throws, it's a cross-origin sheet that crashes html2canvas.
              const rules = htmlEl.sheet.cssRules;
            }
          } catch (e) {
            // This is an inaccessible sheet (CORS / extension injected).
            // We temporarily disable it so html2canvas doesn't crash trying to parse it.
            try {
              htmlEl.disabled = true;
              disabledStylesheets.push(htmlEl);
            } catch (err) {
              // Ignore if we can't disable it
            }
          }
        });

        // Let html2canvas render the element
        const canvas = await html2canvas(element, {
          scale: 2.0, // Balanced crisp resolution & memory footprint
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          x: 0,
          y: 0,
          width: element.scrollWidth,
          height: element.scrollHeight,
        });

        // Restore style elements immediately after canvas is rendered
        disabledStylesheets.forEach((el) => {
          try {
            el.disabled = false;
          } catch (e) {
            // Ignore
          }
        });

        imgData = canvas.toDataURL('image/png');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      let imgHeight = 297; // Default A4 height fallback
      
      try {
        const img = new Image();
        img.src = imgData;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          setTimeout(() => reject(new Error('Image load timeout')), 2000);
        });
        imgHeight = (img.height * imgWidth) / img.width;
      } catch (dimErr) {
        console.warn('Failed to calculate perfect image dimensions, fallback to default A4 page height:', dimErr);
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Save document to history list
      const timestamp = new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newDoc: GeneratedDocument = {
        id: crypto.randomUUID(),
        title: selectedTemplate.title,
        signerName: signerName,
        signedAt: timestamp,
      };

      const updatedDocs = [newDoc, ...generatedDocs];
      setGeneratedDocs(updatedDocs);
      localStorage.setItem('signed_documents', JSON.stringify(updatedDocs));

      // Trigger download
      pdf.save(`${selectedTemplate.title}_${signerName}_확인서.pdf`);
    } catch (err) {
      console.error('Core PDF generation failed completely:', err);
      setValidationError('PDF 생성 중 오류가 발생했습니다. 브라우저 확장 프로그램 스타일 시트와의 충돌이나 iframe 다운로드 제한 때문일 수 있습니다. 상단의 주소창에서 "새 창으로 열기" 버튼을 누르시거나, 서명 수정을 누른 후 다시 한 번 시도해 주세요.');
    } finally {
      // Safely ensure everything is restored in case of any unhandled errors
      disabledStylesheets.forEach((el) => {
        try {
          el.disabled = false;
        } catch (e) {
          // Ignore
        }
      });
      setIsGenerating(false);
    }
  };

  // Reuse downloaded pdf logic from bento list (just download current dummy or alert)
  const handleDownloadHistoricDoc = (doc: GeneratedDocument) => {
    // For local history download mock-ups, we prompt the user to write again
    // Or we rebuild it dynamically using the template if cached, but for this demo,
    // we show a helpful Toast/notification.
    alert(`[${doc.title}] 문서는 법적으로 완전 위임 완료되었습니다. (인쇄본 다운로드는 서약자 '${doc.signerName}'님의 로컬 디바이스에 저장되었습니다.)`);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-gray-900 font-sans flex flex-col antialiased selection:bg-[#3182F6]/10 selection:text-[#3182F6]">
      {/* Premium Toss Style Global Gutter Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedTemplate(null)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3182F6] to-[#0050FF] flex items-center justify-center text-white shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-gray-900 text-base">Survey Document Signer</span>
              <span className="text-[10px] bg-[#3182F6]/10 text-[#3182F6] font-bold px-1.5 py-0.5 rounded-md ml-2">v1.2 Premium</span>
            </div>
          </div>

          {selectedTemplate && (
            <button
              onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4" />
              나가기
            </button>
          )}
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8">
        <AnimatePresence mode="wait">
          {!selectedTemplate ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Dashboard Bento Hub */}
              <div className="mb-6">
                <p className="text-sm font-bold text-[#3182F6] mb-1.5">서명 문서 무결성 솔루션</p>
                <h1 className="text-3xl font-black text-gray-950 tracking-tight leading-tight">
                  설문과 자필 서명을 결합하여<br />
                  법적 효력 있는 PDF를 생성하세요
                </h1>
              </div>

              <BentoOverview
                generatedDocs={generatedDocs}
                onSelectTemplate={handleSelectTemplate}
                onDownloadDoc={handleDownloadHistoricDoc}
              />

              {/* Step instructions banner */}
              <div className="bg-[#3182F6]/5 rounded-3xl p-6 border border-[#3182F6]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#3182F6] border border-gray-100 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">어떻게 작동하나요?</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      1. 원하는 서식을 선택하여 설문 응답을 기재합니다.<br />
                      2. 손글씨가 그려진 종이 사진을 첨부하거나 화면에 직접 서약 서명합니다.<br />
                      3. 최종 서명과 응답 정보가 합성된 고화질 PDF를 보관 및 다운로드 받습니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectTemplate(SURVEY_TEMPLATES[0])}
                  className="bg-[#3182F6] hover:bg-[#0050FF] text-white font-bold text-xs px-4 py-3 rounded-2xl transition-all flex items-center justify-center gap-1 shrink-0"
                >
                  바로 시작하기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm"
            >
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{selectedTemplate.emoji}</span>
                    <span className="text-xs font-bold text-[#3182F6]">{selectedTemplate.title}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                    {currentStep === 0 && '1단계: 정보 기입 설문'}
                    {currentStep === 1 && '2단계: 본인 인증 및 자필 서명'}
                    {currentStep === 2 && '3단계: 결합 문서 최종 확인 및 완료'}
                  </h2>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-1.5 bg-gray-100/70 p-1.5 rounded-2xl">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        currentStep === idx 
                          ? 'w-8 bg-[#3182F6]' 
                          : idx < currentStep 
                            ? 'w-2.5 bg-emerald-500' 
                            : 'w-2.5 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Show validation errors with shake-like animation */}
              {validationError && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Step 0: Question Form */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                    * 서명 서류 발급을 위한 설문 및 입력 문항입니다. 사실에 기반하여 성실히 작성해 주세요. <span className="text-rose-500 font-bold">(필수 항목 *)</span>
                  </p>

                  <div className="space-y-5">
                    {selectedTemplate.questions.map((q) => (
                      <div key={q.id} className="group relative border-b border-gray-100 pb-5">
                        <label className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-2">
                          <span>{q.label}</span>
                          {q.required && <span className="text-rose-500">*</span>}
                          {q.tooltip && (
                            <div className="relative group/tooltip inline-block">
                              <button
                                type="button"
                                className="text-gray-400 hover:text-[#3182F6] transition-colors focus:outline-none"
                                title={q.tooltip}
                                aria-label="도움말"
                              >
                                <Info className="w-4 h-4 cursor-help" />
                              </button>
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-900 text-white text-xs font-normal leading-relaxed rounded-xl shadow-xl z-50 animate-fade-in pointer-events-none">
                                <div className="relative">
                                  {q.tooltip}
                                  {/* Triangle arrow */}
                                  <div className="absolute top-full left-2.5 w-2 h-2 bg-slate-900 rotate-45 transform origin-top-left -mt-1" />
                                </div>
                              </div>
                            </div>
                          )}
                        </label>

                        {/* TEXT TYPE */}
                        {q.type === 'text' && (
                          <input
                            type="text"
                            required={q.required}
                            placeholder={q.placeholder}
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-[#3182F6] focus:outline-none bg-gray-50/50 focus:bg-white text-sm font-semibold transition-all shadow-inner-sm"
                          />
                        )}

                        {/* DATE TYPE */}
                        {q.type === 'date' && (
                          <input
                            type="date"
                            required={q.required}
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-[#3182F6] focus:outline-none bg-gray-50/50 focus:bg-white text-sm font-semibold transition-all shadow-inner-sm"
                          />
                        )}

                        {/* TEXTAREA TYPE */}
                        {q.type === 'textarea' && (
                          <textarea
                            required={q.required}
                            placeholder={q.placeholder}
                            rows={3}
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-[#3182F6] focus:outline-none bg-gray-50/50 focus:bg-white text-sm font-semibold transition-all resize-none shadow-inner-sm"
                          />
                        )}

                        {/* SELECT TYPE */}
                        {q.type === 'select' && (
                          <select
                            required={q.required}
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-[#3182F6] focus:outline-none bg-gray-50/50 focus:bg-white text-sm font-semibold transition-all shadow-inner-sm"
                          >
                            <option value="">-- 선택하세요 --</option>
                            {q.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* RADIO TYPE */}
                        {q.type === 'radio' && (
                          <div className="space-y-2 mt-2">
                            {q.options?.map((opt) => {
                              const isChecked = answers[q.id] === opt;
                              return (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-[#3182F6]/5 border-[#3182F6]'
                                      : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    checked={isChecked}
                                    onChange={() => handleAnswerChange(q.id, opt)}
                                    className="accent-[#3182F6] h-4 w-4"
                                  />
                                  <span className="text-xs font-semibold text-gray-700">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* CHECKBOX TYPE */}
                        {q.type === 'checkbox' && (
                          <div className="space-y-2 mt-2">
                            {q.options?.map((opt) => {
                              const currentVals = (answers[q.id] as string[]) || [];
                              const isChecked = currentVals.includes(opt);
                              return (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-[#3182F6]/5 border-[#3182F6]'
                                      : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
                                    className="accent-[#3182F6] h-4 w-4 rounded"
                                  />
                                  <span className="text-xs font-semibold text-gray-700">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Contextual help box for enhanced clarity */}
                        {q.tooltip && (
                          <div className="mt-2.5 flex items-start gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100/70">
                            <Info className="w-3.5 h-3.5 text-[#3182F6] shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-500 font-medium leading-relaxed">{q.tooltip}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navigation Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="bg-[#3182F6] hover:bg-[#0050FF] text-white font-extrabold text-sm px-6 py-4 rounded-2xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      다음 단계로
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Signature Submission */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  {/* Select Signature Option */}
                  <div>
                    <span className="text-xs font-bold text-[#3182F6] block mb-2">서명 업로드 방식 선택</span>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureType('draw');
                          setSignatureDataUrl('');
                        }}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                          signatureType === 'draw'
                            ? 'border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6] font-bold'
                            : 'border-gray-100 bg-gray-50/30 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <PenTool className="w-5 h-5" />
                        <span className="text-xs">마우스/손가락 직접 서명</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSignatureType('upload');
                          setSignatureDataUrl('');
                        }}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                          signatureType === 'upload'
                            ? 'border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6] font-bold'
                            : 'border-gray-100 bg-gray-50/30 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">자필 서명 종이 사진 첨부</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Signature Area */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    {signatureType === 'draw' ? (
                      <SignatureCanvas
                        savedImage={signatureDataUrl}
                        onSave={(dataUrl) => setSignatureDataUrl(dataUrl)}
                        onClear={() => setSignatureDataUrl('')}
                      />
                    ) : (
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          자필 서명 파일 업로드 (PNG, JPG)
                        </label>
                        
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] ${
                            dragActive 
                              ? 'border-[#3182F6] bg-[#3182F6]/5' 
                              : signatureDataUrl 
                                ? 'border-emerald-300 bg-emerald-50/10' 
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                          }`}
                        >
                          <input
                            type="file"
                            id="file-signature"
                            accept="image/*"
                            onChange={handleFileInput}
                            className="hidden"
                          />

                          {signatureDataUrl ? (
                            <div className="relative max-w-xs flex flex-col items-center">
                              <img
                                src={signatureDataUrl}
                                alt="서명 이미지 미리보기"
                                className="max-h-24 object-contain mb-3 rounded border border-gray-100 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => setSignatureDataUrl('')}
                                className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-4 h-4" />
                                성공적으로 파일 등록 완료
                              </span>
                            </div>
                          ) : (
                            <label htmlFor="file-signature" className="cursor-pointer flex flex-col items-center">
                              <Upload className="w-8 h-8 text-gray-300 mb-2 group-hover:text-[#3182F6] transition-colors" />
                              <span className="text-xs font-bold text-gray-700">종이에 직접 사인한 후 사진 찍어 올리기</span>
                              <span className="text-[10px] text-gray-400 mt-1 block">이곳에 파일을 드래그앤드롭하거나 눌러서 선택하세요</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Legal Confirmations Checklist */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                    <h4 className="font-extrabold text-sm text-gray-900 mb-2">상호 신의성실 원칙 및 확인 동의</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                      본 위임서 및 동의 내용에 입력하신 정보는 서명 완료 즉시 PDF로 병합되어 법적 증빙 수단으로의 보관을 승인하는 자필 서명부로 발급됩니다. 타인의 성명을 도용하여 허위 계약을 체결할 시 관련 법령에 의해 형사 처벌 대상이 될 수 있습니다.
                    </p>

                    <div className="space-y-3.5 border-t border-gray-200/50 pt-4">
                      {/* Name Double Check */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                          최종 문서 서명인 이름 확인
                        </label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="성함을 한 번 더 입력하세요"
                          className="px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3182F6] text-xs font-semibold text-right"
                        />
                      </div>

                      {/* Final Checkbox Agreement */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-all">
                        <input
                          type="checkbox"
                          checked={consentAgreed}
                          onChange={(e) => setConsentAgreed(e.target.checked)}
                          className="accent-[#3182F6] mt-0.5 h-4 w-4 shrink-0 rounded"
                        />
                        <span className="text-xs font-semibold text-gray-700 leading-relaxed">
                          기재 사항과 자필 서명 이미지의 일치를 확인했으며, 해당 내용이 공인 PDF에 기록되는 것에 대해 완전히 동의합니다.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="px-5 py-3.5 rounded-2xl border border-gray-100 text-gray-500 hover:bg-gray-50 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      이전 단계로
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="bg-[#3182F6] hover:bg-[#0050FF] text-white font-extrabold text-xs px-6 py-4 rounded-2xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      결합 문서 미리보기
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Final PDF Generation Review */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-[#3182F6]/5 rounded-2xl p-4 border border-[#3182F6]/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#3182F6] text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">최종 확인용 모의 프리뷰 완료!</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        실제 A4 백지 레이아웃 비율에 맞춰 고화질 서명 인주 마크가 최종 배치되었습니다. 아래 양식을 확인하고 다운로드 버튼을 눌러주세요.
                      </p>
                    </div>
                  </div>

                  {/* Loaded rendered paper block inside custom overflow wrapper */}
                  <DocumentTemplate
                    template={selectedTemplate}
                    answers={answers}
                    signatureDataUrl={signatureDataUrl}
                    signerName={signerName}
                    signedAt={new Date().toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    documentRef={documentRef}
                  />

                  {/* Navigation Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-3.5 rounded-2xl border border-gray-100 text-gray-500 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      서명 수정하기
                    </button>

                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleDownloadPdf}
                      className="bg-[#3182F6] hover:bg-[#0050FF] text-white font-extrabold text-sm px-8 py-4.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-blue-500/10 disabled:opacity-75 disabled:cursor-not-allowed grow sm:grow-0"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          PDF 고성능 렌더링 중...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          합성 PDF 다운로드 받기
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toss style premium minimal Footer */}
      <footer className="mt-12 border-t border-gray-100 bg-white py-8">
        <div className="max-w-4xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <div>
            <p className="font-semibold text-gray-500">Survey Document Signer</p>
            <p className="mt-1">© 2026 Survey Document Signer Inc. All Rights Reserved. (Toss Inspired Aesthetic)</p>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 cursor-pointer">개인정보처리방침</span>
            <span className="hover:text-gray-600 cursor-pointer">이용약관</span>
            <span className="hover:text-gray-600 cursor-pointer">고객센터</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
