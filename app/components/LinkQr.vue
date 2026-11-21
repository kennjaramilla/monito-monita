<script setup lang="ts">
import QRCode from 'qrcode'

const props = defineProps<{ url: string }>()
const svg = ref('')
watchEffect(async () => {
  svg.value = await QRCode.toString(props.url, { type: 'svg', margin: 1, width: 180 })
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- SVG generated locally from our own URL -->
  <div class="mx-auto w-44" v-html="svg" />
</template>
