import { FileText, Shield, PenTool, CheckCircle, Clock, Plus, Download } from 'lucide-react';
import { SURVEY_TEMPLATES } from '../data';
import { GeneratedDocument, SurveyTemplate } from '../types';

interface BentoOverviewProps {
  generatedDocs: GeneratedDocument[];
  onSelectTemplate: (template: SurveyTemplate) => void;
  onDownloadDoc: (doc: GeneratedDocument) => void;
}

export default function BentoOverview({
  generatedDocs,
  onSelectTemplate,
  onDownloadDoc
}: BentoOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Card 1: Main Statistics & Clock (Bento 2x1) */}
      <div id="bento-card-stats" className="md:col-span-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[220px]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">서명 서버 실시간 인증</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
            안전하고 투명한<br />
            전자 서약서 발급 센터
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-gray-100/80 pt-5 mt-4">
          <div>
            <span className="text-xs text-gray-400 block mb-1">총 발급 문서</span>
            <span className="text-2xl font-extrabold text-gray-900">{generatedDocs.length}건</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">사용 가능한 템플릿</span>
            <span className="text-2xl font-extrabold text-[#3182F6]">{SURVEY_TEMPLATES.length}개</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">서명 방식 지원</span>
            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md inline-block mt-0.5">듀얼 (터치/업로드)</span>
          </div>
        </div>
      </div>

      {/* Card 2: Legal Integrity (Bento 1x1) */}
      <div id="bento-card-integrity" className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#3182F6] mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-extrabold text-gray-900 text-base mb-1">서명 이미지 무결성 결합</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            업로드된 자필 종이 서명이나 마우스 터치 서명의 원래 고해상도 비율을 정밀하게 추출하여 PDF 하단 공인 서명 블록에 안전하게 패키징합니다.
          </p>
        </div>
        <div className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block w-fit mt-3">
          SHA-256 PDF 암호 안전성 준수
        </div>
      </div>

      {/* Card 3: New Document Templates Selector (Bento 2x1 or customized layout) */}
      <div id="bento-card-templates" className="md:col-span-2 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#3182F6]" />
            신규 서식 작성하기
          </h3>
          <span className="text-xs font-semibold text-gray-400">서식을 선택해 바로 시작하세요</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SURVEY_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="text-left border border-gray-50 hover:border-[#3182F6]/30 bg-gray-50/50 hover:bg-[#3182F6]/5 p-4 rounded-2xl transition-all group flex flex-col justify-between h-36"
            >
              <div>
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">{template.emoji}</span>
                <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#3182F6] transition-colors line-clamp-1">{template.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{template.subtitle}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#3182F6] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-3.5 h-3.5" />
                작성 시작
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card 4: Recent History list (Bento 1x1) */}
      <div id="bento-card-history" className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[250px]">
        <div>
          <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#3182F6]" />
            최근 작성 서명부
          </h3>
          
          {generatedDocs.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-2xl p-4">
              <PenTool className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-400">발행된 서명 서류가 없습니다.</p>
              <p className="text-[10px] text-gray-300 mt-1">서식을 선택하여 서명을 진행해 보세요.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {generatedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl border border-gray-50 transition-all text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-gray-800 truncate">{doc.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {doc.signerName} • {doc.signedAt.slice(2, 10)}
                    </p>
                  </div>
                  <button
                    onClick={() => onDownloadDoc(doc)}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#3182F6] text-gray-600 hover:text-white transition-all cursor-pointer"
                    title="다시 다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-[10px] text-center text-gray-400 border-t border-gray-50 pt-3 mt-3">
          * 발행 문서는 브라우저 보안 세션에 안전하게 저장됩니다.
        </div>
      </div>
    </div>
  );
}
