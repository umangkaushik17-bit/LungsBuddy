import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import {
    User, Thermometer, Wind, Cigarette, Stethoscope,
    ChevronRight, ChevronLeft, MapPin, Search, Clock,
    Timer, Keyboard, ArrowRight, Moon, Dumbbell,
    ShieldCheck, Activity, Heart, AlertCircle, Zap
} from 'lucide-react';

const API_KEY = "f5d09f5cd47cd2918cd30e660fff21d3";

/* ===== Custom Select Component ===== */
const CustomSelect = ({ label, name, value, options, onChange, icon: Icon, hint, error, onSelectDone }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const ref = useRef(null);
    const hoverTimeout = useRef(null);
    const leaveTimeout = useRef(null);

    const filteredOptions = options.filter(o => o.value !== '');

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlight when dropdown opens
    useEffect(() => {
        if (isOpen) {
            const currentIdx = filteredOptions.findIndex(o => o.value === value);
            setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
        }
    }, [isOpen]);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
        setHighlightedIndex(-1);
        // After selecting, advance to next field
        setTimeout(() => {
            if (onSelectDone) onSelectDone();
        }, 50);
    };

    const handleMouseEnter = () => {
        clearTimeout(leaveTimeout.current);
        hoverTimeout.current = setTimeout(() => setIsOpen(true), 80);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeout.current);
        leaveTimeout.current = setTimeout(() => setIsOpen(false), 150);
    };

    const handleKeyDown = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                // Select highlighted option
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    return (
        <div ref={ref} className="relative w-full" data-focusable="true" tabIndex={0}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
        >
            <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-teal-400/70" />}
                {label}
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full input-modern cursor-pointer flex justify-between items-center transition-all duration-300 ${isOpen ? 'border-teal-400 shadow-[0_0_0_3px_rgba(20,184,166,0.12)]' : ''} ${error ? 'ring-2 ring-red-500 border-red-500/50' : ''}`}
            >
                <span className={value ? 'text-white' : 'text-gray-500'}>
                    {options.find(opt => opt.value === value)?.label || 'Select...'}
                </span>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </div>
            {error && <p className="text-red-400 text-xs mt-1">This field is required</p>}
            {hint && !error && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full mt-2 bg-[#131b2e] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                    >
                        {filteredOptions.map((opt, idx) => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                className={`px-4 py-2.5 cursor-pointer transition-all duration-200 text-sm
                                    ${value === opt.value
                                        ? 'bg-cyan-500/15 text-cyan-400'
                                        : idx === highlightedIndex
                                            ? 'bg-teal-500/15 text-teal-300'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ===== Input Field Component ===== */
const InputField = ({ label, icon: Icon, hint, error, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 text-teal-400/70" />}
            {label}
        </label>
        <input
            {...props}
            data-focusable="true"
            className={`input-modern ${error ? 'ring-2 ring-red-500 border-red-500/50' : ''}`}
        />
        {error && <p className="text-red-400 text-xs mt-1">This field is required</p>}
        {hint && !error && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
);

/* ===== Sub-Section Divider ===== */
const SubSection = ({ icon: Icon, title, children }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2.5 pt-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(6,182,212,0.1))' }}>
                <Icon className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="text-sm font-semibold text-gray-300 tracking-wide">{title}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-teal-500/20 via-cyan-500/8 to-transparent" />
        </div>
        {children}
    </div>
);

/* ===== Symptom Toggle Card ===== */
const SymptomCard = ({ icon: Icon, label, description, name, value, onChange }) => {
    const isYes = value === 'Yes';
    return (
        <div
            onClick={() => onChange({ target: { name, value: isYes ? 'No' : 'Yes' } })}
            className={`relative group p-4 rounded-xl border cursor-pointer transition-all duration-300 select-none
                ${isYes
                    ? 'border-rose-500/40 shadow-lg shadow-rose-500/8'
                    : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] hover:translate-y-[-1px]'}`}
            style={isYes ? { background: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(239,68,68,0.08))' } : {}}
        >
            <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${isYes ? 'bg-rose-500/20 scale-110' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <Icon className={`w-4 h-4 transition-colors duration-300 ${isYes ? 'text-rose-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-colors duration-300 ${isYes ? 'text-rose-300' : 'text-gray-300'}`}>{label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${isYes ? 'border-rose-400 bg-rose-500' : 'border-gray-600 group-hover:border-gray-400'}`}>
                    {isYes && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </motion.svg>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ===== Step Config ===== */
const stepConfig = [
    { label: 'Profile', icon: User },
    { label: 'Exposure', icon: Wind },
    { label: 'Lifestyle', icon: Cigarette },
    { label: 'Breath', icon: Stethoscope },
    { label: 'Symptoms', icon: Thermometer },
];

/* ===== Animation Variants ===== */
const stepVariants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/* ===== Main Component ===== */
const InputSection = ({ onCalculate }) => {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [location, setLocation] = useState("");
    const [loadingAQI, setLoadingAQI] = useState(false);
    const [errorAQI, setErrorAQI] = useState("");
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const [formData, setFormData] = useState({
        age: '', sex: '', height: '', weight: '',
        medicalHistory: [], familyHistory: 'No', asthmaOnset: '',
        aqi: '', outdoorDuration: '', occupationalExposure: 'None', indoorAirQuality: 'Moderate',
        smoking: 'No', secondhandSmoke: 'No', maskType: 'None',
        exerciseFrequency: 'None', exerciseLocation: 'outdoor', exerciseIntensity: 'moderate', gymVentilation: 'good',
        vapingStatus: 'never', sleepHours: '',
        breathHoldSeconds: '',
        shortnessOfBreath: 'No', chronicCough: 'No', wheezing: 'No', chestTightness: 'No', recentInfection: 'No',
        cigarettesPerDay: '', yearsSmoked: '',
    });

    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [breathHoldMode, setBreathHoldMode] = useState('choice');
    const [missingFields, setMissingFields] = useState({});

    const sectionRef = useRef(null);
    const fieldRefs = useRef({});
    const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        } else if (!isTimerRunning && timer !== 0) {
            clearInterval(interval);
            setFormData(prev => ({ ...prev, breathHoldSeconds: timer }));
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    /* --- Input Limits Configuration --- */
    const fieldLimits = {
        age: { min: 10, max: 120, msg: "Age must be 10-120" },
        height: { min: 50, max: 300, msg: "Height: 50-300 cm" },
        weight: { min: 20, max: 500, msg: "Weight: 20-500 kg" },
        aqi: { min: 0, max: 500, msg: "AQI: 0-500" },
        outdoorDuration: { min: 0, max: 24, msg: "Max 24 hours" },
        cigarettesPerDay: { min: 0, max: 100, msg: "Max 100 cigs/day" },
        yearsSmoked: { min: 0, max: 100, msg: "Max 100 years" },
        sleepHours: { min: 0, max: 24, msg: "Max 24 hours" },
    };

    /* --- Required fields per step (conditional-aware) --- */
    const getRequiredFields = (s) => {
        switch (s) {
            case 1: return ['age', 'sex', 'height', 'weight', 'familyHistory'];
            case 2: return ['aqi', 'outdoorDuration', 'occupationalExposure', 'indoorAirQuality', 'maskType'];
            case 3: {
                const fields = ['smoking', 'vapingStatus', 'secondhandSmoke', 'exerciseFrequency', 'sleepHours'];
                if (formData.smoking === 'Yes') fields.push('cigarettesPerDay', 'yearsSmoked');
                // Only require exercise details if frequency is NOT 'None'
                if (formData.exerciseFrequency !== 'None') {
                    fields.push('exerciseIntensity', 'exerciseLocation');
                    if (formData.exerciseLocation === 'indoor_gym') fields.push('gymVentilation');
                }
                return fields;
            }
            case 4: return ['breathHoldSeconds'];
            case 5: return []; // Symptoms default to 'No', always valid
            default: return [];
        }
    };

    /* --- Validate current step, return true if valid --- */
    const validateStep = (s) => {
        const required = getRequiredFields(s);
        const errors = {};
        let firstMissingField = null;

        // 1. Check for empty required fields
        for (const field of required) {
            const val = formData[field];
            const isEmpty = val === '' || val === undefined || val === null || (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
                errors[field] = "Required";
                if (!firstMissingField) firstMissingField = field;
            }
        }

        // 2. Check for lingering validation errors from handleChange
        // (If a field has an error msg in missingFields, keep it invalid)
        Object.keys(missingFields).forEach(field => {
            if (required.includes(field) && missingFields[field] && missingFields[field] !== "Required") {
                errors[field] = missingFields[field];
                if (!firstMissingField) firstMissingField = field;
            }
        });

        // 3. Re-validate numeric limits one last time
        for (const field of required) {
            if (fieldLimits[field] && formData[field] !== '') {
                const val = Number(formData[field]);
                const limit = fieldLimits[field];
                if (val < limit.min || val > limit.max) {
                    errors[field] = limit.msg;
                    if (!firstMissingField) firstMissingField = field;
                }
            }
        }

        setMissingFields(errors);

        if (firstMissingField && fieldRefs.current[firstMissingField]) {
            fieldRefs.current[firstMissingField].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        // Numeric Validation logic
        let errorMsg = null;
        if (type === 'number' && fieldLimits[name] && newValue !== '') {
            const numVal = Number(newValue);
            const { min, max, msg } = fieldLimits[name];
            if (numVal < min || numVal > max) {
                errorMsg = msg;
            }
            // Logic for yearsSmoked vs Age
            if (name === 'yearsSmoked' && formData.age && numVal > Number(formData.age)) {
                errorMsg = "Exceeds age";
            }
        }

        if (name === 'medicalHistory') {
            setFormData(prev => {
                const current = [...prev.medicalHistory];
                if (checked) current.push(value);
                else {
                    const idx = current.indexOf(value);
                    if (idx > -1) current.splice(idx, 1);
                }
                return { ...prev, medicalHistory: current };
            });
        } else {
            setFormData({ ...formData, [name]: newValue });
        }

        // Error State Management
        if (errorMsg) {
            setMissingFields(prev => ({ ...prev, [name]: errorMsg }));
        } else {
            // Clear error if valid
            if (missingFields[name]) {
                setMissingFields(prev => { const next = { ...prev }; delete next[name]; return next; });
            }
        }
    };

    const handleNext = () => {
        if (step < 5) {
            setMissingFields({});
            setDirection(1);
            setStep(step + 1);
        }
    };
    const handleBack = () => { if (step > 1) { setMissingFields({}); setDirection(-1); setStep(step - 1); } };

    const handleSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        // Validate ALL steps, jump to the first one with errors
        for (let s = 1; s <= 5; s++) {
            if (!validateStep(s)) {
                if (s !== step) {
                    setDirection(s > step ? 1 : -1);
                    setStep(s);
                    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
            }
        }
        setMissingFields({});
        if (onCalculate) onCalculate(formData);
    };

    const focusNextField = () => {
        const focusableElements = Array.from(document.querySelectorAll('#input-section [data-focusable="true"]'));
        const currentIndex = focusableElements.indexOf(document.activeElement);
        if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
            focusableElements[currentIndex + 1].focus();
        } else {
            if (step < 5) handleNext(); else handleSubmit();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Let CustomSelect handle its own Enter key
            if (e.target.closest('[data-focusable="true"]')?.tagName === 'DIV' &&
                e.target.getAttribute('data-focusable') === 'true' &&
                e.target.tagName === 'DIV') {
                return;
            }
            e.preventDefault();
            if (e.target.getAttribute('data-focusable') !== 'true') return;
            focusNextField();
        }
    };

    // Auto-focus first focusable field when step changes
    useEffect(() => {
        const timer = setTimeout(() => {
            const firstFocusable = document.querySelector('#input-section [data-focusable="true"]');
            if (firstFocusable) firstFocusable.focus();
        }, 400);
        return () => clearTimeout(timer);
    }, [step]);

    // Debounced city autocomplete — fires after 2+ chars, 300ms delay
    const handleLocationChange = (e) => {
        const val = e.target.value;
        setLocation(val);
        setErrorAQI("");

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (val.length < 2) {
            setCitySuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            if (API_KEY === "YOUR_API_KEY_HERE") return;
            setLoadingSuggestions(true);
            try {
                const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${val}&limit=5&appid=${API_KEY}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setCitySuggestions(data.map(c => ({
                        name: c.name,
                        state: c.state || '',
                        country: c.country || '',
                        lat: c.lat,
                        lon: c.lon,
                        display: [c.name, c.state, c.country].filter(Boolean).join(', '),
                    })));
                    setShowSuggestions(true);
                } else {
                    setCitySuggestions([]);
                    setShowSuggestions(false);
                }
            } catch {
                setCitySuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 300);
    };

    // US EPA AQI calculation from PM2.5 concentration (µg/m³)
    const calcAQIFromPM25 = (pm25) => {
        const breakpoints = [
            { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
            { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
            { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
            { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
            { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
            { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
            { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
        ];
        const c = Math.max(0, pm25);
        for (const bp of breakpoints) {
            if (c <= bp.cHigh) {
                return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow);
            }
        }
        return 500; // beyond scale
    };

    // Extract AQI from API response using PM2.5 concentration
    const extractAQI = (polData) => {
        if (polData.list && polData.list.length > 0) {
            const components = polData.list[0].components;
            if (components && components.pm2_5 !== undefined) {
                return calcAQIFromPM25(components.pm2_5);
            }
            // Fallback: use the 1-5 index if PM2.5 data is missing
            const index = polData.list[0].main.aqi;
            const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 200, 5: 350 };
            return aqiMap[index] || 100;
        }
        return null;
    };

    // Select a city suggestion → fill input + fetch AQI
    const handleSelectCity = async (city) => {
        setLocation(city.display);
        setCitySuggestions([]);
        setShowSuggestions(false);
        setLoadingAQI(true);
        setErrorAQI("");
        try {
            const polRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}`);
            const polData = await polRes.json();
            const aqi = extractAQI(polData);
            if (aqi !== null) {
                setFormData(prev => ({ ...prev, aqi }));
            }
        } catch { setErrorAQI("Failed to fetch AQI."); } finally { setLoadingAQI(false); }
    };

    // Manual fetch button (fallback)
    const handleFetchAQI = async () => {
        if (API_KEY === "YOUR_API_KEY_HERE") { setErrorAQI("Please configure your OpenWeather API Key."); return; }
        if (!location) { setErrorAQI("Please enter a city name."); return; }
        setLoadingAQI(true); setErrorAQI("");
        setShowSuggestions(false);
        try {
            const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`);
            const geoData = await geoRes.json();
            if (!geoData.length) { setErrorAQI("City not found."); setLoadingAQI(false); return; }
            const { lat, lon } = geoData[0];
            const polRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            const polData = await polRes.json();
            const aqi = extractAQI(polData);
            if (aqi !== null) {
                setFormData(prev => ({ ...prev, aqi }));
            }
        } catch { setErrorAQI("Failed to fetch AQI."); } finally { setLoadingAQI(false); }
    };

    const getAQIColor = (aqi) => { const v = parseInt(aqi); if (isNaN(v)) return "text-gray-400"; if (v <= 50) return "text-green-400"; if (v <= 100) return "text-yellow-400"; if (v <= 200) return "text-orange-400"; if (v <= 300) return "text-red-400"; return "text-purple-400"; };
    const getAQIText = (aqi) => { const v = parseInt(aqi); if (isNaN(v)) return ""; if (v <= 50) return "Good"; if (v <= 100) return "Moderate"; if (v <= 200) return "Unhealthy"; if (v <= 300) return "Very Unhealthy"; return "Hazardous"; };

    /* ===== Select Options ===== */
    const P = { label: "Select", value: "" };
    const sexOptions = [P, { label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }];
    const yesNoOptions = [P, { label: "Yes", value: "Yes" }, { label: "No", value: "No" }];
    const occupationalOptions = [P, { label: "None", value: "None" }, { label: "Moderate (Dust/Fumes)", value: "Moderate" }, { label: "High (Chemicals/Mining)", value: "High" }];
    const indoorOptions = [P, { label: "Good", value: "Good" }, { label: "Moderate", value: "Moderate" }, { label: "Poor", value: "Poor" }];
    const maskOptions = [P, { label: "None", value: "None" }, { label: "Cloth", value: "Cloth" }, { label: "Surgical", value: "Surgical" }, { label: "N95 / FFP2", value: "N95" }];
    const exerciseOptions = [P, { label: "None", value: "None" }, { label: "1-2x / Week", value: "1-2x" }, { label: "3-5x / Week", value: "3-5x" }, { label: "Daily", value: "Daily" }];
    const vapingOptions = [P, { label: "Never", value: "never" }, { label: "Current Vaper", value: "current" }];
    const asthmaOnsetOptions = [P, { label: "Childhood (<10 yrs)", value: "childhood" }, { label: "Late Onset (>10 yrs)", value: "late" }];

    const exerciseLocationOptions = [P, { label: "Indoor", value: "indoor_gym" }, { label: "Outdoor", value: "outdoor" }];
    const exerciseIntensityOptions = [P, { label: "Light (Walking)", value: "light" }, { label: "Moderate (Jogging)", value: "moderate" }, { label: "Vigorous (Running / HIIT)", value: "vigorous" }];
    const gymVentilationOptions = [P, { label: "Good (AC / Windows)", value: "good" }, { label: "Poor (Crowded / Stuffy)", value: "poor" }];

    return (
        <section
            id="input-section"
            ref={sectionRef}
            className="relative min-h-screen flex items-center justify-center section-padding overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}
        >
            <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
            <div className="absolute inset-0 bg-radial-teal pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent"></div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative z-10 max-w-3xl w-full"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.span
                        initial={{ opacity: 0, y: -10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium mb-4"
                        style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(6,182,212,0.08))', borderColor: 'rgba(20,184,166,0.25)', color: '#5eead4' }}
                    >
                        <Stethoscope className="w-3 h-3" />
                        Health Assessment
                    </motion.span>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        <span className="gradient-text">Check Your</span>{' '}
                        <span className="text-white">Lung Health</span>
                    </h2>
                    <p className="text-gray-400 mt-3 text-base">
                        Complete 5 quick steps for your personalized lung health prediction.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-1 mb-8">
                    {stepConfig.map((s, i) => {
                        const StepIcon = s.icon;
                        const stepNum = i + 1;
                        const isActive = step === stepNum;
                        const isCompleted = step > stepNum;
                        const handleStepClick = () => {
                            if (stepNum === step) return;
                            setDirection(stepNum > step ? 1 : -1);
                            setMissingFields({});
                            setStep(stepNum);
                            sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        };
                        return (
                            <div key={s.label} className="flex items-center">
                                <div
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={handleStepClick}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStepClick(); } }}
                                >
                                    <div className="relative">
                                        {isActive && (
                                            <div className="absolute -inset-1 rounded-full bg-teal-400/20 animate-softPulse" />
                                        )}
                                        <div
                                            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
                                                ${isActive
                                                    ? 'border-teal-400 text-teal-300 shadow-lg shadow-teal-500/25'
                                                    : isCompleted
                                                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-110'
                                                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300 hover:scale-110'}`}
                                            style={isActive ? { background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(6,182,212,0.15))' } : {}}
                                        >
                                            {isCompleted ? (
                                                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }} className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                </motion.svg>
                                            ) : (
                                                <StepIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] mt-1.5 font-medium transition-colors duration-300
                                        ${isActive ? 'text-teal-300' : isCompleted ? 'text-emerald-400' : 'text-gray-600'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < stepConfig.length - 1 && (
                                    <div className="relative w-8 md:w-14 h-[2px] mx-1 mt-[-16px] rounded-full bg-white/8 overflow-hidden">
                                        {step > stepNum && (
                                            <motion.div
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                className="absolute inset-0 rounded-full"
                                                style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.6), rgba(16,185,129,0.5))' }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Form Card */}
                <div className="glass-card-glow p-6 md:p-8 shadow-2xl shadow-black/30">
                    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={step}
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                            >
                                {/* ========================================= */}
                                {/* STEP 1: BASELINE PROFILE                  */}
                                {/* ========================================= */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <User className="w-5 h-5 text-teal-400" /> Baseline Profile
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1 ml-7">Your demographics help calculate BMI and age-related vulnerability.</p>
                                        </div>

                                        {/* Row 1: Age + Sex -- always 2 columns */}
                                        <div className="grid grid-cols-2 gap-5">
                                            <div ref={el => fieldRefs.current['age'] = el}>
                                                <InputField label="Age" icon={User} type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Years" error={missingFields.age} />
                                            </div>
                                            <div ref={el => fieldRefs.current['sex'] = el}>
                                                <CustomSelect label="Biological Sex" icon={User} name="sex" value={formData.sex} options={sexOptions} onChange={handleChange} onSelectDone={focusNextField} error={missingFields.sex} />
                                            </div>
                                        </div>

                                        {/* Row 2: Height + Weight -- always 2 columns */}
                                        <div className="grid grid-cols-2 gap-5">
                                            <div ref={el => fieldRefs.current['height'] = el}>
                                                <InputField label="Height" icon={Thermometer} type="number" name="height" value={formData.height} onChange={handleChange} onSelectDone={focusNextField} placeholder="cm" hint="Used to calculate BMI" error={missingFields.height} />
                                            </div>
                                            <div ref={el => fieldRefs.current['weight'] = el}>
                                                <InputField label="Weight" icon={Thermometer} type="number" name="weight" value={formData.weight} onChange={handleChange} onSelectDone={focusNextField} placeholder="kg" error={missingFields.weight} />
                                            </div>
                                        </div>

                                        {/* Row 3: Medical History + Asthma Onset (conditional) -- always 2 columns */}
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                                                    <Stethoscope className="w-3.5 h-3.5 text-cyan-400/60" />
                                                    Medical History
                                                </label>
                                                <div className="flex flex-col gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                                                    {['Asthma', 'TB', 'COPD'].map((c) => (
                                                        <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                                                            <input
                                                                type="checkbox" name="medicalHistory" value={c}
                                                                checked={formData.medicalHistory.includes(c)}
                                                                onChange={handleChange} onSelectDone={focusNextField} data-focusable="true"
                                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-400 focus:ring-offset-0 accent-teal-500"
                                                            />
                                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{c}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-5">
                                                {formData.medicalHistory.includes('Asthma') && (
                                                    <CustomSelect label="Asthma Onset" icon={Stethoscope} name="asthmaOnset" value={formData.asthmaOnset} options={asthmaOnsetOptions} onChange={handleChange} onSelectDone={focusNextField} hint="Late onset + smoking = higher risk" />
                                                )}
                                                <div ref={el => fieldRefs.current['familyHistory'] = el}>
                                                    <CustomSelect label="Family History of Lung Disease?" icon={Heart} name="familyHistory" value={formData.familyHistory} options={yesNoOptions} onChange={handleChange} onSelectDone={focusNextField} error={missingFields.familyHistory} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================= */}
                                {/* STEP 2: ENVIRONMENTAL EXPOSURE             */}
                                {/* ========================================= */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <Wind className="w-5 h-5 text-teal-400" /> Environmental Exposure
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1 ml-7">Pollution, workplace hazards, and indoor air quality affect absorbed dose.</p>
                                        </div>

                                        {/* AQI Search Bar */}
                                        <SubSection icon={MapPin} title="Air Quality Index">
                                            <div className="grid grid-cols-3 gap-4 items-end">
                                                <div className="col-span-2 relative">
                                                    <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                                                        <Search className="w-3.5 h-3.5 text-cyan-400/60" /> City Lookup
                                                    </label>
                                                    <input
                                                        type="text" value={location} onChange={handleLocationChange}
                                                        onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                        placeholder="Type a city name..." data-focusable="true" className="input-modern"
                                                        autoComplete="off"
                                                    />
                                                    {/* Autocomplete dropdown */}
                                                    {showSuggestions && citySuggestions.length > 0 && (
                                                        <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                                                            {loadingSuggestions && (
                                                                <div className="px-4 py-2 text-xs text-gray-500">Searching...</div>
                                                            )}
                                                            {citySuggestions.map((city, i) => (
                                                                <button
                                                                    key={`${city.lat}-${city.lon}-${i}`}
                                                                    type="button"
                                                                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.06] transition-colors cursor-pointer border-b border-white/[0.03] last:border-b-0"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => handleSelectCity(city)}
                                                                >
                                                                    <MapPin className="w-3.5 h-3.5 text-teal-400/60 flex-shrink-0" />
                                                                    <div>
                                                                        <span className="text-sm text-gray-200 font-medium">{city.name}</span>
                                                                        {(city.state || city.country) && (
                                                                            <span className="text-xs text-gray-500 ml-1.5">
                                                                                {[city.state, city.country].filter(Boolean).join(', ')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button type="button" onClick={handleFetchAQI} disabled={loadingAQI}
                                                    className="btn-glow h-[42px] flex items-center justify-center gap-2 text-sm cursor-pointer">
                                                    <Search className="w-4 h-4" />
                                                    {loadingAQI ? "Fetching..." : "Fetch AQI"}
                                                </button>
                                            </div>
                                            {errorAQI && <p className="text-red-400 text-xs">{errorAQI}</p>}

                                            <div className="grid grid-cols-2 gap-5">
                                                <div ref={el => fieldRefs.current['aqi'] = el}>
                                                    <InputField label="AQI Level" icon={Wind} type="number" name="aqi" value={formData.aqi} onChange={handleChange} onSelectDone={focusNextField} placeholder="e.g. 150" hint="0-500 scale" error={missingFields.aqi} />
                                                    {formData.aqi && (
                                                        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-medium ${getAQIColor(formData.aqi)}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                            {getAQIText(formData.aqi)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div ref={el => fieldRefs.current['outdoorDuration'] = el}>
                                                    <InputField label="Outdoor Exposure" icon={Clock} type="number" name="outdoorDuration" value={formData.outdoorDuration} onChange={handleChange} onSelectDone={focusNextField} placeholder="Hours / day" hint="Average daily time outdoors" error={missingFields.outdoorDuration} />
                                                </div>
                                            </div>
                                        </SubSection>

                                        {/* Indoor & Occupational */}
                                        <SubSection icon={ShieldCheck} title="Indoor & Workplace">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div ref={el => fieldRefs.current['occupationalExposure'] = el}>
                                                    <CustomSelect label="Occupational Exposure" icon={Wind} name="occupationalExposure" value={formData.occupationalExposure} options={occupationalOptions} onChange={handleChange} onSelectDone={focusNextField} hint="Dust, fumes, or chemicals" error={missingFields.occupationalExposure} />
                                                </div>
                                                <div ref={el => fieldRefs.current['indoorAirQuality'] = el}>
                                                    <CustomSelect label="Indoor Air Quality" icon={Wind} name="indoorAirQuality" value={formData.indoorAirQuality} options={indoorOptions} onChange={handleChange} onSelectDone={focusNextField} error={missingFields.indoorAirQuality} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div ref={el => fieldRefs.current['maskType'] = el}>
                                                    <CustomSelect label="Mask Usage" icon={ShieldCheck} name="maskType" value={formData.maskType} options={maskOptions} onChange={handleChange} onSelectDone={focusNextField} hint="N95 provides 50% dose reduction" error={missingFields.maskType} />
                                                </div>
                                            </div>
                                        </SubSection>
                                    </div>
                                )}

                                {/* ========================================= */}
                                {/* STEP 3: LIFESTYLE & HABITS                 */}
                                {/* ========================================= */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-teal-400" /> Lifestyle & Habits
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1 ml-7">Behavioral factors interact with each other -- smoking + vaping has 2.8x the risk of smoking alone.</p>
                                        </div>

                                        {/* Sub-group 1: Smoking & Vaping */}
                                        <SubSection icon={Cigarette} title="Smoking & Vaping">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div ref={el => fieldRefs.current['smoking'] = el}>
                                                    <CustomSelect label="Smoking Status" icon={Cigarette} name="smoking" value={formData.smoking} options={yesNoOptions} onChange={handleChange} onSelectDone={focusNextField} error={missingFields.smoking} />
                                                </div>
                                                <div ref={el => fieldRefs.current['vapingStatus'] = el}>
                                                    <CustomSelect label="Vaping Status" icon={Zap} name="vapingStatus" value={formData.vapingStatus} options={vapingOptions} onChange={handleChange} onSelectDone={focusNextField} error={missingFields.vapingStatus} />
                                                </div>
                                            </div>
                                            {formData.smoking === 'Yes' && (
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div ref={el => fieldRefs.current['cigarettesPerDay'] = el}>
                                                        <InputField label="Cigarettes / Day" icon={Cigarette} type="number" name="cigarettesPerDay" value={formData.cigarettesPerDay} onChange={handleChange} onSelectDone={focusNextField} placeholder="e.g. 10" error={missingFields.cigarettesPerDay} />
                                                    </div>
                                                    <div ref={el => fieldRefs.current['yearsSmoked'] = el}>
                                                        <InputField label="Years Smoked" icon={Clock} type="number" name="yearsSmoked" value={formData.yearsSmoked} onChange={handleChange} onSelectDone={focusNextField} placeholder="e.g. 5" error={missingFields.yearsSmoked} />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-5">
                                                <div ref={el => fieldRefs.current['secondhandSmoke'] = el}>
                                                    <CustomSelect label="Secondhand Smoke?" icon={Wind} name="secondhandSmoke" value={formData.secondhandSmoke} options={yesNoOptions} onChange={handleChange} onSelectDone={focusNextField} hint="Regular passive exposure" error={missingFields.secondhandSmoke} />
                                                </div>
                                            </div>
                                        </SubSection>

                                        {/* Sub-group 2: Exercise & Activity */}
                                        <SubSection icon={Dumbbell} title="Exercise & Activity">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div ref={el => fieldRefs.current['exerciseFrequency'] = el}>
                                                    <CustomSelect label="Exercise Frequency" icon={Dumbbell} name="exerciseFrequency" value={formData.exerciseFrequency} options={exerciseOptions} onChange={handleChange} onSelectDone={focusNextField} error={missingFields.exerciseFrequency} />
                                                </div>
                                                {/* Only show details if Frequency is NOT 'None' */}
                                                {formData.exerciseFrequency !== 'None' && (
                                                    <div ref={el => fieldRefs.current['exerciseIntensity'] = el}>
                                                        <CustomSelect label="Exercise Intensity" icon={Zap} name="exerciseIntensity" value={formData.exerciseIntensity} options={exerciseIntensityOptions} onChange={handleChange} onSelectDone={focusNextField} hint="Affects ventilation rate" error={missingFields.exerciseIntensity} />
                                                    </div>
                                                )}
                                            </div>

                                            {formData.exerciseFrequency !== 'None' && (
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div ref={el => fieldRefs.current['exerciseLocation'] = el}>
                                                        <CustomSelect label="Exercise Location" icon={MapPin} name="exerciseLocation" value={formData.exerciseLocation} options={exerciseLocationOptions} onChange={handleChange} onSelectDone={focusNextField} hint="Where you usually work out" error={missingFields.exerciseLocation} />
                                                    </div>
                                                    {formData.exerciseLocation === 'indoor_gym' ? (
                                                        <div ref={el => fieldRefs.current['gymVentilation'] = el}>
                                                            <CustomSelect label="Gym Ventilation" icon={Wind} name="gymVentilation" value={formData.gymVentilation} options={gymVentilationOptions} onChange={handleChange} onSelectDone={focusNextField} hint="Poor vent = resuspended dust" error={missingFields.gymVentilation} />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </SubSection>

                                        {/* Sub-group 3: Sleep */}
                                        <SubSection icon={Moon} title="Sleep & Recovery">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div ref={el => fieldRefs.current['sleepHours'] = el}>
                                                    <InputField label="Average Sleep" icon={Moon} type="number" name="sleepHours" value={formData.sleepHours} onChange={handleChange} placeholder="Hours / night" hint="7-8h is optimal" error={missingFields.sleepHours} />
                                                </div>
                                                <div className="flex items-end pb-1">
                                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 w-full">
                                                        <p className="text-[11px] text-gray-500 leading-relaxed">
                                                            <span className="text-teal-400/70 font-medium">Why sleep?</span> Sleep &lt;6h increases infection risk by 4.2x. Sleep &gt;9h signals metabolic issues. Both hurt your lungs.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </SubSection>
                                    </div>
                                )}

                                {/* ========================================= */}
                                {/* STEP 4: BREATH HOLD CHALLENGE              */}
                                {/* ========================================= */}
                                {step === 4 && (
                                    <div className="space-y-5 text-center" ref={el => fieldRefs.current['breathHoldSeconds'] = el}>
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                                <Stethoscope className="w-5 h-5 text-teal-400" /> Breath Hold Challenge
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">A simple test of lung capacity and airway obstruction.</p>
                                        </div>

                                        {missingFields.breathHoldSeconds && (
                                            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                                <p className="text-red-400 text-sm font-medium">Please complete the breath hold test or enter your time manually before proceeding.</p>
                                            </div>
                                        )}

                                        {breathHoldMode === 'choice' && (
                                            <div className="flex flex-col items-center gap-6 py-6">
                                                <p className="text-gray-400">How would you like to provide your breath hold time?</p>
                                                <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                                                    <button type="button" onClick={() => setBreathHoldMode('timer')}
                                                        className="flex-1 p-6 glass-card flex flex-col items-center gap-3 cursor-pointer group">
                                                        <Timer className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                                                        <span className="text-white font-semibold">Use Stopwatch</span>
                                                        <span className="text-xs text-gray-500">Test yourself now</span>
                                                    </button>
                                                    <button type="button" onClick={() => setBreathHoldMode('manual')}
                                                        className="flex-1 p-6 glass-card flex flex-col items-center gap-3 cursor-pointer group">
                                                        <Keyboard className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                                                        <span className="text-white font-semibold">Manual Entry</span>
                                                        <span className="text-xs text-gray-500">I know my time</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {breathHoldMode === 'timer' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
                                                <p className="text-gray-400 mb-6 text-sm">
                                                    Take a deep breath. Click <span className="text-teal-300 font-semibold">Start</span> when holding.
                                                    Click <span className="text-teal-300 font-semibold">Stop</span> as soon as you exhale.
                                                </p>
                                                <div className="flex flex-col items-center mb-6">
                                                    <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center relative transition-all duration-500
                                                        ${isTimerRunning ? 'shadow-lg shadow-teal-500/20' : 'border-white/10 bg-white/[0.02]'}`}
                                                        style={isTimerRunning ? { borderImage: 'linear-gradient(135deg, #14b8a6, #06b6d4) 1', borderColor: '#14b8a6' } : {}}>
                                                        {isTimerRunning && (
                                                            <div className="absolute inset-0 rounded-full border-4 border-teal-400 animate-ping opacity-10"></div>
                                                        )}
                                                        <span className="text-5xl font-bold font-mono text-teal-300">
                                                            {isTimerRunning ? timer : (formData.breathHoldSeconds || 0)}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-500 mt-2 text-sm">seconds</span>
                                                </div>
                                                <div className="flex justify-center gap-3">
                                                    {!isTimerRunning ? (
                                                        <button type="button" onClick={() => { setTimer(0); setIsTimerRunning(true); }}
                                                            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all hover:scale-105 cursor-pointer">
                                                            {timer > 0 || formData.breathHoldSeconds > 0 ? "Retest" : "Start"}
                                                        </button>
                                                    ) : (
                                                        <button type="button" onClick={() => setIsTimerRunning(false)}
                                                            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all hover:scale-105 cursor-pointer">
                                                            Stop
                                                        </button>
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => setBreathHoldMode('choice')}
                                                    className="mt-4 text-xs text-gray-500 hover:text-white underline cursor-pointer">Switch Mode</button>
                                            </motion.div>
                                        )}

                                        {breathHoldMode === 'manual' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xs mx-auto py-4">
                                                <div className="glass-card-static p-6">
                                                    <label className="block text-gray-400 mb-3 text-sm">Enter breath hold time</label>
                                                    <input
                                                        type="number" name="breathHoldSeconds" value={formData.breathHoldSeconds}
                                                        onChange={handleChange} data-focusable="true" autoFocus
                                                        className={`w-full px-4 py-4 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-3xl text-center focus:outline-none focus:ring-2 focus:ring-cyan-400 ${missingFields.breathHoldSeconds ? 'ring-2 ring-red-500 border-red-500/50' : ''}`}
                                                        placeholder="0"
                                                    />
                                                    <span className="text-gray-500 text-xs block mt-2">seconds</span>
                                                </div>
                                                <button type="button" onClick={() => setBreathHoldMode('choice')}
                                                    className="mt-4 text-xs text-gray-500 hover:text-white underline cursor-pointer">Switch Mode</button>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* ========================================= */}
                                {/* STEP 5: SYMPTOMS (DSSL-aware)              */}
                                {/* ========================================= */}
                                {step === 5 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-teal-400" /> Current Symptoms
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1 ml-7">
                                                Tap any symptom you're currently experiencing. Our engine uses smart suppression to avoid double-counting with diagnosed conditions.
                                            </p>
                                        </div>

                                        {/* DSSL info banner */}
                                        {formData.medicalHistory.length > 0 && (
                                            <div className="flex items-start gap-3 rounded-xl p-3 border" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.05), rgba(6,182,212,0.03))', borderColor: 'rgba(20,184,166,0.15)' }}>
                                                <ShieldCheck className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-[12px] text-teal-300/70 leading-relaxed">
                                                    <span className="font-semibold text-teal-300">Smart Scoring Active:</span>{' '}
                                                    Since you have {formData.medicalHistory.join(' & ')}, expected symptoms for your condition(s) are auto-adjusted to prevent inflated scores.
                                                </p>
                                            </div>
                                        )}

                                        {/* Symptom Cards -- 2 columns, last one spans full width */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <SymptomCard
                                                icon={Wind} name="shortnessOfBreath" label="Shortness of Breath"
                                                description="Difficulty breathing during rest or mild activity"
                                                value={formData.shortnessOfBreath} onChange={handleChange}
                                            />
                                            <SymptomCard
                                                icon={Activity} name="chronicCough" label="Chronic Cough"
                                                description="Persistent cough lasting more than 3 weeks"
                                                value={formData.chronicCough} onChange={handleChange}
                                            />
                                            <SymptomCard
                                                icon={Stethoscope} name="wheezing" label="Wheezing"
                                                description="High-pitched whistling sound when breathing"
                                                value={formData.wheezing} onChange={handleChange}
                                            />
                                            <SymptomCard
                                                icon={Heart} name="chestTightness" label="Chest Tightness"
                                                description="Pressure or squeezing sensation in the chest"
                                                value={formData.chestTightness} onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <SymptomCard
                                                icon={Thermometer} name="recentInfection" label="Recent Respiratory Infection"
                                                description="Fever, flu, cold, or lung infection in the past 2 weeks -- this is always flagged as urgent"
                                                value={formData.recentInfection} onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                            <button type="button" onClick={handleBack}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer active:scale-[0.97]
                                    ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-teal-500/10 hover:border-teal-500/20'}`}>
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>

                            {step < 5 ? (
                                <button type="button" onClick={handleNext}
                                    className="btn-glow flex items-center gap-2 px-6 py-2.5 text-sm cursor-pointer group">
                                    Next <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            ) : (
                                <button type="submit"
                                    className="btn-glow flex items-center gap-2 px-6 py-2.5 text-sm cursor-pointer group">
                                    Get Results <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </motion.div>
        </section>
    );
};

export default InputSection;
