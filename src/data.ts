import { SurveyTemplate } from './types';

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'privacy-consent',
    title: '개인정보 수집 및 이용 동의서',
    subtitle: '안전한 서비스 제공을 위한 개인정보 처리 동의 양식',
    description: '개인정보 보호법 제15조 등 관련 법령에 의거하여, 귀하의 개인정보를 수집 및 이용하는 것에 대한 동의를 받고자 합니다.',
    emoji: '🔒',
    questions: [
      {
        id: 'name',
        type: 'text',
        label: '동의자 성명',
        placeholder: '홍길동',
        required: true,
        category: '기본 정보'
      },
      {
        id: 'phone',
        type: 'text',
        label: '휴대폰 번호',
        placeholder: '010-1234-5678',
        required: true,
        category: '기본 정보',
        tooltip: '입력하신 연락처 정보는 본인 식별 및 전자서명 체결 사실 입증 용도로만 안전하게 보관됩니다.'
      },
      {
        id: 'email',
        type: 'text',
        label: '이메일 주소',
        placeholder: 'gildong@example.com',
        required: true,
        category: '기본 정보'
      },
      {
        id: 'purpose',
        type: 'radio',
        label: '개인정보 활용 목적 구분',
        options: [
          '신규 서비스 안내 및 맞춤 마케팅 제공',
          '제휴사 혜택 정보 안내 및 프로모션 참여',
          '단순 서비스 상담 및 CS 민원 대응'
        ],
        required: true,
        category: '활용 목적',
        tooltip: '선택하신 목적의 범위를 벗어나 무단으로 개인정보를 사용하거나 제3자에게 임의 제공하지 않습니다.'
      },
      {
        id: 'retention',
        type: 'select',
        label: '정보 보유 및 이용 기간',
        options: [
          '동의 완료일로부터 1년 (권장)',
          '동의 완료일로부터 3년',
          '회원 탈퇴 또는 서비스 해지 시까지'
        ],
        required: true,
        category: '보유 기간',
        tooltip: '선택하신 보유 기간이 경과하거나 목적 달성 시 귀하의 모든 개인정보는 즉각 안전하게 분쇄/영구 파기됩니다.'
      },
      {
        id: 'marketing_channels',
        type: 'checkbox',
        label: '안내 수신 채널 선택 (중복 가능)',
        options: [
          '카카오톡 알림톡',
          'SMS 문자메시지',
          '이메일 뉴스레터',
          '앱 푸시 알림'
        ],
        required: false,
        category: '수신 동의',
        tooltip: '마케팅 채널 수신에 동의하지 않으셔도, 필수 공지나 금융 안전 거래 안내 등의 기본 알림은 정상 발송됩니다.'
      }
    ],
    legalText: '본 동의서에 명시된 개인정보는 동의 목적 외의 용도로 절대 사용되지 않으며, 개인정보 보호책임자의 엄격한 통제 하에 안전하게 관리됩니다. 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으며, 동의 거부 시 서비스 이용 및 혜택 안내에 제한이 있을 수 있습니다.'
  },
  {
    id: 'freelance-completion',
    title: '프로젝트 검수 및 업무 완료 확인서',
    subtitle: '외주 용역 과업 달성 확인 및 서명 증빙 양식',
    description: '공급자와 수요자 간 합의된 프리랜서/외주 용역 결과물의 최종 검수가 완료되었으며, 과업이 상호 만족스럽게 이행되었음을 확약합니다.',
    emoji: '📝',
    questions: [
      {
        id: 'client_name',
        type: 'text',
        label: '발주처 (수요자) 사명/성명',
        placeholder: '(주) 토스스타일인큐베이터',
        required: true,
        category: '계약 기본'
      },
      {
        id: 'provider_name',
        type: 'text',
        label: '수급인 (공급자) 성명',
        placeholder: '김개발',
        required: true,
        category: '계약 기본'
      },
      {
        id: 'project_title',
        type: 'text',
        label: '프로젝트 과업명',
        placeholder: '토스 에스테틱 웹 애플리케이션 프론트엔드 외주',
        required: true,
        category: '과업 정보'
      },
      {
        id: 'completion_date',
        type: 'date',
        label: '과업 최종 완료일',
        required: true,
        category: '과업 정보'
      },
      {
        id: 'quality_rating',
        type: 'radio',
        label: '용역 결과물 만족도',
        options: [
          '매우 만족 (예상 기한 대비 조기 완료 및 탁월한 품질)',
          '만족 (합의된 과업 명세서대로 정상 개발 완료)',
          '보통 (기한을 준수했으나 일부 마이너 이슈 수정 필요)'
        ],
        required: true,
        category: '만족도 검수',
        tooltip: '과업지시서에 정의된 기능 명세 및 개발 마일스톤 준수 여부를 종합적으로 반영한 업무 완성도 지표입니다.'
      },
      {
        id: 'delivery_comment',
        type: 'textarea',
        label: '특이 사항 및 인수인계 의견',
        placeholder: '정상 작동 확인 완료. 추가 보증수리 범위 및 가이드는 별첨 인수인계서를 따릅니다.',
        required: false,
        category: '종합 의견',
        tooltip: '보증수리(Warrany) 범위, 소스코드 이관 등 최종 합의된 예외 조항이나 협의 사항이 있는 경우 상세히 기입합니다.'
      }
    ],
    legalText: '발주인은 수급인이 납품한 산출물에 대해 철저한 테스트 및 검수를 거쳐 기능이 상호 계약한 사양대로 완벽히 작동함을 증명합니다. 본 확인서에 양 당사자가 최종 서명함으로써, 기납품된 과업에 대한 정식 검수가 완료되며 대금 청구 및 정산 프로세스가 승인됩니다.'
  },
  {
    id: 'customer-feedback',
    title: '신규 서비스 만족도 및 의견 조사',
    subtitle: '고객 의견 수렴 및 서비스 개선을 위한 서류',
    description: '소중한 사용 소감을 기반으로 더 나은 사용자 경험을 설계하고, 제품 방향성을 고도화하기 위해 설문을 진행합니다.',
    emoji: '💖',
    questions: [
      {
        id: 'respondent_name',
        type: 'text',
        label: '참여자 이름',
        placeholder: '이소형',
        required: true,
        category: '참여자 정보'
      },
      {
        id: 'primary_product',
        type: 'radio',
        label: '가장 많이 이용하시는 토스 서비스',
        options: [
          '토스뱅크 예적금 및 대출 상품',
          '토스증권 주식 거래 시스템',
          '토스페이 온라인/오프라인 간편 결제',
          '신용 점수 조회 및 자산 관리 탭'
        ],
        required: true,
        category: '사용 경험'
      },
      {
        id: 'satisfaction_score',
        type: 'select',
        label: '해당 서비스에 대한 만족도 평점',
        options: [
          '5점 만점 (매우 만족스럽고 주변에 강력 추천할 의향 있음)',
          '4점 (만족스러우나 UI 디테일에 약간 개선할 여지가 보임)',
          '3점 (보통 수준이며 다른 금융 플랫폼과 차별점이 느껴지지 않음)',
          '2점 이하 (불만족스러우며 주요 오류나 속도 지연을 겪음)'
        ],
        required: true,
        category: '만족도 평점',
        tooltip: '작성해주시는 평점 데이터는 제품 개발팀 및 UX 연구 부서에 전달되어 향후 업데이트 로드맵에 우선적으로 반영됩니다.'
      },
      {
        id: 'feedback_detail',
        type: 'textarea',
        label: '서비스 사용 시 겪었던 불만이나 가장 필요한 개선점',
        placeholder: '이체 및 결제 단계에서 터치 반응 속도를 0.1초만 더 개선해주시면 좋겠습니다. 그 외에 전체적인 애니메이션은 아주 만족스럽습니다.',
        required: true,
        category: '의견 접수',
        tooltip: '불편을 겪으셨던 특정 기기, 재현 경로, 바라는 기능 개선안 등을 가능한 구체적으로 공유해주시면 신속히 보완하겠습니다.'
      },
      {
        id: 'followup_contact',
        type: 'checkbox',
        label: '추가 심층 인터뷰 참여 동의',
        options: [
          '동의함 (추후 기프티콘 증정 인터뷰 전화 수신에 동의합니다.)'
        ],
        required: false,
        category: '후속 조사'
      }
    ],
    legalText: '작성해주신 모든 정보는 오직 통계 분석 및 신규 기능 보완 목적의 기밀 자료로만 엄격하게 관리되며, 마케팅 남용 목적으로 동의 없이 타사에 제공되지 않습니다. 귀하의 성실한 응답에 진심으로 감사드립니다.'
  }
];
