/**
 * Unit tests for utils/dom.js
 *
 * Tests the null-safe DOM helpers using the jsdom environment
 * provided by Vitest. Each test sets up its own minimal DOM fragment.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { qs, qsa, on, renderHTML, getById } from '../../utils/dom.js';

// ─────────────────────────────────────────────────────────────────────────────
// qs
// ─────────────────────────────────────────────────────────────────────────────
describe('qs', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"><p class="text">Hello</p></div>';
  });

  it('finds an element by id selector', () => {
    const el = qs('#root');
    expect(el).not.toBeNull();
    expect(el.id).toBe('root');
  });

  it('finds an element by class selector', () => {
    const el = qs('.text');
    expect(el).not.toBeNull();
    expect(el.textContent).toBe('Hello');
  });

  it('returns null when no element matches', () => {
    expect(qs('.nonexistent')).toBeNull();
  });

  it('scopes search to the provided parent element', () => {
    const parent = qs('#root');
    const child = qs('p', parent);
    expect(child).not.toBeNull();
    expect(child.className).toBe('text');
  });

  it('returns null for a selector that exists outside the parent scope', () => {
    document.body.innerHTML = '<div id="outside"><p class="x">X</p></div><div id="inner"></div>';
    const inner = qs('#inner');
    expect(qs('.x', inner)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// qsa
// ─────────────────────────────────────────────────────────────────────────────
describe('qsa', () => {
  beforeEach(() => {
    document.body.innerHTML = '<ul><li class="item">A</li><li class="item">B</li><li class="item">C</li></ul>';
  });

  it('returns a plain Array (not NodeList)', () => {
    const result = qsa('.item');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns all matching elements', () => {
    expect(qsa('.item')).toHaveLength(3);
  });

  it('returns an empty array when nothing matches', () => {
    expect(qsa('.nonexistent')).toEqual([]);
  });

  it('scopes search to a parent element', () => {
    document.body.innerHTML = '<ul id="a"><li class="item">1</li></ul><ul id="b"><li class="item">2</li><li class="item">3</li></ul>';
    const b = qs('#b');
    expect(qsa('.item', b)).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// on
// ─────────────────────────────────────────────────────────────────────────────
describe('on', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button id="btn">Click me</button>';
  });

  it('attaches a click event listener to a valid element', () => {
    const btn = qs('#btn');
    const handler = vi.fn();
    on(btn, 'click', handler);
    btn.click();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does NOT throw when the element is null', () => {
    const handler = vi.fn();
    expect(() => on(null, 'click', handler)).not.toThrow();
  });

  it('does NOT call the handler when element is null', () => {
    const handler = vi.fn();
    on(null, 'click', handler);
    // Nothing to click, handler should never be called
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple listeners on the same element', () => {
    const btn = qs('#btn');
    const h1 = vi.fn();
    const h2 = vi.fn();
    on(btn, 'click', h1);
    on(btn, 'click', h2);
    btn.click();
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// renderHTML
// ─────────────────────────────────────────────────────────────────────────────
describe('renderHTML', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="container"></div>';
  });

  it('sets innerHTML on a valid element', () => {
    const container = qs('#container');
    renderHTML(container, '<p>Test</p>');
    expect(container.innerHTML).toBe('<p>Test</p>');
  });

  it('overwrites previous content', () => {
    const container = qs('#container');
    renderHTML(container, '<p>First</p>');
    renderHTML(container, '<p>Second</p>');
    expect(container.innerHTML).toBe('<p>Second</p>');
  });

  it('does NOT throw when the container is null', () => {
    expect(() => renderHTML(null, '<p>Test</p>')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getById
// ─────────────────────────────────────────────────────────────────────────────
describe('getById', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Content</div>';
  });

  it('returns the element when found', () => {
    const el = getById('target');
    expect(el).not.toBeNull();
    expect(el.textContent).toBe('Content');
  });

  it('returns null when element is not found', () => {
    expect(getById('missing')).toBeNull();
  });

  it('logs a console.warn when warn=true and element is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getById('missing', true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('#missing'));
    warnSpy.mockRestore();
  });

  it('does NOT warn when warn=false (default)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getById('missing');
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
