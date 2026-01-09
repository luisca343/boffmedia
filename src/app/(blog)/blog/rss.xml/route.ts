import { getPosts } from '../get-posts'

const CONFIG = {
  title: 'BoffMedia Blog',
  siteUrl: process.env.NODE_ENV === 'production' 
    ? 'https://boffmedia.es' 
    : 'http://localhost:3000',
  description: 'Latest blog posts from BoffMedia',
  lang: 'en-us'
}

export async function GET() {
  // Default to Spanish locale for RSS feed
  const allPosts = await getPosts('es')
  
  const posts = allPosts
    .map(
      post => `    <item>
        <title>${post.title}</title>
        <description>${post.frontMatter.description || ''}</description>
        <link>${CONFIG.siteUrl}${post.route}</link>
        <pubDate>${post.frontMatter.date ? new Date(post.frontMatter.date).toUTCString() : ''}</pubDate>
        ${post.frontMatter.author ? `<author>${post.frontMatter.author}</author>` : ''}
    </item>`
    )
    .join('\n')
    
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${CONFIG.title}</title>
    <link>${CONFIG.siteUrl}</link>
    <description>${CONFIG.description}</description>
    <language>${CONFIG.lang}</language>
${posts}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml'
    }
  })
}
