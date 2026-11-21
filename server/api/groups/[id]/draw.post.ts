// POST /api/groups/:id/draw (x-token): reveals who this person gives a gift to.
// Drawing again shows the same name; the first draw time is kept.
export default defineEventHandler(async (event) => {
  const { group, person } = await requirePerson(event)
  const state = await readPerson(group.id, person.id)
  if (!state.drawnAt) {
    state.drawnAt = new Date().toISOString()
    await writePerson(group.id, person.id, state)
  }
  return { drawnAt: state.drawnAt, receiver: await receiverOf(group, person.id) }
})
