import type { TraitOrigin } from '../../types/claw';

export function TraitChip({
  label,
  color,
  active = false,
  onClick,
  source,
}: {
  label: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  source?: TraitOrigin;
}) {
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      className={`trait-chip${active ? ' trait-chip-active' : ''}`}
      style={{
        ['--chip-color' as string]: color,
      }}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span>{label}</span>
      {source ? <small>{source === 'mutation' ? 'Mutation ✦' : source}</small> : null}
    </Comp>
  );
}
