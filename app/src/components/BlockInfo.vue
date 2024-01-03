<template>
  <div class="synteny-block-container">
    <div class="block-header" :style="{ backgroundColor: blockSection.elementColor }">
      <span class="species-chromosome">{{ blockSection.speciesName }} Chr{{ chromosome }}</span>
    </div>

    <div class="coords-labels">
      <span class="coords-label">Start</span>
      <span class="coords-label">End</span>
    </div>
    <div class="coords-container">
      <span class="start-coords">{{ Formatter.addCommasToBasePair(start) }}bp</span>
      <span class="end-coords">{{ Formatter.addCommasToBasePair(stop) }}bp</span>
    </div>

    <div class="divider"></div>

    <div class="info-section">
      <div class="column alignment-info">
        <div class="column-header">Alignment Info</div>
        <!-- Alignment Information -->
        <div class="info-item">
          <span class="info-label">Orientation:</span> 
          <span class="info-value">{{ trackOrientation }} {{ trackOrientation === '-' ? '(Inverted)' : '' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Chain Level:</span> 
          <span class="info-value">{{ chainLevel }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Backbone Start:</span> 
          <span class="info-value">{{ Formatter.addCommasToBasePair(blockSection.backboneAlignment.start) }}bp</span>
        </div>
        <div class="info-item">
          <span class="info-label">Backbone Stop:</span> 
          <span class="info-value">{{ Formatter.addCommasToBasePair(blockSection.backboneAlignment.stop) }}bp</span>
        </div>
      </div>
      <div class="column data-track-info">
        <div class="column-header">Region Info</div>
        <!-- Data Track Information -->
        <div class="info-item">
          <span class="info-label">Gene Count:</span> 
          <span class="info-value">{{ blockSection.regionInfo?.geneCount }} genes</span>
        </div>
        <div class="info-item">
          <span class="info-label">Block Count:</span> 
          <span class="info-value">{{  blockSection.regionInfo?.blockCount }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Gap Count:</span> 
          <span class="info-value">{{  blockSection.regionInfo?.gapCount }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Variant Count:</span> 
          <span class="info-value">{{ blockSection.regionInfo?.variantCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import SyntenySection from '@/models/SyntenySection';
import Gene from '@/models/Gene';
import { Formatter } from '@/utils/Formatter';
import { useStore } from 'vuex';
import { key } from '@/store';
import { useLogger } from 'vue-logger-plugin';

const $log = useLogger();
const store = useStore(key);

interface Props
{
  blockSection: SyntenySection;
  chromosome: string;
  start: number;
  stop: number;
  chainLevel?: number;
  trackOrientation?: string;
}

const props = defineProps<Props>();

</script>

<style lang="scss" scoped>
.block-header {
  border: 1px solid black;
  text-align: center;
}
.coords-container {
  display: flex;
  justify-content: space-between;
}
.coords-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75em;
  margin-top: 5px; 
}
.start-coords, .end-coords {
  font-weight: bold;
  font-size: 0.8rem;
}
.divider {
  height: 2px;
  background-color: #ccc;
  margin: 8px 0;
}
.info-section {
  display: flex;
  justify-content: space-between;
}
.info-label {
  font-weight: bold;
  font-size: 0.8rem;
}
.info-value {
  font-size: 0.8rem;
  font-style: italic;
}
.info-item {
  display: flex;
  flex-direction: column;
}
.column-header {
  font-size: 1em;
  margin-bottom: 5px;
}
.alignment-info, .data-track-info {
  font-size: 0.85em;
}
</style>