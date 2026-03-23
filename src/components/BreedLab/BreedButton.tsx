interface BreedButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function BreedButton({ onClick, disabled = false }: BreedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="jp-btn px-8 py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
    >
      {disabled ? 'Initiating…' : 'Initiate Breeding'}
    </button>
  );
}
