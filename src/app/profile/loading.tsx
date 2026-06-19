import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner text="Chargement du profil..." size="lg" />
    </div>
  );
}
