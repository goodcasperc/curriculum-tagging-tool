import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Curriculum Tagging Tool',
  description: 'A lightweight tool for teachers to upload curriculum and manage questions with learning goal alignment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <header className="header">
            <div className="container">
              <div className="header-content">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h1 className="logo">
                    📚 Curriculum Tagging Tool
                  </h1>
                </div>
                <div className="subtitle">
                  Teacher Edition
                </div>
              </div>
            </div>
          </header>
          
          <main className="container" style={{ paddingBottom: '2rem' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}