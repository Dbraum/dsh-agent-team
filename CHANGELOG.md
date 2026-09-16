# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning. Team bundle versions evolve independently of DeepSeek Harness versions; DeepSeek Harness compatibility is expressed through `peerDependencies` and [`docs/dsh-release-compatibility.md`](docs/dsh-release-compatibility.md).

## [Unreleased]

- A one-digit hairline count capsule is the same 18px square the filled one is. The hairline tone draws a 1px border, and with the padding still at 5px that border pushed the border box past the shared `min-width` floor: a one-digit hairline measured 18.125px wide against the filled capsule's 18, and a two-digit one ran 2px wider than the capsule beside it — two tones of one component disagreeing about their own geometry, which the shared rule's comment had claimed they could not. The border is now paid out of the capsule's own padding (4px + 1px is the solid tone's 5px), so both tones keep one border box and one content box at every count, and the browser journey reads the used box and the padding-plus-border inset off the assembled bundle instead of trusting the declaration.

- Inbox rows answer 「谁在这条 Thread 上」 the way a Channel's Thread entry already does. A row whose Thread carries a Task with live Claims now leads with that Task's Claim owners — the same stack, the same rule, and the same words the Channel feed uses — and only a Thread with no live owner falls back to the actor behind its newest fact, which is what it did on every row before. Both sections draw the same cluster for the same Thread, because which one it is belongs to the Thread rather than to the slice it is sitting in. The leading cluster now takes the width it actually draws — one face on most rows, a stack on the few that carry one — so the column the identity, the gist, and the section headings read down is the one-face column (34px) and a row that really holds a stack opens 12px further right per extra face, instead of every row reserving the widest stack and paying 36px of empty space in front of its identity for faces it does not have. The Inbox projection carries the owners the row draws (`claimOwners`), resolved to handles by the Host, because a row still has no Member roster of its own.

- The narrow rail's Inbox icon wears the current-page fill, instead of only carrying the attribute. The fill rule keyed off a `data-active` attribute nothing has ever set, so on a phone with the rail collapsed the reader had no visible marker for the page they were reading; the icon now reads the same `aria-current="page"` the wide card reads and wears the card's own fill — the rail has no label, so that fill is the only thing that can say where the reader is.

- A Member circle's separation ring no longer reads as a halo of empty space. The 2px ring is what separates overlapping circles — and what lifts the sidebar's unread dot off the icon it sits on — so it has to be the colour of the surface underneath: the queue's rows hand it their hovered and focused fill, and the sidebar card and the rail button their hovered, focused, and current-page fill, where a ring fixed to the page background showed as blank space around every face and dot on a filled surface.

- The sidebar no longer marks two rows as the current page while an Agent's embedded Session covers the Inbox. Opening an Agent from the Inbox embeds that Session over the page instead of replacing it, and the Inbox entry kept the fill and the marker a current row wears while the Agent card wore them too — the sidebar pointed at two places with one seat on screen. The Agent card is now the only marked row, and the Inbox, which stays the remembered face underneath, takes its marker back when the Session view closes.

- The sidebar's Inbox entry marks unread with a dot on the icon's corner instead of a number beside it. What the sidebar gets scanned for is whether anything is waiting; the quantity moves on every fact and is what a reader asks for on purpose, so it moved into the control's own accessible name (`收件箱，6 条未读`) and the narrow rail's hover hint rather than sitting in the corner of the eye. Nothing is hidden from assistive tech by the change, and the dot wears the solid ink the queue gives a Thread that named this reader — one colour still means "this needs you" wherever it appears.

- Every Inbox row now opens with the person it is about. The Host resolves the actor behind the row's own instant (`newestActor` on the Inbox projection) and the row leads with their Member circle — the identity language the Channel feed's Thread entry row already speaks — so the leading column answers who moved this Thread before it answers anything else, and no row opens on blank space reserved for a count it does not hold. The count capsule moves to the end of the identity line, one line-gap left of the instant: what is still waiting now closes the line instead of starting it, and the mention-versus-movement split keeps riding the capsule's ink and its label. **Recently active** shows the newest five Threads instead of ten, so the tail stays a way back into work rather than a second queue to work through.

