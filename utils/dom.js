/**
 * StadiumIQ — DOM Utility Helpers
 *
 * Lightweight wrappers around common DOM operations with null-safety guards.
 * Avoids repetitive `document.getElementById` + null checks throughout the codebase.
 *
 * @module utils/dom
 */

/**
 * Typed querySelector with an optional parent element.
 *
 * @param {string} selector - CSS selector string
 * @param {Element|Document} [parent=document] - Root to search within
 * @returns {Element|null} The first matching element, or null
 *
 * @example
 * const btn = qs('#send-btn');
 * const inner = qs('.inner', card);
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Typed querySelectorAll — returns a plain Array (not NodeList).
 *
 * @param {string} selector - CSS selector string
 * @param {Element|Document} [parent=document] - Root to search within
 * @returns {Element[]} Array of matching elements (may be empty)
 *
 * @example
 * qsa('.nav-item').forEach(el => el.classList.remove('active'));
 */
export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Add an event listener with a null-safety guard so missing elements
 * don't cause unhandled errors during page initialisation.
 *
 * @param {Element|null} el - Target element (may be null — safely ignored)
 * @param {string} event - Event name (e.g. 'click', 'input')
 * @param {EventListenerOrEventListenerObject} handler - Callback
 * @param {boolean|AddEventListenerOptions} [options] - Listener options
 *
 * @example
 * on(qs('#send-btn'), 'click', sendMessage);
 */
export function on(el, event, handler, options) {
  if (!el) return;
  el.addEventListener(event, handler, options);
}

/**
 * Set innerHTML on a container element with a null-safety guard.
 * Prefer this over direct `container.innerHTML =` assignments to
 * make null-checks consistent across the codebase.
 *
 * @param {Element|null} container - Target container (may be null — safely ignored)
 * @param {string} html - HTML string to inject
 *
 * @example
 * renderHTML(qs('#shuttle-list'), shuttles.map(renderShuttleCard).join(''));
 */
export function renderHTML(container, html) {
  if (!container) return;
  container.innerHTML = html;
}

/**
 * Get an element by ID with an optional fallback.
 * Shorter than `document.getElementById` and logs a warning when missing.
 *
 * @param {string} id - Element ID (without #)
 * @param {boolean} [warn=false] - Log a console.warn when element is not found
 * @returns {HTMLElement|null}
 */
export function getById(id, warn = false) {
  const el = document.getElementById(id);
  if (!el && warn) {
    console.warn(`[StadiumIQ] Element #${id} not found in DOM`);
  }
  return el;
}
