# 🫁 LungBuddy — AI-Powered Lung Health Monitor

[![Live Demo](https://img.shields.io/badge/Live-Demo-teal?style=for-the-badge)](https://lungs-buddy.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3-orange?style=flat-square)](https://groq.com/)

**LungBuddy** is a comprehensive lung health assessment platform that calculates a personalized risk score (0–100) based on environmental exposure, lifestyle habits, and medical history — then delivers AI-powered recommendations to improve your respiratory health.

---

## ✨ Features

### 🎯 5-Step Health Assessment
- **Profile** — Age, sex, BMI, medical history, family history
- **Exposure** — Real-time AQI via OpenWeather API, outdoor duration, mask usage, indoor air quality
- **Lifestyle** — Smoking, vaping, exercise, sleep patterns
- **Breath Hold Challenge** — Interactive timer or manual entry for lung capacity estimation
- **Symptoms** — Shortness of breath, coughing, wheezing, chest tightness, recent infections

### 📊 Intelligent Risk Engine
- **5 weighted domains**: Environmental (35pts), Behavioral (20pts), Biological (15pts), Sleep & Recovery (15pts), Disease & Symptoms (15pts)
- Non-linear, medically-informed scoring formula with cross-domain interactions
- Evidence-based thresholds aligned with WHO/ALA guidelines

### 🤖 AI-Powered Recommendations (Groq + LLaMA 3.3 70B)
- Dynamic recommendation count based on score severity
- Personalized advice targeting the user's worst risk domains
- Categories: Status, Urgent, Protection, Lifestyle, Medical, Environment

### 🏆 Competitive Leaderboard
- Create or join rooms with friends
- Track improvement percentage over time
- 🔥 **Snapchat-style streak system** — consecutive daily submissions
- **AI Coach** — per-member insights and competitive motivation
- 24-hour submission cooldown

### 🫁 3D Lung Visualization
- Interactive Three.js lung model with particle effects
- In-place rotation with fade-in animation
- Responsive dust particle system

### 📄 Downloadable PDF Report
- Full assessment breakdown with charts
- Generated via jsPDF

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 7 |
| **Styling** | Tailwind CSS + Custom CSS |
| **Animations** | Framer Motion |
| **3D** | Three.js + React Three Fiber |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Auth & DB** | Firebase (Auth + Cloud Firestore) |
| **AI/LLM** | Groq API (LLaMA 3.3 70B Versatile) |
| **Weather** | OpenWeather API (Geocoding + AQI) |
| **PDF** | jsPDF |
| **Hosting** | Vercel |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│              React + Vite (SPA)                  │
│                                                  │
│  ┌───────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ HeroSection│  │ InputSection │  │ Results   │ │
│  │ (3D Lung)  │  │ (5-step form)│  │ Section   │ │
│  └───────────┘  └──────┬───────┘  └─────┬─────┘ │
│                        │                │        │
│  ┌─────────────────────┴────────────────┘        │
│  │         Risk Engine (App.jsx)                 │
│  │   5 domains × weighted scoring → 0-100        │
│  └───────────────────────────────────────┘        │
│                                                  │
│  ┌──────────────────────────────────────┐        │
│  │  Leaderboard (Auth + Rooms + Streaks) │       │
│  └──────────────┬───────────────────────┘        │
└─────────────────┼───────────────────────────────┘
                  │
    ┌─────────────┼─────────────────┐
    ▼             ▼                 ▼
┌────────┐  ┌──────────┐    ┌────────────┐
│Firebase│  │ Groq API │    │ OpenWeather│
│Auth +  │  │LLaMA 3.3 │    │  API       │
│Firestore│ │  70B     │    │ AQI + Geo  │
└────────┘  └──────────┘    └────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (Auth + Firestore enabled)
- Groq API key ([console.groq.com](https://console.groq.com))
- OpenWeather API key ([openweathermap.org](https://openweathermap.org/api))

### Installation

```bash
git clone https://github.com/umangkaushik17-bit/LungsBuddy.git
cd LungsBuddy/vite-project
npm install
```

### Environment Setup

Create a `.env` file in `vite-project/`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_GROQ_API_KEY=your_groq_key
```

### Run

```bash
npm run dev
```

---

## 📁 Project Structure

```
vite-project/
├── public/
│   └── models/                 # 3D lung model (.glb)
├── src/
│   ├── components/
│   │   ├── HeroSection.jsx     # 3D lung + landing
│   │   ├── InputSection.jsx    # 5-step assessment form
│   │   ├── ResultsSection.jsx  # Score gauge + AI recs
│   │   ├── DamageSection.jsx   # Educational content
│   │   ├── Footer.jsx          # Site footer
│   │   └── leaderboard/
│   │       ├── AuthProvider.jsx    # Firebase auth context
│   │       ├── LeaderboardPage.jsx # Login/register
│   │       ├── RoomLobby.jsx       # Create/join rooms
│   │       ├── RoomDashboard.jsx   # Rankings + streaks + AI coach
│   │       └── SubmitScoreModal.jsx# Score submission
│   ├── gemini.js               # Groq LLM service
│   ├── firebase.js             # Firebase config
│   ├── App.jsx                 # Risk engine + routing
│   └── index.css               # Global styles
├── .env                        # API keys (gitignored)
├── vercel.json                 # SPA routing config
└── package.json
```

---

## 🔒 Security

- All API keys stored in `.env` (gitignored)
- Firebase Security Rules protect database access
- For production, consider proxying API calls through Firebase Cloud Functions

---

## 📝 License

This project is for educational purposes.

---

**Made with ❤️ for healthier lungs**
