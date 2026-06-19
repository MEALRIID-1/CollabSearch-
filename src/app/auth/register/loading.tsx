import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoadingSpinner text="Chargement..." size="lg" />
    </div>
  );
}
