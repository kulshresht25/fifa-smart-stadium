/**
 * Unit tests for utils/simulation.js
 *
 * Tests clamp(), randomDelta(), and createLiveUpdater() with fake timers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clamp, randomDelta, createLiveUpdater } from '../../utils/simulation.js';

// ─────────────────────────────────────────────────────────────────────────────
// clamp
// ─────────────────────────────────────────────────────────────────────────────
describe('clamp', () => {
  it('returns value unchanged when within [min, max]', () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(0, 0, 100)).toBe(0);
    expect(clamp(100, 0, 100)).toBe(100);
  });

  it('returns min when value is below range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(-Infinity, 0, 100)).toBe(0);
  });

  it('returns max when value is above range', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(Infinity, 0, 100)).toBe(100);
  });

  it('works with negative ranges', () => {
    expect(clamp(-50, -100, -10)).toBe(-50);
    expect(clamp(0, -100, -10)).toBe(-10);
    expect(clamp(-200, -100, -10)).toBe(-100);
  });

  it('returns min === max when both bounds are equal', () => {
    expect(clamp(99, 42, 42)).toBe(42);
    expect(clamp(42, 42, 42)).toBe(42);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// randomDelta
// ─────────────────────────────────────────────────────────────────────────────
describe('randomDelta', () => {
  it('returns a value within [min, max] inclusive', () => {
    for (let i = 0; i < 200; i++) {
      const result = randomDelta(-5, 5);
      expect(result).toBeGreaterThanOrEqual(-5);
      expect(result).toBeLessThanOrEqual(5);
    }
  });

  it('returns an integer', () => {
    const result = randomDelta(0, 100);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns the exact value when min === max', () => {
    expect(randomDelta(7, 7)).toBe(7);
  });

  it('works with zero-based ranges', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomDelta(0, 10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createLiveUpdater
// ─────────────────────────────────────────────────────────────────────────────
describe('createLiveUpdater', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Ensure document.hidden = false by default
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls fn on each interval tick', () => {
    const fn = vi.fn();
    createLiveUpdater(fn, 1000);

    vi.advanceTimersByTime(3000);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not call fn when document is hidden (skipWhenHidden=true)', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    const fn = vi.fn();
    createLiveUpdater(fn, 1000, true);

    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls fn even when document is hidden when skipWhenHidden=false', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    const fn = vi.fn();
    createLiveUpdater(fn, 1000, false);

    vi.advanceTimersByTime(3000);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops calling fn after the cleanup function is invoked', () => {
    const fn = vi.fn();
    const stop = createLiveUpdater(fn, 1000);

    vi.advanceTimersByTime(2000);
    expect(fn).toHaveBeenCalledTimes(2);

    stop();
    vi.advanceTimersByTime(3000);
    // Should still be 2 — interval was cleared
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns a function from createLiveUpdater', () => {
    const fn = vi.fn();
    const stop = createLiveUpdater(fn, 500);
    expect(typeof stop).toBe('function');
    stop(); // cleanup
  });
});
