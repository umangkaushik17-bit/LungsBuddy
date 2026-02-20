import { useState } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import DamageSection from './components/DamageSection'
import InputSection from './components/InputSection'
import ResultsSection from './components/ResultsSection'
import Footer from './components/Footer'
import './index.css'

// =====================================================================
// LungBuddy 3.0 -- Nonlinear Epidemiological Risk Engine
// 7 Interdependent Modules with Non-Linear Multipliers
// Based on: "Refining Respiratory Health Formula Parameters" (2025)
// =====================================================================

/**
 * Risk label from lung health score.
 * 90+ Optimal | 75-89 Good | 50-74 Moderate | 25-49 High Risk | <25 Critical
 */
function getRiskLabel(score) {
  if (score >= 90) return 'Optimal';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 25) return 'High Risk';
  return 'Critical';
}

/** Map risk label to a Tailwind color class. */
function getRiskCategoryColor(label) {
  switch (label) {
    case 'Optimal': return 'text-emerald-400';
    case 'Good': return 'text-green-400';
    case 'Moderate': return 'text-yellow-400';
    case 'High Risk': return 'text-orange-400';
    case 'Critical': return 'text-red-500';
    default: return 'text-white';
  }
}

/**
 * Main risk calculation -- LungBuddy 3.2
 * Weighted Domain Model (Total 100 Points)
 * Bio: 15 | Behavior: 25 | Env: 35 | Sleep: 10 | Disease: 15
 */
