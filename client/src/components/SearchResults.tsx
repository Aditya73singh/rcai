import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { RedditComment } from '@shared/types';
import CommentCard from './CommentCard';
import Pagination from './Pagination';

interface SearchResultsProps {
  currentQuery: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  comments: RedditComment[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  currentQuery,
  isLoading,
  hasError,
  errorMessage,
  comments,
  totalResults,
  currentPage,
  totalPages,
  onPageChange
}) => {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Results for "<span className="text-reddit-blue">{currentQuery}</span>"
        </h2>
        <div className="text-sm text-gray-500">
          Page <span>{currentPage}</span> of <span>{totalPages || 1}</span>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-reddit-orange" />
          <span className="ml-3 text-lg text-gray-700">Loading results...</span>
        </div>
      )}
      
      {/* Error Message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error fetching results</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Results List */}
      {!isLoading && !hasError && (
        <>
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No results found. Try adjusting your search query or filters.</p>
            </div>
          )}

          {/* Pagination */}
          {comments.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              pageSize={comments.length}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
