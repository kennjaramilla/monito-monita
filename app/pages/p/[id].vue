<script setup lang="ts">
useHead({ title: 'Your draw · Monito Monita' })
const route = useRoute()
const { secret, ready } = useHashSecret()
</script>

<template>
  <PersonDraw v-if="secret" :group-id="String(route.params.id)" :token="secret" />
  <div v-else-if="ready" class="card text-center">
    <p class="font-display text-xl font-semibold">This link is missing a part.</p>
    <p class="mt-2 text-stone-600">Copy the whole link the organizer sent you, including the part after the #.</p>
  </div>
</template>
