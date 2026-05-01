interface MetricsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subValueColor?: 'green' | 'red' | 'gray';
  progress?: number;
  progressTarget?: string;
}

export default function MetricsCard({ 
  label, 
  value, 
  subValue, 
  subValueColor = 'gray',
  progress,
  progressTarget
}: MetricsCardProps) {
  const colorClass = subValueColor === 'green' ? 'text-[var(--primary)]' : 
                     subValueColor === 'red' ? 'text-[var(--secondary)]' : 
                     'text-[var(--muted)]';

  return (
    <div className="card flex flex-col justify-between min-h-0">
      <div>
        <p className="metric-label">{label}</p>
        <h3 className="metric-value">{value}</h3>
        {subValue && (
          <p className={`text-xs mt-1 font-medium ${colorClass}`}>
            {subValue}
          </p>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-[10px] uppercase mb-1">
            <span className="text-[var(--muted)]">Progress</span>
            <span className="text-white">Target: {progressTarget}</span>
          </div>
          <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[var(--primary)] h-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
