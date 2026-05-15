import '../env.js'
import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { registerTools } from './router.js'

const PORT = process.env.AGENT_HTTP_PORT ?? 4242
const app = express()

const server = new McpServer({
  name: 'boff-agent',
  version: '0.1.0',
  description: 'Infrastructure tools for NestJS/NextJS monorepo development'
})

registerTools(server)

const transports = new Map<string, SSEServerTransport>()

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res)
  transports.set(transport.sessionId, transport)
  res.on('close', () => transports.delete(transport.sessionId))
  await server.connect(transport)
})

app.post('/messages', express.json(), async (req, res) => {
  const sessionId = req.query.sessionId as string
  const transport = transports.get(sessionId)
  if (!transport) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  await transport.handlePostMessage(req, res)
})

app.listen(PORT, () => {
  console.log(`Harness agent MCP server listening on http://localhost:${PORT}`)
})
