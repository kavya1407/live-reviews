import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

/**
 * ReviewForm - Reused for both New Review (/new) and Edit Review (/:id)
 */
export default function ReviewForm({
  reviewId = null,
  navigate,
  onShowToast,
  reviews = [],
}) {
  const isEditMode = Boolean(reviewId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [initialData, setInitialData] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing review if in edit mode
  useEffect(() => {
    if (!isEditMode) {
      setTitle('');
      setContent('');
      setInitialData({ title: '', content: '' });
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    // Check if review already in memory/props, otherwise fetch
    const existingFromProps = reviews.find((r) => String(r.id) === String(reviewId));
    if (existingFromProps) {
      setTitle(existingFromProps.title);
      setContent(existingFromProps.content);
      setInitialData({
        title: existingFromProps.title,
        content: existingFromProps.content,
      });
      setIsLoading(false);
      return;
    }

    // Fetch from backend API
    fetch(`${API_BASE}/reviews/${reviewId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Review not found' : 'Failed to fetch review');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setTitle(data.title || '');
          setContent(data.content || '');
          setInitialData({
            title: data.title || '',
            content: data.content || '',
          });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reviewId, isEditMode, reviews]);

  // Handle Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setErrorMessage('Please provide a title for the review.');
      return;
    }

    if (!trimmedContent) {
      setErrorMessage('Please provide review content.');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `${API_BASE}/reviews/${reviewId}`
        : `${API_BASE}/reviews`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save review');
      }

      const savedReview = await res.json();

      if (onShowToast) {
        onShowToast({
          message: isEditMode
            ? `Review "${savedReview.title}" updated successfully.`
            : `Review "${savedReview.title}" created successfully.`,
        });
      }

      // Redirect user back to list view (route /)
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message);
      setIsSubmitting(false);
    }
  };

  // Handle Reset button
  const handleReset = () => {
    setErrorMessage('');
    if (isEditMode) {
      // In edit mode: reset to the existing pre-filled review data
      setTitle(initialData.title);
      setContent(initialData.content);
    } else {
      // In new mode: reset input and textarea to empty
      setTitle('');
      setContent('');
    }
  };

  // Handle Cancel button: redirects user back to list view (route /)
  const handleCancel = () => {
    navigate('/');
  };

  // Handle Delete button (in edit mode)
  const handleDelete = async () => {
    if (!isEditMode) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this review?');
    if (!confirmDelete) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete review');
      }

      const deletedReview = await res.json();

      // Show Undo snackbar
      if (onShowToast) {
        onShowToast({
          message: `Review "${deletedReview.title}" was deleted.`,
          onUndo: async () => {
            // Restore deleted review with original ID and timestamp
            await fetch(`${API_BASE}/reviews`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(deletedReview),
            });
          },
        });
      }

      // Redirect user back to list view (route /)
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="form-container">
        <div className="card loading-card">
          <p>Loading review details...</p>
        </div>
      </section>
    );
  }

  if (isEditMode && errorMessage && !title && !content) {
    return (
      <section className="form-container">
        <div className="card error-card">
          <h2>Review Not Found</h2>
          <p>{errorMessage}</p>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Back to Reviews
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="form-container">
      <div className="card form-card">
        <header className="form-header">
          <h2 className="form-title">
            {isEditMode ? 'Edit Review' : 'Create New Review'}
          </h2>
          <p className="form-subtitle">
            {isEditMode
              ? 'Update the review details below or delete it.'
              : 'Share your feedback. Reviews will be broadcasted live to all users.'}
          </p>
        </header>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="review-form" noValidate>
          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="review-title" className="form-label">
              Title <span className="required-star">*</span>
            </label>
            <input
              id="review-title"
              type="text"
              className="form-input"
              placeholder="e.g. Excellent service and support"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Content Textarea */}
          <div className="form-group">
            <label htmlFor="review-content" className="form-label">
              Content <span className="required-star">*</span>
            </label>
            <textarea
              id="review-content"
              className="form-textarea"
              rows={6}
              placeholder="Write your detailed review here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <div className="primary-actions">
              {/* Save button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>

              {/* Reset button */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset
              </button>

              {/* Cancel button */}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>

            {/* In Edit mode: Delete button */}
            {isEditMode && (
              <div className="danger-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
