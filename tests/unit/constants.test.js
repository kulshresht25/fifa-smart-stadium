/**
 * Unit tests for src/data/constants.js
 *
 * Sanity-checks that all static data arrays are well-formed,
 * consistent, and free of obvious data-entry mistakes.
 */
import { describe, it, expect } from 'vitest';
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
} from '../../src/data/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// VENUES
// ─────────────────────────────────────────────────────────────────────────────
describe('VENUES', () => {
  it('has at least one entry', () => {
    expect(VENUES.length).toBeGreaterThan(0);
  });

  it.each(VENUES)('$name has required fields', venue => {
    expect(venue.name).toBeTruthy();
    expect(venue.city).toBeTruthy();
    expect(venue.country).toMatch(/^(USA|MEX|CAN)$/);
    expect(venue.cap).toBeGreaterThan(0);
  });

  it('MetLife Stadium has the correct capacity', () => {
    const metlife = VENUES.find(v => v.name === 'MetLife Stadium');
    expect(metlife).toBeDefined();
    expect(metlife.cap).toBe(TOTAL_CAPACITY);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MATCHES
// ─────────────────────────────────────────────────────────────────────────────
describe('MATCHES', () => {
  it('has at least one match', () => {
    expect(MATCHES.length).toBeGreaterThan(0);
  });

  it.each(MATCHES)('$home vs $away has required fields', match => {
    expect(match.home).toBeTruthy();
    expect(match.away).toBeTruthy();
    expect(match.venue).toBeTruthy();
    expect(match.date).toBeTruthy();
    expect(match.time).toMatch(/^\d{2}:\d{2}$/);
    expect(match.stage).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe('SECTIONS', () => {
  it('has 8 sections (A–H)', () => {
    expect(SECTIONS).toHaveLength(8);
  });

  it.each(SECTIONS)('Section $id has valid structure', section => {
    expect(['A','B','C','D','E','F','G','H']).toContain(section.id);
    expect(section.gate).toBeGreaterThanOrEqual(1);
    expect(section.gate).toBeLessThanOrEqual(8);
    expect(section.cap).toBeGreaterThan(0);
    expect(Array.isArray(section.services)).toBe(true);
    expect(section.services.length).toBeGreaterThan(0);
  });

  it('total section capacity is less than total stadium capacity', () => {
    const sectionTotal = SECTIONS.reduce((sum, s) => sum + s.cap, 0);
    expect(sectionTotal).toBeLessThanOrEqual(TOTAL_CAPACITY);
  });

  it('Section H is the accessible section', () => {
    const h = SECTIONS.find(s => s.id === 'H');
    expect(h.type).toBe('accessible');
    expect(h.services.some(svc => svc.toLowerCase().includes('wheelchair'))).toBe(true);
  });

  it('all gate numbers reference valid gate IDs', () => {
    const validGateIds = GATES.map(g => g.id);
    SECTIONS.forEach(s => {
      expect(validGateIds).toContain(s.gate);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GATES
// ─────────────────────────────────────────────────────────────────────────────
describe('GATES', () => {
  it('has 8 gates', () => {
    expect(GATES).toHaveLength(8);
  });

  it.each(GATES)('Gate $id has valid fields', gate => {
    expect(gate.id).toBeGreaterThanOrEqual(1);
    expect(gate.id).toBeLessThanOrEqual(8);
    expect(gate.name).toBeTruthy();
    expect(gate.wait).toBeGreaterThanOrEqual(0);
    expect(['short', 'medium', 'long', 'critical']).toContain(gate.queue);
    expect(Array.isArray(gate.services)).toBe(true);
  });

  it('Gate 5 is marked as critical (highest wait time in dataset)', () => {
    const gate5 = GATES.find(g => g.id === 5);
    expect(gate5.queue).toBe('critical');
    expect(gate5.wait).toBeGreaterThan(15);
  });

  it('all gate IDs are unique', () => {
    const ids = GATES.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ZONE_DATA
// ─────────────────────────────────────────────────────────────────────────────
describe('ZONE_DATA', () => {
  it('has at least one zone', () => {
    expect(ZONE_DATA.length).toBeGreaterThan(0);
  });

  it.each(ZONE_DATA)('Zone $id has valid coordinates', zone => {
    expect(zone.x).toBeGreaterThanOrEqual(0);
    expect(zone.x).toBeLessThanOrEqual(100);
    expect(zone.y).toBeGreaterThanOrEqual(0);
    expect(zone.y).toBeLessThanOrEqual(100);
    expect(zone.base).toBeGreaterThanOrEqual(0);
    expect(zone.base).toBeLessThanOrEqual(100);
    expect(zone.r).toBeGreaterThan(0);
  });

  it('all zone IDs are unique', () => {
    const ids = ZONE_DATA.map(z => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SHUTTLES
// ─────────────────────────────────────────────────────────────────────────────
describe('SHUTTLES', () => {
  it.each(SHUTTLES)('Shuttle $name is well-formed', shuttle => {
    expect(shuttle.freq).toBeGreaterThan(0);
    expect(shuttle.cap).toBeGreaterThan(0);
    expect(shuttle.occ).toBeGreaterThanOrEqual(0);
    expect(shuttle.occ).toBeLessThanOrEqual(shuttle.cap);
    expect(Array.isArray(shuttle.stops)).toBe(true);
    expect(shuttle.stops.length).toBeGreaterThanOrEqual(2);
    // First stop is always the stadium
    expect(shuttle.stops[0]).toContain('MetLife');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PARKING
// ─────────────────────────────────────────────────────────────────────────────
describe('PARKING', () => {
  it.each(PARKING)('Lot $name has valid data', lot => {
    expect(lot.total).toBeGreaterThan(0);
    expect(lot.avail).toBeGreaterThanOrEqual(0);
    expect(lot.avail).toBeLessThanOrEqual(lot.total);
    expect(lot.accessible).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ECO_TIPS & ECO_INITIATIVES
// ─────────────────────────────────────────────────────────────────────────────
describe('ECO_TIPS', () => {
  it('has at least 5 tips', () => {
    expect(ECO_TIPS.length).toBeGreaterThanOrEqual(5);
  });

  it('all tips are non-empty strings', () => {
    ECO_TIPS.forEach(tip => {
      expect(typeof tip).toBe('string');
      expect(tip.length).toBeGreaterThan(0);
    });
  });
});

describe('ECO_INITIATIVES', () => {
  it.each(ECO_INITIATIVES)('Initiative $title has valid progress', init => {
    expect(init.prog).toBeGreaterThanOrEqual(0);
    expect(init.prog).toBeLessThanOrEqual(100);
    expect(init.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA_SUGGESTIONS & PERSONA_PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
describe('PERSONA_SUGGESTIONS', () => {
  const personas = ['fan', 'organizer', 'volunteer', 'staff'];

  it.each(personas)('"%s" persona has at least 4 suggestions', persona => {
    expect(PERSONA_SUGGESTIONS[persona].length).toBeGreaterThanOrEqual(4);
  });

  it('all suggestions are non-empty strings', () => {
    Object.values(PERSONA_SUGGESTIONS).flat().forEach(s => {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
    });
  });
});

describe('PERSONA_PROMPTS', () => {
  const personas = ['fan', 'organizer', 'volunteer', 'staff'];

  it.each(personas)('"%s" persona has a non-empty prompt', persona => {
    expect(typeof PERSONA_PROMPTS[persona]).toBe('string');
    expect(PERSONA_PROMPTS[persona].length).toBeGreaterThan(50);
  });
});
