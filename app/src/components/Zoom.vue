<template>
  <span data-test="zoom-level-label">{{zoomLevel}}x</span>
  <Slider :disabled="isZoomDisabled || store.state.isDetailedPanelUpdating" class="zoom-slider" data-test="zoom-slider" v-model="zoomLevel" :step="1" :min="1" :max="100" @change="onZoomChange" />
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';
import { computed, ref, watch } from 'vue';

const ZOOM_DEBOUNCE_MILLIS = 500;
const store = useStore(key);

const zoomLevel = ref(1);
let zoomProcessTimeoutId: number | undefined;

watch(() => store.state.selectedBackboneRegion.zoomLevel, (newZoomLevel) => {
  zoomLevel.value = newZoomLevel;
}, { immediate: true });

const isZoomDisabled = computed(() => {
  return store.state.selectedBackboneRegion.innerSelection == null;
});

const onZoomChange = (zoomLevel: number) => {
  // Sort of manual debounce here... the change event fires frequently as someone drags the slider
  // so we need to only processing the zoom when the user has stopped moving the slider for a certain
  // period of time
  if (zoomProcessTimeoutId != undefined)
  {
    clearTimeout(zoomProcessTimeoutId);
  }

  zoomProcessTimeoutId = setTimeout(() => {
    zoom(zoomLevel);
  }, ZOOM_DEBOUNCE_MILLIS);
};

const zoom = (zoomLevel: number) => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (zoomLevel === 1)
  {
    store.dispatch('setDetailedBasePairRange', { start: selectedRegion.baseSelection.basePairStart, stop: selectedRegion.baseSelection.basePairStop });
  }
  else
  {
    let zoomedStart = selectedRegion.baseSelection.basePairStart;
    let zoomedStop = selectedRegion.baseSelection.basePairStop;
    let currentLength = zoomedStop - zoomedStart;
    if (selectedRegion.innerSelection)
    {
      zoomedStart = selectedRegion.innerSelection.basePairStart;
      zoomedStop = selectedRegion.innerSelection.basePairStop;
      currentLength = zoomedStop - zoomedStart;
    }

    const newRegionLength = (zoomedStop - zoomedStart) * (selectedRegion.zoomLevel / zoomLevel);
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
        zoomedStop = (zoomedStart - lengthDiff > selectedRegion.baseSelection.basePairStop) ? selectedRegion.baseSelection.basePairStop : zoomedStart + newRegionLength;
      }
      else if (zoomedStop > selectedRegion.baseSelection.basePairStop)
      {
        zoomedStop = selectedRegion.baseSelection.basePairStop;
        // Apply the rest of the region length to the start along with a sanity check to make the start doesn't extend above the base selection
        zoomedStart = (zoomedStop + lengthDiff < selectedRegion.baseSelection.basePairStart) ? selectedRegion.baseSelection.basePairStart : zoomedStop - newRegionLength;
      }
    }

    store.dispatch('setDetailedBasePairRange', { start: zoomedStart, stop: zoomedStop });
  }
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