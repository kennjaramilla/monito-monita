import type { GroupInfo } from '#shared/group'

/** The secret after the # in the URL. Browsers never send it to the server. */
export function useHashSecret() {
  const secret = ref('')
  const ready = ref(false)
  onMounted(() => {
    secret.value = decodeURIComponent(location.hash.slice(1))
    ready.value = true
  })
  return { secret, ready }
}

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`

export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })

export const describeGroup = (g: GroupInfo) => `Budget ${peso(g.budget)} · Exchange on ${longDate(g.date)}`

export const errorMessage = (e: unknown) => {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
  return err?.data?.statusMessage ?? err?.statusMessage ?? 'Something went wrong. Please try again.'
}

export const personLink = (groupId: string, token: string) => `${location.origin}/p/${groupId}#${token}`

interface SavedDraw {
  id: string
  key: string
  title: string
  createdAt: string
}

const SAVED = 'monito:draws'

/** Organizer links saved on this device, so a lost link can be found again. */
export function savedDraws(): SavedDraw[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED) ?? '[]') as SavedDraw[]
  } catch {
    return []
  }
}

export function saveDraw(draw: SavedDraw) {
  try {
    const rest = savedDraws().filter((d) => d.id !== draw.id)
    localStorage.setItem(SAVED, JSON.stringify([draw, ...rest].slice(0, 10)))
  } catch {}
}
