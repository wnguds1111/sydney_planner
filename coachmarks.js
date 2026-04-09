// ================================================================
//  COACH MARKS — 탭별 가이드 팝업
// ================================================================
const COACH_DATA = {
  flight: {
    icon: "✈️", title: "항공권 비교 가이드",
    steps: [
      { target: "#panel-flight .btn-add-entry", emoji:"➕", text:"<b>항공권 추가</b> 버튼으로 직접 찾은 항공편 정보를 입력하세요." },
      { target: "#flightFilterBar", emoji:"🗓", text:"<b>출발일순 정렬</b>과 <b>연차 필터</b>로 최적 일정을 확인하세요." },
      { target: "#flightSummaryBanner", emoji:"💰", text:"상단 요약에서 <b>최저가 정보</b>를 한눈에 확인할 수 있어요." },
      { target: "#flightGrid", emoji:"🔗", text:"비교 리스트에서 <b>예약하기</b>를 누르면 항공사 사이트로 바로 이동해요." }
    ]
  },
  hotel: {
    icon: "🏨", title: "호텔 비교 가이드",
    steps: [
      { target: "#panel-hotel .btn-add-entry", emoji:"➕", text:"<b>호텔 추가</b> 버튼으로 후보 숙소를 등록하세요." },
      { target: "#hotelFilterBar", emoji:"⭐", text:"<b>지역/정렬 필터</b>로 최적의 숙소를 별점순, 가격순으로 찾으세요." },
      { target: "#hotelGrid", emoji:"🔗", text:"각 카드에서 <b>Agoda · Booking · 야놀자 · 구글맵</b> 링크를 확인하세요." }
    ]
  },
  tour: {
    icon: "🎡", title: "투어 비교 가이드",
    steps: [
      { target: "#tourFilterBar", emoji:"🏷", text:"<b>카테고리 필터</b>로 관광, 액티비티, 식사 투어를 골라보세요." },
      { target: "#tourGrid", emoji:"📊", text:"<b>KKday · 마이리얼트립 · 트리플</b> 등 플랫폼별 가격을 비교하세요." },
      { target: "#panel-tour .btn-add-entry", emoji:"✏️", text:"<b>투어 추가</b> 버튼으로 직접 찾은 투어 정보를 넣을 수 있어요." }
    ]
  },
  checklist: {
    icon: "📋", title: "체크리스트 가이드",
    steps: [
      { target: "#checklistLayout", emoji:"✅", text:"이곳에 제공되는 카테고리별 <b>준비물을 체크</b>해보세요." },
      { target: ".checklist-progress", emoji:"📊", text:"진행률 바에서 전체 준비 <b>진행 상황</b>을 한눈에 확인할 수 있어요." },
      { target: "#panel-checklist .btn-add-entry", emoji:"➕", text:"<b>섹션 추가</b> 버튼으로 나만의 카테고리도 만들 수 있습니다." }
    ]
  },
  itinerary: {
    icon: "🗺️", title: "여행 일정표 가이드",
    steps: [
      { target: "#dayTabsMini", emoji:"📅", text:"<b>Day별 탭</b>에서 각 날짜를 전환하고, 편집 모드에서 날짜를 지워요." },
      { target: ".btn-add-place", emoji:"📍", text:"장소 검색은 Google Maps 자동완성으로 <b>위치 정보가 바로 연동</b>돼요." },
      { target: "#timelineList", emoji:"🔵", text:"타임라인 동그란 <b>번호</b>를 클릭하면 해당 위치로 길찾기가 시작돼요." },
      { target: "#googleMap", emoji:"🗺️", text:"장소를 등록하면 <b>지도와 동선</b>이 실시간으로 예쁘게 그려집니다!" }
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
    '<div class="coach-spotlight" id="coachSpotlight"></div>' +
    '<div class="coach-card" id="coachCard">' +
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

  setTimeout(function() {
    updateSpotlight(step.target);
  }, 50);
}

function updateSpotlight(targetSelector) {
  const spotlight = document.getElementById("coachSpotlight");
  const card = document.getElementById("coachCard");
  if (!spotlight || !card) return;

  const targetEl = document.querySelector(targetSelector);
  if (targetEl && targetEl.offsetParent !== null) {
    const rect = targetEl.getBoundingClientRect();
    const pad = 12; // padding around the element
    spotlight.style.opacity = '1';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.width = (rect.width + pad*2) + 'px';
    spotlight.style.height = (rect.height + pad*2) + 'px';
    
    // Position card relatively near spotlight
    card.style.position = 'absolute';
    let cardTop = rect.bottom + pad + 20;
    if (cardTop + card.offsetHeight > window.innerHeight) {
      cardTop = rect.top - pad - card.offsetHeight - 20; // place above if clipping
    }
    if (cardTop < 20) cardTop = 30; // fallback

    let cardLeft = rect.left + (rect.width / 2) - (card.offsetWidth / 2);
    if (cardLeft < 20) cardLeft = 20;
    if (cardLeft + card.offsetWidth > window.innerWidth - 20) cardLeft = window.innerWidth - card.offsetWidth - 20;

    card.style.top = cardTop + 'px';
    card.style.left = cardLeft + 'px';
    card.style.margin = '0';
  } else {
    // Center fallback
    spotlight.style.opacity = '0';
    spotlight.style.top = '50%';
    spotlight.style.left = '50%';
    spotlight.style.width = '0px';
    spotlight.style.height = '0px';
    
    card.style.position = 'relative';
    card.style.top = 'auto';
    card.style.left = 'auto';
    card.style.transform = 'none';
  }
}


function coachNext() { coachStep++; renderCoachMark(); }
function coachPrev() { coachStep--; renderCoachMark(); }
function closeCoachMark() {
  var o = document.getElementById("coachOverlay");
  if (o) o.classList.remove("active");
}

// 페이지 로드 시 첫 탭 코치마크 자동 표시
setTimeout(function() { showCoachMark("flight"); }, 1000);
