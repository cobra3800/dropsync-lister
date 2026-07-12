import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DropSync Platform',
  description: 'Import once. Sell everywhere.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
