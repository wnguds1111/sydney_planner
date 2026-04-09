/* ==============================================
   SYDNEY PLANNER — app.js  (v2: User-editable)
   Firebase으로 항공권/호텔/일정/메모 CRUD
   ============================================== */

// ─── Firebase ───
const firebaseConfig = {
  apiKey: "AIzaSyBmwX1khTABQH4oVvsuXtJkiz6jczsNHLs",
  authDomain: "plan-8844c.firebaseapp.com",
  projectId: "plan-8844c",
  storageBucket: "plan-8844c.firebasestorage.app",
  messagingSenderId: "526233022174",
  appId: "1:526233022174:web:ff4e91d595adf6a62a9c4f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const SYDNEY_DOC = "sydney_main";

// ─── State ───
let planData = null;
let currentDay = 1;
let flightFilter = "all";
let hotelFilter  = "all";
let flightSort   = "depdate_asc";
let hotelSort    = "price";
let flightAnnualFilter = "all"; // 연차 필터: "all" | "5" | "6"
let exchangeRateAudToKrw = 900; // 기본 환율

// ─── Area Label Map ───
const AREA_LABELS = {
  circular: "서큘러 키",
  cbd:      "CBD",
  darling:  "달링하버",
  bondi:    "본다이비치",
  etc:      "기타"
};

// ─── Checklist Default ───
const defaultChecklistGroups = [
  {
    id: "flight_prep", title: "✈️ 항공 준비",
    items: [
      { id:"c1",  text:"항공권 예약 완료",         desc:"왕복 e-ticket 출력/저장",                    done:false, important:true  },
      { id:"c2",  text:"여권 유효기간 확인",        desc:"출발일 기준 6개월 이상 남아야 함",             done:false, important:true  },
      { id:"c3",  text:"ETA (호주 전자비자) 신청",  desc:"입국 전 필수 · AUD 20 · eta.homeaffairs.gov.au", done:false, important:true },
      { id:"c4",  text:"여행자 보험 가입",          desc:"의료비·분실·지연 커버 확인",                  done:false, important:false }
    ]
  },
  {
    id: "hotel_prep", title: "🏨 숙소 준비",
    items: [
      { id:"c5",  text:"호텔 예약 확인서 출력",     desc:"체크인 시 필요",                            done:false, important:false },
      { id:"c6",  text:"체크인·아웃 시간 확인",     desc:"얼리체크인 필요 시 사전 요청",                done:false, important:false },
      { id:"c7",  text:"호텔 위치·교통 확인",       desc:"공항에서 호텔까지 이동 경로",                 done:false, important:false }
    ]
  },
  {
    id: "local_prep", title: "🌏 현지 준비",
    items: [
      { id:"c8",  text:"호주 달러(AUD) 환전",       desc:"소지금 계획 : 1 AUD ≈ 900원",               done:false, important:false },
      { id:"c9",  text:"로밍 또는 현지 유심 준비",  desc:"현지 유심 추천 : Optus / Telstra",          done:false, important:false },
      { id:"c10", text:"오팔 카드 충전 계획",       desc:"버스·전철·페리 통합 교통카드",                done:false, important:false },
      { id:"c11", text:"예약 필수 레스토랑 부킹",   desc:"오페라 바·베네롱·챠트하우스 등",              done:false, important:false },
      { id:"c12", text:"오페라 하우스 투어 예약",   desc:"온라인 사전 예약 권장 (매진 주의!)",          done:false, important:true  }
    ]
  },
  {
    id: "packing", title: "🎒 짐 싸기",
    items: [
      { id:"c13", text:"변환 플러그 (I타입)",       desc:"호주 전용 3핀 형태",                        done:false, important:true  },
      { id:"c14", text:"자외선차단제 (SPF50+)",     desc:"호주 자외선 매우 강함 ☀️",                   done:false, important:false },
      { id:"c15", text:"수영복 & 래시가드",         desc:"본다이비치 필수",                            done:false, important:false },
      { id:"c16", text:"카메라 & 여분 배터리",      desc:"오페라 하우스 야경 촬영용",                  done:false, important:false }
    ]
  }
];

const defaultSydneyData = {
  departDate: "2026-09-01T09:00:00",
  flights: [],
  hotels:  [],
  memos:   [],
  tours: [
    { id:"t1", name:"오페라 하우스 공식 가이드 투어",          platform:"마이리얼트립", cat:"관광",    price:52000,  dur:"1시간 30분", desc:"세계문화유산 내부 탐방, 한국어 오디오 가이드 포함",          link:"https://www.myrealtrip.com", memo:"오전 10시 South Entrance 집합", selected:false },
    { id:"t2", name:"블루마운틴 + 페더데일 동물원 당일 투어",  platform:"KKday",        cat:"관광",    price:95000,  dur:"10시간",      desc:"한국인 가이드 · 시닉월드 왕복 케이블카 · 코알라 포토 포함", link:"https://www.kkday.com", memo:"시드니 CBD 픽업, 07:30 출발", selected:false },
    { id:"t3", name:"BridgeClimb 하버브리지 클라이밍",         platform:"직접예약",     cat:"액티비티", price:188000, dur:"3시간 30분", desc:"하버브리지 정상 등반, 일출/주간/황혼 중 선택 가능",          link:"https://www.bridgeclimb.com", memo:"최소 48시간 전 예약 필수, 음주 불가", selected:false },
    { id:"t4", name:"본다이 비치 서핑 레슨",                   platform:"KKday",        cat:"액티비티", price:68000,  dur:"2시간",      desc:"초보자 전용 · 장비 포함 · 보드 1인 1개 제공",              link:"https://www.kkday.com", memo:"선크림 필수, 수영복 착용 후 방문", selected:false },
    { id:"t5", name:"시드니 하버 선셋 디너 크루즈",             platform:"마이리얼트립", cat:"식사",    price:145000, dur:"3시간",       desc:"3코스 디너 + 오페라하우스 야경 · 와인 무제한",              link:"https://www.myrealtrip.com", memo:"스마트 캐주얼 드레스코드, 18:30 탑승", selected:false }
  ],
  days: {
    1: [
      { id:1001, time:"13:00", name:"시드니 오페라 하우스", lat:-33.8568, lng:151.2153, memo:"세계문화유산 🎭 가이드 투어 예약 필수!" },
      { id:1002, time:"15:00", name:"하버브릿지 전망대",    lat:-33.8523, lng:151.2108, memo:"BridgeClimb 체험 투어 추천 🌉" },
      { id:1003, time:"19:00", name:"서큘러 키 레스토랑",   lat:-33.8610, lng:151.2107, memo:"항구뷰 레스토랑에서 저녁 식사 🦞" }
    ],
    2: [
      { id:2001, time:"09:00", name:"본다이 비치",  lat:-33.8914, lng:151.2767, memo:"서핑 레슨 or 해변 산책 🏄" },
      { id:2002, time:"14:00", name:"달링하버",     lat:-33.8738, lng:151.1992, memo:"시푸드 마켓 & 쇼핑 🦀" }
    ],
    3: [
      { id:3001, time:"10:00", name:"왓슨스 베이",     lat:-33.8451, lng:151.2739, memo:"갭파크 절벽 산책과 피시앤칩스 🐟" },
      { id:3002, time:"15:00", name:"시드니 공항 출발", lat:-33.9399, lng:151.1753, memo:"3시간 전 체크인 완료 ✈️" }
    ]
  }
};

// ─── Init ───
document.addEventListener("DOMContentLoaded", async () => {
  generateStars();
  await loadData();
  startCountdown();
  fetchExchangeRate();
  renderFlights();
  renderHotels();
  renderTours();
  renderChecklist();
  renderDayTabs();
  renderTimeline();
  renderMemos();
  renderExpenses();

  // Google Maps 자동 로드
  activateMap();

  generateFloatingAnimals();
});

function generateStars() {
  const f = document.getElementById("starField");
  if (!f) return;
  for (let i = 0; i < 80; i++) {
    const s = document.createElement("div");
    s.className = "star";
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--op:${0.3+Math.random()*0.7};animation-delay:${Math.random()*5}s;`;
    f.appendChild(s);
  }
}

function generateFloatingAnimals() {
  const container = document.createElement("div");
  container.className = "floating-animals-wrap";
  
  const quokkaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1em" height="1em">
    <!-- Base Face -->
    <path d="M 15 50 C 15 10, 85 10, 85 50 C 85 85, 65 95, 50 95 C 35 95, 15 85, 15 50 Z" fill="#8d6e63"/>
    <!-- Muzzle / Lower Face Area -->
    <path d="M 25 60 C 25 40, 75 40, 75 60 C 75 80, 60 90, 50 90 C 40 90, 25 80, 25 60 Z" fill="#d7ccc8"/>
    <!-- Ears -->
    <circle cx="20" cy="25" r="12" fill="#8d6e63" />
    <circle cx="80" cy="25" r="12" fill="#8d6e63" />
    <circle cx="20" cy="27" r="7" fill="#d7ccc8" />
    <circle cx="80" cy="27" r="7" fill="#d7ccc8" />
    <!-- Cheeks (Blush) -->
    <circle cx="30" cy="65" r="7" fill="#ffcdd2" opacity="0.8"/>
    <circle cx="70" cy="65" r="7" fill="#ffcdd2" opacity="0.8"/>
    <!-- Eyes -->
    <circle cx="35" cy="50" r="5" fill="#3e2723" />
    <circle cx="65" cy="50" r="5" fill="#3e2723" />
    <!-- Happy Eyes Glint -->
    <circle cx="33" cy="48" r="2" fill="#fff" />
    <circle cx="63" cy="48" r="2" fill="#fff" />
    <!-- Cute Big Nose -->
    <ellipse cx="50" cy="62" rx="7" ry="5" fill="#4e342e" />
    <!-- Big Quokka Smile -->
    <path d="M 38 72 Q 50 85 62 72" fill="none" stroke="#4e342e" stroke-width="3" stroke-linecap="round"/>
    <path d="M 50 67 L 50 78" fill="none" stroke="#4e342e" stroke-width="3"/>
  </svg>`;
  const quokkaImg = `<img src="data:image/svg+xml;utf8,${encodeURIComponent(quokkaSvg)}" style="width:1em;height:1em;display:inline-block;">`;
  
  const emojis = [quokkaImg, "🐨"];
  let html = "";
  for (let i = 0; i < 12; i++) {
    const e = emojis[Math.floor(Math.random() * emojis.length)];
    const size = 30 + Math.random() * 40; 
    
    // 좌우 사이드(2~12vw 또는 88~98vw)에만 배치하여 콘텐츠 영역 침범 방지
    const isLeft = Math.random() > 0.5;
    const left = isLeft ? (2 + Math.random() * 10) : (88 + Math.random() * 10);
    
    const duration = 20 + Math.random() * 30;
    const delay = Math.random() * -30;
    html += `<div class="floating-animal" style="left:${left}vw; font-size:${size}px; animation-duration:${duration}s; animation-delay:${delay}s;">${e}</div>`;
  }
  container.innerHTML = html;
  document.body.appendChild(container);
}

// ─── Countdown ───
function startCountdown() {
  const update = () => {
    const target = new Date(planData?.departDate || defaultSydneyData.departDate).getTime();
    const diff = target - Date.now();
    if (diff <= 0) { ["cdDays","cdHours","cdMins","cdSecs"].forEach(id => document.getElementById(id).textContent = "00"); return; }
    const d = Math.floor(diff/86400000);
    const h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    document.getElementById("cdDays").textContent  = String(d).padStart(2,"0");
    document.getElementById("cdHours").textContent = String(h).padStart(2,"0");
    document.getElementById("cdMins").textContent  = String(m).padStart(2,"0");
    document.getElementById("cdSecs").textContent  = String(s).padStart(2,"0");
  };
  update();
  setInterval(update, 1000);
}

// ─── Firebase: Load / Save ───
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    db.collection("planData").doc(SYDNEY_DOC).set({
      ...planData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(e => console.error("Save error:", e));
  }, 500);
}

async function loadData() {
  try {
    const snap = await db.collection("planData").doc(SYDNEY_DOC).get();
    if (snap.exists) {
      planData = snap.data();
      if (!planData.checklistGroups) planData.checklistGroups = JSON.parse(JSON.stringify(defaultChecklistGroups));
      if (!planData.flights) planData.flights = [];
      if (!planData.hotels)  planData.hotels  = [];
      if (!planData.memos)   planData.memos   = [];
      if (!planData.expenses) planData.expenses = [];
      // 투어 기본값 강제 갱신 (링크 등 업데이트 반영)
      planData.tours = JSON.parse(JSON.stringify(defaultSydneyData.tours));
      console.log("✅ 시드니 플래너 로드 완료");
    } else {
      planData = { ...JSON.parse(JSON.stringify(defaultSydneyData)), checklistGroups: JSON.parse(JSON.stringify(defaultChecklistGroups)) };
      scheduleSave();
      console.log("📝 기본 데이터 최초 저장");
    }
  } catch (e) {
    console.error("Load error:", e);
    planData = { ...JSON.parse(JSON.stringify(defaultSydneyData)), checklistGroups: JSON.parse(JSON.stringify(defaultChecklistGroups)) };
  }
}

// ─── Tab ───
function switchTab(tab, btn) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("panel-" + tab).classList.add("active");
  btn.classList.add("active");
  showCoachMark(tab);
}

