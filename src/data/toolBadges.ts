import type { ToolBadge } from '../types/claw';

export const TOOL_BADGES: ToolBadge[] = [
  {
    id: 'tool-search-probe',
    label: 'Search Probe',
    icon: 'Search',
    description: 'Sweeps the enclosure for hidden seams, weak assumptions, and stale tracks.',
    potency: 0.86,
    color: '#9fd8ff',
  },
  {
    id: 'tool-workflow-grid',
    label: 'Workflow Grid',
    icon: 'Workflow',
    description: 'Routes long-running experiments through stable stages and visible checkpoints.',
    potency: 0.82,
    color: '#9effbf',
  },
  {
    id: 'tool-spark-injector',
    label: 'Spark Injector',
    icon: 'Sparkles',
    description: 'Seeds fresh prompts and lateral jumps when the lab needs a new branch.',
    potency: 0.78,
    color: '#ff9df1',
  },
  {
    id: 'tool-sandbox-ward',
    label: 'Sandbox Ward',
    icon: 'ShieldCheck',
    description: 'Contains risky trials, validates evidence, and keeps the hatchery deterministic.',
    potency: 0.88,
    color: '#ffd77a',
  },
  {
    id: 'tool-orbit-board',
    label: 'Orbit Board',
    icon: 'Orbit',
    description: 'Keeps collaborating agents, references, and tasks in the same gravitational field.',
    potency: 0.75,
    color: '#c7b0ff',
  },
  {
    id: 'tool-seer-lens',
    label: 'Seer Lens',
    icon: 'Eye',
    description: 'Surfaces future breakpoints, hidden side effects, and off-screen context.',
    potency: 0.8,
    color: '#7df6cf',
  },
  {
    id: 'tool-forge-armature',
    label: 'Forge Armature',
    icon: 'WandSparkles',
    description: 'Turns rough fragments into presentable prototypes and cinematic reveals.',
    potency: 0.84,
    color: '#ffb089',
  },
  {
    id: 'tool-launch-rail',
    label: 'Launch Rail',
    icon: 'Rocket',
    description: 'Accelerates a hatchling from sketch to shippable experiment.',
    potency: 0.79,
    color: '#ffcc70',
  },
  {
    id: 'tool-radar-array',
    label: 'Radar Array',
    icon: 'Radar',
    description: 'Maps moving systems, lineage drift, and new signals across the park.',
    potency: 0.81,
    color: '#8ee7ff',
  },
];

export const TOOL_BADGE_BY_ID = Object.fromEntries(TOOL_BADGES.map((badge) => [badge.id, badge]));
