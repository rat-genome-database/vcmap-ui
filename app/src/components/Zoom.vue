<template>
    <span>{{store.state.selectedBackboneRegion?.zoomLevel}}x</span>
    <Button
    data-test="reset-zoom"
    v-tooltip.right="'Reset to 1x zoom'" 
    icon="pi pi-refresh" 
    class="p-button-warning p-button-sm zoom-btn reset-zoom-btn"
    @click="resetZoom" />
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);

const resetZoom = () => {
  const selectedRegion = store.state.selectedBackboneRegion;
  store.dispatch('setDetailedBasePairRange', { start: selectedRegion.baseSelection.basePairStart, stop: selectedRegion.baseSelection.basePairStop });
};
</script>

<style lang="scss" scoped>
.p-button.p-button-sm.zoom-btn
{
  padding: 0.1rem;
  width: 1.5rem;
}

.reset-zoom-btn
{
  margin-left: 1rem;
}
</style>