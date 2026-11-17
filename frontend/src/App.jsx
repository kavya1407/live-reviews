import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from './router';
import { API_BASE, WS_BASE } from './config';
import ReviewList from './components/ReviewList';
import ReviewForm from './components/ReviewForm';
import Toastr from './components/Toastr';
import './App.css';

export default function App() {
  const { path, route, reviewId, navigate } = useRouter();

  const [reviews, setReviews] = useState([]);
  const [highlights, setHighlights] = useState({}); // { [id]: 'add' | 'edit' | 'delete' }
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Show Toast / Snackbar helper
  const showToast = useCallback((toastData) => {
    setActiveToast(toastData);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Fetch initial reviews from REST API
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('[App] Failed to fetch reviews:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Set highlight with automatic 3-second expiration
  const triggerHighlight = useCallback((id, type, durationMs = 3000) => {
    setHighlights((prev) => ({ ...prev, [id]: type }));

    setTimeout(() => {
      setHighlights((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }, durationMs);
  }, []);

  // WebSocket Connection and Event Handling
  useEffect(() => {
    let isDestroyed = false;

    function connectWs() {
      if (isDestroyed) return;

      try {
        const ws = new WebSocket(WS_BASE);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isDestroyed) {
            console.log('[WS] Connected to live updates server');
            setIsWsConnected(true);
          }
        };

        ws.onmessage = (event) => {
          if (isDestroyed) return;
          try {
            const payload = JSON.parse(event.data);
            const { event: eventType, data } = payload;

            if (eventType === 'REVIEW_ADDED' && data) {
              setReviews((prev) => {
                // Prevent duplicate insertion if already exists
                if (prev.some((r) => r.id === data.id)) return prev;
                return [data, ...prev];
              });
              triggerHighlight(data.id, 'add', 3000);
            } else if (eventType === 'REVIEW_EDITED' && data) {
              setReviews((prev) =>
                prev.map((r) => (r.id === data.id ? data : r))
              );
              triggerHighlight(data.id, 'edit', 3000);
            } else if (eventType === 'REVIEW_DELETED' && data) {
              // Highlight red for 3 seconds, then remove from table
              triggerHighlight(data.id, 'delete', 3000);

              setTimeout(() => {
                setReviews((prev) => prev.filter((r) => r.id !== data.id));
              }, 3000);
            }
          } catch (err) {
            console.error('[WS] Error processing message:', err);
          }
        };

        ws.onclose = () => {
          if (!isDestroyed) {
            setIsWsConnected(false);
            // Reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = (err) => {
          console.warn('[WS] Socket encounter warning:', err);
          ws.close();
        };
      } catch (e) {
        if (!isDestroyed) {
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        }
      }
    }

    connectWs();

    return () => {
      isDestroyed = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [triggerHighlight]);

  // Handler for explicit delete initiated from ReviewList table
  const handleDeleteReview = async (review) => {
    const res = await fetch(`${API_BASE}/reviews/${review.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete review');
  };

  return (
    <div className="app-layout">
      {/* Navigation Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand" onClick={() => navigate('/')} role="button" tabIndex={0}>
            <span className="brand-icon">★</span>
            <span className="brand-name">Live Reviews</span>
          </div>

          <nav className="main-nav" aria-label="Main Navigation">
            <button
              type="button"
              className={`nav-link ${route === 'list' ? 'nav-active' : ''}`}
              onClick={() => navigate('/')}
            >
              All Reviews
            </button>
            <button
              type="button"
              className={`nav-link ${route === 'new' ? 'nav-active' : ''}`}
              onClick={() => navigate('/new')}
            >
              + New Review
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {route === 'list' && (
          <ReviewList
            reviews={reviews}
            highlights={highlights}
            isWsConnected={isWsConnected}
            navigate={navigate}
            onShowToast={showToast}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {route === 'new' && (
          <ReviewForm
            reviewId={null}
            navigate={navigate}
            onShowToast={showToast}
            reviews={reviews}
          />
        )}

        {route === 'edit' && (
          <ReviewForm
            reviewId={reviewId}
            navigate={navigate}
            onShowToast={showToast}
            reviews={reviews}
          />
        )}
      </main>

      {/* Global Toastr / Snackbar with Undo */}
      <Toastr toast={activeToast} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <p>Live Reviews — Real-time feeding powered by Node.js, WebSockets, and SQLite</p>
        </div>
      </footer>
    </div>
  );
}
