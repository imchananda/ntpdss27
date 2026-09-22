export type SocialPlatform = 'x' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'threads' | 'weibo' | 'xiaohongshu' | 'red';
export type CampaignPhase = 'all' | 'pre' | 'show' | 'afterglow' | string;

export function normalizePhase(rawPhase?: string): CampaignPhase {
  if (!rawPhase) return 'pre';
  const p = rawPhase.toLowerCase().trim();
  if (p === 'airport') return 'pre';
  if (p === 'aftermath' || p === 'aftermath2') return 'afterglow';
  return p;
}

export interface Task {
  id: string;
  phase: CampaignPhase;
  platform: SocialPlatform;
  url: string;
  hashtags: string;
  title: string;
  focus: 0 | 1 | 2; // 0 = none, 1 = focus (⭐), 2 = hot (🔥)
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  views?: number;
  saves?: number;
  target?: number;
  targetLikes?: number;
  targetComments?: number;
  targetShares?: number;
  targetReposts?: number;
  targetSaves?: number;
  targetViews?: number;
  image?: string;
  imageFileId?: string;
  boost?: number[]; // [] or [1]=boost, [2]=focus-media
  lastUpdated?: string;
}

export interface AdminSheetTask {
  id: string;
  mark: boolean;
  platform: string;
  media: string;
  title: string;
  url: string;
  hashtag: string;
  artist?: string;
  phase?: string;
  focus?: number;
  boost?: string;
  image?: string;
  likes?: string;
  target_likes?: string;
  comments?: string;
  target_comments?: string;
  shares?: string;
  target_shares?: string;
  reposts?: string;
  target_reposts?: string;
  views?: string;
  target_views?: string;
  saves?: string;
  target_saves?: string;
  target?: string;
  last_updated?: string;
  updated_at?: string;
  source?: 'sheet' | 'local';
}

export interface CompletedState {
  [taskId: string]: {
    completedAt: string;
  };
}

export const DEFAULT_PLATFORM_HANDLES: Record<string, string> = {
  x: '@prada @NamtanTipnaree',
  instagram: '@prada @namtan.tipnaree',
  tiktok: '@prada @namtantipnaree',
  threads: '@prada @namtan.tipnaree',
  facebook: '@prada @NamtanTipnaree',
  youtube: '@prada',
  weibo: '@Prada普拉达',
  red: '@Prada普拉达',
};

export interface GlobalSetting {
  id: string;
  privateAccess: boolean;
  hashtags: string;
  showPhaseFilter: boolean;
  defaultActivePhase: string;
  defaultSection: string;
  showEndCredits: boolean;
  defaultTargetsJson?: string;
  platformHandlesJson?: string;
}

export interface FollowerStats {
  platform: string;
  count: number;
  targetCount: number;
  lastUpdated?: string;
}

// Convert AdminSheetTask (from Sheet CSV/API) to Task (used in UI)
export function mapAdminTaskToTask(item: AdminSheetTask): Task {
  return {
    id: String(item.id || ''),
    phase: normalizePhase(item.phase),
    platform: (item.platform?.toLowerCase() || 'x') as SocialPlatform,
    url: item.url || '',
    hashtags: item.hashtag || '',
    title: item.title || '',
    focus: (Number(item.focus) || 0) as 0 | 1 | 2,
    likes: parseInt(item.likes || '0', 10) || 0,
    comments: parseInt(item.comments || '0', 10) || 0,
    shares: parseInt(item.shares || '0', 10) || 0,
    reposts: parseInt(item.reposts || '0', 10) || 0,
    views: item.views ? parseInt(item.views, 10) : undefined,
    saves: item.saves ? parseInt(item.saves, 10) : undefined,
    targetLikes: item.target_likes ? parseInt(item.target_likes, 10) : undefined,
    targetComments: item.target_comments ? parseInt(item.target_comments, 10) : undefined,
    targetShares: item.target_shares ? parseInt(item.target_shares, 10) : undefined,
    targetReposts: item.target_reposts ? parseInt(item.target_reposts, 10) : undefined,
    targetSaves: item.target_saves ? parseInt(item.target_saves, 10) : undefined,
    targetViews: item.target_views ? parseInt(item.target_views, 10) : undefined,
    target: item.target ? parseInt(item.target, 10) : undefined,
    image: item.image || '',
    lastUpdated: item.last_updated || item.updated_at || '',
  };
}
