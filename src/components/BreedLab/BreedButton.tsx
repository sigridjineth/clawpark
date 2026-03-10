interface BreedButtonProps {
  onClick: () => void;
}

export function BreedButton({ onClick }: BreedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="jp-btn px-8 py-4 text-base"
    >
      Initiate Breeding
    </button>
  );
}
