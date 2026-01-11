import type { Metadata } from "next"
import "./globals.css"


import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import type React from "react" // Import React

// Revalidate every 60 seconds for locale changes instead of forcing dynamic
export const revalidate = 60

export const metadata: Metadata = {
  title: process.env.NODE_ENV === "production" ? "BoffMedia" : "FicusLab",
  description: "BoffMedia",
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
    locale = "es"
    messages = {}
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/img/boff.ico" />
      </head>
      <body className="flex flex-col h-screen bg-transparent">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

