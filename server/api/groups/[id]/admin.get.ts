import type { AdminResponse } from '#shared/group'

// GET /api/groups/:id/admin (x-admin-key): everyone's link and whether they've
// drawn. Never who drew whom.
export default defineEventHandler(async (event): Promise<AdminResponse> => {
  const { group, adminKey } = await requireAdmin(event)
  const people = await Promise.all(
    group.people.map(async (p) => {
      const state = await readPerson(group.id, p.id)
      return {
        id: p.id,
        name: p.name,
        token: personToken(adminKey, group.id, p.id),
        drawn: Boolean(state.drawnAt),
        hasWishlist: Boolean(state.wishlist),
      }
    }),
  )
  return { id: group.id, group: info(group), people }
})
