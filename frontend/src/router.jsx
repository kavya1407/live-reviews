import { useState, useEffect } from 'react';

/**
 * Normalizes URL path from either window.location.pathname or window.location.hash
 */
export function getNormalizedPath() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    return hash.slice(1); // remove '#'
  }
  const pathname = window.location.pathname;
  return pathname || '/';
}

/**
 * Custom lightweight router hook
 */
export function useRouter() {
  const [path, setPath] = useState(getNormalizedPath());

  useEffect(() => {
    const handlePopState = () => {
      setPath(getNormalizedPath());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (toPath) => {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      window.location.hash = `#${toPath}`;
    } else {
      window.history.pushState(null, '', toPath);
      setPath(toPath);
    }
  };

  // Determine current route & params
  // Routes:
  // 1. '/' -> list view
  // 2. '/new' -> new review view
  // 3. '/:id' -> edit review view
  let route = 'list';
  let reviewId = null;

  const cleanPath = path.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '') {
    route = 'list';
  } else if (cleanPath === '/new') {
    route = 'new';
  } else {
    // Matches '/:id'
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length === 1) {
      route = 'edit';
      reviewId = parts[0];
    } else {
      route = 'list';
    }
  }

  return { path, route, reviewId, navigate };
}
