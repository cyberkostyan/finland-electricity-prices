'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'spothinta_privacy_banner_dismissed';

export function PrivacyInfoBanner() {
  const t = useTranslations('privacyBanner');
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  // Prevent hydration mismatch
  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t shadow-lg">
      <div className="container max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{t('title')}</span>
            <span className="text-muted-foreground">
              {' '}{t('message')}{' '}
              <Link href="/settings" className="text-primary hover:underline">
                {t('settingsLink')}
              </Link>.
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="shrink-0"
          aria-label={t('dismiss')}
        >
          <X className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{t('dismiss')}</span>
        </Button>
      </div>
    </div>
  );
}
