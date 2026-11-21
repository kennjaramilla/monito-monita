// Pairs everyone up before anyone draws, so the last person can never be
// stuck with only their own name left in the bowl.

/** Returns a giver → receiver map: everyone gives once, receives once, never to themselves. */
export function drawPairs(ids: string[], random: () => number = Math.random): Record<string, string> {
  if (ids.length < 2) throw new Error('need at least 2 people')
  if (new Set(ids).size !== ids.length) throw new Error('ids must be unique')

  // Shuffle until nobody lands on themselves. Expected ~2.7 tries for any group size.
  let order = [...ids]
  do {
    order = shuffle(order, random)
  } while (order.some((id, i) => id === ids[i]))

  return Object.fromEntries(ids.map((id, i) => [id, order[i]!]))
}

function shuffle<T>(items: T[], random: () => number) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}
