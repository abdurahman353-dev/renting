import { useEffect } from 'react';

/**
 * Custom hook to prevent back button navigation
 * This is useful after login to prevent users from going back to the login page
 */
export function usePreventBack() {
    useEffect(() => {
        // Push a new state to prevent back navigation
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            // Push state again to prevent navigation
            window.history.pushState(null, '', window.location.href);
        };

        // Listen for popstate events (back/forward button)
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);
}
