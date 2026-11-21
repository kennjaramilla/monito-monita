import { describe, expect, it } from 'vitest'
import { nextNewYear, validateGroup } from './group'

const good = { title: ' Barkada 2027 ', budget: 300, date: '2027-01-01', names: ['Ana', ' Ben  Cruz ', 'Carlo', ''] }

describe('validateGroup', () => {
  it('trims names and drops blanks', () => {
    const r = validateGroup(good)
    expect(r).toEqual({ ok: true, value: { title: 'Barkada 2027', budget: 300, date: '2027-01-01', names: ['Ana', 'Ben Cruz', 'Carlo'] } })
  })

  it('needs at least three people', () => {
    expect(validateGroup({ ...good, names: ['Ana', 'Ben'] }).ok).toBe(false)
  })

  it('catches the same name twice, ignoring case', () => {
    const r = validateGroup({ ...good, names: ['Ana', 'ana', 'Ben'] })
    expect(r).toMatchObject({ ok: false })
  })

  it('wants a whole peso budget and a real date', () => {
    expect(validateGroup({ ...good, budget: 99.5 }).ok).toBe(false)
    expect(validateGroup({ ...good, budget: -1 }).ok).toBe(false)
    expect(validateGroup({ ...good, date: 'soon' }).ok).toBe(false)
  })
})

describe('nextNewYear', () => {
  it('is January 1st of next year', () => {
    expect(nextNewYear(new Date('2026-11-21'))).toBe('2027-01-01')
    expect(nextNewYear(new Date('2026-01-01'))).toBe('2027-01-01')
  })
})
