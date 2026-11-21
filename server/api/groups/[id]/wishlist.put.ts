import { MAX_WISHLIST } from '#shared/group'

// PUT /api/groups/:id/wishlist (x-token): saves this person's wishlist.
export default defineEventHandler(async (event) => {
  const { group, person } = await requirePerson(event)
  const body = (await readBody(event)) as { wishlist?: unknown } | null
  const wishlist = typeof body?.wishlist === 'string' ? body.wishlist.trim() : ''
  if (wishlist.length > MAX_WISHLIST) {
    throw createError({ statusCode: 400, statusMessage: `Keep it under ${MAX_WISHLIST} characters.` })
  }
  const state = await readPerson(group.id, person.id)
  await writePerson(group.id, person.id, { ...state, wishlist })
  return { wishlist }
})
