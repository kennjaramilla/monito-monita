<script setup lang="ts">
import { DEFAULT_BUDGET, MAX_PEOPLE, MIN_PEOPLE, nextNewYear, validateGroup, type CreateResponse } from '#shared/group'

const title = ref('')
const budget = ref(DEFAULT_BUDGET)
const date = ref(nextNewYear())
const names = ref<string[]>(['', '', ''])
const error = ref('')
const saving = ref(false)
const inputs = ref<HTMLInputElement[]>([])
const recent = ref<ReturnType<typeof savedDraws>>([])

onMounted(() => {
  recent.value = savedDraws()
})

const filled = computed(() => names.value.filter((n) => n.trim()).length)

async function addName(after = names.value.length - 1) {
  if (names.value.length >= MAX_PEOPLE) return
  names.value.splice(after + 1, 0, '')
  await nextTick()
  inputs.value[after + 1]?.focus()
}

function removeName(i: number) {
  if (names.value.length > MIN_PEOPLE) names.value.splice(i, 1)
  else names.value[i] = ''
}

// Pasting a list (one name per line) fills several rows at once.
function onPaste(i: number, e: ClipboardEvent) {
  const lines = (e.clipboardData?.getData('text') ?? '').split(/[\n,]/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return
  e.preventDefault()
  names.value.splice(i, 1, ...lines)
  names.value = names.value.slice(0, MAX_PEOPLE)
}

async function create() {
  error.value = ''
  const body = { title: title.value, budget: budget.value, date: date.value, names: names.value }
  const check = validateGroup(body)
  if (!check.ok) {
    error.value = check.error
    return
  }
  saving.value = true
  try {
    const res = await $fetch<CreateResponse>('/api/groups', { method: 'POST', body: check.value })
    saveDraw({ id: res.id, key: res.adminKey, title: check.value.title, createdAt: new Date().toISOString() })
    await navigateTo(`/o/${res.id}?new=1#${res.adminKey}`)
  } catch (e) {
    error.value = errorMessage(e)
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="text-center">
      <h1 class="font-display text-4xl font-bold leading-tight text-stone-900 sm:text-5xl">
        Bunutan na! 🎁
      </h1>
      <p class="mx-auto mt-3 max-w-md text-lg text-stone-600">
        Add everyone's names. Each person draws who they'll give a gift to, in secret. Free, no sign-up.
      </p>
    </section>

    <form class="card space-y-5" novalidate @submit.prevent="create">
      <div>
        <label class="label" for="title">Group name</label>
        <input id="title" v-model="title" class="field" placeholder="e.g. Barkada 2027" maxlength="60" autocomplete="off" />
      </div>

      <div>
        <div class="mb-1.5 flex items-baseline justify-between">
          <span class="label mb-0">Names</span>
          <span class="text-sm text-stone-500">{{ filled }} added</span>
        </div>
        <ol class="space-y-2">
          <li v-for="(_, i) in names" :key="i" class="flex items-center gap-2">
            <span class="w-6 shrink-0 text-right text-sm font-bold text-stone-400">{{ i + 1 }}</span>
            <input
              ref="inputs"
              v-model="names[i]"
              class="field"
              :placeholder="['Ana', 'Ben', 'Carlo'][i] ?? 'Name'"
              :aria-label="`Name ${i + 1}`"
              maxlength="40"
              autocomplete="off"
              enterkeyhint="next"
              @keydown.enter.prevent="addName(i)"
              @paste="onPaste(i, $event)"
            />
            <button
              type="button"
              class="h-10 w-10 shrink-0 rounded-xl text-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              :aria-label="`Remove name ${i + 1}`"
              @click="removeName(i)"
            >
              ×
            </button>
          </li>
        </ol>
        <button type="button" class="mt-3 font-bold text-brand hover:underline" @click="addName()">+ Add another name</button>
        <p class="mt-1 text-sm text-stone-500">Tip: paste a list, one name per line.</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="budget">Budget</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500">₱</span>
            <input id="budget" v-model.number="budget" class="field pl-8" type="number" inputmode="numeric" min="0" step="50" />
          </div>
        </div>
        <div>
          <label class="label" for="date">Exchange date</label>
          <input id="date" v-model="date" class="field" type="date" />
        </div>
      </div>

      <p v-if="error" role="alert" class="rounded-xl bg-red-50 px-4 py-3 font-semibold text-brand">{{ error }}</p>

      <button type="submit" class="btn-primary w-full" :disabled="saving">
        {{ saving ? 'Creating…' : 'Create the draw' }}
      </button>
    </form>

    <ol class="grid gap-3 text-center text-sm text-stone-600 sm:grid-cols-3">
      <li class="rounded-2xl bg-white/60 p-3"><b class="block font-display text-base text-stone-800">1. Add names</b>Everyone joining the exchange.</li>
      <li class="rounded-2xl bg-white/60 p-3"><b class="block font-display text-base text-stone-800">2. Send links</b>Each person gets a private link, or pass one phone around.</li>
      <li class="rounded-2xl bg-white/60 p-3"><b class="block font-display text-base text-stone-800">3. Draw</b>No one gets their own name, and no name is picked twice.</li>
    </ol>

    <section v-if="recent.length" class="card">
      <h2 class="font-display text-lg font-semibold">Your draws on this phone</h2>
      <ul class="mt-2 divide-y divide-stone-100">
        <li v-for="d in recent" :key="d.id">
          <NuxtLink :to="`/o/${d.id}#${d.key}`" class="flex items-center justify-between py-2.5 font-semibold hover:text-brand">
            {{ d.title }}
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
