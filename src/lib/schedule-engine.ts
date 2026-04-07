// ============================================================
// AI 공정매니저 — Data & Engine
// ============================================================

export interface Trade {
  id: string;
  name: string;
  icon: string;
  group: string;
  phase: number;
  baseDays: number;
  costMin: number;
  costMax: number;
  unit: string;
  deps: string[];
  parallel: string[];
  requires: string[];
  skipRisk: "critical" | "high" | "medium" | "low";
  desc: string;
  notes: string;
  savingTip: string;
  qualityCheck: string[];
  prework: { task: string; leadDays: number; category: string; trigger?: string; critical?: boolean }[];
  materials: { name: string; spec: string; leadDays: number; costRange: string; category: string; critical?: boolean }[];
}

export interface ScheduledTrade extends Trade {
  startDay: number;
  endDay: number;
  days: number;
  costLow: number;
  costHigh: number;
  costPct: number;
  isParallel: boolean;
  parallelWith: string[];
}

export interface ProcurementItem {
  type: "prework" | "material";
  trade: string;
  icon: string;
  task?: string;
  name?: string;
  spec?: string;
  leadDays: number;
  dueByDay: number;
  orderDay: number;
  costRange?: string;
  category: string;
  critical?: boolean;
  phase: number;
}

export interface ScheduleResult {
  scheduled: ScheduledTrade[];
  totalDays: number;
  totalCostLow: number;
  totalCostHigh: number;
  totalCostMid: number;
  procurement: ProcurementItem[];
  pre: ProcurementItem[];
  during: ProcurementItem[];
  risk: number;
  py: number;
  critMats: ProcurementItem[];
  totalChecks: number;
}

export interface SizeOption {
  id: string;
  label: string;
  pyung: number;
  mult: number;
}

export interface DepWarning {
  if: string;
  needs: string;
  msg: string;
  severity: "critical" | "warn";
}

// ─── Data ───

