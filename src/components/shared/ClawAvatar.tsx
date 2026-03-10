import { useId } from 'react';
import type { ClawVisual, ShapeModifier } from '../../types/claw';

function renderModifier(modifier: ShapeModifier, accent: string) {
  switch (modifier) {
    case 'symmetric':
      return <ellipse cx="90" cy="90" rx="42" ry="66" fill={accent} opacity="0.16" />;
    case 'tentacle':
      return (
        <path
          d="M40 120 C52 82, 68 70, 84 88 C98 104, 104 136, 132 128"
          fill="none"
          stroke={accent}
          strokeLinecap="round"
          strokeWidth="10"
          opacity="0.58"
        />
      );
    case 'angular':
      return <path d="M90 38 L138 84 L110 142 L54 132 L44 70 Z" fill={accent} opacity="0.16" />;
    case 'grid':
      return (
        <g opacity="0.3" stroke={accent} strokeWidth="4">
          <path d="M52 62 H128" />
          <path d="M52 90 H128" />
          <path d="M52 118 H128" />
          <path d="M68 50 V130" />
          <path d="M90 50 V130" />
          <path d="M112 50 V130" />
        </g>
      );
    case 'fragmented':
      return (
        <g opacity="0.26" fill={accent}>
          <path d="M46 66 L72 58 L66 86 L38 92 Z" />
          <path d="M118 54 L142 70 L128 94 L104 76 Z" />
          <path d="M74 118 L94 106 L106 136 L82 144 Z" />
        </g>
      );
    case 'organic':
      return (
        <path
          d="M38 92 C38 54, 76 30, 112 42 C144 54, 152 108, 126 134 C98 162, 50 150, 38 92 Z"
          fill={accent}
          opacity="0.14"
        />
      );
    case 'geometric':
      return (
        <g opacity="0.38" fill="none" stroke={accent} strokeWidth="4">
          <circle cx="90" cy="90" r="48" />
          <circle cx="90" cy="90" r="24" />
          <path d="M90 30 V150" />
          <path d="M30 90 H150" />
        </g>
      );
    case 'spiral':
      return (
        <path
          d="M92 56 C118 56, 124 94, 100 106 C72 120, 54 80, 80 68 C104 58, 126 78, 120 108"
          fill="none"
          stroke={accent}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.48"
        />
      );
    case 'crystalline':
      return (
        <g opacity="0.22" fill={accent}>
          <path d="M90 34 L120 68 L90 102 L60 68 Z" />
          <path d="M132 92 L148 112 L132 132 L116 112 Z" />
          <path d="M48 94 L62 112 L48 130 L34 112 Z" />
        </g>
      );
    default:
      return null;
  }
}

export function ClawAvatar({ visual, name, size = 180, pulse = false }: { visual: ClawVisual; name: string; size?: number; pulse?: boolean }) {
  const gradientId = useId();
  const modifiers = [...new Set(visual.shapeModifiers)].slice(0, 3);

  return (
    <div
      className={`avatar-shell avatar-pattern-${visual.pattern}${pulse ? ' animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        ['--primary' as string]: visual.primaryColor,
        ['--secondary' as string]: visual.secondaryColor,
        ['--glow' as string]: `${visual.glowIntensity}`,
      }}
      aria-label={`${name} avatar`}
    >
      <svg viewBox="0 0 180 180" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stopColor={visual.primaryColor} />
            <stop offset="100%" stopColor={visual.secondaryColor} />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r="70" fill={`url(#${gradientId})`} opacity="0.22" />
        <path
          d="M44 88 C44 48, 72 28, 108 30 C138 34, 154 60, 148 94 C140 136, 112 154, 76 148 C50 142, 38 118, 44 88 Z"
          fill={`url(#${gradientId})`}
        />
        {modifiers.map((modifier) => (
          <g key={modifier}>{renderModifier(modifier, visual.secondaryColor)}</g>
        ))}
        <circle cx="72" cy="84" r="8" fill="#08131f" opacity="0.8" />
        <circle cx="112" cy="84" r="8" fill="#08131f" opacity="0.8" />
        <path
          d="M72 118 C84 126, 102 126, 114 114"
          fill="none"
          stroke="#08131f"
          strokeLinecap="round"
          strokeWidth="8"
          opacity="0.74"
        />
      </svg>
    </div>
  );
}
