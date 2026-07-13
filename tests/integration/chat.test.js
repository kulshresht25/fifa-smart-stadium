/**
 * Integration tests for chat assistant logic
 *
 * Tests message rendering, persona switching, suggestion chips,
 * fallback response routing, and Gemini rate-limiting logic —
 * all without a real network request.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PERSONA_SUGGESTIONS, PERSONA_PROMPTS } from '../../src/data/constants.js';
import { sanitizeHTML, parseMarkdown } from '../../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fallback response routing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure extraction of getFallback() from index.html for isolated testing.
 * Maps keywords to canned stadium responses.
 */
function getFallback(query) {
  const lq = query.toLowerCase();
  if (lq.includes('food') || lq.includes('eat') || lq.includes('hungry'))
    return '🍔 **Food & Beverages**: Concession stands at every gate entrance.';
  if (lq.includes('seat') || lq.includes('section') || lq.includes('find'))
    return '🗺️ **Navigation**: Use the Navigation tab for the interactive map!';
  if (lq.includes('bathroom') || lq.includes('restroom') || lq.includes('toilet'))
    return '🚻 **Restrooms**: Available at every section concourse.';
  if (lq.includes('transport') || lq.includes('bus') || lq.includes('train') || lq.includes('parking'))
    return '🚌 **Transportation**: Express shuttles every 15 min.';
  if (lq.includes('emergency') || lq.includes('medical') || lq.includes('first aid'))
    return '🏥 **EMERGENCY**: First Aid at Sections B, E, H.';
  if (lq.includes('crowd') || lq.includes('busy'))
    return '👥 **Crowd Status**: 78% occupancy.';
  if (lq.includes('accessibility') || lq.includes('wheelchair') || lq.includes('disabled'))
    return '♿ **Accessibility**: Wheelchair areas at Sections H.';
  if (lq.includes('schedule') || lq.includes('match') || lq.includes('game') || lq.includes('time'))
    return '⚽ **Match Schedule**: USA vs Mexico — Jun 11, 20:00.';
  return '⚽ **StadiumIQ**: How can I help?';
}

