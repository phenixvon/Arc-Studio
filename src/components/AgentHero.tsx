/**
 * AgentHero — top identity card showing agent name, status, and live agentId
 */

import { ExternalLink, Cpu } from 'lucide-react'
import { buildAddressExplorerUrl } from '@/onchain-facts'

const ARC_CHAIN_ID = 5042002

interface AgentHeroProps {
  agentId: bigint | null
  agentURI: string | null
  ownerAddress: string | null
  agentWallet: string | null
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function AgentHero({ agentId, agentURI, ownerAddress, agentWallet }: AgentHeroProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface-strong)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Icon + name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(172,198,233,0.15)', border: '1px solid rgba(172,198,233,0.3)' }}
        >
          <Cpu size={22} color="var(--accent)" />
        </div>
        <div>
          <p className="display text-xl font-semibold" style={{ color: 'var(--ink)' }}>
            Arc Research Agent
          </p>
          <p className="text-sm" style={{ color: 'var(--subtle)' }}>
            ERC-8004 Identity · Arc Testnet
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Agent ID"
          value={agentId !== null ? `#${agentId.toString()}` : '—'}
          mono
        />
        <Stat
          label="Owner"
          value={ownerAddress ? truncate(ownerAddress) : '—'}
          mono
          href={ownerAddress ? buildAddressExplorerUrl(ARC_CHAIN_ID, ownerAddress) : undefined}
        />
        <Stat
          label="Agent Wallet"
          value={agentWallet ? truncate(agentWallet) : '—'}
          mono
          href={agentWallet ? buildAddressExplorerUrl(ARC_CHAIN_ID, agentWallet) : undefined}
        />
      </div>

      {/* URI */}
      {agentURI && (
        <div
          className="mt-3 rounded-lg px-3 py-2 flex items-center gap-2"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>
            URI
          </span>
          <span className="mono text-xs truncate" style={{ color: 'var(--muted)' }}>
            {agentURI}
          </span>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  mono,
  href,
}: {
  label: string
  value: string
  mono?: boolean
  href?: string
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm font-medium flex items-center gap-1 ${mono ? 'mono' : ''}`}
          style={{ color: 'var(--accent)' }}
        >
          {value}
          <ExternalLink size={11} />
        </a>
      ) : (
        <p
          className={`text-sm font-medium tabular-nums ${mono ? 'mono' : ''}`}
          style={{ color: value === '—' ? 'var(--subtle)' : 'var(--ink-2)' }}
        >
          {value}
        </p>
      )}
    </div>
  )
}