// ================================================================
//  FLIGHT — CRUD + Render
// ================================================================

// ── Modal Open/Close ──
function openFlightModal(id) {
  const f = planData.flights.find(x => x.id === id);
  document.getElementById("flightEditId").value = id || "";
  document.getElementById("flightModalTitle").textContent = id ? "✈️ 항공권 수정" : "✈️ 항공권 추가";
  document.getElementById("fm_airline").value  = "아시아나항공";
  document.getElementById("fm_depdate").value  = f?.depdate  || "";
  document.getElementById("fm_dep").value      = f?.dep      || "";
  document.getElementById("fm_arr").value      = f?.arr      || "";
  document.getElementById("fm_depCode").value  = f?.depCode  || "ICN";
  document.getElementById("fm_arrCode").value  = f?.arrCode  || "SYD";
  document.getElementById("fm_dur").value      = "10시간 20분";
  document.getElementById("fm_rdep").value     = f?.rdep     || "";
  document.getElementById("fm_rarr").value     = f?.rarr     || "";
  document.getElementById("fm_rdur").value     = "10시간 20분";
  document.getElementById("fm_rdate").value    = f?.rdate    || "";
  document.getElementById("fm_price").value    = f?.price    || "";
  document.getElementById("fm_class").value    = f?.cls      || "이코노미";
  document.getElementById("fm_memo").value     = f?.memo     || "";
  // 연차 라디오 세팅
  const annualVal = f?.annualLeave || "";
  document.querySelectorAll('input[name="fm_annual"]').forEach(r => r.checked = (r.value === annualVal));
  if (!annualVal) document.getElementById("fm_annual_none").checked = true;
  document.getElementById("flightModal").classList.add("active");
}
function closeFlightModal() { document.getElementById("flightModal").classList.remove("active"); }

// ── Save Flight ──
function saveFlight() {
  const airline = document.getElementById("fm_airline").value.trim();
  const price   = parseInt(document.getElementById("fm_price").value) || 0;
  if (!airline) { alert("항공사명를 입력해 주세요."); return; }

  const existingId = document.getElementById("flightEditId").value;
  const existing   = planData.flights.find(x => x.id === existingId);

  const entry = {
    id:      existingId || String(Date.now()),
    airline,
    depdate: document.getElementById("fm_depdate").value,
    dep:     document.getElementById("fm_dep").value,
    arr:     document.getElementById("fm_arr").value,
    depCode: document.getElementById("fm_depCode").value.trim() || "ICN",
    arrCode: document.getElementById("fm_arrCode").value.trim() || "SYD",
    dur:     "10시간 20분",
    // 오는 편
    rdep:    document.getElementById("fm_rdep").value,
    rarr:    document.getElementById("fm_rarr").value,
    rdur:    "10시간 20분",
    rdate:   document.getElementById("fm_rdate").value,
    price,
    cls:         document.getElementById("fm_class").value.trim() || "이코노미",
    annualLeave: document.querySelector('input[name="fm_annual"]:checked')?.value || "",
    link:        existing?.link || "",
    memo:        document.getElementById("fm_memo").value.trim(),
    selected: existing?.selected || false
  };

  const idx = planData.flights.findIndex(x => x.id === entry.id);
  if (idx >= 0) planData.flights[idx] = entry;
  else planData.flights.push(entry);

  closeFlightModal();
  renderFlights();
  scheduleSave();
}

