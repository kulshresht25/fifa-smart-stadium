/**
 * StadiumIQ — Application Bootstrap
 *
 * This module is the entry point for the app when loaded via
 * `<script type="module" src="src/main.js">` from index.html.
 *
 * It replaces the large inline <script> block that was previously
 * embedded at the bottom of index.html. All data constants are
 * imported from the single-source-of-truth module, and utility
 * functions are imported from utils/.
 *
 * Architecture:
 *   index.html (HTML + CSS)
 *     └── src/main.js (app bootstrap + event wiring)
 *           ├── src/data/constants.js (all static data)
 *           └── utils/helpers.js (pure utilities)
 *
 * @module src/main
 */

import {
  TOTAL_CAPACITY,
  VENUES,
  MATCHES,
  SECTIONS,
  GATES,
  ZONE_DATA,
  SHUTTLES,
  METRO,
  PARKING,
  ECO_TIPS,
  ECO_INITIATIVES,
  ACC_FEATURES,
  ACC_ROUTES,
  PERSONA_SUGGESTIONS,
  PERSONA_PROMPTS,
} from './data/constants.js';

import {
  sanitizeHTML,
  parseMarkdown,
  formatNumber,
  densityColor,
  densityLabel,
  showToast,
  speak,
  storage,
} from '../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// Global Application State
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centralised mutable state for the running application.
 * Avoids scattered global variables; pass references where needed.
 */
const state = {
  page: 'dashboard',
  persona: 'fan',
  lang: 'en',
  apiKey: '',
  voiceEnabled: false,
  fontSize: 16,
  highContrast: false,
  isTyping: false,
  crowdData: {},
  // Interval handles (for cleanup on navigation)
  crowdInterval: null,
  transInterval: null,
  ecoInterval: null,
  tipInterval: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper shorthands (local aliases)
// ─────────────────────────────────────────────────────────────────────────────
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const fmt = n => new Intl.NumberFormat('en-US').format(n);
const getTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const getMsgTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const sanitize = sanitizeHTML;

// Storage helpers (session = API key only, local = preferences)
const storeGet = (k, def = null) => storage.get(k, def);
const storeSet = (k, v) => storage.set(k, v);
const sessionGet = (k, def = null) => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const sessionSet = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

// ─────────────────────────────────────────────────────────────────────────────
// Clock
// ─────────────────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('htime');
  if (el) el.textContent = getTime();
}
setInterval(updateClock, 1000);
updateClock();

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Switches the visible page section and updates nav/breadcrumb state.
 * Each page is initialised lazily on first visit to avoid unnecessary work.
 *
 * @param {string} page - Page key (e.g. 'chat', 'crowd', 'navigation')
 */
function navigateTo(page) {
  if (state.page === page) return;
  state.page = page;

  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });

  const section = document.getElementById('page-' + page);
  if (section) section.classList.add('active');

  const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navBtn) { navBtn.classList.add('active'); navBtn.setAttribute('aria-current', 'page'); }

  const names = {
    dashboard: 'Dashboard', chat: 'AI Assistant', crowd: 'Crowd Mgmt',
    navigation: 'Navigation', transport: 'Transport',
    accessibility: 'Accessibility', sustainability: 'Eco Tracker',
  };
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.textContent = names[page] || page;

  closeMobileSidebar();

  // Lazy init on first visit
  if (!window['_init_' + page]) { window['_init_' + page] = true; initPage(page); }
}

/**
 * Dispatches to the correct init function for the first page visit.
 * @param {string} page - Page key
 */
function initPage(page) {
  if (page === 'crowd') initCrowd();
  if (page === 'navigation') initNavigation();
  if (page === 'transport') initTransport();
  if (page === 'accessibility') initAccessibility();
  if (page === 'sustainability') initSustainability();
  if (page === 'chat') initChat();
}

// ─────────────────────────────────────────────────────────────────────────────
// Persona switching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Switches the active AI persona, updates button states, and refreshes chat.
 * @param {string} persona - One of 'fan'|'organizer'|'volunteer'|'staff'
 */
