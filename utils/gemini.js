/**
 * StadiumIQ — Gemini API Wrapper
 * Provides AI-powered responses for FIFA World Cup 2026 stadium operations.
 */

const GeminiAPI = (() => {
  const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // Persona system prompts
  const PERSONA_PROMPTS = {
    fan: `You are StadiumIQ, an intelligent FIFA World Cup 2026 assistant for fans.
You help fans navigate stadiums, find seats, locate food/beverages, restrooms, 
first aid, fan zones, and transportation. You provide real-time crowd updates, 
accessibility info, and match schedules. Be friendly, enthusiastic about football,
and use emojis where appropriate. Support multiple languages seamlessly.`,

    organizer: `You are StadiumIQ, an operational intelligence assistant for FIFA World Cup 2026 organizers.
You help manage stadium capacity, crowd flow, security alerts, vendor coordination, 
event scheduling, staff deployment, and emergency protocols. Provide data-driven insights,
capacity thresholds, and actionable recommendations. Be concise and professional.`,

    volunteer: `You are StadiumIQ, a smart support assistant for FIFA World Cup 2026 volunteers.
You help volunteers understand their roles, locate their stations, communicate with staff,
handle fan queries, find first aid or security, and manage multilingual interactions.
Be helpful, clear, and provide step-by-step guidance.`,

    staff: `You are StadiumIQ, an operational assistant for FIFA World Cup 2026 venue staff.
You assist with maintenance requests, facility management, access control, 
utility monitoring, vendor logistics, and real-time issue resolution.
Be technical, precise, and solution-oriented.`
  };

  // Language detection and translation context
  const LANGUAGE_CONTEXT = {
    en: 'Respond in English.',
    es: 'Responde en español (Spanish).',
    fr: 'Réponds en français (French).',
    ar: 'أجب باللغة العربية (Arabic).',
    pt: 'Responda em português (Portuguese).',
    de: 'Antworte auf Deutsch (German).',
    zh: '用中文回答 (Chinese).',
    ja: '日本語で答えてください (Japanese).',
    hi: 'हिंदी में उत्तर दें (Hindi).',
    ko: '한국어로 답하세요 (Korean).'
  };

  let apiKey = '';
  let currentPersona = 'fan';
  let currentLanguage = 'en';
  let conversationHistory = [];

  /**
   * Initialize the API with a key
   */
  function init(key, persona = 'fan', language = 'en') {
    apiKey = key;
    currentPersona = persona;
    currentLanguage = language;
    conversationHistory = [];
  }

  /**
   * Set current persona
   */
  function setPersona(persona) {
    currentPersona = persona;
    conversationHistory = []; // Reset history on persona change
  }

  /**
   * Set current language
   */
  function setLanguage(lang) {
    currentLanguage = lang;
  }

  /**
   * Build the full prompt with context
   */
  function buildPrompt(userMessage, additionalContext = '') {
    const systemInstruction = PERSONA_PROMPTS[currentPersona] || PERSONA_PROMPTS.fan;
    const langInstruction = LANGUAGE_CONTEXT[currentLanguage] || LANGUAGE_CONTEXT.en;

    return `${systemInstruction}

LANGUAGE INSTRUCTION: ${langInstruction}

STADIUM CONTEXT:
- Event: FIFA World Cup 2026
- Current Time: ${new Date().toLocaleTimeString()}
- Stadium: MetLife Stadium, East Rutherford, NJ (primary venue)
- Capacity: 82,500 fans
- Current Occupancy: ~78% (simulated)
${additionalContext}

USER QUERY: ${userMessage}

Provide a helpful, accurate, and contextually relevant response. If asked about navigation, 
give specific gate/section directions. If asked about emergencies, always direct to 
security (Section A, Gate 1) or first aid (Sections B, E, H). Keep responses concise but complete.`;
  }

  /**
   * Send a message to Gemini and get a response
   */
  async function sendMessage(userMessage, context = '') {
    if (!apiKey) {
      return {
        success: false,
        text: getFallbackResponse(userMessage),
        isFallback: true
      };
    }

    const prompt = buildPrompt(userMessage, context);

    // Add to history
    conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    };

    try {
      const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      // Add to history
      conversationHistory.push({
        role: 'model',
        parts: [{ text }]
      });

      return { success: true, text, isFallback: false };

    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        success: false,
        text: getFallbackResponse(userMessage),
        isFallback: true,
        error: error.message
      };
    }
  }

  /**
   * Generate operational intelligence summary
   */
  async function generateOperationalInsight(data) {
    if (!apiKey) return null;

    const prompt = `As an AI stadium operations analyst for FIFA World Cup 2026, analyze this real-time data and provide a 3-bullet operational summary with any urgent alerts:

Stadium Data:
${JSON.stringify(data, null, 2)}

Format response as JSON: { "summary": "...", "alerts": ["...", "..."], "recommendation": "...", "severity": "low|medium|high" }`;

    try {
      const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
        })
      });

      if (!response.ok) return null;

      const data_resp = await response.json();
      const text = data_resp.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { summary: text, alerts: [], recommendation: '', severity: 'low' };

    } catch (error) {
      console.error('Operational insight error:', error);
      return null;
    }
  }

  /**
   * Translate text using Gemini
   */
  async function translateText(text, targetLanguage) {
    if (!apiKey) return text;

    const langNames = {
      en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic',
      pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese',
      hi: 'Hindi', ko: 'Korean'
    };

    const prompt = `Translate the following text to ${langNames[targetLanguage] || 'English'}. Return ONLY the translated text, nothing else:\n\n${text}`;

    try {
      const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
        })
      });

      if (!response.ok) return text;

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || text;

    } catch (error) {
      return text;
    }
  }

  /**
   * Fallback responses when API key is not set
   */
  function getFallbackResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('food') || q.includes('eat') || q.includes('hungry')) {
      return '🍔 **Food & Beverages**: Concession stands are located at every gate entrance (Sections A, B, C, D). Premium dining at Section E Level 2. Vegetarian/vegan options at Section G. Wait time: ~8 min average.';
    }
    if (q.includes('seat') || q.includes('section') || q.includes('find')) {
      return '🗺️ **Navigation**: Use our interactive map above! Enter your section number and I\'ll guide you. Gates open 2 hours before kickoff. Elevators available at Gates 1, 3, and 5.';
    }
    if (q.includes('bathroom') || q.includes('restroom') || q.includes('toilet')) {
      return '🚻 **Restrooms**: Available at every section concourse. Accessible restrooms with family rooms at Gates 2, 4, 6. Current wait: Low (< 3 min).';
    }
    if (q.includes('transport') || q.includes('bus') || q.includes('train') || q.includes('parking')) {
      return '🚌 **Transportation**: Express shuttles depart every 15 min from main gates. Next bus: 6 min. Parking Lot A (North) still has availability. Metro Line 3 direct to stadium.';
    }
    if (q.includes('emergency') || q.includes('help') || q.includes('medical') || q.includes('first aid')) {
      return '🏥 **EMERGENCY**: First Aid stations at Sections B, E, H. Security Command: Gate 1, Section A. Call stadium emergency: Ext. 911. Staff in red vests can assist immediately.';
    }
    if (q.includes('crowd') || q.includes('busy') || q.includes('crowd')) {
      return '👥 **Crowd Status**: Current occupancy 78% (64,300/82,500). Hotspots: Main entrance (high), Gate 3 (medium). Suggested route: Use Gate 7 for faster entry. North concourse is less crowded.';
    }
    if (q.includes('accessibility') || q.includes('wheelchair') || q.includes('disabled')) {
      return '♿ **Accessibility**: Wheelchair areas at Sections 100-105 (field level) and 200-205 (upper deck). Companion seating available. Hearing loops at all premium areas. Guide dog relief areas at Gates 2 and 6.';
    }

    return '⚽ **StadiumIQ Assistant**: I\'m here to help with navigation, crowd updates, food, transport, and more! Please enter your Gemini API key in settings for full AI-powered responses, or ask me about specific stadium services.';
  }

  /**
   * Clear conversation history
   */
  function clearHistory() {
    conversationHistory = [];
  }

  /**
   * Check if API key is configured
   */
  function isConfigured() {
    return apiKey && apiKey.length > 10;
  }

  return {
    init,
    setPersona,
    setLanguage,
    sendMessage,
    generateOperationalInsight,
    translateText,
    clearHistory,
    isConfigured,
    getHistory: () => conversationHistory
  };
})();

export default GeminiAPI;
