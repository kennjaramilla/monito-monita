import { validateGroup, type CreateResponse } from '#shared/group'

// POST /api/groups: creates the draw. Everyone is paired right away; the
// pairs are only revealed one person at a time.
export default defineEventHandler(async (event): Promise<CreateResponse> => {
  const result = validateGroup(await readBody(event))
  if (!result.ok) throw createError({ statusCode: 400, statusMessage: result.error })
  return createGroup(result.value)
})