function switchPersona(persona) {
  state.persona = persona;
  document.querySelectorAll('.persona-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  const btn = document.querySelector(`.persona-btn[data-persona="${persona}"]`);
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }

  const modes = { fan: '⚽ Fan Mode', organizer: '📋 Organizer Mode', volunteer: '🙋 Volunteer Mode', staff: '🔧 Staff Mode' };
  const statusEl = document.getElementById('chat-status');
  if (statusEl) statusEl.textContent = `● Online — ${modes[persona]}`;

  renderSuggestions();
  clearChat();
  storeSet('sq_persona', persona);
  showToast(`Switched to ${persona.charAt(0).toUpperCase() + persona.slice(1)} mode`, 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

function loadSettings() {
  // One-time migration: move any previously-stored API key out of localStorage
  const legacyKey = storeGet('sq_apikey', '');
  if (legacyKey) { sessionSet('sq_apikey', legacyKey); storeSet('sq_apikey', ''); }
  state.apiKey = sessionGet('sq_apikey', '');
  state.lang = storeGet('sq_lang', 'en');
  state.persona = storeGet('sq_persona', 'fan');
  state.voiceEnabled = storeGet('sq_speak', false);
  state.fontSize = storeGet('sq_fontsize', 16);
  state.highContrast = storeGet('sq_contrast', false);

  const apiInp = document.getElementById('api-key-inp');
  if (apiInp && state.apiKey) apiInp.value = state.apiKey;
  const setLang = document.getElementById('set-lang');
  if (setLang) setLang.value = state.lang;
  const setPersona = document.getElementById('set-persona');
  if (setPersona) setPersona.value = state.persona;
  const setSpeak = document.getElementById('set-speak');
  if (setSpeak) setSpeak.checked = state.voiceEnabled;
  const langSel = document.getElementById('lang-sel');
  if (langSel) langSel.value = state.lang;

  document.querySelectorAll('.persona-btn').forEach(b => b.classList.remove('active'));
  const pb = document.querySelector(`.persona-btn[data-persona="${state.persona}"]`);
  if (pb) pb.classList.add('active');

  if (state.highContrast) document.body.classList.add('high-contrast');
  if (state.fontSize !== 16) document.documentElement.style.fontSize = state.fontSize + 'px';
}

function saveSettings() {
  const key = document.getElementById('api-key-inp')?.value.trim();
  const lang = document.getElementById('set-lang')?.value;
  const persona = document.getElementById('set-persona')?.value;
  const voiceEnabled = document.getElementById('set-speak')?.checked;

  if (key) {
    if (!key.startsWith('AIzaSy') && !key.startsWith('AQ.')) {
      showToast('⚠️ Warning: Gemini API keys usually start with "AIzaSy" or "AQ.".', 'warning', 6000);
    }
    sessionSet('sq_apikey', key); state.apiKey = key;
    showToast('✅ API key saved! Full AI mode enabled.', 'success');
  } else {
    sessionSet('sq_apikey', ''); state.apiKey = '';
    showToast('Demo mode (no API key)', 'info');
  }

  storeSet('sq_lang', lang); state.lang = lang;
  storeSet('sq_speak', voiceEnabled); state.voiceEnabled = voiceEnabled;
  const langSel = document.getElementById('lang-sel');
  if (langSel) langSel.value = lang;
  switchPersona(persona);
  closeSettings();
}

let _lastFocusBeforeSettings = null;

function openSettings() {
  _lastFocusBeforeSettings = document.activeElement;
  const overlay = document.getElementById('settings-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.querySelector('input, select, button')?.focus();
  overlay.addEventListener('keydown', trapSettingsFocus);
}

function closeSettings() {
  const overlay = document.getElementById('settings-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.removeEventListener('keydown', trapSettingsFocus);
  _lastFocusBeforeSettings?.focus();
}

/**
 * Traps keyboard focus within the settings modal for accessibility.
 * Implements the ARIA modal focus-trap pattern (Tab/Shift+Tab cycling).
 * @param {KeyboardEvent} e
 */
function trapSettingsFocus(e) {
  if (e.key === 'Escape') { closeSettings(); return; }
  if (e.key !== 'Tab') return;
  const overlay = document.getElementById('settings-overlay');
  const focusables = overlay.querySelectorAll('input, select, button, [href]');
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
  document.getElementById('ham-btn')?.setAttribute('aria-expanded', 'false');
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini rate limiter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple client-side token-bucket rate limiter.
 * Allows max 10 Gemini API calls per 60-second window to protect
 * the user's API quota from accidental runaway loops.
 */
let _geminiCallsInWindow = 0, _geminiWindowStart = Date.now();
function geminiRateLimitOk() {
  const now = Date.now();
  if (now - _geminiWindowStart > 60000) { _geminiCallsInWindow = 0; _geminiWindowStart = now; }
  if (_geminiCallsInWindow >= 10) return false;
  _geminiCallsInWindow++;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────────────────────

function initChat() {
  renderSuggestions();
  addChatMessage('assistant', getWelcomeMsg());
}

function getWelcomeMsg() {
  const msgs = {
    fan: '👋 Welcome to **StadiumIQ**! I\'m your AI-powered companion for FIFA World Cup 2026.\n\nI can help you with:\n- 🗺️ Stadium navigation & seat finding\n- 🍔 Food, beverages & services\n- 🚌 Transportation & parking\n- ♿ Accessibility support\n- 🌐 Multilingual assistance\n- ⚽ Match info & schedules',
    organizer: '📋 **StadiumIQ Ops Console** ready.\n\nOperational intelligence active for:\n- 👥 Real-time crowd analytics\n- 🚨 Security & emergency alerts\n- 📊 Capacity optimization\n- 🔄 Staff coordination\n\nWhat operational data do you need?',
    volunteer: '🙋 **Hello Volunteer!** StadiumIQ here to support you.\n\nI can assist with:\n- 📍 Station assignments & navigation\n- 🌐 Multilingual fan assistance\n- 🏥 Emergency & first aid protocols\n- 📋 Shift responsibilities',
    staff: '🔧 **StadiumIQ Facility Management** online.\n\nAvailable for:\n- 🏗️ Maintenance request routing\n- 💡 Utility monitoring\n- 🚪 Access control\n- 📦 Vendor coordination',
  };
  return msgs[state.persona] || msgs.fan;
}

function renderSuggestions() {
  const bar = document.getElementById('sugg-bar');
  if (!bar) return;
  bar.innerHTML = (PERSONA_SUGGESTIONS[state.persona] || [])
    .map(s => `<button class="sugg-chip" onclick="handleSuggestion(this)">${sanitize(s)}</button>`)
    .join('');
}

window.handleSuggestion = function (btn) {
  const txt = btn.textContent;
  const inp = document.getElementById('chat-inp');
  if (inp) { inp.value = txt; sendMessage(); }
  document.getElementById('sugg-bar').style.display = 'none';
};

function addChatMessage(role, text, isFallback = false) {
  const msgs = document.getElementById('chat-msgs');
  if (!msgs) return;
  const id = 'msg_' + Date.now();
  const time = getMsgTime();
  const isUser = role === 'user';
  const div = document.createElement('div');
  div.className = 'chat-msg ' + (isUser ? 'user-msg' : 'ai-msg');
  div.id = id;
  div.dataset.rawText = text;
  const formatted = isUser ? sanitize(text) : parseMarkdown(sanitize(text));
  div.innerHTML = `<div class="msg-bubble ${isUser ? 'user-bubble' : ''}">
    ${!isUser ? '<span class="ai-ic">🤖</span>' : ''}
    <div class="msg-content">
      <div class="msg-txt">${formatted}</div>
      <div class="msg-foot">
        <span class="msg-time">${time}</span>
        ${isFallback && !isUser ? '<span class="fallback-badge">Demo Mode</span>' : ''}
        ${!isUser ? `<div class="msg-actions"><button class="msg-act-btn" onclick="copyMsg('${id}')">📋</button><button class="msg-act-btn" onclick="speakMsg('${id}')">🔊</button></div>` : ''}
      </div>
    </div>
    ${isUser ? '<span class="usr-ic">👤</span>' : ''}
  </div>`;
  msgs.appendChild(div);
  setTimeout(() => div.classList.add('appear'), 50);
  msgs.scrollTop = msgs.scrollHeight;
}

window.copyMsg = function (id) {
  const el = document.getElementById(id);
  if (el) { navigator.clipboard?.writeText(el.dataset.rawText || ''); showToast('Copied!', 'success'); }
};
window.speakMsg = function (id) {
  const el = document.getElementById(id);
  if (el) speak(el.dataset.rawText || '');
};

function setTyping(show) {
  const t = document.getElementById('typing-ind');
  if (t) t.style.display = show ? 'flex' : 'none';
  if (show) { const m = document.getElementById('chat-msgs'); if (m) m.scrollTop = m.scrollHeight; }
}

async function sendMessage() {
  if (state.isTyping) return;
  const inp = document.getElementById('chat-inp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  inp.value = ''; inp.style.height = 'auto';
  addChatMessage('user', text);
  setTyping(true); state.isTyping = true;
  try {
    const resp = await callGemini(text);
    setTyping(false); state.isTyping = false;
    addChatMessage('assistant', resp.text, resp.isFallback);
    if (state.voiceEnabled) speak(resp.text);
  } catch {
    setTyping(false); state.isTyping = false;
    addChatMessage('assistant', '⚠️ Sorry, I encountered an error. Please try again.', true);
  }
}

/**
 * Calls the Gemini API with the user's message, applying persona/language context.
 * Returns a fallback response when the API key is absent, rate-limited, or invalid.
 *
 * @param {string} userMsg - The user's text message
 * @returns {Promise<{text: string, isFallback: boolean}>}
 */
async function callGemini(userMsg) {
  if (!state.apiKey) return { text: getFallback(userMsg), isFallback: true };

  if (!geminiRateLimitOk()) {
    return { text: '⚠️ **Rate limit reached.** Please wait a moment.\n\n---\n\n' + getFallback(userMsg), isFallback: true };
  }
  if (!state.apiKey.startsWith('AIzaSy') && !state.apiKey.startsWith('AQ.')) {
    return { text: `⚠️ **API Key Error**: Keys must start with \`AIzaSy\` or \`AQ.\`\n\n---\n\n${getFallback(userMsg)}`, isFallback: true };
  }

  const langCtx = { en: 'Respond in English.', es: 'Responde en español.', fr: 'Réponds en français.', ar: 'أجب باللغة العربية.', pt: 'Responda em português.', de: 'Antworte auf Deutsch.', zh: '用中文回答.', ja: '日本語で答えてください.', hi: 'हिंदी में उत्तर दें.', ko: '한국어로 답하세요.' };
  const prompt = `${PERSONA_PROMPTS[state.persona] || PERSONA_PROMPTS.fan}\n\nLANGUAGE: ${langCtx[state.lang] || langCtx.en}\n\nSTADIUM CONTEXT:\n- Event: FIFA World Cup 2026\n- Stadium: MetLife Stadium (82,500 capacity, 78% occupied)\n- Current Time: ${new Date().toLocaleTimeString()}\n\nUSER QUERY: ${userMsg}\n\nProvide a helpful, accurate response. For navigation give specific gate/section directions. For emergencies direct to security (Gate 1, Section A) or first aid (Sections B, E, H). Keep responses concise but complete.`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 } }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'API error ' + r.status); }
    const d = await r.json();
    return { text: d.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.', isFallback: false };
  } catch (e) {
    console.error('Gemini error:', e);
    return { text: getFallback(userMsg) + '\n\n⚠️ _AI Error: ' + sanitize(e.message) + '_', isFallback: true };
  }
}

function getFallback(q) {
  const lq = q.toLowerCase();
  if (lq.includes('food') || lq.includes('eat') || lq.includes('hungry')) return '🍔 **Food & Beverages**: Concession stands at every gate entrance (Sections A, B, C, D). Premium dining at Section E Level 2. Vegetarian/vegan options at Section G. Average wait: ~8 min.';
  if (lq.includes('seat') || lq.includes('section') || lq.includes('find')) return '🗺️ **Navigation**: Use the Navigation tab for the interactive map! Gates open 2 hours before kickoff. Elevators available at Gates 1, 3, and 5.';
  if (lq.includes('bathroom') || lq.includes('restroom') || lq.includes('toilet')) return '🚻 **Restrooms**: Available at every section concourse. Accessible restrooms with family rooms at Gates 2, 4, 6. Current wait: Low (< 3 min).';
  if (lq.includes('transport') || lq.includes('bus') || lq.includes('train') || lq.includes('parking')) return '🚌 **Transportation**: Express shuttles every 15 min from main gates. Next bus: 6 min. Parking Lot A (North) has availability. Metro Line 3 direct to stadium.';
  if (lq.includes('emergency') || lq.includes('medical') || lq.includes('first aid')) return '🏥 **EMERGENCY**: First Aid at Sections B, E, H. Security Command: Gate 1 Section A. Stadium emergency: Ext. 911. Staff in red vests assist immediately.';
  if (lq.includes('crowd') || lq.includes('busy')) return '👥 **Crowd Status**: 78% occupancy (64,300/82,500). Hotspot: Gate 5 South (89% — use Gate 7 instead, only 2 min wait). North concourse less crowded.';
  if (lq.includes('accessibility') || lq.includes('wheelchair') || lq.includes('disabled')) return '♿ **Accessibility**: Wheelchair areas at Sections H. Companion seating available. Hearing loops in all premium areas. Guide dog relief at Gates 2 and 6.';
  if (lq.includes('schedule') || lq.includes('match') || lq.includes('game') || lq.includes('time')) return '⚽ **Match Schedule**: USA vs Mexico — Jun 11, 20:00 · Brazil vs Germany — Jun 12, 18:00 · France vs Argentina — Jun 13, 20:00. Gates open 2 hours before kickoff.';
  return '⚽ **StadiumIQ**: I\'m here to help with navigation, crowd updates, food, transport, and more! Enter your Gemini API key in ⚙️ Settings for full AI responses.';
}

function clearChat() {
  const m = document.getElementById('chat-msgs');
  if (m) m.innerHTML = '';
  const s = document.getElementById('sugg-bar');
  if (s) s.style.display = 'flex';
  renderSuggestions();
  setTimeout(() => addChatMessage('assistant', getWelcomeMsg()), 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function initDashboard() {
  const mc = document.getElementById('matches-container');
  if (mc) mc.innerHTML = MATCHES.map(m => `
    <div class="match-card">
      <div class="match-teams"><span class="t-name">${m.home}</span><span class="m-vs">vs</span><span class="t-name">${m.away}</span></div>
      <div class="match-meta"><div class="m-stage">${m.stage}</div><div class="m-venue">📍 ${m.venue}</div><div class="m-time">🗓️ ${m.date} · ${m.time}</div></div>
    </div>`).join('');

  const vg = document.getElementById('venues-grid');
  if (vg) vg.innerHTML = VENUES.slice(0, 4).map(v => `
    <div class="venue-card">
      <div class="v-country">${v.country}</div>
      <div class="v-name">${v.name}</div>
      <div class="v-city">📍 ${v.city}</div>
      <div class="v-cap">${(v.cap / 1000).toFixed(0)}K</div>
      <div class="v-cap-lbl">Capacity</div>
    </div>`).join('');

  const dc = document.getElementById('dash-crowd');
  if (dc) {
    const zones = [
      { name: 'Gate 5 (South)', p: 89, c: '#ef4444' }, { name: 'Main Pitch', p: 95, c: '#ef4444' },
      { name: 'Concessions', p: 74, c: '#f97316' }, { name: 'Gate 1 (North)', p: 65, c: '#f59e0b' },
      { name: 'Gate 7 (West)', p: 35, c: '#10b981' }, { name: 'VIP Level', p: 82, c: '#f97316' },
    ];
    dc.innerHTML = `<div style="display:flex;flex-direction:column;gap:7px">${zones.map(z =>
      `<div style="display:grid;grid-template-columns:120px 1fr 40px;align-items:center;gap:7px">
        <span style="font-size:11px;color:#94a3b8">${z.name}</span>
        <div style="height:5px;background:#1a2740;border-radius:3px;overflow:hidden"><div style="width:${z.p}%;height:100%;background:${z.c};border-radius:3px"></div></div>
        <span style="font-size:11px;font-weight:700;color:${z.c};text-align:right">${z.p}%</span>
      </div>`).join('')}</div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:#475569">Overall: <strong style="color:#f8fafc">78% (64,300)</strong></span>
        <button onclick="navigateTo('crowd')" style="background:#3b82f6;color:#fff;border:none;padding:5px 12px;border-radius:8px;font-size:11px;cursor:pointer;font-family:Inter,sans-serif">View Full Dashboard</button>
      </div>`;
  }

  setInterval(() => {
    if (document.hidden) return;
    const el = document.getElementById('kpi-fans');
    if (el) { const c = parseInt(el.textContent.replace(/,/g, '')); el.textContent = fmt(Math.min(TOTAL_CAPACITY, Math.max(50000, c + rnd(-200, 300)))); }
    const se = document.getElementById('kpi-shuttle');
    if (se) se.textContent = rnd(3, 15) + ' min';
  }, 5000);

  initDashboardAISummary();
}

async function fetchCrowdInsight() {
  if (Object.keys(state.crowdData).length === 0) {
    ZONE_DATA.forEach(z => { state.crowdData[z.id] = { ...z, current: Math.min(100, Math.max(5, z.base + rnd(-8, 8))) }; });
  }
  const avgD = Object.values(state.crowdData).reduce((a, z) => a + z.current, 0) / Object.keys(state.crowdData).length;
  const occ = Math.round((avgD / 100) * TOTAL_CAPACITY);
  const dp = Math.round((occ / TOTAL_CAPACITY) * 100);

  if (state.apiKey && geminiRateLimitOk()) {
    try {
      const prompt = `As an AI stadium operations analyst for FIFA World Cup 2026, analyze this real-time data and provide a brief 3-bullet operational summary with urgent alerts:\n\nOccupancy: ${fmt(occ)}/${fmt(TOTAL_CAPACITY)} (${dp}%)\nCritical zones: Gate 5 South at 89%, Pitch Level at 95%\nZones: ${Object.values(state.crowdData).map(z => z.name + ': ' + Math.round(z.current) + '%').join(', ')}\n\nFormat response as JSON: { "summary": "...", "alerts": ["...","..."], "recommendation": "...", "severity": "low|medium|high" }`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 512 } }),
      });
      if (r.ok) {
        const d = await r.json();
        const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jm = txt.match(/\{[\s\S]*\}/);
        if (jm) {
          const ins = JSON.parse(jm[0]);
          const sc = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
          const col = sc[ins.severity] || '#3b82f6';
          return {
            isFallback: false, html: `<div class="insight-result">
              <div class="insight-sev" style="background:${col}22;border-color:${col}">Severity: <strong>${sanitize((ins.severity || 'LOW').toUpperCase())}</strong></div>
              <div><h4>📊 Summary</h4><p>${sanitize(ins.summary || '')}</p></div>
              ${(ins.alerts || []).length ? `<div><h4>⚠️ Alerts</h4><ul>${ins.alerts.map(a => `<li>${sanitize(a)}</li>`).join('')}</ul></div>` : ''}
              ${ins.recommendation ? `<div><h4>💡 Recommendation</h4><p>${sanitize(ins.recommendation)}</p></div>` : ''}
            </div>`,
          };
        }
      }
    } catch (e) {
      console.warn('Crowd AI parse error:', e.message);
    }
  }

  return {
    isFallback: true, html: `<div class="insight-result">
      <div class="insight-sev" style="background:#f59e0b22;border-color:#f59e0b">Severity: <strong>MEDIUM</strong></div>
      <div><h4>📊 Summary</h4><p>Stadium at ${dp}% capacity. Gate 5 South experiencing above-normal traffic.</p></div>
      <div><h4>⚠️ Alerts</h4><ul><li>Gate 5 South at 89% — recommend opening additional entry lanes</li><li>Concession queues exceeding 12-minute threshold in Section D</li></ul></div>
      <div><h4>💡 Recommendation</h4><p>Deploy 4 additional crowd marshals to Gate 5. Activate secondary concession stations in Sections D and F.</p></div>
    </div>`,
  };
}

