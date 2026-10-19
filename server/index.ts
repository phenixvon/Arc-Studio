/**
 * Agent Payment Server — x402 + Circle Gateway Nanopayments
 *
 * Exposes one paid endpoint:  POST /agent/summarize  (0.001 USDC per call)
 * Everything behind gateway.require() returns 402 until the buyer pays.
 */

import express from 'express'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const app = express()
app.use(express.json())

// Health check (free, used by the frontend status indicator)
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})

// Seller EVM address — set VITE_SELLER_ADDRESS in .env
// (VITE_ prefix so the frontend can read the same key without a second env var)
const sellerAddress = process.env.VITE_SELLER_ADDRESS as `0x${string}` | undefined

if (!sellerAddress) {
  console.warn(
    '[agent-server] VITE_SELLER_ADDRESS not set — payment receipts will fail. ' +
      'Add VITE_SELLER_ADDRESS=0x<your-address> to .env and restart.',
  )
}

// Create the Circle Gateway middleware
const gateway = createGatewayMiddleware({
  sellerAddress: sellerAddress ?? '0x0000000000000000000000000000000000000000',
})

// Agent capabilities (free — used by the frontend to populate the UI)
app.get('/agent/capabilities', (_req, res) => {
  res.json({
    name: 'Arc Research Agent',
    version: '1.0.0',
    endpoints: [
      {
        path: '/agent/summarize',
        method: 'POST',
        price: '$0.001 USDC',
        description: 'Summarize a topic or onchain data request. Accepts { prompt: string }.',
      },
    ],
    x402Support: true,
    sellerAddress,
  })
})

// Paid endpoint — requires 0.001 USDC per call via Circle Gateway Nanopayments
app.post('/agent/summarize', gateway.require('$0.001'), (req, res) => {
  const { prompt } = req.body as { prompt?: string }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'prompt is required' })
    return
  }

  // In a real agent this would call an LLM or onchain data source.
  // For this demo we echo the prompt with a canned analysis.
  const summary = `[Arc Research Agent] Analysed: "${prompt.slice(0, 120)}". ` +
    `This request was fulfilled onchain via x402 / Circle Gateway Nanopayments. ` +
    `Payment settled to ${sellerAddress ?? '<seller>'} on Arc Testnet.`

  res.json({ summary, paidAt: new Date().toISOString() })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`[agent-server] listening on http://localhost:${PORT}`)
})
