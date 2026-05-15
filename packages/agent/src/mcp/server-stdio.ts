import '../env.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerTools } from './router.js'

const server = new McpServer({
  name: 'boff-agent',
  version: '0.1.0',
  description: 'Infrastructure tools for NestJS/NextJS monorepo development'
})

registerTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)