export const TRADES: Trade[] = [
  { id:"demolition",name:"철거",icon:"🔨",group:"기초",phase:1,baseDays:2,costMin:103000,costMax:126000,unit:"평",deps:[],parallel:[],requires:[],skipRisk:"high",
    desc:"기존 마감재 해체, 폐기물 분리·반출",notes:"내력벽 확인 필수, 석면 자재 유무 점검",
    savingTip:"폐기물 직접 분리배출 시 수거비 30~40% 절감. 재사용 가능 도기·수전 미리 분리.",
    qualityCheck:["내력벽/비내력벽 구분 확인","배관·배선 손상 점검","바닥 레벨 상태 사진 촬영","숨은 하자(곰팡이·누수) 기록"],
    prework:[{task:"관리사무소 공사 신고",leadDays:7,category:"행정"},{task:"엘리베이터·복도 보양",leadDays:1,category:"현장준비"},{task:"소음 안내문 부착",leadDays:3,category:"행정"},{task:"전기·수도·가스 차단 확인",leadDays:1,category:"현장준비"}],
    materials:[{name:"보양재",spec:"PE폼+합판",leadDays:1,costRange:"15~25만",category:"소모품"},{name:"폐기물 수거",spec:"1톤/2.5톤",leadDays:0,costRange:"30~80만",category:"용역"},{name:"마대자루·스티커",spec:"구청 구매",leadDays:1,costRange:"3~5만",category:"소모품"}]},
  { id:"window",name:"창호(샤시)",icon:"🪟",group:"기초",phase:2,baseDays:1,costMin:245000,costMax:451000,unit:"평",deps:["demolition"],parallel:["plumbing","electric"],requires:["demolition"],skipRisk:"medium",
    desc:"이중창·시스템창 교체, 코킹 마감",notes:"외부 비계 필요 시 관리사무소 승인",
    savingTip:"유리만 교체(복층유리)하면 50% 절감. 프레임 양호 시만 가능.",
    qualityCheck:["창틀 수평·수직 확인","코킹 빈틈 없는지 확인","개폐 걸림 테스트","단열 외풍 테스트"],
    prework:[{task:"창호 실측 (철거 후)",leadDays:0,category:"실측",trigger:"demolition"},{task:"창호 발주",leadDays:0,category:"발주"},{task:"외부작업 승인",leadDays:5,category:"행정"}],
    materials:[{name:"시스템 창호",spec:"LG하우시스/KCC",leadDays:7,costRange:"창당 30~80만",category:"주자재",critical:true},{name:"실리콘·코킹재",spec:"투명/백색",leadDays:1,costRange:"2~3만",category:"부자재"}]},
  { id:"plumbing",name:"설비(배관)",icon:"🔧",group:"기초",phase:2,baseDays:3,costMin:75000,costMax:95000,unit:"평",deps:["demolition"],parallel:["window","electric"],requires:["demolition"],skipRisk:"high",
    desc:"급수·급탕·배수·난방 배관 교체",notes:"수압 테스트 필수, 동파 방지 보온",
    savingTip:"전체 vs 부분 교체 판단 핵심. 동파이프→PB 필수, 난방은 상태 확인 후.",
    qualityCheck:["수압 테스트 (2시간 유지)","배수 경사도 확인","난방 누수 테스트","분배기 회로별 작동 확인"],
    prework:[{task:"설비 도면 확인",leadDays:3,category:"설계"},{task:"단수 일정 협의",leadDays:3,category:"행정"},{task:"배관 상태 점검",leadDays:0,category:"현장준비",trigger:"demolition"}],
    materials:[{name:"PB 배관",spec:"16mm/20mm",leadDays:2,costRange:"m당 3~5천",category:"주자재"},{name:"분배기 세트",spec:"황동/SUS",leadDays:3,costRange:"15~40만",category:"주자재",critical:true},{name:"배수관 PVC",spec:"50~100mm",leadDays:1,costRange:"m당 2~3천",category:"주자재"},{name:"보온재",spec:"동파방지",leadDays:1,costRange:"5~10만",category:"부자재"}]},
  { id:"electric",name:"전기",icon:"⚡",group:"기초",phase:2,baseDays:2,costMin:57000,costMax:88000,unit:"평",deps:["demolition"],parallel:["window","plumbing"],requires:["demolition"],skipRisk:"high",
    desc:"분전반·배선·콘센트·스위치 교체",notes:"차단기 용량 확인, 인덕션 전용 회로",
    savingTip:"콘센트 위치 가구 배치 확정 후 결정. 불필요한 위치 줄이면 10~15% 절감.",
    qualityCheck:["분전반 차단기 개별 테스트","접지 저항 측정","인덕션 전용 회로 확인","콘센트 위치 도면 대비 확인"],
    prework:[{task:"전기 도면 작성",leadDays:5,category:"설계"},{task:"조명 위치 확정",leadDays:5,category:"설계"},{task:"분전반 용량 확인",leadDays:7,category:"행정"}],
    materials:[{name:"분전반",spec:"20~30회로",leadDays:2,costRange:"15~30만",category:"주자재",critical:true},{name:"전선 HIV",spec:"2.5~6sq",leadDays:1,costRange:"롤당 5~15만",category:"주자재"},{name:"콘센트·스위치",spec:"매입형",leadDays:2,costRange:"개당 3~8천",category:"부자재"}]},
  { id:"waterproof",name:"방수",icon:"💧",group:"습식",phase:3,baseDays:2,costMin:30000,costMax:37000,unit:"평",deps:["plumbing"],parallel:[],requires:["plumbing"],skipRisk:"critical",
    desc:"욕실·베란다 방수 도포 (2~3회)",notes:"양생 48시간 필수, 담수 테스트",
    savingTip:"절대 아끼면 안 되는 공종. 하자 시 욕실 전체 재시공 = 방수비의 5~10배.",
    qualityCheck:["2~3회 도포 확인 (회차별 사진)","턴업 높이 150mm↑ 확인","48시간 담수 테스트 통과","배수구 주변 집중 확인"],
    prework:[{task:"배관 완료 확인",leadDays:0,category:"현장준비",trigger:"plumbing"},{task:"바닥 레벨링·청소",leadDays:0,category:"현장준비"}],
    materials:[{name:"방수액",spec:"우레탄/에폭시 2~3회",leadDays:2,costRange:"10~20만",category:"주자재"},{name:"방수 시트",spec:"턴업용",leadDays:2,costRange:"5~10만",category:"부자재"},{name:"프라이머",spec:"접착 강화",leadDays:1,costRange:"2~3만",category:"부자재"}]},
  { id:"tile",name:"타일",icon:"🧱",group:"습식",phase:3,baseDays:4,costMin:173000,costMax:310000,unit:"평",deps:["waterproof"],parallel:["carpentry"],requires:["waterproof"],skipRisk:"medium",
    desc:"욕실·주방·현관 벽/바닥 타일",notes:"줄눈 색상 사전 결정",
    savingTip:"국산 동급 제품으로 수입 대비 40~60% 절감. 헤링본 패턴은 인건비 1.5배.",
    qualityCheck:["수평·수직 확인 (2m 레벨기)","줄눈 간격 균일성","모서리 마감 상태","배수 경사 테스트"],
    prework:[{task:"타일 실측",leadDays:0,category:"실측",trigger:"waterproof"},{task:"타일 발주",leadDays:0,category:"발주"},{task:"줄눈 색상·패턴 확정",leadDays:3,category:"설계"}],
    materials:[{name:"욕실 벽타일",spec:"300x600",leadDays:5,costRange:"장당 2~8천",category:"주자재",critical:true},{name:"바닥타일",spec:"논슬립 300x300",leadDays:5,costRange:"장당 2~5천",category:"주자재",critical:true},{name:"타일 본드+줄눈재",spec:"접착·마감",leadDays:1,costRange:"2~3만",category:"부자재"}]},
  { id:"carpentry",name:"목공",icon:"🪚",group:"마감준비",phase:3,baseDays:4,costMin:222000,costMax:337000,unit:"평",deps:["electric"],parallel:["tile"],requires:["electric"],skipRisk:"medium",
    desc:"천장·몰딩·걸레받이·가벽·문틀",notes:"합판 vs MDF 선택",
    savingTip:"평천장+간접조명으로 우물천장 대비 30% 절감. 기성품 걸레받이 사용 시 50% 절감.",
    qualityCheck:["천장 수평 확인","문틀 직각 확인","몰딩 이음새 매끄러움","석고보드 나사 간격 (150mm)"],
    prework:[{task:"목공 도면 확정",leadDays:5,category:"설계"},{task:"전기 1차 완료 확인",leadDays:0,category:"현장준비",trigger:"electric"},{task:"자재 반입",leadDays:2,category:"발주"}],
    materials:[{name:"합판 4x8",spec:"15T/18T",leadDays:2,costRange:"장당 3~7만",category:"주자재"},{name:"석고보드",spec:"9.5T/12T",leadDays:1,costRange:"장당 5~8천",category:"주자재"},{name:"몰딩",spec:"걸레받이+천장",leadDays:3,costRange:"m당 3~15천",category:"주자재"},{name:"소모품",spec:"피스·본드",leadDays:1,costRange:"5~10만",category:"부자재"}]},
  { id:"door",name:"도어",icon:"🚪",group:"마감준비",phase:4,baseDays:1,costMin:28000,costMax:70000,unit:"평",deps:["carpentry"],parallel:["film"],requires:["carpentry"],skipRisk:"low",
    desc:"방문·현관문·중문 설치",notes:"실측 필수 (목공 후)",
    savingTip:"ABS가 원목 대비 60% 저렴, 내구성 동등. 3연동이 4연동보다 30% 저렴.",
    qualityCheck:["개폐 부드러움","도어 틈새 균일성","잠금장치 작동","경첩 소음"],
    prework:[{task:"도어 실측 (목공 후)",leadDays:0,category:"실측",trigger:"carpentry",critical:true},{task:"도어 발주",leadDays:0,category:"발주"}],
    materials:[{name:"ABS 도어",spec:"방문",leadDays:10,costRange:"개당 15~40만",category:"주자재",critical:true},{name:"현관 중문",spec:"3~4연동",leadDays:12,costRange:"50~150만",category:"주자재",critical:true}]},
  { id:"film",name:"필름/시트",icon:"🎞️",group:"마감",phase:4,baseDays:2,costMin:82000,costMax:119000,unit:"평",deps:["carpentry"],parallel:["door"],requires:["carpentry"],skipRisk:"low",
    desc:"도어·가구·몰딩 필름 래핑",notes:"인테리어 필름 vs 시트지 차이",
    savingTip:"시트지(m당 5천) vs 인테리어필름(1~3만). 전문 필름이 내구성·마감 월등히 좋음.",
    qualityCheck:["기포 없는지 확인","모서리 래핑 마감","색상·패턴 일관성"],
    prework:[{task:"필름 색상 확정",leadDays:5,category:"설계"},{task:"면적 실측",leadDays:0,category:"실측",trigger:"carpentry"}],
    materials:[{name:"인테리어 필름",spec:"LG/3M",leadDays:3,costRange:"m당 1~3만",category:"주자재"},{name:"프라이머",spec:"접착강화",leadDays:1,costRange:"1~2만",category:"부자재"}]},
  { id:"floor",name:"마루/바닥",icon:"🪵",group:"마감",phase:5,baseDays:2,costMin:109000,costMax:248000,unit:"평",deps:["carpentry","tile"],parallel:[],requires:["carpentry"],skipRisk:"medium",
    desc:"강마루·강화마루·헤링본·장판",notes:"레벨링 확인, 마루 방향 결정",
    savingTip:"강화마루가 강마루 대비 40% 저렴. 장판은 70% 저렴하나 내구성 낮음.",
    qualityCheck:["바닥 수평 확인","이음새 들뜸 없는지","소음 테스트 (걸어보기)","걸레받이 마감"],
    prework:[{task:"레벨링 확인",leadDays:0,category:"현장준비",trigger:"carpentry"},{task:"마루 발주",leadDays:0,category:"발주"},{task:"마루 24시간 적응",leadDays:1,category:"현장준비"}],
    materials:[{name:"강마루/강화마루",spec:"12T",leadDays:5,costRange:"평당 5~15만",category:"주자재",critical:true},{name:"언더레이",spec:"방음매트",leadDays:2,costRange:"평당 3~5천",category:"부자재"},{name:"걸레받이",spec:"목재/PVC",leadDays:3,costRange:"m당 3~8천",category:"부자재"}]},
  { id:"paint",name:"페인트",icon:"🎨",group:"마감",phase:5,baseDays:2,costMin:26000,costMax:56000,unit:"평",deps:["carpentry"],parallel:["floor"],requires:["carpentry"],skipRisk:"low",
    desc:"벽면·천장 도장 (2~3회 도포)",notes:"친환경 확인, 겨울철 건조추가",
    savingTip:"국산(삼화/노루)이 수입(벤자민무어) 대비 50% 저렴. 품질 차이 크지 않음.",
    qualityCheck:["도포 균일성 (측광)","색상 샘플 대비 일치","천장·벽 경계 직선","문틀 주변 깔끔함"],
    prework:[{task:"색상 확정 (샘플)",leadDays:5,category:"설계"},{task:"퍼티·사포 완료",leadDays:0,category:"현장준비",trigger:"carpentry"}],
    materials:[{name:"친환경 페인트",spec:"벽면+천장",leadDays:3,costRange:"통당 5~15만",category:"주자재"},{name:"프라이머+도구",spec:"롤러/붓/마스킹",leadDays:1,costRange:"5~10만",category:"소모품"}]},
  { id:"wallpaper",name:"도배",icon:"📜",group:"마감",phase:5,baseDays:2,costMin:48000,costMax:136000,unit:"평",deps:["carpentry","film"],parallel:["floor"],requires:["carpentry"],skipRisk:"low",
    desc:"벽지·천장지 시공",notes:"실크 vs 합지, 겨울철 창문 닫고 시공",
    savingTip:"합지 = 실크 대비 50% 저렴 (수명 3~5년). 실크 7~10년. 자주 바꿀 곳은 합지.",
    qualityCheck:["이음새 패턴 맞춤","모서리·창틀 깔끔함","기포·주름 없음","천장지 처짐 없음"],
    prework:[{task:"벽지 선정",leadDays:7,category:"설계"},{task:"벽지 발주",leadDays:0,category:"발주"},{task:"퍼티 상태 확인",leadDays:0,category:"현장준비",trigger:"carpentry"}],
    materials:[{name:"벽지 (실크)",spec:"롤당 5.3m2",leadDays:3,costRange:"롤당 1~5만",category:"주자재",critical:true},{name:"천장지+풀",spec:"합지/실크",leadDays:3,costRange:"롤당 5~15천+풀",category:"주자재"}]},
  { id:"lighting",name:"조명",icon:"💡",group:"설치",phase:6,baseDays:1,costMin:57000,costMax:88000,unit:"평",deps:["wallpaper","paint"],parallel:["furniture"],requires:[],skipRisk:"low",
    desc:"매입등·간접조명·펜던트",notes:"밝기(lux), 디밍 여부",
    savingTip:"국내 LED가 수입 대비 60% 저렴, 성능 동등. 간접조명 LED바 직접 시공 시 절반.",
    qualityCheck:["전체 점등 확인","디밍 작동","색온도 적합성","빛 새어나옴 확인"],
    prework:[{task:"조명 기구 반입",leadDays:0,category:"발주"},{task:"전기 2차 결선",leadDays:0,category:"현장준비",trigger:"wallpaper"}],
    materials:[{name:"LED 매입등",spec:"3/4인치",leadDays:5,costRange:"개당 1~3만",category:"주자재"},{name:"펜던트/시리즈",spec:"디자인별",leadDays:7,costRange:"개당 5~50만",category:"주자재",critical:true}]},
  { id:"furniture",name:"가구",icon:"🪑",group:"설치",phase:6,baseDays:2,costMin:205000,costMax:553000,unit:"평",deps:["wallpaper","floor"],parallel:["lighting"],requires:["carpentry"],skipRisk:"medium",
    desc:"싱크대·붙박이장·신발장",notes:"실측 목공 후, 납기 2~3주",
    savingTip:"지역 맞춤 가구공장이 대형업체 대비 20~30% 저렴, 디자인 자유도 높음.",
    qualityCheck:["도어 개폐 부드러움","서랍 레일 작동","상판 수평","벽면 밀착도"],
    prework:[{task:"가구 실측 (목공 후)",leadDays:0,category:"실측",trigger:"carpentry",critical:true},{task:"가구 발주",leadDays:0,category:"발주",critical:true}],
    materials:[{name:"싱크대+상판",spec:"엔지니어드스톤",leadDays:18,costRange:"200~500만",category:"주자재",critical:true},{name:"붙박이장",spec:"세트",leadDays:15,costRange:"100~300만",category:"주자재",critical:true},{name:"신발장",spec:"현관 맞춤",leadDays:12,costRange:"50~150만",category:"주자재"}]},
  { id:"accessory",name:"욕실악세사리",icon:"🚿",group:"설치",phase:6,baseDays:1,costMin:113000,costMax:184000,unit:"평",deps:["tile"],parallel:["lighting"],requires:["tile"],skipRisk:"medium",
    desc:"수전·도기·거울·악세사리",notes:"브랜드별 호환 확인",
    savingTip:"국산(대림/로얄)이 수입(듀라빗/토토) 대비 50~70% 저렴. 기능 차이 거의 없음.",
    qualityCheck:["수전 수압 테스트","양변기 배수 테스트","거울 고정","코킹 마감"],
    prework:[{task:"도기·수전 발주",leadDays:7,category:"발주"},{task:"타일 완료 확인",leadDays:0,category:"현장준비",trigger:"tile"}],
    materials:[{name:"양변기",spec:"원피스",leadDays:5,costRange:"20~80만",category:"주자재"},{name:"세면대+수전",spec:"일체형",leadDays:5,costRange:"15~60만",category:"주자재"},{name:"샤워+거울+악세사리",spec:"세트",leadDays:5,costRange:"25~100만",category:"주자재"}]},
  { id:"silicon",name:"실리콘/코킹",icon:"💉",group:"마무리",phase:7,baseDays:1,costMin:34000,costMax:37000,unit:"평",deps:["furniture","lighting","accessory"],parallel:[],requires:[],skipRisk:"low",
    desc:"접합부 실리콘 마감",notes:"곰팡이방지 실리콘",
    savingTip:"곰팡이방지 제품(+3천원)이 장기적으로 재시공 비용 절감.",
    qualityCheck:["라인 균일성","틈새 빈곳 없음","곰팡이방지 사용 확인"],
    prework:[],materials:[{name:"실리콘",spec:"곰팡이방지",leadDays:1,costRange:"개당 5~8천",category:"소모품"}]},
  { id:"cleaning",name:"입주청소",icon:"✨",group:"마무리",phase:8,baseDays:1,costMin:24000,costMax:27000,unit:"평",deps:["silicon"],parallel:[],requires:[],skipRisk:"low",
    desc:"전문 입주청소",notes:"청소 후 하자 최종 점검",
    savingTip:"전문업체 권장. 직접하면 미세먼지·접착제 잔여물 처리 어려움.",
    qualityCheck:["창문 안팎 깨끗함","바닥 잔여물 제거","환기구·배수구 청소","최종 하자 점검"],
    prework:[{task:"청소업체 예약",leadDays:5,category:"발주"},{task:"하자 체크리스트 준비",leadDays:1,category:"현장준비"}],
    materials:[{name:"입주청소 용역",spec:"전문업체",leadDays:5,costRange:"평당 2~4만",category:"용역"}]},
];

