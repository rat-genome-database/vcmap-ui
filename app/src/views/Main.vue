<template>
  <Overview />
  <SVGViewBox />
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import SVGViewBox from '@/components/SVGViewBox.vue';
import Overview from '@/components/Overview.vue';

export default defineComponent({
  components: {
    SVGViewBox,
    Overview
  },

  setup() {
    onMounted(() => {
      console.log('Main view mounted');
    });
  },
});
</script>