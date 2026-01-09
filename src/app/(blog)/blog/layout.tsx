import { Footer, Layout, Navbar } from 'nextra-theme-blog'
import { getPageMap } from 'nextra/page-map'
import "./blog.css"
 
export const metadata = {
  title: 'Blog Example'
}
 
export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
      <Layout>
        <Navbar pageMap={await getPageMap()} />

        {children}

        <Footer>
          <abbr
            title="This site and all its content are licensed under a Creative Commons Attribution-NonCommercial 4.0 International License."
            style={{ cursor: 'help' }}
          >
            CC BY-NC 4.0
          </abbr>{' '}
          {new Date().getFullYear()} © BoffMedia.
          <a href="/blog/rss.xml" style={{ float: 'right' }}>
            RSS
          </a>
        </Footer>
      </Layout>
  )
}