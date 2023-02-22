<template>
  <span data-test="zoom-level-label">{{zoomLevel}}x</span>
  <Slider :disabled="isZoomDisabled || store.state.isDetailedPanelUpdating" class="zoom-slider" data-test="zoom-slider" v-model="zoomLevel" :step="1" :min="1" :max="100" @change="onZoomChange" />
  <div class="zoom-options-container">
    <div class="zoom-options " v-for="interval in zoomIntervals" :key="interval">
      <Button class="pi pi-angle-double-left zoom-button" @click="zoomOut(interval)"/>
      <p class="interval-label">{{interval}}x</p>
    </div>
    <div class="zoom-options" v-for="interval in zoomIntervals" :key="interval">
      <Button class="pi pi-angle-double-right zoom-button" @click="zoomIn(interval)"/>
      <p class="interval-label">{{interval}}x</p>
    </div>
    <!-- <Button class="pi pi-angle-right" v-for="interval in zoomIntervals" :key="interval"/> -->
  </div>
  

  

</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';
import { computed, ref, watch } from 'vue';

const ZOOM_DEBOUNCE_MILLIS = 500;
const store = useStore(key);

const zoomLevel = ref(1);
let zoomProcessTimeoutId: number | undefined;
const zoomIntervals = [1.5, 3, 10, 25];

watch(() => store.state.isDetailedPanelUpdating, (isUpdating) => {
  if (!isUpdating && store.state.selectedBackboneRegion != null)
  {
    zoomLevel.value = store.state.selectedBackboneRegion.zoomLevel;
    store.dispatch('setZoomLevel', zoomLevel.value);
  }
});

watch(() => store.state.zoomLevel, () => {
  if (zoomLevel.value != store.state.zoomLevel)
  {
    zoomLevel.value = store.state.zoomLevel;
  }
});

const isZoomDisabled = computed(() => {
  return store.state.selectedBackboneRegion && store.state.selectedBackboneRegion.viewportSelection == null;
});

const onZoomChange = (zoomLevel: number) => {
  // Sort of manual debounce here... the change event fires frequently as someone drags the slider
  // so we need to only processing the zoom when the user has stopped moving the slider for a certain
  // period of time
  if (zoomProcessTimeoutId != undefined)
  {
    clearTimeout(zoomProcessTimeoutId);
  }

  if (store.state.isDetailedPanelUpdating)
  {
    return;
  }

  zoomProcessTimeoutId = setTimeout(() => {
    zoom(zoomLevel);
  }, ZOOM_DEBOUNCE_MILLIS);
};

const zoom = (zoomLevel: number) => {
  const selectedRegion = store.state.selectedBackboneRegion;
  const backboneChromosome = store.state.chromosome;

  console.log('SELECTED REGION', selectedRegion);
  console.log('BACKBONE', backboneChromosome);

  if (zoomLevel === 1)
  {
    store.dispatch('setDetailedBasePairRange', { start: 0, stop: backboneChromosome.seqLength });
  }
  else
  {
    let zoomedStart = selectedRegion.viewportSelection.basePairStart;
    let zoomedStop = selectedRegion.viewportSelection.basePairStop;
    let currentLength = zoomedStop - zoomedStart;
    if (selectedRegion.viewportSelection)
    {
      zoomedStart = selectedRegion.viewportSelection.basePairStart;
      zoomedStop = selectedRegion.viewportSelection.basePairStop;
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

      if (zoomedStart < 0)
      {
        zoomedStart = 0;
        // Apply the rest of the region length to the end along with a sanity check to make sure the stop doesn't extend past the base selection
        zoomedStop = (zoomedStart - lengthDiff > backboneChromosome.seqLength) ? backboneChromosome.seqLength : zoomedStart + newRegionLength;
      }
      else if (zoomedStop > backboneChromosome.seqLength)
      {
        zoomedStop = backboneChromosome.seqLength;
        // Apply the rest of the region length to the start along with a sanity check to make the start doesn't extend above the base selection
        zoomedStart = (zoomedStop + lengthDiff < 0) ? 0 : zoomedStop - newRegionLength;
      }
    }

    store.dispatch('setDetailedBasePairRange', { start: zoomedStart, stop: zoomedStop });
  }
};

const zoomOut = (zoomInterval: number) => {
  zoom( zoomLevel.value /zoomInterval);
};
const zoomIn = (zoomInterval: number) => {
  zoom( zoomLevel.value * zoomInterval);
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
.zoom-options-container{
  display: flex;
  flex-direction: row;
  margin-top: 1rem;
  padding: 0.5rem;
  justify-content: space-evenly;
}

.zoom-options{
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.interval-label{
  margin: 0;
  font-size: 10px;
  align-self: center;
}
.zoom-button{
  color: black;
  color: black;
  margin-left: 2px;
  margin-right: 2px;
}
</style>