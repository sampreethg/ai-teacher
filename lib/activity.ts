export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  type?: 'research' | 'lesson' | 'checkpoint' | 'doubt';
}

const STORAGE_KEY = 'ai_teacher_recent_activity';

export function getStoredActivities(): ActivityItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored activities:', e);
    return [];
  }
}

export function saveActivities(items: ActivityItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 10)));
  } catch (e) {
    console.error('Failed to save activities:', e);
  }
}

export function addActivity(activity: {
  title: string;
  description: string;
  type?: ActivityItem['type'];
}): void {
  const existing = getStoredActivities();
  const newItem: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: activity.title,
    description: activity.description,
    timestamp: Date.now(),
    read: false,
    type: activity.type || 'lesson'
  };
  const updated = [newItem, ...existing].slice(0, 10);
  saveActivities(updated);
}

export function markAllActivitiesRead(): void {
  const existing = getStoredActivities();
  const updated = existing.map(item => ({ ...item, read: true }));
  saveActivities(updated);
}

export function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
