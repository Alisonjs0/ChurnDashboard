import { Suspense } from 'react';
import DashboardLayout from './components/DashboardLayout';

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
      Carregando dashboard...
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardLayout />
    </Suspense>
  );
}