export const DEP_WARNINGS: DepWarning[] = [
  {if:"tile",needs:"waterproof",msg:"타일 전 방수 필수. 미시공 시 누수 위험.",severity:"critical"},
  {if:"tile",needs:"demolition",msg:"기존 타일 위 덧방이 아니면 철거 필요.",severity:"warn"},
  {if:"waterproof",needs:"plumbing",msg:"방수 전 배관 완료 필요.",severity:"critical"},
  {if:"carpentry",needs:"electric",msg:"목공 전 전기 1차 배선 완료 필요.",severity:"critical"},
  {if:"wallpaper",needs:"carpentry",msg:"도배 전 목공(퍼티) 완료 필요.",severity:"critical"},
  {if:"paint",needs:"carpentry",msg:"페인트 전 목공(퍼티·사포) 완료 필요.",severity:"critical"},
  {if:"floor",needs:"carpentry",msg:"마루 전 목공 완료 필요.",severity:"warn"},
  {if:"furniture",needs:"carpentry",msg:"가구 실측은 목공 후 가능.",severity:"critical"},
  {if:"lighting",needs:"electric",msg:"조명 설치에 전기 공사 필요.",severity:"warn"},
  {if:"accessory",needs:"tile",msg:"욕실 악세사리는 타일 후 설치.",severity:"warn"},
  {if:"accessory",needs:"plumbing",msg:"수전·도기에 배관 필요.",severity:"critical"},
];

