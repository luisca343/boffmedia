import { getPageMap } from 'nextra/page-map'

export interface Post {
  title: string
  route: string
  frontMatter: {
    title?: string
    date?: string
    description?: string
    author?: string
  }
  locale?: string
}

export async function getPosts(locale: string = 'es'): Promise<Post[]> {
  const pageMap = await getPageMap()
  
  const posts: Post[] = []
  
  function extractPosts(items: any[]) {
    if (!items || !Array.isArray(items)) return
    
    for (const item of items) {
      if (item) {
        // Check if this is a locale-specific post file
        const isLocalePost = item.name?.match(/page\.(es|en)\.mdx$/)
        
        // Only include pages that:
        // 1. Have a route that starts with /blog/
        // 2. Have frontMatter with a date (blog posts should have dates)
        // 3. Match the requested locale or are the main page.tsx
        if (item.route &&
            item.route.startsWith('/blog/') &&
            item.route !== '/blog' &&
            item.frontMatter &&
            item.frontMatter.date &&
            (isLocalePost?.[1] === locale || !isLocalePost)) {
          
          posts.push({
            title: item.frontMatter?.title || item.name || 'Untitled',
            route: item.route.replace(/\.(es|en)$/, ''), // Remove locale extension from route
            frontMatter: item.frontMatter || {},
            locale: isLocalePost?.[1] || 'es'
          })
        }
        
        // Recursively check children
        if (item.children && Array.isArray(item.children)) {
          extractPosts(item.children)
        }
      }
    }
  }
  
  // Start extraction - pageMap might be an array or object
  if (Array.isArray(pageMap)) {
    extractPosts(pageMap)
  } else if (pageMap && typeof pageMap === 'object') {
    extractPosts([pageMap])
  }
  
  // Remove duplicates (keep only the post for the current locale)
  const uniquePosts = posts.filter((post, index, self) => 
    index === self.findIndex((p) => p.route === post.route && p.locale === locale)
  )
  
  // Sort by date, newest first
  uniquePosts.sort((a, b) => {
    const dateA = a.frontMatter.date ? new Date(a.frontMatter.date).getTime() : 0
    const dateB = b.frontMatter.date ? new Date(b.frontMatter.date).getTime() : 0
    return dateB - dateA
  })
  
  return uniquePosts
}
