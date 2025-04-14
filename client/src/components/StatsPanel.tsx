import React from 'react';

interface StatsPanelProps {
  stats: {
    totalResults: number;
    subreddits: number;
    cacheSize: number;
    queryTime: string;
  };
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Statistics</h2>
      <div className="space-y-3">
        <div>
          <span className="text-sm text-gray-500">Total results:</span>
          <span className="text-md font-semibold text-gray-900 float-right">{stats.totalResults}</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">Subreddits:</span>
          <span className="text-md font-semibold text-gray-900 float-right">{stats.subreddits}</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">Cache size:</span>
          <span className="text-md font-semibold text-gray-900 float-right">{stats.cacheSize} items</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">Query time:</span>
          <span className="text-md font-semibold text-gray-900 float-right">{stats.queryTime}s</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