export const SIZES: SizeOption[] = [
  {id:"10s",label:"10평대",pyung:18,mult:0.6},
  {id:"20s",label:"20평대",pyung:25,mult:0.85},
  {id:"30s",label:"30평대",pyung:33,mult:1.0},
  {id:"40s",label:"40평대",pyung:42,mult:1.25},
  {id:"50p",label:"50평+",pyung:55,mult:1.6},
];

export const SEASONS: Record<string, { label: string; mult: number }> = {
  spring: { label: "봄", mult: 1.05 },
  summer: { label: "여름", mult: 0.95 },
  fall: { label: "가을", mult: 1.1 },
  winter: { label: "겨울", mult: 0.9 },
};

export function getSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "fall";
  return "winter";
}

export const PHASE_LABELS: Record<number, string> = {
  1: "해체", 2: "기초", 3: "습식·골조", 4: "마감준비", 5: "마감", 6: "설치", 7: "마무리", 8: "입주준비",
};

export const PHASE_COLORS: Record<number, string> = {
  1: "#EF4444", 2: "#F97316", 3: "#3B82F6", 4: "#8B5CF6", 5: "#10B981", 6: "#F59E0B", 7: "#EC4899", 8: "#06B6D4",
};

export const TRADE_GROUPS = ["기초", "습식", "마감준비", "마감", "설치", "마무리"] as const;

