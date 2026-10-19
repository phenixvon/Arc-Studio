/**
 * ReputationPanel — give feedback to a registered agent via ERC-8004 ReputationRegistry
 *
 * The agent owner CANNOT rate themselves. A second wallet must send this tx.
 */

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { keccak256, toBytes } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { Star, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const
const ARC_TESTNET_ID = 5042002

const reputationAbi = [
  {
    type: 'function',
    name: 'giveFeedback',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const

interface ReputationPanelProps {
  agentId: bigint | null
}

const RATING_LABELS: Record<number, string> = {
  20: 'Poor',
  40: 'Below average',
  60: 'Average',
  80: 'Good',
  100: 'Excellent',
}

export function ReputationPanel({ agentId }: ReputationPanelProps) {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const [rating, setRating] = useState(80)
  const [comment, setComment] = useState('')

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isWrongChain = isConnected && chainId !== ARC_TESTNET_ID

  function handleFeedback() {
    if (!agentId) return
    if (!address) return
    if (isWrongChain) {
      switchChain({ chainId: ARC_TESTNET_ID })
      return
    }

    const feedbackBody = JSON.stringify({ rating, comment })
    const feedbackHash = keccak256(toBytes(feedbackBody))

    writeContract({
      address: REPUTATION_REGISTRY,
      abi: reputationAbi,
      functionName: 'giveFeedback',
      args: [
        agentId,
        BigInt(rating),
        0,
        'service-quality',
        '',
        '',
        '',
        feedbackHash,
      ],
      chainId: ARC_TESTNET_ID,
    })
  }

  if (isSuccess && hash) {
    toast.success('Feedback recorded!')
  }

  const errorMsg = writeError
    ? writeError.message.includes('user rejected')
      ? 'Transaction cancelled.'
      : writeError.message.includes('insufficient')
        ? 'Insufficient USDC for gas.'
        : writeError.message.includes('same')
          ? 'You cannot rate your own agent.'
          : 'Transaction failed. Are you on Arc Testnet?'
    : null

  if (!agentId) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Star size={28} style={{ color: 'var(--subtle)', margin: '0 auto 12px' }} />
        <p className="text-sm" style={{ color: 'var(--subtle)' }}>
          Register an agent first to enable reputation feedback.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Star size={16} color="var(--accent)" />
          <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
            Leave feedback for Agent #{agentId.toString()}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Feedback must come from a wallet that is NOT the agent owner. Use a second funded wallet.
          Gas is ~0.006 testnet USDC.
        </p>
      </div>

      {/* Rating slider */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
            Rating
          </label>
          <span
            className="display text-xl font-bold tabular-nums"
            style={{ color: 'var(--accent)' }}
          >
            {rating}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
        />
        <div className="flex justify-between text-xs" style={{ color: 'var(--subtle)' }}>
          <span>0</span>
          <span>{RATING_LABELS[rating] ?? ''}</span>
          <span>100</span>
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>
          Comment (optional — committed as a hash)
        </label>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. Delivered on time, great accuracy"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
          }}
        />
      </div>

      {/* CTA */}
      {!isConnected ? (
        <div className="flex justify-center pt-1">
          <ConnectKitButton />
        </div>
      ) : isWrongChain ? (
        <button
          onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
          className="w-full rounded-xl py-3 font-semibold text-sm"
          style={{ background: 'var(--danger)', color: '#fff' }}
        >
          Switch to Arc Testnet
        </button>
      ) : isSuccess && hash ? (
        <div className="space-y-3">
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(141,216,159,0.12)', border: '1px solid rgba(141,216,159,0.3)' }}
          >
            <CheckCircle size={17} color="var(--success)" />
            <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
              Feedback recorded on Arc
            </p>
          </div>
          <a
            href={buildTxExplorerUrl(ARC_TESTNET_ID, hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
          >
            <ExternalLink size={14} /> View on Explorer
          </a>
          <button onClick={reset} className="w-full text-sm py-2 hover:opacity-70 transition-opacity" style={{ color: 'var(--subtle)' }}>
            Leave more feedback
          </button>
        </div>
      ) : (
        <button
          onClick={handleFeedback}
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
            <>
              <Star size={15} /> Submit Feedback
            </>
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
