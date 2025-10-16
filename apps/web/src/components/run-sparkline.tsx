"use client"

import { Run } from '@tokiflow/db';

export function RunSparkline({ runs }: { runs: Run[] }) {
  if (runs.length === 0) {
    return <span className="text-gray-400 text-sm">No runs yet</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {runs.slice(0, 10).reverse().map((run, idx) => {
        const isSuccess = run.outcome === 'SUCCESS';
        return (
          <div
            key={run.id}
            className={`w-2 h-6 rounded-sm ${
              isSuccess ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={`${run.outcome} - ${run.startedAt.toLocaleString()}`}
          />
        );
      })}
      <span className="text-xs text-gray-500 ml-2">
        {runs.filter(r => r.outcome === 'SUCCESS').length}/{runs.length}
      </span>
    </div>
  );
}







