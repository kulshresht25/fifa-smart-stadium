/**
 * StadiumIQ — Simulation & Live-Update Utilities
 *
 * Reusable helpers for the real-time simulation intervals used across
 * Crowd, Transport, and Sustainability components. Centralises the
 * `document.hidden` guard pattern and setInterval lifecycle management.
 *
 * @module utils/simulation
 */

/**
 * Clamps a numeric value between min and max (inclusive).
 *
 * Used extensively in live-update loops to keep simulated metrics
 * within physically plausible bounds (e.g. 0–100% occupancy).
 *
 * @param {number} value - Input value to clamp
 * @param {number} min   - Lower bound (inclusive)
 * @param {number} max   - Upper bound (inclusive)
 * @returns {number} The clamped value
 *
 * @example
 * const density = clamp(currentDensity + delta, 0, 100);
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Creates a managed live-update interval that:
 * - Skips ticks while the page/tab is hidden (saves CPU & battery)
 * - Returns a cleanup function to stop the interval
 *
 * This replaces the scattered `setInterval(() => { if (document.hidden) return; ... })`
 * pattern that appears in crowd.js, transport.js, and sustainability.js.
 *
 * @param {() => void} fn       - The function to call on each tick
 * @param {number}     interval - Milliseconds between ticks
 * @param {boolean}   [skipWhenHidden=true] - Whether to skip ticks while tab is hidden
 * @returns {() => void} A cleanup function — call it to stop the interval
 *
 * @example
 * const stop = createLiveUpdater(() => updateCrowdData(), 3000);
 * // Later, on component unmount or page navigation:
 * stop();
 */
export function createLiveUpdater(fn, interval, skipWhenHidden = true) {
  const id = setInterval(() => {
    if (skipWhenHidden && document.hidden) return;
    fn();
  }, interval);

  return () => clearInterval(id);
}

/**
 * Returns a random integer between min and max (both inclusive).
 *
 * Equivalent to `Math.floor(Math.random() * (max - min + 1)) + min`.
 * Centralized here so tests can spy/mock it for deterministic simulations.
 *
 * @param {number} min - Lower bound (inclusive)
 * @param {number} max - Upper bound (inclusive)
 * @returns {number} Random integer in [min, max]
 *
 * @example
 * zone.current = clamp(zone.current + randomDelta(-5, 5), 0, 100);
 */
export function randomDelta(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
