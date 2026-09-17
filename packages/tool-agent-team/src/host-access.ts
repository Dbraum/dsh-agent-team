/**
 * Shared Host accessors for every Team tool module. `agent.ctx.get` is the
 * one resolution path a tool row has — the preset mounts these tools beside
 * the Host, so a missing service or an inactive Member is a model-visible
 * rejection rather than a silent no-op. Both messages are user-facing text.
 */

import AgentTeam from '@wowyuarm/dsh-agent-team/host'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'

/** The Agent shape every Team tool receives. */
export type TeamToolAgent = NonNullable<Parameters<AgentTeam['memberForAgent']>[0]>

/** Resolve the Team Host service, or reject the tool call. */
export function service(agent: TeamToolAgent): AgentTeam {
  const host = agent.ctx.get('agentTeam') as AgentTeam | undefined
  if (host === undefined) throw new Error('Agent Team Host is unavailable')
  return host
}

/** Resolve the calling Team Member, or reject the tool call. */
export function member(agent: TeamToolAgent) {
  const current = service(agent).memberForAgent(agent)
  if (current === undefined) throw new Error('team tool requires an active Team Member')
  return current
}

/**
 * Shared optional Workspace selector for every Team tool: the absolute path
 * or id of a Workspace the Member participates in. Omitted targets the
 * Member's default Workspace — where its Session and cwd live.
 */
export const workspaceParam = {
  type: 'string' as const,
  description: 'Target Workspace — the id exactly as team_view lists it under `workspaces`. Omit to use your default Workspace (where your Session and cwd live). Required when you participate in more than one Workspace.',
}

/** Resolve the optional `workspace` argument; participation itself is enforced Host-side for every op. */
export function workspaceOf(args: { workspace?: string | undefined }, current: { workspaceId: WorkspaceId }): WorkspaceId {
  return (args.workspace === undefined ? current.workspaceId : args.workspace) as WorkspaceId
}
