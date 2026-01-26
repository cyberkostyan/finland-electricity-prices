'use client';

import { useConsent } from './consent/ConsentProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function AnalyticsWrapper() {
  const { analyticsEnabled, isLoaded } = useConsent();

  // Don't render anything until we've loaded the consent state
  // and only render if analytics is enabled
  if (!isLoaded || !analyticsEnabled) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
