<template>
  <Panel>
    <template #header>
        Selected Genes
    </template>
    <div class="gene-data">

      <template v-if="props.tooltipData?.type === 'trackSection'">
        <div v-if="props.tooltipData.genomicSection.gene" data-test="gene-symbol">Symbol: {{props.tooltipData.genomicSection.gene.symbol}}</div>
        <div v-if="props.tooltipData.genomicSection.gene" data-test="gene-name">Name: {{props.tooltipData.genomicSection.gene.name ?? 'N/A'}}</div>
        <div data-test="chromosome-name">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</div>
        <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.sectionStart)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.sectionStop)}}</div>
        <div>Orientation: {{props.tooltipData.genomicSection.isInverted ? '-' : '+'}}</div>
        <div v-if="props.tooltipData.genomicSection.chainLevel != null" data-test="level">Level: {{props.tooltipData.genomicSection.chainLevel}}</div>
      </template>

      <template v-else-if="props.tooltipData?.type === 'geneLabel'">
        <template v-if="!labelModal">
          <div data-test="gene-symbol">Symbol: {{props.tooltipData.genomicSection.gene.symbol}}</div>
          <div data-test="gene-name">Name: {{props.tooltipData.genomicSection.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.stop)}}</div>

          <template v-for="gene in props.tooltipData.genomicSection?.combinedGenes" :key="gene">
            <div data-test="gene-symbol">Symbol: {{gene.gene.symbol}}</div>
            <div data-test="gene-name">Name: {{gene.gene.name ?? 'N/A'}}</div>
            <div data-test="chromosome-name">Chromosome: {{gene.gene.chromosome}}</div>
            <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</div>
          </template>
        </template>

        <template v-else >
          <div data-test="gene-symbol">Symbol: {{props.tooltipData.genomicSection.gene.symbol}}</div>
          <div data-test="gene-name">Name: {{props.tooltipData.genomicSection.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{props.tooltipData.genomicSection.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.gene.stop)}}</div>
          <br>

          <template v-for="gene in props.tooltipData.genomicSection?.combinedGenes" :key="gene">
            <div data-test="gene-symbol">Symbol: {{gene.gene.symbol}}</div>
            <div data-test="gene-name"> Name: {{gene.gene.name ?? 'N/A'}}</div>
            <div data-test="chromosome-name">Chromosome: {{gene.gene.chromosome}}</div>
            <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</div>
            <br>
          </template>
        </template>
      </template>

      <template v-else-if="props.tooltipData?.type === 'orthologLine'">
        <div data-test="start-stop">BACKBONE GENE:</div>
        <div data-test="gene-symbol">Symbol: {{props.tooltipData.genomicSection.backboneGene.gene.symbol}}</div>
        <div data-test="gene-name">Name:{{props.tooltipData.genomicSection.backboneGene.gene.name ?? 'N/A'}}</div>
        <div data-test="chromosome-name">Chromosome: {{props.tooltipData.genomicSection.backboneGene.gene.chromosome}}</div>
        <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.backboneGene.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.backboneGene.gene.stop)}}</div>

        <div data-test="start-stop">&lt;---------------------------------------&gt;</div>

        <div data-test="start-stop">COMPARATIVE GENE HOMOLOG:</div>
        <div data-test="gene-symbol">Species: {{props.tooltipData.genomicSection.comparativeGene.gene.speciesName}}</div>
        <div data-test="gene-symbol">Symbol: {{props.tooltipData.genomicSection.comparativeGene.gene.symbol}}</div>
        <div data-test="gene-name">Name:{{props.tooltipData.genomicSection.comparativeGene.gene.name ?? 'N/A'}}</div>
        <div data-test="chromosome-name">Chromosome: {{props.tooltipData.genomicSection.comparativeGene.gene.chromosome}}</div>
        <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.comparativeGene.gene.start)}} - {{Formatter.addCommasToBasePair(props.tooltipData.genomicSection.comparativeGene.gene.stop)}}</div>
    </template>
    </div>
  </Panel>
</template>
<!--<template>

  <line v-if="props.tooltipData !== null && props.tooltipData.type !== null"
    class="tooltip-line"
    :x1="xPos + 2 - width" :x2="props.tooltipData.type === 'trackSection' ? props.tooltipData.x + 5 : props.tooltipData.type === 'orthologLine' ? props.tooltipData.mouseX : props.tooltipData.x + 50" 
    :y1="SVGConstants.overviewTrackYPosition" :y2="props.tooltipData?.y" 
  />
</template>
-->
<script setup lang="ts">
import TooltipData from '@/models/TooltipData';
import SVGConstants from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import { computed, } from 'vue';

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
.gene-data
{
  overflow-y: scroll;
  max-height: 550px;
}
</style>
