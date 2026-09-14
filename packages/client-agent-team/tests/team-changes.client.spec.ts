// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { TeamChangeStream } from '../src/client/team-changes.ts'

interface FakeCall {
  readonly request: { afterVersion: number; scope?: unknown }
  readonly signal: AbortSignal
}

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void } {
  const box = Promise.withResolvers<T>()
  return box
}

describe('TeamChangeStream', () => {
  it('shares one long-poll per scope and dispatches wakes to every listener', async () => {
    const parked = deferred<{ ok: true; value: { version: number } }>()
    let parkCalls = 0
    const calls: FakeCall[] = []
    const changes = vi.fn((request: { afterVersion: number; scope?: unknown }, signal: AbortSignal) => {
      calls.push({ request, signal })
      if (request.afterVersion === 0) return Promise.resolve({ ok: true as const, value: { version: 7 } })
      parkCalls += 1
      // Only the first poll parks on the resolvable deferred; later polls must
      // park freshly or an already-resolved promise would spin the stream.
      return parkCalls === 1 ? parked.promise as never : new Promise<never>(() => {})
    })
    const stream = new TeamChangeStream(changes as never)
    const scope = { kind: 'thread' as const, threadRef: 'thread:1' as never }
    const first = vi.fn()
    const second = vi.fn()
    const disposeFirst = stream.subscribe(scope, first)
    const disposeSecond = stream.subscribe(scope, second)
    await Promise.resolve()
    await Promise.resolve()

    // The probe sampled version 7 silently; exactly one parked poll exists and
    // both subscribers share it.
    expect(changes).toHaveBeenCalledTimes(2)
    expect(calls[0]!.request).toEqual({ afterVersion: 0, scope })
    expect(calls[1]!.request).toEqual({ afterVersion: 7, scope })
    expect(first).not.toHaveBeenCalled()
    expect(second).not.toHaveBeenCalled()

    parked.resolve({ ok: true, value: { version: 8 } })
    await vi.waitFor(() => expect(first).toHaveBeenCalledWith({ type: 'changed', version: 8 }))
    expect(second).toHaveBeenCalledWith({ type: 'changed', version: 8 })
    disposeFirst()

    // The surviving subscriber keeps the poll alive; a second wake reaches it.
    await vi.waitFor(() => expect(changes).toHaveBeenCalledTimes(3))
    expect(calls[2]!.request).toEqual({ afterVersion: 8, scope })
    disposeSecond()
  })

  it('opens independent polls per scope and aborts when the last subscriber leaves', async () => {
    const waiters: Array<(value: { ok: true; value: { version: number } }) => void> = []
    const calls: FakeCall[] = []
    const changes = vi.fn((request: { afterVersion: number; scope?: unknown }, signal: AbortSignal) => {
      calls.push({ request, signal })
      if (request.afterVersion === 0) return Promise.resolve({ ok: true as const, value: { version: 3 } })
      return new Promise(resolve => { waiters.push(resolve) }) as never
    })
    const stream = new TeamChangeStream(changes as never)
    const threadScope = { kind: 'thread' as const, threadRef: 'thread:1' as never }
    const channelScope = { kind: 'channel' as const, channelRef: 'channel:1' as never }
    const disposeThread = stream.subscribe(threadScope, () => {})
    stream.subscribe(channelScope, () => {})
    await vi.waitFor(() => expect(calls.length).toBe(4))
    // The two polls start concurrently, so only their per-scope order is stable.
    const threadCalls = calls.filter(call => call.request.scope === threadScope)
    const channelCalls = calls.filter(call => call.request.scope === channelScope)
    expect(threadCalls.map(call => call.request.afterVersion)).toEqual([0, 3])
    expect(channelCalls.map(call => call.request.afterVersion)).toEqual([0, 3])

    disposeThread()
    await vi.waitFor(() => expect(threadCalls[1]!.signal.aborted).toBe(true))
    // The channel poll keeps running with a live signal.
    expect(channelCalls[1]!.signal.aborted).toBe(false)
    waiters.splice(0).forEach(resolve => resolve({ ok: true, value: { version: 4 } }))
  })

  it('re-anchors a poll whose cursor sits ahead of the answered domain', async () => {
    const parked: Array<(value: { ok: true; value: { version: number } }) => void> = []
    const calls: FakeCall[] = []
    const changes = vi.fn((request: { afterVersion: number; scope?: unknown }, signal: AbortSignal) => {
      calls.push({ request, signal })
      if (request.afterVersion === 0) return Promise.resolve({ ok: true as const, value: { version: 40 } })
      return new Promise(resolve => { parked.push(resolve) }) as never
    })
    const stream = new TeamChangeStream(changes as never)
    const scope = { kind: 'presence' as const, workspaceId: 'w1' as WorkspaceId }
    const listener = vi.fn()
    stream.subscribe(scope, listener)
    await vi.waitFor(() => expect(parked.length).toBe(1))
    expect(calls[1]!.request).toEqual({ afterVersion: 40, scope })

    // The Host answers this scope's own domain with a value below the cursor
    // the poll held (a cursor from another scope or an earlier Host lifetime).
    // Growth-only comparison would swallow the update and park the subscriber
    // blind until the domain value passed the stale cursor.
    parked[0]!({ ok: true, value: { version: 3 } })
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith({ type: 'changed', version: 3 }))
    await vi.waitFor(() => expect(calls[2]!.request).toEqual({ afterVersion: 3, scope }))
  })

  it('reports one failure per outage and resyncs the mounted listener on recovery', async () => {
    vi.useFakeTimers()
    try {
      type Answer = { ok: true; value: { version: number } } | { ok: false; error: { code: string; message: string; details: object } }
      let online = true
      let version = 4
      const parked: Array<(answer: Answer) => void> = []
      const changes = vi.fn((request: { afterVersion: number }) => {
        if (!online) return Promise.resolve({ ok: false as const, error: { code: 'transport', message: 'transport down', details: {} } })
        if (version > request.afterVersion) return Promise.resolve({ ok: true as const, value: { version } })
        // An equal cursor parks until the Host's keep-alive deadline, exactly
        // like the real long poll.
        return new Promise<Answer>(resolve => { parked.push(resolve) })
      })
      const stream = new TeamChangeStream(changes as never)
      const scope = { kind: 'workspace' as const, workspaceId: 'w1' as WorkspaceId }
      const listener = vi.fn()
      const dispose = stream.subscribe(scope, listener)
      await vi.advanceTimersByTimeAsync(0)
      // The opening sample is silent, and the poll parks on the sampled cursor.
      expect(changes).toHaveBeenCalledTimes(2)
      expect(listener).not.toHaveBeenCalled()

      // The transport drops under the parked wait: every listener hears about
      // the outage once, and the retries inside it stay silent.
      online = false
      parked.splice(0).forEach(resolve => { resolve({ ok: false, error: { code: 'transport', message: 'transport down', details: {} } }) })
      await vi.advanceTimersByTimeAsync(0)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith({ type: 'failed', message: 'transport down' })
      await vi.advanceTimersByTimeAsync(1_000)
      expect(changes).toHaveBeenCalledTimes(3)
      expect(listener).toHaveBeenCalledTimes(1)

      // Recovery answers with the version the outage began at — nothing
      // committed while the transport was gone. The mounted listener still has
      // to hear it, because its own reads failed with the transport.
      online = true
      await vi.advanceTimersByTimeAsync(2_000)
      expect(changes).toHaveBeenCalledTimes(4)
      parked.splice(0).forEach(resolve => { resolve({ ok: true, value: { version: 4 } }) })
      await vi.advanceTimersByTimeAsync(0)
      expect(listener).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenLastCalledWith({ type: 'changed', version: 4 })

      // The re-anchored poll parks again, and a real commit wakes it the
      // ordinary way.
      version = 9
      parked.splice(0).forEach(resolve => { resolve({ ok: true, value: { version: 9 } }) })
      await vi.advanceTimersByTimeAsync(0)
      expect(listener).toHaveBeenLastCalledWith({ type: 'changed', version: 9 })

      // Leaving is the only thing that stops a retrying poll: no timer survives
      // the last subscriber.
      const total = changes.mock.calls.length
      dispose()
      await vi.advanceTimersByTimeAsync(60_000)
      expect(changes).toHaveBeenCalledTimes(total)
    } finally {
      vi.useRealTimers()
    }
  })

  it('resumes a re-subscribed scope from its last observed version', async () => {
    let domain = 5
    const calls: FakeCall[] = []
    // The Host answers a cursor that sits behind its domain value at once and
    // parks one that already equals it.
    const changes = vi.fn((request: { afterVersion: number; scope?: unknown }, signal: AbortSignal) => {
      calls.push({ request, signal })
      return request.afterVersion === domain
        ? new Promise<never>(() => {}) as never
        : Promise.resolve({ ok: true as const, value: { version: domain } })
    })
    const stream = new TeamChangeStream(changes as never)
    const scope = { kind: 'thread' as const, threadRef: 'thread:1' as never }
    const first = vi.fn()
    const disposeFirst = stream.subscribe(scope, first)
    await vi.waitFor(() => expect(calls.length).toBe(2))
    expect(calls.map(call => call.request.afterVersion)).toEqual([0, 5])
    expect(first).not.toHaveBeenCalled()
    disposeFirst()

    // A commit lands while this scope has no poll at all — the window a page
    // leaving the Thread and returning to it opens.
    domain = 9
    const second = vi.fn()
    stream.subscribe(scope, second)
    // The replacement poll opens at the last observed version rather than
    // sampling the domain again, so the commit it missed is a difference it
    // reports; a fresh sample would have swallowed it until the next commit.
    await vi.waitFor(() => expect(calls.map(call => call.request.afterVersion)).toEqual([0, 5, 5, 9]))
    expect(second).toHaveBeenCalledWith({ type: 'changed', version: 9 })
    expect(first).not.toHaveBeenCalled()
  })

  it('keeps a re-subscribed scope silent and unpolled while nothing changed', async () => {
    const domain = 4
    const calls: FakeCall[] = []
    const changes = vi.fn((request: { afterVersion: number; scope?: unknown }, signal: AbortSignal) => {
      calls.push({ request, signal })
      return request.afterVersion === domain
        ? new Promise<never>(() => {}) as never
        : Promise.resolve({ ok: true as const, value: { version: domain } })
    })
    const stream = new TeamChangeStream(changes as never)
    const scope = { kind: 'workspace' as const, workspaceId: 'w1' as WorkspaceId }
    const listener = vi.fn()
    const dispose = stream.subscribe(scope, listener)
    await vi.waitFor(() => expect(calls.length).toBe(2))
    dispose()

    const next = vi.fn()
    stream.subscribe(scope, next)
    await vi.waitFor(() => expect(calls.length).toBe(3))
    // The resumed poll parks on the version it already observed: no second
    // sample, no extra fetch, and no wake for a scope that did not move.
    expect(calls[2]!.request).toEqual({ afterVersion: 4, scope })
    expect(next).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })
})
