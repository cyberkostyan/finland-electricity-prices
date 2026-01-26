'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useConsent } from './consent/ConsentProvider';
import { clearAllLocalData, getStoredData } from '@/lib/consent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Database, FileText, Download, Trash2, ExternalLink } from 'lucide-react';

export function PrivacySettings() {
  const t = useTranslations('settings.privacy');
  const { analyticsEnabled, setAnalyticsEnabled, isLoaded } = useConsent();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportData = () => {
    const data = getStoredData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spothinta-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      clearAllLocalData();
      setShowClearConfirm(false);
      // Reload to reset app state
      window.location.reload();
    } else {
      setShowClearConfirm(true);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analytics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4" />
            {t('analytics.title')}
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics-toggle">{t('analytics.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('analytics.description')}
              </p>
            </div>
            <Switch
              id="analytics-toggle"
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
              disabled={!isLoaded}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {analyticsEnabled ? t('analytics.enabled') : t('analytics.disabled')}
          </p>
        </div>

        <div className="border-t pt-6">
          {/* Your Data Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              {t('data.title')}
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">{t('data.stored')}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('data.priceAlerts')}</li>
                <li>{t('data.language')}</li>
                <li>{t('data.theme')}</li>
                {analyticsEnabled && <li>{t('data.analyticsData')}</li>}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                {t('data.export')}
              </Button>
              <Button
                variant={showClearConfirm ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleClearData}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {showClearConfirm ? t('data.clearConfirm') : t('data.clearAll')}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          {/* Privacy Policy Link */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ExternalLink className="h-4 w-4" />
              {t('policy.title')}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('policy.summary')}
            </p>
            <Link href="/privacy">
              <Button variant="link" className="h-auto p-0">
                {t('policy.link')}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
