'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Zap, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-2 bg-primary rounded-lg">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('lastUpdated')}: {t('updateDate')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Privacy Policy Content */}
        <Card>
          <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
            {/* Section 1: Who We Are */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('sections.whoWeAre.title')}</h2>
              <p className="text-muted-foreground">{t('sections.whoWeAre.content')}</p>
            </section>

            {/* Section 2: Data We Collect */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('sections.dataWeCollect.title')}</h2>
              <p className="text-muted-foreground mb-4">{t('sections.dataWeCollect.intro')}</p>

              <h3 className="text-lg font-medium mb-2">{t('sections.dataWeCollect.necessary.title')}</h3>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>{t('sections.dataWeCollect.necessary.language')}</li>
                <li>{t('sections.dataWeCollect.necessary.theme')}</li>
                <li>{t('sections.dataWeCollect.necessary.alerts')}</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">{t('sections.dataWeCollect.optional.title')}</h3>
              <p className="text-muted-foreground mb-2">{t('sections.dataWeCollect.optional.intro')}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>{t('sections.dataWeCollect.optional.pageViews')}</li>
                <li>{t('sections.dataWeCollect.optional.performance')}</li>
                <li>{t('sections.dataWeCollect.optional.device')}</li>
              </ul>
            </section>

            {/* Section 3: Legal Basis */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('sections.legalBasis.title')}</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>
                  <strong>{t('sections.legalBasis.necessary.title')}:</strong>{' '}
                  {t('sections.legalBasis.necessary.content')}
                </li>
                <li>
                  <strong>{t('sections.legalBasis.analytics.title')}:</strong>{' '}
                  {t('sections.legalBasis.analytics.content')}
                </li>
              </ul>
            </section>

            {/* Section 4: Third Parties */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('sections.thirdParties.title')}</h2>
              <p className="text-muted-foreground mb-4">{t('sections.thirdParties.intro')}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>
                  <strong>Vercel:</strong> {t('sections.thirdParties.vercel')}
                </li>
                <li>
                  <strong>sahkotin.fi:</strong> {t('sections.thirdParties.sahkotin')}
                </li>
                <li>
                  <strong>Open-Meteo:</strong> {t('sections.thirdParties.openMeteo')}
                </li>
              </ul>
            </section>

            {/* Section 5: Data Retention */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('sections.dataRetention.title')}</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>{t('sections.dataRetention.cookies')}</li>
                <li>{t('sections.dataRetention.localStorage')}</li>
                <li>{t('sections.dataRetention.analytics')}</li>
              </ul>
            </section>

            {/* Section 6: Your Rights */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('sections.yourRights.title')}</h2>
              <p className="text-muted-foreground mb-4">{t('sections.yourRights.intro')}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>{t('sections.yourRights.access')}</li>
                <li>{t('sections.yourRights.rectification')}</li>
                <li>{t('sections.yourRights.erasure')}</li>
                <li>{t('sections.yourRights.portability')}</li>
                <li>{t('sections.yourRights.withdraw')}</li>
              </ul>
              <p className="text-muted-foreground mt-4">{t('sections.yourRights.howTo')}</p>
            </section>

            {/* Section 7: Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('sections.contact.title')}</h2>
              <p className="text-muted-foreground">
                {t('sections.contact.content')}{' '}
                <a href="mailto:privacy@spothinta.app" className="text-primary hover:underline">
                  privacy@spothinta.app
                </a>
              </p>
            </section>

            {/* Section 8: Updates */}
            <section>
              <h2 className="text-xl font-semibold mb-3">{t('sections.updates.title')}</h2>
              <p className="text-muted-foreground">{t('sections.updates.content')}</p>
            </section>
          </CardContent>
        </Card>

        {/* Back to Settings */}
        <div className="mt-6 text-center">
          <Link href="/settings">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToSettings')}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