- The Inbox's queue rows are laid out around one content column, and their two lines swapped emphasis. A row is now a grid whose first track is the count's gutter: the capsule hangs in the margin and the identity, the gist under it, and the section heading above them all open on the same column, where before a row had two left edges and its heading a third. The identity line leads — `#channel` in primary ink, `Task #N` as the same hairline chip, the instant right-aligned — and the Thread's opening line drops to secondary ink beneath it as evidence for that identity rather than as the row's subject, so ten rows scan as ten entries instead of ten paragraphs. A row names its Workspace only while the rows on screen span more than one: with a single Workspace in the list the name was a constant printed down every row, and it returns by itself the moment a second Workspace reaches the list. Each section heading now carries its slice's count, and a squeezed seat shortens the provenance with an ellipsis instead of folding one row into three lines. Today's time is a bare `HH:mm` — no 「今天」 printed down every row — in the Inbox and on a Thread entry's follow-up line alike; 「昨天 HH:mm」 still names the first day that is not today.

- Every count the Human reads — the sidebar's Inbox entry, a Channel's Thread entries, and the Inbox queue rows — is one capsule built from one set of declarations instead of three hand-written copies of them, so the feed's digit no longer sits on a different line box from the sidebar's and the surfaces cannot drift apart again. A row in **Recently active** keeps the count's column rather than sliding left, so a Thread that moves between the Inbox's two slices reads down one column.

- The Human 「提到我 / Mentions of me」 queue is now the Inbox: it gathers everything unread that needs you — an Agent's ordinary progress on a Thread you started or replied to, changes to your Tasks and Claims, and mentions — instead of mentions alone. Every row now opens with how much is waiting there, in one capsule that keeps a single geometry and changes only its ink: the filled badge the sidebar and Channel entries already use when the Thread names you, a hairline when it merely moved — so a queue mixing named and ambient unread reads at a glance, and a Thread never shifts its row when it is named again. The mention count inside that number reaches screen readers and hover through the row's own label instead of a second visible chip, and the sidebar number counts the whole unread slice rather than mentions only. A squeezed conversation seat no longer crushes a row to a couple of characters: the provenance shortens with an ellipsis and the time keeps the identity's own line.

- The Inbox keeps a second slice under the unread queue: **Recently active** lists the Threads you have written a Message in — a Thread you replied to counts whether or not you follow it, and so does one you started that nobody has answered yet — newest activity first, never one the queue above already carries. Participation, not Attention, is what admits it, because a reply does not implicitly follow a Thread: reading Attention here hid every Thread a reader had taken part in without following it. A row there holds nothing unread, so it renders as the Thread alone with no count capsule, and the header totals keep counting the queue. An Agent's own Inbox is unchanged: it receives the unread queue only, however much that Agent took part in.

- The Inbox header states its totals as segments rather than a sentence — Threads, unread, mentions — with the unread total in the heavier ink and the mention segment dropped while the queue holds no mention, so the reader scans numbers instead of parsing a clause that also explained its own sort order.

- A Channel's Thread entry is now one quiet line under the message, read left to right in the order the questions come: who is on the work (the avatars of the Task's live Claim owners), where it stands (the status dot and word), how much of it needs you, and what the entry is with the time it last moved. It opens at the same left edge as the message above it rather than trailing a line at the far right, so nothing has to be read sideways — including when a member posts several messages in a row, where the later entries have no identity line of their own to sit on. The entry's message count is gone: what a reader acts on there is unread, not how much text exists.

- A Thread entry counts what needs the reader it belongs to, using the Host's own three-class unread — activity on Threads you follow, mentions of you, and changes to your Tasks and Claims. The count clears when you open the Thread and read it, reads `99+` past ninety-nine, and reaches screen readers through the entry's own label rather than the visual capsule alone.

- Fixed a Channel refresh leaving a row's live state behind: the freshest window is now authoritative for every message it covers, so a Task's status and a Thread's newest activity move as soon as the new fact arrives instead of waiting for the row to leave the window.

- Mentions are authored in the Message body: writing `@Handle` — or `@all` for the whole Channel — is what notifies a Member, from the Web composer and from `team_message` alike, and the separate recipient parameter is gone. Naming someone a Thread has never carried no longer fails the write: the Message commits, nothing reaches them, and the result reports them as undelivered. A Human mention that needs an invitation still asks for confirmation first. The composer's "will notify" line reports those body-authored names too, so a handle typed by hand reads the same as one picked from the menu.

- The Channel member dialog, the Channel editor's member section, the sidebar Agent list, and the footer Member roster now draw people the same way: one shared row with the presence-bearing avatar, the handle over its description, and a single membership action.

- A joined Member who is temporarily unavailable can still be removed from a Channel; only joining needs an active Member.

- The team-member persona is rewritten as flowing markdown: audience-and-channel routing, message shape, etiquette, and context discipline in one quality-first voice within the 10,000-character budget.

- Decision requests no longer follow a fixed `Decision needed: X (default: Y)` template: a message that owes a decision says plainly what needs deciding and what happens by default if nobody answers.

