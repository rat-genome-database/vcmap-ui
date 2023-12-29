<template>
  <template v-if="region.gaplessBlock.posY1 < PANEL_SVG_START && region.gaplessBlock.posY2 > PANEL_SVG_START">
    <text
      class="label small"
      :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
      :y="sectionLabels.startLabelPos"
    >
      {{ sectionLabels.startSectionLabel }}
    </text>
  </template>
  <template v-else>
    <text
      class="label small"
      dominant-baseline="hanging"
      :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
      :y="region.gaplessBlock.posY1"
    >
      {{region.gaplessBlock.startLabel.text}}
    </text>
  </template>
  <template v-if="region.gaplessBlock.posY2 > PANEL_SVG_STOP && region.gaplessBlock.posY1 < PANEL_SVG_STOP">
    <text
      class="label small"
      :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
      :y="sectionLabels.stopLabelPos"
    >
      {{ sectionLabels.stopSectionLabel }}
    </text>
  </template>
  <template v-else>
    <text
      class="label small"
      dominant-baseline="auto"
      :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
      :y="region.gaplessBlock.posY2"
    >
      {{region.gaplessBlock.stopLabel.text}}
    </text>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import SyntenyRegion from '@/models/SyntenyRegion';
import SyntenySection from '@/models/SyntenySection';
import { Formatter } from '@/utils/Formatter';
import { PANEL_SVG_START, PANEL_SVG_STOP } from '@/utils/SVGConstants';

const SYNTENY_LABEL_SHIFT = 10;

interface Props
{
  region: SyntenyRegion,
}

const props = defineProps<Props>();
const sectionLabels = computed(() => {
  let startSection: SyntenySection | undefined;
  let stopSection: SyntenySection | undefined;
  let startSectionLabel: string | null = '';
  let stopSectionLabel: string | null = '';
  let startLabelPos: number = 0;
  let stopLabelPos: number = 0;
  const regionBlocks = [...props.region.syntenyBlocks];
  regionBlocks.sort((a, b) => a.posY1 - b.posY1);
  startSection = regionBlocks.find((block) => block.posY1 < PANEL_SVG_START && block.posY2 > PANEL_SVG_START);
  stopSection = regionBlocks.find((block) => block.posY1 < PANEL_SVG_STOP && block.posY2 > PANEL_SVG_STOP);
  if (!startSection) {
    startSection = regionBlocks.find((block) => block.posY1 > PANEL_SVG_START);
    if (startSection) {
      const basePair = startSection.isInverted ? startSection.speciesStop : startSection.speciesStart;
      startSectionLabel = Formatter.convertBasePairToLabel(Math.round(basePair));
      startLabelPos = startSection.posY1;
    }
  } else {
    startSectionLabel = calculateSectionStartPositionLabel(startSection);
    startLabelPos = PANEL_SVG_START + 10;
  }
  if (!stopSection) {
    stopSection = regionBlocks.find((block) => block.posY2 < PANEL_SVG_STOP);
    if (startSection) {
      const basePair = startSection.isInverted ? startSection.speciesStart : startSection.speciesStop;
      stopSectionLabel = Formatter.convertBasePairToLabel(Math.round(basePair));
      stopLabelPos = startSection.posY2;
    }
  } else {
    stopSectionLabel = calculateSectionStopPositionLabel(stopSection);
    stopLabelPos = PANEL_SVG_STOP - 10;
  }
  return {
    startSectionLabel: startSectionLabel,
    startLabelPos: startLabelPos,
    stopSectionLabel: stopSectionLabel,
    stopLabelPos: stopLabelPos,
  };
});

const calculateSectionStartPositionLabel = (section: SyntenySection) => {
  const hiddenHeight = PANEL_SVG_START - section.posY1;
  const basePairPerSVG = section.length / section.height;
  // Subtract or multiple the number of hidden basepairs above the visible window based on inversion
  const labelBasePair = section.isInverted ? section.speciesStart - (hiddenHeight * basePairPerSVG) : section.speciesStart + (hiddenHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
};

const calculateSectionStopPositionLabel = (section: SyntenySection) => {
  const hiddenHeight = section.posY2 - PANEL_SVG_STOP;
  const basePairPerSVG = section.length / section.height;
  // Subtract or multiple the number of hidden basepairs below the visible window based on inversion
  const labelBasePair = !section.isInverted ? section.speciesStop - (hiddenHeight * basePairPerSVG) : section.speciesStop + (hiddenHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
};

</script>
