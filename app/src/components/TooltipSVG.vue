<template>
  <rect v-if="props.tooltipData"
    data-test="tooltip-data-svg"
    fill="bisque"
    stroke="black"
    stroke-width="0.5"
    :x="xPos" :y="props.tooltipData.y"
    :width="width"
    :height="height" />
  <template v-if="props.tooltipData?.genomicSection && !props.tooltipData?.isGeneLabel">
    <text v-if="props.tooltipData.genomicSection.gene" data-test="gene-symbol" class="label small" :x="xPos + 2" :y="props.tooltipData.y + 10">Symbol: {{props.tooltipData.genomicSection.gene.symbol}}</text>
    <text v-if="props.tooltipData.genomicSection.gene" data-test="gene-name" class="label small" :x="xPos + 2" :y="props.tooltipData.y + 20">Name: {{props.tooltipData.genomicSection.gene.name}}</text>
    <text data-test="chromosome-name" class="label small" :x="xPos + 2" :y="chromosomeDataStartingPosition">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</text>
    <text data-test="start-stop" class="label small" :x="xPos + 2" :y="chromosomeDataStartingPosition + 10">Region: {{props.tooltipData.genomicSection.startBPLabel}} - {{props.tooltipData.genomicSection.stopBPLabel}}</text>
    <text class="label small" :x="xPos + 2" :y="chromosomeDataStartingPosition + 20">Orientation: {{props.tooltipData.genomicSection.isInverted ? '-' : '+'}}</text>
    <text v-if="props.tooltipData.genomicSection.chainLevel != null" data-test="level" class="label small" :x="xPos + 2" :y="chromosomeDataStartingPosition + 30">Level: {{props.tooltipData.genomicSection.chainLevel}}</text>
  </template>
  
  <template v-else-if="props.tooltipData?.genomicSection && props.tooltipData?.isGeneLabel">
    <text class="label small" :x="xPos + 2" :y="props.tooltipData.y + 10">
      Displayed Gene: {{props.tooltipData.genomicSection.gene?.symbol}}
    </text>
    <text v-for="gene, index in props.tooltipData.genomicSection?.hiddenGenes" :key="index" class="label small" :x="xPos + 2" :y="props.tooltipData.y + ((index + 2) * 10)">
      Hidden Gene: {{gene.gene?.symbol}}
    </text>
  </template>
</template>

<script setup lang="ts">
import TooltipData from '@/models/TooltipData';
import SVGConstants from '@/utils/SVGConstants';
import { computed } from 'vue';

const TOOLTIP_GAP = 5; // gap between the tooltip window and the starting x position given
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 45;

interface Props
{
  tooltipData: TooltipData | null;
}

const props = defineProps<Props>();

const chromosomeDataStartingPosition = computed(() => {
  if (props.tooltipData?.genomicSection.gene)
  {
    return props.tooltipData.y + 30;
  }
  else if (props.tooltipData)
  {
    return props.tooltipData.y + 10;
  }

  return 0;
});

const width = computed(() => {
  if (props.tooltipData == null || props.tooltipData.genomicSection.gene == null)
  {
    return DEFAULT_WIDTH;
  }

  const geneName = props.tooltipData.genomicSection.gene.name;
  // Based on font size, the width will need to increase if the geneName name is longer than 26 chars...
  const diff = (geneName.length - 24);
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

const height = computed(() => {
  if (props.tooltipData == null || props.tooltipData.genomicSection.gene == null || props.tooltipData.genomicSection?.hiddenGenes == null)
  {
    return DEFAULT_HEIGHT;
  }

  const hiddenGenes = props.tooltipData.genomicSection.hiddenGenes;
  //for truncated gene labels, the default height (45) shows ~3 hidden genes
  const diff = (hiddenGenes.length - 3);
  if (diff > 0)
  {
    return DEFAULT_HEIGHT + (diff * 10);
  }

  return DEFAULT_HEIGHT;
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
    x = props.tooltipData.x + SVGConstants.trackWidth + TOOLTIP_GAP;
  }

  return x;
});
</script>