/**
 * StadiumIQ — AI Chat Assistant Component
 * Persona-aware, multilingual chat interface powered by Google Gemini.
 */

import GeminiAPI from '../utils/gemini.js';
import i18n from '../utils/i18n.js';
import { parseMarkdown, copyToClipboard, speak, generateId, showToast, sanitizeHTML } from '../utils/helpers.js';

const ChatComponent = (() => {
  let container = null;
  let messagesEl = null;
  let inputEl = null;
  let isTyping = false;
  const messages = [];

  // Quick suggestion chips per persona
  const SUGGESTIONS = {
    fan: [
      '🗺️ How do I get to Section 114?',
      '🍕 Where can I find food near Gate 3?',
      '🚌 When is the next shuttle to downtown?',
      '♿ Where are the accessible entrances?',
      '⚽ What time does the match start?',
      '🚻 Where is the nearest restroom?'
    ],
    organizer: [
      '📊 Crowd density analysis for Gate 2',
      '🚨 Current security alerts',
      '👥 Staff deployment status',
      '⚡ Emergency protocol for Section B',
      '📈 Capacity utilization report',
      '🔄 Vendor coordination update'
    ],
    volunteer: [
      '📍 Where is my assignment station?',
      '🌐 How do I help a non-English speaker?',
      '🏥 How do I get first aid assistance?',
      '📋 What are my shift responsibilities?',
      '🔗 How do I contact security?',
      '♿ Accessibility assistance protocol'
    ],
    staff: [
      '🔧 Report maintenance issue - Gate 4',
      '💡 Utility monitoring dashboard',
      '🚪 Access control override request',
      '📦 Vendor delivery coordination',
      '🌡️ HVAC status check',
      '🔋 Power backup status'
    ]
  };

  /**
   * Initialize chat component
   */
  function init(containerEl, persona = 'fan') {
    container = containerEl;
    render(persona);
    addWelcomeMessage(persona);
  }

  /**
   * Render the chat interface
   */
  function render(persona) {
    container.innerHTML = `
      <div class="chat-wrapper" id="chat-wrapper">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">
              <span class="ai-pulse"></span>
              🤖
            </div>
            <div>
              <h3>StadiumIQ Assistant</h3>
              <span class="chat-status online">● Online — ${getPersonaLabel(persona)}</span>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="btn-icon" id="chat-clear-btn" title="Clear chat" aria-label="Clear chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
            </button>
            <button class="btn-icon" id="chat-speak-toggle" title="Toggle voice" aria-label="Toggle voice">
              🔊
            </button>
          </div>
        </div>

        <!-- Suggestions -->
        <div class="suggestions-container" id="suggestions-container">
          ${SUGGESTIONS[persona].map(s => `
            <button class="suggestion-chip" data-query="${sanitizeHTML(s)}" aria-label="${sanitizeHTML(s)}">
              ${sanitizeHTML(s)}
            </button>
          `).join('')}
        </div>

        <!-- Messages area -->
        <div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        </div>

        <!-- Typing indicator -->
        <div class="typing-indicator" id="typing-indicator" style="display:none;">
          <div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
          <span class="typing-text">${i18n.t('thinking')}</span>
        </div>

        <!-- Input area -->
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <button class="btn-icon mic-btn" id="mic-btn" title="Voice input" aria-label="Voice input">🎤</button>
            <textarea
              id="chat-input"
              class="chat-input"
              placeholder="${i18n.t('chatPlaceholder')}"
              rows="1"
              maxlength="1000"
              aria-label="Chat message input"
            ></textarea>
            <button class="btn-send" id="send-btn" aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div class="chat-input-footer">
            <span class="char-counter" id="char-counter">0/1000</span>
            <span class="powered-by">Powered by Google Gemini AI</span>
          </div>
        </div>
      </div>
    `;

    messagesEl = document.getElementById('chat-messages');
    inputEl = document.getElementById('chat-input');
    bindEvents();
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    const sendBtn = document.getElementById('send-btn');
    const clearBtn = document.getElementById('chat-clear-btn');
    const micBtn = document.getElementById('mic-btn');

    sendBtn?.addEventListener('click', handleSend);
    clearBtn?.addEventListener('click', clearChat);

    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    inputEl?.addEventListener('input', () => {
      // Auto-resize
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
      // Char counter
      const counter = document.getElementById('char-counter');
      if (counter) {
        const len = inputEl.value.length;
        counter.textContent = `${len}/1000`;
        counter.style.color = len > 900 ? '#ef4444' : '';
      }
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        if (query && inputEl) {
          inputEl.value = query;
          handleSend();
          // Hide suggestions after use
          const sugg = document.getElementById('suggestions-container');
          if (sugg) sugg.style.display = 'none';
        }
      });
    });

    // Mic / voice input
    micBtn?.addEventListener('click', handleVoiceInput);
  }

  /**
   * Handle voice input
   */
  function handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Voice input not supported in this browser', 'warning');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.lang = i18n.getCurrentLang() + '-' + i18n.getCurrentLang().toUpperCase();

    const micBtn = document.getElementById('mic-btn');
    if (micBtn) {
      micBtn.textContent = '🔴';
      micBtn.classList.add('recording');
    }

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (inputEl) inputEl.value = transcript;
      if (micBtn) { micBtn.textContent = '🎤'; micBtn.classList.remove('recording'); }
      handleSend();
    };

    recognition.onerror = () => {
      if (micBtn) { micBtn.textContent = '🎤'; micBtn.classList.remove('recording'); }
      showToast('Voice input error. Please try again.', 'error');
    };

    recognition.start();
  }

  /**
   * Handle sending a message
   */
  async function handleSend() {
    if (!inputEl || isTyping) return;
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';

    // Add user message
    addMessage('user', text);

    // Show typing
    showTyping(true);
    isTyping = true;

    try {
      const response = await GeminiAPI.sendMessage(text);
      showTyping(false);
      isTyping = false;
      addMessage('assistant', response.text, response.isFallback);

      // Auto-speak if enabled
      if (localStorage.getItem('stadiumiq_speak') === 'true') {
        speak(response.text.replace(/<[^>]*>/g, ''), i18n.getCurrentLang());
      }

    } catch (error) {
      showTyping(false);
      isTyping = false;
      addMessage('assistant', '⚠️ Sorry, I encountered an error. Please try again.', true);
    }
  }

  /**
   * Add a message to the chat
   */
  function addMessage(role, text, isFallback = false) {
    const id = generateId('msg');
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isUser = role === 'user';

    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isUser ? 'user-message' : 'assistant-message'}`;
    msgEl.id = id;

    const formattedText = isUser ? sanitizeHTML(text) : parseMarkdown(text);

    msgEl.innerHTML = `
      <div class="message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}">
        ${!isUser ? '<span class="ai-icon">🤖</span>' : ''}
        <div class="message-content">
          <div class="message-text">${formattedText}</div>
          <div class="message-footer">
            <span class="message-time">${time}</span>
            ${isFallback && !isUser ? '<span class="fallback-badge">Demo Mode</span>' : ''}
            ${!isUser ? `
              <div class="message-actions">
                <button class="msg-action-btn" onclick="copyMsgText('${id}')" title="Copy" aria-label="Copy message">📋</button>
                <button class="msg-action-btn" onclick="speakMsg('${id}')" title="Speak" aria-label="Speak message">🔊</button>
              </div>
            ` : ''}
          </div>
        </div>
        ${isUser ? '<span class="user-icon">👤</span>' : ''}
      </div>
    `;

    messagesEl?.appendChild(msgEl);
    scrollToBottom();

    // Store message text for copy/speak actions
    msgEl.dataset.rawText = text;

    // Add animation
    requestAnimationFrame(() => {
      msgEl.classList.add('message-appear');
    });

    messages.push({ id, role, text, time });
  }

  /**
   * Add welcome message
   */
  function addWelcomeMessage(persona) {
    const welcomeMessages = {
      fan: '👋 Welcome to **StadiumIQ**! I\'m your AI-powered companion for FIFA World Cup 2026.\n\nI can help you with:\n- 🗺️ Stadium navigation & seat finding\n- 🍔 Food, beverages & services\n- 🚌 Transportation & parking\n- ♿ Accessibility support\n- 🌐 Multilingual assistance\n- ⚽ Match info & schedules\n\nHow can I help you today?',
      organizer: '📋 **StadiumIQ Ops Console** ready.\n\nOperational intelligence active for:\n- 👥 Real-time crowd analytics\n- 🚨 Security & emergency alerts\n- 📊 Capacity optimization\n- 🔄 Staff coordination\n- ⚡ Incident response\n\nWhat operational data do you need?',
      volunteer: '🙋 **Hello Volunteer!** StadiumIQ here to support your mission.\n\nI can assist with:\n- 📍 Station assignments & navigation\n- 🌐 Multilingual fan assistance\n- 🏥 Emergency & first aid protocols\n- 📋 Shift responsibilities\n- 🔗 Staff communication\n\nHow can I support your work today?',
      staff: '🔧 **StadiumIQ Facility Management** online.\n\nAvailable for:\n- 🏗️ Maintenance request routing\n- 💡 Utility monitoring\n- 🚪 Access control management\n- 📦 Vendor & logistics coordination\n- 🌡️ Environmental systems\n\nWhat facility issue needs attention?'
    };

    setTimeout(() => {
      addMessage('assistant', welcomeMessages[persona] || welcomeMessages.fan);
    }, 500);
  }

  /**
   * Show/hide typing indicator
   */
  function showTyping(show) {
    const el = document.getElementById('typing-indicator');
    if (el) el.style.display = show ? 'flex' : 'none';
    if (show) scrollToBottom();
  }

  /**
   * Scroll messages to bottom
   */
  function scrollToBottom() {
    if (messagesEl) {
      setTimeout(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, 50);
    }
  }

  /**
   * Clear chat
   */
  function clearChat() {
    messages.length = 0;
    if (messagesEl) messagesEl.innerHTML = '';
    GeminiAPI.clearHistory();
    addWelcomeMessage(window.currentPersona || 'fan');
    showToast('Chat cleared', 'success');

    // Show suggestions again
    const sugg = document.getElementById('suggestions-container');
    if (sugg) sugg.style.display = 'flex';
  }

  /**
   * Get persona label
   */
  function getPersonaLabel(persona) {
    const labels = {
      fan: '⚽ Fan Mode',
      organizer: '📋 Organizer Mode',
      volunteer: '🙋 Volunteer Mode',
      staff: '🔧 Staff Mode'
    };
    return labels[persona] || 'Fan Mode';
  }

  /**
   * Update persona
   */
  function updatePersona(persona) {
    const statusEl = container?.querySelector('.chat-status');
    if (statusEl) statusEl.textContent = `● Online — ${getPersonaLabel(persona)}`;
    clearChat();
  }

  return { init, updatePersona, addMessage, clearChat };
})();

// Global functions for inline event handlers
window.copyMsgText = (id) => {
  const el = document.getElementById(id);
  if (el) {
    copyToClipboard(el.dataset.rawText || '');
    showToast('Copied to clipboard!', 'success');
  }
};

window.speakMsg = (id) => {
  const el = document.getElementById(id);
  if (el) speak(el.dataset.rawText || '');
};

export default ChatComponent;
