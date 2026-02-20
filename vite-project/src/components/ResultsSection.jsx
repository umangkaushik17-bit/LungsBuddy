import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, ReferenceLine
} from 'recharts';
import {
    ShieldCheck, AlertTriangle, Activity, Wind, Bed,
    HeartPulse, RefreshCw, TrendingUp, TrendingDown, ArrowUp,
    Brain, Flame, Stethoscope, Moon, Zap, BarChart3,
    Cigarette, Shield, Dumbbell, Check, Download, X, User
} from 'lucide-react';
import jsPDF from 'jspdf';

/* ===== Animated Circular Gauge ===== */
const ScoreGauge = ({ score, color }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = (animatedScore / 100) * circumference;

    useEffect(() => {
        let frame;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimatedScore(Math.round(eased * score));
            if (t < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    const getGradientId = () => {
        if (score >= 75) return 'gaugeGreen';
        if (score >= 50) return 'gaugeYellow';
        if (score >= 25) return 'gaugeOrange';
        return 'gaugeRed';
    };

    return (
        <div className="relative inline-flex items-center justify-center" style={{ '--glow-color': score >= 75 ? 'rgba(16,185,129,0.3)' : score >= 50 ? 'rgba(234,179,8,0.3)' : score >= 25 ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.3)' }}>
            <div className="animate-glowPulse">
                <svg width="200" height="200" className="-rotate-90">
                    <defs>
                        <linearGradient id="gaugeGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="gaugeYellow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#eab308" />
                            <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                        <linearGradient id="gaugeOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                        <linearGradient id="gaugeRed" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <circle cx="100" cy="100" r={radius} fill="none" stroke={`url(#${getGradientId()})`}
                        strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        style={{ transition: 'stroke-dashoffset 0.1s ease' }}
                    />
                </svg>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-extrabold ${color}`}>{animatedScore}</span>
                <span className="text-gray-500 text-sm mt-1">out of 100</span>
            </div>
        </div>
    );
};

/* ===== Module Breakdown Panel ===== */
const moduleConfig = [
    { key: 'biological', label: 'Biological', desc: 'Age, BMI, genetics', icon: Brain, color: '#06b6d4', bgColor: 'rgba(6,182,212,0.15)', max: 15 },
    { key: 'behavioral', label: 'Behavioral', desc: 'Smoking, vaping, habits', icon: Flame, color: '#f97316', bgColor: 'rgba(249,115,22,0.15)', max: 25 },
    { key: 'environmental', label: 'Environmental', desc: 'AQI, exercise dose', icon: Wind, color: '#22d3ee', bgColor: 'rgba(34,211,238,0.15)', max: 35 },
    { key: 'sleep', label: 'Sleep & Recovery', desc: 'Circadian health', icon: Moon, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)', max: 10 },
    { key: 'disease', label: 'Disease & Symptoms', desc: 'Conditions & DSSL', icon: HeartPulse, color: '#ec4899', bgColor: 'rgba(236,72,153,0.15)', max: 15 },
];

const BreakdownPanel = ({ breakdown, isInView }) => {
    if (!breakdown) return null;

    return (
        <div className="space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-400" />
                Module Breakdown
            </h3>
            <p className="text-xs text-gray-500 -mt-2">
                Points deducted per module — lower is better. Total capped at 100.
            </p>

            <div className="space-y-3">
                {moduleConfig.map((mod, i) => {
                    const val = breakdown[mod.key] || 0;
                    const pct = Math.min((val / mod.max) * 100, 100);
                    const Icon = mod.icon;

                    return (
                        <motion.div
                            key={mod.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: mod.bgColor }}
                                >
                                    <Icon className="w-4 h-4" style={{ color: mod.color }} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium text-gray-200">{mod.label}</span>
                                            <span className="text-[10px] text-gray-600 hidden sm:inline">{mod.desc}</span>
                                        </div>
                                        <span
                                            className="text-sm font-bold tabular-nums"
                                            style={{ color: val > 0 ? mod.color : 'rgba(255,255,255,0.2)' }}
                                        >
                                            {val.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                                        <div
                                            className="h-full rounded-full animate-barFill"
                                            style={{
                                                '--bar-width': `${pct}%`,
                                                '--bar-delay': `${0.7 + i * 0.1}s`,
                                                background: `linear-gradient(90deg, ${mod.color}cc, ${mod.color}88)`,
                                                boxShadow: val > 0 ? `0 0 8px ${mod.color}40` : 'none',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">Total Damage</span>
                <span className="text-lg font-bold text-white">{breakdown.totalDamage?.toFixed(1) || '0.0'}</span>
            </div>
        </div>
    );
};

/* ==========================================================================
   FEV1 PROJECTION DASHBOARD
   - Recharts-based 10-year lung capacity projection
   - Dual trajectories: Baseline (current habits) vs Optimized (corrected)
   - Interactive behavioral correction toggles
   ========================================================================== */

const interventions = [
    {
        id: 'quitSmoking',
        label: 'Quit Smoking',
        desc: 'Removes smoking-related FEV1 decline',
        icon: Cigarette,
        color: '#f97316',
        bgColor: 'rgba(249,115,22,0.12)',
        activeColor: 'rgba(249,115,22,0.25)',
        borderColor: 'rgba(249,115,22,0.3)',
    },
    {
        id: 'wearN95',
        label: 'Wear N95 Mask in High AQI',
        desc: 'Reduces particulate exposure by ~95%',
        icon: Shield,
        color: '#22d3ee',
        bgColor: 'rgba(34,211,238,0.12)',
        activeColor: 'rgba(34,211,238,0.25)',
        borderColor: 'rgba(34,211,238,0.3)',
    },
    {
        id: 'optimizeSleep',
        label: 'Optimize Sleep (7-8 hrs)',
        desc: 'Reduces inflammatory markers',
        icon: Moon,
        color: '#8b5cf6',
        bgColor: 'rgba(139,92,246,0.12)',
        activeColor: 'rgba(139,92,246,0.25)',
        borderColor: 'rgba(139,92,246,0.3)',
    },
    {
        id: 'exercise',
        label: 'Initiate Aerobic Exercise',
        desc: 'Recovers ~8 mL/year lung capacity',
        icon: Dumbbell,
        color: '#10b981',
        bgColor: 'rgba(16,185,129,0.12)',
        activeColor: 'rgba(16,185,129,0.25)',
        borderColor: 'rgba(16,185,129,0.3)',
    },
];

/* Custom Recharts Tooltip */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length < 2) return null;
    const baseline = payload.find(p => p.dataKey === 'baseline');
    const optimized = payload.find(p => p.dataKey === 'optimized');
    const delta = optimized && baseline ? (optimized.value - baseline.value) : 0;

    return (
        <div className="rounded-xl border border-white/10 p-4 shadow-2xl"
            style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)' }}>
            <p className="text-xs text-gray-400 font-semibold mb-2">Year {label}</p>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }}></span>
                    <span className="text-xs text-gray-400">Baseline:</span>
                    <span className="text-sm font-bold text-red-400">{baseline?.value?.toFixed(2)} L</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }}></span>
                    <span className="text-xs text-gray-400">Optimized:</span>
                    <span className="text-sm font-bold text-emerald-400">{optimized?.value?.toFixed(2)} L</span>
                </div>
                {delta > 0 && (
                    <div className="pt-1 border-t border-white/5 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-semibold">+{(delta * 1000).toFixed(0)} mL saved</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const FEV1Dashboard = ({ score, userParams, isInView }) => {
    const [toggles, setToggles] = useState({
        quitSmoking: false,
        wearN95: false,
        optimizeSleep: false,
        exercise: false,
    });

    if (!userParams) return null;

    const { age, cigarettesPerDay, aqi, sleepHours } = userParams;

    // Estimate baseline FEV1 from age + score
    // Normal predicted FEV1 ≈ 4.0 L at 25, declining ~30mL/year after 25
    const normalFEV1 = Math.max(4.0 - Math.max(age - 25, 0) * 0.030, 1.5);
    const baselineFEV1 = normalFEV1 * (score / 100); // Damage-adjusted

    // ---- Calculate annual decline rates ----
    const AGING_DECLINE = 30; // mL/year — normal aging

    // Smoking: -15 mL/year per 10 cigarettes
    const smokingPenalty = cigarettesPerDay > 0 ? (cigarettesPerDay / 10) * 15 : 0;

    // Poor sleep: -5 mL/year if < 7 hours
    const sleepPenalty = sleepHours < 7 ? 5 : 0;

    // High AQI: -12 mL/year if > 100
    const aqiPenalty = aqi > 100 ? 12 : 0;

    // Exercise recovery: +8 mL/year
    const exerciseBonus = 8;

    // --- Build chart data ---
    const chartData = useMemo(() => {
        const data = [];
        for (let year = 0; year <= 10; year++) {
            // Baseline decline (all penalties active)
            const baselineDecline = (AGING_DECLINE + smokingPenalty + sleepPenalty + aqiPenalty) * year;
            const baselineVal = Math.max(baselineFEV1 - baselineDecline / 1000, 0.3);

            // Optimized decline (subtract toggled penalties, add exercise)
            let optDecline = AGING_DECLINE;
            if (!toggles.quitSmoking) optDecline += smokingPenalty;
            if (!toggles.wearN95) optDecline += aqiPenalty;
            if (!toggles.optimizeSleep) optDecline += sleepPenalty;
            if (toggles.exercise) optDecline = Math.max(optDecline - exerciseBonus, 0);
            const optVal = Math.max(baselineFEV1 - (optDecline * year) / 1000, 0.3);

            data.push({
                year,
                baseline: parseFloat(baselineVal.toFixed(3)),
                optimized: parseFloat(optVal.toFixed(3)),
            });
        }
        return data;
    }, [baselineFEV1, smokingPenalty, sleepPenalty, aqiPenalty, toggles]);

    // Total saved at Year 10
    const totalSaved = Math.max(
        (chartData[10].optimized - chartData[10].baseline) * 1000, 0
    ).toFixed(0);

    const handleToggle = (id) => {
        setToggles(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const activeCount = Object.values(toggles).filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-400" />
                    10-Year FEV1 Projection
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                        Baseline FEV1: <span className="text-white font-semibold">{baselineFEV1.toFixed(2)} L</span>
                    </span>
                    {activeCount > 0 && (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            {activeCount} correction{activeCount > 1 ? 's' : ''} active
                        </span>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="w-full" style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 6 }}>
                        <defs>
                            <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

                        <XAxis
                            dataKey="year"
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            tickFormatter={(v) => `Yr ${v}`}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            interval={0}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            tickFormatter={(v) => `${v}L`}
                            domain={[0, 'auto']}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            allowDataOverflow={false}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />

                        {/* Area fills */}
                        <Area type="monotone" dataKey="baseline" fill="url(#baselineGrad)" stroke="none" />
                        <Area type="monotone" dataKey="optimized" fill="url(#optimizedGrad)" stroke="none" />

                        {/* Baseline line */}
                        <Line
                            type="monotone"
                            dataKey="baseline"
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#ef4444', stroke: '#ef4444', strokeWidth: 3, strokeOpacity: 0.3 }}
                            name="Baseline"
                        />

                        {/* Optimized line */}
                        <Line
                            type="monotone"
                            dataKey="optimized"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            strokeDasharray={activeCount > 0 ? "0" : "6 3"}
                            dot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#10b981', stroke: '#10b981', strokeWidth: 3, strokeOpacity: 0.3 }}
                            name="Optimized"
                        />

                        {/* Reference line at Year 5 */}
                        <ReferenceLine x={5} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4"
                            label={{ value: '5yr', fill: 'rgba(255,255,255,0.15)', fontSize: 10, position: 'top' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 rounded bg-red-500"></span>
                    <span className="text-xs text-gray-400">Baseline (Current Habits)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 rounded bg-emerald-500"></span>
                    <span className="text-xs text-gray-400">Optimized (With Corrections)</span>
                </div>
            </div>

            {/* Behavioral Toggles */}
            <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Behavioral Corrections</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {interventions.map((item) => {
                        const Icon = item.icon;
                        const active = toggles[item.id];
                        const isDisabled =
                            (item.id === 'quitSmoking' && cigarettesPerDay === 0) ||
                            (item.id === 'wearN95' && aqi <= 100) ||
                            (item.id === 'optimizeSleep' && sleepHours >= 7);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => !isDisabled && handleToggle(item.id)}
                                disabled={isDisabled}
                                className={`
                                    relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 text-left cursor-pointer
                                    ${isDisabled
                                        ? 'opacity-35 cursor-not-allowed border-white/5 bg-white/[0.02]'
                                        : active
                                            ? 'border-opacity-100 shadow-lg'
                                            : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/12 hover:-translate-y-0.5 hover:shadow-md'
                                    }
                                `}
                                style={active && !isDisabled ? {
                                    background: item.activeColor,
                                    borderColor: item.borderColor,
                                    boxShadow: `0 0 20px ${item.color}20`,
                                } : {}}
                            >
                                {/* Checkbox */}
                                <div className={`
                                    w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all
                                    ${active
                                        ? 'border-transparent'
                                        : 'border-white/15 bg-white/5'
                                    }
                                `}
                                    style={active ? { background: item.color } : {}}
                                >
                                    {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>

                                {/* Icon */}
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: item.bgColor }}>
                                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                                </div>

                                {/* Text */}
                                <div className="min-w-0">
                                    <span className={`text-sm font-medium block ${active ? 'text-white' : 'text-gray-300'}`}>
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] text-gray-500 block">{item.desc}</span>
                                </div>

                                {/* Disabled badge */}
                                {isDisabled && (
                                    <span className="absolute top-2 right-2 text-[9px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                                        N/A
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary Stats */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView && activeCount > 0 ? { opacity: 1, y: 0 } : { opacity: activeCount > 0 ? 1 : 0.4, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border p-5 flex items-center justify-between flex-wrap gap-4"
                style={{
                    background: activeCount > 0
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))'
                        : 'rgba(255,255,255,0.02)',
                    borderColor: activeCount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                }}
            >
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Lung Capacity Saved Over 10 Years</p>
                    <p className="text-3xl font-extrabold">
                        {activeCount > 0 ? (
                            <span className="text-emerald-400">+{totalSaved} mL</span>
                        ) : (
                            <span className="text-gray-600">— select corrections above —</span>
                        )}
                    </p>
                </div>
                {activeCount > 0 && (
                    <div className="flex items-center gap-2 text-emerald-400">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-semibold">
                            {((parseFloat(totalSaved) / (baselineFEV1 * 1000)) * 100).toFixed(1)}% preserved
                        </span>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

/* ===== Personalized Recommendations Engine ===== */
const getRecommendations = (score, breakdown, userParams) => {
    const recs = [];
    const p = userParams || {};
    const b = breakdown || {};
    const conditions = (p.medicalHistory || []).map(c => c.toLowerCase());
    const isSmoker = p.smoking === 'Yes' || p.smoking === 'current';
    const isVaper = (p.vapingStatus || '').toLowerCase() === 'current';

    // --- STATUS (always first) ---
    if (score >= 75) {
        recs.push({ icon: ShieldCheck, text: 'Great work! Your lungs are in healthy condition — maintain your current habits', category: 'Status' });
    } else if (score >= 50) {
        recs.push({ icon: AlertTriangle, text: 'Your lung health needs attention — monitor regularly and address key risk factors below', category: 'Status' });
    } else {
        recs.push({ icon: HeartPulse, text: 'Consult a pulmonologist for a detailed checkup — your risk level is significant', category: 'Urgent' });
    }

    // --- BEHAVIORAL (Smoking / Vaping) ---
    if (isSmoker) {
        recs.push({ icon: Cigarette, text: `Quit smoking — at ${p.cigarettesPerDay || 0} cigs/day, this is your most impactful reversible factor`, category: 'Urgent' });
    }
    if (isVaper) {
        recs.push({ icon: Flame, text: 'Stop vaping — e-cigarette aerosols cause airway inflammation and EVALI risk', category: 'Urgent' });
    }
    if (p.secondhandSmoke === 'Yes' && !isSmoker) {
        recs.push({ icon: Shield, text: 'Avoid secondhand smoke exposure — it contributes to passive lung damage', category: 'Protection' });
    }

    // --- ENVIRONMENTAL (AQI / Indoor / Biomass) ---
    if (p.aqi > 150) {
        recs.push({ icon: Shield, text: `Your area AQI is ${p.aqi} (hazardous) — always wear an N95 mask outdoors`, category: 'Protection' });
    } else if (p.aqi > 100 && (!p.maskType || p.maskType.toLowerCase() === 'none')) {
        recs.push({ icon: Shield, text: `AQI ${p.aqi} is unhealthy — consider wearing a mask on high pollution days`, category: 'Protection' });
    }
    if (p.outdoorDuration > 6 && p.aqi > 100) {
        recs.push({ icon: Wind, text: `${p.outdoorDuration}h outdoors at AQI ${p.aqi} is very high exposure — reduce outdoor time during peak hours`, category: 'Protection' });
    }
    if ((p.indoorAirQuality || '').toLowerCase() === 'poor') {
        recs.push({ icon: Wind, text: 'Install an air purifier at home — poor indoor air causes 3.8M deaths/year (WHO)', category: 'Environment' });
    }


    if ((p.occupationalExposure || '').toLowerCase().includes('high')) {
        recs.push({ icon: Shield, text: 'Use respiratory PPE at work — high occupational dust/fume exposure adds significant risk', category: 'Protection' });
    }

    // --- SLEEP ---
    if (p.sleepHours < 6) {
        recs.push({ icon: Moon, text: `You sleep ${p.sleepHours}h — aim for 7-8h. Short sleep increases respiratory infection risk by 4.2×`, category: 'Lifestyle' });
    } else if (p.sleepHours > 9) {
        recs.push({ icon: Moon, text: `${p.sleepHours}h sleep is elevated — long sleep is linked to restrictive lung defects (OR 1.8)`, category: 'Lifestyle' });
    }

    // --- MEDICAL CONDITIONS ---
    if (conditions.includes('copd')) {
        recs.push({ icon: Stethoscope, text: 'Schedule regular pulmonologist visits for COPD management and spirometry monitoring', category: 'Medical' });
    }
    if (conditions.includes('asthma')) {
        recs.push({ icon: Stethoscope, text: 'Keep rescue inhaler accessible and track your asthma triggers consistently', category: 'Medical' });
    }
    if (conditions.includes('tb')) {
        recs.push({ icon: Stethoscope, text: 'Complete TB treatment protocol fully — watch for night sweats or weight loss (reactivation signs)', category: 'Medical' });
    }

    // --- EXERCISE ---
    if ((p.exerciseFrequency || 'none').toLowerCase() === 'none') {
        recs.push({ icon: Dumbbell, text: 'Start light cardiovascular exercise — even 20 min of walking improves lung capacity', category: 'Lifestyle' });
    } else if (p.aqi <= 80) {
        recs.push({ icon: Dumbbell, text: 'Your air quality supports outdoor exercise — keep up your routine for aerobic benefit', category: 'Lifestyle' });
    }

    // --- DOMAIN-DRIVEN (from breakdown scores) ---
    if (b.environmental > 15) {
        recs.push({ icon: Wind, text: 'Environmental exposure is your top risk driver — prioritize air quality improvements', category: 'Environment' });
    }
    if (b.behavioral > 10 && !isSmoker && !isVaper) {
        recs.push({ icon: Activity, text: 'Behavioral factors are impacting your score — review secondhand smoke and lifestyle habits', category: 'Lifestyle' });
    }

    // Ensure at least 2 recommendations
    if (recs.length < 2) {
        recs.push({ icon: TrendingUp, text: 'Continue your healthy habits and reassess periodically', category: 'Lifestyle' });
    }

    return recs;
};

/* ===== PDF Health Report Generator ===== */
const generateHealthReport = (userName, score, category, breakdown, userParams) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = 210, H = 297;
    const recs = getRecommendations(score, breakdown, userParams);

    // --- Colors ---
    const bg = [15, 23, 42];
    const cardBg = [30, 41, 59];
    const teal = [20, 184, 166];
    const white = [255, 255, 255];
    const gray400 = [156, 163, 175];
    const gray500 = [107, 114, 128];
    const scoreColor = score >= 75 ? [16, 185, 129] : score >= 50 ? [234, 179, 8] : score >= 25 ? [249, 115, 22] : [239, 68, 68];

    // --- Helper: draw filled arc (pie slice) via triangle fan ---
    const drawArc = (acx, acy, r, startAngle, endAngle, color) => {
        doc.setFillColor(...color);
        doc.setDrawColor(...color);
        doc.setLineWidth(0.1);
        const steps = Math.max(Math.ceil(Math.abs(endAngle - startAngle) / 0.05), 4);
        const pts = [[acx, acy]];
        for (let i = 0; i <= steps; i++) {
            const a = startAngle + (endAngle - startAngle) * (i / steps);
            pts.push([acx + r * Math.cos(a), acy + r * Math.sin(a)]);
        }
        for (let i = 1; i < pts.length - 1; i++) {
            doc.triangle(pts[0][0], pts[0][1], pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 'F');
        }
    };

    // ===== PAGE 1 =====
    doc.setFillColor(...bg);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...teal);
    doc.rect(0, 0, W, 3, 'F');

    // Header
    doc.setFontSize(28);
    doc.setTextColor(...teal);
    doc.text('LungBuddy', 20, 22);
    doc.setFontSize(10);
    doc.setTextColor(...gray500);
    doc.text('AI Lung Health Assessment Report', 20, 29);

    // Patient info card
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(15, 35, W - 30, 18, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...white);
    doc.text(`Patient:  ${userName}`, 22, 44);
    doc.setTextColor(...gray400);
    doc.text(`Date:  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 22, 49);
    doc.text('Generated by LungBuddy v3.2', W - 22, 44, { align: 'right' });

    // --- Score Section (no progress bar) ---
    let y = 62;
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(15, y, W - 30, 38, 3, 3, 'F');

    const cx = 50, cy = y + 19;
    doc.setDrawColor(50, 60, 80);
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, 14, 'S');
    doc.setDrawColor(...scoreColor);
    doc.setLineWidth(2.2);
    doc.circle(cx, cy, 14, 'S');
    doc.setFontSize(20);
    doc.setTextColor(...scoreColor);
    doc.text(`${score}`, cx, cy + 2.5, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(...gray500);
    doc.text('out of 100', cx, cy + 8, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(...scoreColor);
    doc.text(category?.label || 'N/A', 80, y + 16);
    doc.setFontSize(9);
    doc.setTextColor(...gray400);
    const statusMsg = score >= 75 ? 'Your lungs are in healthy condition.' : score >= 50 ? 'Your lungs need attention.' : 'Your lung health requires immediate attention.';
    doc.text(statusMsg, 80, y + 24);

    // --- Donut Pie Chart: Module Breakdown ---
    y = 108;
    doc.setFontSize(13);
    doc.setTextColor(...teal);
    doc.text('Module Breakdown', 20, y);
    doc.setFontSize(7);
    doc.setTextColor(...gray500);
    doc.text('Points deducted per module \u2014 lower is better', 20, y + 6);

    const modules = [
        { key: 'biological', label: 'Biological', max: 15, color: [6, 182, 212] },
        { key: 'behavioral', label: 'Behavioral', max: 25, color: [249, 115, 22] },
        { key: 'environmental', label: 'Environmental', max: 35, color: [34, 211, 238] },
        { key: 'sleep', label: 'Sleep & Recovery', max: 10, color: [59, 130, 246] },
        { key: 'disease', label: 'Disease & Symptoms', max: 15, color: [236, 72, 153] },
    ];

    if (breakdown) {
        const pieCx = 55, pieCy = y + 40, pieR = 22;
        const totalDmg = breakdown.totalDamage || 0.1;
        let startAngle = -Math.PI / 2;

        modules.forEach((mod) => {
            const val = breakdown[mod.key] || 0;
            if (val <= 0) return;
            const sliceAngle = (val / Math.max(totalDmg, 1)) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;
            drawArc(pieCx, pieCy, pieR, startAngle, endAngle, mod.color);
            startAngle = endAngle;
        });

        // Donut hole
        doc.setFillColor(...bg);
        doc.circle(pieCx, pieCy, 12, 'F');
        doc.setFontSize(10);
        doc.setTextColor(...white);
        doc.text(`${totalDmg.toFixed(1)}`, pieCx, pieCy + 1, { align: 'center' });
        doc.setFontSize(5);
        doc.setTextColor(...gray500);
        doc.text('total dmg', pieCx, pieCy + 5, { align: 'center' });

        // Legend (right side)
        let ly = y + 18;
        modules.forEach((mod) => {
            const val = breakdown[mod.key] || 0;
            doc.setFillColor(...mod.color);
            doc.circle(92, ly - 1, 2, 'F');
            doc.setFontSize(9);
            doc.setTextColor(...white);
            doc.text(mod.label, 97, ly);
            doc.setTextColor(...mod.color);
            doc.text(`${val.toFixed(1)} / ${mod.max}`, W - 22, ly, { align: 'right' });
            ly += 8;
        });
    }

    // --- Recommendations ---
    y = 178;
    doc.setFontSize(13);
    doc.setTextColor(...teal);
    doc.text('Personalized Recommendations', 20, y);
    y += 8;

    recs.forEach((rec) => {
        if (y > 270) {
            doc.addPage();
            doc.setFillColor(...bg);
            doc.rect(0, 0, W, H, 'F');
            y = 20;
        }
        const catColor = rec.category === 'Urgent' ? [239, 68, 68] : rec.category === 'Protection' ? [34, 211, 238] : rec.category === 'Medical' ? [236, 72, 153] : rec.category === 'Environment' ? [16, 185, 129] : [...gray400];
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        const lines = doc.splitTextToSize(rec.text, W - 58);
        const blockH = Math.max(10, lines.length * 4 + 8);
        doc.roundedRect(15, y, W - 30, blockH, 2, 2, 'F');
        doc.setFillColor(...catColor);
        doc.roundedRect(22, y + 2, 2, blockH - 4, 1, 1, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...white);
        doc.text(lines, 28, y + 6);
        doc.setFontSize(6);
        doc.setTextColor(...catColor);
        doc.text(rec.category.toUpperCase(), W - 22, y + 6, { align: 'right' });
        y += blockH + 3;
    });

    // ===== PAGE 2: FEV1 Projection + Behavioral Corrections =====
    if (userParams) {
        doc.addPage();
        doc.setFillColor(...bg);
        doc.rect(0, 0, W, H, 'F');
        doc.setFillColor(...teal);
        doc.rect(0, 0, W, 3, 'F');

        const { age, cigarettesPerDay, aqi, sleepHours } = userParams;
        const normalFEV1 = Math.max(4.0 - Math.max(age - 25, 0) * 0.030, 1.5);
        const baselineFEV1 = normalFEV1 * (score / 100);
        const AGING_DECLINE = 30;
        const smokingPenalty = cigarettesPerDay > 0 ? (cigarettesPerDay / 10) * 15 : 0;
        const sleepPenalty = sleepHours < 7 ? 5 : 0;
        const aqiPenalty = aqi > 100 ? 12 : 0;
        const exerciseBonus = 8;

        // Build chart data — baseline (all penalties) vs optimized (all corrections applied)
        const chartData = [];
        for (let yr = 0; yr <= 10; yr++) {
            const bDecline = (AGING_DECLINE + smokingPenalty + sleepPenalty + aqiPenalty) * yr;
            const bVal = Math.max(baselineFEV1 - bDecline / 1000, 0.3);
            const oDecline = Math.max(AGING_DECLINE - exerciseBonus, 0);
            const oVal = Math.max(baselineFEV1 - (oDecline * yr) / 1000, 0.3);
            chartData.push({ year: yr, baseline: bVal, optimized: oVal });
        }

        const totalSaved = Math.max((chartData[10].optimized - chartData[10].baseline) * 1000, 0);

        // --- Title ---
        y = 16;
        doc.setFontSize(13);
        doc.setTextColor(...teal);
        doc.text('10-Year FEV1 Projection', 20, y);
        doc.setFontSize(8);
        doc.setTextColor(...gray500);
        doc.text(`Baseline FEV1: ${baselineFEV1.toFixed(2)} L`, 20, y + 7);

        // --- Draw Line Graph ---
        const gx = 30, gy = 38, gw = 150, gh = 80;
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.roundedRect(gx - 15, gy - 8, gw + 30, gh + 25, 3, 3, 'F');

        const maxFEV = Math.ceil(baselineFEV1 * 10) / 10 + 0.1;
        const minFEV = Math.max(Math.floor(chartData[10].baseline * 10) / 10 - 0.1, 0);
        const yRange = Math.max(maxFEV - minFEV, 0.1);

        // Grid lines
        doc.setDrawColor(50, 60, 80);
        doc.setLineWidth(0.15);
        for (let i = 0; i <= 4; i++) {
            const gridY = gy + (i / 4) * gh;
            doc.line(gx, gridY, gx + gw, gridY);
            const label = (maxFEV - (i / 4) * yRange).toFixed(1);
            doc.setFontSize(6);
            doc.setTextColor(...gray500);
            doc.text(`${label}L`, gx - 3, gridY + 1, { align: 'right' });
        }

        // X-axis labels
        for (let yr = 0; yr <= 10; yr += 2) {
            const xPos = gx + (yr / 10) * gw;
            doc.setFontSize(6);
            doc.setTextColor(...gray500);
            doc.text(`Yr ${yr}`, xPos, gy + gh + 6, { align: 'center' });
        }

        const plotX = (yr) => gx + (yr / 10) * gw;
        const plotY = (val) => gy + ((maxFEV - val) / yRange) * gh;

        // Baseline line (red)
        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.8);
        for (let i = 0; i < 10; i++) {
            doc.line(plotX(i), plotY(chartData[i].baseline), plotX(i + 1), plotY(chartData[i + 1].baseline));
        }
        for (let i = 0; i <= 10; i++) {
            doc.setFillColor(239, 68, 68);
            doc.circle(plotX(i), plotY(chartData[i].baseline), 1, 'F');
        }

        // Optimized line (green)
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.8);
        for (let i = 0; i < 10; i++) {
            doc.line(plotX(i), plotY(chartData[i].optimized), plotX(i + 1), plotY(chartData[i + 1].optimized));
        }
        for (let i = 0; i <= 10; i++) {
            doc.setFillColor(16, 185, 129);
            doc.circle(plotX(i), plotY(chartData[i].optimized), 1, 'F');
        }

        // Legend
        const legY = gy + gh + 14;
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(gx + 20, legY, 8, 2, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setTextColor(...gray400);
        doc.text('Baseline (Current Habits)', gx + 30, legY + 2);
        doc.setFillColor(16, 185, 129);
        doc.roundedRect(gx + 85, legY, 8, 2, 1, 1, 'F');
        doc.text('Optimized (All Corrections)', gx + 95, legY + 2);

        // --- Behavioral Corrections ---
        y = gy + gh + 30;
        doc.setFontSize(13);
        doc.setTextColor(...teal);
        doc.text('Behavioral Corrections', 20, y);
        doc.setFontSize(7);
        doc.setTextColor(...gray500);
        doc.text('Applying all corrections below yields the optimized projection', 20, y + 6);
        y += 10;

        const allInterventions = [
            { label: 'Quit Smoking', desc: 'Removes smoking-related FEV1 decline', color: [249, 115, 22], applicable: cigarettesPerDay > 0 },
            { label: 'Wear N95 Mask', desc: 'Reduces particulate exposure by ~95%', color: [34, 211, 238], applicable: aqi > 100 },
            { label: 'Optimize Sleep (7-8 hrs)', desc: 'Reduces inflammatory markers', color: [139, 92, 246], applicable: sleepHours < 7 },
            { label: 'Aerobic Exercise', desc: 'Recovers ~8 mL/year lung capacity', color: [16, 185, 129], applicable: true },
        ];

        allInterventions.forEach((item) => {
            doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
            doc.roundedRect(15, y, W - 30, 12, 2, 2, 'F');

            // Color indicator
            doc.setFillColor(...item.color);
            doc.roundedRect(22, y + 3, 6, 6, 1, 1, 'F');

            doc.setFontSize(9);
            doc.setTextColor(...white);
            doc.text(item.label, 32, y + 6);
            doc.setFontSize(7);
            doc.setTextColor(...gray500);
            doc.text(item.desc, 32, y + 10);

            doc.setFontSize(7);
            if (item.applicable) {
                doc.setTextColor(...item.color);
                doc.text('RECOMMENDED', W - 22, y + 7, { align: 'right' });
            } else {
                doc.setTextColor(...gray500);
                doc.text('N/A', W - 22, y + 7, { align: 'right' });
            }

            y += 15;
        });

        // Summary card
        if (totalSaved > 0) {
            y += 5;
            doc.setFillColor(16, 80, 60);
            doc.roundedRect(15, y, W - 30, 16, 3, 3, 'F');
            doc.setFontSize(10);
            doc.setTextColor(16, 185, 129);
            doc.text(`+${totalSaved.toFixed(0)} mL`, 22, y + 7);
            doc.setFontSize(8);
            doc.setTextColor(...gray400);
            doc.text('lung capacity saved over 10 years with all corrections', 50, y + 7);
            doc.setFontSize(8);
            doc.setTextColor(16, 185, 129);
            doc.text(`${((totalSaved / (baselineFEV1 * 1000)) * 100).toFixed(1)}% preserved`, W - 22, y + 7, { align: 'right' });
        }

        // Footer on page 2
        const footerY2 = H - 12;
        doc.setDrawColor(50, 60, 80);
        doc.setLineWidth(0.2);
        doc.line(20, footerY2 - 4, W - 20, footerY2 - 4);
        doc.setFontSize(7);
        doc.setTextColor(...gray500);
        doc.text('This report is generated by LungBuddy and is for informational purposes only. It does not constitute medical advice.', W / 2, footerY2, { align: 'center' });
        doc.text('Consult a qualified healthcare professional for diagnosis and treatment.', W / 2, footerY2 + 4, { align: 'center' });
    }

    // Footer on page 1
    const footerY = H - 12;
    doc.setPage(1);
    doc.setDrawColor(50, 60, 80);
    doc.setLineWidth(0.2);
    doc.line(20, footerY - 4, W - 20, footerY - 4);
    doc.setFontSize(7);
    doc.setTextColor(...gray500);
    doc.text('This report is generated by LungBuddy and is for informational purposes only. It does not constitute medical advice.', W / 2, footerY, { align: 'center' });
    doc.text('Consult a qualified healthcare professional for diagnosis and treatment.', W / 2, footerY + 4, { align: 'center' });

    doc.save(`LungBuddy_Report_${userName.replace(/\s+/g, '_')}.pdf`);
};

/* ===== Name Input Modal ===== */
const NameModal = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (!isOpen) setName('');
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))', backdropFilter: 'blur(20px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(6,182,212,0.1))' }}>
                                <Download className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Download Report</h3>
                                <p className="text-xs text-gray-500">Enter your name for the health report</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="relative mb-6">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!name.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                                style={{
                                    background: name.trim() ? 'linear-gradient(135deg, #14b8a6, #06b6d4)' : 'rgba(255,255,255,0.05)',
                                    boxShadow: name.trim() ? '0 0 20px rgba(20,184,166,0.3)' : 'none',
                                }}
                            >
                                <Download className="w-4 h-4" />
                                Generate PDF Report
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ===== Main Results Section ===== */
const ResultsSection = ({ score, category, breakdown, userParams, onRetake }) => {
    const sectionRef = useRef(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

    const getCategoryStyle = (label) => {
        switch (label) {
            case 'Optimal': return { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' };
            case 'Good': return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', glow: 'shadow-green-500/10' };
            case 'Healthy': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' };
            case 'Moderate': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/10' };
            case 'High Risk': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-500/10' };
            case 'Critical': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-red-500/10' };
            default: return { color: 'text-white', bg: 'bg-white/5', border: 'border-white/10', glow: '' };
        }
    };

    const getScoreMessage = (s) => {
        if (s >= 90) return 'Excellent! Your lung health is in optimal condition.';
        if (s >= 75) return 'Good job! Your lungs are healthy with minor considerations.';
        if (s >= 50) return 'Your lungs need attention. Follow the recommendations below.';
        if (s >= 25) return 'Your lung health requires immediate attention.';
        return 'Critical condition. Please consult a healthcare professional immediately.';
    };

    return (
        <section
            id="results-section"
            ref={sectionRef}
            className="relative min-h-screen flex items-center justify-center section-padding overflow-hidden"
            style={{ background: 'var(--bg-secondary)' }}
        >
            <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
            <div className="absolute inset-0 bg-radial-teal pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent"></div>

            {score !== null ? (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="relative z-10 max-w-5xl w-full"
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium mb-4"
                            style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(6,182,212,0.08))', borderColor: 'rgba(20,184,166,0.25)', color: '#5eead4' }}
                        >
                            <Activity className="w-3 h-3" />
                            Assessment Complete
                        </motion.span>
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            <span className="gradient-text">Your Lung Health</span>{' '}
                            <span className="text-white">Report</span>
                        </h2>
                        <p className="text-gray-400 mt-3 text-base">
                            Based on your inputs, here is your personalized lung health analysis.
                        </p>
                    </div>

                    {/* Row 1: Score + Recommendations */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Score Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`glass-card-static p-8 flex flex-col items-center justify-center shadow-xl ${getCategoryStyle(category?.label).glow}`}
                        >
                            <ScoreGauge score={score} color={category?.color || 'text-white'} />

                            {category && (
                                <div className={`mt-6 px-5 py-2 rounded-full border ${getCategoryStyle(category.label).bg} ${getCategoryStyle(category.label).border}`}>
                                    <span className={`text-sm font-bold ${getCategoryStyle(category.label).color}`}>
                                        {category.label}
                                    </span>
                                </div>
                            )}

                            <p className="text-gray-500 text-xs mt-4 text-center max-w-xs">
                                {getScoreMessage(score)}
                            </p>
                        </motion.div>

                        {/* Recommendations Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="glass-card-static p-8 shadow-xl"
                        >
                            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-teal-400" />
                                Recommendations
                            </h3>
                            <div className="space-y-3">
                                {getRecommendations(score, breakdown, userParams).map(({ icon: Icon, text, category: cat }, i) => {
                                    const catClass = cat === 'Status' ? 'rec-status' : cat === 'Lifestyle' ? 'rec-lifestyle' : cat === 'Protection' ? 'rec-protection' : cat === 'Urgent' ? 'rec-urgent' : cat === 'Medical' ? 'rec-medical' : 'rec-environment';
                                    return (
                                        <motion.div
                                            key={text}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                                            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] hover:translate-x-1 transition-all duration-300 group"
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(6,182,212,0.08))' }}>
                                                <Icon className="w-4 h-4 text-teal-400" />
                                            </div>
                                            <div>
                                                <p className="text-gray-300 text-sm">{text}</p>
                                                <span className={`inline-block text-[10px] uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full font-medium ${catClass}`}>{cat}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* Row 2: Breakdown */}
                    {breakdown && (
                        <div className="grid lg:grid-cols-1 gap-6 mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.5 }}
                                className="glass-card-static p-8 shadow-xl"
                            >
                                <BreakdownPanel breakdown={breakdown} isInView={isInView} />
                            </motion.div>
                        </div>
                    )}

                    {/* Row 3: FEV1 Projection Dashboard (FULL WIDTH) */}
                    {userParams && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="glass-card-static p-8 shadow-xl mt-6"
                        >
                            <FEV1Dashboard score={score} userParams={userParams} isInView={isInView} />
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.8 }}
                        className="flex items-center justify-center gap-4 mt-10 flex-wrap"
                    >
                        <button
                            onClick={() => setShowNameModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 cursor-pointer group active:scale-[0.97] hover:-translate-y-0.5 hover:shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
                                boxShadow: '0 0 20px rgba(20,184,166,0.2)',
                            }}
                        >
                            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                            Download Health Report
                        </button>
                        <button
                            onClick={onRetake}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-teal-500/30 hover:bg-teal-500/5 transition-all duration-300 cursor-pointer group active:scale-[0.97]"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Retake Assessment
                        </button>
                    </motion.div>

                    {/* Name Modal for PDF */}
                    <NameModal
                        isOpen={showNameModal}
                        onClose={() => setShowNameModal(false)}
                        onSubmit={(name) => {
                            setShowNameModal(false);
                            generateHealthReport(name, score, category, breakdown, userParams);
                        }}
                    />
                </motion.div>
            ) : (
                <div className="relative z-10 max-w-lg w-full text-center">
                    <div className="glass-card-static p-12">
                        <div className="relative w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <div className="absolute inset-0 rounded-2xl border border-teal-500/20 animate-softPulse" />
                            <ArrowUp className="w-8 h-8 text-gray-500 animate-float" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-400 mb-2">
                            <span className="gradient-text">No Results Yet</span>
                        </h2>
                        <p className="text-gray-600 text-sm">
                            Complete the assessment above to see your personalized lung health report.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ResultsSection;
