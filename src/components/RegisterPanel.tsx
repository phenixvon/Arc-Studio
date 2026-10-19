/**
 * RegisterPanel — registers the agent on ERC-8004 IdentityRegistry
 *
 * Registration flow:
 *  1. Connect wallet (Arc Testnet)
 *  2. Click "Register Agent" → writeContract(register(agentURI))
 *  3. Wait for receipt, parse Registered event, show agentId
 */

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEventLogs } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { CheckCircle, Loader2, AlertCircle, ExternalLink, Bot } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

// ERC-8004 IdentityRegistry on Arc Testnet
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const
const ARC_TESTNET_ID = 5042002

const identityAbi = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const

// ERC-8004 registration file template (hosted inline for demo)
function buildAgentCard(ownerAddress: string, sellerAddress: string): object {
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Arc Research Agent',
    description: 'Summarizes onchain data for a fee. Payable via x402 Circle Gateway Nanopayments.',
    services: [
      {
        name: 'A2A',
        endpoint: `${window.location.origin}/api/agent/summarize`,
        version: '1.0.0',
      },
    ],
    x402Support: true,
    active: true,
    sellerAddress,
    registrations: [
      {
        agentRegistry: `eip155:${ARC_TESTNET_ID}:${IDENTITY_REGISTRY}`,
      },
    ],
    owner: ownerAddress,
  }
}

interface RegisterPanelProps {
  onRegistered: (agentId: bigint, agentURI: string, ownerAddress: string) => void
}

export function RegisterPanel({ onRegistered }: RegisterPanelProps) {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  // Seller address comes from env (the app's backend wallet)
  const sellerAddress = import.meta.env.VITE_SELLER_ADDRESS as string | undefined

  // Inline data URI: JSON encoded as a data: URL so the demo works without IPFS
  const [agentURI, setAgentURI] = useState<string>('')

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  const isWrongChain = isConnected && chainId !== ARC_TESTNET_ID

  function handleRegister() {
    if (!address) return
    if (isWrongChain) {
      switchChain({ chainId: ARC_TESTNET_ID })
      return
    }

    // Build the agent card and encode as a data URI so there's no need for IPFS in the demo
    const card = buildAgentCard(address, sellerAddress ?? address)
    const uri = 'data:application/json;base64,' + btoa(JSON.stringify(card))
    setAgentURI(uri)

    writeContract({
      address: IDENTITY_REGISTRY,
      abi: identityAbi,
      functionName: 'register',
      args: [uri],
      chainId: ARC_TESTNET_ID,
    })
  }

  // Parse agentId from Registered event once confirmed
  if (isSuccess && receipt && agentURI) {
    try {
      const [registered] = parseEventLogs({ abi: identityAbi, eventName: 'Registered', logs: receipt.logs })
      if (registered) {
        onRegistered(registered.args.agentId, agentURI, registered.args.owner)
        toast.success(`Agent #${registered.args.agentId} registered!`)
      }
    } catch {
      // already handled
    }
  }

  const errorMsg = writeError
    ? writeError.message.includes('user rejected')
      ? 'Transaction cancelled.'
      : writeError.message.includes('insufficient')
        ? 'Insufficient USDC for gas. Get test USDC from the sidebar.'
        : 'Transaction failed. Check you are on Arc Testnet.'
    : null

  return (
    <div className="space-y-4">
      {/* Description card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Bot size={16} color="var(--accent)" />
          <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
            What happens when you register
          </span>
        </div>
        <ul className="space-y-1.5 text-sm" style={{ color: 'var(--muted)' }}>
          <li>• Mints an ERC-8004 identity NFT on Arc Testnet</li>
          <li>• Publishes your agent card (name, services, x402 support flag)</li>
          <li>• Sets your wallet as the agent owner</li>
          <li>• Makes the agent discoverable by other agents via the registry</li>
        </ul>
      </div>

      {/* Seller address */}
      <div
        className="rounded-xl px-4 py-3"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>
          Seller receive address (VITE_SELLER_ADDRESS)
        </p>
        <p className="mono text-sm" style={{ color: sellerAddress ? 'var(--accent)' : 'var(--danger)' }}>
          {sellerAddress ?? 'Not set — add VITE_SELLER_ADDRESS to .env'}
        </p>
      </div>

      {/* CTA */}
      {!isConnected ? (
        <div className="flex justify-center pt-2">
          <ConnectKitButton />
        </div>
      ) : isWrongChain ? (
        <button
          onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
          className="w-full rounded-xl py-3 font-semibold text-sm transition-colors"
          style={{ background: 'var(--danger)', color: '#fff' }}
        >
          Switch to Arc Testnet
        </button>
      ) : isSuccess && receipt ? (
        <SuccessState hash={hash!} chainId={ARC_TESTNET_ID} onReset={reset} />
      ) : (
        <button
          onClick={handleRegister}
          disabled={isPending || isConfirming}
          className="w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          style={{ background: 'var(--accent)', color: '#0d1b2f' }}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Confirm in wallet…
            </>
          ) : isConfirming ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Confirming on Arc…
            </>
          ) : (
            'Register Agent on Arc'
          )}
        </button>
      )}

      {errorMsg && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
          style={{ background: 'rgba(232,109,122,0.12)', border: '1px solid rgba(232,109,122,0.3)', color: 'var(--danger)' }}
        >
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}
    </div>
  )
}

function SuccessState({
  hash,
  chainId,
  onReset,
}: {
  hash: `0x${string}`
  chainId: number
  onReset: () => void
}) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(141,216,159,0.12)', border: '1px solid rgba(141,216,159,0.3)' }}
      >
        <CheckCircle size={18} color="var(--success)" />
        <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
          Agent registered successfully
        </p>
      </div>
      <a
        href={buildTxExplorerUrl(chainId, hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
      >
        <ExternalLink size={14} /> View on Explorer
      </a>
      <button
        onClick={onReset}
        className="w-full text-sm py-2 transition-opacity hover:opacity-70"
        style={{ color: 'var(--subtle)' }}
      >
        Register another agent
      </button>
    </div>
  )
}