// ── Select Flight ──
function selectFlight(id) {
  planData.flights.forEach(f => {
    f.selected = (f.id === id) ? !f.selected : false;
  });
  renderFlights();
  scheduleSave();
}

// ── Delete Flight ──
function deleteFlight(id) {
  if (!confirm("이 항공권을 삭제할까요?")) return;
  planData.flights = planData.flights.filter(x => x.id !== id);
  renderFlights();
  scheduleSave();
}

// ── Filter / Sort ──
// ─── Sort only (직항 고정) ───
function filterFlights(type, btn) { renderFlights(); } // 호환성 유지

function filterByAnnual(days, btn) {
  // 토글: 다시 누르면 전체보기
  flightAnnualFilter = (flightAnnualFilter === days) ? "all" : days;
  document.querySelectorAll("#annualBtn_5, #annualBtn_6").forEach(b => b.classList.remove("active"));
  if (flightAnnualFilter !== "all") btn.classList.add("active");
  renderFlights();
}
function sortFlights(by, btn) {
  flightSort = by;
  document.querySelectorAll("#flightFilterBar .filter-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderFlights();
}

// ── Render Flights ──
function renderFlights() {
  if (!planData) return;
  const emptyEl  = document.getElementById("flightEmptyState");
  const gridEl   = document.getElementById("flightGrid");
  const bannerEl = document.getElementById("flightSummaryBanner");

  let list = [...planData.flights];

  // Sort
  if (flightSort === "price")        list.sort((a,b) => (a.price||Infinity) - (b.price||Infinity));
  if (flightSort === "dur")          list.sort((a,b) => parseDur(a.dur) - parseDur(b.dur));
  if (flightSort === "dep")          list.sort((a,b) => (a.dep||"").localeCompare(b.dep||""));
  if (flightSort === "depdate_asc")  list.sort((a,b) => (a.depdate||"").localeCompare(b.depdate||""));
  if (flightSort === "depdate_desc") list.sort((a,b) => (b.depdate||"").localeCompare(a.depdate||""));

  // 연차 필터
  if (flightAnnualFilter !== "all") list = list.filter(f => f.annualLeave === flightAnnualFilter);

  if (planData.flights.length === 0) {
    emptyEl.style.display  = "flex";
    gridEl.style.display   = "none";
    if (bannerEl) bannerEl.style.display = "none";
    return;
  }

  emptyEl.style.display        = "none";
  gridEl.style.display         = "block";
  gridEl.style.flexDirection   = "";
  gridEl.style.gap             = "";
  if (bannerEl) bannerEl.style.display = "none"; // 배너 숨김

  gridEl.innerHTML = list.map(f => {
    const isCheapest = list[0]?.id === f.id && list.length > 1;
    const isSelected = f.selected || false;
    const nightsLabel = calcNightsLabel(f);

    const badges = [];
    if (isCheapest) badges.push(`<span class="badge-pill badge-cheapest">🏷️ 최저가</span>`);
    badges.push(`<span class="badge-pill badge-direct">✈ 직항</span>`);
    if (f.cls) badges.push(`<span class="badge-pill" style="background:rgba(148,163,184,0.1);border:1px solid rgba(148,163,184,0.25);color:var(--text-sub);">${f.cls}</span>`);
    if (nightsLabel) badges.push(`<span class="badge-pill" style="background:rgba(14,165,233,0.15);border:1px solid rgba(14,165,233,0.35);color:#38bdf8;">🌙 ${nightsLabel}</span>`);
    if (f.annualLeave) badges.push(`<span class="badge-pill" style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);color:#34d399;">🏖️ 연차 ${f.annualLeave}일</span>`);


    const hasReturn = f.rdep || f.rarr;

    return `
    <div class="glass-card fc-row ${isSelected ? 'selected' : ''}" id="fc-${f.id}">

      <div class="fc-header">
        <div class="fc-header-left">
          <div class="fc-airline-name">${f.airline}</div>
          <div class="fc-airline-meta">${badges.join("")}</div>
        </div>
        <div class="fc-header-right">
          <div class="fc-price">${f.price ? fmtPrice(f.price) : "-"}<span>원</span></div>
          <div class="fc-actions">
            <button class="btn-select ${isSelected ? 'selected-active' : ''}" onclick="selectFlight('${f.id}')">
              ${isSelected ? '✅ 선택됨' : '☐ 선택'}
            </button>
            <button class="btn-action" onclick="openFlightModal('${f.id}')" title="수정">✏️</button>
            <button class="btn-action del" onclick="deleteFlight('${f.id}')" title="삭제">🗑</button>
          </div>
        </div>
      </div>

      <div class="fc-legs">
        <div class="fc-leg">
          <div class="fc-leg-label out">🛫 가는 편 <span class="fc-leg-route">${f.depCode||"ICN"} → ${f.arrCode||"SYD"}${f.depdate ? ` · ${f.depdate.slice(5).replace("-","/")}` : ""}</span></div>
          <div class="fc-route">
            <div class="fc-point">
              <div class="fc-time">${f.dep || "--:--"}</div>
              <div class="fc-code">${f.depCode || "ICN"}</div>
            </div>
            <div class="fc-mid">
              <div class="fc-dur">${f.dur || "-"}</div>
              <div class="fc-line"></div>
            </div>
            <div class="fc-point">
              <div class="fc-time">${f.arr || "--:--"}</div>
              <div class="fc-code">${f.arrCode || "SYD"}</div>
            </div>
          </div>
        </div>

        <div class="fc-leg ${hasReturn ? '' : 'fc-leg-empty'}">
          <div class="fc-leg-label ret">🛬 오는 편 <span class="fc-leg-route">SYD → ICN${f.rdate ? ` · ${new Date(f.rdate+"T00:00").toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"})}` : ""}</span></div>
          ${hasReturn ? `
          <div class="fc-route">
            <div class="fc-point">
              <div class="fc-time">${f.rdep || "--:--"}</div>
              <div class="fc-code">SYD</div>
            </div>
            <div class="fc-mid">
              <div class="fc-dur">${f.rdur || "-"}</div>
              <div class="fc-line"></div>
            </div>
            <div class="fc-point">
              <div class="fc-time">${f.rarr || "--:--"}</div>
              <div class="fc-code">ICN</div>
            </div>
          </div>` : `<div class="fc-empty-hint">오는 편 미입력 — ✏️ 수정으로 추가</div>`}
        </div>
      </div>

      ${f.memo ? `<div class="fc-footer"><span class="fc-memo-text">💬 ${f.memo}</span></div>` : ""}
    </div>`;
  }).join("");
}

// ── Helpers ──
function isDirect(stops) {
  if (!stops) return false;
  const s = stops.trim().toLowerCase();
  return s === "직항" || s === "direct" || s === "" ;
}
function parseDur(dur) {
  if (!dur) return 9999;
  const m = dur.match(/(\d+)h\s*(\d*)/);
  return m ? parseInt(m[1])*60 + (parseInt(m[2])||0) : 9999;
}
function fmtPrice(n) { return Number(n).toLocaleString(); }

// 몇박 몇일 계산: 박=현지숙박, 일=출발일~귀국일 전체
function calcNightsLabel(f) {
  if (!f.depdate || !f.rdate) return null;
  const dep = new Date(f.depdate);   // 한국 출발일
  const ret = new Date(f.rdate);     // 귀국 출발일 (현지 기준)
  if (isNaN(dep) || isNaN(ret)) return null;

  // 박: 현지 도착일 ~ 귀국 출발일 (가는 비행 자정 넘으면 +1)
  let arrivalDate = new Date(dep);
  if (f.dep && f.arr && f.arr < f.dep) {
    arrivalDate.setDate(arrivalDate.getDate() + 1);
  }
  const nights = Math.round((ret - arrivalDate) / 86400000);

  // 일: 출발일 ~ 귀국일 (전체 여행일수)
  const totalDays = Math.round((ret - dep) / 86400000) + 1;

  if (nights <= 0 || totalDays <= 0) return null;
  return `${nights}박 ${totalDays}일`;
}

// ================================================================
//  HOTEL — CRUD + Render
// ================================================================

function openHotelModal(id) {
  const h = planData.hotels.find(x => x.id === id);
  document.getElementById("hotelEditId").value = id || "";
  document.getElementById("hotelModalTitle").textContent = id ? "🏨 호텔 수정" : "🏨 호텔 추가";
  document.getElementById("hm_name").value    = h?.name    || "";
  document.getElementById("hm_area").value    = h?.area    || "circular";
  document.getElementById("hm_stars").value   = h?.stars   || "4";
  document.getElementById("hm_price").value   = h?.price   || "";
  document.getElementById("hm_tag").value     = h?.tag     || "";
  document.getElementById("hm_desc").value    = h?.desc    || "";
  document.getElementById("hm_agoda").value   = h?.agoda   || "";
  document.getElementById("hm_booking").value = h?.booking || "";
  document.getElementById("hm_yanolya").value = h?.yanolya || "";
  document.getElementById("hm_gmap").value    = h?.gmap    || "";
  document.getElementById("hm_memo").value    = h?.memo    || "";
  document.getElementById("hotelModal").classList.add("active");
}
function closeHotelModal() { document.getElementById("hotelModal").classList.remove("active"); }

function saveHotel() {
  const name = document.getElementById("hm_name").value.trim();
  if (!name) { alert("호텔명을 입력해 주세요."); return; }

  const existingId = document.getElementById("hotelEditId").value;
  const existing   = planData.hotels.find(x => x.id === existingId);

  const entry = {
    id:      existingId || String(Date.now()),
    name,
    area:    document.getElementById("hm_area").value,
    stars:   parseInt(document.getElementById("hm_stars").value),
    price:   parseInt(document.getElementById("hm_price").value) || 0,
    tag:     document.getElementById("hm_tag").value,
    desc:    document.getElementById("hm_desc").value.trim(),
    agoda:   document.getElementById("hm_agoda").value.trim(),
    booking: document.getElementById("hm_booking").value.trim(),
    yanolya: document.getElementById("hm_yanolya").value.trim(),
    gmap:    document.getElementById("hm_gmap").value.trim(),
    memo:    document.getElementById("hm_memo").value.trim(),
    selected: existing?.selected || false
  };

  const idx = planData.hotels.findIndex(x => x.id === entry.id);
  if (idx >= 0) planData.hotels[idx] = entry;
  else planData.hotels.push(entry);

  closeHotelModal();
  renderHotels();
  scheduleSave();
}

function selectHotel(id) {
  planData.hotels.forEach(h => {
    h.selected = (h.id === id) ? !h.selected : false;
  });
  renderHotels();
  scheduleSave();
}

function deleteHotel(id) {
  if (!confirm("이 호텔을 삭제할까요?")) return;
  planData.hotels = planData.hotels.filter(x => x.id !== id);
  renderHotels();
  scheduleSave();
}

function filterHotels(area, btn) {
  hotelFilter = area;
  document.getElementById("hotelFilterBar")
    .querySelectorAll(".filter-chip:not([onclick*='sort'])").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  renderHotels();
}
function sortHotels(by) {
  hotelSort = by;
  renderHotels();
}

function renderHotels() {
  if (!planData) return;
  const emptyEl  = document.getElementById("hotelEmptyState");
  const gridEl   = document.getElementById("hotelGrid");
  const bannerEl = document.getElementById("hotelSummaryBanner");

  let list = [...planData.hotels];
  if (hotelFilter !== "all") list = list.filter(h => h.area === hotelFilter);
  if (hotelSort === "price") list.sort((a,b) => (a.price||Infinity) - (b.price||Infinity));
  if (hotelSort === "star")  list.sort((a,b) => (b.stars||0) - (a.stars||0));

  if (planData.hotels.length === 0) {
    emptyEl.style.display  = "flex";
    gridEl.style.display   = "none";
    bannerEl.style.display = "none";
    return;
  }

  emptyEl.style.display  = "none";
  gridEl.style.display   = "grid";
  if (bannerEl) bannerEl.style.display = "none"; // 배너 숨김

  gridEl.innerHTML = list.map(h => {
    const stars     = "⭐".repeat(h.stars || 0);
    const areaLbl   = AREA_LABELS[h.area] || h.area;
    const tagLabels = { best:"👑 BEST", value:"💚 가성비", pick:"⭐ 내 픽" };
    const tagHtml   = h.tag ? `<div class="hc-tag ${h.tag}">${tagLabels[h.tag]||""}</div>` : "";
    const memoHtml  = h.memo ? `<div class="hc-card-memo">💬 ${h.memo}</div>` : "";
    const descHtml  = h.desc ? `<div class="hc-card-desc">${h.desc}</div>` : "";
    const isSelected = h.selected || false;

    const mkLink = (url, cls, label) => url
      ? `<a class="btn-link-sm ${cls}" href="${url}" target="_blank">${label}</a>`
      : `<span class="btn-link-sm nolink">${label}</span>`;

    return `
    <div class="glass-card hc-card ${isSelected ? 'selected' : ''}">
      ${tagHtml}
      <div class="hc-card-top">
        <div class="hc-card-header">
          <div>
            <div class="hc-card-name">${h.name}</div>
            <div class="hc-card-stars">${stars}</div>
          </div>
          <div class="hc-card-actions">
            <button class="btn-select ${isSelected ? 'selected-active' : ''}" onclick="selectHotel('${h.id}')">
              ${isSelected ? '✅ 선택됨' : '☐ 선택'}
            </button>
            <button class="btn-action" onclick="openHotelModal('${h.id}')" title="수정">✏️</button>
            <button class="btn-action del" onclick="deleteHotel('${h.id}')" title="삭제">🗑</button>
          </div>
        </div>
        <div class="hc-card-location">📍 ${areaLbl}</div>
        <div class="hc-card-price">
          <div class="hc-price-num">${h.price ? fmtPrice(h.price) : "-"}</div>
          <div class="hc-price-unit">원 / 박</div>
        </div>
        ${descHtml}
        ${memoHtml}
      </div>
      <div class="hc-card-links">
        ${mkLink(h.agoda,   "agoda",   "Agoda")}
        ${mkLink(h.booking, "booking", "Booking")}
        ${mkLink(h.yanolya, "yanolya", "야놀자")}
        ${mkLink(h.gmap,    "gmap",    "🗺 지도")}
      </div>
    </div>`;
  }).join("");
}

// ================================================================
//  CHECKLIST
// ================================================================
function renderChecklist() {
  if (!planData) return;
  const layout = document.getElementById("checklistLayout");
  if (!layout) return;
  const groups     = planData.checklistGroups || defaultChecklistGroups;
  const allItems   = groups.flatMap(g => g.items);
  const doneCount  = allItems.filter(i => i.done).length;
  const total      = allItems.length;
  const pct        = total ? Math.round(doneCount/total*100) : 0;
  const bar        = document.getElementById("progressBar");
  const txt        = document.getElementById("progressText");
  if (bar) bar.style.width = pct + "%";
  if (txt) txt.textContent = `${doneCount} / ${total} 완료 (${pct}%)`;

  layout.innerHTML = groups.map(group => {
    // 첫 번째 단어(이모지)와 나머지 제목 분리
    const parts     = group.title.trim().split(/\s+/);
    const icon      = parts[0];
    const titleText = parts.slice(1).join(" ") || icon;
    const done      = group.items.filter(i => i.done).length;
    const cnt       = group.items.length;

    return `
    <div class="glass-card checklist-group">
      <div class="checklist-group-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;line-height:1;flex-shrink:0;">${icon}</span>
          <div class="checklist-group-title">${titleText}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="checklist-group-count">${done}/${cnt}</div>
          <button onclick="deleteChecklistGroup('${group.id}')"
                  style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;opacity:0.4;transition:opacity .2s;padding:2px 4px;"
                  onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.4'"
                  title="섹션 삭제">✕</button>
        </div>
      </div>
      ${group.items.map(item => `
        <div class="check-item ${item.done ? 'done' : ''}" id="check-${group.id}-${item.id}">
          <div class="check-box-custom ${item.done ? 'checked' : ''}"
               onclick="toggleCheck('${group.id}','${item.id}')"></div>
          <div style="flex:1; cursor:pointer;" onclick="toggleCheck('${group.id}','${item.id}')">
            <div class="check-text">${item.text}</div>
          </div>
          <button onclick="startEditCheck('${group.id}','${item.id}')"
                  style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:2px 4px;flex-shrink:0;opacity:0.4;transition:opacity .2s;"
                  onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.4'"
                  title="수정/삭제">✏️</button>
        </div>
      `).join("")}
      <div class="add-check-row">
        <input class="add-check-input" id="nci-${group.id}" placeholder="항목 추가..."
               onkeypress="if(event.key==='Enter') addCheckItem('${group.id}')">
        <button class="btn-add-check" onclick="addCheckItem('${group.id}')">+</button>
      </div>
    </div>`;
  }).join("");
}

function showAddGroupForm() {
  const layout = document.getElementById("checklistLayout");
  if (!layout) return;
  // 이미 폼이 있으면 무시
  if (document.getElementById("addGroupForm")) return;
  const formEl = document.createElement("div");
  formEl.id = "addGroupForm";
  formEl.className = "glass-card checklist-group";
  formEl.style.cssText = "padding:16px;";
  formEl.innerHTML = `
    <div style="font-size:13px;font-weight:700;color:var(--text-sub);margin-bottom:10px;">새 섹션 추가</div>
    <div style="display:flex;gap:8px;align-items:center;">
      <input class="add-check-input" id="newGroupIcon" placeholder="🎯" maxlength="2"
             style="width:52px;text-align:center;font-size:18px;">
      <input class="add-check-input" id="newGroupTitle" placeholder="섹션 제목 입력..."
             style="flex:1;"
             onkeypress="if(event.key==='Enter') saveChecklistGroup()">
      <button onclick="saveChecklistGroup()"
              style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;">추가</button>
      <button onclick="renderChecklist()"
              style="background:rgba(255,255,255,0.08);color:var(--text-sub);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:7px 12px;font-size:12px;cursor:pointer;">취소</button>
    </div>
  `;
  layout.appendChild(formEl);
  document.getElementById("newGroupTitle")?.focus();
}

function saveChecklistGroup() {
  const icon  = document.getElementById("newGroupIcon")?.value.trim() || "📋";
  const title = document.getElementById("newGroupTitle")?.value.trim();
  if (!title) { alert("섹션 제목을 입력해 주세요."); return; }
  if (!planData.checklistGroups) planData.checklistGroups = [];
  planData.checklistGroups.push({
    id:    "cg_" + Date.now(),
    title: `${icon} ${title}`,
    items: []
  });
  renderChecklist();
  scheduleSave();
}

function deleteChecklistGroup(groupId) {
  if (!confirm("이 섹션과 모든 항목을 삭제할까요?")) return;
  planData.checklistGroups = planData.checklistGroups.filter(g => g.id !== groupId);
  renderChecklist();
  scheduleSave();
}


function startEditCheck(groupId, itemId) {
  const group = planData.checklistGroups.find(g => g.id === groupId);
  const item  = group?.items.find(i => i.id === itemId);
  if (!item) return;
  const el = document.getElementById(`check-${groupId}-${itemId}`);
  if (!el) return;
  el.innerHTML = `
    <input class="add-check-input" id="edit-ci-${itemId}"
           value="${item.text.replace(/"/g,'&quot;')}"
           style="flex:1;"
           onkeypress="if(event.key==='Enter') saveEditCheck('${groupId}','${itemId}')">
    <div style="display:flex;gap:6px;flex-shrink:0;">
      <button onclick="saveEditCheck('${groupId}','${itemId}')"
              style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;font-weight:700;">저장</button>
      <button onclick="deleteCheckItem('${groupId}','${itemId}')"
              style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;font-weight:700;">삭제</button>
      <button onclick="renderChecklist()"
              style="background:rgba(255,255,255,0.08);color:var(--text-sub);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;">취소</button>
    </div>
  `;
  el.style.gap = "8px";
  document.getElementById(`edit-ci-${itemId}`)?.focus();
}

function saveEditCheck(groupId, itemId) {
  const group = planData.checklistGroups.find(g => g.id === groupId);
  const item  = group?.items.find(i => i.id === itemId);
  if (!item) return;
  const text = document.getElementById(`edit-ci-${itemId}`)?.value.trim();
  if (!text) return;
  item.text = text;
  renderChecklist();
  scheduleSave();
}

function deleteCheckItem(groupId, itemId) {
  if (!confirm("이 항목을 삭제할까요?")) return;
  const group = planData.checklistGroups.find(g => g.id === groupId);
  if (!group) return;
  group.items = group.items.filter(i => i.id !== itemId);
  renderChecklist();
  scheduleSave();
}

function toggleCheck(groupId, itemId) {
  const group = planData.checklistGroups.find(g => g.id === groupId);
  const item  = group?.items.find(i => i.id === itemId);
  if (!item) return;
  item.done = !item.done;
  renderChecklist();
  scheduleSave();

}

function addCheckItem(groupId) {
  const input = document.getElementById("nci-" + groupId);
  const text  = input?.value.trim();
  if (!text) return;
  const group = planData.checklistGroups.find(g => g.id === groupId);
  if (!group) return;
  group.items.push({ id:"cu_"+Date.now(), text, desc:"", done:false, important:false });
  renderChecklist();
  scheduleSave();
}

// ================================================================
//  ITINERARY
// ================================================================
let dayEditMode = false;

function toggleDayEditMode() {
  dayEditMode = !dayEditMode;
  const btn = document.getElementById("btnEditDays");
  if (btn) {
    btn.textContent = dayEditMode ? "✕ 닫기" : "✏️ 편집";
    btn.style.background = dayEditMode ? "rgba(239,68,68,0.15)" : "";
    btn.style.borderColor = dayEditMode ? "rgba(239,68,68,0.35)" : "";
    btn.style.color = dayEditMode ? "#f87171" : "";
  }
  renderDayTabs();
  renderTimeline();
}

function renderDayTabs() {
  if (!planData) return;
  const container = document.getElementById("dayTabsMini");
  if (!container) return;
  const keys = Object.keys(planData.days).map(Number).sort((a,b)=>a-b);
  container.innerHTML = keys.map(d => {
    const delBtn = (dayEditMode && keys.length > 1)
      ? `<button onclick="deleteDay(${d})" style="position:absolute;top:-6px;right:-6px;background:rgba(239,68,68,0.9);border:none;color:#fff;width:16px;height:16px;border-radius:50%;font-size:10px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s;" title="Day ${d} 삭제">✕</button>`
      : "";
    return `<div style="display:inline-flex;align-items:center;position:relative;">
      <button class="day-tab-mini ${d === currentDay ? 'active' : ''}" onclick="switchDay(${d})">Day ${d}</button>
      ${delBtn}
    </div>`;
  }).join("");
}

function switchDay(d) {
  currentDay = d;
  renderDayTabs();
  renderTimeline();
  if (googleMapInstance) updateGoogleMapMarkers();
}

function deleteDay(d) {
  const keys = Object.keys(planData.days).map(Number).sort((a,b)=>a-b);
  if (keys.length <= 1) { alert("최소 1개의 Day는 남겨야 합니다."); return; }
  const count = (planData.days[d] || []).length;
  if (!confirm(`Day ${d}를 삭제할까요?${count ? ` (일정 ${count}개 포함)` : ""}`)) return;
  delete planData.days[d];
  // Day 번호 재정렬
  const remaining = Object.keys(planData.days).map(Number).sort((a,b)=>a-b);
  const newDays = {};
  remaining.forEach((key, idx) => { newDays[idx+1] = planData.days[key]; });
  planData.days = newDays;
  currentDay = Math.min(currentDay, Object.keys(planData.days).length);
  if (currentDay < 1) currentDay = 1;
  renderDayTabs();
  renderTimeline();
  scheduleSave();
  if (googleMapInstance) updateGoogleMapMarkers();
}

function addDay() {
  const keys   = Object.keys(planData.days).map(Number);
  const newDay = (Math.max(...keys, 0)) + 1;
  planData.days[newDay] = [];
  currentDay = newDay;
  renderDayTabs();
  renderTimeline();
  scheduleSave();
}

function renderTimeline() {
  if (!planData) return;
  const container = document.getElementById("timelineList");
  if (!container) return;
  const items = planData.days[currentDay] || [];
  if (!items.length) {
    container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px; font-weight:600;">아직 일정이 없어요. 아래에서 추가해보세요! 🗺️</div>`;
    return;
  }
  const sorted = [...items].sort((a,b) => (a.time||"").localeCompare(b.time||""));
  container.innerHTML = sorted.map((item, idx) => `
    <div class="timeline-item">
      <div class="timeline-dot-wrap">
        <div class="timeline-dot" style="cursor:pointer;" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}', '_blank')" title="Google Maps 길찾기">${idx+1}</div>
        ${idx < sorted.length-1 ? '<div class="timeline-line"></div>' : ""}
      </div>
      <div class="timeline-content">
        <div class="timeline-time">⏰ ${item.time||"--:--"}</div>
        <div class="timeline-name">${item.name}</div>
        <div class="timeline-desc">${item.memo||""}</div>
      </div>
      ${dayEditMode ? `
        <div style="display:flex;gap:4px;flex-shrink:0;align-items:center;">
          <button onclick="openAddModal(${item.id})" style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#60a5fa;cursor:pointer;font-size:11px;padding:4px 8px;border-radius:6px;font-weight:700;font-family:inherit;">수정</button>
          <button onclick="deletePlace(${currentDay},${item.id})" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;cursor:pointer;font-size:11px;padding:4px 8px;border-radius:6px;font-weight:700;font-family:inherit;">삭제</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

let placeAutocomplete = null;

function updateCoordStatus() {
  const lat = document.getElementById("modalLat").value;
  const lng = document.getElementById("modalLng").value;
  const el  = document.getElementById("coordStatus");
  if (!el) return;
  if (lat && lng) {
    el.innerHTML = `<span style="color:#34d399;">✅ 좌표 설정됨</span> <span style="color:var(--text-muted);">(${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})</span>`;
  } else {
    el.innerHTML = `<span style="color:#f59e0b;">⚠️ 좌표 없음</span> <span style="color:var(--text-muted);">— Google Maps 연동 후 장소 검색 시 자동 입력됩니다</span>`;
  }
}

function initPlaceAutocomplete() {
  if (!window.google?.maps?.places) return;
  const input = document.getElementById("modalName");
  if (placeAutocomplete) google.maps.event.clearInstanceListeners(placeAutocomplete);
  placeAutocomplete = new google.maps.places.Autocomplete(input, {
    types: ["establishment", "geocode"],
    fields: ["name", "geometry", "formatted_address"]
  });
  placeAutocomplete.addListener("place_changed", () => {
    const place = placeAutocomplete.getPlace();
    if (place?.geometry?.location) {
      document.getElementById("modalLat").value = place.geometry.location.lat();
      document.getElementById("modalLng").value = place.geometry.location.lng();
      document.getElementById("modalName").value = place.name || input.value;
      updateCoordStatus();
    }
  });
}

function openAddModal(itemId) {
  const dayKeys = Object.keys(planData.days).map(Number).sort((a,b)=>a-b);
  const select  = document.getElementById("modalDay");
  select.innerHTML = dayKeys.map(d => `<option value="${d}" ${d===currentDay?"selected":""}>Day ${d}</option>`).join("");
  document.getElementById("editItemId").value = itemId || "";
  document.getElementById("modalTitleText").textContent = itemId ? "📍 장소 수정" : "📍 새 장소 추가";
  if (itemId) {
    const item = (planData.days[currentDay]||[]).find(i=>i.id==itemId);
    if (item) {
      document.getElementById("modalTime").value = item.time||"";
      document.getElementById("modalName").value = item.name||"";
      document.getElementById("modalLat").value  = item.lat||"";
      document.getElementById("modalLng").value  = item.lng||"";
      document.getElementById("modalMemo").value = item.memo||"";
    }
  } else {
    ["modalTime","modalName","modalLat","modalLng","modalMemo"].forEach(id => document.getElementById(id).value = "");
  }
  updateCoordStatus();
  document.getElementById("addModal").classList.add("active");
  setTimeout(() => initPlaceAutocomplete(), 100);
}

function closeModal() { document.getElementById("addModal").classList.remove("active"); }

function savePlace() {
  const day  = parseInt(document.getElementById("modalDay").value);
  const time = document.getElementById("modalTime").value;
  const name = document.getElementById("modalName").value.trim();
  const lat  = parseFloat(document.getElementById("modalLat").value)||0;
  const lng  = parseFloat(document.getElementById("modalLng").value)||0;
  const memo = document.getElementById("modalMemo").value.trim();
  const editId = document.getElementById("editItemId").value;
  if (!name) { alert("장소명을 입력해 주세요."); return; }
  if (!planData.days[day]) planData.days[day] = [];
  if (editId) {
    const idx = planData.days[day].findIndex(i=>String(i.id)===editId);
    if (idx >= 0) planData.days[day][idx] = { id:parseInt(editId), time, name, lat, lng, memo };
  } else {
    planData.days[day].push({ id:Date.now(), time, name, lat, lng, memo });
  }
  currentDay = day;
  closeModal();
  renderDayTabs();
  renderTimeline();
  scheduleSave();
  if (window.googleMapInstance) updateGoogleMapMarkers();
}

function deletePlace(day, id) {
  if (!confirm("이 일정을 삭제할까요?")) return;
  planData.days[day] = (planData.days[day]||[]).filter(i=>i.id!==id);
  renderTimeline();
  scheduleSave();
}

// ================================================================
//  MEMO
// ================================================================
function renderMemos() {
  if (!planData) return;
  const board = document.getElementById("memoBoard");
  if (!board) return;
  if (!planData.memos?.length) {
    board.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px;font-weight:600;">아직 메모가 없어요! 💬</div>`;
    return;
  }
  board.innerHTML = planData.memos.map(m => `
    <div style="background:var(--white-glass);border:1px solid var(--border-glass);border-radius:10px;padding:10px 14px;">
      <div style="font-size:12px;color:var(--white);font-weight:600;line-height:1.5;">${m.text}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;font-weight:600;">${m.time}</div>
    </div>
  `).join("");
  board.scrollTop = board.scrollHeight;
}

function postMemo() {
  const input = document.getElementById("memoInput");
  const text  = input.value.trim();
  if (!text || !planData) return;
  const now = new Date();
  const t   = `${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  planData.memos = planData.memos || [];
  planData.memos.push({ text, time:t });
  input.value = "";
  renderMemos();
  scheduleSave();
}

// ================================================================
//  GOOGLE MAP
// ================================================================
let googleMapInstance = null;
let gmMarkers = [];
let gmPolyline = null;

// Day별 마커/라인 컬러 테마
const DAY_COLORS = [
  { marker:"#2563eb", border:"#60a5fa", line:"#60a5fa" },
  { marker:"#059669", border:"#34d399", line:"#34d399" },
  { marker:"#d97706", border:"#fbbf24", line:"#fbbf24" },
  { marker:"#9333ea", border:"#c084fc", line:"#c084fc" },
  { marker:"#e11d48", border:"#fb7185", line:"#fb7185" },
  { marker:"#0891b2", border:"#22d3ee", line:"#22d3ee" },
];

const GMAP_API_KEY = "AIzaSyA4_3OvP8rbcye4IHzZrj-W6Tga6GudylQ";

function activateMap() {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_API_KEY}&libraries=places&callback=initGoogleMap`;
  script.async = true;
  document.head.appendChild(script);
  script.onerror = () => alert("API 키가 올바르지 않거나 Maps API가 활성화되지 않았습니다.");
}

window.initGoogleMap = function() {
  const placeholder = document.getElementById("mapPlaceholder");
  if (placeholder) placeholder.style.display = "none";
  const mapDiv = document.getElementById("googleMap");
  mapDiv.style.display = "block";
  googleMapInstance = new google.maps.Map(mapDiv, {
    center: { lat:-33.8568, lng:151.2153 },
    zoom: 13,
    streetViewControl: false
  });
  updateGoogleMapMarkers();
};

function updateGoogleMapMarkers() {
  if (!googleMapInstance||!planData) return;
  gmMarkers.forEach(m=>m.setMap(null));
  gmMarkers=[];
  if (gmPolyline) { gmPolyline.setMap(null); gmPolyline = null; }

  const c = DAY_COLORS[(currentDay - 1) % DAY_COLORS.length];
  const items = (planData.days[currentDay]||[]).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const bounds = new google.maps.LatLngBounds();
  const path = [];
  items.forEach((item,idx)=>{
    if (!item.lat||!item.lng) return;
    const pos = {lat:parseFloat(item.lat),lng:parseFloat(item.lng)};
    const marker = new google.maps.Marker({
      position: pos, map: googleMapInstance, title: item.name,
      label: { text:String(idx+1), color:"#fff", fontWeight:"900", fontSize:"12px" },
      icon: { path:google.maps.SymbolPath.CIRCLE, scale:14, fillColor:c.marker, fillOpacity:1, strokeColor:c.border, strokeWeight:2.5 },
      zIndex: idx+1
    });
    const iw = new google.maps.InfoWindow({
      content: `<div style="font-family:'Pretendard',sans-serif;padding:4px;">
        <strong style="font-size:14px;">${item.name}</strong>
        <br><span style="font-size:12px;color:#64748b;">${item.memo||""}</span>
        <br><span style="font-size:11px;color:#94a3b8;">⏰ ${item.time||"--:--"}</span>
      </div>`
    });
    marker.addListener("click",()=>iw.open(googleMapInstance,marker));
    gmMarkers.push(marker);
    path.push(pos);
    bounds.extend(pos);
  });
  if (path.length>1) {
    gmPolyline = new google.maps.Polyline({
      path, map: googleMapInstance,
      strokeColor: c.line, strokeOpacity: 0,
      icons: [
        { icon:{ path:"M 0,-1 0,1", strokeOpacity:0.7, strokeColor:c.line, strokeWeight:3, scale:4 }, offset:"0", repeat:"12px" },
        { icon:{ path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale:4.5, fillColor:c.line, fillOpacity:1, strokeColor:"#0f172a", strokeWeight:1 }, offset:"100%", repeat:"0" },
        { icon:{ path:google.maps.SymbolPath.FORWARD_OPEN_ARROW, scale:3, strokeColor:c.line, strokeOpacity:0.5, strokeWeight:2 }, offset:"50%", repeat:"120px" }
      ]
    });
    googleMapInstance.fitBounds(bounds, { top:40, bottom:40, left:40, right:40 });
  } else if (path.length===1) {
    googleMapInstance.setCenter(path[0]);
    googleMapInstance.setZoom(15);
  } else {
    googleMapInstance.setCenter({ lat:-33.8568, lng:151.2153 });
    googleMapInstance.setZoom(13);
  }
}

// ================================================================
//  TOUR — CRUD + Render
// ================================================================
let tourFilter = "all";

const PLATFORM_STYLE = {
  "KKday":      { bg:"rgba(255,107,53,0.15)",  border:"rgba(255,107,53,0.4)",  color:"#ff9a6c"  },
  "마이리얼트립":{ bg:"rgba(52,211,153,0.15)",  border:"rgba(52,211,153,0.4)",  color:"#34d399"  },
  "트리플":     { bg:"rgba(167,139,250,0.15)", border:"rgba(167,139,250,0.4)", color:"#a78bfa"  },
  "직접예약":   { bg:"rgba(148,163,184,0.12)", border:"rgba(148,163,184,0.3)", color:"#94a3b8"  },
};
const CAT_ICON = { "관광":"🏛", "액티비티":"🏄", "식사":"🦞", "기타":"📦" };

function openTourModal(id) {
  const t = planData.tours?.find(x => x.id === id);
  document.getElementById("tourEditId").value = id || "";
  document.getElementById("tourModalTitle").textContent = id ? "🎡 투어 수정" : "🎡 투어 추가";
  document.getElementById("tm_name").value     = t?.name     || "";
  document.getElementById("tm_platform").value = t?.platform || "KKday";
  document.getElementById("tm_cat").value      = t?.cat      || "관광";
  document.getElementById("tm_price").value    = t?.price    || "";
  document.getElementById("tm_dur").value      = t?.dur      || "";
  document.getElementById("tm_desc").value     = t?.desc     || "";
  document.getElementById("tm_link").value     = t?.link     || "";
  document.getElementById("tm_memo").value     = t?.memo     || "";
  document.getElementById("tourModal").classList.add("active");
}
function closeTourModal() { document.getElementById("tourModal").classList.remove("active"); }

function saveTour() {
  const name = document.getElementById("tm_name").value.trim();
  if (!name) { alert("투어명을 입력해 주세요."); return; }
  const existingId = document.getElementById("tourEditId").value;
  const existing   = planData.tours?.find(x => x.id === existingId);
  const entry = {
    id:       existingId || String(Date.now()),
    name,
    platform: document.getElementById("tm_platform").value,
    cat:      document.getElementById("tm_cat").value,
    price:    parseInt(document.getElementById("tm_price").value) || 0,
    dur:      document.getElementById("tm_dur").value.trim(),
    desc:     document.getElementById("tm_desc").value.trim(),
    link:     document.getElementById("tm_link").value.trim(),
    memo:     document.getElementById("tm_memo").value.trim(),
    selected: existing?.selected || false
  };
  if (!planData.tours) planData.tours = [];
  const idx = planData.tours.findIndex(x => x.id === entry.id);
  if (idx >= 0) planData.tours[idx] = entry;
  else planData.tours.push(entry);
  closeTourModal();
  renderTours();
  scheduleSave();
}

function selectTour(id) {
  planData.tours.forEach(t => { t.selected = (t.id === id) ? !t.selected : false; });
  renderTours();
  scheduleSave();
}

function deleteTour(id) {
  if (!confirm("이 투어를 삭제할까요?")) return;
  planData.tours = planData.tours.filter(x => x.id !== id);
  renderTours();
  scheduleSave();
}

function filterTours(cat, btn) {
  tourFilter = cat;
  document.querySelectorAll("#tourFilterBar .filter-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderTours();
}

function renderTours() {
  if (!planData) return;
  const emptyEl = document.getElementById("tourEmptyState");
  const gridEl  = document.getElementById("tourGrid");
  if (!emptyEl || !gridEl) return;
  let list = [...(planData.tours || [])];
  if (tourFilter !== "all") list = list.filter(t => t.cat === tourFilter);

  if (!planData.tours?.length) {
    emptyEl.style.display = "flex";
    gridEl.innerHTML = "";
    return;
  }
  emptyEl.style.display = "none";

  gridEl.innerHTML = list.map(t => {
    const ps    = PLATFORM_STYLE[t.platform] || PLATFORM_STYLE["직접예약"];
    const icon  = CAT_ICON[t.cat] || "📦";
    const isSel = t.selected || false;
    const bookBtn = t.link
      ? `<a class="btn-link-sm agoda" href="${t.link}" target="_blank" style="text-decoration:none;">🔗 예약</a>`
      : "";
    return `
    <div class="glass-card hc-card ${isSel ? 'selected' : ''}">
      <div class="hc-card-top">
        <div class="hc-card-header">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:18px;">${icon}</span>
              <div class="hc-card-name" style="font-size:14px;">${t.name}</div>
            </div>
            <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
                         background:${ps.bg};border:1px solid ${ps.border};color:${ps.color};">${t.platform}</span>
          </div>
          <div class="hc-card-actions">
            <button class="btn-select ${isSel ? 'selected-active' : ''}" onclick="selectTour('${t.id}')">
              ${isSel ? '✅ 선택됨' : '☐ 선택'}
            </button>
            <button class="btn-action" onclick="openTourModal('${t.id}')" title="수정">✏️</button>
            <button class="btn-action del" onclick="deleteTour('${t.id}')" title="삭제">🗑</button>
          </div>
        </div>
        <div class="hc-card-price" style="margin-top:10px;">
          <div class="hc-price-num">${t.price ? fmtPrice(t.price) : "-"}</div>
          <div class="hc-price-unit">원 / 인</div>
        </div>
        <div style="display:flex;gap:12px;margin-top:8px;font-size:12px;color:var(--text-sub);font-weight:600;">
          ${t.dur ? `<span>⏱ ${t.dur}</span>` : ""}
        </div>
        ${t.desc ? `<div class="hc-card-desc" style="margin-top:8px;">${t.desc}</div>` : ""}
        ${t.memo ? `<div class="hc-card-memo">💬 ${t.memo}</div>` : ""}
      </div>
      ${bookBtn ? `<div class="hc-card-links">${bookBtn}</div>` : ""}
    </div>`;
  }).join("");
}

// ================================================================
//  EXCHANGE RATE (환율 연동)
// ================================================================
async function fetchExchangeRate() {
  try {
    const badge = document.getElementById("exchangeRateBadge");
    if (badge) badge.textContent = "💰 실시간 환율 로딩 중...";
    const res = await fetch("https://open.er-api.com/v6/latest/AUD");
    const data = await res.json();
    if (data && data.rates && data.rates.KRW) {
      exchangeRateAudToKrw = data.rates.KRW;
      if (badge) badge.textContent = `💰 실시간 환율: 1 AUD = ${exchangeRateAudToKrw.toFixed(2)} KRW`;
      renderExpenses(); // 환율 갱신 후 지출 금액 재계산
    }
  } catch (e) {
    console.error("Exchange rate fetch failed", e);
    const badge = document.getElementById("exchangeRateBadge");
    if (badge) badge.textContent = `💰 환율 고정 기준: 1 AUD = 900 KRW`;
  }
}

// ================================================================
//  EXPENSE — CRUD + Render
// ================================================================
function openExpenseModal(id = null) {
  const m = document.getElementById("expenseModal");
  if (!m) return;
  m.classList.add("active");
  
  if (id) {
    const ex = planData.expenses.find(e => e.id === id);
    if (!ex) return;
    document.getElementById("expenseModalTitle").textContent = "💸 지출 수정";
    document.getElementById("editExpenseId").value = ex.id;
    document.querySelector(`input[name="expenseTiming"][value="${ex.timing || 'pre'}"]`).checked = true;
    document.getElementById("expenseCategory").value = ex.category || "기타";
    document.getElementById("expenseTitle").value  = ex.title || "";
    document.getElementById("expenseAmount").value = ex.amount || "";
    document.getElementById("expenseMemo").value   = ex.memo || "";
  } else {
    document.getElementById("expenseModalTitle").textContent = "💸 지출 등록";
    document.getElementById("editExpenseId").value = "";
    document.querySelector('input[name="expenseTiming"][value="pre"]').checked = true;
    document.getElementById("expenseCategory").value = "식비";
    document.getElementById("expenseTitle").value  = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseMemo").value   = "";
  }
}

function closeExpenseModal() {
  document.getElementById("expenseModal").classList.remove("active");
}

function saveExpense() {
  const id    = document.getElementById("editExpenseId").value;
  const timing = document.querySelector('input[name="expenseTiming"]:checked').value;
  const cat   = document.getElementById("expenseCategory").value;
  const title = document.getElementById("expenseTitle").value.trim();
  const amt   = parseFloat(document.getElementById("expenseAmount").value);
  const memo  = document.getElementById("expenseMemo").value.trim();
  
  if (!title) return alert("지출 내역/품목을 입력하세요.");
  if (isNaN(amt) || amt <= 0) return alert("올바른 결제 금액을 입력하세요.");

  if (id) {
    const idx = planData.expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      planData.expenses[idx] = { ...planData.expenses[idx], timing: timing, category: cat, title: title, amount: amt, memo: memo };
    }
  } else {
    planData.expenses.push({ id: "ex_" + Date.now(), timing: timing, category: cat, title: title, amount: amt, memo: memo });
  }
  scheduleSave();
  closeExpenseModal();
  renderExpenses();
}

function deleteExpense(id) {
  if (!confirm("이 지출 내역을 삭제하시겠습니까?")) return;
  planData.expenses = planData.expenses.filter(e => e.id !== id);
  scheduleSave();
  renderExpenses();
}

function renderExpenses() {
  if (!planData || !planData.expenses) return;
  const emptyEl  = document.getElementById("expenseEmptyState");
  const wrapEl   = document.getElementById("expenseWrap");
  const preGrid  = document.getElementById("expensePreGrid");
  const tripGrid = document.getElementById("expenseTripGrid");
  const list = planData.expenses;
  
  // Update Summary
  let totalAud = list.reduce((acc, curr) => acc + curr.amount, 0);
  let totalPreKrw = list.filter(e => e.timing === "pre").reduce((acc, curr) => acc + curr.amount, 0) * exchangeRateAudToKrw;
  let totalTripKrw = list.filter(e => e.timing !== "pre").reduce((acc, curr) => acc + curr.amount, 0) * exchangeRateAudToKrw;
  
  document.getElementById("summaryTotalAud").textContent = `A$ ${fmtPrice(totalAud)}`;
  document.getElementById("summaryPreKrw").textContent = `₩ ${fmtPrice(totalPreKrw)}`;
  document.getElementById("summaryTripKrw").textContent = `₩ ${fmtPrice(totalTripKrw)}`;
  
  if (list.length === 0) {
    emptyEl.style.display = "flex";
    wrapEl.style.display  = "none";
    return;
  }
  
  emptyEl.style.display = "none";
  wrapEl.style.display  = "grid";
  wrapEl.style.gridTemplateColumns = "repeat(auto-fit, minmax(300px, 1fr))";
  wrapEl.style.gap = "24px";
  
  const CAT_EMOJI = { "항공/교통": "✈️", "숙박": "🏨", "식비": "🍔", "관광/투어": "🎡", "쇼핑": "🛍️", "기타": "📦" };
  
  function makeHtml(arr, priceColor) {
    if (arr.length === 0) return `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:13px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">내역이 없습니다.</div>`;
    return arr.map(e => {
      const krwEst = e.amount * exchangeRateAudToKrw;
      return `
      <div class="glass-card fc-row" id="ex-${e.id}">
        <div class="fc-header" style="align-items:center;">
          <div class="fc-header-left">
            <div class="fc-airline-name" style="font-size:16px;">${CAT_EMOJI[e.category] || "📦"} ${e.title}</div>
            ${e.memo ? `<div class="fc-airline-meta" style="color:var(--text-sub);margin-top:4px;">💬 ${e.memo}</div>` : ""}
          </div>
          <div class="fc-header-right" style="text-align:right;">
            <div class="fc-price" style="color:${priceColor};">A$ ${fmtPrice(e.amount)}</div>
            <div style="font-size:12px; color:var(--text-sub); margin-bottom:8px;">약 ₩ ${fmtPrice(krwEst)}</div>
            <div class="fc-actions" style="justify-content:flex-end;">
              <button class="btn-action" onclick="openExpenseModal('${e.id}')" title="수정">✏️</button>
              <button class="btn-action del" onclick="deleteExpense('${e.id}')" title="삭제">🗑</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  preGrid.innerHTML = makeHtml(list.filter(e => e.timing === "pre"), "#fbbf24");
  tripGrid.innerHTML = makeHtml(list.filter(e => e.timing !== "pre"), "#a78bfa");
}

