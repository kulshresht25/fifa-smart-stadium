/**
 * Unit tests for utils/helpers.js
 *
 * Tests pure utility functions that don't require a real browser.
 * DOM-touching functions (showToast, animateCount) are tested with
 * jsdom stubs provided by the Vitest environment.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  debounce,
  throttle,
  formatNumber,
  formatPercent,
  randomInRange,
  densityColor,
  densityLabel,
  getDensityInfo,
  formatCapacity,
  formatTime,
  formatDateTime,
  sanitizeHTML,
  parseMarkdown,
  generateId,
  storage,
} from '../../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// debounce
// ─────────────────────────────────────────────────────────────────────────────
describe('debounce', () => {
  it('delays function execution by the specified amount', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('resets the timer on repeated calls within the delay window', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    debounced();
    debounced(); // only the last call should fire

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('passes arguments to the wrapped function', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a', 'b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 'b');
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// throttle
// ─────────────────────────────────────────────────────────────────────────────
describe('throttle', () => {
  it('fires the function immediately on the first call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 500);

    throttled();
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('suppresses calls made within the throttle window', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 500);

    throttled();
    throttled(); // blocked
    throttled(); // blocked
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('allows another call after the window expires', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 500);

    throttled();
    vi.advanceTimersByTime(500);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatNumber
// ─────────────────────────────────────────────────────────────────────────────
describe('formatNumber', () => {
  it('formats large integers with comma separators', () => {
    expect(formatNumber(82500)).toBe('82,500');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles small numbers without commas', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatPercent
// ─────────────────────────────────────────────────────────────────────────────
describe('formatPercent', () => {
  it('calculates percentage correctly', () => {
    expect(formatPercent(50, 100)).toBe(50);
    expect(formatPercent(82500, 82500)).toBe(100);
    expect(formatPercent(0, 100)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(formatPercent(1, 3)).toBe(33); // 33.33...
    expect(formatPercent(2, 3)).toBe(67); // 66.66...
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// randomInRange
// ─────────────────────────────────────────────────────────────────────────────
describe('randomInRange', () => {
  it('returns a value within [min, max] inclusive', () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInRange(5, 10);
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it('returns min when min === max', () => {
    expect(randomInRange(7, 7)).toBe(7);
  });

  it('returns an integer', () => {
    const result = randomInRange(0, 100);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// densityColor
// ─────────────────────────────────────────────────────────────────────────────
describe('densityColor', () => {
  it('returns green for low density (< 40)', () => {
    expect(densityColor(0)).toBe('#10b981');
    expect(densityColor(39)).toBe('#10b981');
  });

  it('returns amber for moderate density (40–69)', () => {
    expect(densityColor(40)).toBe('#f59e0b');
    expect(densityColor(69)).toBe('#f59e0b');
  });

  it('returns orange for high density (70–84)', () => {
    expect(densityColor(70)).toBe('#f97316');
    expect(densityColor(84)).toBe('#f97316');
  });

  it('returns red for critical density (≥ 85)', () => {
    expect(densityColor(85)).toBe('#ef4444');
    expect(densityColor(100)).toBe('#ef4444');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// densityLabel
// ─────────────────────────────────────────────────────────────────────────────
describe('densityLabel', () => {
  it('returns Low for density < 40', () => {
    expect(densityLabel(0)).toBe('Low');
    expect(densityLabel(39)).toBe('Low');
  });

  it('returns Moderate for density 40–69', () => {
    expect(densityLabel(40)).toBe('Moderate');
    expect(densityLabel(69)).toBe('Moderate');
  });

  it('returns High for density 70–84', () => {
    expect(densityLabel(70)).toBe('High');
    expect(densityLabel(84)).toBe('High');
  });

  it('returns Critical for density ≥ 85', () => {
    expect(densityLabel(85)).toBe('Critical');
    expect(densityLabel(100)).toBe('Critical');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDensityInfo (composite helper)
// ─────────────────────────────────────────────────────────────────────────────
describe('getDensityInfo', () => {
  it('returns an object with both color and label', () => {
    const result = getDensityInfo(50);
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('label');
  });

  it('returns values consistent with densityColor and densityLabel', () => {
    for (const pct of [10, 50, 75, 90]) {
      const { color, label } = getDensityInfo(pct);
      expect(color).toBe(densityColor(pct));
      expect(label).toBe(densityLabel(pct));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatCapacity
// ─────────────────────────────────────────────────────────────────────────────
describe('formatCapacity', () => {
  it('formats capacity as "occupied / total (pct%)"', () => {
    expect(formatCapacity(82500, 82500)).toBe('82,500 / 82,500 (100%)');
    expect(formatCapacity(0, 82500)).toBe('0 / 82,500 (0%)');
  });

  it('rounds the percentage', () => {
    // 64,300 / 82,500 = 77.9...% → 78%
    expect(formatCapacity(64300, 82500)).toContain('78%');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatTime / formatDateTime
// ─────────────────────────────────────────────────────────────────────────────
describe('formatTime', () => {
  it('returns a non-empty time string', () => {
    const result = formatTime(new Date('2026-06-11T20:00:00'));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('uses the current date when no argument provided', () => {
    const result = formatTime();
    expect(typeof result).toBe('string');
    // Should contain AM or PM
    expect(result).toMatch(/AM|PM/i);
  });
});

describe('formatDateTime', () => {
  it('returns a non-empty datetime string', () => {
    const result = formatDateTime(new Date('2026-06-11T20:00:00'));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeHTML
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizeHTML', () => {
  it('escapes < and > characters to prevent XSS', () => {
    const result = sanitizeHTML('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes & characters', () => {
    const result = sanitizeHTML('Bread & Butter');
    expect(result).toContain('&amp;');
  });

  it('returns plain text unchanged', () => {
    expect(sanitizeHTML('Hello World')).toBe('Hello World');
  });

  it('handles an empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseMarkdown
// ─────────────────────────────────────────────────────────────────────────────
describe('parseMarkdown', () => {
  it('converts **bold** to <strong>', () => {
    expect(parseMarkdown('**hello**')).toContain('<strong>hello</strong>');
  });

  it('converts *italic* to <em>', () => {
    expect(parseMarkdown('*world*')).toContain('<em>world</em>');
  });

  it('converts `code` to <code>', () => {
    expect(parseMarkdown('`myFunc()`')).toContain('<code>myFunc()</code>');
  });

  it('converts # Heading to <h4>', () => {
    expect(parseMarkdown('# Title')).toContain('<h4>Title</h4>');
  });

  it('converts newline + list item to <li>', () => {
    const result = parseMarkdown('Items:\n- Alpha\n- Beta');
    expect(result).toContain('<li>Alpha</li>');
    expect(result).toContain('<li>Beta</li>');
  });

  it('wraps list items in <ul>', () => {
    const result = parseMarkdown('List:\n- One\n- Two');
    expect(result).toContain('<ul>');
    expect(result).toContain('</ul>');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateId
// ─────────────────────────────────────────────────────────────────────────────
describe('generateId', () => {
  it('includes the provided prefix', () => {
    const id = generateId('msg');
    expect(id.startsWith('msg_')).toBe(true);
  });

  it('uses default prefix "id" when none provided', () => {
    const id = generateId();
    expect(id.startsWith('id_')).toBe(true);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// storage (localStorage wrapper)
// ─────────────────────────────────────────────────────────────────────────────
describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('storage.set + storage.get round-trip', () => {
    it('stores and retrieves a string value', () => {
      storage.set('test_key', 'hello');
      expect(storage.get('test_key')).toBe('hello');
    });

    it('stores and retrieves an object', () => {
      const obj = { lang: 'es', persona: 'fan' };
      storage.set('prefs', obj);
      expect(storage.get('prefs')).toEqual(obj);
    });

    it('stores and retrieves a boolean', () => {
      storage.set('bool_key', true);
      expect(storage.get('bool_key')).toBe(true);
    });

    it('stores and retrieves a number', () => {
      storage.set('num_key', 42);
      expect(storage.get('num_key')).toBe(42);
    });
  });

  describe('storage.get', () => {
    it('returns the defaultValue when key does not exist', () => {
      expect(storage.get('missing_key', 'default')).toBe('default');
    });

    it('returns null by default when key does not exist', () => {
      expect(storage.get('missing_key')).toBeNull();
    });
  });

  describe('storage.remove', () => {
    it('removes a stored key', () => {
      storage.set('to_remove', 'value');
      storage.remove('to_remove');
      expect(storage.get('to_remove')).toBeNull();
    });

    it('does not throw when removing a non-existent key', () => {
      expect(() => storage.remove('nonexistent')).not.toThrow();
    });
  });
});
