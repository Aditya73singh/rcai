import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { RedditComment, SearchParams } from '@shared/types';
import { ArrowUp, Clock, Award } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import { searchRedditComments } from '@/services/redditService';

const Home: React.FC = () => {
  const { toast } = useToast();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('programming languages');
  const [currentQuery, setCurrentQuery] = useState('programming languages');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search parameters
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: 'programming languages',
    sortBy: 'relevance',
    minUpvotes: 0,
    limit: 25
  });
  
  // Stats state
  const [stats, setStats] = useState({
    totalResults: 0,
    subreddits: 0,
    cacheSize: 0,
    queryTime: '0.00'
  });
  
  // Handle search query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/reddit/comments', searchParams, currentPage],
    queryFn: () => searchRedditComments(searchParams, currentPage),
    enabled: searchParams.query.trim().length > 0,
    staleTime: 60000 // 1 minute
  });
  
  // Update stats when data changes
  React.useEffect(() => {
    if (data) {
      setStats({
        totalResults: data.totalResults,
        subreddits: data.subreddits,
        cacheSize: data.cacheSize,
        queryTime: data.queryTime
      });
    }
  }, [data]);
  
  // Handle errors
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch comments',
        variant: 'destructive'
      });
    }
  }, [error, toast]);
  
  // Run the initial search when the component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  const comments: RedditComment[] = data?.comments || [];
  const totalResults = data?.totalResults || 0;
  const totalPages = Math.ceil(totalResults / searchParams.limit) || 1;

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setCurrentQuery(searchQuery);
    setSearchParams(prevParams => ({
      ...prevParams,
      query: searchQuery
    }));
  }, [searchQuery]);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSortChange = useCallback((sortBy: 'relevance' | 'upvotes' | 'timestamp' | 'awards') => {
    setSearchParams(prevParams => ({
      ...prevParams,
      sortBy
    }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchBar 
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            onSearch={handleSearch}
          />
          
          {/* Sort Options */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Sort by:</span>
                <div className="flex space-x-2">
                  <button 
                    className={`px-3 py-1 rounded-full ${searchParams.sortBy === 'relevance' ? 'bg-reddit-orange text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => handleSortChange('relevance')}
                  >
                    Relevance
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-full flex items-center ${searchParams.sortBy === 'upvotes' ? 'bg-reddit-orange text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => handleSortChange('upvotes')}
                  >
                    <ArrowUp className="mr-1 h-3 w-3" />
                    Upvotes
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-full flex items-center ${searchParams.sortBy === 'timestamp' ? 'bg-reddit-orange text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => handleSortChange('timestamp')}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Recent
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-full flex items-center ${searchParams.sortBy === 'awards' ? 'bg-reddit-orange text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => handleSortChange('awards')}
                  >
                    <Award className="mr-1 h-3 w-3" />
                    Awards
                  </button>
                </div>
              </div>
              
              <div className="mt-2 sm:mt-0 text-sm">
                <span className="text-gray-500">Found:</span> <span className="font-semibold text-gray-900">{totalResults}</span> comments from <span className="font-semibold text-gray-900">{stats.subreddits}</span> subreddits
              </div>
            </div>
          </div>
          
          <SearchResults 
            currentQuery={currentQuery}
            isLoading={isLoading}
            hasError={!!error}
            errorMessage={error instanceof Error ? error.message : 'An unexpected error occurred'}
            comments={comments}
            totalResults={totalResults}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
