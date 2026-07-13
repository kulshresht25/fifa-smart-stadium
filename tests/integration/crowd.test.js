/**
 * Integration tests for crowd management logic
 *
 * Tests crowd data initialisation, density calculations, and the alert
 * threshold logic — all without a real browser or canvas API.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZONE_DATA, TOTAL_CAPACITY } from '../../src/data/constants.js';
import { densityColor, densityLabel, getDensityInfo, formatCapacity } from '../../utils/helpers.js';
import { clamp, randomDelta } from '../../utils/simulation.js';

// ─────────────────────────────────────────────────────────────────────────────
// Crowd data initialisation (mirrors CrowdComponent.initCrowdData)
// ─────────────────────────────────────────────────────────────────────────────
describe('Crowd data initialisation', () => {
  /**
   * Replicates the initCrowdData() logic from CrowdComponent so we can test
   * the seeding formula without loading the full component (which needs canvas).
   */
  function initCrowdData() {
    const crowdData = {};
    ZONE_DATA.forEach(zone => {
      crowdData[zone.id] = {
        ...zone,
        current: clamp(zone.base + randomDelta(-8, 8), 5, 100),
      };
    });
    return crowdData;
  }

  it('creates an entry for every zone in ZONE_DATA', () => {
    const data = initCrowdData();
    expect(Object.keys(data)).toHaveLength(ZONE_DATA.length);
    ZONE_DATA.forEach(zone => {
      expect(data[zone.id]).toBeDefined();
    });
  });

  it('all initial densities are in the range [5, 100]', () => {
    for (let i = 0; i < 20; i++) {
      const data = initCrowdData();
      Object.values(data).forEach(zone => {
        expect(zone.current).toBeGreaterThanOrEqual(5);
        expect(zone.current).toBeLessThanOrEqual(100);
      });
    }
  });

  it('preserves all original zone properties', () => {
    const data = initCrowdData();
    ZONE_DATA.forEach(zone => {
      const d = data[zone.id];
      expect(d.id).toBe(zone.id);
      expect(d.name).toBe(zone.name);
      expect(d.x).toBe(zone.x);
      expect(d.y).toBe(zone.y);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Alert threshold logic
// ─────────────────────────────────────────────────────────────────────────────
describe('Alert severity thresholds', () => {
  /**
   * Replicates the logic that determines which severity class an
   * alert should receive, based on crowd density.
   */
  function getAlertSeverity(density) {
    if (density >= 85) return 'critical';
    if (density >= 70) return 'high';
    if (density >= 40) return 'medium';
    return 'low';
  }

  it('classifies densities below 40% as low', () => {
    expect(getAlertSeverity(0)).toBe('low');
    expect(getAlertSeverity(39)).toBe('low');
  });

  it('classifies densities 40–69% as medium', () => {
    expect(getAlertSeverity(40)).toBe('medium');
    expect(getAlertSeverity(69)).toBe('medium');
  });

  it('classifies densities 70–84% as high', () => {
    expect(getAlertSeverity(70)).toBe('high');
    expect(getAlertSeverity(84)).toBe('high');
  });

  it('classifies densities ≥ 85% as critical', () => {
    expect(getAlertSeverity(85)).toBe('critical');
    expect(getAlertSeverity(100)).toBe('critical');
  });

  it('Gate 5 base density triggers a critical alert', () => {
    const gate5 = ZONE_DATA.find(z => z.id === 'gate5');
    expect(gate5).toBeDefined();
    expect(getAlertSeverity(gate5.base)).toBe('critical');
  });

  it('Gate 7 base density is not critical (low-medium traffic zone)', () => {
    const gate7 = ZONE_DATA.find(z => z.id === 'gate7');
    expect(gate7).toBeDefined();
    // Gate 7 base=40 sits at the boundary — medium severity at minimum
    expect(['low', 'medium']).toContain(getAlertSeverity(gate7.base));
    // Should never be high or critical
    expect(getAlertSeverity(gate7.base)).not.toBe('critical');
    expect(getAlertSeverity(gate7.base)).not.toBe('high');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Occupancy calculation workflow
// ─────────────────────────────────────────────────────────────────────────────
describe('Occupancy calculation workflow', () => {
  function calcOccupancy(crowdData) {
    const values = Object.values(crowdData);
    const avg = values.reduce((sum, z) => sum + z.current, 0) / values.length;
    return Math.round((avg / 100) * TOTAL_CAPACITY);
  }

  it('calculates 0 occupancy when all zones are at 0%', () => {
    const data = {};
    ZONE_DATA.forEach(z => { data[z.id] = { ...z, current: 0 }; });
    expect(calcOccupancy(data)).toBe(0);
  });

  it('calculates full capacity when all zones are at 100%', () => {
    const data = {};
    ZONE_DATA.forEach(z => { data[z.id] = { ...z, current: 100 }; });
    expect(calcOccupancy(data)).toBe(TOTAL_CAPACITY);
  });

  it('calculates ~50% capacity when all zones are at 50%', () => {
    const data = {};
    ZONE_DATA.forEach(z => { data[z.id] = { ...z, current: 50 }; });
    const occ = calcOccupancy(data);
    expect(occ).toBeCloseTo(TOTAL_CAPACITY * 0.5, -3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatCapacity integration
// ─────────────────────────────────────────────────────────────────────────────
describe('formatCapacity in crowd context', () => {
  it('renders 78% occupancy correctly', () => {
    const occ = 64350; // ~78% of 82,500
    const result = formatCapacity(occ, TOTAL_CAPACITY);
    expect(result).toContain('78%');
    expect(result).toContain('82,500');
  });

  it('renders 100% occupancy correctly', () => {
    const result = formatCapacity(TOTAL_CAPACITY, TOTAL_CAPACITY);
    expect(result).toBe('82,500 / 82,500 (100%)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap colour consistency
// ─────────────────────────────────────────────────────────────────────────────
describe('Heatmap colour consistency', () => {
  it('colour matches getDensityInfo for all sample densities', () => {
    [0, 30, 50, 75, 89, 100].forEach(pct => {
      const { color } = getDensityInfo(pct);
      expect(color).toBe(densityColor(pct));
    });
  });

  it('label matches getDensityInfo for all sample densities', () => {
    [0, 30, 50, 75, 89, 100].forEach(pct => {
      const { label } = getDensityInfo(pct);
      expect(label).toBe(densityLabel(pct));
    });
  });
});