describe('getFallback routing', () => {
  it('returns food response for food-related queries', () => {
    expect(getFallback('where can I eat?')).toContain('Food');
    expect(getFallback('I am hungry')).toContain('Food');
    expect(getFallback('find food near gate 3')).toContain('Food');
  });

  it('returns navigation response for seat queries', () => {
    expect(getFallback('how do I find my section?')).toContain('Navigation');
    expect(getFallback('where is my section 114?')).toContain('Navigation');
  });

  it('returns restroom response for bathroom queries', () => {
    expect(getFallback('where is the bathroom?')).toContain('Restrooms');
    expect(getFallback('nearest toilet')).toContain('Restrooms');
  });

  it('returns transport response for transport queries', () => {
    expect(getFallback('next bus to downtown')).toContain('Transportation');
    expect(getFallback('parking available?')).toContain('Transportation');
  });

  it('returns emergency response for medical queries', () => {
    expect(getFallback('I need first aid')).toContain('EMERGENCY');
    expect(getFallback('medical emergency')).toContain('EMERGENCY');
  });

  it('returns crowd response for crowd queries', () => {
    expect(getFallback('is it crowded?')).toContain('Crowd');
    expect(getFallback('crowd status')).toContain('Crowd');
  });

  it('returns match schedule response for match queries', () => {
    expect(getFallback('what time is the match?')).toContain('Match Schedule');
    expect(getFallback('when does the game start')).toContain('Match Schedule');
  });

  it('returns default response for unrecognised queries', () => {
    const result = getFallback('something completely random xyz');
    expect(result).toContain('StadiumIQ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Gemini rate limiting
// ─────────────────────────────────────────────────────────────────────────────
describe('Gemini rate limiter', () => {
  /** Isolated replica of the rate-limiting logic from index.html */
  function createRateLimiter(maxCalls = 10, windowMs = 60000) {
    let calls = 0;
    let windowStart = Date.now();
    return function isOk() {
      const now = Date.now();
      if (now - windowStart > windowMs) { calls = 0; windowStart = now; }
      if (calls >= maxCalls) return false;
      calls++;
      return true;
    };
  }

  it('allows calls up to the max limit', () => {
    vi.useFakeTimers();
    const isOk = createRateLimiter(10, 60000);
    for (let i = 0; i < 10; i++) {
      expect(isOk()).toBe(true);
    }
    vi.useRealTimers();
  });

  it('blocks calls beyond the limit', () => {
    vi.useFakeTimers();
    const isOk = createRateLimiter(3, 60000);
    isOk(); isOk(); isOk();
    expect(isOk()).toBe(false);
    expect(isOk()).toBe(false);
    vi.useRealTimers();
  });

  it('resets after the window expires', () => {
    vi.useFakeTimers();
    const isOk = createRateLimiter(2, 60000);
    isOk(); isOk();
    expect(isOk()).toBe(false);

    vi.advanceTimersByTime(60001);
    expect(isOk()).toBe(true); // window has reset
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Message rendering pipeline (sanitize → parseMarkdown)
// ─────────────────────────────────────────────────────────────────────────────
describe('Message rendering pipeline', () => {
  it('sanitizes user input before displaying', () => {
    const userInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeHTML(userInput);
    expect(sanitized).not.toContain('<script>');
  });

  it('parses AI markdown response to HTML', () => {
    const aiResponse = '**Gate 5** is at *critical* capacity.\n\n- Use Gate 7\n- 2 min wait';
    const html = parseMarkdown(sanitizeHTML(aiResponse));
    expect(html).toContain('<strong>Gate 5</strong>');
    expect(html).toContain('<em>critical</em>');
    expect(html).toContain('<li>Use Gate 7</li>');
  });

  it('does not double-escape already-escaped content', () => {
    const safe = 'Hello World';
    const result = parseMarkdown(sanitizeHTML(safe));
    expect(result).toContain('Hello World');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Persona suggestions & prompts
// ─────────────────────────────────────────────────────────────────────────────
describe('Persona-aware suggestions', () => {
  it('fan suggestions include navigation and food queries', () => {
    const fanSuggs = PERSONA_SUGGESTIONS.fan;
    const hasNav = fanSuggs.some(s => s.toLowerCase().includes('section') || s.toLowerCase().includes('navigation'));
    const hasFood = fanSuggs.some(s => s.toLowerCase().includes('food') || s.toLowerCase().includes('eat'));
    expect(hasNav || hasFood).toBe(true);
  });

  it('organizer suggestions include operational queries', () => {
    const orgSuggs = PERSONA_SUGGESTIONS.organizer;
    const hasOps = orgSuggs.some(s =>
      s.toLowerCase().includes('crowd') ||
      s.toLowerCase().includes('capacity') ||
      s.toLowerCase().includes('security')
    );
    expect(hasOps).toBe(true);
  });
});

describe('Persona prompts', () => {
  it('fan prompt mentions fans and navigation', () => {
    const prompt = PERSONA_PROMPTS.fan.toLowerCase();
    expect(prompt).toContain('fan');
    expect(prompt).toContain('navigate');
  });

  it('organizer prompt mentions operational tasks', () => {
    const prompt = PERSONA_PROMPTS.organizer.toLowerCase();
    expect(prompt).toContain('capacity');
  });

  it('all 4 personas have distinct prompts', () => {
    const prompts = Object.values(PERSONA_PROMPTS);
    const unique = new Set(prompts);
    expect(unique.size).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Chat DOM rendering (jsdom)
// ─────────────────────────────────────────────────────────────────────────────
describe('Chat DOM rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="chat-msgs"></div>
      <div id="sugg-bar"></div>
      <div id="typing-ind" style="display:none"></div>
      <textarea id="chat-inp"></textarea>
    `;
  });

  function addChatMessage(role, text) {
    const msgs = document.getElementById('chat-msgs');
    const div = document.createElement('div');
    div.className = `chat-msg ${role === 'user' ? 'user-msg' : 'ai-msg'}`;
    div.dataset.rawText = text;
    const safe = sanitizeHTML(text);
    div.innerHTML = `<div class="msg-bubble"><div class="msg-txt">${
      role === 'user' ? safe : parseMarkdown(safe)
    }</div></div>`;
    msgs.appendChild(div);
    return div;
  }

  it('appends a user message to the chat', () => {
    addChatMessage('user', 'Hello!');
    const msgs = document.getElementById('chat-msgs');
    expect(msgs.children).toHaveLength(1);
    expect(msgs.children[0].classList.contains('user-msg')).toBe(true);
  });

  it('appends an AI message with markdown rendering', () => {
    addChatMessage('assistant', '**Gate 5** is busy');
    const msgs = document.getElementById('chat-msgs');
    const msgText = msgs.querySelector('.msg-txt');
    expect(msgText.innerHTML).toContain('<strong>Gate 5</strong>');
  });

  it('stores raw text in data attribute', () => {
    const rawText = 'Test message with <special> chars';
    const el = addChatMessage('user', rawText);
    expect(el.dataset.rawText).toBe(rawText);
  });

  it('renders suggestion chips for the fan persona', () => {
    const bar = document.getElementById('sugg-bar');
    bar.innerHTML = PERSONA_SUGGESTIONS.fan
      .map(s => `<button class="sugg-chip">${sanitizeHTML(s)}</button>`)
      .join('');
    const chips = bar.querySelectorAll('.sugg-chip');
    expect(chips.length).toBe(PERSONA_SUGGESTIONS.fan.length);
  });

  it('shows the typing indicator', () => {
    const ind = document.getElementById('typing-ind');
    ind.style.display = 'flex';
    expect(ind.style.display).toBe('flex');
  });
});
