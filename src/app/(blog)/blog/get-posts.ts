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
}

export async function getPosts(): Promise<Post[]> {
  const pageMap = await getPageMap()
  
  const posts: Post[] = []
  
  function extractPosts(items: any[]) {
    if (!items || !Array.isArray(items)) return
    
    for (const item of items) {
      if (item) {
        // Only include pages that:
        // 1. Have a route that starts with /blog/posts/
        // 2. Have frontMatter with a date (blog posts should have dates)
        if (item.route &&
            item.route.startsWith('/blog/') &&
            item.route !== '/blog' &&
            item.frontMatter &&
            item.frontMatter.date) {
          posts.push({
            title: item.frontMatter?.title || item.name || 'Untitled',
            route: item.route,
            frontMatter: item.frontMatter || {}
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
  
  // Sort by date, newest first
  posts.sort((a, b) => {
    const dateA = a.frontMatter.date ? new Date(a.frontMatter.date).getTime() : 0
    const dateB = b.frontMatter.date ? new Date(b.frontMatter.date).getTime() : 0
    return dateB - dateA
  })
  
  return posts
}
