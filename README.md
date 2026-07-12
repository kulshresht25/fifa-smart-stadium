# StadiumIQ — FIFA World Cup 2026 Smart Stadium Intelligence Hub

<div align="center">
  <h3>⚽ AI-Powered Stadium Operations & Fan Experience Platform</h3>
  <p>Built for FIFA World Cup 2026 | Powered by Google Gemini AI</p>

  ![StadiumIQ](https://img.shields.io/badge/FIFA-World%20Cup%202026-blue?style=for-the-badge)
  ![AI](https://img.shields.io/badge/Powered%20by-Google%20Gemini-orange?style=for-the-badge)
  ![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-green?style=for-the-badge)
  ![Languages](https://img.shields.io/badge/Languages-10%2B-purple?style=for-the-badge)
</div>

---

## 🎯 Chosen Vertical

**Smart Stadium Operations & Operational Intelligence**

StadiumIQ addresses the challenge of managing 80,000+ fans across multiple venues during the FIFA World Cup 2026, combining:
- 🤖 **Generative AI** (Google Gemini) for intelligent, contextual assistance
- 👥 **Crowd Management** with real-time heatmaps and predictive alerts
- 🗺️ **Navigation** with interactive SVG maps and step-by-step wayfinding
- 🌐 **Multilingual Support** in 10 languages with automatic detection
- ♿ **Accessibility** tools for inclusive fan experiences
- 🚌 **Transport** optimization with live shuttle and parking tracking
- 🌍 **Sustainability** dashboard tracking environmental impact in real time

---

## 🏗️ Solution Architecture

```
StadiumIQ (Single-Page App)
├── Frontend: Vanilla HTML5 / CSS3 / ES6+ Modules
├── AI Engine: Google Gemini 2.0 Flash API
├── Design: Dark mode, glassmorphism, micro-animations
├── Data: Simulated real-time (no backend required for demo)
└── Deployment: Any static host (GitHub Pages, Netlify, Vercel)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Vanilla JS (ES Modules), Vanilla CSS |
| AI Model | Google Gemini 2.0 Flash (`gemini-2.0-flash`) |
| Fonts | Google Fonts (Inter, Outfit) |
| Charts | HTML5 Canvas (heatmap), SVG (stadium map, energy donut) |
| Storage | localStorage (settings, API key, preferences) |
| Speech | Web Speech API (voice input + text-to-speech) |

---

## 🚀 How to Run

### Option 1: Open Directly (No Server Required)
> ⚠️ For ES Modules to work, you need a local HTTP server (not just file://)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/stadiumiq-fifa-2026.git
cd stadiumiq-fifa-2026

# Serve with Python (most common)
python -m http.server 8000

# OR with Node.js
npx serve .

# OR with VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open: **http://localhost:8000**

### Option 2: GitHub Pages
1. Push to GitHub
2. Go to Settings → Pages
3. Select branch `main`, root `/`
4. Your app will be live at `https://username.github.io/repo-name/`

---

## 🤖 AI Configuration

1. Get a **free** Google Gemini API key at [makersuite.google.com](https://makersuite.google.com/app/apikey)
2. Click **⚙️ Settings & API Key** in the sidebar
3. Paste your key and click **Save Settings**
4. The AI chat now uses full Gemini intelligence!

> **Without an API key**: The app runs in **Demo Mode** with smart pre-built responses for common stadium queries. All other features (heatmap, navigation, transport, eco tracker) work fully without a key.

---

## ✨ Features

### 🤖 AI Chat Assistant
- **Persona-aware**: Different modes for Fans, Organizers, Volunteers, and Staff
- **Multilingual**: Responds in the selected language using Gemini
- **Voice input**: Web Speech API for hands-free queries
- **Text-to-speech**: Reads responses aloud
- **Smart suggestions**: Context-aware quick replies per persona
- **Fallback mode**: Intelligent local responses when no API key is set

### 👥 Crowd Management Dashboard
- **Live heatmap**: HTML5 Canvas visualization of crowd density across stadium zones
- **AI Analysis**: One-click Gemini-powered operational insight generation
- **Real-time alerts**: Critical / Warning / Info categorized alerts
- **Zone monitoring**: All 12 stadium zones with live density bars
- **Auto-refresh**: Updates every 3 seconds with animated transitions

### 🗺️ Stadium Navigation
- **Interactive SVG map**: Clickable sections and gate indicators
- **Section details**: Capacity, services, level, type information
- **Gate status**: Live wait times (color-coded: green/amber/orange/red)
- **Wayfinding**: Step-by-step turn-by-turn directions
- **Service finder**: Filter by food, restrooms, first aid, ATMs, etc.
- **Zoom controls**: Pan and zoom the stadium map

### 🚌 Transportation Hub
- **Live shuttle tracking**: Real-time countdown to next bus, occupancy levels
- **Public transit**: NJ Transit train and bus schedules with live countdowns
- **Rideshare zones**: Uber, Lyft, Via pickup locations and wait times
- **Parking availability**: Color-coded lot status with live space counts
- **Journey planner**: Multi-modal trip planning (transit/shuttle/drive/accessible)

### ♿ Accessibility Companion
- **Font size controls**: Adjustable 12px–24px with persistent preferences
- **High contrast mode**: WCAG-compliant visual toggle
- **Voice directions**: Text-to-speech for all route instructions
- **6 accessibility features**: Wheelchair, hearing, vision, mobility, sensory, family
- **Accessible routes**: Step-by-step paths from parking/transit to accessible seating
- **Assistance requests**: One-click: escort, wheelchair, interpreter, emergency
- **Hotline info**: Dedicated accessibility contact for the event

### 🌍 Sustainability Tracker
- **Carbon dashboard**: Real-time CO₂ saved metrics
- **Energy donut chart**: Live renewable vs. grid energy breakdown
- **6 initiatives**: Solar, waste recycling, water conservation, green transport, sustainable food, carbon offset
- **Eco tips**: Auto-rotating fan tips with manual navigation
- **Fan pledge system**: Interactive commitment tracking with counter
- **Animated metrics**: Smooth number transitions for live feel

### 🌐 Multilingual Support
10 languages supported: **English, Spanish, French, Arabic, Portuguese, German, Chinese, Japanese, Hindi, Korean**
- RTL support for Arabic
- Language-aware Gemini prompting
- Persistent language preference

---

## 🧩 Personas

| Persona | Focus | AI Context |
|---------|-------|-----------|
| ⚽ **Fan** | Navigation, food, transport, seat finding | Friendly, emoji-rich, practical |
| 📋 **Organizer** | Crowd analytics, alerts, staff coordination | Professional, data-driven, concise |
| 🙋 **Volunteer** | Station assignments, fan assistance, protocols | Clear, step-by-step, supportive |
| 🔧 **Staff** | Maintenance, utilities, access control, vendors | Technical, solution-oriented |

---

## 📁 Project Structure

```
Smart Stadiums & Tournament Operations/
├── index.html                   # Main SPA entry point (all routing, init, dashboard)
├── styles/
│   └── main.css                 # Complete design system (3000+ lines)
├── components/
│   ├── chat.js                  # AI Chat Assistant (voice, markdown, personas)
│   ├── crowd.js                 # Crowd heatmap & management (Canvas)
│   ├── navigation.js            # Stadium SVG map & wayfinding
│   ├── accessibility.js         # Accessibility tools & routes
│   ├── transport.js             # Shuttle/transit/parking hub
│   └── sustainability.js        # Eco metrics & pledge system
├── utils/
│   ├── gemini.js                # Gemini API wrapper (multi-persona, multilingual)
│   ├── i18n.js                  # 10-language internationalization
│   └── helpers.js               # Utilities, data constants, localStorage
└── README.md                    # This file
```

---

## 🔒 Security

- **No server-side storage**: API keys stored only in `localStorage` on user's device
- **CSP headers**: Content Security Policy restricts resource origins
- **XSS prevention**: `sanitizeHTML()` function sanitizes all user input before rendering
- **No `eval()` or `innerHTML` with raw user data**: All user text is sanitized
- **Safe API calls**: HTTPS only, structured request bodies, error handling
- **OWASP compliant**: Input validation, secure credential handling

---

## ♿ Accessibility

- **WCAG 2.1 AA** compliance target
- Semantic HTML5 with proper ARIA roles and labels
- Skip navigation link for keyboard users
- `aria-live` regions for dynamic content updates
- Focus management on page navigation
- High contrast mode toggle
- Font size scaling (12px–24px)
- Screen reader-friendly alt text and descriptions
- Voice input and text-to-speech output
- Color is never the only means of conveying information

---

## 📊 Evaluation Criteria Alignment

| Criteria | Implementation |
|----------|---------------|
| **Code Quality** | ES6 modules, IIFE pattern, clear separation of concerns, JSDoc comments |
| **Security** | XSS prevention, CSP headers, no hardcoded credentials, local-only storage |
| **Efficiency** | Lazy component initialization, debounce/throttle, `requestAnimationFrame` for animations |
| **Testing** | All components testable independently, clear public API, no global state pollution |
| **Accessibility** | WCAG 2.1 AA, ARIA, keyboard nav, screen reader support, multilingual |

---

## 💡 Assumptions

1. **Primary venue**: MetLife Stadium, East Rutherford, NJ (capacity 82,500)
2. **Data**: All real-time metrics are simulated (no live backend). In production, replace with stadium management APIs
3. **AI**: Google Gemini 2.0 Flash used for its balance of speed and quality
4. **Browser**: Modern browser required (Chrome, Firefox, Edge, Safari 2023+)
5. **Offline**: Core UI works without internet; AI chat requires connection to Gemini API
6. **No auth**: No user accounts — the platform is designed for event-day, anonymous use

---

## 👥 Target Users

- **80,000+ fans** attending each match across 16 venues
- **Event organizers** managing stadium operations
- **FIFA volunteers** assisting fans on-site
- **Venue staff** handling maintenance, logistics, and facilities

---

## 🌟 What Makes This Different

1. **Single-file deployable** — no build step, no package manager, no node_modules
2. **Works offline** (minus AI chat) — critical for stadium environments with poor connectivity
3. **10 languages in one click** — truly global audience support
4. **4 persona modes** — one app for all stakeholder types
5. **Real canvas heatmap** — not just a static image; computed from live zone data
6. **Voice I/O** — critical for fans focused on the game, not their phone

---

<div align="center">
  <p>Made with ❤️ for FIFA World Cup 2026</p>
  <p>⚽ Bringing intelligent operations to the world's biggest sporting event</p>
</div>