function calculateLungRisk(data) {
  // --- INPUT LAYER ---------------------------------------------------
  const gender = (data.sex || 'male').toLowerCase();
  const age = Math.min(Math.max(Number(data.age || 0), 10), 120);
  const height = Number(data.height || 0);                     // cm
  const weight = Number(data.weight || 0);                     // kg
  const smoker = (data.smoking === 'Yes' || data.smoking === 'current') ? 'current' : 'never';
  const cigarettesPerDay = Math.min(Number(data.cigarettesPerDay || 0), 100);
  const yearsSmoked = Math.min(Number(data.yearsSmoked || 0), age);
  const vapingStatus = (data.vapingStatus || 'never').toLowerCase();
  const secondhandSmoke = data.secondhandSmoke === 'Yes' || data.secondhandSmoke === true;
  const conditions = Array.isArray(data.medicalHistory) ? data.medicalHistory : [];
  const lowerConditions = conditions.map(c => c.toLowerCase());
  const familyHistoryStr = (typeof data.familyHistory === 'string') ? data.familyHistory.toLowerCase() : '';
  const asthmaOnset = (data.asthmaOnset || '').toLowerCase();

  const indoorAirQuality = (data.indoorAirQuality || 'good').toLowerCase();
  const aqi = Math.min(Number(data.aqi || 0), 500);
  const outdoorHours = Math.min(Math.max(Number(data.outdoorDuration || 0), 0), 24);
  const sleepHours = Math.min(Math.max(Number(data.sleepHours || 7), 0), 24);
  const breathHoldSec = Number(data.breathHoldSeconds || 0);

  // Exercise inputs
  const exerciseFreq = (data.exerciseFrequency || 'none').toLowerCase();
  const exerciseLocation = (data.exerciseLocation || 'outdoor_park').toLowerCase();
  const exerciseIntensity = (data.exerciseIntensity || 'moderate').toLowerCase();
  const gymVentilation = (data.gymVentilation || 'good').toLowerCase();

  // Protection inputs
  const maskRaw = (data.maskType || 'none').toLowerCase();
  const occRaw = (data.occupationalExposure || 'none').toLowerCase();

  // Condition flags
  const hasAsthma = lowerConditions.includes('asthma');
  const hasTB = lowerConditions.includes('tb');
  const hasCOPD = lowerConditions.includes('copd');
  const isDualUser = smoker === 'current' && vapingStatus === 'current';

  // Symptom flags
  const isSymptom = (val) => val === true || val === 'Yes';
  const hasDyspnea = isSymptom(data.shortnessOfBreath);
  const hasCough = isSymptom(data.chronicCough);
  const hasWheezing = isSymptom(data.wheezing);
  const hasChestTight = isSymptom(data.chestTightness);
  const hasInfection = isSymptom(data.recentInfection);

  // =================================================================
  // DOMAIN 1: BIOLOGICAL VULNERABILITY (Max 15 Points)
  // Age (Senescence) + BMI (Frailty/Restriction) + Genetics
  // Scaled ×0.75 from v3.1 — biology acts as vulnerability amplifier,
  // not acute damage source (GOLD 2024, UK Biobank)
  // =================================================================
  let rawBio = 0;

  // Age: Linear 0-40, accelerating 40+
  // At 90yo: (50 * 0.19) = 9.5 → capped at 9
  if (age > 40) rawBio += Math.min(9, (age - 40) * 0.19);

  // BMI: U-shaped (Obesity Paradox validated — GOLD 2024)
  const heightM = height / 100;
  const bmi = (heightM > 0) ? weight / (heightM * heightM) : 22;
  if (bmi < 18.5) rawBio += 4;       // Underweight frailty
  else if (bmi > 35) rawBio += 4;    // Severe restriction
  else if (bmi >= 25 && bmi <= 30) rawBio -= 1; // Mild obesity protective (paradox)

  // Genetics
  if (familyHistoryStr === 'yes' || familyHistoryStr.includes('lung')) rawBio += 2;

  const moduleBio = Math.min(Math.max(rawBio, 0), 15);

  // =================================================================
  // DOMAIN 2: BEHAVIORAL RISK (Max 25 Points)
  // Smoking, Vaping, Secondhand
  // Scaled ×0.833 from v3.1 — still highly destructive direct-inhalation
  // factors, but environmental affects everyone universally (SPIROMICS)
  // =================================================================
  let rawBeh = 0;
  const packYears = (cigarettesPerDay / 20) * yearsSmoked;

  // Smoking: Logarithmic curve. 40 Pack Years -> ~21 pts
  if (packYears > 0) {
    rawBeh += 6.5 * Math.log(packYears + 1);
  }

  // Vaping (CDC EVALI data)
  if (vapingStatus === 'current') rawBeh += 4;

  // Dual Use Synergy — OR 13.8 vs 5.0 for smoking alone
  if (isDualUser) rawBeh *= 1.5; // Cap ensures this doesn't explode

  // Secondhand Smoke (WHO: 1.2M deaths/yr)
  if (secondhandSmoke && smoker !== 'current') rawBeh += 4;

  const moduleBeh = Math.min(rawBeh, 25);

  // =================================================================
  // DOMAIN 3: ENVIRONMENTAL LOAD (Max 35 Points)
  // Passive + Active Dose + Indoor Air + Biomass
  // Elevated to reflect chronic unavoidable exposure as primary driver
  // WHO: 4.2M deaths ambient + 3.8M household air pollution annually
  // =================================================================
  let rawEnv = 0;

  // Passive Dose: Hours * (AQI/50)
  // Max daily passive (24h @ AQI 300) = 24 * 6 = 144 units
  let passiveUnits = outdoorHours * (aqi / 50);

  // Occupational (Multiplier)
  if (occRaw.includes('high')) passiveUnits *= 1.6;
  else if (occRaw.includes('moderate')) passiveUnits *= 1.3;

  // Mask (Reduction)
  if (maskRaw.includes('n95')) passiveUnits *= 0.5;
  else if (maskRaw.includes('surgical')) passiveUnits *= 0.8;
  else if (maskRaw.includes('cloth')) passiveUnits *= 0.9;

  // Active Dose (Exercise Risk) vs Aerobic Benefit (Protection)
  // NET IMPACT MODEL: Can increase OR decrease total risk
  let activeNet = 0;

  if (exerciseFreq !== 'none') {
    let exDuration = 0.5; // base duration (hours)
    if (exerciseFreq.includes('daily')) exDuration = 1.0;
    else if (exerciseFreq.includes('3-5')) exDuration = 0.7;

    // Minute Ventilation (VE) Multiplier
    let veMult = 2; // Light (Walking)
    if (exerciseIntensity.includes('imoderate')) veMult = 4; // Jogging
    else if (exerciseIntensity.includes('vigorous')) veMult = 8; // Running

    // Effective Concentration (C_eff)
    let cEff = aqi;

    if (exerciseLocation.includes('indoor') || exerciseLocation.includes('gym')) {
      // INDOOR GYM LOGIC
      if (gymVentilation === 'good') {
        // DECOUPLED: Filtered air is clean regardless of outdoor AQI
        cEff = 20; // Equivalent to 'Good' AQI
      } else {
        // COUPLED: Leaky/Poor vent tracks outdoor AQI slightly reduced
        cEff = Math.max(aqi * 0.9, 50); // Minimum stuffiness floor
      }
    } else {
      // OUTDOOR — use raw AQI (balanced midpoint of park 0.7× and urban 1.3×)
      cEff = aqi;
    }

    // 1. Inhaled Pollution Dose (Risk)
    // Formula: Duration * VE * Concentration
    const inhaledDose = exDuration * veMult * (cEff / 50);

    // 2. Aerobic Health Benefit (Protection)
    // Protective points that OFFSET the pollution risk
    let aerobicProtection = 0;
    if (exerciseIntensity.includes('vigorous')) aerobicProtection = 5;
    else if (exerciseIntensity.includes('imoderate')) aerobicProtection = 3;
    else aerobicProtection = 1;

    // NET CALCULATION
    // If Air is Clean: Dose (Low) - Protection (High) = Negative (Beneficial)
    // If Air is Toxic: Dose (High) - Protection (High) = Positive (Harmful)
    activeNet = inhaledDose - aerobicProtection;
  }

  // Normalization (divisor reduced 4.5 → 2.2 for increased acute sensitivity)
  // Net Result is added to Passive Dose.
  // If activeNet is negative (benefit), it REDUCES the Environmental Score.
  rawEnv = (passiveUnits + activeNet) / 2.2;

  // Indoor Air Quality — WHO: household air pollution = 3.8M deaths/yr
  // (Includes absorbed cooking fuel / biomass risk)
  if (indoorAirQuality === 'poor') rawEnv += 12;
  else if (indoorAirQuality === 'moderate') rawEnv += 6;

  const moduleEnv = Math.min(rawEnv, 35);

  // =================================================================
  // DOMAIN 4: SLEEP RECOVERY (Max 10 Points)
  // Circadian Brake — secondary systemic factor vs direct inhalation
  // NHANES: HR 1.35-1.70 for respiratory mortality at ≤5h
  // =================================================================
  let rawSleep = 0;
  const t = sleepHours;

  if (t < 5) rawSleep = 10;      // Max penalty (HR 1.35-1.70)
  else if (t < 6) rawSleep = 7;  // OR 1.346 restrictive impairment
  else if (t < 7) rawSleep = 3;  // Marginal inflammatory increase (HR ~1.15)
  else if (t > 9) rawSleep = 3;  // Restrictive/metabolic signal (OR 1.827)

  // Amplifier for disease (25-95% exacerbation increase in COPD)
  if ((hasCOPD || hasAsthma) && rawSleep > 0) rawSleep *= 1.3;

  const moduleSleep = Math.min(rawSleep, 10);

  // =================================================================
  // DOMAIN 5: DISEASE & SYMPTOMS (Max 15 Points)
  // DSSL Integration
  // =================================================================
  let rawDisease = 0;

  // Base Disease
  if (hasCOPD) rawDisease += 10;
  else if (hasAsthma) rawDisease += 7;
  else if (hasTB) rawDisease += 8;

  // DSSL Suppression Logic
  let suppressDyspnea = hasCOPD || hasAsthma;
  let suppressCough = hasCOPD || hasTB;
  let suppressWheeze = hasAsthma;
  let suppressTight = hasAsthma;

  // Add Unsuppressed Symptoms (2-4 pts each)
  if (hasDyspnea && !suppressDyspnea) rawDisease += 4;
  if (hasCough && !suppressCough) rawDisease += 3;
  if (hasWheezing && !suppressWheeze) rawDisease += 3;
  if (hasChestTight && !suppressTight) rawDisease += 3;

  // Acute infection always adds
  if (hasInfection) rawDisease += 5;

  // Functional Penalty (Breath Hold Failure) - added here as functional marker
  const breathThreshold = gender === 'female' ? 20 : 25;
  if (breathHoldSec > 0 && breathHoldSec < breathThreshold) {
    rawDisease += 3;
  }

  const moduleDisease = Math.min(rawDisease, 15);

  // =================================================================
  // FINAL SUMMATION
  // =================================================================
  const totalDamage = moduleBio + moduleBeh + moduleEnv + moduleSleep + moduleDisease;
  const clampedDamage = Math.min(totalDamage, 100);
  const lungHealthScore = Math.round(100 - clampedDamage);
  const label = getRiskLabel(lungHealthScore);

  return {
    score: lungHealthScore,
    label,
    breakdown: {
      biological: Number(moduleBio.toFixed(1)),
      behavioral: Number(moduleBeh.toFixed(1)),
      environmental: Number(moduleEnv.toFixed(1)),
      sleep: Number(moduleSleep.toFixed(1)),
      disease: Number(moduleDisease.toFixed(1)),
      totalDamage: Number(clampedDamage.toFixed(1)),
    },
  };
}


