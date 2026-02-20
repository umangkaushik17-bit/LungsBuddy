# 🫁 LungBuddy — AI-Powered Lung Health Risk Assessment

<p align="center">
  <strong>A comprehensive, research-backed lung health risk assessment tool that helps users understand their respiratory health through an interactive, visually stunning web experience.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## 🌟 Features

- **🧪 Nonlinear Epidemiological Risk Engine** — Proprietary formula based on published research (GOLD 2024, WHO, SPIROMICS, UK Biobank, NHANES), computing risk across 5 weighted domains.
- **🫁 Interactive 3D Lung Visualization** — Stunning Three.js-powered 3D lung model with particle effects on the hero section.
- **📊 Detailed Risk Breakdown** — Visual breakdown across Biological, Behavioral, Environmental, Sleep, and Disease domains.
- **📋 Multi-Step Input Form** — Intuitive, paginated input form with keyboard navigation and accessibility support.
- **📄 PDF Report Generation** — Export a detailed, personalized risk assessment report as a PDF.
- **🎨 Premium Dark UI** — Modern glassmorphism design with smooth animations powered by Framer Motion.
- **📱 Fully Responsive** — Optimized experience across desktop, tablet, and mobile devices.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Three.js** + React Three Fiber | 3D lung visualization |
| **Framer Motion** | Animations & transitions |
| **Recharts** | Data visualization charts |
| **Tailwind CSS 4** | Utility-first styling |
| **Lucide React** | Icon library |
| **jsPDF** | PDF report generation |

---

## 🛡️ Security & API Keys

To keep the application secure and avoid leaking sensitive information like API keys (e.g., OpenWeather AQI fetch), follow these best practices:

1. **Use Environment Variables**: Store your API keys in a `.env` file in the `vite-project/` directory.
   ```text
   VITE_OPENWEATHER_API_KEY=your_api_key_here
   ```
2. **Access in Code**: Access the key using `import.meta.env.VITE_OPENWEATHER_API_KEY`.
3. **Never Commit Secrets**: The `.gitignore` file is configured to ignore `.env` files. Ensure you never manually add them to Git.

---

## 🧮 Risk Calculation Model

LungBuddy uses a **Weighted Domain Model** (100 points total) with 5 interdependent modules:

| Domain | Max Points | Key Factors |
|---|---|---|
| 🧬 **Biological** | 15 | Age, BMI, genetics |
| 🚬 **Behavioral** | 25 | Smoking, vaping, secondhand smoke |
| 🌍 **Environmental** | 35 | AQI, outdoor exposure, indoor air, occupational hazards |
| 😴 **Sleep** | 10 | Sleep duration, circadian disruption |
| 🏥 **Disease & Symptoms** | 15 | Pre-existing conditions, respiratory symptoms |

### Risk Categories

| Score | Category |
|---|---|
| 90–100 | 🟢 Optimal |
| 75–89 | 🟢 Good |
| 50–74 | 🟡 Moderate |
| 25–49 | 🟠 High Risk |
| 0–24 | 🔴 Critical |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/umangkaushik17-bit/LungsBuddy.git

# Navigate to the project
cd LungsBuddy/vite-project

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
lung_buddy/
├── vite-project/
│   ├── src/
│   │   ├── App.jsx                  # Main app + risk engine
│   │   ├── index.css                # Global styles
│   │   ├── main.jsx                 # App entry point
│   │   ├── components/
│   │   │   ├── HeroSection.jsx      # 3D lung model
│   │   │   ├── InputSection.jsx     # Risk assessment form
│   │   │   └── ResultsSection.jsx   # Results & breakdown
│   │   └── assets/                  # Static assets
│   ├── package.json
│   └── vite.config.js
├── SOURCES.txt                      # Research sources
└── README.md
```

---

## 📚 Research & Sources

The risk calculation formula is grounded in peer-reviewed medical research including:

- **GOLD 2024** — Global Initiative for Chronic Obstructive Lung Disease
- **WHO Air Quality Guidelines** — Ambient & household air pollution data
- **SPIROMICS** — Subpopulations and Intermediate Outcome Measures in COPD Study
- **UK Biobank** — Large-scale biomedical database
- **NHANES** — National Health and Nutrition Examination Survey
- **CDC EVALI Data** — E-cigarette and vaping associated lung injury

See [`SOURCES.txt`](SOURCES.txt) for the complete list of references.

---

## 👨‍💻 Author

**Umang Kaushik**
- GitHub: [@umangkaushik17-bit](https://github.com/umangkaushik17-bit)

---

## 📄 License

This project is for educational and research purposes.

---

<p align="center">
  Made with ❤️ for better respiratory health awareness
</p>
