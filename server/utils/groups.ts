import { createHash, createHmac, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { drawPairs } from '#shared/draw'
import type { GroupInfo, NewGroup } from '#shared/group'

interface StoredPerson {
  id: string
  name: string
  tokenHash: string
}

interface StoredGroup extends GroupInfo {
  id: string
  createdAt: string
  adminKeyHash: string
  people: StoredPerson[]
  /** giver id → receiver id, fixed when the group is created */
  pairs: Record<string, string>
}

export interface PersonState {
  wishlist: string
  drawnAt: string | null
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const randomId = (bytes: number) => randomBytes(bytes).toString('base64url')
const groupKey = (id: string) => `groups/${id}/group.json`
const personKey = (groupId: string, personId: string) => `groups/${groupId}/people/${personId}.json`

// Person links are derived from the admin key, so the organizer page can show
// them again later without the server storing any link in plain text.
export const personToken = (adminKey: string, groupId: string, personId: string) =>
  createHmac('sha256', adminKey).update(`${groupId}:${personId}`).digest('base64url').slice(0, 22)

export async function createGroup(input: NewGroup) {
  const id = randomId(9)
  const adminKey = randomId(24)
  const people = input.names.map((name, i) => {
    const personId = `p${i + 1}`
    return { id: personId, name, tokenHash: sha256(personToken(adminKey, id, personId)) }
  })
  const group: StoredGroup = {
    id,
    title: input.title,
    budget: input.budget,
    date: input.date,
    createdAt: new Date().toISOString(),
    adminKeyHash: sha256(adminKey),
    people,
    pairs: drawPairs(people.map((p) => p.id)),
  }
  await writeJson(groupKey(id), group)
  return { id, adminKey }
}

const ID = /^[\w-]{6,32}$/

export async function loadGroup(event: H3Event) {
  const id = getRouterParam(event, 'id') ?? ''
  const group = ID.test(id) ? await readJson<StoredGroup>(groupKey(id)) : null
  if (!group) throw createError({ statusCode: 404, statusMessage: 'Draw not found' })
  return group
}

export async function requireAdmin(event: H3Event) {
  const group = await loadGroup(event)
  const key = getHeader(event, 'x-admin-key') ?? ''
  if (!key || sha256(key) !== group.adminKeyHash) {
    throw createError({ statusCode: 403, statusMessage: 'This organizer link is not valid' })
  }
  return { group, adminKey: key }
}

export async function requirePerson(event: H3Event) {
  const group = await loadGroup(event)
  const token = getHeader(event, 'x-token') ?? ''
  const hash = sha256(token)
  const person = token ? group.people.find((p) => p.tokenHash === hash) : undefined
  if (!person) throw createError({ statusCode: 403, statusMessage: 'This link is not valid' })
  return { group, person }
}

export const info = (g: StoredGroup): GroupInfo => ({ title: g.title, budget: g.budget, date: g.date })

export async function readPerson(groupId: string, personId: string): Promise<PersonState> {
  return (await readJson<PersonState>(personKey(groupId, personId))) ?? { wishlist: '', drawnAt: null }
}

export const writePerson = (groupId: string, personId: string, state: PersonState) =>
  writeJson(personKey(groupId, personId), state)

/** The person this one gives a gift to, with their wishlist. */
export async function receiverOf(group: StoredGroup, personId: string) {
  const receiverId = group.pairs[personId]!
  const receiver = group.people.find((p) => p.id === receiverId)!
  const state = await readPerson(group.id, receiverId)
  return { name: receiver.name, wishlist: state.wishlist }
}
