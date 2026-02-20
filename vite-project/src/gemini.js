// ================================================================
// Groq AI Service — LungBuddy Recommendations & Insights
// ================================================================

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ===== Shared helper: call Groq with retry =====
const callGroq = async (prompt, retries = 2) => {
    if (!GROQ_KEY || GROQ_KEY === 'YOUR_GROQ_API_KEY_HERE') return null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_KEY}`,
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    response_format: { type: 'json_object' },
                }),
            });

            if (res.status === 429 && attempt < retries) {
                const delay = (attempt + 1) * 2000;
                console.warn(`Groq rate limited, retrying in ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);

            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || '';
            const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            // Handle both {recommendations:[...]} and direct array
            return Array.isArray(parsed) ? parsed : parsed.recommendations || parsed.insights || Object.values(parsed)[0];
        } catch (err) {
            if (attempt === retries) {
                console.error('Groq AI failed:', err);
                return null;
            }
        }
    }
    return null;
};

// ================================================================
// 1. AI-Powered Personal Recommendations
// ================================================================
export const getAIRecommendations = async (score, breakdown, userParams) => {
    const p = userParams || {};
    const count = score >= 80 ? 2 : score >= 50 ? 3 : 4;

    const prompt = `Lung health advisor. User score: ${score}/100.

AQI: ${p.aqi ?? '?'}, Smoking: ${p.smoking ?? 'No'}, Vaping: ${p.vapingStatus ?? 'No'}, Mask: ${p.maskUsage ?? '?'}, Sleep: ${p.sleepHours ?? '?'}h, Age: ${p.age ?? '?'}
Risk lost: Env ${breakdown?.environmental ?? '?'}/35, Behav ${breakdown?.behavioral ?? '?'}/20, Bio ${breakdown?.biological ?? '?'}/15, Sleep ${breakdown?.sleep ?? '?'}/15, Disease ${breakdown?.disease ?? '?'}/15

Give ONLY ${count} recommendations targeting the WORST risk domains above. ${score >= 80 ? 'Score is good — only mention weak spots.' : 'Focus on biggest risks.'}
Return JSON: {"recommendations":[{"text":"advice","category":"Status|Urgent|Protection|Lifestyle|Medical|Environment","priority":1}]}`;

    return callGroq(prompt);
};

// ================================================================
// 2. Leaderboard Insights — Per-Member Improvement Advice
// ================================================================
export const getLeaderboardInsights = async (members) => {
    const memberSummaries = members.map((m, i) => {
        const pct = m.improvementPct !== null && m.improvementPct !== undefined
            ? `${m.improvementPct > 0 ? '+' : ''}${m.improvementPct}%`
            : 'N/A';
        return `${i + 1}. ${m.displayName}: ${m.oldestScore ?? m.firstScore ?? '?'}→${m.newestScore ?? m.latestScore ?? '?'}, Imp: ${pct}`;
    }).join('\n');

    const prompt = `Health coach for lung health app. Members compete on improvement %.

${memberSummaries}

For EACH member give assessment, tip, and motivation. Return JSON:
{"insights":[{"name":"name","assessment":"trajectory","tip":"advice","motivation":"competitive nudge"}]}
Keep each field 1-2 sentences.`;

    return callGroq(prompt);
};
