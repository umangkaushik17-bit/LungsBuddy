import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Copy, Check, ArrowLeft, Plus, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, Clock, Loader2, Timer, ChevronDown, Calendar, Sparkles, Bot, Flame } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { getLeaderboardInsights } from '../../gemini';

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const RankBadge = ({ rank }) => {
    if (rank === 1) return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Crown className="w-4 h-4 text-white" />
        </div>
    );
    if (rank === 2) return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg shadow-gray-400/20">
            <Medal className="w-4 h-4 text-white" />
        </div>
    );
    if (rank === 3) return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20">
            <Award className="w-4 h-4 text-white" />
        </div>
    );
    return (
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-400">{rank}</span>
        </div>
    );
};

const ImprovementBadge = ({ pct }) => {
    if (pct === null || pct === undefined) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-500">
                <Minus className="w-3 h-3" /> No data
            </span>
        );
    }

    const isPositive = pct > 0;
    const isZero = pct === 0;

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
            ${isPositive ? 'bg-emerald-500/15 text-emerald-400' : isZero ? 'bg-white/5 text-gray-400' : 'bg-red-500/15 text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isZero ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{pct.toFixed(1)}%
        </span>
    );
};

/* ===== Cooldown Countdown Helper ===== */
const formatCountdown = (ms) => {
    if (ms <= 0) return null;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
};

/* ===== Format Firestore Timestamp ===== */
const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

