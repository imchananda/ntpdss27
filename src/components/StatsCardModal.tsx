import { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import DigitalPassCard from './DigitalPassCard';

interface Task {
    id: string;
    phase: string;
    platform: string;
    boost?: number[];
}

interface CompletedState {
    [taskId: string]: { completedAt: string };
}

interface StatsCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    completed: Record<string, CompletedState>;
    allTasks: Record<string, Task[]>;
    totalTasksCount: number;
}

const PLATFORM_EMOJI: Record<string, string> = {
    instagram: '📸',
    tiktok: '🎵',
    x: '🐦',
    facebook: '👥',
    youtube: '▶️',
    threads: '🧵',
};

const PLATFORM_NAME: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    x: 'X (Twitter)',
    facebook: 'Facebook',
    youtube: 'YouTube',
    threads: 'Threads',
};



function formatDate(isoStr: string, lang: string): string {
    const d = new Date(isoStr);
    return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function timeDiff(start: string, end: string, language: string): string {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return language === 'th' ? '0 วัน' : '0 Days';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return language === 'th' ? `${days} วัน` : `${days} Days`;
    return language === 'th' ? `${hours} ชั่วโมง` : `${hours} Hours`;
}

export default function StatsCardModal({ isOpen, onClose, completed, allTasks, totalTasksCount }: StatsCardModalProps) {
    const { language } = useLanguage();

    const phaseInfos = useMemo(() => {
        const allTaskList = Object.values(allTasks).flat();
        if (allTaskList.length === 0) return [];

        const isTaskDone = (t: Task) => {
            if (!t) return false;
            if (completed[t.phase] && completed[t.phase][t.id]) return true;
            return Object.values(completed).some(phaseMap => !!(phaseMap && phaseMap[t.id]));
        };

        const p1: Task[] = [];
        const p2: Task[] = [];
        const p3: Task[] = [];

        allTaskList.forEach(t => {
            const p = (t.phase || '').toLowerCase().trim();
            const a = ((t as any).artist || '').toLowerCase().trim();

            // 1. Check explicit phase/stage tags (Highest Priority)
            if (
                p === 'aftermath' || p === 'afterglow' || p === 'aftermath2' ||
                p === 'phase3' || p === '3' || a === 'aftermath' || a === 'afterglow'
            ) {
                p3.push(t);
            } else if (
                p === 'show' || p === 'fashion' || p === 'phase2' ||
                p === '2' || a === 'show' || a === 'fashion'
            ) {
                p2.push(t);
            } else if (
                p === 'pre' || p === 'airport' || p === 'phase1' ||
                p === '1' || a === 'pre' || a === 'airport'
            ) {
                p1.push(t);
            } else {
                // 2. Secondary check: check boost array tags if phase is not explicitly specified
                const hasB1 = Array.isArray(t.boost) && t.boost.includes(1);
                const hasB2 = Array.isArray(t.boost) && t.boost.includes(2);
                const hasB3 = Array.isArray(t.boost) && t.boost.includes(3);

                if (hasB3) p3.push(t);
                else if (hasB2) p2.push(t);
                else if (hasB1) p1.push(t);
                else p1.push(t); // Default fallback to Phase 1
            }
        });

        // Fallback: If p2 and p3 are completely empty (e.g. single sheet without any phase tags), split list into 3 equal parts
        if (p1.length > 0 && p2.length === 0 && p3.length === 0) {
            const third = Math.ceil(p1.length / 3);
            const fullList = [...p1];
            p1.length = 0;
            p1.push(...fullList.slice(0, third));
            p2.push(...fullList.slice(third, third * 2));
            p3.push(...fullList.slice(third * 2));
        }

        const p1Done = p1.filter(isTaskDone).length;
        const p2Done = p2.filter(isTaskDone).length;
        const p3Done = p3.filter(isTaskDone).length;

        return [
            {
                phaseKey: 'Boost Focus',
                titleKey: 'stampPhase1Title',
                completedCount: p1Done,
                totalCount: p1.length,
                isUnlocked: p1.length > 0 && p1Done === p1.length,
            },
            {
                phaseKey: 'Fashion Media',
                titleKey: 'stampPhase2Title',
                completedCount: p2Done,
                totalCount: p2.length,
                isUnlocked: p2.length > 0 && p2Done === p2.length,
            },
            {
                phaseKey: 'Aftermath',
                titleKey: 'stampPhase3Title',
                completedCount: p3Done,
                totalCount: p3.length,
                isUnlocked: p3.length > 0 && p3Done === p3.length,
            },
        ];
    }, [allTasks, completed]);

    const stats = useMemo(() => {
        // Collect all completed tasks with timestamps
        const completedTasks: Array<{ task: Task; completedAt: string }> = [];
        const allTaskList = Object.values(allTasks).flat();

        allTaskList.forEach(task => {
            let completedInfo: { completedAt: string } | null = null;
            if (completed[task.phase] && completed[task.phase][task.id]) {
                completedInfo = completed[task.phase][task.id];
            } else {
                for (const phaseMap of Object.values(completed)) {
                    if (phaseMap && phaseMap[task.id]) {
                        completedInfo = phaseMap[task.id];
                        break;
                    }
                }
            }

            if (completedInfo) {
                completedTasks.push({
                    task,
                    completedAt: completedInfo.completedAt || new Date().toISOString()
                });
            }
        });

        // Fallback: If completedTasks is still empty but completed has entries (e.g. task ID mismatch or custom task)
        if (completedTasks.length === 0) {
            Object.entries(completed).forEach(([phaseName, phaseCompleted]) => {
                if (phaseCompleted && typeof phaseCompleted === 'object') {
                    Object.entries(phaseCompleted).forEach(([taskId, info]) => {
                        if (info && info.completedAt) {
                            completedTasks.push({
                                task: { id: taskId, phase: phaseName, platform: 'x' },
                                completedAt: info.completedAt,
                            });
                        }
                    });
                }
            });
        }

        if (completedTasks.length === 0) return null;

        // Platform breakdown
        const platformCount: Record<string, number> = {};
        completedTasks.forEach(({ task }) => {
            platformCount[task.platform] = (platformCount[task.platform] || 0) + 1;
        });
        const topPlatform = Object.entries(platformCount).sort((a, b) => b[1] - a[1])[0];

        // Phase breakdown
        const phaseCount: Record<string, number> = {};
        completedTasks.forEach(({ task }) => {
            const p = task.phase === 'aftermath2' ? 'aftermath' : task.phase;
            phaseCount[p] = (phaseCount[p] || 0) + 1;
        });
        const topPhase = Object.entries(phaseCount).sort((a, b) => b[1] - a[1])[0];

        // Dates
        const sorted = [...completedTasks].sort((a, b) =>
            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
        const firstDate = sorted[0].completedAt;
        const lastDate = sorted[sorted.length - 1].completedAt;

        // Completion percentage — use floor so 99.8% shows as 99%, not 100%
        const pct = totalTasksCount > 0 ? Math.floor((completedTasks.length / totalTasksCount) * 100) : 0;

        // Average tasks per day
        const daysDiff = Math.max(1, Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000));
        const tasksPerDay = (completedTasks.length / daysDiff).toFixed(1);

        return {
            completedCount: completedTasks.length,
            totalCount: totalTasksCount,
            pct,
            topPlatform: topPlatform?.[0] || null,
            topPlatformCount: topPlatform?.[1] || 0,
            topPhase: topPhase?.[0] || null,
            topPhaseCount: topPhase?.[1] || 0,
            firstDate,
            lastDate,
            duration: timeDiff(firstDate, lastDate, language),
            tasksPerDay,
            platformCount,
            phaseCount,
        };
    }, [completed, allTasks, totalTasksCount, language]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-prada-charcoal/70 backdrop-blur-md" />

            {/* Modal */}
            <div
                className="relative w-full max-w-md animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-gradient-to-b from-prada-offwhite to-prada-cream rounded-t-3xl sm:rounded-3xl border border-prada-warm/30 shadow-2xl shadow-prada-gold/10 overflow-hidden max-h-[90vh] overflow-y-auto">

                    {/* Gold glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-prada-gold via-transparent to-prada-gold/30 rounded-3xl blur-2xl opacity-20 pointer-events-none" />

                    <div className="relative p-5 pb-6">
                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-prada-charcoal/10 hover:bg-prada-charcoal/20 flex items-center justify-center text-prada-charcoal/50 hover:text-prada-charcoal transition-colors"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold text-prada-charcoal tracking-wider">
                                {language === 'th' ? 'บัตรสะสม & สถิติของฉัน' : 'My Pass & Stats'}
                            </h2>
                            <p className="text-prada-charcoal/40 text-[10px] uppercase tracking-widest">
                                Namtan × Prada’s SS27
                            </p>
                        </div>

                        {/* 💳 Digital Pass Card */}
                        <div className="mb-4">
                            <DigitalPassCard
                                phaseInfos={phaseInfos}
                                totalMissionsCompleted={stats?.completedCount || 0}
                                totalMissionsCount={totalTasksCount}
                            />
                        </div>

                        {!stats ? (
                            <div className="text-center py-8">
                                <div className="text-5xl mb-3">🎯</div>
                                <p className="text-prada-charcoal/50 text-sm">
                                    {language === 'th'
                                        ? 'เริ่มทำ mission แล้วค่อย\nกลับมาดูสถิตินะคะ! ✨'
                                        : 'Complete some missions first,\nthen check back here! ✨'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {/* Stats — Luxury Elegant Design matching Prada Pass Card */}
                                <div className="flex flex-col gap-2.5">
                                    {/* Platform หลัก — Featured Card */}
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg shadow-sm">
                                                {PLATFORM_EMOJI[stats.topPlatform || ''] || '📱'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-400 text-[9.5px] font-extrabold uppercase tracking-widest">
                                                    {language === 'th' ? 'PLATFORM หลัก' : 'TOP PLATFORM'}
                                                </span>
                                                <span className="text-slate-900 text-sm font-black tracking-tight">
                                                    {PLATFORM_NAME[stats.topPlatform || ''] || stats.topPlatform || '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-amber-700 text-base font-black font-mono">{stats.topPlatformCount}</span>
                                            <span className="text-slate-400 text-[10px] font-bold block">{language === 'th' ? 'ภารกิจ' : 'tasks'}</span>
                                        </div>
                                    </div>

                                    {/* Compact Detail Stats List */}
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
                                        {/* Avg/day */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-amber-500 text-base">⚡</span>
                                                <span className="text-slate-600 text-xs font-bold">
                                                    {language === 'th' ? 'เฉลี่ย/วัน' : 'Avg per day'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-900 text-sm font-black font-mono">{stats.tasksPerDay}</span>
                                                <span className="text-slate-400 text-[10px] font-semibold ml-1">
                                                    {language === 'th' ? 'ภารกิจ' : 'tasks'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Started */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-rose-500 text-base">🚀</span>
                                                <span className="text-slate-600 text-xs font-bold">
                                                    {language === 'th' ? 'เริ่มทำตั้งแต่' : 'Started'}
                                                </span>
                                            </div>
                                            <span className="text-slate-900 text-xs font-black">
                                                {formatDate(stats.firstDate, language)}
                                            </span>
                                        </div>

                                        {/* Duration */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-indigo-500 text-base">⏱️</span>
                                                <span className="text-slate-600 text-xs font-bold">
                                                    {language === 'th' ? 'ระยะเวลา' : 'Duration'}
                                                </span>
                                            </div>
                                            <span className="text-slate-900 text-xs font-black font-mono">{stats.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
