<template>
  <!-- <Button 
    data-test="decrease-zoom-btn"
    v-tooltip.left="'Zoom Out'" 
    icon="pi pi-minus" 
    class="p-button-info p-button-sm zoom-btn" 
    :disabled="isZoomOutDisabled || isDisabled"
    @click="decreaseZoom"/> -->
    <span>{{store.getters.getSelectedBackboneRegion?.zoomLevel}}x</span>
  <!-- <Button 
    data-test="increase-zoom-btn"
    v-tooltip.right="'Zoom In'" 
    icon="pi pi-plus" 
    class="p-button-info p-button-sm zoom-btn" 
    :disabled="isDisabled"
    @click="increaseZoom"/> -->
    <Button
    data-test="reset-zoom"
    v-tooltip.right="'Reset to 1x zoom'" 
    icon="pi pi-refresh" 
    class="p-button-warning p-button-sm zoom-btn reset-zoom-btn"
    @click="resetZoom" />
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
//@ts-nocheckimport { computed } from 'vue';
import BackboneSelection from '@/models/BackboneSelection';

const store = useStore();

// interface Props 
// {
//   min?: number;
// }

// const props = defineProps<Props>();

// const isDisabled = computed(() => {
//   return 'disabled';
//   //return (store.getters.getDetailedBasePairRange.stop - store.getters.getDetailedBasePairRange.start <= 0) ? 'disabled' : undefined;
// });

// const isZoomOutDisabled = computed(() => {
//   const selectedRegion = store.getters.getSelectedBackboneRegion as BackboneSelection;
//   return (selectedRegion.zoomLevel <= 1) ? 'disabled' : undefined;
// });

const resetZoom = () => {
  const selectedRegion = store.getters.getSelectedBackboneRegion as BackboneSelection;
  store.dispatch('setDetailedBasePairRange', { start: selectedRegion.baseSelection.basePairStart, stop: selectedRegion.baseSelection.basePairStop });
};

// const decreaseZoom = () => {
//   let newZoomLevel = 1;
//   if (store.getters.getZoom <= 1)
//   {
//     newZoomLevel = store.getters.getZoom / 2;
//   }
//   else
//   {
//     newZoomLevel = store.getters.getZoom - 1;
//   }

//   if (props.min != null && newZoomLevel < props.min)
//   {
//     return;
//   }

//   store.dispatch('setZoom', newZoomLevel);
// };

// const increaseZoom = () => {
//   let newZoomLevel = 1;
//   if (store.getters.getZoom <= 1)
//   {
//     newZoomLevel = store.getters.getZoom * 2;
//   }
//   else
//   {
//     newZoomLevel = store.getters.getZoom + 1;
//   }

//   store.dispatch('setZoom', newZoomLevel);
// };
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