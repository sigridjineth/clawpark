interface TraitTagProps {
  label: string;
  color: string;
  state?: 'base' | 'inherited' | 'eliminated' | 'mutation';
}

export function TraitTag({ label, color, state = 'base' }: TraitTagProps) {
  const styles = {
    base: 'border-jungle-600/40 bg-jungle-900 text-bone-dim',
    inherited: 'border-amber/30 bg-jungle-800 text-bone shadow-amber',
    eliminated: 'border-jungle-700/30 bg-jungle-950 text-bone-muted opacity-40',
    mutation: 'border-danger bg-danger text-bone font-bold shadow-danger',
  }[state];

  return (
    <div
      className={`rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${styles}`}
      style={state === 'base' ? { borderColor: `${color}33` } : undefined}
    >
      {state === 'mutation' && '✦ '}{label}
    </div>
  );
}
