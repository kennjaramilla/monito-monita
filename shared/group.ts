export const MIN_PEOPLE = 3
export const MAX_PEOPLE = 50
export const MAX_NAME = 40
export const MAX_TITLE = 60
export const MAX_WISHLIST = 500
export const DEFAULT_BUDGET = 300

export interface NewGroup {
  title: string
  budget: number
  date: string
  names: string[]
}

export interface GroupInfo {
  title: string
  budget: number
  /** YYYY-MM-DD */
  date: string
}

export interface PersonView {
  name: string
  wishlist: string
  drawnAt: string | null
}

export interface MeResponse {
  group: GroupInfo
  names: string[]
  me: PersonView
  receiver: { name: string; wishlist: string } | null
}

export interface AdminResponse {
  id: string
  group: GroupInfo
  people: { id: string; name: string; token: string; drawn: boolean; hasWishlist: boolean }[]
}

export interface CreateResponse {
  id: string
  adminKey: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Returns the cleaned group or a message saying what's wrong. */
export function validateGroup(input: unknown): { ok: true; value: NewGroup } | { ok: false; error: string } {
  const body = (input ?? {}) as Record<string, unknown>
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return { ok: false, error: 'Give your group a name.' }
  if (title.length > MAX_TITLE) return { ok: false, error: `Keep the group name under ${MAX_TITLE} characters.` }

  if (!Array.isArray(body.names)) return { ok: false, error: 'Add the names.' }
  const names = body.names
    .map((n) => (typeof n === 'string' ? n.trim().replace(/\s+/g, ' ') : ''))
    .filter(Boolean)
  if (names.length < MIN_PEOPLE) return { ok: false, error: `Add at least ${MIN_PEOPLE} names.` }
  if (names.length > MAX_PEOPLE) return { ok: false, error: `Up to ${MAX_PEOPLE} names only.` }
  if (names.some((n) => n.length > MAX_NAME)) return { ok: false, error: `Keep each name under ${MAX_NAME} characters.` }
  const seen = new Set<string>()
  for (const n of names) {
    const key = n.toLowerCase()
    if (seen.has(key)) return { ok: false, error: `"${n}" is listed twice. Add a last name or initial.` }
    seen.add(key)
  }

  const budget = Number(body.budget)
  if (!Number.isInteger(budget) || budget < 0 || budget > 1_000_000) return { ok: false, error: 'Enter a budget in whole pesos.' }

  const date = typeof body.date === 'string' ? body.date : ''
  if (!DATE.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: 'Pick the exchange date.' }

  return { ok: true, value: { title, budget, date, names } }
}

/** Next January 1st, since monito monita here wraps up at New Year. */
export function nextNewYear(now = new Date()) {
  return `${now.getFullYear() + 1}-01-01`
}
