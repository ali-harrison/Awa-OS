import type { Metadata } from 'next'
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// latin-ext carries the macrons in te reo Māori: without it ā ē ī ō ū fall back to another font
const sans = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-instrument-sans',
  display: 'swap',
})

const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'opsz'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AWA/OS — Te Wairama Digital',
  description: 'Freelance operating system for Te Wairama Digital',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  )
}
