export const ANALYTICS_COOKIE = 'spothinta_analytics';

/**
 * Get the current analytics consent status from cookie
 * Returns false if no cookie exists or cookie is set to 'false'
 */
export function getAnalyticsConsent(): boolean {
  if (typeof document === 'undefined') return false;

  const cookies = document.cookie.split(';');
  const analyticsCookie = cookies.find(c => c.trim().startsWith(`${ANALYTICS_COOKIE}=`));

  if (!analyticsCookie) return false;

  const value = analyticsCookie.split('=')[1]?.trim();
  return value === 'true';
}

/**
 * Set the analytics consent cookie
 * Cookie expires in 1 year
 */
export function setAnalyticsConsent(enabled: boolean): void {
  if (typeof document === 'undefined') return;

  const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
  const sameSite = 'Lax';
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';

  if (enabled) {
    document.cookie = `${ANALYTICS_COOKIE}=true;max-age=${maxAge};path=/;SameSite=${sameSite}${secure}`;
  } else {
    // Remove the cookie by setting max-age to 0
    document.cookie = `${ANALYTICS_COOKIE}=;max-age=0;path=/;SameSite=${sameSite}${secure}`;
  }
}

/**
 * Get all stored data for export
 */
export function getStoredData(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};

  const data: Record<string, unknown> = {
    localStorage: {} as Record<string, string>,
    cookies: {} as Record<string, string>,
  };

  // Get localStorage data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const value = localStorage.getItem(key);
        (data.localStorage as Record<string, string>)[key] = value ? JSON.parse(value) : value;
      } catch {
        (data.localStorage as Record<string, string>)[key] = localStorage.getItem(key) || '';
      }
    }
  }

  // Get cookies
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name) {
      (data.cookies as Record<string, string>)[name] = value || '';
    }
  });

  return data;
}

/**
 * Clear all local data (localStorage and relevant cookies)
 */
export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.clear();

  // Clear analytics consent cookie
  setAnalyticsConsent(false);
}
