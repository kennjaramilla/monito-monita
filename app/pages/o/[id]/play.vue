<script setup lang="ts">
import type { AdminResponse } from '#shared/group'

useHead({ title: 'Pass the phone · Monito Monita' })
const route = useRoute()
const groupId = String(route.params.id)
const { secret: adminKey, ready } = useHashSecret()

type Person = AdminResponse['people'][number]
const data = ref<AdminResponse | null>(null)
const error = ref('')
const picked = ref<Person | null>(null)
const step = ref<'pick' | 'confirm' | 'draw'>('pick')

async function load() {
  try {
    data.value = await $fetch<AdminResponse>(`/api/groups/${groupId}/admin`, { headers: { 'x-admin-key': adminKey.value } })
  } catch (e) {
    error.value = errorMessage(e)
  }
}
watch(adminKey, (k) => k && load())

const left = computed(() => data.value?.people.filter((p) => !p.drawn).length ?? 0)

function choose(p: Person) {
  picked.value = p
  step.value = 'confirm'
}

function done() {
  if (picked.value) picked.value.drawn = true
  picked.value = null
  step.value = 'pick'
  scrollTo({ top: 0 })
}
</script>

<template>
  <div v-if="ready && !adminKey" class="card text-center">This link is missing a part. Open it from the organizer page.</div>
  <div v-else-if="error" class="card text-center">{{ error }}.</div>
  <div v-else-if="!data" class="card animate-pulse text-center text-stone-500">Loading…</div>

  <div v-else-if="step === 'pick'" class="space-y-5">
    <section class="text-center">
      <p class="font-semibold text-stone-500">{{ data.group.title }}</p>
      <h1 class="mt-1 font-display text-4xl font-bold text-stone-900">Pass the phone</h1>
      <p class="mt-2 text-stone-600">
        <template v-if="left">Tap your name to draw. {{ left }} {{ left === 1 ? 'person' : 'people' }} left.</template>
        <template v-else>Everyone has drawn! See you on {{ longDate(data.group.date) }} 🎉</template>
      </p>
    </section>
    <ul class="grid grid-cols-2 gap-3">
      <li v-for="p in data.people" :key="p.id">
        <button
          type="button"
          class="w-full rounded-2xl border-2 px-3 py-4 font-display text-lg font-semibold transition"
          :class="p.drawn ? 'border-stone-200 bg-stone-100 text-stone-400' : 'border-red-200 bg-white text-stone-800 hover:border-brand'"
          :disabled="p.drawn"
          @click="choose(p)"
        >
          {{ p.name }}<span v-if="p.drawn" class="block text-sm font-normal">drew already ✓</span>
        </button>
      </li>
    </ul>
    <NuxtLink :to="`/o/${groupId}#${adminKey}`" class="block text-center font-bold text-brand hover:underline">← Back to organizer page</NuxtLink>
  </div>

  <div v-else-if="step === 'confirm' && picked" class="card space-y-4 py-10 text-center">
    <p class="text-stone-600">Hand the phone to</p>
    <p class="font-display text-5xl font-bold text-brand">{{ picked.name }}</p>
    <p class="text-stone-600">Everyone else, look away! 🙈</p>
    <button type="button" class="btn-primary w-full" @click="step = 'draw'">I'm {{ picked.name }}</button>
    <button type="button" class="btn-ghost w-full" @click="step = 'pick'">Not me, go back</button>
  </div>

  <div v-else-if="picked">
    <PersonDraw :group-id="groupId" :token="picked.token">
      <template #after>
        <section class="card text-center">
          <h2 class="font-display text-lg font-semibold">Keep this on your own phone</h2>
          <p class="mt-1 text-sm text-stone-600">Scan to see your result again and check their wishlist later.</p>
          <LinkQr :url="personLink(groupId, picked.token)" class="mt-3" />
        </section>
        <button type="button" class="btn-primary w-full py-4" @click="done">Hide &amp; pass the phone</button>
      </template>
    </PersonDraw>
  </div>
</template>
