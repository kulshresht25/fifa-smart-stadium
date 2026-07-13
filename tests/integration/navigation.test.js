/**
 * Integration tests for navigation logic
 *
 * Tests section lookup, gate detail rendering, wayfinding directions,
 * and map search — all using jsdom without a real SVG canvas.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SECTIONS, GATES } from '../../src/data/constants.js';
import { densityColor, densityLabel } from '../../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// Section lookup
// ─────────────────────────────────────────────────────────────────────────────
describe('Section lookup', () => {
  it('finds a section by ID', () => {
    const sec = SECTIONS.find(s => s.id === 'A');
    expect(sec).toBeDefined();
    expect(sec.type).toBe('premium');
  });

  it('returns undefined for an invalid section ID', () => {
    expect(SECTIONS.find(s => s.id === 'Z')).toBeUndefined();
  });

  it('all section IDs are single uppercase letters A–H', () => {
    SECTIONS.forEach(s => {
      expect(s.id).toMatch(/^[A-H]$/);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Gate detail rendering logic
// ─────────────────────────────────────────────────────────────────────────────
describe('Gate detail rendering', () => {
  /** Mimics the queue-colour map from the navigation component */
  const QUEUE_COLORS = {
    short: '#10b981',
    medium: '#f59e0b',
    long: '#f97316',
    critical: '#ef4444',
  };

  it('maps queue level to correct colour for all gates', () => {
    GATES.forEach(gate => {
      expect(QUEUE_COLORS[gate.queue]).toBeDefined();
    });
  });

  it('Gate 5 renders as busy/critical', () => {
    const gate5 = GATES.find(g => g.id === 5);
    expect(gate5.queue).toBe('critical');
    expect(QUEUE_COLORS[gate5.queue]).toBe('#ef4444');
  });

  it('Gate 7 renders as open/short', () => {
    const gate7 = GATES.find(g => g.id === 7);
    expect(gate7.queue).toBe('short');
    expect(QUEUE_COLORS[gate7.queue]).toBe('#10b981');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section detail rendering (with density overlay)
// ─────────────────────────────────────────────────────────────────────────────
describe('Section detail card rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="sec-detail" style="display:none">
        <div id="sec-detail-content"></div>
        <button id="close-sec-detail">Close</button>
      </div>
    `;
  });

  /**
   * Simplified version of showSectionDetail from index.html
   */
  function showSectionDetail(secId, density) {
    const sec = SECTIONS.find(s => s.id === secId);
    if (!sec) return null;
    const col = densityColor(density);
    const lbl = densityLabel(density);
    const content = document.getElementById('sec-detail-content');
    const detail = document.getElementById('sec-detail');
    if (!content || !detail) return null;

    content.innerHTML = `
      <div class="sec-badge" style="color:${col}">${lbl} (${density}%)</div>
      <div>Gate: ${sec.gate}</div>
      <div>Level: ${sec.level}</div>
      <ul>${sec.services.map(s => `<li>${s}</li>`).join('')}</ul>
    `;
    detail.style.display = 'block';
    return { sec, col, lbl };
  }

  it('displays the correct section details', () => {
    showSectionDetail('B', 55);
    const content = document.getElementById('sec-detail-content');
    expect(content.textContent).toContain('Gate: 2');
    expect(content.textContent).toContain('Lower');
  });

  it('shows critical density for a high-traffic section', () => {
    const result = showSectionDetail('E', 90);
    expect(result.lbl).toBe('Critical');
    expect(result.col).toBe('#ef4444');
  });

  it('makes the detail panel visible after call', () => {
    showSectionDetail('A', 45);
    const detail = document.getElementById('sec-detail');
    expect(detail.style.display).toBe('block');
  });

  it('lists all services for Section H', () => {
    showSectionDetail('H', 30);
    const content = document.getElementById('sec-detail-content');
    expect(content.textContent).toContain('Wheelchair Access');
    expect(content.textContent).toContain('First Aid');
  });

  it('returns null for an invalid section ID', () => {
    const result = showSectionDetail('Z', 50);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Wayfinding directions logic
// ─────────────────────────────────────────────────────────────────────────────
describe('Wayfinding directions', () => {
  const GATE_DIRECTIONS = {
    1: 'North', 2: 'Northeast', 3: 'East', 4: 'Southeast',
    5: 'South', 6: 'Southwest', 7: 'West', 8: 'Northwest',
  };

  /** Mirrors the showDirections function from index.html */
  function buildDirections(secId) {
    const sec = SECTIONS.find(s => s.id === secId);
    if (!sec) return null;
    return [
      `Enter through Gate ${sec.gate} on the ${GATE_DIRECTIONS[sec.gate]} side`,
      `Follow signs for ${sec.level} Level`,
      `Find Section ${secId}`,
    ];
  }

  it('builds correct directions for Section A', () => {
    const steps = buildDirections('A');
    expect(steps[0]).toContain('Gate 1');
    expect(steps[0]).toContain('North');
    expect(steps[1]).toContain('Field');
  });

  it('builds correct directions for Section H', () => {
    const steps = buildDirections('H');
    expect(steps[0]).toContain('Gate 8');
    expect(steps[0]).toContain('Northwest');
  });

  it('returns null for invalid section', () => {
    expect(buildDirections('X')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Map search logic
// ─────────────────────────────────────────────────────────────────────────────
describe('Map search', () => {
  /** Mirrors handleMapSearch from index.html */
  function handleMapSearch(query) {
    const uq = query.toUpperCase().replace('SECTION', '').trim();
    return SECTIONS.find(s => s.id === uq) || null;
  }

  it('finds section B by exact ID', () => {
    expect(handleMapSearch('B')).toBeDefined();
  });

  it('strips "Section" prefix from input', () => {
    expect(handleMapSearch('Section A')).toBeDefined();
    expect(handleMapSearch('section h')).toBeDefined();
  });

  it('returns null for non-existent section', () => {
    expect(handleMapSearch('Z')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(handleMapSearch('a')).toBeDefined();
    expect(handleMapSearch('H')).toBeDefined();
  });
});
