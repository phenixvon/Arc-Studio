# Onchain Agent — ERC-8004 + x402

> Built with Arc Studio - money-powered apps in minutes

## What This App Does

An onchain AI agent demo with:
- **ERC-8004 identity registration** on Arc Testnet (mints an identity NFT, publishes an agent card with `x402Support: true`)
- **x402 Circle Gateway Nanopayments** backend — a paid `POST /agent/summarize` endpoint that returns HTTP 402 to unauthenticated callers
- **ERC-8004 reputation feedback** — a second wallet can rate the agent on the ReputationRegistry

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Arc Dark mode
- Web3: wagmi v2, viem v2, ConnectKit
- Backend: Express + `@circle-fin/x402-batching` (port 3001, Vite proxies /api)
- Chain: Arc Testnet (Chain ID: 5042002)
- Token: USDC (native gas + ERC-20, 6 decimals, 0x3600000000000000000000000000000000000000)

## Key Contract Addresses (Arc Testnet)

| Contract | Address |
|---|---|
| ERC-8004 IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ERC-8004 ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ERC-8004 ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |
| ERC-8183 AgenticCommerce | `0x0747EEf0706327138c69792bF28Cd525089e4583` |

## Key Files

- `src/App.tsx` — main composition root (tabs: Register / x402 Payment / Reputation)
- `src/components/AgentHero.tsx` — identity summary card
- `src/components/RegisterPanel.tsx` — ERC-8004 registration flow
- `src/components/PaymentPanel.tsx` — x402 frontend demo
- `src/components/ReputationPanel.tsx` — ERC-8004 reputation feedback
- `server/index.ts` — Express backend with Circle Gateway middleware

## Environment Variables

```
VITE_SELLER_ADDRESS=0x<your-address>   # EVM address to receive USDC payments
```

Add to `.env`, then restart both the dev server and payment server.

## Running

```bash
# Terminal 1 — frontend
bun run dev

# Terminal 2 — payment backend
bun run server
```

## Testing the x402 Flow

```bash
# Should return 402
curl -X POST http://localhost:3001/agent/summarize -H 'Content-Type: application/json' -d '{"prompt":"test"}'

# Inspect the service
circle services inspect http://localhost:3001/agent/summarize
```
