import { Heart, HeartPulse, Github, Mail } from 'lucide-react';

const Footer = () => {
    const scrollTo = (href) => {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className="relative bg-[#060a14] border-t border-white/5">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-3 gap-10">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                                <HeartPulse className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-bold gradient-text font-[var(--font-heading)]">
                                LungBuddy
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                            AI-powered lung health monitoring for everyone. Get real-time insights and personalized recommendations.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                            Quick Links
                        </h4>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: 'Home', href: '#hero' },
                                { label: 'How It Works', href: '#damage-section' },
                                { label: 'Assessment', href: '#input-section' },
                                { label: 'Results', href: '#results-section' },
                            ].map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => scrollTo(link.href)}
                                    className="text-left text-gray-500 hover:text-cyan-400 transition-colors text-sm cursor-pointer"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                            Get In Touch
                        </h4>
                        <div className="flex flex-col gap-3">
                            <a href="mailto:hello@lungbuddy.ai" className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-sm">
                                <Mail className="w-4 h-4" />
                                hello@lungbuddy.ai
                            </a>
                            <a href="#" className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-sm">
                                <Github className="w-4 h-4" />
                                GitHub
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-600 text-xs">
                        © 2026 LungBuddy. All rights reserved.
                    </p>
                    <p className="text-gray-600 text-xs flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-400" /> for healthier lungs
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