- The progress-nudge system is removed: no more 20/40/60-call Thread progress reminders and no more 5-call Claim suggestions. Session logs recorded before the removal still fold correctly.

- A dropped Host connection no longer leaves its message in the wrong place: a Channel that never loaded centers its error and its retry the way the loading and empty states it replaces do, and a sidebar section reports on the rail's own 11px scale, inset to the row labels instead of hanging off the panel edge.

- A failed load no longer reads as an empty workspace: "no channels yet" and "no agents yet" now require a projection that actually came back empty.

- Sidebar sections recover on their own once the connection returns: the change stream holds its poll through an outage, reports it once, retries with backoff, and wakes every mounted surface on recovery instead of staying silent until you switch pages.

## [0.1.11] - 2026-09-14

- The Human Team gains a `Mentions of me` Inbox that gathers unread mentions from every Workspace into one list.

- A member whose stored Session cannot be read can be repaired by restarting it, and an unavailable member reports why.

- Thread messages are conclusion-first, mentioning the Human only when you must know or decide.

- Opening a Thread, waking a long-lived member and startup are faster, and stored data is smaller.

- Team interface details are aligned with DeepSeek Harness's own conventions.

- Fixed surfaces not showing a change that landed while you were away.

- Fixed `team_view` reporting a wrong revision for a Task whose Thread is outside the page.

- The `@deepseek-ai/dsh-*` peers declare exactly the certified DSH line, `>=0.1.5-rc.1 <0.1.6`; a newer `0.1.x` reports a peer conflict.

## [0.1.10] - 2026-09-11

- The certified baseline moves to DSH `0.1.5-rc.1`, and `0.1.5-rc.2` is certified on the same peers with no manifest change; the peer range is now `>=0.1.5-rc.1 <0.2.0`. Seven upstream source breaks are adapted to, including the agent setup signature, the keyed `main` slot, the Session persistence handle API, and the `dsh-persona` config key rename. Published 0.1.9 cannot install on this line, because `>=0.1.2-rc.1 <0.2.0` admits prereleases only on its own base tuple; DSH `0.1.2-rc.1`–`0.1.4` fall outside the new range, so upgrade `@deepseek-ai/dsh` together with this release.

- Member Sessions record rollover handoffs and checkpoint continuations as named snapshot sections instead of package-specific source kinds, so what this version writes stays readable through a later format migration.

- Member Sessions that the current format migration refuses, or whose retired log is corrupt, no longer block startup or leave a Member `unavailable`: a refused artifact is admitted into the shipped shape with one current-format sibling published beside it, leaving the original byte-identical, while genuine read failures stay fail-closed.

- Fixed Channel archival and Channel member removal on a Channel holding a taskless Thread, which wrote an incomplete inbox cleanup and made the next start fail; records written by 0.1.7–0.1.9 with that legacy cleanup are repaired in memory on load.

- Members gain `web_fetch` through the `team-member` preset, and the `web_search` guidance now recommends fetching a specific result.

- Members now have time awareness: every agent-facing surface carries absolute instants in the fixed Team coordination zone UTC+8 with an explicit offset, and a `member-time-context` clock row gives the first step of an eligible turn one durable snapshot with the current instant, the elapsed time since the preceding model-visible event, and the ordering-authority note.

- The five model-facing Team tools render as one decision interface: `team_view` is an address book, `team_inbox` states unread and direct counts, and `team_thread` renders its five actions separately.

- The write basis is an opaque next-write token rendered only on a fully drained `team_thread read` and on your own committed public mutation; committed results name their action, claim mutations render the affected Claim first, and `team_claim list` shows only active Claims.

- A Member activation failure caused by two physical copies of `@deepseek-ai/dsh-scope` now states its fix instead of the bare `selected preset is not team-enabled`.

## [0.1.9] - 2026-09-07

- Members manage their own context: `context_rollover` ends the current context and continues as the same Member in a new one, `context_checkpoint` records a restorable anchor before a risky operation, and `context_timeline` inspects the context lineage (checkpoint, first-arrival, and Task claim boundaries labeled by their semantics) and picks an anchor to return to.
- Member context no longer needs watching: near the budget a Member receives one notice suggesting `context_rollover`; at the hard limit the Host compacts before the next request, so a task is not interrupted by context exhaustion.
- Context switches survive restarts and crashes: pending switches replay safely and a crash rebuilds the handoff from the last recorded state.
- `team_view` now lists top-level Threads (with revision and message count), so Members can discover discussions they were not mentioned in.
- Windows support: attachment file names and member memory directories are sanitized per Windows rules (illegal characters, reserved device names, trailing dots and spaces), legacy memory directories migrate automatically, and legacy colon-spelled memory directories merge into the canonical path on activation, with conflicting content archived under a `.colon-twin` suffix.
- Team tool results carry more complete decision information: thread/inbox lines show channel, status, unread/direct counts, and revision; Claims show status, owner, and direction.
- Fixed an intermittent session-retirement race during member activation that could fail startup.
- Fixed the underlying session not rebinding after leaving an embedded member view, which could cross replies.
- Fixed early-accept notifications carrying an empty finished-claim clause.
- Fixed a poisoned rollover pending that could not recover; recovery now retries and prevalidates the checkpointRef.
- The manual "start from a fresh context" action is removed; Member context management is fully delegated to Members and the Host pressure policy.
- CI gains Linux and Windows (Git Bash) lanes, and build/dev scripts are adapted for Windows environments.

