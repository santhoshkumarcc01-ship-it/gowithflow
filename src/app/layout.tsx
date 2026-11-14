import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoWithFlow — AI-Powered Career Intelligence Platform',
  description: 'Discover your skills, identify career gaps and build personalized learning roadmaps with GoWithFlow, an intelligent career development platform.',
  openGraph: {
    title: 'GoWithFlow | Find Your Direction. Grow With Flow.',
    description: 'Understand your capabilities, discover what to learn next and build a clearer path toward your career ambitions.',
    siteName: 'GoWithFlow',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoWithFlow | Find Your Direction. Grow With Flow.',
    description: 'Understand your capabilities, discover what to learn next and build a clearer path toward your career ambitions.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-brand-bg dark:bg-dark-bg text-brand-text dark:text-dark-text antialiased min-h-screen font-sans transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