const RoomDashboard = ({ roomId, roomName, onBack, onSubmitScore }) => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [expandedMember, setExpandedMember] = useState(null);
    const [memberSubmissions, setMemberSubmissions] = useState({}); // { [userId]: [...submissions] }

    // Realtime listener for room data
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
            if (snap.exists()) setRoomData(snap.data());
        });
        return () => unsub();
    }, [roomId]);

    // Realtime listener for members
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'rooms', roomId, 'members'), (snap) => {
            const memberList = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
            }));
            setMembers(memberList);
            setLoading(false);
        });
        return () => unsub();
    }, [roomId]);

    // Realtime listener for ALL submissions — build per-user history
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'rooms', roomId, 'submissions'), (snap) => {
            const allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Group by userId
            const grouped = {};
            allSubs.forEach(sub => {
                if (!grouped[sub.userId]) grouped[sub.userId] = [];
                grouped[sub.userId].push(sub);
            });

            // Sort each user's submissions by time (oldest first)
            Object.keys(grouped).forEach(uid => {
                grouped[uid].sort((a, b) => {
                    const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
                    const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
                    return aTime - bTime;
                });
            });

            setMemberSubmissions(grouped);
        });
        return () => unsub();
    }, [roomId]);

    // Cooldown timer — ticks every second
    useEffect(() => {
        const currentMember = members.find(m => m.id === user?.uid);
        if (!currentMember?.lastSubmittedAt) {
            setCooldownRemaining(0);
            return;
        }

        const lastSubmit = currentMember.lastSubmittedAt?.toDate
            ? currentMember.lastSubmittedAt.toDate().getTime()
            : currentMember.lastSubmittedAt;

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastSubmit;
            const remaining = COOLDOWN_MS - elapsed;
            setCooldownRemaining(remaining > 0 ? remaining : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [members, user?.uid]);

    // Enrich members with actual submission data
    const enrichedMembers = useMemo(() => {
        return members.map(m => {
            const subs = memberSubmissions[m.id] || [];
            const actualCount = subs.length;
            const oldestScore = subs.length > 0 ? subs[0].score : null;
            const newestScore = subs.length > 0 ? subs[subs.length - 1].score : null;

            // Recalculate improvement from actual submissions
            let improvementPct = null;
            if (subs.length >= 2 && oldestScore !== null && newestScore !== null) {
                const denominator = 100 - oldestScore;
                if (denominator > 0) {
                    improvementPct = ((newestScore - oldestScore) / denominator) * 100;
                    improvementPct = Math.round(improvementPct * 10) / 10;
                } else {
                    improvementPct = 0;
                }
            }

            // Snapchat-style streak: consecutive days with a submission
            let streak = 0;
            if (subs.length > 0) {
                const toDay = (ts) => {
                    const d = ts?.toDate ? ts.toDate() : new Date(ts);
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                };
                // Get unique submission days (sorted newest first)
                const days = [...new Set(subs.map(s => toDay(s.submittedAt)).filter(Boolean))].sort((a, b) => b - a);
                const ONE_DAY = 86400000;
                const today = toDay(new Date());

                // Check if latest submission is today or yesterday (still active streak)
                if (days[0] >= today - ONE_DAY) {
                    streak = 1;
                    for (let i = 1; i < days.length; i++) {
                        if (days[i - 1] - days[i] === ONE_DAY) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                }
            }

            return {
                ...m,
                actualCount,
                oldestScore,
                newestScore,
                improvementPct: actualCount >= 2 ? improvementPct : m.improvementPct,
                submissions: subs,
                streak,
            };
        });
    }, [members, memberSubmissions]);

    // Sort members by improvement % (descending), null values at bottom
    const rankedMembers = useMemo(() => {
        return [...enrichedMembers].sort((a, b) => {
            const aImp = a.improvementPct;
            const bImp = b.improvementPct;
            if ((aImp === null || aImp === undefined) && (bImp === null || bImp === undefined)) return 0;
            if (aImp === null || aImp === undefined) return 1;
            if (bImp === null || bImp === undefined) return -1;
            return bImp - aImp;
        });
    }, [enrichedMembers]);

    const handleCopy = () => {
        if (roomData?.code) {
            navigator.clipboard.writeText(roomData.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const toggleExpand = (memberId) => {
        setExpandedMember(expandedMember === memberId ? null : memberId);
    };

    const currentMember = enrichedMembers.find(m => m.id === user?.uid);
    const isOnCooldown = cooldownRemaining > 0;

    // AI Insights state (cached)
    const [insights, setInsights] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    const handleFetchInsights = async () => {
        setInsightsLoading(true);
        try {
            const result = await getLeaderboardInsights(enrichedMembers);
            if (result) setInsights(result);
        } catch (err) {
            console.error('AI insights failed:', err);
        } finally {
            setInsightsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Room Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-start justify-between mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Leave Room
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/20 text-sm transition-all duration-300 cursor-pointer"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        <span className="font-mono text-teal-400 tracking-wider">{roomData?.code || '...'}</span>
                    </button>
                </div>

                <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{roomName}</h2>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-teal-400" />
                                    {members.length} member{members.length !== 1 ? 's' : ''}
                                </span>
                                {currentMember?.actualCount > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-cyan-400" />
                                        {currentMember.actualCount} submission{currentMember.actualCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Submit Score Button — with cooldown */}
                        {isOnCooldown ? (
                            <div className="flex flex-col items-end gap-1">
                                <button
                                    disabled
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed opacity-60"
                                >
                                    <Timer className="w-4 h-4" />
                                    Cooldown
                                </button>
                                <span className="text-[11px] text-gray-500 font-mono">
                                    {formatCountdown(cooldownRemaining)}
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={onSubmitScore}
                                className="btn-glow flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer group"
                            >
                                <Plus className="w-4 h-4" />
                                Submit Score
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Your Stats Card */}
            {currentMember && currentMember.actualCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 p-5 rounded-2xl border border-teal-500/15 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5"
                >
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Your Progress</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-2xl font-bold text-white">{currentMember.oldestScore ?? '—'}</p>
                            <p className="text-xs text-gray-500">First Score</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-teal-400">{currentMember.newestScore ?? '—'}</p>
                            <p className="text-xs text-gray-500">Latest Score</p>
                        </div>
                        <div>
                            <ImprovementBadge pct={currentMember.improvementPct} />
                            <p className="text-xs text-gray-500 mt-1">Improvement</p>
                        </div>
                    </div>

                    {/* Cooldown notice */}
                    {isOnCooldown && (
                        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                            <Timer className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <p className="text-xs text-amber-300/80">
                                Next submission available in <span className="font-mono font-semibold text-amber-300">{formatCountdown(cooldownRemaining)}</span>
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Leaderboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Improvement Leaderboard
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                    </div>
                ) : rankedMembers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No members yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {rankedMembers.map((member, idx) => {
                                const isYou = member.id === user?.uid;
                                const rank = idx + 1;
                                const isExpanded = expandedMember === member.id;
                                const hasSubs = member.submissions && member.submissions.length > 0;

                                return (
                                    <motion.div
                                        key={member.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: idx * 0.06 }}
                                        className={`rounded-xl border transition-all duration-300 overflow-hidden
                                            ${isYou
                                                ? 'border-teal-500/20 bg-teal-500/[0.04] shadow-lg shadow-teal-500/5'
                                                : 'border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03]'}`}
                                    >
                                        {/* Main Row — clickable */}
                                        <div
                                            onClick={() => hasSubs && toggleExpand(member.id)}
                                            className={`flex items-center gap-4 p-4 ${hasSubs ? 'cursor-pointer' : ''}`}
                                        >
                                            {/* Rank */}
                                            <RankBadge rank={rank} />

                                            {/* Name */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium truncate ${isYou ? 'text-teal-300' : 'text-white'}`}>
                                                        {member.displayName || 'Anonymous'}
                                                    </span>
                                                    {isYou && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400 uppercase tracking-wider">
                                                            You
                                                        </span>
                                                    )}
                                                    {/* Snapchat-style streak */}
                                                    {member.streak >= 1 && (
                                                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold
                                                            ${member.streak >= 7 ? 'bg-red-500/15 text-red-400' : member.streak >= 3 ? 'bg-orange-500/15 text-orange-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                            <Flame className={`w-3 h-3 ${member.streak >= 7 ? 'animate-pulse' : ''}`} />
                                                            {member.streak}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    {member.actualCount > 0 ? (
                                                        <span className="text-xs text-gray-500">
                                                            {member.oldestScore} → {member.newestScore}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-600 italic">Awaiting first score</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Improvement Bar */}
                                            {member.improvementPct !== null && member.improvementPct !== undefined && (
                                                <div className="w-24 hidden sm:block">
                                                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(Math.max(member.improvementPct, 0), 100)}%` }}
                                                            transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                                            className={`h-full rounded-full ${member.improvementPct >= 0
                                                                ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                                                                : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Improvement Badge */}
                                            <ImprovementBadge pct={member.improvementPct} />

                                            {/* Expand indicator */}
                                            {hasSubs && (
                                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>

                                        {/* Expanded Submission History */}
                                        <AnimatePresence>
                                            {isExpanded && hasSubs && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-1 border-t border-white/5">
                                                        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2">
                                                            Submission History
                                                        </p>
                                                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                            {member.submissions.map((sub, sIdx) => {
                                                                const isFirst = sIdx === 0;
                                                                const isLast = sIdx === member.submissions.length - 1;
                                                                // Calculate change from previous
                                                                let changeFromPrev = null;
                                                                if (sIdx > 0) {
                                                                    changeFromPrev = sub.score - member.submissions[sIdx - 1].score;
                                                                }

                                                                return (
                                                                    <div
                                                                        key={sub.id}
                                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors
                                                                            ${isLast ? 'bg-teal-500/5 border border-teal-500/10' : 'bg-white/[0.02] border border-white/[0.03]'}`}
                                                                    >
                                                                        {/* Submission number */}
                                                                        <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                                                                            {sIdx + 1}
                                                                        </span>

                                                                        {/* Date/Time */}
                                                                        <div className="flex items-center gap-1 text-gray-500 min-w-[130px]">
                                                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                                                            <span>{formatTimestamp(sub.submittedAt)}</span>
                                                                        </div>

                                                                        {/* Score */}
                                                                        <span className={`font-bold tabular-nums ${isLast ? 'text-teal-300' : 'text-gray-300'}`}>
                                                                            {sub.score}
                                                                        </span>

                                                                        {/* Tags */}
                                                                        <div className="flex items-center gap-1.5 ml-auto">
                                                                            {isFirst && (
                                                                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold">
                                                                                    Baseline
                                                                                </span>
                                                                            )}
                                                                            {isLast && !isFirst && (
                                                                                <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[10px] font-semibold">
                                                                                    Latest
                                                                                </span>
                                                                            )}
                                                                            {changeFromPrev !== null && (
                                                                                <span className={`font-semibold ${changeFromPrev > 0 ? 'text-emerald-400' : changeFromPrev < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                                                                    {changeFromPrev > 0 ? '+' : ''}{changeFromPrev}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* ===== AI Coach Section ===== */}
            {enrichedMembers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8"
                >
                    <div className="glass-card-static rounded-2xl overflow-hidden border border-white/[0.06]">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">AI Coach</h3>
                                    <p className="text-xs text-gray-500">Personalized improvement advice for each member</p>
                                </div>
                            </div>
                            <button
                                onClick={handleFetchInsights}
                                disabled={insightsLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer disabled:opacity-50"
                                style={{
                                    background: insights ? 'rgba(147,51,234,0.1)' : 'linear-gradient(135deg, rgba(147,51,234,0.15), rgba(139,92,246,0.1))',
                                    border: '1px solid rgba(147,51,234,0.2)',
                                    color: '#c084fc',
                                }}
                            >
                                {insightsLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                                ) : insights ? (
                                    <><Sparkles className="w-4 h-4" /> Refresh Insights</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Get AI Insights</>
                                )}
                            </button>
                        </div>

                        {/* Insights Cards */}
                        <AnimatePresence>
                            {insights && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 grid gap-4 sm:grid-cols-2">
                                        {insights.map((insight, i) => (
                                            <motion.div
                                                key={insight.name}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
                                                        <span className="text-sm">🎯</span>
                                                    </div>
                                                    <span className="font-bold text-white text-sm">{insight.name}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xs text-gray-400">
                                                        <span className="text-purple-300 font-semibold">Assessment:</span> {insight.assessment}
                                                    </p>
                                                    <p className="text-xs text-gray-300">
                                                        <span className="text-teal-300 font-semibold">💡 Tip:</span> {insight.tip}
                                                    </p>
                                                    <p className="text-xs text-gray-500 italic">
                                                        {insight.motivation}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="px-6 pb-4">
                                        <p className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Powered by Gemini AI — advice is personalized to each member's score trajectory
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default RoomDashboard;
