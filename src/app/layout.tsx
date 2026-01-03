import type { Metadata } from 'next'
import './globals.css'
import { AuthWrapper } from '@/components/AuthWrapper'

export const metadata: Metadata = {
  title: 'Configurable Auth Framework',
  description: 'A flexible authentication framework for NextJS applications',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}