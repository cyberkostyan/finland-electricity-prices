# Spothinta

Real-time electricity spot prices for Finland with ML predictions.

**Live:** [spothinta.app](https://spothinta.app)

## Features

- **Real-time prices** - Current electricity spot price with VAT (25.5%)
- **ML predictions** - Machine learning-based price forecasts
- **Best hours** - Find the cheapest hours to use electricity
- **Price alerts** - Browser notifications for low/high prices
- **Temperature overlay** - Weather data correlation on price charts
- **Price history** - Monthly statistics and trends
- **Multi-language** - Finnish and English support
- **Dark mode** - Light/dark theme support
- **GDPR compliant** - Privacy-first with opt-in analytics

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **i18n:** [next-intl](https://next-intl.dev/)
- **Deployment:** [Vercel](https://vercel.com/)

## Data Sources

| Data | Source | API |
|------|--------|-----|
| Electricity prices | [sahkotin.fi](https://sahkotin.fi) | Public API |
| ML predictions | [nordpool-predict-fi](https://github.com/vividfog/nordpool-predict-fi) | Public API |
| Weather data | [Open-Meteo](https://open-meteo.com/) | Public API |

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/cyberkostyan/finland-electricity-prices.git
cd finland-electricity-prices

# Install dependencies
yarn install

# Start development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |

## Project Structure

```
├── app/
│   ├── [locale]/           # Localized pages (fi, en)
│   │   ├── page.tsx        # Home page
│   │   ├── settings/       # Settings page
│   │   ├── history/        # Price history page
│   │   └── privacy/        # Privacy policy page
│   └── api/                # API routes
│       ├── prices/         # Price data endpoints
│       └── weather/        # Weather data endpoint
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── consent/            # GDPR consent management
│   ├── PriceDisplay.tsx    # Current price display
│   ├── PriceChart.tsx      # Price chart with predictions
│   ├── BestHours.tsx       # Cheapest hours widget
│   └── PriceAlerts.tsx     # Notification settings
├── lib/
│   ├── api.ts              # API client functions
│   ├── consent.ts          # Consent utilities
│   └── utils.ts            # Helper functions
├── i18n/                   # Internationalization config
├── messages/               # Translation files (en.json, fi.json)
└── public/                 # Static assets
```

## Environment Variables

No environment variables required for basic setup. The app uses public APIs.

Optional for production:
- Vercel Analytics is configured but requires user opt-in

## Deployment

The app is optimized for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

If you find this project useful, consider supporting its development:

[Support on Revolut](https://revolut.me/cyberkosta)
