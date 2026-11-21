import type { MeResponse } from '#shared/group'

// GET /api/groups/:id/me (x-token): the person's own page. Their match is only
// included once they've drawn.
export default defineEventHandler(async (event): Promise<MeResponse> => {
  const { group, person } = await requirePerson(event)
  const state = await readPerson(group.id, person.id)
  return {
    group: info(group),
    names: group.people.map((p) => p.name),
    me: { name: person.name, wishlist: state.wishlist, drawnAt: state.drawnAt },
    receiver: state.drawnAt ? await receiverOf(group, person.id) : null,
  }
})
