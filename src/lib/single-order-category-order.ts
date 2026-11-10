import { servicePlatform } from '../../supabase/functions/_shared/single-order-policy';

const platformOrder = ['instagram', 'tiktok', 'facebook', 'twitter', 'youtube', 'telegram', 'spotify', 'linkedin', 'other'];
const serviceOrder = [
  /\bviews?\b/i,
  /\blikes?\b/i,
  /\b(?:saves?|bookmarks?|favorites?|favourites?)\b/i,
  /\bshares?\b/i,
  /\b(?:reposts?|retweets?)\b/i,
  /\bcomments?\b/i,
];

function categoryRank(category: string): number {
  const rank = serviceOrder.findIndex(pattern => pattern.test(category));
  return rank < 0 ? serviceOrder.length : rank;
}

/** Keep platforms together, with the main engagement categories first. */
export function sortSingleOrderCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const platformA = platformOrder.indexOf(servicePlatform(a, ''));
    const platformB = platformOrder.indexOf(servicePlatform(b, ''));
    return platformA - platformB || categoryRank(a) - categoryRank(b) || a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
  });
}