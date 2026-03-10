import { ShieldAlert } from 'lucide-react';

interface BreedButtonProps {
  onClick: () => void;
}

export function BreedButton({ onClick }: BreedButtonProps) {
  return (
    <button type="button" onClick={onClick} className="candy-button">
      <ShieldAlert className="h-4 w-4" />
      Initiate Breeding
    </button>
  );
}
