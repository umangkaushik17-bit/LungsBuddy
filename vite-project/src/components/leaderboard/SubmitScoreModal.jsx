import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import InputSection from '../InputSection';



const SubmitScoreModal = ({ isOpen, onClose, roomId, calculateRisk }) => {
    const { user, displayName } = useAuth();
    const [phase, setPhase] = useState('input'); // 'input' | 'submitting' | 'done'
    const [result, setResult] = useState(null);
    const [improvement, setImprovement] = useState(null);

    const handleCalculate = async (formData) => {
        if (!calculateRisk) { console.error('calculateRisk prop missing'); return; }
        if (!roomId) { console.error('roomId is null/undefined'); return; }
        if (!user?.uid) { console.error('user not authenticated'); return; }

        setPhase('submitting');

        try {
            // Get current member data first to check cooldown
            const memberRef = doc(db, 'rooms', roomId, 'members', user.uid);
            const memberSnap = await getDoc(memberRef);
            const memberData = memberSnap.exists() ? memberSnap.data() : {};
            console.log('Current member data:', memberData);

            // ===== 24-hour cooldown check =====
            if (memberData.lastSubmittedAt) {
                const lastTime = memberData.lastSubmittedAt?.toDate
                    ? memberData.lastSubmittedAt.toDate().getTime()
                    : memberData.lastSubmittedAt;
                const elapsed = Date.now() - lastTime;
                const cooldownMs = 24 * 60 * 60 * 1000;
                if (elapsed < cooldownMs) {
                    const remaining = cooldownMs - elapsed;
                    const hours = Math.floor(remaining / (1000 * 60 * 60));
                    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    alert(`Cooldown active! You can submit again in ${hours}h ${mins}m. Only one submission per 24 hours is allowed.`);
                    setPhase('input');
                    return;
                }
            }

            const calcResult = calculateRisk(formData);
            const score = calcResult.score;
            console.log('Score calculated:', score, 'Breakdown:', calcResult.breakdown);
            setResult(calcResult);

            const isFirst = memberData.firstScore === null || memberData.firstScore === undefined;
            const firstScore = isFirst ? score : memberData.firstScore;
            const latestScore = score;

            // Calculate improvement %
            let improvementPct = null;
            if (!isFirst) {
                const denominator = 100 - firstScore;
                if (denominator > 0) {
                    improvementPct = ((latestScore - firstScore) / denominator) * 100;
                    improvementPct = Math.round(improvementPct * 10) / 10;
                } else {
                    improvementPct = 0; // Already at 100
                }
            }
            setImprovement(improvementPct);

            // Save submission
            console.log('Writing submission to Firestore...');
            await addDoc(collection(db, 'rooms', roomId, 'submissions'), {
                userId: user.uid,
                displayName: displayName,
                score,
                breakdown: calcResult.breakdown || {},
                submittedAt: serverTimestamp(),
            });
            console.log('Submission saved!');

            // Count actual submissions for this user
            const subsQuery = query(
                collection(db, 'rooms', roomId, 'submissions'),
                where('userId', '==', user.uid)
            );
            const subsSnap = await getDocs(subsQuery);
            const actualCount = subsSnap.size;
            console.log('Actual submission count:', actualCount);

            // Update member record
            console.log('Updating member record...');
            await setDoc(memberRef, {
                displayName: displayName,
                firstScore: firstScore,
                latestScore: latestScore,
                improvementPct: improvementPct,
                totalSubmissions: actualCount,
                lastSubmittedAt: serverTimestamp(),
            }, { merge: true });
            console.log('Member record updated!');

            setPhase('done');
        } catch (err) {
            console.error('Submit score failed:', err);
            alert('Failed to save score: ' + err.message);
            setPhase('input');
        }
    };

    const handleClose = () => {
        setPhase('input');
        setResult(null);
        setImprovement(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
                style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="fixed top-6 right-6 z-[210] p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="w-full max-w-4xl mx-auto py-8 px-4">
                    <AnimatePresence mode="wait">
                        {/* Phase 1: Input */}
                        {phase === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <InputSection onCalculate={handleCalculate} forceVisible={true} />
                            </motion.div>
                        )}

                        {/* Phase 2: Submitting */}
                        {phase === 'submitting' && (
                            <motion.div
                                key="submitting"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center justify-center py-32"
                            >
                                <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
                                <p className="text-lg text-white font-medium">Submitting your score...</p>
                                <p className="text-sm text-gray-500 mt-1">Updating the leaderboard</p>
                            </motion.div>
                        )}

                        {/* Phase 3: Done */}
                        {phase === 'done' && result && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-md mx-auto py-20"
                            >
                                <div className="text-center p-8 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-teal-500/30"
                                    >
                                        <CheckCircle className="w-10 h-10 text-white" />
                                    </motion.div>

                                    <h3 className="text-2xl font-bold text-white mb-2">Score Submitted!</h3>

                                    <div className="mt-6 grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                            <p className="text-3xl font-bold text-white">{result.score}</p>
                                            <p className="text-xs text-gray-500 mt-1">Lung Health Score</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                            {improvement !== null ? (
                                                <>
                                                    <p className={`text-3xl font-bold ${improvement >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {improvement >= 0 ? '+' : ''}{improvement}%
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">Improvement</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-3xl font-bold text-cyan-400">🎯</p>
                                                    <p className="text-xs text-gray-500 mt-1">Baseline Set!</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {improvement === null && (
                                        <p className="text-sm text-gray-400 mb-6">
                                            This is your first submission — it's now your baseline. Submit again later to start tracking improvement!
                                        </p>
                                    )}

                                    <button
                                        onClick={handleClose}
                                        className="btn-glow flex items-center justify-center gap-2 px-6 py-2.5 text-sm cursor-pointer w-full"
                                    >
                                        Back to Leaderboard <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SubmitScoreModal;
