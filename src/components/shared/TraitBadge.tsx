import {
  Bug,
  Eye,
  MessageSquareQuote,
  Orbit,
  PenTool,
  Radar,
  Rocket,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { SkillBadge, SoulTrait, ToolBadge } from '../../types/claw';

interface TraitBadgeProps {
  item: SoulTrait | SkillBadge | ToolBadge;
  kind: 'soul' | 'skill' | 'tool';
  subtle?: boolean;
}

export function TraitBadge({ item, kind, subtle = false }: TraitBadgeProps) {
  const iconMap: Record<string, LucideIcon> = {
    Search,
    Workflow,
    Sparkles,
    ShieldCheck,
    PenTool,
    MessageSquareQuote,
    Shield,
    Bug,
    Radar,
    Rocket,
    Orbit,
    Eye,
    WandSparkles,
  };

  const Icon = kind === 'soul' ? Sparkles : iconMap[(item as SkillBadge | ToolBadge).icon] ?? Sparkles;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${
        subtle
          ? 'border-[#334239] bg-[#172019] text-[#b8c49e]'
          : 'border-[#3d4f43] bg-[#1b241d] text-[#e8ddb9]'
      }`}
      style={{ borderColor: `${item.color}55`, color: subtle ? undefined : item.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </span>
  );
}
