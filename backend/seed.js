const db = require('./db');

const initialReviews = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Outstanding Performance and Reliability',
    content: 'We implemented this system across our entire team last month. The live synchronization and sub-second update latency have significantly improved our workflow efficiency.',
    date_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    title: 'Intuitive Interface with Real-Time Updates',
    content: 'The user experience is smooth and straightforward. As soon as another teammate edits or deletes a review, the change reflects on my screen immediately with the color indicators.',
    date_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    title: 'Love the Instant Undo Feature',
    content: 'Accidentally deleted a lengthy draft earlier today, and the 5-second undo toastr saved me from having to re-type everything. Great attention to user detail!',
    date_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
];

console.log('[Seed] Seeding sample reviews into database...');
db.clearAll();
for (const r of initialReviews) {
  db.create(r);
}
console.log(`[Seed] Successfully seeded ${initialReviews.length} sample reviews.`);
