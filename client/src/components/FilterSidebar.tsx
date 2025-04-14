import React from 'react';
import { SearchParams } from '@shared/types';
import StatsPanel from './StatsPanel';

interface FilterSidebarProps {
  searchParams: SearchParams;
  onFilterChange: (name: keyof SearchParams, value: any) => void;
  onApplyFilters: () => void;
  stats: {
    totalResults: number;
    subreddits: number;
    cacheSize: number;
    queryTime: string;
  };
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  searchParams,
  onFilterChange,
  onApplyFilters,
  stats
}) => {
  return (
    <div className="lg:w-64 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Type</label>
          <select 
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-reddit-blue focus:ring-reddit-blue sm:text-sm"
            value={searchParams.filterType}
            onChange={(e) => onFilterChange('filterType', e.target.value)}
          >
            <option value="all">All</option>
            <option value="keyword">Keyword</option>
            <option value="subreddit">Subreddit</option>
            <option value="author">Author</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Frame</label>
          <select 
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-reddit-blue focus:ring-reddit-blue sm:text-sm"
            value={searchParams.timeFrame}
            onChange={(e) => onFilterChange('timeFrame', e.target.value)}
          >
            <option value="hour">Past hour</option>
            <option value="day">Past day</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
            <option value="year">Past year</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select 
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-reddit-blue focus:ring-reddit-blue sm:text-sm"
            value={searchParams.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="upvotes">Most Upvotes</option>
            <option value="timestamp">Most Recent</option>
            <option value="awards">Most Awards</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Upvotes: <span className="font-bold">{searchParams.minUpvotes}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="1000" 
            step="10" 
            value={searchParams.minUpvotes}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            onChange={(e) => onFilterChange('minUpvotes', parseInt(e.target.value))}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Results per page: <span className="font-bold">{searchParams.limit}</span>
          </label>
          <input 
            type="range" 
            min="10" 
            max="100" 
            step="5" 
            value={searchParams.limit}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
          />
        </div>
        
        <div className="pt-2">
          <button 
            type="button" 
            className="w-full bg-reddit-orange hover:bg-orange-500 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-reddit-orange"
            onClick={onApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      <StatsPanel stats={stats} />
    </div>
  );
};

export default FilterSidebar;
