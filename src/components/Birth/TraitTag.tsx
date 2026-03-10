interface TraitTagProps {
  label: string;
  color: string;
  state?: 'base' | 'inherited' | 'eliminated' | 'mutation';
}

export function TraitTag({ label, color, state = 'base' }: TraitTagProps) {
  const stateClass = {
    base: 'text-[#d6dfbf]',
    inherited: 'text-[#efe3bf] shadow-candy',
    eliminated: 'text-[#7f8e71] opacity-50',
    mutation: 'text-[#141811] shadow-candy',
  }[state];

  return (
    <div
      className={`rounded-[0.7rem] border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] ${stateClass}`}
      style={{
        borderColor: state === 'mutation' ? '#8c6731' : `${color}44`,
        background:
          state === 'mutation'
            ? 'linear-gradient(180deg, rgba(215,179,106,0.96), rgba(183,137,62,0.96))'
            : `linear-gradient(180deg, rgba(22,33,26,0.96), ${color}${state === 'eliminated' ? '08' : '14'})`,
      }}
    >
      {label}
    </div>
  );
}
