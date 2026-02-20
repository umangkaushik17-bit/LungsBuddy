import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Wind, Microscope, HeartPulse, AlertTriangle, TrendingDown, ShieldAlert } from 'lucide-react';

const cards = [
    {
        icon: Wind,
        title: 'High AQI Exposure',
        description: 'Continuous exposure to polluted air significantly increases inflammation in the respiratory system, leading to chronic discomfort and reduced lung capacity.',
        gradient: 'from-cyan-500/20 to-cyan-500/0',
        iconColor: 'text-cyan-400',
        borderColor: 'hover:border-cyan-500/30',
    },
    {
        icon: Microscope,
        title: 'Pollutants Enter Airways',
        description: 'Fine particles (PM2.5) penetrate deep into lung tissues, clogging airways and reducing the efficiency of oxygen exchange in the blood.',
        gradient: 'from-amber-500/20 to-amber-500/0',
        iconColor: 'text-amber-400',
        borderColor: 'hover:border-amber-500/30',
    },
    {
        icon: HeartPulse,
        title: 'Gradual Tissue Weakening',
        description: 'Long-term exposure results in scarring, reduced lung capacity, and a significantly higher risk of developing severe respiratory diseases.',
        gradient: 'from-red-500/20 to-red-500/0',
        iconColor: 'text-red-400',
        borderColor: 'hover:border-red-500/30',
    },
];

const dangerStats = [
    { icon: AlertTriangle, value: '4.2M', label: 'Deaths per year from air pollution', color: 'text-red-400' },
    { icon: TrendingDown, value: '91%', label: 'World population breathes polluted air', color: 'text-amber-400' },
    { icon: ShieldAlert, value: '7M', label: 'Premature deaths linked to air pollution', color: 'text-orange-400' },
];

const DamageSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    return (
        <section
            id="damage-section"
            ref={sectionRef}
            className="relative section-padding overflow-hidden"
            style={{ background: 'var(--bg-secondary)' }}
        >
            {/* Subtle top gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>

            <div className="relative z-10 max-w-6xl w-full mx-auto">
                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-6">
                        <AlertTriangle className="w-3 h-3" />
                        Understanding the Risk
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                        <span className="gradient-text-warm">How Pollution</span>
                        <br />
                        <span className="text-white">Damages Your Lungs</span>
                    </h2>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
                        High AQI, prolonged exposure to harmful particulates, and a lack of proper protection can gradually deteriorate lung tissues.
                    </p>
                </motion.div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-16">
                    {cards.map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                            className={`group relative glass-card p-7 cursor-default ${card.borderColor}`}
                        >
                            {/* Top gradient accent */}
                            <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${card.gradient}`}></div>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${card.iconColor}`}>
                                <card.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3">
                                {card.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {card.description}
                            </p>

                            {/* Step number */}
                            <div className="absolute top-5 right-5 text-5xl font-extrabold text-white/3 select-none">
                                {i + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="glass-card-static p-6 mt-12 grid md:grid-cols-3 gap-6"
                >
                    {dangerStats.map(({ icon: Icon, value, label, color }) => (
                        <div key={label} className="flex items-center gap-4 justify-center md:justify-start">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                                <div className="text-gray-500 text-xs">{label}</div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default DamageSection;
