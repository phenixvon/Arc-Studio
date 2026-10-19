/**
 * PaymentPanel — demonstrates the x402 paid endpoint
 *
 * Calls POST /api/agent/summarize (proxied to Express backend on :3001).
 * If the backend isn't running / seller address not set, shows a clear status.
 */

import { useState, useEffect } from 'react'
import { Loader2, Zap, AlertCircle, CheckCircle2, ServerOff } from 'lucide-react'

interface CapabilityInfo {
  name: string
  endpoints: Array<{ path: string; method: string; price: string; description: string }>
  x402Support: boolean
  sellerAddress?: string
}

export function PaymentPanel() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<{ summary: string; paidAt: string } | null>(null)
  const [status, setStatus] = useState<'idle' | 'calling' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [capabilities, setCapabilities] = useState<CapabilityInfo | null>(null)
  const [backendOk, setBackendOk] = useState<boolean | null>(null)

  // Check backend health and load capabilities
  useEffect(() => {
    async function check() {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(3000) })
        setBackendOk(r.ok)
        if (r.ok) {
          const caps = await fetch('/api/agent/capabilities')
          if (caps.ok) setCapabilities((await caps.json()) as CapabilityInfo)
        }
      } catch {
        setBackendOk(false)
      }
    }
    void check()
  }, [])

  async function callAgent() {
    if (!prompt.trim()) return
    setStatus('calling')
    setResult(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/agent/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (res.ok) {
        const data = await res.json() as { summary: string; paidAt: string }
        setResult(data)
        setStatus('success')
      } else if (res.status === 402) {
        // Payment required — in a real agent this triggers x402 negotiation
        setErrorMsg(
          'HTTP 402 Payment Required. A buyer agent would now negotiate payment via x402 and retry.',
        )
        setStatus('error')
      } else {
        const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
        setErrorMsg(body.error ?? `HTTP ${res.status}`)
        setStatus('error')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg.includes('fetch') || msg.includes('network') ? 'Backend unreachable. Start the server with the command below.' : msg)
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {/* x402 explainer */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} color="var(--accent)" />
          <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
            How x402 payments work
          </span>
        </div>
        <ol className="space-y-1.5 text-sm" style={{ color: 'var(--muted)' }}>
          <li>1. Agent calls the endpoint without payment → receives HTTP 402</li>
          <li>2. Agent reads the 402 body to discover the price and accepted chains</li>
          <li>3. Agent signs a Circle Gateway payment authorization</li>
          <li>4. Agent retries with the payment header → receives 200 + result</li>
        </ol>
      </div>

      {/* Backend status */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{
          background: backendOk === false ? 'rgba(232,109,122,0.1)' : backendOk === true ? 'rgba(141,216,159,0.1)' : 'var(--surface-muted)',
          border: `1px solid ${backendOk === false ? 'rgba(232,109,122,0.3)' : backendOk === true ? 'rgba(141,216,159,0.3)' : 'var(--border)'}`,
        }}
      >
        {backendOk === null ? (
          <Loader2 size={15} className="animate-spin" style={{ color: 'var(--subtle)' }} />
        ) : backendOk ? (
          <CheckCircle2 size={15} color="var(--success)" />
        ) : (
          <ServerOff size={15} color="var(--danger)" />
        )}
        <span className="text-sm" style={{ color: backendOk === false ? 'var(--danger)' : backendOk === true ? 'var(--success)' : 'var(--subtle)' }}>
          {backendOk === null ? 'Checking backend…' : backendOk ? 'Payment server online' : 'Payment server offline — run: bun run server'}
        </span>
      </div>

      {/* Capabilities */}
      {capabilities && (
        <div
          className="rounded-xl px-4 py-3 space-y-1"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          {capabilities.endpoints.map((ep) => (
            <div key={ep.path} className="flex items-center justify-between gap-2">
              <span className="mono text-xs" style={{ color: 'var(--muted)' }}>
                {ep.method} {ep.path}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(172,198,233,0.15)', color: 'var(--accent)' }}
              >
                {ep.price}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Prompt input */}
      <div className="space-y-2">
        <label className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Summarize Arc Testnet transaction trends this week"
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors"
          style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
          }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={() => { void callAgent() }}
        disabled={status === 'calling' || !prompt.trim() || !backendOk}
        className="w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        style={{ background: 'var(--accent)', color: '#0d1b2f' }}
      >
        {status === 'calling' ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Calling agent…
          </>
        ) : (
          <>
            <Zap size={15} /> Call Agent (0.001 USDC)
          </>
        )}
      </button>

      {/* Result */}
      {status === 'success' && result && (
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: 'rgba(141,216,159,0.08)', border: '1px solid rgba(141,216,159,0.25)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} color="var(--success)" />
            <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
              Paid response received
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            {result.summary}
          </p>
          <p className="mono text-xs" style={{ color: 'var(--subtle)' }}>
            {result.paidAt}
          </p>
        </div>
      )}

      {status === 'error' && errorMsg && (
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-2 text-sm"
          style={{ background: 'rgba(232,109,122,0.1)', border: '1px solid rgba(232,109,122,0.3)', color: 'var(--danger)' }}
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Startup command hint */}
      {!backendOk && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>
            Start the payment server in a terminal:
          </p>
          <p className="mono text-xs" style={{ color: 'var(--accent)' }}>
            bun run server
          </p>
        </div>
      )}
    </div>
  )
}
