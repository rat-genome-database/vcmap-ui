<template>
  <span data-test="zoom-level-label">{{ Math.round(zoomLevel * 100) / 100.0 }}x</span>
  <Slider :disabled="isZoomDisabled" class="zoom-slider" data-test="zoom-slider" v-model="zoomLevel" :step="1" :min="1" :max="100" @slideend="onZoomSliderEnd" />
  <div class="zoom-options-container">
    <div class="zoom-out-container">
      <div class="zoom-options " v-for="interval in zoomIntervals" :key="interval">
        <Button class="zoom-button" icon="pi pi-angle-double-left" :disabled="isZoomDisabled" @click="zoomOut(interval)" />
        <p class="interval-label">{{interval}}x</p>
      </div>
      <p class="zoom-out-label">Zoom Out</p>
    </div>
    <div class="zoom-in-container">
      <div class="zoom-options" v-for="interval in zoomIntervals" :key="interval">
        <Button class="zoom-button" icon="pi pi-angle-double-right" :disabled="isZoomDisabled" @click="zoomIn(interval)"></Button>
        <p class="interval-label">{{interval}}x</p>
      </div>
      <p class="zoom-in-label">Zoom In</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';
import { computed, ref, watch } from 'vue';
import { SliderSlideEndEvent } from 'primevue/slider';

const store = useStore(key);

const zoomLevel = ref(1.0);
const zoomIntervals = [1.5, 3.0, 10.0, 100.0];

watch(() => store.state.detailedBasePairRange, (newRange) => {
  // Update the zoom level shown in the Slider to show the ratio of the
  // viewport size to the total chromosome.
  let seqLength = store.state.chromosome?.seqLength ?? 0;
  zoomLevel.value = seqLength * 1.0 / (newRange.stop - newRange.start);
}, { immediate: true, });

const isZoomDisabled = computed(() => {
  return store.state.isDetailedPanelUpdating || store.state.chromosome == null;
});

const onZoomSliderEnd = (event: SliderSlideEndEvent) => {
  if (store.state.isDetailedPanelUpdating)
  {
    return;
  }

  zoom(event.value);
  // logZoom(event.value);
};

const zoom = (newZoomLevel: number) => {
  const backboneChromosome = store.state.chromosome;

  console.debug(`Zoom level: ${newZoomLevel}`);

  if (backboneChromosome == null)
  {
    console.error('Cannot zoom if selectedRegion, viewportSelection, or backboneChromosome is null');
    return;
  }

  if (newZoomLevel === 1)
  {
    store.dispatch('setDetailedBasePairRequest', { start: 0, stop: backboneChromosome.seqLength });
    // store.dispatch('setDetailedBasePairRange', { start: 0, stop: backboneChromosome.seqLength });
  }
  else
  {
    let zoomedStart = store.state.detailedBasePairRange.start;
    let zoomedStop = store.state.detailedBasePairRange.stop;
    let currentLength = zoomedStop - zoomedStart;
    let currentZoomLevel = backboneChromosome.seqLength / currentLength;

    const newRegionLength = currentLength * (currentZoomLevel / newZoomLevel);
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

    // Trigger detailed panel update
    store.dispatch('setDetailedBasePairRequest', { start: zoomedStart, stop: zoomedStop });
    // store.dispatch('setDetailedBasePairRange', { start: zoomedStart, stop: zoomedStop });
  }
};

const logZoom = (zoomLevel: number) => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (selectedRegion == null || selectedRegion.viewportSelection == null) {
    console.error('ERROR WITH SELECTED REGION');
  } else {
    let minZoom = selectedRegion.viewportSelection.basePairStart+1;
    let maxZoom = selectedRegion.viewportSelection.basePairStop;

    let logMinZoom = Math.log(minZoom) * (1/Math.log(100));
    let logMaxZoom = Math.log(maxZoom) * (1/Math.log(100));

    let logZoom = logMinZoom + (logMaxZoom-logMinZoom)*zoomLevel/(100-1);
    let zoomed = Math.exp(logZoom);

    zoom(zoomed);
  }


};

const zoomOut = (zoomInterval: number) => {
  zoom( zoomLevel.value / zoomInterval);
};
const zoomIn = (zoomInterval: number) => {
  zoom(zoomLevel.value * zoomInterval);
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
  justify-content: space-around;
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
  height: 1rem;
}
.zoom-in-container{
  display: flex;
  flex-direction: row;
  align-items: baseline;
}
.zoom-out-container{
  display: flex;
  flex-direction: row-reverse;
  align-items: baseline;
}
.zoom-in-label{
  margin-right: 0.5rem;
  padding-left: .5em;
  font-size: .85em;
}
.zoom-out-label{
  margin-left: 0.5rem;
  padding-right: .5em;
  font-size: .85em;
}
</style>