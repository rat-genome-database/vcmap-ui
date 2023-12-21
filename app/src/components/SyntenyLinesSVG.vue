<template>
  <line v-if="syntenySection.isHovered"
    class="synteny-line"
    :x1="getLineStart(syntenySection)"
    :x2="syntenySection.startLabel.labelOnLeft
      ? getOverviewPanelXPosition(backboneOrder, store.state.svgPositions) + syntenySection.width
      : getOverviewPanelXPosition(backboneOrder, store.state.svgPositions)"
    :y1="syntenySection.posY1" :y2="(syntenySection.isInverted) ? syntenySection.posY2 : syntenySection.posY1" />
  <line v-if="syntenySection.isHovered"
    class="synteny-line"
    :x1="getLineStart(syntenySection)"
    :x2="syntenySection.startLabel.labelOnLeft
      ? getOverviewPanelXPosition(backboneOrder, store.state.svgPositions) + syntenySection.width
      : getOverviewPanelXPosition(backboneOrder, store.state.svgPositions)"
    :y1="syntenySection.posY2" :y2="(syntenySection.isInverted) ? syntenySection.posY1 : syntenySection.posY2" />
</template>

<script lang="ts" setup>
import SyntenySection from '@/models/SyntenySection';
import { getOverviewPanelXPosition } from '@/utils/Shared';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);
const backboneMapKey = store.state.selectedBackboneRegion?.chromosome.mapKey ?? 0;
const backboneOrder = store.state.speciesOrder[backboneMapKey.toString()] ?? 0;

interface Props
{
  syntenySection: SyntenySection;
}

// If the labels are on the left, the lines will start on the left (posX1)
// Otherwise the lines start on the right (posX1 + width)
function getLineStart(syntenySection: SyntenySection) {
  if (syntenySection.startLabel.labelOnLeft) {
    return syntenySection.posX1;
  } else {
    return syntenySection.posX1 + syntenySection.width;
  }
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.synteny-line
{
  stroke-width: 1;
  stroke: black;
  stroke-dasharray: 4;
}
</style>