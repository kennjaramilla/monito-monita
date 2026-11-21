<script setup lang="ts">
import { MAX_WISHLIST, type MeResponse } from '#shared/group'

const props = defineProps<{ groupId: string; token: string }>()

const data = ref<MeResponse | null>(null)
const loadError = ref('')
const wishlist = ref('')
const savedWishlist = ref('')
const savingWish = ref(false)
const wishNote = ref('')
const phase = ref<'ready' | 'rolling' | 'revealed'>('ready')
const rollingName = ref('')
const drawError = ref('')
const editingWish = ref(false)

const headers = computed(() => ({ 'x-token': props.token }))
const api = (path: string) => `/api/groups/${props.groupId}/${path}`

async function load() {
  try {
    data.value = await $fetch<MeResponse>(api('me'), { headers: headers.value })
    wishlist.value = savedWishlist.value = data.value.me.wishlist
    phase.value = data.value.receiver ? 'revealed' : 'ready'
  } catch (e) {
    loadError.value = errorMessage(e)
  }
}
onMounted(load)

async function saveWishlist() {
  if (wishlist.value.trim() === savedWishlist.value) return
  savingWish.value = true
  wishNote.value = ''
  try {
    const res = await $fetch<{ wishlist: string }>(api('wishlist'), { method: 'PUT', headers: headers.value, body: { wishlist: wishlist.value } })
    savedWishlist.value = wishlist.value = res.wishlist
    wishNote.value = 'Saved ✓'
    editingWish.value = false
  } catch (e) {
    wishNote.value = errorMessage(e)
  } finally {
    savingWish.value = false
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function draw() {
  if (!data.value) return
  drawError.value = ''
  await saveWishlist()
  phase.value = 'rolling'
  const request = $fetch<{ drawnAt: string; receiver: { name: string; wishlist: string } }>(api('draw'), { method: 'POST', headers: headers.value })

  // Spin through the other names, slowing down, while the real draw loads.
  const others = data.value.names.filter((n) => n !== data.value!.me.name)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduced) {
    for (let i = 0, delay = 60; delay < 320; i++, delay *= 1.12) {
      rollingName.value = others[i % others.length]!
      await sleep(delay)
    }
  }
  try {
    const res = await request
    data.value.receiver = res.receiver
    data.value.me.drawnAt = res.drawnAt
    phase.value = 'revealed'
  } catch (e) {
    drawError.value = errorMessage(e)
    phase.value = 'ready'
  }
}

const drawnAt = computed(() =>
  data.value?.me.drawnAt
    ? new Date(data.value.me.drawnAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '',
)

const confetti = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 7) * 0.12}s`,
  duration: `${2.2 + (i % 5) * 0.35}s`,
  color: ['#b91c1c', '#f59e0b', '#16a34a', '#2563eb', '#db2777'][i % 5],
}))
</script>

<template>
  <div>
    <div v-if="loadError" class="card text-center">
      <p class="font-display text-xl font-semibold">Hmm, this link doesn't work.</p>
      <p class="mt-2 text-stone-600">{{ loadError }}. Ask the organizer to send your link again.</p>
    </div>

    <div v-else-if="!data" class="card animate-pulse text-center text-stone-500">Loading your draw…</div>

    <div v-else class="space-y-4">
      <section class="text-center">
        <p class="font-semibold text-stone-500">{{ data.group.title }}</p>
        <h1 class="mt-1 font-display text-4xl font-bold text-stone-900">Hi, {{ data.me.name }}!</h1>
        <p class="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
          {{ describeGroup(data.group) }}
        </p>
      </section>

      <!-- Before the draw -->
      <section v-if="phase === 'ready'" class="card space-y-4">
        <div>
          <label class="label" for="wish">Your wishlist <span class="font-normal text-stone-500">(optional)</span></label>
          <textarea
            id="wish"
            v-model="wishlist"
            class="field min-h-24"
            :maxlength="MAX_WISHLIST"
            placeholder="e.g. a mug, a good book, anything blue"
          />
          <p class="mt-1 text-sm text-stone-500">Whoever draws your name will see this. You can change it later.</p>
        </div>
        <p v-if="drawError" role="alert" class="rounded-xl bg-red-50 px-4 py-3 font-semibold text-brand">{{ drawError }}</p>
        <button type="button" class="btn-primary w-full py-4 text-xl" @click="draw">Bumunot! Draw a name</button>
      </section>

      <!-- Spinning -->
      <section v-else-if="phase === 'rolling'" class="card py-12 text-center" aria-live="polite">
        <p class="text-sm font-bold uppercase tracking-widest text-stone-400">Drawing…</p>
        <p class="mt-3 font-display text-5xl font-bold text-stone-300">{{ rollingName || '…' }}</p>
      </section>

      <!-- Result -->
      <template v-else-if="data.receiver">
        <section class="card relative overflow-hidden py-8 text-center" aria-live="polite">
          <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
            <span
              v-for="(c, i) in confetti"
              :key="i"
              class="absolute top-0 h-3 w-2 rounded-sm"
              :style="{ left: c.left, background: c.color, animation: `fall ${c.duration} ${c.delay} ease-in forwards` }"
            />
          </div>
          <p class="font-semibold text-stone-500">You'll give a gift to</p>
          <p class="animate-pop mt-2 font-display text-5xl font-bold text-brand">{{ data.receiver.name }}</p>
          <p class="mt-4 text-sm text-stone-500">Shh, keep it a secret until {{ longDate(data.group.date) }}!</p>
        </section>

        <section class="card">
          <h2 class="font-display text-lg font-semibold">{{ data.receiver.name }}'s wishlist</h2>
          <p v-if="data.receiver.wishlist" class="mt-2 whitespace-pre-line text-stone-700">{{ data.receiver.wishlist }}</p>
          <p v-else class="mt-2 text-stone-500">No wishlist yet. Open this link again later to check.</p>
        </section>

        <section class="card">
          <div class="flex items-center justify-between">
            <h2 class="font-display text-lg font-semibold">Your wishlist</h2>
            <button v-if="!editingWish" type="button" class="font-bold text-brand hover:underline" @click="editingWish = true">
              {{ savedWishlist ? 'Edit' : 'Add' }}
            </button>
          </div>
          <template v-if="editingWish">
            <textarea v-model="wishlist" class="field mt-2 min-h-24" :maxlength="MAX_WISHLIST" placeholder="e.g. a mug, a good book, anything blue" />
            <div class="mt-2 flex gap-2">
              <button type="button" class="btn-primary px-4 py-2 text-base" :disabled="savingWish" @click="saveWishlist">Save</button>
              <button type="button" class="btn-ghost px-4 py-2 text-base" @click="editingWish = false; wishlist = savedWishlist">Cancel</button>
            </div>
          </template>
          <p v-else-if="savedWishlist" class="mt-2 whitespace-pre-line text-stone-700">{{ savedWishlist }}</p>
          <p v-else class="mt-2 text-stone-500">Add a few ideas to help whoever drew your name.</p>
          <p v-if="wishNote" class="mt-2 text-sm font-semibold text-stone-600">{{ wishNote }}</p>
        </section>

        <p class="text-center text-xs text-stone-400">Drawn on {{ drawnAt }}. If that wasn't you, tell the organizer.</p>
        <slot name="after" :receiver="data.receiver" />
      </template>
    </div>
  </div>
</template>
