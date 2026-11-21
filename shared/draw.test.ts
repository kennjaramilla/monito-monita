import { describe, expect, it } from 'vitest'
import { drawPairs } from './draw'

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`)

describe('drawPairs', () => {
  it('never gives anyone their own name', () => {
    for (let n = 2; n <= 12; n++) {
      for (let run = 0; run < 300; run++) {
        const pairs = drawPairs(people(n))
        for (const [giver, receiver] of Object.entries(pairs)) expect(receiver).not.toBe(giver)
      }
    }
  })

  it('uses every name exactly once', () => {
    const ids = people(15)
    const pairs = drawPairs(ids)
    expect(Object.keys(pairs).sort()).toEqual([...ids].sort())
    expect(Object.values(pairs).sort()).toEqual([...ids].sort())
  })

  it('pairs two people with each other', () => {
    expect(drawPairs(['a', 'b'])).toEqual({ a: 'b', b: 'a' })
  })

  it('spreads results around instead of always picking the same match', () => {
    const counts: Record<string, number> = {}
    for (let run = 0; run < 3000; run++) {
      const r = drawPairs(['a', 'b', 'c', 'd']).a!
      counts[r] = (counts[r] ?? 0) + 1
    }
    // a can get b, c or d, each about a third of the time.
    for (const k of ['b', 'c', 'd']) expect(counts[k]!).toBeGreaterThan(800)
  })

  it('rejects groups that are too small or have duplicate ids', () => {
    expect(() => drawPairs(['a'])).toThrow()
    expect(() => drawPairs(['a', 'a', 'b'])).toThrow()
  })
})
