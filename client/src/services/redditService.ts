import axios from 'axios';
import { RedditComment, SearchParams } from '@shared/types';

export const searchRedditComments = async (
  params: SearchParams,
  page: number = 1,
): Promise<{
  comments: RedditComment[];
  totalResults: number;
  cacheSize: number;
  queryTime: number;
  subreddits: number;
}> => {
  try {
    const startTime = Date.now();
    
    const response = await axios.get('/api/reddit/comments', {
      params: {
        ...params,
        page,
      },
    });
    
    const queryTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    return {
      ...response.data,
      queryTime,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch comments from Reddit');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
};
