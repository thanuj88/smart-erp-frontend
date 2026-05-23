import { useEffect } from 'react';

/**
 * Adds a body class for auth pages. Viewport scroll lock is applied via CSS
 * only on larger screens (see index.css).
 */
export function useAuthBodyClass(variant) {
  useEffect(() => {
    if (!variant) return undefined;
    const className = `auth-${variant}-active`;
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [variant]);
}

export default useAuthBodyClass;
