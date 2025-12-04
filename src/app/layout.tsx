import type { Metadata } from "next"
import "./globals.css"

import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import type React from "react" // Import React

// Force dynamic rendering for all pages since we use cookies for locale detection
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: process.env.NODE_ENV === "production" ? "BoffMedia" : "FicusLab",
  description: process.env.NODE_ENV === "production" ? "BoffMedia" : "FicusLab"
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let locale
  let messages

  try {
    locale = await getLocale()
    messages = await getMessages()
  } catch (error) {
    console.error("Error loading locale or messages:", error)
    // Fallback to default values if there's an error
    locale = "en"
    messages = {}
  }

  return (
    <html lang={locale}>
      <body className="flex flex-col h-screen bg-transparent">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

