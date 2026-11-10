import { describe, expect, it } from 'vitest';
import { sortSingleOrderCategories } from '@/lib/single-order-category-order';

describe('Single Order category ordering', () => {
  it('orders Instagram as Views, Likes, Saves, Shares, Reposts, Comments', () => {
    expect(sortSingleOrderCategories(['Instagram Comments', 'Instagram Reposts', 'Instagram Shares', 'Instagram Saves', 'Instagram Likes', 'Instagram Views'])).toEqual([
      'Instagram Views', 'Instagram Likes', 'Instagram Saves', 'Instagram Shares', 'Instagram Reposts', 'Instagram Comments',
    ]);
  });
  it('applies the same order to TikTok and preserves extra services afterwards', () => {
    expect(sortSingleOrderCategories(['TikTok Followers', 'TikTok Comments', 'TikTok Shares', 'TikTok Favorites', 'TikTok Likes', 'TikTok Views', 'TikTok Reposts', 'TikTok Live'])).toEqual([
      'TikTok Views', 'TikTok Likes', 'TikTok Favorites', 'TikTok Shares', 'TikTok Reposts', 'TikTok Comments', 'TikTok Followers', 'TikTok Live',
    ]);
  });
  it('groups platforms without mutating the source list', () => {
    const source = ['TikTok Views', 'Instagram Comments', 'Instagram Views'];
    expect(sortSingleOrderCategories(source)).toEqual(['Instagram Views', 'Instagram Comments', 'TikTok Views']);
    expect(source).toEqual(['TikTok Views', 'Instagram Comments', 'Instagram Views']);
  });
});