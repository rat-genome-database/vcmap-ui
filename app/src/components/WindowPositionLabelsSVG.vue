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

interface WindowPositionLabels
{
  startSectionLabel: string | null,
  stopSectionLabel: string | null,
  startLabelPos: number,
  stopLabelPos: number,
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
  // Ensure that the blocks are ordered from top to bottom
  regionBlocks.sort((a, b) => a.posY1 - b.posY1);
  // If there's a block cutoff by the window, find those as our sections to label
  startSection = regionBlocks.find((block) => block.posY1 < PANEL_SVG_START && block.posY2 > PANEL_SVG_START);
  stopSection = regionBlocks.find((block) => block.posY1 < PANEL_SVG_STOP && block.posY2 > PANEL_SVG_STOP);
  // If the top of the window doesn't cut off a block, find the first block that
  // starts below the window top
  // Else calculate the base pair based on where the block is cutoff
  if (!startSection) {
    startSection = regionBlocks.find((block) => block.posY1 > PANEL_SVG_START);
    if (startSection) {
      const basePair = startSection.isInverted ? startSection.speciesStop : startSection.speciesStart;
      startSectionLabel = Formatter.convertBasePairToLabel(Math.round(basePair));
      // Adjust the position a little so it displays nicely at the top of the window
      startLabelPos = startSection.posY1 + 5;
    }
  } else {
    startSectionLabel = calculateSectionStartPositionLabel(startSection);
    startLabelPos = PANEL_SVG_START + 10;
  }
  // If the bottom of the window doesn't cut off a block, find the last block that
  // ends above the window bottom
  // Else calculate the base pair based on where the block is cutoff
  if (!stopSection) {
    stopSection = regionBlocks.findLast((block) => block.posY2 < PANEL_SVG_STOP);
    if (stopSection) {
      const basePair = stopSection.isInverted ? stopSection.speciesStart : stopSection.speciesStop;
      stopSectionLabel = Formatter.convertBasePairToLabel(Math.round(basePair));
      // Adjust the position a little so it displays nicely at the bottom of the window
      stopLabelPos = stopSection.posY2 - 5;
    }
  } else {
    stopSectionLabel = calculateSectionStopPositionLabel(stopSection);
    stopLabelPos = PANEL_SVG_STOP - 10;
  }
  const labels: WindowPositionLabels = {
    startSectionLabel: startSectionLabel,
    startLabelPos: startLabelPos,
    stopSectionLabel: stopSectionLabel,
    stopLabelPos: stopLabelPos,
  };
  return labels;
});

const calculateSectionStartPositionLabel = (section: SyntenySection) => {
  const hiddenHeight = PANEL_SVG_START - section.posY1;
  const basePairPerSVG = section.length / section.height;
  // Subtract or add the number of hidden basepairs above the visible window based on inversion
  const labelBasePair = section.isInverted ? section.speciesStart - (hiddenHeight * basePairPerSVG) : section.speciesStart + (hiddenHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
};

const calculateSectionStopPositionLabel = (section: SyntenySection) => {
  const hiddenHeight = section.posY2 - PANEL_SVG_STOP;
  const basePairPerSVG = section.length / section.height;
  // Subtract or add the number of hidden basepairs below the visible window based on inversion
  const labelBasePair = !section.isInverted ? section.speciesStop - (hiddenHeight * basePairPerSVG) : section.speciesStop + (hiddenHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
};

</script>