async function initDashboardAISummary() {
  const panel = document.getElementById('dash-ai-content');
  if (!panel) return;
  panel.innerHTML = '<div class="insight-loading"><div class="spinner"></div><span>Generating AI operational summary...</span></div>';
  const { html, isFallback } = await fetchCrowdInsight();
  panel.innerHTML = html + (isFallback ? '<div style="margin-top:8px;font-size:10px;color:#64748b">⚠️ Demo mode — add a Gemini API key in Settings for live AI analysis.</div>' : '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Crowd
// ─────────────────────────────────────────────────────────────────────────────

function initCrowd() {
  ZONE_DATA.forEach(z => { state.crowdData[z.id] = { ...z, current: Math.min(100, Math.max(5, z.base + rnd(-8, 8))) }; });
  const canvas = document.getElementById('heatmap-canvas');
  if (canvas) drawHeatmap(canvas);
  renderZones();
  state.crowdInterval = setInterval(() => {
    if (document.hidden) return;
    Object.keys(state.crowdData).forEach(id => {
      const z = state.crowdData[id];
      z.current = Math.min(100, Math.max(5, z.current + rnd(-5, 5) * 0.3));
    });
    const c = document.getElementById('heatmap-canvas');
    if (c) drawHeatmap(c);
    renderZones();
    const avgD = Object.values(state.crowdData).reduce((a, z) => a + z.current, 0) / Object.keys(state.crowdData).length;
    let occ = Math.round((avgD / 100) * TOTAL_CAPACITY) + rnd(-300, 300);
    occ = Math.min(TOTAL_CAPACITY, Math.max(50000, occ));
    const oe = document.getElementById('cr-occ'); if (oe) oe.textContent = fmt(occ);
    const dp = Math.round((occ / TOTAL_CAPACITY) * 100);
    const de = document.getElementById('cr-density'); if (de) { de.textContent = densityLabel(dp).toUpperCase(); de.style.color = densityColor(dp); }
    const dp2 = document.getElementById('cr-density-pct'); if (dp2) dp2.textContent = dp + '% average';
    const fe = document.getElementById('cr-flow'); if (fe) fe.textContent = '+' + fmt(rnd(800, 1600));
    const zu = document.getElementById('zones-upd'); if (zu) zu.textContent = 'Updated: ' + getMsgTime();
  }, 3000);
  document.getElementById('ai-analyze-btn')?.addEventListener('click', runCrowdAI);
  document.getElementById('close-insight')?.addEventListener('click', () => { document.getElementById('ai-insight-panel').style.display = 'none'; });
}

function drawHeatmap(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0f1a'; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.45, H * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = '#1a2535'; ctx.fill(); ctx.strokeStyle = '#2d4a6e'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.25, H * 0.25, 0, 0, Math.PI * 2); ctx.fillStyle = '#1a4a2a'; ctx.fill();
  ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.18, H * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - H * 0.25); ctx.lineTo(W / 2, H / 2 + H * 0.25); ctx.stroke();
  Object.values(state.crowdData).forEach(zone => {
    const x = (zone.x / 100) * W, y = (zone.y / 100) * H, r = (zone.r / 100) * Math.min(W, H) * 0.8;
    const intens = zone.current / 100;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const base = intens > 0.85 ? '239,68,68' : intens > 0.7 ? '249,115,22' : intens > 0.4 ? '245,158,11' : '16,185,129';
    grad.addColorStop(0, `rgba(${base},${intens * 0.85})`);
    grad.addColorStop(0.5, `rgba(${base},${intens * 0.35})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  });
  ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'center';
  ctx.fillText('N', W / 2, 14); ctx.fillText('S', W / 2, H - 4); ctx.fillText('E', W - 5, H / 2 + 4); ctx.fillText('W', 10, H / 2 + 4);
}

function renderZones() {
  const list = document.getElementById('zones-list');
  if (!list) return;
  list.innerHTML = Object.values(state.crowdData).slice(0, 8).map(z => {
    const c = densityColor(z.current), l = densityLabel(z.current);
    return `<div class="zone-item"><span class="zone-name">${z.name}</span><div class="zone-bar-wrap"><div class="zone-bar" style="width:${z.current}%;background:${c}"></div></div><div><div class="zone-pct" style="color:${c}">${Math.round(z.current)}%</div><div class="zone-lbl" style="color:${c}">${l}</div></div></div>`;
  }).join('');
}

async function runCrowdAI() {
  const panel = document.getElementById('ai-insight-panel');
  const content = document.getElementById('insight-content');
  if (!panel || !content) return;
  panel.style.display = 'block';
  content.innerHTML = '<div class="insight-loading"><div class="spinner"></div><span>Analyzing crowd patterns with AI...</span></div>';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const { html } = await fetchCrowdInsight();
  content.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation page
// ─────────────────────────────────────────────────────────────────────────────

function initNavigation() {
  renderStadiumMap();
  renderGates();
  document.getElementById('close-sec-detail')?.addEventListener('click', () => { document.getElementById('sec-detail').style.display = 'none'; });
  document.getElementById('close-dir')?.addEventListener('click', () => { document.getElementById('dir-panel').style.display = 'none'; });
  let scale = 1;
  document.getElementById('zoom-in')?.addEventListener('click', () => { scale = Math.min(scale + 0.2, 2.5); const s = document.querySelector('.stadium-svg'); if (s) s.style.transform = `scale(${scale})`; });
  document.getElementById('zoom-out')?.addEventListener('click', () => { scale = Math.max(scale - 0.2, 0.6); const s = document.querySelector('.stadium-svg'); if (s) s.style.transform = `scale(${scale})`; });
  document.getElementById('map-reset')?.addEventListener('click', () => { scale = 1; const s = document.querySelector('.stadium-svg'); if (s) s.style.transform = 'scale(1)'; });
  document.getElementById('nav-search')?.addEventListener('input', e => handleMapSearch(e.target.value));
  document.querySelectorAll('.svc-btn').forEach(btn => btn.addEventListener('click', () => { btn.classList.toggle('active'); showToast('Filtered: ' + btn.textContent, 'info'); }));
}

function renderStadiumMap() {
  const container = document.getElementById('stadium-map-svg');
  if (!container) return;
  const cx = 250, cy = 200, rx = 210, ry = 165, irx = 120, iry = 95;
  const sectionArcs = SECTIONS.map(sec => {
    const i = SECTIONS.indexOf(sec);
    const start = (i / SECTIONS.length) * 360 - 90;
    const end = start + (360 / SECTIONS.length);
    const d = rnd(40, 95);
    const col = densityColor(d);
    const path = describeArc(cx, cy, rx, ry, irx, iry, start + 1, end - 1);
    const lx = cx + (rx + irx) / 2 * 0.72 * Math.cos(((start + end) / 2) * Math.PI / 180);
    const ly = cy + (ry + iry) / 2 * 0.72 * Math.sin(((start + end) / 2) * Math.PI / 180);
    return `<path d="${path}" fill="${col}35" stroke="${col}70" stroke-width="1" data-section="${sec.id}" data-density="${d}" style="cursor:pointer" onclick="showSectionDetail('${sec.id}',${d})"/>
    <text x="${lx}" y="${ly + 4}" text-anchor="middle" fill="${col}" font-size="14" font-weight="bold" style="pointer-events:none">${sec.id}</text>`;
  }).join('');
  const gateCircles = GATES.map((gate, i) => {
    const a = (i / GATES.length) * 360;
    const x = cx + (rx + 15) * Math.cos((a - 90) * Math.PI / 180);
    const y = cy + (ry + 12) * Math.sin((a - 90) * Math.PI / 180);
    const col = gate.queue === 'critical' ? '#ef4444' : '#10b981';
    return `<g style="cursor:pointer" onclick="showGateDetail(${gate.id})">
      <circle cx="${x}" cy="${y}" r="10" fill="${col}22" stroke="${col}" stroke-width="1.5"/>
      <text x="${x}" y="${y + 4}" text-anchor="middle" fill="${col}" font-size="9" font-weight="bold">${gate.id}</text>
    </g>`;
  }).join('');
  container.innerHTML = `<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" class="stadium-svg" width="100%">
    <rect width="500" height="400" fill="#060d1a"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    ${sectionArcs}
    <ellipse cx="${cx}" cy="${cy}" rx="${irx}" ry="${iry}" fill="#0f1f2e" stroke="#1e40af" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="85" ry="68" fill="#1a4a2a" stroke="#22543d" stroke-width="1"/>
    ${gateCircles}
    <text x="${cx}" y="14" text-anchor="middle" fill="#475569" font-size="10">NORTH</text>
    <text x="${cx}" y="392" text-anchor="middle" fill="#475569" font-size="10">SOUTH</text>
  </svg>`;
}

function describeArc(cx, cy, rx, ry, irx, iry, startA, endA) {
  const p2c = (ccx, ccy, rrx, rry, a) => ({ x: ccx + rrx * Math.cos(a * Math.PI / 180), y: ccy + rry * Math.sin(a * Math.PI / 180) });
  const s = p2c(cx, cy, rx, ry, startA), e = p2c(cx, cy, rx, ry, endA);
  const is_ = p2c(cx, cy, irx, iry, endA), ie = p2c(cx, cy, irx, iry, startA);
  const la = endA - startA > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${rx} ${ry} 0 ${la} 1 ${e.x} ${e.y} L ${is_.x} ${is_.y} A ${irx} ${iry} 0 ${la} 0 ${ie.x} ${ie.y} Z`;
}

function renderGates() {
  const list = document.getElementById('gates-list');
  if (!list) return;
  const qc = { short: '#10b981', medium: '#f59e0b', long: '#f97316', critical: '#ef4444' };
  const qLabel = { short: 'Short wait', medium: 'Medium wait', long: 'Long wait', critical: 'Critical — avoid' };
  list.innerHTML = GATES.map(g => `<div class="gate-item" role="button" tabindex="0"
    onclick="showGateDetail(${g.id})"
    onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showGateDetail(${g.id});}"
    aria-label="${g.name}, ${qLabel[g.queue] || ''}, ${g.wait} minute wait">
    <span class="gate-dot" style="background:${g.queue === 'critical' ? '#ef4444' : '#10b981'}" aria-hidden="true"></span>
    <div><div class="gate-name">${g.name}</div><div style="font-size:9px;color:#475569">${g.services.join(' · ')}</div></div>
    <div style="text-align:right"><div class="wait-t" style="color:${qc[g.queue]}">${g.wait}m</div><div class="wait-l">wait</div></div>
  </div>`).join('');
}

window.showSectionDetail = function (secId, density) {
  const sec = SECTIONS.find(s => s.id === secId);
  if (!sec) return;
  const detail = document.getElementById('sec-detail');
  const content = document.getElementById('sec-detail-content');
  if (!detail || !content) return;
  const col = densityColor(density), lbl = densityLabel(density);
  content.innerHTML = `<div class="sec-hdr"><span class="sec-badge" style="background:${col}18;color:${col};border-color:${col}">Section ${sec.id}</span><span style="font-size:11px;font-weight:600;color:${col}">${lbl} (${density}%)</span></div>
  <div class="meta-grid">
    <div class="meta-item"><span class="meta-lbl">Gate</span><span class="meta-val">Gate ${sec.gate}</span></div>
    <div class="meta-item"><span class="meta-lbl">Level</span><span class="meta-val">${sec.level}</span></div>
    <div class="meta-item"><span class="meta-lbl">Type</span><span class="meta-val">${sec.type.charAt(0).toUpperCase() + sec.type.slice(1)}</span></div>
    <div class="meta-item"><span class="meta-lbl">Capacity</span><span class="meta-val">${fmt(sec.cap)}</span></div>
  </div>
  <div class="sec-svcs"><h4>Services</h4><ul>${sec.services.map(s => `<li>${s}</li>`).join('')}</ul></div>
  ${density >= 80 ? `<div class="alert-callout">⚠️ This section is busy. Consider entering via Gate ${sec.gate === 5 ? 7 : sec.gate + 1} for shorter queue.</div>` : ''}
  <button class="btn-navigate" onclick="showDirections('${sec.id}')">🧭 Get Directions</button>`;
  detail.style.display = 'block';
};

window.showGateDetail = function (gateId) {
  const gate = GATES.find(g => g.id === gateId);
  if (!gate) return;
  const detail = document.getElementById('sec-detail');
  const content = document.getElementById('sec-detail-content');
  if (!detail || !content) return;
  const qc = { short: '#10b981', medium: '#f59e0b', long: '#f97316', critical: '#ef4444' };
  const col = qc[gate.queue];
  content.innerHTML = `<div class="sec-hdr"><span class="sec-badge" style="background:${col}18;color:${col};border-color:${col}">Gate ${gate.id}</span><span style="font-size:11px;font-weight:600;color:${col}">~${gate.wait} min wait</span></div>
  <div class="sec-svcs"><h4>Services</h4><ul>${gate.services.map(s => `<li>${s}</li>`).join('')}</ul></div>
  ${gate.queue === 'critical' ? '<div class="alert-callout">⚠️ Gate 5 is extremely busy. Use <strong>Gate 7 (West)</strong> for faster entry — only 2 min wait!</div>' : ''}`;
  detail.style.display = 'block';
};

window.showDirections = function (secId) {
  const sec = SECTIONS.find(s => s.id === secId);
  if (!sec) return;
  const panel = document.getElementById('dir-panel');
  const content = document.getElementById('dir-content');
  if (!panel || !content) return;
  const dirs = { 1: 'North', 2: 'Northeast', 3: 'East', 4: 'Southeast', 5: 'South', 6: 'Southwest', 7: 'West', 8: 'Northwest' };
  const steps = [
    `Enter through <strong>Gate ${sec.gate}</strong> on the ${dirs[sec.gate]} side`,
    `Pass through security screening (Est. ${rnd(2, 8)} min wait)`,
    `Follow signs for <strong>${sec.level} Level</strong>`,
    `Find <strong>Section ${secId}</strong> — look for large section markers`,
  ];
  if (sec.level === 'Upper') steps.splice(2, 0, 'Take elevator or stairs to upper deck');
  content.innerHTML = `<div class="dir-steps">${steps.map((s, i) => `<div class="dir-step"><span class="step-num">${i + 1}</span>${s}</div>`).join('')}<div class="dir-step success">✅ You've arrived! Enjoy the match!</div></div>`;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

function handleMapSearch(q) {
  if (!q) return;
  const uq = q.toUpperCase().replace('SECTION', '').trim();
  const sec = SECTIONS.find(s => s.id === uq);
  if (sec) window.showSectionDetail(sec.id, rnd(40, 90));
}

// ─────────────────────────────────────────────────────────────────────────────
// Transport
// ─────────────────────────────────────────────────────────────────────────────

function initTransport() {
  renderShuttles();
  renderMetro();
  renderParking();
  state.transInterval = setInterval(() => {
    if (document.hidden) return;
    SHUTTLES.forEach(s => { s.nextIn = Math.max(1, s.nextIn - 1); if (s.nextIn <= 0) s.nextIn = s.freq; s.occ = Math.min(s.cap, Math.max(0, s.occ + rnd(-2, 3))); });
    METRO.forEach(m => { m.next = Math.max(1, m.next - 1); if (m.next <= 0) m.next = rnd(5, 20); });
    renderShuttles(); renderMetro();
    const re = document.getElementById('t-rideshare'); if (re) re.textContent = '~' + rnd(8, 18) + 'm';
    const ue = document.getElementById('uber-wait'); if (ue) ue.textContent = '~' + rnd(5, 15) + ' min';
    const le = document.getElementById('lyft-wait'); if (le) le.textContent = '~' + rnd(8, 20) + ' min';
  }, 5000);
  document.getElementById('refresh-park')?.addEventListener('click', () => { PARKING.forEach(p => { if (p.avail > 0) p.avail = Math.max(0, p.avail + rnd(-40, 20)); }); renderParking(); showToast('Parking refreshed', 'success'); });
  document.getElementById('plan-btn')?.addEventListener('click', planJourney);
}

function renderShuttles() {
  const list = document.getElementById('shuttle-list');
  if (!list) return;
  list.innerHTML = SHUTTLES.map(s => {
    const p = Math.round((s.occ / s.cap) * 100);
    const c = p >= 100 ? '#ef4444' : p >= 80 ? '#f59e0b' : '#10b981';
    const lbl = p >= 100 ? 'Full' : p >= 80 ? 'Nearly Full' : 'Available';
    const nc = s.nextIn <= 5 ? '#10b981' : s.nextIn <= 15 ? '#f59e0b' : '#64748b';
    return `<div class="shuttle-item">
      <div class="sh-icon" style="background:${s.color}22;color:${s.color}">${s.icon}</div>
      <div class="sh-info"><div class="sh-name">${s.name}</div><div class="sh-stops">${s.stops[0]} → ${s.stops[s.stops.length - 1]}</div><div class="sh-freq">Every ${s.freq} min</div></div>
      <div class="sh-status"><div class="sh-next"><span class="next-bus" style="color:${nc}">${s.nextIn}m</span><span class="next-bus-lbl">next</span></div><div class="cap-bar-wrap"><div class="cap-bar" style="width:${p}%;background:${c}"></div></div><span class="sh-cap-txt" style="color:${c}">${lbl} (${s.occ}/${s.cap})</span></div>
    </div>`;
  }).join('');
}

function renderMetro() {
  const list = document.getElementById('metro-list');
  if (!list) return;
  list.innerHTML = METRO.map(m => `<div class="metro-item">
    <div class="metro-ind" style="background:${m.color}"></div>
    <div class="metro-info"><div class="metro-nm">${m.name}</div><div class="metro-dir">${m.dir}</div><div class="metro-plat">${m.plat}</div></div>
    <div style="text-align:right"><span class="next-t" style="color:${m.color}">${m.next} min</span><span class="next-lbl">next</span></div>
  </div>`).join('');
}

function renderParking() {
  const grid = document.getElementById('parking-grid');
  if (!grid) return;
  grid.innerHTML = PARKING.map(p => {
    const pct = Math.round((p.avail / p.total) * 100);
    const c = p.avail === 0 ? '#ef4444' : pct < 20 ? '#f59e0b' : '#10b981';
    const lbl = p.avail === 0 ? 'FULL' : pct < 20 ? 'Almost Full' : 'Available';
    return `<div class="park-card"><div class="park-hdr"><div class="park-name">${p.name}</div><span class="park-status" style="background:${c}22;color:${c};border-color:${c}">${lbl}</span></div>
      <div class="park-info"><span class="park-avail" style="color:${c}">${formatNumber(p.avail)}</span><span class="park-avail-lbl">spaces</span></div>
      <div class="park-bar-wrap"><div class="park-bar" style="width:${pct}%;background:${c}"></div></div>
      <div class="park-meta"><span>🚶 ${p.dist}</span><span>💰 ${p.price}</span><span>♿ ${p.accessible} spots</span></div>
    </div>`;
  }).join('');
}

async function planJourney() {
  const from = document.getElementById('plan-from')?.value.trim();
  const mode = document.getElementById('plan-mode')?.value;
  const result = document.getElementById('plan-result');
  if (!from || !result) { showToast('Please enter your starting location', 'warning'); return; }
  result.innerHTML = '<div class="insight-loading"><div class="spinner"></div><span>Planning your journey...</span></div>';

  const routes = {
    transit: { steps: [`🚶 Travel to nearest transit hub from ${from}`, '🚆 Board NJ Transit Meadowlands Line', '⏱️ ~35 min journey to Meadowlands Station', '🚶 5-minute walk to MetLife Stadium Gate 1'], time: '45 min', cost: '$4.25', note: 'Most eco-friendly option ♻️' },
    shuttle: { steps: [`🚗 Travel to shuttle pickup at Penn Station from ${from}`, '🚌 Board MetLife Express Shuttle (every 15 min)', '⏱️ ~25 min direct ride to stadium', '🏟️ Drops at Gate 1 Main Entrance'], time: '35 min', cost: '$8.00', note: 'Pre-book recommended during peak hours' },
    drive: { steps: [`🚗 Navigate to NJ-3 East from ${from}`, '🛣️ Follow signs to MetLife Stadium / Meadowlands', '🅿️ Parking available in Lots A, B, C', '🚶 Walk from parking to stadium entrance'], time: '30-60 min', cost: '$40-120', note: '⚠️ Expect heavy traffic 2 hours before kickoff' },
    accessible: { steps: [`♿ Accessible transit available from ${from}`, '🚌 Accessible shuttle with ramp — every 20 min', '🏟️ Arrive at Gate 2 (fully accessible)', '♿ Stadium mobility assistance on request'], time: '40 min', cost: 'Free for mobility aid users', note: 'Book via accessibility hotline: +1 (555) FIFA-ADA' },
  };
  const r = routes[mode] || routes.transit;
  result.innerHTML = `<div class="journey-plan">
    <div class="j-summary"><span>⏱️ ${r.time}</span><span>💰 ${r.cost}</span></div>
    <ol class="j-steps">${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <div class="j-note">💡 ${r.note}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility
// ─────────────────────────────────────────────────────────────────────────────

function initAccessibility() {
  const feat = document.getElementById('acc-features');
  if (feat) feat.innerHTML = ACC_FEATURES.map(f => `<div class="acc-feat-card">
    <div class="feat-icon-wrap" style="background:${f.color}18"><span class="feat-icon">${f.icon}</span></div>
    <div>
      <div class="feat-title">${f.title}</div>
      <div class="feat-desc">${f.desc}</div>
      <div class="feat-locs">${f.locs.map(l => `<span class="loc-tag">${l}</span>`).join('')}</div>
    </div>
    <div class="feat-status"><span class="status-dot-available"></span><span class="status-txt">Available</span></div>
  </div>`).join('');

  const routes = document.getElementById('routes-grid');
  if (routes) routes.innerHTML = ACC_ROUTES.map((r, i) => `<div class="route-card">
    <div class="route-hdr"><div><div class="route-from">📍 ${r.from}</div><div class="route-to">🏟️ ${r.to}</div></div><span class="route-time">⏱️ ~${r.time}</span></div>
    <ol class="route-steps-list">${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <button class="btn-speak-route" onclick="speakRoute(${i})">🔊 Read Directions</button>
  </div>`).join('');

  document.getElementById('font-dec')?.addEventListener('click', () => { state.fontSize = Math.max(12, state.fontSize - 2); document.documentElement.style.fontSize = state.fontSize + 'px'; storeSet('sq_fontsize', state.fontSize); showToast('Font: ' + state.fontSize + 'px', 'info'); });
  document.getElementById('font-inc')?.addEventListener('click', () => { state.fontSize = Math.min(24, state.fontSize + 2); document.documentElement.style.fontSize = state.fontSize + 'px'; storeSet('sq_fontsize', state.fontSize); showToast('Font: ' + state.fontSize + 'px', 'info'); });
  document.getElementById('high-contrast-btn')?.addEventListener('click', () => { state.highContrast = !state.highContrast; document.body.classList.toggle('high-contrast', state.highContrast); document.getElementById('high-contrast-btn').classList.toggle('active', state.highContrast); storeSet('sq_contrast', state.highContrast); showToast(state.highContrast ? 'High contrast ON' : 'High contrast OFF', 'info'); });
  document.getElementById('read-aloud-btn')?.addEventListener('click', () => { speak(`StadiumIQ Accessibility. ${ACC_FEATURES.length} features active: ${ACC_FEATURES.map(f => f.title).join(', ')}.`); showToast('Reading accessibility info...', 'info'); });
  document.getElementById('keyboard-nav-btn')?.addEventListener('click', () => { showToast('Tab: Navigate | Enter: Activate | Esc: Close | Arrow keys: Scroll', 'info', 5000); });
  document.getElementById('reset-access-btn')?.addEventListener('click', () => { state.fontSize = 16; state.highContrast = false; document.documentElement.style.fontSize = '16px'; document.body.classList.remove('high-contrast'); document.getElementById('high-contrast-btn')?.classList.remove('active'); storeSet('sq_fontsize', 16); storeSet('sq_contrast', false); showToast('Settings reset', 'success'); });
  document.getElementById('btn-escort')?.addEventListener('click', () => showToast('Escort request sent! Staff will arrive in 5 minutes.', 'success', 5000));
  document.getElementById('btn-wheelchair')?.addEventListener('click', () => showToast('Wheelchair service requested! Wait at your current gate.', 'success', 5000));
  document.getElementById('btn-interpreter')?.addEventListener('click', () => showToast('Sign language interpreter requested! Available in 10 min.', 'success', 5000));
  document.getElementById('btn-emrg')?.addEventListener('click', () => showToast('🚨 Emergency assistance dispatched! Help is on the way.', 'error', 8000));
}

window.speakRoute = function (i) {
  const r = ACC_ROUTES[i];
  if (!r) return;
  speak(`Directions from ${r.from} to ${r.to}. Estimated time: ${r.time}. Steps: ${r.steps.join('. ')}`);
  showToast('Reading route directions...', 'info');
};

// ─────────────────────────────────────────────────────────────────────────────
// Sustainability
// ─────────────────────────────────────────────────────────────────────────────

let ecoData = { carbon: 142.5, plastic: 15200, trees: 284, renewable: 65, solarOut: 8.4, evChg: 42 };
let tipIdx = 0;

function initSustainability() {
  renderEcoInitiatives();
  drawEnergyDonut();
  renderTips();
  renderTipDots();
  document.getElementById('tip-prev')?.addEventListener('click', () => { tipIdx = (tipIdx - 1 + ECO_TIPS.length) % ECO_TIPS.length; updateTip(); });
  document.getElementById('tip-next')?.addEventListener('click', () => { tipIdx = (tipIdx + 1) % ECO_TIPS.length; updateTip(); });
  state.tipInterval = setInterval(() => { if (document.hidden) return; tipIdx = (tipIdx + 1) % ECO_TIPS.length; updateTip(); }, 6000);
  document.getElementById('pledge-btn')?.addEventListener('click', handlePledge);
  state.ecoInterval = setInterval(() => {
    if (document.hidden) return;
    ecoData.carbon = Math.round((ecoData.carbon + rnd(0, 3) * 0.1) * 10) / 10;
    ecoData.plastic += rnd(5, 20);
    ecoData.trees = Math.round(ecoData.carbon * 2);
    ecoData.solarOut = Math.round((ecoData.solarOut + rnd(-2, 3) * 0.05) * 10) / 10;
    ecoData.evChg = Math.min(42, Math.max(30, ecoData.evChg + rnd(-1, 2)));
    const ce = document.getElementById('eco-carbon'); if (ce) ce.textContent = ecoData.carbon;
    const pe = document.getElementById('eco-plastic'); if (pe) pe.textContent = fmt(ecoData.plastic);
    const te = document.getElementById('eco-trees'); if (te) te.textContent = ecoData.trees;
    const se = document.getElementById('solar-out'); if (se) se.textContent = ecoData.solarOut + ' MWh';
    const ee = document.getElementById('ev-chg'); if (ee) ee.textContent = ecoData.evChg;
  }, 4000);
}

function renderEcoInitiatives() {
  const grid = document.getElementById('eco-initiatives');
  if (!grid) return;
  grid.innerHTML = ECO_INITIATIVES.map(init => `<div class="eco-init-card">
    <div class="init-icon-wrap" style="background:${init.color}18"><span class="init-icon">${init.icon}</span></div>
    <div style="flex:1">
      <div class="init-title">${init.title}</div>
      <span class="init-val" style="color:${init.color}">${init.val}</span>
      <div class="init-desc">${init.desc}</div>
      <div class="init-prog-bar"><div class="init-prog-fill" style="width:${init.prog}%;background:${init.color}"></div></div>
      <div class="init-prog-txt">${init.prog}% of ${init.target}</div>
    </div>
  </div>`).join('');
}

function drawEnergyDonut() {
  const canvas = document.getElementById('energy-donut');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 90, cy = 90, r = 68, sw = 24;
  const segs = [{ p: 65, c: '#f59e0b' }, { p: 15, c: '#3b82f6' }, { p: 10, c: '#10b981' }, { p: 10, c: '#475569' }];
  ctx.clearRect(0, 0, 180, 180);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = sw; ctx.stroke();
  let curA = -Math.PI / 2;
  segs.forEach(seg => {
    const a = (seg.p / 100) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, curA, curA + a); ctx.strokeStyle = seg.c; ctx.lineWidth = sw; ctx.stroke();
    curA += a;
  });
  ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 20px Outfit,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('90%', cx, cy - 4);
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter,sans-serif';
  ctx.fillText('Renewable', cx, cy + 14);
}

function renderTips() { const el = document.getElementById('eco-tip'); if (el) el.textContent = ECO_TIPS[tipIdx]; }
function renderTipDots() {
  const dotsEl = document.getElementById('tip-dots');
  if (!dotsEl) return;
  dotsEl.innerHTML = ECO_TIPS.map((_, i) => `<span class="tip-dot ${i === tipIdx ? 'active' : ''}" onclick="setTip(${i})"></span>`).join('');
}
window.setTip = function (i) { tipIdx = i; updateTip(); };
function updateTip() {
  const el = document.getElementById('eco-tip');
  if (el) { el.style.opacity = '0'; setTimeout(() => { el.textContent = ECO_TIPS[tipIdx]; el.style.opacity = '1'; }, 200); }
  document.querySelectorAll('.tip-dot').forEach((d, i) => d.classList.toggle('active', i === tipIdx));
}

function handlePledge() {
  const pledges = ['transit', 'plastic', 'water', 'food'].filter(p => document.getElementById('pledge-' + p)?.checked);
  if (!pledges.length) { showToast('Select at least one pledge option', 'warning'); return; }
  const count = document.getElementById('pledge-count');
  if (count) { const c = parseInt(count.textContent.replace(/,/g, '')); count.textContent = fmt(c + 1); }
  const result = document.getElementById('pledge-result');
  if (result) {
    result.style.display = 'block';
    result.innerHTML = `<div class="pledge-success"><span class="pledge-success-icon">🎉</span><div><strong>Thank you for pledging!</strong><p>You committed to: ${pledges.join(', ')}. Together we make FIFA World Cup 2026 greener! 🌍</p></div></div>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice input (Mic)
// ─────────────────────────────────────────────────────────────────────────────

function handleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Voice input not supported in this browser', 'warning'); return; }
  const r = new SR(); r.interimResults = false;
  const btn = document.getElementById('mic-btn');
  if (btn) { btn.textContent = '🔴'; btn.classList.add('rec'); }
  r.onresult = e => {
    const t = e.results[0][0].transcript;
    const inp = document.getElementById('chat-inp');
    if (inp) inp.value = t;
    if (btn) { btn.textContent = '🎤'; btn.classList.remove('rec'); }
    sendMessage();
  };
  r.onerror = () => { if (btn) { btn.textContent = '🎤'; btn.classList.remove('rec'); } showToast('Voice error. Please try again.', 'error'); };
  r.start();
}

// ─────────────────────────────────────────────────────────────────────────────
// Event binding
// ─────────────────────────────────────────────────────────────────────────────

function bindAll() {
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.page)));
  document.querySelectorAll('.persona-btn[data-persona]').forEach(btn => btn.addEventListener('click', () => switchPersona(btn.dataset.persona)));
  document.getElementById('settings-btn')?.addEventListener('click', openSettings);
  document.getElementById('set-cancel')?.addEventListener('click', closeSettings);
  document.getElementById('set-save')?.addEventListener('click', saveSettings);
  document.getElementById('settings-overlay')?.addEventListener('click', e => { if (e.target === document.getElementById('settings-overlay')) closeSettings(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });
  document.getElementById('lang-sel')?.addEventListener('change', e => { state.lang = e.target.value; document.getElementById('set-lang').value = e.target.value; storeSet('sq_lang', e.target.value); showToast('Language: ' + e.target.value.toUpperCase(), 'info'); });
  document.getElementById('send-btn')?.addEventListener('click', sendMessage);
  document.getElementById('chat-inp')?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  document.getElementById('chat-inp')?.addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 100) + 'px'; const c = document.getElementById('char-ctr'); if (c) c.textContent = this.value.length + '/1000'; });
  document.getElementById('chat-clear')?.addEventListener('click', () => { clearChat(); showToast('Chat cleared', 'success'); });
  document.getElementById('chat-speak-toggle')?.addEventListener('click', () => { state.voiceEnabled = !state.voiceEnabled; storeSet('sq_speak', state.voiceEnabled); showToast(state.voiceEnabled ? 'Voice ON' : 'Voice OFF', 'info'); });
  document.getElementById('mic-btn')?.addEventListener('click', handleMic);
  document.getElementById('ham-btn')?.addEventListener('click', () => { const sb = document.getElementById('sidebar'); const isOpen = sb.classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); document.getElementById('ham-btn').setAttribute('aria-expanded', String(isOpen)); });
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);
}

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Application entry point. Called once DOM is ready.
 * Loads persisted settings, binds all event listeners, and initialises
 * the dashboard and chat pages (pre-loaded for faster perceived startup).
 */
function boot() {
  loadSettings();
  bindAll();
  initDashboard();
  initChat();
  window['_init_chat'] = true;
  window['_init_dashboard'] = true;
}

document.addEventListener('DOMContentLoaded', boot);

// Expose navigateTo globally for onclick handlers in HTML
window.navigateTo = navigateTo;