// ─── Engine ───

export function buildSchedule(sel: string[], sizeObj: SizeOption, season: string): ScheduleResult | null {
  const trades = TRADES.filter(t => sel.includes(t.id));
  if (!trades.length) return null;

  const sm = sizeObj.mult;
  const ssm = SEASONS[season]?.mult || 1;
  const py = sizeObj.pyung;
  const scheduled: ScheduledTrade[] = [];
  const done = new Set<string>();
  let day = 1;

  const phases = [...new Set(trades.map(t => t.phase))].sort((a, b) => a - b);

  phases.forEach((phase, phaseIdx) => {
    const pt = trades.filter(t => t.phase === phase);
    const groups: Trade[][] = [];
    const assigned = new Set<string>();

    pt.forEach(t => {
      if (assigned.has(t.id)) return;
      const dm = t.deps.every(d => !sel.includes(d) || done.has(d));
      if (!dm) return;
      const g: Trade[] = [t];
      assigned.add(t.id);
      t.parallel.forEach(pid => {
        const p2 = pt.find(x => x.id === pid && !assigned.has(x.id));
        if (p2 && p2.deps.every(d => !sel.includes(d) || done.has(d))) {
          g.push(p2);
          assigned.add(p2.id);
        }
      });
      groups.push(g);
    });

    pt.filter(t => !assigned.has(t.id)).forEach(t => {
      if (t.deps.every(d => !sel.includes(d) || done.has(d))) {
        groups.push([t]);
        assigned.add(t.id);
      }
    });

    groups.forEach((g, gi) => {
      const mx = Math.max(...g.map(t => Math.max(1, Math.round(t.baseDays * sm))));
      g.forEach(t => {
        const days = Math.max(1, Math.round(t.baseDays * sm));
        const isU = t.unit === "개소" || t.unit === "개";
        const units = isU ? Math.ceil(py / 8) : py;
        const cL = Math.round((t.costMin * units * ssm) / 10000) * 10000;
        const cH = Math.round((t.costMax * units * ssm) / 10000) * 10000;
        scheduled.push({
          ...t,
          startDay: day,
          endDay: day + days - 1,
          days,
          costLow: cL,
          costHigh: cH,
          costPct: 0,
          isParallel: g.length > 1,
          parallelWith: g.filter(x => x.id !== t.id).map(x => x.name),
        });
        done.add(t.id);
      });
      day += mx;
      if (gi === groups.length - 1 && phaseIdx < phases.length - 1) {
        const nextPhase = phases[phaseIdx + 1];
        const buffer = phase <= 3 && nextPhase >= 4 ? 2 : 1;
        day += buffer;
      }
    });
  });

  const totalDays = Math.max(...scheduled.map(s => s.endDay));
  const totalCostLow = scheduled.reduce((s, t) => s + t.costLow, 0);
  const totalCostHigh = scheduled.reduce((s, t) => s + t.costHigh, 0);
  const totalCostMid = (totalCostLow + totalCostHigh) / 2;
  scheduled.forEach(t => {
    t.costPct = (t.costLow + t.costHigh) / (2 * totalCostMid);
  });

  const procurement: ProcurementItem[] = [];
  scheduled.forEach(t => {
    (t.prework || []).forEach(pw => {
      const od = pw.trigger ? t.startDay : t.startDay - pw.leadDays;
      procurement.push({
        type: "prework",
        trade: t.name,
        icon: t.icon,
        task: pw.task,
        leadDays: pw.leadDays,
        dueByDay: t.startDay,
        orderDay: Math.max(od, -30),
        category: pw.category,
        critical: pw.critical,
        phase: t.phase,
      });
    });
    (t.materials || []).forEach(m => {
      const od = t.startDay - m.leadDays;
      procurement.push({
        type: "material",
        trade: t.name,
        icon: t.icon,
        name: m.name,
        spec: m.spec,
        leadDays: m.leadDays,
        dueByDay: t.startDay,
        orderDay: Math.max(od, -30),
        costRange: m.costRange,
        category: m.category,
        critical: m.critical,
        phase: t.phase,
      });
    });
  });
  procurement.sort((a, b) => a.orderDay - b.orderDay);

  const pre = procurement.filter(p => p.orderDay < 1 || p.leadDays >= 5);
  const during = procurement.filter(p => p.orderDay >= 1 && p.leadDays < 5);

  let risk = 0;
  if (sel.length >= 10) risk += 25;
  if (sel.length >= 6) risk += 10;
  if (sel.includes("plumbing")) risk += 10;
  const critMats = procurement.filter(p => p.critical);
  if (critMats.length >= 5) risk += 10;
  risk = Math.min(100, risk);

  const totalChecks = scheduled.reduce((s, t) => (t.qualityCheck || []).length + s, 0);

  return { scheduled, totalDays, totalCostLow, totalCostHigh, totalCostMid, procurement, pre, during, risk, py, critMats, totalChecks };
}

export function formatCost(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return Math.round(n / 10000) + "만";
  return n.toLocaleString();
}

export function riskColor(r: string): string {
  if (r === "critical") return "#EF4444";
  if (r === "high") return "#F97316";
  if (r === "medium") return "#F59E0B";
  return "#10B981";
}
