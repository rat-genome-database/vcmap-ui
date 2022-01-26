<template>
  <span data-test="zoom-level-label">{{zoomLevel}}x</span>
  <Slider class="zoom-slider" data-test="zoom-slider" v-model="zoomLevel" :step="1" :min="1" :max="100" @slideend="onZoomSlideEnd" />
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';
import { ref, watch } from 'vue';

const store = useStore(key);

const zoomLevel = ref(1);

watch(() => store.state.selectedBackboneRegion.zoomLevel, (newZoomLevel) => {
  zoomLevel.value = newZoomLevel;
}, { immediate: true });

const onZoomSlideEnd = (event: { value: number; }) => {
  const selectedRegion = store.state.selectedBackboneRegion;
  const newZoomLevel = event.value;

  if (event.value === 1)
  {
    return store.dispatch('setDetailedBasePairRange', { start: selectedRegion.baseSelection.basePairStart, stop: selectedRegion.baseSelection.basePairStop });
  }
  
  let zoomedStart = selectedRegion.baseSelection.basePairStart;
  let zoomedStop = selectedRegion.baseSelection.basePairStop;
  let currentLength = zoomedStop - zoomedStart;
  if (selectedRegion.innerSelection)
  {
    zoomedStart = selectedRegion.innerSelection.basePairStart;
    zoomedStop = selectedRegion.innerSelection.basePairStop;
    currentLength = zoomedStop - zoomedStart;
  }

  const newRegionLength = (zoomedStop - zoomedStart) * (selectedRegion.zoomLevel / newZoomLevel);
  const lengthDiff = currentLength - newRegionLength;

  if (lengthDiff > 0)
  {
    // Zooming in
    zoomedStart = zoomedStart + (lengthDiff / 2);
    zoomedStop = zoomedStop - (lengthDiff / 2);
  }
  else if (lengthDiff < 0)
  {
    // Zooming out
    zoomedStart = zoomedStart + (lengthDiff / 2);
    zoomedStop = zoomedStop - (lengthDiff / 2);

    if (zoomedStart < selectedRegion.baseSelection.basePairStart)
    {
      zoomedStart = selectedRegion.baseSelection.basePairStart;
      // Apply the rest of the region length to the end along with a sanity check to make sure the stop doesn't extend past the base selection
      zoomedStop = (zoomedStart - lengthDiff > selectedRegion.baseSelection.basePairStop) ? selectedRegion.baseSelection.basePairStop : zoomedStart - lengthDiff;
    }
    else if (zoomedStop > selectedRegion.baseSelection.basePairStop)
    {
      zoomedStop = selectedRegion.baseSelection.basePairStop;
      // Apply the rest of the region length to the start along with a sanity check to make the start doesn't extend above the base selection
      zoomedStart = (zoomedStop + lengthDiff < selectedRegion.baseSelection.basePairStart) ? selectedRegion.baseSelection.basePairStart : zoomedStop + lengthDiff;
    }
  }

  store.dispatch('setDetailedBasePairRange', { start: zoomedStart, stop: zoomedStop });
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

.zoom-slider
{
  margin-top: 1rem;
}
</style>