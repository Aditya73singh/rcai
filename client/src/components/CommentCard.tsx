import React from 'react';
import { formatDistance } from 'date-fns';
import { Award, ArrowUp, MessageSquare, ExternalLink } from 'lucide-react';
import { RedditComment } from '@shared/types';

interface CommentCardProps {
  comment: RedditComment;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  const formattedDate = React.useMemo(() => {
    try {
      return formatDistance(new Date(comment.timestamp), new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  }, [comment.timestamp]);

  const getSentimentColor = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentDot = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      case 'neutral':
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center flex-wrap">
              <h3 className="text-sm font-medium text-gray-900">u/{comment.author}</h3>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-xs text-gray-500">r/{comment.subreddit}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-xs text-gray-500">{formattedDate}</span>
              {comment.sentiment && (
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(comment.sentiment)}`}>
                  <svg className={`mr-1 h-2 w-2 ${getSentimentDot(comment.sentiment)}`} fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  {comment.sentiment.charAt(0).toUpperCase() + comment.sentiment.slice(1)}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {comment.body}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <ArrowUp className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{comment.upvotes}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center text-xs text-gray-500">
              <Award className="h-4 w-4 mr-1 text-yellow-400" />
              <span>{comment.awards || 0}</span> {(comment.awards === 1) ? 'award' : 'awards'}
            </span>
            <span className="ml-4 inline-flex items-center text-xs text-gray-500">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{Math.floor(Math.random() * 30)}</span> replies
            </span>
          </div>
          <a 
            href={`https://www.reddit.com${comment.permalink}`} 
            className="text-xs font-medium text-reddit-blue hover:text-reddit-orange" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on Reddit
            <ExternalLink className="inline-block h-4 w-4 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
