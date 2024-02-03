import type { Metadata, Viewport } from 'next';
import { Fragment } from 'react';

import './globals.css';

// -----------------------------------------------------------------------------
// Metadata
// -----------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    template: '%s | Onframe Tourney',
    default: 'Onframe Tourney',
  },
  description: 'Fully featured competitions with Farcaster Frames.',
  keywords: ['curta', 'farcaster', 'frame', 'ethereum', 'competition', 'onchain', 'base'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Onframe Tourney',
    description: 'Fully featured competitions with Farcaster Frames.',
    siteName: 'Onframe Chess Tourney - Curta',
    url: 'https://onframe-tourney.vercel.app',
    locale: 'en_US',
    images: ['https://onframe-chess.vercel.app/static/og/home.png'],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@fiveoutofnine',
    images: ['https://onframe-chess.vercel.app/static/og/home.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#141414',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// -----------------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------------

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
