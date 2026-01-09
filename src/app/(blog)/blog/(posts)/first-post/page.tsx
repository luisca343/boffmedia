import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function FirstPostPage() {
  const locale = await getLocale()
  
  try {
    // Dynamically import the locale-specific MDX file
    const MdxContent = (await import(`./page.${locale}.mdx`)).default
    return <MdxContent />
  } catch (error) {
    // Fallback to Spanish if translation doesn't exist
    try {
      const MdxContent = (await import(`./page.es.mdx`)).default
      return <MdxContent />
    } catch {
      notFound()
    }
  }
}