## [0.1.8] - 2026-09-05

- Members that run 20 tool calls (then 40, 60…) without posting to a Thread receive a reminder in the current turn, listing the Tasks they hold a Claim on and the Threads they follow, asking for a brief note on what is confirmed, what remains, and any blocker. A reminder the member has not read yet is revoked once the member commits a message.
- A member following a still-`todo` Task it has never claimed receives one `team_claim` reminder after 5 tool calls (once per Thread per Session), suggesting it state its direction in the Thread first. Both reminders are advisory, write nothing to the ledger, and never wake an idle member.
- Team tools and the Web Client accept abbreviated refs: `task:0f0ad7` and any 6+ unambiguous hex prefix resolve to the matching Task / Thread / Member / Channel / Claim. Ambiguous prefixes are rejected with the candidate full refs, prefixes shorter than 6 hex characters are not accepted, and a Task ref renders as a link only after the Host confirms it — unresolved text stays plain.
- On Thread surfaces the mention candidate list ranks the current Thread's followers above the remaining roster, because mentioning a follower delivers directly while a non-follower needs the Human's two-step invitation.
- Member sessions now use the same shipped composer as ordinary sessions: the Team's own hint strip and its `/compact` and `@member` entry points are removed. Member context still compacts automatically past the threshold, and members still get the pre-compaction hint to persist key conclusions first.
- Member guidance separates the two channels: Team messages go to the ledger (visible to the team, revisitable), while a session reply goes straight to the Human who reads the output. It also states that a member's private memory/notes/skills are readable only by that member — restate the content inside the message instead of pointing at a note path.
- Task chips, thread pills, and member avatars share one status-dot component, so the same state renders at the same size and color everywhere.
- The mention candidate list keeps the keyboard selection inside the visible area when the roster needs scrolling.
- The new-update jump hint at the bottom of a Thread disappears once the reader scrolls to the newest message.

## [0.1.7] - 2026-09-04

- Fixes startup failure with current DSH. 0.1.6 combined with the current `@deepseek-ai/dsh` (latest is now 0.1.2-rc.1) installs cleanly — via npm directly or via `dsh plugin add` — but the host then fails to start, because the old peer range still resolves to the 0.1.1-rc.2 generation while DSH itself runs rc.1. This release fixes the combination and moves the certified baseline to DSH `0.1.2-rc.1`. Breaking for older DSH: this is a hard cut — the bundle no longer runs on 0.1.1-rc.2; users still on rc.2 must upgrade `@deepseek-ai/dsh` together with this release.
- Four previously missing peer declarations added (`dsh-api-session-controller`, `dsh-api-workspace-controller`, `dsh-client-ui-renderer`, `dsh-skill`). Two of them appear in the published type declarations, so consumers depending on Team types were relying on `@deepseek-ai/dsh` to pull them in transitively; they are now declared explicitly.
- Member sessions now use the full shipped composer. The restricted Team-only input box is gone: `/` and `@` menus, attachments, and the model picker come from the standard DSH input bar, with a slim Team hint strip above it (vocabulary hint + member turn errors, one quiet line on every viewport).
- Typing `/compact` as a full line now works in member sessions — it routes to the Team compact transaction whether picked from the menu or typed outright; `@member` still inserts structured references.
- Members and Channels can be archived — a reversible third state between suspend and remove. Archiving disposes the live session (member) while keeping private memory and logs on disk, releases the Member's active Claims with public activities, and hides archived entities from every Team surface; direct reads of archived threads return an explicit archived error.
- Member departure cleanup fixed: a departing member's Attention and markers now clear on every thread it followed, taskless ones included (was taskful only).
- README gains a Core-ideas section and a star nudge; docs updated to match the new member-session input surface and the rc.1 baseline.

## [0.1.6] - 2026-09-02

