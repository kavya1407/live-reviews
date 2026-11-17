import { test, describe } from 'node:test';
import assert from 'node:assert';

// Pure logic functions extracted for unit testing
function parseRoute(path) {
  const cleanPath = (path || '/').replace(/\/+$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '') {
    return { route: 'list', reviewId: null };
  } else if (cleanPath === '/new') {
    return { route: 'new', reviewId: null };
  } else {
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length === 1) {
      return { route: 'edit', reviewId: parts[0] };
    }
    return { route: 'list', reviewId: null };
  }
}

function filterAndSortReviews(reviews, searchQuery, sortField, sortOrder) {
  let list = [...reviews];

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (r) =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.content && r.content.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => {
    if (sortField === 'title') {
      const valA = (a.title || '').toLowerCase();
      const valB = (b.title || '').toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      const valA = new Date(a.date_time).getTime() || 0;
      const valB = new Date(b.date_time).getTime() || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
  });

  return list;
}

describe('Frontend Unit Tests', () => {
  describe('Route Parsing Logic', () => {
    test('Default route "/" resolves to list', () => {
      const res = parseRoute('/');
      assert.strictEqual(res.route, 'list');
      assert.strictEqual(res.reviewId, null);
    });

    test('Route "/new" resolves to new review form', () => {
      const res = parseRoute('/new');
      assert.strictEqual(res.route, 'new');
      assert.strictEqual(res.reviewId, null);
    });

    test('Route "/new/" with trailing slash resolves to new review form', () => {
      const res = parseRoute('/new/');
      assert.strictEqual(res.route, 'new');
      assert.strictEqual(res.reviewId, null);
    });

    test('Route "/:id" resolves to edit review form with reviewId', () => {
      const res = parseRoute('/b9492194-e3fb-4632-9cb7-7f02d51ca8e4');
      assert.strictEqual(res.route, 'edit');
      assert.strictEqual(res.reviewId, 'b9492194-e3fb-4632-9cb7-7f02d51ca8e4');
    });
  });

  describe('Search & Filter Functionality', () => {
    const mockReviews = [
      { id: '1', title: 'Great Battery Life', content: 'Lasts all day without recharging', date_time: '2026-01-01T10:00:00Z' },
      { id: '2', title: 'Average Camera', content: 'Photos in low light are grainy', date_time: '2026-01-02T10:00:00Z' },
      { id: '3', title: 'Super Fast Shipping', content: 'Arrived the next morning in perfect condition', date_time: '2026-01-03T10:00:00Z' },
    ];

    test('Filters by title match', () => {
      const filtered = filterAndSortReviews(mockReviews, 'camera', 'date_time', 'desc');
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].title, 'Average Camera');
    });

    test('Filters by content match', () => {
      const filtered = filterAndSortReviews(mockReviews, 'recharging', 'date_time', 'desc');
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].title, 'Great Battery Life');
    });

    test('Returns empty when no query matches', () => {
      const filtered = filterAndSortReviews(mockReviews, 'non-existent term', 'date_time', 'desc');
      assert.strictEqual(filtered.length, 0);
    });

    test('Returns all items when search query is empty', () => {
      const filtered = filterAndSortReviews(mockReviews, '', 'date_time', 'desc');
      assert.strictEqual(filtered.length, 3);
    });
  });

  describe('Sorting Functionality', () => {
    const mockReviews = [
      { id: '1', title: 'Bravo', content: 'B', date_time: '2026-01-01T10:00:00Z' },
      { id: '2', title: 'Alpha', content: 'A', date_time: '2026-01-03T10:00:00Z' },
      { id: '3', title: 'Charlie', content: 'C', date_time: '2026-01-02T10:00:00Z' },
    ];

    test('Sorts by date_time descending (latest first)', () => {
      const sorted = filterAndSortReviews(mockReviews, '', 'date_time', 'desc');
      assert.strictEqual(sorted[0].title, 'Alpha'); // Jan 3
      assert.strictEqual(sorted[1].title, 'Charlie'); // Jan 2
      assert.strictEqual(sorted[2].title, 'Bravo'); // Jan 1
    });

    test('Sorts by date_time ascending (oldest first)', () => {
      const sorted = filterAndSortReviews(mockReviews, '', 'date_time', 'asc');
      assert.strictEqual(sorted[0].title, 'Bravo'); // Jan 1
      assert.strictEqual(sorted[1].title, 'Charlie'); // Jan 2
      assert.strictEqual(sorted[2].title, 'Alpha'); // Jan 3
    });

    test('Sorts by title A to Z', () => {
      const sorted = filterAndSortReviews(mockReviews, '', 'title', 'asc');
      assert.strictEqual(sorted[0].title, 'Alpha');
      assert.strictEqual(sorted[1].title, 'Bravo');
      assert.strictEqual(sorted[2].title, 'Charlie');
    });

    test('Sorts by title Z to A', () => {
      const sorted = filterAndSortReviews(mockReviews, '', 'title', 'desc');
      assert.strictEqual(sorted[0].title, 'Charlie');
      assert.strictEqual(sorted[1].title, 'Bravo');
      assert.strictEqual(sorted[2].title, 'Alpha');
    });
  });
});
