import type { AgentTeamMemberId } from './types/entities.ts'

/**
 * One addressable name in a Message body: the Member's stable id plus the
 * handle authors are expected to write. The Human is included through the
 * same shape so a body-level mention needs no special case at the call site.
 */
export interface AgentTeamBodyMentionCandidate {
  readonly memberId: AgentTeamMemberId
  readonly handle: string
}

/** Outcome of scanning one Message body for authored mentions. */
export interface AgentTeamBodyMentionResolution {
  /** Candidate Member ids named in the body, in candidate order; never the caller's own id. */
  readonly memberIds: readonly AgentTeamMemberId[]
  /** The body carried an `@all` marker, so the caller decides how wide that reaches. */
  readonly all: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Character ranges the scanner must not read as mentions: fenced code blocks
 * and inline code spans. Authors quote handles there to talk *about* a name
 * rather than call it, and resolving those would notify the wrong Member.
 * The alternation tries the fenced form first so a block is never mistaken for
 * a run of inline spans.
 */
function codeRanges(body: string): readonly (readonly [number, number])[] {
  const ranges: [number, number][] = []
  for (const match of body.matchAll(/```[\s\S]*?```|`[^`\n]*`/g)) {
    const start = match.index ?? 0
    ranges.push([start, start + match[0].length])
  }
  return ranges
}

const ALL_MARKER = /(?<![\p{L}\p{N}_@])@all(?=$|[^\p{L}\p{N}_])/iu

/**
 * Resolve the `@Handle` mentions authored in one Message body. Matching is
 * deliberately the same shape the Client renders with — case-insensitive, on
 * Unicode word boundaries, longest handle first — so a name that renders as a
 * chip is the same name that delivers a notification.
 *
 * Callers pass the candidates reachable in the Message's Channel, so a name
 * that resolves here is already an addressable target; handles the Channel
 * cannot reach simply stay prose. Writing `@` is required: bare handles are
 * ordinary words, and treating them as mentions would notify on every
 * incidental name-drop.
 *
 * `sender` is excluded because a Message never mentions its own author, which
 * also keeps the result usable as a recipient set without further filtering.
 */
export function resolveBodyMentions(
  body: string,
  candidates: readonly AgentTeamBodyMentionCandidate[],
  sender: AgentTeamMemberId,
): AgentTeamBodyMentionResolution {
  const usable = candidates.filter(candidate => candidate.memberId !== sender && candidate.handle.trim() !== '')
  const excluded = codeRanges(body)
  const inCode = (index: number): boolean => excluded.some(([start, end]) => index >= start && index < end)
  const allMarker = ALL_MARKER.exec(body)
  const all = allMarker !== null && !inCode(allMarker.index)
  if (usable.length === 0) return { memberIds: Object.freeze([]), all }
  // Longest first so `@Reeves` never resolves as `@Reeve` plus a stray letter.
  const ordered = [...usable].sort((left, right) => right.handle.length - left.handle.length)
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}_@])@(?:${ordered.map(candidate => escapeRegExp(candidate.handle)).join('|')})(?=$|[^\\p{L}\\p{N}_])`,
    'giu',
  )
  const matched = new Set<AgentTeamMemberId>()
  for (const match of body.matchAll(pattern)) {
    if (inCode(match.index ?? 0)) continue
    const written = match[0].slice(1).toLowerCase()
    const hit = ordered.find(candidate => candidate.handle.toLowerCase() === written)
    if (hit !== undefined) matched.add(hit.memberId)
  }
  return { memberIds: Object.freeze(usable.filter(candidate => matched.has(candidate.memberId)).map(candidate => candidate.memberId)), all }
}
