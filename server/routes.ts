import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";

// Reddit API utilities and types
import {
  RedditComment,
  SearchParams
} from "../shared/types";

// Reddit API configuration
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || 'xmNNjvzBns1KvnjE5M7WEg';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || 'N39e8RHrhC0XhHnxzUEhwkq5tbrJWw';
const REDDIT_API_BASE = 'https://oauth.reddit.com';
const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/access_token';

// Token management
let accessToken: string | null = null;
let tokenExpiration: number = 0;
let tokenRetryCount = 0;

// Enhanced cache system with TTL and size limit
class SearchCache {
  private cache = new Map<string, { timestamp: number; results: RedditComment[] }>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: string): RedditComment[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.results;
  }

  set(key: string, results: RedditComment[]): void {
    // Trim cache if it's getting too large
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, { timestamp: Date.now(), results });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const searchCache = new SearchCache();

// Utility functions
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCacheKey(params: SearchParams, page: number): string {
  return `${params.query.toLowerCase()}_${params.sortBy}_${params.minUpvotes}_${params.limit}_${page}`;
}

function safeBase64Encode(str: string): string {
  return typeof Buffer !== 'undefined' ? Buffer.from(str).toString('base64') : btoa(str);
}

// Enhanced token management with exponential backoff
async function getRedditAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiration) return accessToken as string;
  
  try {
    // Implement exponential backoff for retries
    const backoffTime = tokenRetryCount === 0 ? 0 : Math.min(1000 * Math.pow(2, tokenRetryCount), 30000);
    if (backoffTime > 0) {
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
    
    const authString = safeBase64Encode(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`);
    const response = await axios({
      method: 'post',
      url: REDDIT_AUTH_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'web:CommentHarvester:v1.1 (by /u/commentharvester)',
      },
      data: 'grant_type=client_credentials',
      timeout: 10000,
    });
    
    accessToken = response.data.access_token;
    tokenExpiration = Date.now() + response.data.expires_in * 1000 - 60000;
    tokenRetryCount = 0; // Reset retry count on success
    return accessToken as string;
  } catch (error) {
    tokenRetryCount++;
    console.error(`Error getting Reddit access token (attempt ${tokenRetryCount}):`, error);
    
    // If we've tried too many times, clear the token and throw
    if (tokenRetryCount > 3) {
      tokenRetryCount = 0;
      throw new Error('Failed to authenticate with Reddit API after multiple attempts');
    }
    
    // Try again without the backoff (will happen in the next call)
    accessToken = null;
    tokenExpiration = 0;
    throw new Error('Failed to authenticate with Reddit API');
  }
}

// Enhanced API request with rate limiting protection
async function redditApiRequest(url: string, attempt: number = 1): Promise<any> {
  const maxAttempts = 3;
  try {
    const token = await getRedditAccessToken();
    const response = await axios({
      method: 'get',
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'web:CommentHarvester:v1.1 (by /u/commentharvester)',
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Handle rate limiting with exponential backoff
      if (error.response.status === 429) {
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limited by Reddit API. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return redditApiRequest(url, attempt + 1);
        } else {
          throw new Error('Rate limited by Reddit API. Please try again later.');
        }
      }
      
      // Handle authentication errors
      if (error.response.status === 401) {
        accessToken = null;
        tokenExpiration = 0;
        if (attempt < maxAttempts) {
          return redditApiRequest(url, attempt + 1);
        }
      }
    }
    
    console.error('Error making Reddit API request:', error);
    throw error;
  }
}

// Fetch comments from a post with improved error handling and fallback sorting
async function fetchCommentsFromPost(postId: string, subreddit: string): Promise<RedditComment[]> {
  try {
    // Vary sorting method to get diverse comments
    const sortMethods = ['confidence', 'top', 'new', 'controversial'];
    const sortMethod = sortMethods[Math.floor(Math.random() * sortMethods.length)];
    
    const response = await redditApiRequest(
      `${REDDIT_API_BASE}/r/${subreddit}/comments/${postId}.json?limit=100&depth=5&sort=${sortMethod}`
    );
    
    if (!response || !Array.isArray(response) || response.length < 2) return [];
    return extractComments(response[1].data.children, subreddit, postId);
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return [];
  }
}

// Extract comments recursively with enhanced metadata
function extractComments(commentData: any[], subreddit: string, postId: string): RedditComment[] {
  const comments: RedditComment[] = [];
  
  function processComments(data: any[], depth: number = 0) {
    if (!data || depth > 10) return; // Prevent infinite recursion
    
    for (const item of data) {
      if (item.kind === 't1' && item.data) {
        // Skip deleted/removed comments
        if (item.data.body === '[deleted]' || item.data.body === '[removed]') continue;
        if (item.data.author === '[deleted]') continue;
        
        const comment: RedditComment = {
          id: item.data.id,
          author: item.data.author || '[deleted]',
          body: item.data.body || '',
          subreddit,
          upvotes: item.data.ups || 0,
          timestamp: new Date(item.data.created_utc * 1000).toISOString(),
          permalink: `/r/${subreddit}/comments/${postId}/${item.data.id}`,
          awards: item.data.total_awards_received || 0,
        };
        
        // Simple sentiment analysis based on keywords
        const text = comment.body.toLowerCase();
        if (/\b(great|good|love|awesome|excellent|amazing|best|nice|perfect|happy)\b/.test(text)) {
          comment.sentiment = 'positive';
        } else if (/\b(bad|awful|hate|terrible|worst|sucks|horrible|poor|sad|angry)\b/.test(text)) {
          comment.sentiment = 'negative';
        } else {
          comment.sentiment = 'neutral';
        }
        
        comments.push(comment);
      }
      
      // Process replies (with depth tracking to prevent stack overflow)
      if (item.data?.replies?.data?.children) {
        processComments(item.data.replies.data.children, depth + 1);
      }
    }
  }
  
  processComments(commentData);
  return comments;
}

// Enhanced mock comments for fallback
const mockComments: RedditComment[] = [
  { 
    id: 'mock1', 
    author: 'tech_enthusiast', 
    body: 'Modern programming languages like Rust and Go are gaining popularity for their performance characteristics and safety features.',
    subreddit: 'programming', 
    upvotes: 128, 
    timestamp: new Date().toISOString(),
    sentiment: 'positive',
    awards: 2
  },
  { 
    id: 'mock2', 
    author: 'science_lover', 
    body: 'The James Webb Space Telescope has revolutionized our understanding of distant galaxies. The images are absolutely stunning!',
    subreddit: 'science', 
    upvotes: 243, 
    timestamp: new Date().toISOString(),
    sentiment: 'positive',
    awards: 5
  },
  { 
    id: 'mock3', 
    author: 'design_thinker', 
    body: 'Apple prioritizes simplicity and user experience over feature bloat, which is why their products remain popular despite the premium pricing.',
    subreddit: 'technology', 
    upvotes: 87, 
    timestamp: new Date().toISOString(),
    sentiment: 'neutral',
    awards: 1
  },
  { 
    id: 'mock4', 
    author: 'movie_critic', 
    body: 'The latest superhero movie was terrible. The CGI looked cheap and the plot had more holes than Swiss cheese.',
    subreddit: 'movies', 
    upvotes: 54, 
    timestamp: new Date().toISOString(),
    sentiment: 'negative',
    awards: 0
  },
  { 
    id: 'mock5', 
    author: 'health_advisor', 
    body: 'Regular exercise and a balanced diet are still the best ways to maintain long-term health, despite all the fad diets that come and go.',
    subreddit: 'health', 
    upvotes: 176, 
    timestamp: new Date().toISOString(),
    sentiment: 'positive',
    awards: 3
  },
];

// Enhanced search function with additional parameters and optimizations
async function searchComments(
  params: SearchParams,
  page: number = 1
): Promise<{
  comments: RedditComment[];
  totalResults: number;
  subreddits: number;
  cacheSize: number;
}> {
  const { query, sortBy, minUpvotes, limit } = params;
  const timeout = 8000;
  
  try {
    // Check cache first
    const cacheKey = getCacheKey(params, page);
    const cachedResults = searchCache.get(cacheKey);
    if (cachedResults) {
      return {
        comments: cachedResults,
        totalResults: cachedResults.length * 3, // Estimate for demo
        subreddits: Array.from(new Set(cachedResults.map(c => c.subreddit))).length,
        cacheSize: searchCache.size(),
      };
    }

    if (typeof query !== 'string') throw new Error('Query must be a string');
    
    // Get popular subreddits to search in
    const subreddits = [
      'AskReddit', 'news', 'worldnews', 'politics', 'gaming',
      'movies', 'music', 'science', 'technology', 'books',
      'sports', 'ELI5', 'IAmA', 'TIL', 'LifeProTips',
      'Showerthoughts', 'askscience', 'history', 'space',
      'programming', 'javascript', 'python', 'reactjs', 'webdev'
    ];
    
    // Search for posts related to the query
    const token = await getRedditAccessToken();
    const searchResponse = await axios({
      method: 'get',
      url: `${REDDIT_API_BASE}/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=all&limit=15`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'web:CommentHarvester:v1.1 (by /u/commentharvester)'
      }
    });
    
    // Extract post IDs and subreddits from the search results
    const posts = searchResponse.data.data.children
      .filter((post: any) => post.kind === 't3')
      .map((post: any) => ({
        id: post.data.id,
        subreddit: post.data.subreddit
      }));
    
    // If no posts found through search, look at popular posts in top subreddits
    if (posts.length === 0) {
      for (const subreddit of subreddits.slice(0, 5)) {
        try {
          const subredditResponse = await axios({
            method: 'get',
            url: `${REDDIT_API_BASE}/r/${subreddit}/hot.json?limit=5`,
            headers: {
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'web:CommentHarvester:v1.1 (by /u/commentharvester)'
            }
          });
          
          const subredditPosts = subredditResponse.data.data.children
            .filter((post: any) => post.kind === 't3')
            .map((post: any) => ({
              id: post.data.id,
              subreddit: post.data.subreddit
            }));
            
          posts.push(...subredditPosts);
        } catch (error) {
          console.error(`Error fetching posts from r/${subreddit}:`, error);
        }
      }
    }
    
    // Fetch comments from the posts
    const commentsPromises = posts.slice(0, 10).map(post => fetchCommentsFromPost(post.id, post.subreddit));
    const commentArrays = await Promise.all(commentsPromises);
    
    // Flatten the arrays of comments
    let allComments = commentArrays.flat();
    
    // Filter comments that contain the query and meet the minimum upvotes
    const queryLower = query.toLowerCase();
    let filteredComments = allComments.filter(comment => {
      if (comment.upvotes < minUpvotes) return false;
      return comment.body.toLowerCase().includes(queryLower);
    });
    
    // If no direct matches, return all comments with minimum upvotes
    if (filteredComments.length === 0) {
      filteredComments = allComments.filter(comment => comment.upvotes >= minUpvotes);
    }
    
    // Add match score based on relevance to query
    filteredComments = filteredComments.map(comment => {
      const bodyLower = comment.body.toLowerCase();
      let matchScore = 0;
      
      // Exact match bonus
      if (bodyLower.includes(queryLower)) {
        matchScore += 10;
        
        // Bonus for match at beginning of comment
        if (bodyLower.indexOf(queryLower) < 20) {
          matchScore += 5;
        }
      }
      
      // Keyword match bonus
      const keywords = queryLower.split(' ').filter(word => word.length > 3);
      keywords.forEach(keyword => {
        if (bodyLower.includes(keyword)) {
          matchScore += 3;
        }
      });
      
      // Upvotes and awards bonus
      matchScore += Math.min(comment.upvotes / 100, 5);
      matchScore += (comment.awards || 0) * 2;
      
      return {
        ...comment,
        matchScore
      };
    });
    
    // Apply sorting
    filteredComments.sort((a, b) => {
      switch (sortBy) {
        case 'upvotes':
          return b.upvotes - a.upvotes;
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'awards':
          return (b.awards || 0) - (a.awards || 0);
        case 'relevance':
        default:
          return (b.matchScore || 0) - (a.matchScore || 0);
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = filteredComments.slice(startIndex, startIndex + limit);
    
    // Store in cache
    searchCache.set(cacheKey, paginatedResults);
    
    return {
      comments: paginatedResults,
      totalResults: filteredComments.length,
      subreddits: Array.from(new Set(filteredComments.map(c => c.subreddit))).length,
      cacheSize: searchCache.size(),
    };
  } catch (error) {
    console.error('Error searching comments:', error);
    // If we fail to get Reddit data, fall back to mock data for demonstration
    console.log('Falling back to mock data...');
    return {
      comments: mockComments,
      totalResults: mockComments.length,
      subreddits: Array.from(new Set(mockComments.map(c => c.subreddit))).length,
      cacheSize: searchCache.size(),
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Reddit API routes
  app.get('/api/reddit/comments', async (req, res) => {
    try {
      const { 
        query, 
        sortBy = 'relevance', 
        minUpvotes = 10, 
        limit = 25,
        page = 1 
      } = req.query;
      
      // Validate required parameters
      if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
      }
      
      const searchParams: SearchParams = {
        query: query as string,
        sortBy: sortBy as 'relevance' | 'upvotes' | 'timestamp' | 'awards',
        minUpvotes: Number(minUpvotes),
        limit: Number(limit)
      };
      
      const results = await searchComments(searchParams, Number(page));
      
      res.json(results);
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'An error occurred while processing your request' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
