import { describe, expect, it } from 'vitest'
import { ScopeCoverage } from '../src/client/scope-coverage.ts'

describe('ScopeCoverage', () => {
  it('keeps one scope version from swallowing another scope wake', () => {
    const coverage = new ScopeCoverage()
    // A presence epoch climbs on every Agent transition, so it usually sits far
    // above the ledger sequence a workspace commit carries.
    expect(coverage.wake('presence', 40)).toBe(true)
    coverage.beginRound()
    expect(coverage.finishRound()).toBe(false)
    expect(coverage.wake('workspace', 33)).toBe(true)
  })

  it('answers a repeated version for one scope as already covered', () => {
    const coverage = new ScopeCoverage()
    expect(coverage.wake('workspace', 33)).toBe(true)
    coverage.beginRound()
    coverage.finishRound()
    expect(coverage.wake('workspace', 33)).toBe(false)
    expect(coverage.wake('workspace', 34)).toBe(true)
  })

  it('joins the first version each scope delivers while a round fetches', () => {
    const coverage = new ScopeCoverage()
    expect(coverage.wake('workspace', 33)).toBe(true)
    coverage.beginRound()
    // The same Host event reaches the presence scope: it joins the round that
    // is already fetching the roster and view instead of earning a second read.
    expect(coverage.wake('presence', 40)).toBe(false)
    expect(coverage.finishRound()).toBe(false)
    expect(coverage.wake('presence', 40)).toBe(false)
    expect(coverage.wake('workspace', 33)).toBe(false)
    // The ledger moved, and this scope's own watermark is what decides it.
    expect(coverage.wake('workspace', 34)).toBe(true)
  })

  it('owes a trailing round for a version newer than the one the round answered', () => {
    const coverage = new ScopeCoverage()
    expect(coverage.wake('workspace', 33)).toBe(true)
    coverage.beginRound()
    expect(coverage.wake('workspace', 34)).toBe(false)
    expect(coverage.finishRound()).toBe(true)
    coverage.beginRound()
    expect(coverage.finishRound()).toBe(false)
    expect(coverage.wake('workspace', 34)).toBe(false)
  })

  it('absorbs a wake that arrives while a round with no opening wake fetches', () => {
    const coverage = new ScopeCoverage()
    // An explicit refresh — a committed mutation of this page's own — opens the
    // round, and the wake that same commit produced must not refetch it.
    coverage.beginRound()
    expect(coverage.wake('workspace', 33)).toBe(false)
    expect(coverage.finishRound()).toBe(false)
    expect(coverage.wake('workspace', 33)).toBe(false)
    expect(coverage.wake('workspace', 34)).toBe(true)
  })

  it('drops every observation when a new owner resets it', () => {
    const coverage = new ScopeCoverage()
    coverage.wake('workspace', 33)
    coverage.beginRound()
    coverage.reset()
    expect(coverage.wake('workspace', 33)).toBe(true)
    expect(coverage.finishRound()).toBe(false)
  })
})
