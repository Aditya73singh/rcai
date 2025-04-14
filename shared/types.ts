export interface RedditComment {
  id: string;
  author: string;
  body: string;
  subreddit: string;
  upvotes: number;
  timestamp: string;
  permalink?: string;
  matchScore?: number;
  score?: number;
  awards?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface SearchParams {
  query: string;
  sortBy: 'relevance' | 'upvotes' | 'timestamp' | 'awards';
  minUpvotes: number;
  limit: number;
}

export interface SearchResult {
  comments: RedditComment[];
  totalResults: number;
  subreddits: number;
  cacheSize: number;
  queryTime: string;
}
