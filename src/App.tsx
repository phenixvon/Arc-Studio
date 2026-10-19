/**
 * Onchain Agent — ERC-8004 identity + x402 payments on Arc Testnet
 */

import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { AgentHero } from './components/AgentHero'
import { RegisterPanel } from './components/RegisterPanel'
import { PaymentPanel } from './components/PaymentPanel'
import { ReputationPanel } from './components/ReputationPanel'

type Tab = 'register' | 'pay' | 'reputation'

const TABS: { id: Tab; label: string }[] = [
  { id: 'register', label: 'Register' },
  { id: 'pay', label: 'x402 Payment' },
  { id: 'reputation', label: 'Reputation' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('register')
  const [agentId, setAgentId] = useState<bigint | null>(null)
  const [agentURI, setAgentURI] = useState<string | null>(null)
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null)

  function handleRegistered(id: bigint, uri: string, owner: string) {
    setAgentId(id)
    setAgentURI(uri)
    setOwnerAddress(owner)
    setTab('pay')
  }

  return (
    <div
      className="min-h-dvh"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(13,27,47,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>
            Onchain Agent
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(172,198,233,0.15)', color: 'var(--accent)' }}
          >
            Arc Testnet
          </span>
        </div>
        <ConnectKitButton />
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Hero card */}
        <AgentHero
          agentId={agentId}
          agentURI={agentURI}
          ownerAddress={ownerAddress}
          agentWallet={null}
        />

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
              style={
                tab === t.id
                  ? { background: 'var(--surface-strong)', color: 'var(--accent)', border: '1px solid var(--border-strong)' }
                  : { background: 'transparent', color: 'var(--subtle)', border: '1px solid transparent' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div>
          {tab === 'register' && (
            <RegisterPanel onRegistered={handleRegistered} />
          )}
          {tab === 'pay' && <PaymentPanel />}
          {tab === 'reputation' && <ReputationPanel agentId={agentId} />}
        </div>

        {/* Standards badges */}
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {[
            { label: 'ERC-8004', href: 'https://eips.ethereum.org/EIPS/eip-8004' },
            { label: 'x402', href: 'https://developers.circle.com/gateway/nanopayments' },
            { label: 'Circle Gateway', href: 'https://developers.circle.com/gateway/nanopayments/quickstarts/seller' },
          ].map((b) => (
            <a
              key={b.label}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--subtle)' }}
            >
              {b.label}
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
