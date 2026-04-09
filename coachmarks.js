// ================================================================
//  COACH MARKS — 탭별 가이드 팝업
// ================================================================
const COACH_DATA = {
  flight: {
    icon: "✈️", title: "항공권 비교 가이드",
    steps: [
      { emoji:"➕", text:"<b>항공권 추가</b> 버튼으로 직접 찾은 항공편 정보를 입력하세요." },
      { emoji:"🗓", text:"<b>출발일순 정렬</b>과 <b>연차 필터</b>로 최적 일정을 확인하세요." },
      { emoji:"💰", text:"<b>최저가 뱃지</b>가 가장 저렴한 항공편을 자동으로 표시해줘요." },
      { emoji:"🔗", text:"<b>예약하기</b> 버튼을 누르면 해당 사이트로 바로 이동합니다." }
    ]
  },
  hotel: {
    icon: "🏨", title: "호텔 비교 가이드",
    steps: [
      { emoji:"➕", text:"<b>호텔 추가</b> 버튼으로 후보 숙소를 등록하세요." },
      { emoji:"⭐", text:"<b>가격순/별점순</b> 정렬로 최적의 숙소를 빠르게 찾아보세요." },
      { emoji:"🔗", text:"각 카드에서 <b>Agoda · Booking · 야놀자 · 구글맵</b> 링크를 확인하세요." }
    ]
  },
  tour: {
    icon: "🎡", title: "투어 비교 가이드",
    steps: [
      { emoji:"🏷", text:"<b>카테고리 필터</b>로 관광, 액티비티, 식사 투어를 골라보세요." },
      { emoji:"📊", text:"<b>KKday · 마이리얼트립 · 트리플</b> 플랫폼별 가격을 비교하세요." },
      { emoji:"✏️", text:"카드 우측 상단 <b>수정 버튼</b>으로 투어 정보를 편집할 수 있어요." }
    ]
  },
  checklist: {
    icon: "📋", title: "체크리스트 가이드",
    steps: [
      { emoji:"✅", text:"카테고리별로 <b>준비물을 체크</b>하여 여행 준비를 관리하세요." },
      { emoji:"📊", text:"상단 <b>진행률 바</b>에서 전체 준비 상황을 한눈에 확인하세요." },
      { emoji:"➕", text:"각 카테고리 하단에서 <b>새 항목을 추가</b>할 수 있어요." }
    ]
  },
  itinerary: {
    icon: "🗺️", title: "여행 일정표 가이드",
    steps: [
      { emoji:"📅", text:"<b>날짜 추가</b>로 여행일을 추가하고, <b>편집</b> 모드에서 Day를 관리하세요." },
      { emoji:"📍", text:"<b>장소 검색</b> 시 Google Maps 자동완성으로 좌표가 자동 입력됩니다." },
      { emoji:"🔵", text:"타임라인 <b>번호</b>를 클릭하면 Google Maps 길찾기가 열려요." },
      { emoji:"🗺️", text:"장소를 추가하면 <b>지도에 마커와 동선</b>이 자동으로 표시됩니다." }
    ]
  }
};

let coachStep = 0;
let coachTab = "";

function isCoachDismissedToday(tab) {
  const val = localStorage.getItem("coach_dismiss_" + tab);
  return val === new Date().toISOString().slice(0, 10);
}

function dismissCoachToday(tab) {
  localStorage.setItem("coach_dismiss_" + tab, new Date().toISOString().slice(0, 10));
  closeCoachMark();
}

function showCoachMark(tab) {
  if (!COACH_DATA[tab] || isCoachDismissedToday(tab)) return;
  coachTab = tab;
  coachStep = 0;
  renderCoachMark();
}

function renderCoachMark() {
  let overlay = document.getElementById("coachOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "coachOverlay";
    document.body.appendChild(overlay);
  }
  const data = COACH_DATA[coachTab];
  const step = data.steps[coachStep];
  const total = data.steps.length;

  const dots = data.steps.map(function(_, i) {
    return '<div class="coach-dot ' + (i === coachStep ? 'active' : '') + '"></div>';
  }).join("");

  const prevBtn = coachStep > 0
    ? '<button class="coach-btn-nav" onclick="coachPrev()">← 이전</button>' : "";
  const nextBtn = coachStep < total - 1
    ? '<button class="coach-btn-next" onclick="coachNext()">다음 →</button>'
    : '<button class="coach-btn-next" onclick="closeCoachMark()">확인 ✓</button>';

  overlay.innerHTML =
    '<div class="coach-backdrop" onclick="closeCoachMark()"></div>' +
    '<div class="coach-card">' +
      '<div class="coach-header">' +
        '<div class="coach-title">' + data.icon + ' ' + data.title + '</div>' +
        '<button class="coach-close" onclick="closeCoachMark()">✕</button>' +
      '</div>' +
      '<div class="coach-body">' +
        '<div class="coach-step-emoji">' + step.emoji + '</div>' +
        '<div class="coach-step-text">' + step.text + '</div>' +
      '</div>' +
      '<div class="coach-footer">' +
        '<div class="coach-dots">' + dots + '</div>' +
        '<div class="coach-actions">' +
          '<button class="coach-btn-dismiss" onclick="dismissCoachToday(\'' + coachTab + '\')">오늘 하루 안보기</button>' +
          '<div style="display:flex;gap:6px;">' + prevBtn + nextBtn + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  overlay.classList.add("active");
}

function coachNext() { coachStep++; renderCoachMark(); }
function coachPrev() { coachStep--; renderCoachMark(); }
function closeCoachMark() {
  var o = document.getElementById("coachOverlay");
  if (o) o.classList.remove("active");
}

// 페이지 로드 시 첫 탭 코치마크 자동 표시
setTimeout(function() { showCoachMark("flight"); }, 1000);
