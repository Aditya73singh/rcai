import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  onSearchQueryChange, 
  onSearch 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
      <form className="relative" onSubmit={onSearch}>
        <input 
          type="text" 
          placeholder="Search Reddit comments..." 
          className="block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-reddit-blue focus:ring-reddit-blue text-base"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
        <button 
          type="submit" 
          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-900 focus:outline-none"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
