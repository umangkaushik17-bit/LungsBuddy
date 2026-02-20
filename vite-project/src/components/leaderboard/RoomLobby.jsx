import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogIn, Copy, Check, Users, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, getDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

const RoomLobby = ({ onJoinRoom }) => {
    const { user, displayName, setDisplayName } = useAuth();
    const [mode, setMode] = useState(null); // null | 'create' | 'join'
    const [roomName, setRoomName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [tempName, setTempName] = useState(displayName);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState('');
    const [copied, setCopied] = useState(false);
    const inputRef = useRef(null);

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    };

    const handleCreateRoom = async () => {
        if (!tempName.trim()) { setError('Enter your display name'); return; }
        if (!roomName.trim()) { setError('Enter a room name'); return; }
        setError('');
        setLoading(true);

        try {
            setDisplayName(tempName.trim());
            const code = generateCode();
            const roomRef = await addDoc(collection(db, 'rooms'), {
                name: roomName.trim(),
                code,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                memberCount: 1,
            });

            // Add creator as first member
            await setDoc(doc(db, 'rooms', roomRef.id, 'members', user.uid), {
                displayName: tempName.trim(),
                joinedAt: serverTimestamp(),
                firstScore: null,
                latestScore: null,
                improvementPct: null,
                totalSubmissions: 0,
                lastSubmittedAt: null,
            });

            setCreatedCode(code);
            setLoading(false);

            // Auto-navigate after showing code
            setTimeout(() => {
                onJoinRoom(roomRef.id, roomName.trim());
            }, 3000);
        } catch (err) {
            console.error('Create room failed:', err);
            setError('Failed to create room. Check your Firebase config.');
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!tempName.trim()) { setError('Enter your display name'); return; }
        if (!joinCode.trim() || joinCode.trim().length < 4) { setError('Enter a valid room code'); return; }
        setError('');
        setLoading(true);

        try {
            setDisplayName(tempName.trim());
            const q = query(collection(db, 'rooms'), where('code', '==', joinCode.trim().toUpperCase()));
            const snap = await getDocs(q);

            if (snap.empty) {
                setError('Room not found. Double-check the code.');
                setLoading(false);
                return;
            }

            const roomDoc = snap.docs[0];
            const roomId = roomDoc.id;
            const roomData = roomDoc.data();

            // Add as member — only set initial scores for NEW members
            const memberRef = doc(db, 'rooms', roomId, 'members', user.uid);
            const memberSnap = await getDoc(memberRef);
            if (!memberSnap.exists()) {
                // New member — set initial values
                await setDoc(memberRef, {
                    displayName: tempName.trim(),
                    joinedAt: serverTimestamp(),
                    firstScore: null,
                    latestScore: null,
                    improvementPct: null,
                    totalSubmissions: 0,
                    lastSubmittedAt: null,
                });
                // Increment member count only for new members
                await updateDoc(doc(db, 'rooms', roomId), { memberCount: increment(1) });
            } else {
                // Existing member re-joining — only update display name
                await setDoc(memberRef, {
                    displayName: tempName.trim(),
                }, { merge: true });
            }

            setLoading(false);
            onJoinRoom(roomId, roomData.name);
        } catch (err) {
            console.error('Join room failed:', err);
            setError('Failed to join room. Try again.');
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(createdCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Success state — room created, showing code
    if (createdCode) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto text-center"
            >
                <div className="p-8 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/5">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center"
                    >
                        <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>

                    <h3 className="text-2xl font-bold text-white mb-2">Room Created!</h3>
                    <p className="text-gray-400 text-sm mb-6">Share this code with your friends</p>

                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="px-6 py-3 bg-[#0d1424] rounded-xl border border-white/10 font-mono text-3xl tracking-[0.3em] text-teal-400 font-bold">
                            {createdCode}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="p-3 rounded-xl bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/30 transition-all duration-300 cursor-pointer"
                        >
                            {copied ? <Check className="w-5 h-5 text-teal-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                        </button>
                    </div>

                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                        className="h-1 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-3">Entering room automatically...</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-lg mx-auto">
            {/* Display Name Input (always visible) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <label className="block text-sm font-medium text-gray-400 mb-2">Your Display Name</label>
                <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0d1424] border border-white/10 text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-300"
                    maxLength={20}
                />
            </motion.div>

            {/* Mode Selection */}
            <AnimatePresence mode="wait">
                {!mode && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {/* Create Room Card */}
                        <button
                            onClick={() => setMode('create')}
                            className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-teal-500/5 hover:border-teal-500/20 transition-all duration-500 text-left cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-teal-500/10 transition-all duration-500">
                                <Plus className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Create Room</h3>
                            <p className="text-xs text-gray-500">Start a new challenge room and invite friends</p>
                        </button>

                        {/* Join Room Card */}
                        <button
                            onClick={() => setMode('join')}
                            className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all duration-500 text-left cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-cyan-500/10 transition-all duration-500">
                                <LogIn className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Join Room</h3>
                            <p className="text-xs text-gray-500">Enter a code to join an existing room</p>
                        </button>
                    </motion.div>
                )}

                {/* Create Room Form */}
                {mode === 'create' && (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-teal-400" />
                                Create a Room
                            </h3>
                            <input
                                ref={inputRef}
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="Room name (e.g., Health Warriors 💪)"
                                className="w-full px-4 py-3 rounded-xl bg-[#0d1424] border border-white/10 text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 mb-4"
                                maxLength={30}
                            />

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400 text-sm mb-3"
                                >{error}</motion.p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setMode(null); setError(''); }}
                                    className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={loading}
                                    className="flex-1 btn-glow flex items-center justify-center gap-2 px-6 py-2.5 text-sm cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Create Room</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Join Room Form */}
                {mode === 'join' && (
                    <motion.div
                        key="join"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <LogIn className="w-5 h-5 text-cyan-400" />
                                Join a Room
                            </h3>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Enter room code..."
                                className="w-full px-4 py-3 rounded-xl bg-[#0d1424] border border-white/10 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 font-mono text-lg tracking-[0.2em] text-center uppercase mb-4"
                                maxLength={6}
                            />

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400 text-sm mb-3"
                                >{error}</motion.p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setMode(null); setError(''); }}
                                    className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={loading}
                                    className="flex-1 btn-glow flex items-center justify-center gap-2 px-6 py-2.5 text-sm cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Join Room</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoomLobby;
