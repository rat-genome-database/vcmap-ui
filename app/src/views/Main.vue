<template>
  <Overview />
  <SVGViewBox />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import SVGViewBox from '@/components/SVGViewBox.vue';
import Overview from '@/components/Overview.vue';

onMounted(() => {
  console.log('Main view mounted');
});
</script>