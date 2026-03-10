import type { SkillBadge } from '../types/claw';

export const SKILL_BADGES: SkillBadge[] = [
  { id: 'skill-review', label: 'Code Review', icon: 'Search', dominance: 0.88, color: '#9fd8ff' },
  { id: 'skill-strategy', label: 'Systems Design', icon: 'Workflow', dominance: 0.83, color: '#9effbf' },
  { id: 'skill-prompting', label: 'Promptcraft', icon: 'Sparkles', dominance: 0.81, color: '#ff9df1' },
  { id: 'skill-testing', label: 'Testing', icon: 'ShieldCheck', dominance: 0.85, color: '#ffd77a' },
  { id: 'skill-animation', label: 'Motion', icon: 'PenTool', dominance: 0.72, color: '#8ee7ff' },
  { id: 'skill-story', label: 'Storytelling', icon: 'MessageSquareQuote', dominance: 0.66, color: '#ffb089' },
  { id: 'skill-security', label: 'Security', icon: 'Shield', dominance: 0.84, color: '#c7b0ff' },
  { id: 'skill-debug', label: 'Debugging', icon: 'Bug', dominance: 0.8, color: '#ff9a8a' },
  { id: 'skill-vision', label: 'Vision', icon: 'Radar', dominance: 0.74, color: '#7df6cf' },
  { id: 'skill-velocity', label: 'Velocity', icon: 'Rocket', dominance: 0.78, color: '#ffcc70' },
];

export const SKILL_BADGE_BY_ID = Object.fromEntries(SKILL_BADGES.map((badge) => [badge.id, badge]));
