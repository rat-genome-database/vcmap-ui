<template>
  <div v-if="showTooltip" class="hovered-data-tooltip">
    <span v-for="(dataString, index) in store.state.hoveredData.data" :key="index">{{ dataString }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);

const showTooltip = computed(() => {
  return store.state.hoveredData?.data != null && store.state.hoveredData.data.length > 0;
});

const tooltipTop = computed(() => {
  return `${store.state.hoveredData.y - 50}px`;
});

const tooltipLeft = computed(() => {
  return `${store.state.hoveredData.x - 275}px`;
});
</script>

<style lang="scss">
.hovered-data-tooltip {
  background-color: #2f87c7; // blue from RGD logo
  color: white;
  font-weight: 525;
  position: absolute;
  opacity: 85%;
  border-radius: 3px;
  font-size: 14px;
  top: v-bind(tooltipTop);
  padding: 0.5rem;
  left: v-bind(tooltipLeft);
  min-width: 200px;
  max-width: 250px;

  span {
    display: block;
  }
}

</style>