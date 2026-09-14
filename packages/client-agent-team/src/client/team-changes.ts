import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { AgentTeamChangeScope, AgentTeamChangesRequest, AgentTeamChangesResult } from '@wowyuarm/dsh-agent-team/types'

/** One poll observes one scope, or every Team change when the scope is omitted. */
export type TeamChangeScope = AgentTeamChangeScope | undefined

/** One invalidation delivered to every surface subscribed to one scope. */
export type TeamChangeUpdate =
  | { readonly type: 'changed'; readonly version: number }
  | { readonly type: 'failed'; readonly message: string }

export type TeamChangeListener = (update: TeamChangeUpdate) => void

type ChangesFn = (request: AgentTeamChangesRequest, signal?: AbortSignal) => Promise<RemoteResult<AgentTeamChangesResult>>

/** First retry delay after a failed call, doubling up to the cap. */
const RETRY_BASE_MS = 1_000
const RETRY_MAX_MS = 30_000

/** Abortable delay: the poll's subscription ending must not wait out a backoff. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const done = (): void => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve() }
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done, { once: true })
  })
}

function scopeKey(scope: TeamChangeScope): string {
  return scope === undefined ? 'all'
    : scope.kind === 'workspace' ? `workspace:${scope.workspaceId}`
    : scope.kind === 'channel' ? `channel:${scope.channelRef}`
    : scope.kind === 'presence' ? `presence:${scope.workspaceId}`
    : `thread:${scope.threadRef}`
}

interface ScopePoll {
  readonly controller: AbortController
  readonly listeners: Set<TeamChangeListener>
  /** The version to open this poll at, from the scope's last observation. */
  readonly resumeFrom: number | undefined
}

/**
 * One long-poll per change scope, shared by every listening surface: panels
 * and pages never open parallel `changes` requests for the same scope, and
 * the poll is aborted as soon as the last subscriber leaves.
 *
 * A failed call reports the outage to every listener once and then keeps
 * retrying with backoff. The transport recovers on its own terms — a Host
 * restart, a sleep/wake, a dropped proxy — and a surface that stayed mounted
 * has to resume from that recovery rather than stay silent until it remounts,
 * so the first answered call after an outage wakes every listener once even
 * when the cursor did not move.
 *
 * Each poll keeps its own cursor, and a cursor only means something inside the
 * scope it was issued for: the Host answers a presence scope from a
 * process-local wake epoch and every other scope from a durable ledger
 * position.
 */
export class TeamChangeStream {
  private readonly polls = new Map<string, ScopePoll>()
  /**
   * The last version each scope key answered with, kept after that scope's poll
   * is torn down: a commit landing while no poll exists is otherwise folded into
   * the replacement poll's opening sample, which reports nothing.
   */
  private readonly observed = new Map<string, number>()

  constructor(private readonly changes: ChangesFn) {}

  subscribe(scope: TeamChangeScope, listener: TeamChangeListener): () => void {
    const key = scopeKey(scope)
    let poll = this.polls.get(key)
    if (poll === undefined) {
      poll = { controller: new AbortController(), listeners: new Set(), resumeFrom: this.observed.get(key) }
      this.polls.set(key, poll)
      void this.run(key, scope, poll)
    }
    poll.listeners.add(listener)
    return () => {
      const current = this.polls.get(key)
      if (current === undefined || !current.listeners.delete(listener)) return
      if (current.listeners.size === 0) {
        this.polls.delete(key)
        current.controller.abort()
      }
    }
  }

  private async run(key: string, scope: TeamChangeScope, poll: ScopePoll): Promise<void> {
    const { signal } = poll.controller
    const request = (afterVersion: number): AgentTeamChangesRequest => ({ afterVersion, ...(scope === undefined ? {} : { scope }) })
    // No cursor yet means the opening sample still has to be taken. A failed
    // call is reported once per outage and then retried, so a recovered
    // transport resumes every mounted surface without a remount.
    let version = poll.resumeFrom
    let retryDelay = RETRY_BASE_MS
    let reported = false
    while (!signal.aborted) {
      const result = await this.changes(request(version ?? 0), signal)
      if (signal.aborted || this.polls.get(key) !== poll) return
      if (!result.ok) {
        if (!reported) {
          reported = true
          for (const listener of poll.listeners) listener({ type: 'failed', message: result.error.message })
        }
        await sleep(retryDelay, signal)
        retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS)
        continue
      }
      retryDelay = RETRY_BASE_MS
      if (reported) {
        // The first answered call after an outage is what recovery looks like
        // from here: the Host's parked wait answers on its own deadline even
        // when nothing committed, and while the transport was gone each
        // surface's own reads failed too. An unchanged cursor is still news to
        // them, so the recovery re-anchors every listener once instead of
        // waiting for the next unrelated commit.
        reported = false
        version = result.value.version
        this.observed.set(key, version)
        for (const listener of poll.listeners) listener({ type: 'changed', version })
        continue
      }
      if (version === undefined) {
        // Nothing has been observed for this scope yet, so there is no cursor to
        // resume from: sample the current version silently, because the
        // subscribers just fetched their initial projection and an immediate wake
        // would double-fetch. This leaves one named gap — a commit landing between
        // that initial fetch being processed and this sample being answered is
        // missed until the next commit in the scope — which resuming from a known
        // version closes for every later subscription.
        version = result.value.version
        this.observed.set(key, version)
        continue
      }
      this.observed.set(key, result.value.version)
      // Any difference is a resolution in this scope's own cursor domain —
      // normally growth, but a cursor left over from another domain (the two
      // scopes count different things) or from an earlier Host lifetime can sit
      // ahead of the domain value. Re-anchoring on difference instead of only
      // on growth keeps such a subscription observable rather than silently
      // parked. The Host answers an equal cursor only on its keep-alive
      // deadline, so this stays one comparison per answered call, never a spin.
      if (result.value.version !== version) {
        version = result.value.version
        for (const listener of poll.listeners) listener({ type: 'changed', version })
      }
    }
  }
}

/**
 * The Host's `changes` stream never wakes on a Thread read — a read advances
 * only the reader's private watermark, so no shared projection changes. A
 * durable read does consume the reader's own mention markers, so the Human's
 * badge and Inbox page refresh from the completed read itself instead of
 * waiting for the next unrelated commit.
 */
export class TeamReadStream {
  private version = 0
  private readonly listeners = new Set<() => void>()

  bump(): void {
    this.version += 1
    for (const listener of this.listeners) listener()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}
