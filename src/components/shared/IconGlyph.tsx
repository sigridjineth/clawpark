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
  type LucideProps,
} from 'lucide-react';

const iconMap = {
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
} as const;

export function IconGlyph({ name, ...props }: { name: keyof typeof iconMap } & LucideProps) {
  const Component = iconMap[name] ?? Sparkles;
  return <Component {...props} />;
}