function App() {
  const [score, setScore] = useState(null);
  const [category, setCategory] = useState(null);

  const [breakdown, setBreakdown] = useState(null);
  const [userParams, setUserParams] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  const handleRetake = () => {
    setScore(null);
    setCategory(null);

    setBreakdown(null);
    setUserParams(null);
    setResetKey(prev => prev + 1);
    setTimeout(() => {
      document.getElementById('input-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCalculate = (formData) => {
    const result = calculateLungRisk(formData);

    const categoryObj = {
      label: result.label,
      color: getRiskCategoryColor(result.label),
    };

    setScore(result.score);
    setCategory(categoryObj);

    setBreakdown(result.breakdown || null);
    setUserParams({
      age: parseInt(formData.age) || 30,
      cigarettesPerDay: parseInt(formData.cigarettesPerDay) || 0,
      aqi: parseInt(formData.aqi) || 50,
      sleepHours: parseFloat(formData.sleepHours) || 7,
      maskType: formData.maskType || 'None',
      sex: formData.sex || 'Male',
      smoking: formData.smoking || 'No',
      vapingStatus: formData.vapingStatus || 'never',
      secondhandSmoke: formData.secondhandSmoke || 'No',
      medicalHistory: formData.medicalHistory || [],
      indoorAirQuality: formData.indoorAirQuality || 'good',

      exerciseFrequency: formData.exerciseFrequency || 'none',
      outdoorDuration: parseFloat(formData.outdoorDuration) || 0,
      occupationalExposure: formData.occupationalExposure || 'none',
    });

    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <HeroSection />
      <DamageSection />
      <InputSection key={resetKey} onCalculate={handleCalculate} />
      <ResultsSection score={score} category={category} breakdown={breakdown} userParams={userParams} onRetake={handleRetake} />
      <Footer />
    </div>
  )
}

export default App