- Member runtime phase one: durable per-member capabilities schema, per-member tool policy, and member-private skills through per-member providers.
- Members can own their private space: the bundled member-skill-manager meta skill guides creating, installing, and maintaining private skills beside member roots.
- Member-to-member direct messages ship with focused context, recipient-handle error reporting, and correct reader-perspective context direction.
- Threads read their updates automatically without manual controls, and the client drops channel-level member editing in favor of the member-focused flow.
- The README now acknowledges Raft as the design inspiration for the collaboration shape.

## [0.1.5] - 2026-08-31

- Member sessions can start from a new context in place: renewing a session keeps the Agent identity, and error members get the same fresh-start path.
- Branded thread references navigate like Task references, and Human mentions render correctly in rich Markdown bodies.
- The team composer accepts pasted files as attachments, expands `@all` to all eligible members, and the member composer accepts mention candidates with Tab.
- Sidebar section collapse state persists per browser, and unclaimed `todo` Tasks can be accepted directly by the Human.
- Before automatic compaction, Members receive one advisory hint to persist their own key conclusions; writing remains the Agent's own call.
- Docs are now bilingual (English default path plus `.zh.md`), the Chinese README carries the full badge row, and builds allow esbuild scripts under pnpm 11.

## [0.1.4] - 2026-08-30

- Thread-first collaboration: start ordinary Threads without a Task, then promote a Thread to a Task when work is ready; structured promotion activity and optional Task overlays keep both paths durable.
- Add long-message expansion and clearer Thread/Channel conversation layouts, including stable reference chips and persisted workspace navigation.
- Add a Human restart action for unavailable Agent members and report the resulting runtime status in the Agent row.
- Keep composer task-mode state visible, preserve Thread header controls after replies, and improve Task reference and mention rendering.
- Refresh the bilingual README previews with current Team mode and Task Thread screenshots; archive completed diagnostics and maintenance records.

## [0.1.3] - 2026-08-29

- Member sessions now support direct Human editing and messaging, including session controls and a dedicated embedded composer.
- Accepted Tasks coordinate bounded automatic Member compaction when scoped token usage exceeds the threshold, without adding compaction facts to the Team ledger.
- Member recovery stops after three consecutive errors, and compaction state heals across preset reloads.
- Harden attachment payload sanitization, normalize legacy Team timestamps, and simplify Host and Client dispatch/rendering paths.
- Add stable Task reference formatting and inline mention rendering, plus the Awesome DSH Plugin listing badge in both README languages.
- Build cleanup, duplication checks, shipping specs, and browser test surfaces now better match the published bundle layout.

## [0.1.2] - 2026-08-27

- Human Thread replies now accept local file attachments; attachment chips, reference rendering, and draft previews are unified across message paths.
- Task references in Human and Agent prose resolve to Task numbers and navigate across Channels; Agent Markdown renders those references inline.
- Human members can accept a Task early while its open Claims finish their work.
- Channels and Agent members can be reordered per browser, with the chosen order restored after reload.
- Preserve member Sessions and pinned reasoning effort through model updates; fixes cover empty optional Team fields and cold-start records.
- Refresh the README Team mode capture to show the current collaboration UI.

## [0.1.1] - 2026-08-26

- Composer attachments: upload local files with cached bytes and thumbnail display, a larger zoom preview, and `team_message` delivery through the host attachment cache.
- Member recovery: resume or restart error-stopped members from the row menu, with automatic scheduled recovery that stands down after repeated failures.
- Restart member sessions in place, with distinct resume/restart row menu icons.
- Pin per-member reasoning effort together with the model selection.
- Simplified Agent and Channel creation: descriptions and initial Channels are optional, and both forms share the unified multi-select picker.
- Time dividers between wide same-sender message runs, and Team mode restores your last location after reload.
- Visual fixes: composer attach button alignment, suppressed stacked row fills while an Agent card menu is open, theme tokens limited to those the DSH theme defines, and a leveled divider hairline.

## [0.1.0] - 2026-08-24

First published release of the bundle.

- Durable single-host Agent Team: Workspaces, Channels, Messages, Tasks, Threads, Claims, and managed Agent membership, backed by an append-only operation ledger.
- Web Client for Human control: Team mode entry, refresh recovery, and exit; Channel and Agent management; Thread attention; Task review.
- Isolated `team-member` preset with five model-facing tools: `team_inbox`, `team_thread`, `team_message`, `team_claim`, and `team_view`.
- Pull-based collaboration protocol: Agent Inbox admission is durable and does not claim that the model has processed an update.
- Team ledger storage routed to SQLite via the public composition patch; other domains keep the JSON default route.
- Certified against DeepSeek Harness `0.1.1-rc.2`.
