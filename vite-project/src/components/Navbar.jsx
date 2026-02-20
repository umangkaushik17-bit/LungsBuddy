import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, HeartPulse, Trophy } from 'lucide-react';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isLeaderboard = location.pathname === '/leaderboard';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Home', href: '#hero' },
        { label: 'How It Works', href: '#damage-section' },
        { label: 'Assessment', href: '#input-section' },
        { label: 'Results', href: '#results-section' },
    ];

    const scrollTo = (href) => {
        setMobileOpen(false);
        if (isLeaderboard) {
            navigate('/');
            setTimeout(() => {
                const el = document.querySelector(href);
                el?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            const el = document.querySelector(href);
            el?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                ? 'bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <button onClick={() => scrollTo('#hero')} className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300">
                        <HeartPulse className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold font-[var(--font-heading)] gradient-text">
                        LungBuddy
                    </span>
                </button>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => scrollTo(link.href)}
                            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300 cursor-pointer relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
                        </button>
                    ))}
                    <button
                        onClick={() => navigate('/leaderboard')}
                        className="flex items-center gap-1.5 text-sm text-yellow-400/80 hover:text-yellow-400 transition-colors duration-300 cursor-pointer relative group"
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        Leaderboard
                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
                    </button>
                    {!isLeaderboard && (
                        <button
                            onClick={() => scrollTo('#input-section')}
                            className="btn-glow px-5 py-2 text-sm cursor-pointer"
                        >
                            Check Your Score
                        </button>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/5 animate-fadeInDown">
                    <div className="px-6 py-4 flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => scrollTo(link.href)}
                                className="text-left text-gray-300 hover:text-cyan-400 transition-colors py-2 cursor-pointer"
                            >
                                {link.label}
                            </button>
                        ))}
                        <button
                            onClick={() => { setMobileOpen(false); navigate('/leaderboard'); }}
                            className="text-left text-yellow-400/80 hover:text-yellow-400 transition-colors py-2 cursor-pointer flex items-center gap-2"
                        >
                            <Trophy className="w-4 h-4" /> Leaderboard
                        </button>
                        {!isLeaderboard && (
                            <button
                                onClick={() => scrollTo('#input-section')}
                                className="btn-glow px-5 py-2.5 text-sm mt-2 cursor-pointer"
                            >
                                Check Your Score
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
