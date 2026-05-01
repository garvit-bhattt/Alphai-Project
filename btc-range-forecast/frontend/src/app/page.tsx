import { getPrediction, getMetrics, getHistory, getPredictionHistory } from '@/lib/api';
import DashboardContent from '@/components/DashboardContent';

// Force dynamic rendering to ensure fresh data on every page load
export const dynamic = 'force-dynamic';

export default async function Page() {
  try {
    // 1. Fetch initial data on the server
    const [initialPrediction, initialMetrics, initialHistory, initialPredictionHistory] = await Promise.all([
      getPrediction(),
      getMetrics(),
      getHistory(),
      getPredictionHistory()
    ]);

    return (
      <DashboardContent 
        initialPrediction={initialPrediction} 
        initialMetrics={initialMetrics} 
        initialHistory={initialHistory}
        initialPredictionHistory={initialPredictionHistory}
      />
    );
  } catch (error) {
    console.error("Failed to fetch initial dashboard data:", error);
    
    // Fallback UI in case backend is unreachable during initial load
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--background)] p-8">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
            <span className="text-2xl font-bold text-[var(--secondary)]">!</span>
          </div>
          <h1 className="text-xl font-bold mb-4">Dashboard Unavailable</h1>
          <p className="text-[var(--muted)] text-sm mb-8">
            We couldn't connect to the backend forecasting engine. Please ensure the FastAPI server is running at http://localhost:8000.
          </p>
          <button 
            className="w-full py-3 bg-[var(--border)] hover:bg-white/10 rounded-lg transition-colors font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }
}
