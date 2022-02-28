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
    <text data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="props.tooltipData.genomicSection.gene ? SVGConstants.overviewTrackYPosition + 30 : SVGConstants.overviewTrackYPosition + 10">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</text>
    <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="props.tooltipData.genomicSection.gene ? SVGConstants.overviewTrackYPosition + 40 : SVGConstants.overviewTrackYPosition + 20">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.sectionStart)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.sectionStop)}}</text>
    <text class="label small" :x="xPos + 2 - width" :y="props.tooltipData.genomicSection.gene ? SVGConstants.overviewTrackYPosition + 50 : SVGConstants.overviewTrackYPosition + 30">Orientation: {{props.tooltipData.genomicSection.isInverted ? '-' : '+'}}</text>
    <text v-if="props.tooltipData.genomicSection.chainLevel != null" data-test="level" class="label small" :x="xPos + 2 - width" :y="props.tooltipData.genomicSection.gene ? SVGConstants.overviewTrackYPosition + 60 : SVGConstants.overviewTrackYPosition + 40">Level: {{props.tooltipData.genomicSection.chainLevel}}</text>
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
        <text data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 3)">Chromosome: {{gene.gene.chromosome}}</text>
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
        <text v-if="index < 4" data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 3)">Chromosome: {{gene.gene.chromosome}}</text>
        <text v-if="index < 4" data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 4)">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</text>
        <text v-if="index < 4" class="label small" :x="xPos + 2 - width" :y="labelYPosition(index, 5)"></text>
      </template>
    </template>

  </template>

  <template v-else-if="props.tooltipData?.type === 'orthologLine'">
    <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 10">BACKBONE GENE:</text>
    <text data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 20">Symbol: {{props.tooltipData.genomicSection.backboneGene.gene.symbol}}</text>
    <text data-test="gene-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 30" :textLength="width - 5" lengthAdjust="spacingAndGlyphs">Name:{{props.tooltipData.genomicSection.backboneGene.gene.name ?? 'N/A'}}</text>
    <text data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 40">Chromosome: {{props.tooltipData.genomicSection.backboneGene.gene.chromosome}}</text>
    <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 50">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.backboneGene.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.backboneGene.gene.stop)}}</text>

    <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 70">&lt;---------------------------------------&gt;</text>

    <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 90">COMPARATIVE GENE HOMOLOG:</text>
    <text data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 100">Species: {{props.tooltipData.genomicSection.comparativeGene.gene.speciesName}}</text>
    <text data-test="gene-symbol" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 110">Symbol: {{props.tooltipData.genomicSection.comparativeGene.gene.symbol}}</text>
    <text data-test="gene-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 120" :textLength="width - 5" lengthAdjust="spacingAndGlyphs">Name:{{props.tooltipData.genomicSection.comparativeGene.gene.name ?? 'N/A'}}</text>
    <text data-test="chromosome-name" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 130">Chromosome: {{props.tooltipData.genomicSection.comparativeGene.gene.chromosome}}</text>
    <text data-test="start-stop" class="label small" :x="xPos + 2 - width" :y="SVGConstants.overviewTrackYPosition + 140">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.comparativeGene.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.comparativeGene.gene.stop)}}</text>
  </template>

  <line v-if="props.tooltipData"
    class="tooltip-line"
    :x1="xPos + 2 - width" :x2="props.tooltipData.type === 'trackSection' ? props.tooltipData.x + 5 : props.tooltipData.type === 'orthologLine' ? props.tooltipData.mouseX : props.tooltipData.x + 50" 
    :y1="SVGConstants.overviewTrackYPosition" :y2="props.tooltipData?.y" 
  />
</template>

<script setup lang="ts">
import TooltipData from '@/models/TooltipData';
import SVGConstants from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import { ref, computed, onMounted, } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
const store = useStore(key);


const TOOLTIP_GAP = 5; // gap between the tooltip window and the starting x position given
const DEFAULT_WIDTH = 130;
const DEFAULT_HEIGHT = 55;
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
  if (props.tooltipData == null || props.tooltipData?.type == 'trackSection')
  {
    return DEFAULT_HEIGHT;
  }

  if (props.tooltipData?.type == 'orthologLine')
  {
    return 200;
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

<style lang="scss" scoped>
.tooltip-line
{
  stroke-width: 1;
  stroke: red;
}
</style>
