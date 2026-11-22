<script setup lang="ts">
import type { AdminResponse } from '#shared/group'

useHead({ title: 'Organizer · Monito Monita' })
const route = useRoute()
const groupId = String(route.params.id)
const { secret: adminKey, ready } = useHashSecret()

const data = ref<AdminResponse | null>(null)
const error = ref('')
const copied = ref('')
const showWishlists = ref(false)
const isNew = route.query.new === '1'

async function load() {
  error.value = ''
  try {
    data.value = await $fetch<AdminResponse>(`/api/groups/${groupId}/admin`, { headers: { 'x-admin-key': adminKey.value } })
    saveDraw({ id: groupId, key: adminKey.value, title: data.value.group.title, createdAt: new Date().toISOString() })
  } catch (e) {
    error.value = errorMessage(e)
  }
}
watch(adminKey, (k) => k && load())

const drawnCount = computed(() => data.value?.people.filter((p) => p.drawn).length ?? 0)
const wishlistCount = computed(() => data.value?.people.filter((p) => p.wishlist).length ?? 0)
const organizerLink = computed(() => (import.meta.client ? `${location.origin}/o/${groupId}#${adminKey.value}` : ''))

function flash(id: string) {
  copied.value = id
  setTimeout(() => copied.value === id && (copied.value = ''), 1800)
}

async function copy(text: string, id: string) {
  try {
    await navigator.clipboard.writeText(text)
    flash(id)
  } catch {
    prompt('Copy this link:', text)
  }
}

function message(name: string, url: string) {
  const g = data.value!.group
  return `Hi ${name}! Bunutan na for ${g.title} 🎁 Open your private link to see who you'll give a gift to (budget ${peso(g.budget)}, exchange on ${longDate(g.date)}):\n${url}`
}

// Phones open the share sheet (Messenger, Viber, etc.); desktops copy the message.
async function share(p: AdminResponse['people'][number]) {
  const text = message(p.name, personLink(groupId, p.token))
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  await copy(text, p.id)
}
</script>

<template>
  <div v-if="ready && !adminKey" class="card text-center">
    <p class="font-display text-xl font-semibold">This organizer link is missing a part.</p>
    <p class="mt-2 text-stone-600">Open the full link, including the part after the #.</p>
  </div>

  <div v-else-if="error" class="card text-center">
    <p class="font-display text-xl font-semibold">We couldn't open this draw.</p>
    <p class="mt-2 text-stone-600">{{ error }}.</p>
    <button type="button" class="btn-ghost mt-4" @click="load">Try again</button>
  </div>

  <div v-else-if="!data" class="card animate-pulse text-center text-stone-500">Loading…</div>

  <div v-else class="space-y-5">
    <section class="text-center">
      <h1 class="font-display text-4xl font-bold text-stone-900">{{ data.group.title }}</h1>
      <p class="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{{ describeGroup(data.group) }}</p>
    </section>

    <section class="card border-2 border-dashed border-amber-300 bg-amber-50" :class="{ 'ring-4 ring-amber-200': isNew }">
      <h2 class="font-display text-lg font-semibold">{{ isNew ? 'Your draw is ready! Save this link first' : 'Your organizer link' }}</h2>
      <p class="mt-1 text-sm text-stone-600">
        Only you should have this link. It's how you come back to this page. It's also saved on this phone.
      </p>
      <button type="button" class="btn-ghost mt-3 w-full text-base" @click="copy(organizerLink, 'organizer')">
        {{ copied === 'organizer' ? 'Copied ✓' : 'Copy organizer link' }}
      </button>
    </section>

    <section class="card">
      <div class="flex items-baseline justify-between">
        <h2 class="font-display text-xl font-semibold">Send each person their link</h2>
        <span class="text-sm font-bold text-stone-500">{{ drawnCount }}/{{ data.people.length }} drawn</span>
      </div>
      <p class="mt-1 text-sm text-stone-600">Each link is private. It only shows that person who they drew.</p>
      <ul class="mt-3 divide-y divide-stone-100">
        <li v-for="p in data.people" :key="p.id" class="flex items-center gap-3 py-3">
          <div class="min-w-0 flex-1">
            <p class="truncate font-bold">{{ p.name }}</p>
            <p class="text-sm" :class="p.drawn ? 'text-green-700' : 'text-stone-500'">
              {{ p.drawn ? 'Drawn ✓' : 'Not drawn yet' }}<span v-if="p.wishlist"> · has a wishlist</span>
            </p>
          </div>
          <button type="button" class="btn-primary shrink-0 px-4 py-2 text-base" @click="share(p)">
            {{ copied === p.id ? 'Copied ✓' : 'Send link' }}
          </button>
        </li>
      </ul>
      <button type="button" class="mt-2 text-sm font-bold text-brand hover:underline" @click="load">Refresh</button>
    </section>

    <section class="card">
      <div class="flex items-baseline justify-between">
        <h2 class="font-display text-xl font-semibold">Wishlists</h2>
        <span class="text-sm font-bold text-stone-500">{{ wishlistCount }}/{{ data.people.length }} added</span>
      </div>
      <p class="mt-1 text-sm text-stone-600">Hidden so nobody sees them over your shoulder.</p>
      <button type="button" class="btn-ghost mt-3 w-full text-base" @click="showWishlists = !showWishlists">
        {{ showWishlists ? 'Hide wishlists' : 'Show wishlists' }}
      </button>
      <ul v-if="showWishlists" class="mt-3 divide-y divide-stone-100">
        <li v-for="p in data.people" :key="p.id" class="py-3">
          <p class="font-bold">{{ p.name }}</p>
          <p v-if="p.wishlist" class="mt-1 whitespace-pre-line text-stone-700">{{ p.wishlist }}</p>
          <p v-else class="mt-1 text-sm text-stone-500">No wishlist yet</p>
        </li>
      </ul>
    </section>

    <section class="card text-center">
      <h2 class="font-display text-xl font-semibold">All together right now?</h2>
      <p class="mt-1 text-stone-600">Pass this phone around and let everyone draw here instead.</p>
      <NuxtLink :to="`/o/${groupId}/play#${adminKey}`" class="btn-ghost mt-3 w-full">Pass the phone</NuxtLink>
    </section>

    <p class="px-2 text-center text-xs text-stone-500">
      You can't see who drew whom, and neither can anyone else. Please don't open other people's links: each page shows when that person first drew, so a peek gets noticed.
    </p>
  </div>
</template>
