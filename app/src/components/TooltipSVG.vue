<template>
  <rect v-if="props.tooltipData"
    data-test="tooltip-data-svg"
    fill="bisque"
    stroke="black"
    stroke-width="0.5"
    :x="xPos - width" :y="SVGConstants.overviewTrackYPosition"
    :width="width"
    :height="height" 
  />

  <rect v-if="labelModal"
    fill="lightgrey"
    stroke="black"
    stroke-width="0.5"
    :x="(xPos - width) + width/4" :y="380"
    :width="72"
    :height="12" 
  />
  <text v-if="labelModal" class="label small" :x="((xPos - width) + width/4) + 10" :y="390">View More +</text>

  <template v-if="props.tooltipData?.type === 'trackSection'">
    <text v-if="props.tooltipData.genomicSection.gene" data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 10">Symbol: {{props.tooltipData.genomicSection.gene.symbol}}</text>
    <text v-if="props.tooltipData.genomicSection.gene" data-test="gene-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 20" :textLength="width - 5" lengthAdjust="spacingAndGlyphs">Name: {{props.tooltipData.genomicSection.gene.name ?? 'N/A'}}</text>
    <text data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 30">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</text>
    <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 40">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.stop)}}</text>
    <text class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 50">Orientation: {{props.tooltipData.genomicSection.isInverted ? '-' : '+'}}</text>
    <text v-if="props.tooltipData.genomicSection.chainLevel != null" data-test="level" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 40">Level: {{props.tooltipData.genomicSection.chainLevel}}</text>
  </template>
  
  <template v-else-if="props.tooltipData?.type === 'geneLabel'">
    <template v-if="!labelModal">
      <text data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 10">Symbol: {{props.tooltipData.genomicSection.gene.symbol}}</text>
      <text data-test="gene-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 20" :textLength="width - 5" lengthAdjust="spacingAndGlyphs">Name: {{props.tooltipData.genomicSection.gene.name ?? 'N/A'}}</text>
      <text data-test="chromosome-name" class="label small" :x=" - width" :y="SVGConstants.overviewTrackYPosition + 30">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</text>
      <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 40">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.stop)}}</text>
      <text data-test="start-stop" class="label small" :x=" - width" :y="SVGConstants.overviewTrackYPosition + 50"></text>

      <template v-for="gene, index in props.tooltipData.genomicSection?.combinedGenes" :key="gene">
        <text data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 1)">Symbol: {{gene.gene.symbol}}</text>
        <text data-test="gene-name" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 2)" :textLength="width - 5" lengthAdjust="spacingAndGlyphs">Name: {{gene.gene.name ?? 'N/A'}}</text>
        <text data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 3)">Chromosome: {{gene.chromosome}}</text>
        <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 4)">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</text>
        <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 5)"></text>
      </template>
    </template>

    <template v-else >
      <text data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 10">Symbol: {{props.tooltipData.genomicSection.gene.symbol}}</text>
      <text data-test="gene-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 20" :textLength="width - 5" lengthAdjust="spacingAndGlyphs">Name: {{props.tooltipData.genomicSection.gene.name ?? 'N/A'}}</text>
      <text data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 30">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</text>
      <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 40">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.stop)}}</text>
      <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 50"></text>

      <template v-for="gene, index in props.tooltipData.genomicSection?.combinedGenes" :key="gene">
        <text v-if="index < 4" data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 1)">Symbol: {{gene.gene.symbol}}</text>
        <text v-if="index < 4" data-test="gene-name" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 2)" :textLength="width - 5" lengthAdjust="spacingAndGlyphs"> Name: {{gene.gene.name ?? 'N/A'}}</text>
        <text v-if="index < 4" data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 3)">Chromosome: {{gene.chromosome}}</text>
        <text v-if="index < 4" data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 4)">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</text>
        <text v-if="index < 4" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 5)"></text>
      </template>

    </template>

  </template>

  <template v-else-if="props.tooltipData?.type === 'orthologLine'">
    
  </template>
</template>

<script setup lang="ts">
import TooltipData from '@/models/TooltipData';
import SVGConstants from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import { ref, computed, onMounted, } from 'vue';

const TOOLTIP_GAP = 5; // gap between the tooltip window and the starting x position given
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 45;
const MAX_HEIGHT = 350;



interface Props
{
  tooltipData: TooltipData | null;
}

const props = defineProps<Props>();

const labelModal = computed(() =>
{
  if (!props.tooltipData)
  {
    return false;
  }

  if (height.value === MAX_HEIGHT)
  {
    return true;
  }
  else
  {
    return false;
  }
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

    return DEFAULT_WIDTH + (diff * multiplier) > 240 ? 240 : DEFAULT_WIDTH + (diff * multiplier);
  }

  return DEFAULT_WIDTH;
});

const height = computed(() => {
  if (props.tooltipData == null || props.tooltipData.genomicSection.gene == null || props.tooltipData.genomicSection?.hiddenGenes == null)
  {
    return DEFAULT_HEIGHT;
  }

  const combinedGenes = props.tooltipData.genomicSection.combinedGenes;
  const hiddenGenes = props.tooltipData.genomicSection.hiddenGenes;
  //for combined genes, 6 total can be shown.  If more, us max height and set modal btn to true
  if (combinedGenes.length > 6)
  {
    return MAX_HEIGHT;
  }
  else if (combinedGenes.length < 6 && hiddenGenes.length > 0)
  {
    return (combinedGenes.length * 50) + (hiddenGenes.length * 10) + DEFAULT_HEIGHT > MAX_HEIGHT ? MAX_HEIGHT : (combinedGenes.length * 50) + (hiddenGenes.length * 10) + DEFAULT_HEIGHT;
  }
  else if (combinedGenes.length <= 0 && hiddenGenes.length > 0)
  {
    return (hiddenGenes.length * 10) + DEFAULT_HEIGHT > MAX_HEIGHT ? MAX_HEIGHT : (hiddenGenes.length * 10) + DEFAULT_HEIGHT;
  }
  else
  {
    return (combinedGenes.length * 50) + DEFAULT_HEIGHT > MAX_HEIGHT ? MAX_HEIGHT : (combinedGenes.length * 50) + DEFAULT_HEIGHT;
  }
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

  return 990;
});

const labelYPosition = (index: number, textLine: number) => {
  index = index + 1;
  let yPos = ((index * 50) + (textLine * 10)) + SVGConstants.overviewTrackYPosition;
  return yPos;
};
</script>
