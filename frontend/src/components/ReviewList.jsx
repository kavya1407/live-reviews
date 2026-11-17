import React, { useState, useMemo } from 'react';
import { API_BASE } from '../config';

/**
 * ReviewList - Reviews List View (Default View, route = /)
 */
export default function ReviewList({
  reviews = [],
  highlights = {},
  isWsConnected = false,
  navigate,
  onShowToast,
  onDeleteReview,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('date_time'); // 'date_time' | 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let list = [...reviews];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.content && r.content.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      let valA, valB;

      if (sortField === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        // date_time sorting (default latest first)
        valA = new Date(a.date_time).getTime() || 0;
        valB = new Date(b.date_time).getTime() || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return list;
  }, [reviews, searchQuery, sortField, sortOrder]);

  // Toggle sort direction or field
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'title' ? 'asc' : 'desc');
    }
  };

  // Delete review action from table row
  const handleDelete = async (review) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${review.title}"?`);
    if (!confirmDelete) return;

    setIsDeletingId(review.id);

    try {
      if (onDeleteReview) {
        await onDeleteReview(review);
      } else {
        const res = await fetch(`${API_BASE}/reviews/${review.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete review');
      }

      if (onShowToast) {
        onShowToast({
          message: `Review "${review.title}" was deleted.`,
          onUndo: async () => {
            // Restore deleted review with original ID and timestamp
            await fetch(`${API_BASE}/reviews`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(review),
            });
          },
        });
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Format date helper
  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="list-container">
      {/* Top Banner & Action Bar */}
      <section className="list-header-section">
        <div className="header-titles">
          <h2 className="section-title">Customer Reviews Feed</h2>
          <div className="status-indicators">
            <span
              className={`status-badge ${isWsConnected ? 'status-connected' : 'status-disconnected'}`}
              title={isWsConnected ? 'WebSocket Live Feed Active' : 'WebSocket Disconnected'}
            >
              <span className="status-dot"></span>
              {isWsConnected ? 'Live Feed Connected' : 'Connecting...'}
            </span>
            <span className="count-badge">
              {filteredAndSortedReviews.length} {filteredAndSortedReviews.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
        </div>

        {/* Button to create new review (route = /new) */}
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary btn-create"
            onClick={() => navigate('/new')}
          >
            + Create New Review
          </button>
        </div>
      </section>

      {/* Search and Sorting Controls Toolbar */}
      <section className="controls-toolbar" aria-label="Review filter and sort controls">
        <div className="search-box">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search reviews by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="sort-controls">
          <label htmlFor="sort-select" className="sort-label">Sort by:</label>
          <select
            id="sort-select"
            className="form-select"
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field);
              setSortOrder(order);
            }}
          >
            <option value="date_time-desc">Date-time: Newest First</option>
            <option value="date_time-asc">Date-time: Oldest First</option>
            <option value="title-asc">Title: A → Z</option>
            <option value="title-desc">Title: Z → A</option>
          </select>
        </div>
      </section>

      {/* Live Event Legend */}
      <div className="legend-bar">
        <span className="legend-label">Live Event Highlights:</span>
        <span className="legend-item legend-add">
          <span className="legend-dot dot-green"></span> Added (Green, 3s)
        </span>
        <span className="legend-item legend-edit">
          <span className="legend-dot dot-blue"></span> Edited (Blue, 3s)
        </span>
        <span className="legend-item legend-delete">
          <span className="legend-dot dot-red"></span> Deleted (Red, 3s)
        </span>
      </div>

      {/* Reviews Table */}
      <div className="table-responsive">
        <table className="reviews-table">
          <thead>
            <tr>
              {/* Column 1: # - Static count number starting with 1 */}
              <th className="col-num" scope="col">#</th>

              {/* Column 2: Title (sortable) */}
              <th
                className="col-title sortable-header"
                scope="col"
                onClick={() => handleSort('title')}
                title="Click to sort by Title"
              >
                Title {sortField === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>

              {/* Column 3: Content */}
              <th className="col-content" scope="col">Content</th>

              {/* Column 4: Date-time (sortable) */}
              <th
                className="col-date sortable-header"
                scope="col"
                onClick={() => handleSort('date_time')}
                title="Click to sort by Date-time"
              >
                Date-time {sortField === 'date_time' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>

              {/* Column 5: Edit */}
              <th className="col-action" scope="col">Edit</th>

              {/* Column 6: Delete */}
              <th className="col-action" scope="col">Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedReviews.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="6" className="empty-cell">
                  {searchQuery ? (
                    <div className="empty-state">
                      <p>No reviews match "{searchQuery}"</p>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setSearchQuery('')}
                      >
                        Clear Filter
                      </button>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No reviews yet. Be the first to share one!</p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => navigate('/new')}
                      >
                        Create New Review
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredAndSortedReviews.map((review, index) => {
                const highlight = highlights[review.id];
                let rowClassName = 'review-row';
                if (highlight === 'add') {
                  rowClassName += ' row-highlight-add';
                } else if (highlight === 'edit') {
                  rowClassName += ' row-highlight-edit';
                } else if (highlight === 'delete') {
                  rowClassName += ' row-highlight-delete';
                }

                return (
                  <tr key={review.id} className={rowClassName}>
                    {/* # Column: Static count starting with 1 */}
                    <td className="col-num cell-number">{index + 1}</td>

                    {/* Title Column */}
                    <td className="col-title cell-title">
                      <strong>{review.title}</strong>
                      {highlight === 'add' && <span className="event-tag tag-add">New</span>}
                      {highlight === 'edit' && <span className="event-tag tag-edit">Updated</span>}
                      {highlight === 'delete' && <span className="event-tag tag-delete">Deleting...</span>}
                    </td>

                    {/* Content Column */}
                    <td className="col-content cell-content">
                      <div className="content-text">{review.content}</div>
                    </td>

                    {/* Date-time Column */}
                    <td className="col-date cell-date">
                      <time dateTime={review.date_time}>
                        {formatDateTime(review.date_time)}
                      </time>
                    </td>

                    {/* Edit Column: clicking redirects to /:id route */}
                    <td className="col-action cell-action">
                      <button
                        type="button"
                        className="btn btn-sm btn-edit"
                        onClick={() => navigate(`/${review.id}`)}
                        disabled={isDeletingId === review.id || highlight === 'delete'}
                      >
                        Edit
                      </button>
                    </td>

                    {/* Delete Column: clicking deletes review */}
                    <td className="col-action cell-action">
                      <button
                        type="button"
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(review)}
                        disabled={isDeletingId === review.id || highlight === 'delete'}
                      >
                        {isDeletingId === review.id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
