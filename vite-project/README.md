# 🫁 LungBuddy 3.0

**A research-backed, client-side lung health risk assessment tool built with React.**

LungBuddy uses a 7-module nonlinear epidemiological engine to estimate your lung health score (0–100) based on demographics, environmental exposure, lifestyle habits, symptoms, and a real-time breath hold test. All calculations run entirely in-browser — no data leaves your device.

---

## ✨ Features

- **7-Module Risk Engine** — Baseline vulnerability, behavioral risk, pathological interactions, environmental load, functional validation, circadian sleep recovery, and diagnostic symptom suppression (DSSL)
- **Split-Pathway Exercise Model** — Differentiates active vs passive pollution dose based on exercise location (gym/park/urban), intensity, and ventilation quality
- **Smart Symptom Scoring (DSSL)** — Prevents double-counting symptoms expected for diagnosed conditions (e.g., dyspnea in COPD)
- **Circadian Sleep Recovery** — U-shaped risk curve penalizing both sleep deprivation (<6h) and hypersomnia (>9h)
- **Live AQI Fetch** — Auto-fetch air quality index by city using OpenWeather API
- **Breath Hold Challenge** — Built-in stopwatch or manual entry for functional lung capacity testing
- **10-Year Trend Projection** — Predicts lung health trajectory based on current risk factors
- **Fully Client-Side** — Zero backend, zero data collection, 100% privacy

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| API | OpenWeather (AQI) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/lung-buddy.git
cd lung-buddy/vite-project

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be running at `http://localhost:5173`.

### AQI API Setup (Optional)

To enable the live AQI fetch feature:

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Open `src/components/InputSection.jsx`
3. Replace `YOUR_API_KEY_HERE` with your key

---

## 🧠 How the Engine Works

The engine computes a **Lung Health Score** (0–100) by subtracting cumulative damage from all 7 modules:

```
Score = 100 - clamp(ModuleA + ModuleB + ModuleC + ModuleD + ModuleE + ModuleF + ModuleG, 0, 100)
```

| Module | Name | Key Inputs |
|---|---|---|
| **A** | Baseline Vulnerability | Age, BMI (U-shaped), family history |
| **B** | Behavioral Risk | Pack-years, dual-use (smoke+vape = 2.8x), secondhand smoke |
| **C** | Pathological Interactions | Asthma×late-onset×smoking, TB×smoking synergies |
| **D** | Environmental Load | Split passive (AQI, outdoor hours, mask, occupation) + active (exercise intensity, location, gym ventilation) |
| **E** | Functional Validation | Gender-corrected breath hold threshold |
| **F** | Circadian Recovery | Sleep duration U-curve with COPD/Asthma amplifier |
| **G** | DSSL (Symptoms) | Base disease scores + only unexpected symptoms scored |

---

## 📁 Project Structure

```
lung_buddy/
├── vite-project/
│   ├── src/
│   │   ├── App.jsx              # Risk engine (7 modules) + trend projection
│   │   ├── index.css             # Design system + global styles
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── HeroSection.jsx   # 3D lung model + particles
│   │       ├── DamageSection.jsx
│   │       ├── InputSection.jsx  # 5-step form wizard
│   │       ├── ResultsSection.jsx# Score gauge + trend chart
│   │       └── Footer.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 📄 License

This project is for educational and hackathon purposes. Not intended for clinical diagnosis.

---

<p align="center">
  Built with ❤️ for healthier lungs
</p>
