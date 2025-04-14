import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange
}) => {
  // Calculate the range of results we're showing
  const startResult = (currentPage - 1) * pageSize + 1;
  const endResult = Math.min(currentPage * pageSize, totalResults);

  // Generate the buttons to show
  const getPageButtons = () => {
    const maxVisibleButtons = 5;
    const buttons = [];
    
    // Always show page 1
    buttons.push(
      <button
        key={1}
        onClick={() => onPageChange(1)}
        className={`relative ${
          currentPage === 1
            ? 'z-10 inline-flex items-center bg-reddit-blue px-4 py-2 text-sm font-medium text-white focus:z-20'
            : 'relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20'
        }`}
      >
        1
      </button>
    );
    
    // If we have more than max buttons, we might need ellipsis
    if (totalPages > maxVisibleButtons) {
      // Calculate the range of pages to show around current page
      let startPage = Math.max(2, currentPage - Math.floor(maxVisibleButtons / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxVisibleButtons - 3);
      
      // Adjust if we're close to the end
      if (endPage - startPage < maxVisibleButtons - 3) {
        startPage = Math.max(2, endPage - (maxVisibleButtons - 3));
      }
      
      // Add first ellipsis if needed
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
            ...
          </span>
        );
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`relative ${
              currentPage === i
                ? 'z-10 inline-flex items-center bg-reddit-blue px-4 py-2 text-sm font-medium text-white focus:z-20'
                : 'relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20'
            }`}
          >
            {i}
          </button>
        );
      }
      
      // Add last ellipsis if needed
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
            ...
          </span>
        );
      }
      
      // Always add the last page if we have more than one page
      if (totalPages > 1) {
        buttons.push(
          <button
            key={totalPages}
            onClick={() => onPageChange(totalPages)}
            className={`relative ${
              currentPage === totalPages
                ? 'z-10 inline-flex items-center bg-reddit-blue px-4 py-2 text-sm font-medium text-white focus:z-20'
                : 'relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20'
            }`}
          >
            {totalPages}
          </button>
        );
      }
    } else {
      // If we have fewer pages than max buttons, show all pages
      for (let i = 2; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`relative ${
              currentPage === i
                ? 'z-10 inline-flex items-center bg-reddit-blue px-4 py-2 text-sm font-medium text-white focus:z-20'
                : 'relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20'
            }`}
          >
            {i}
          </button>
        );
      }
    }
    
    return buttons;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startResult}</span> to{' '}
            <span className="font-medium">{endResult}</span> of{' '}
            <span className="font-medium">{totalResults}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" />
            </button>
            {getPageButtons()}
            <button
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
