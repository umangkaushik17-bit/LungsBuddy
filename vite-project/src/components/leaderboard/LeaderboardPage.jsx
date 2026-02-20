import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, HeartPulse, ArrowLeft, Loader2, Mail, Lock, User, LogOut, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import RoomLobby from './RoomLobby';
import RoomDashboard from './RoomDashboard';
import SubmitScoreModal from './SubmitScoreModal';

/* ===== Auth Form ===== */
const AuthForm = () => {
    const { register, login } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required');
            return;
        }
        if (mode === 'register' && !name.trim()) {
            setError('Display name is required');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'register') {
                await register(email.trim(), password, name.trim());
            } else {
                await login(email.trim(), password);
            }
        } catch (err) {
            const code = err?.code || '';
            if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (code === 'auth/email-already-in-use') {
                setError('Email already registered. Try logging in.');
            } else if (code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (code === 'auth/weak-password') {
                setError('Password must be at least 6 characters');
            } else {
                setError(err.message || 'Authentication failed');
            }
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-md mx-auto"
        >
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                {/* Tab Switcher */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] mb-6">
                    {['login', 'register'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setMode(tab); setError(''); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer
                                ${mode === tab
                                    ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/20'
                                    : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab === 'login' ? 'Log In' : 'Sign Up'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Display Name (register only) */}
                    <AnimatePresence>
                        {mode === 'register' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-teal-400/70" /> Display Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="What should others see?"
                                    className="w-full px-4 py-3 rounded-xl bg-[#0d1424] border border-white/10 text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-300"
                                    maxLength={20}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-teal-400/70" /> Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 rounded-xl bg-[#0d1424] border border-white/10 text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-300"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-teal-400/70" /> Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full px-4 py-3 rounded-xl bg-[#0d1424] border border-white/10 text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-red-400 text-sm"
                            >{error}</motion.p>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-glow flex items-center justify-center gap-2 py-3 text-sm cursor-pointer disabled:opacity-50"
                    >
                        {loading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : mode === 'login' ? 'Log In' : 'Create Account'
                        }
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

/* ===== Main Leaderboard Page ===== */
const LeaderboardPage = ({ calculateRisk }) => {
    const navigate = useNavigate();
    const { user, loading, displayName, logout } = useAuth();
    const [currentRoom, setCurrentRoom] = useState(() => {
        const saved = localStorage.getItem('lungbuddy_currentRoom');
        return saved ? JSON.parse(saved) : null;
    });
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Persist room selection
    useEffect(() => {
        if (currentRoom) {
            localStorage.setItem('lungbuddy_currentRoom', JSON.stringify(currentRoom));
        } else {
            localStorage.removeItem('lungbuddy_currentRoom');
        }
    }, [currentRoom]);

    const handleJoinRoom = (roomId, roomName) => {
        setCurrentRoom({ id: roomId, name: roomName });
    };

    const handleLeaveRoom = () => {
        setCurrentRoom(null);
    };

    const handleLogout = async () => {
        await logout();
        setCurrentRoom(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white" style={{ background: 'var(--bg-primary)' }}>
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300">
                            <HeartPulse className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">LungBuddy</span>
                    </button>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400 hidden sm:inline">
                                    {displayName || user.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-all cursor-pointer"
                                >
                                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Site
                        </button>
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-400 tracking-wider uppercase">Competitive Mode</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <span className="gradient-text">Improvement</span>
                        <span className="text-white"> Leaderboard</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Create a room, invite friends, and compete to see who improves their lung health the most.
                        Rankings are based on improvement percentage — not raw score.
                    </p>
                </motion.div>

                {/* Content — Auth gate */}
                {!user ? (
                    <AuthForm />
                ) : !currentRoom ? (
                    <RoomLobby onJoinRoom={handleJoinRoom} />
                ) : (
                    <RoomDashboard
                        roomId={currentRoom.id}
                        roomName={currentRoom.name}
                        onBack={handleLeaveRoom}
                        onSubmitScore={() => setShowSubmitModal(true)}
                    />
                )}
            </div>

            {/* Submit Score Modal */}
            <SubmitScoreModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                roomId={currentRoom?.id}
                calculateRisk={calculateRisk}
            />

            {/* Subtle background glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-teal-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
        </div>
    );
};

export default LeaderboardPage;
