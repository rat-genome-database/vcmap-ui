<template>
  <rect v-if="props.tooltipData"
    fill="bisque"
    stroke="black"
    stroke-width="0.5"
    :x="xPos" :y="props.tooltipData.y"
    :width="width"
    :height="DEFAULT_HEIGHT" />
  <template v-if="props.tooltipData?.genomicSection">
    <text class="label small" :x="xPos + 2" :y="props.tooltipData.y + 10">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</text>
    <text class="label small" :x="xPos + 2" :y="props.tooltipData.y + 20">Region: {{props.tooltipData.genomicSection.startBPLabel}} - {{props.tooltipData.genomicSection.stopBPLabel}}</text>
    <text v-if="props.tooltipData.genomicSection.gene" class="label small" :x="xPos + 2" :y="props.tooltipData.y + 30">Gene: {{props.tooltipData.genomicSection.gene}}</text>
  </template>
</template>

<script setup lang="ts">
import TooltipData from '@/models/TooltipData';
import ViewSize from '@/utils/ViewSize';
import { computed } from 'vue';

const TOOLTIP_GAP = 5; // gap between the tooltip window and the starting x position given
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 45;

interface Props
{
  tooltipData: TooltipData | null;
}

const props = defineProps<Props>();

const width = computed(() => {
  if (props.tooltipData == null || props.tooltipData.genomicSection.gene == null)
  {
    return DEFAULT_WIDTH;
  }

  const gene = props.tooltipData.genomicSection.gene;
  // Based on font size, the width will need to increase if the gene name is longer than 26 chars...
  const diff = (gene.length - 24);
  if (diff > 0)
  {
    // Use larger multiplier for gene names that are just barely over the width limit 
    // (sometimes capital letters throw the measurements off so having too small of multiplier doesn't always work)
    let multiplier = 12;
    if (diff > 5 && diff <= 10)
    {
      multiplier = 5;
    }
    else if (diff > 10)
    {
      multiplier = 4;
    }

    return DEFAULT_WIDTH + (diff * multiplier);
  }

  return DEFAULT_WIDTH;
});

const xPos = computed(() => {
  if (props.tooltipData == null)
  {
    return 0;
  }

  // Show tooltip on the left
  let x = props.tooltipData.x - width.value - TOOLTIP_GAP;
  if (x < 0)
  {
    // Show tooltip on the right
    x = props.tooltipData.x + ViewSize.trackWidth + TOOLTIP_GAP;
  }

  return x;
});
</script>