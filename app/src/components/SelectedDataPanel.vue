<template>
  <Panel>
    <template #header>
        Selected Genes
        <Button
          label="Clear Selection"
          class="p-button-info"
          @click="clearSelectedGenes"
        />
    </template>
    <div class="gene-data">

      <template v-if="props.selectedData?.type === 'trackSection'">
        <div v-if="props.selectedData.genomicSection.gene" data-test="gene-symbol">
          Symbol:
          <Button
            class="p-button-link rgd-link"
            @click="goToRgd(props.selectedData.genomicSection.gene.rgdId)"
          >
            <b>{{props.selectedData.genomicSection.gene.symbol}}</b>
            <i class="pi pi-link external-link"></i>
          </Button>
        </div>
        <div v-if="props.selectedData.genomicSection.gene" data-test="gene-name">Name: {{props.selectedData.genomicSection.gene.name ?? 'N/A'}}</div>
        <div data-test="chromosome-name">Chromosome: {{props.selectedData.genomicSection.chromosome}}</div>
        <div data-test="start-stop">Region: {{props.selectedData.genomicSection.regionLabel}}</div>
        <div>Orientation: {{props.selectedData.genomicSection.isInverted ? '-' : '+'}}</div>
        <div v-if="props.selectedData.genomicSection.chainLevel != null" data-test="level">Level: {{props.selectedData.genomicSection.chainLevel}}</div>
      </template>

      <template v-else-if="props.selectedData?.type === 'geneLabel'">
        <template v-if="!labelModal">
          <div data-test="gene-symbol">
            Symbol:
            <Button
              class="p-button-link rgd-link"
              @click="goToRgd(props.selectedData.genomicSection.gene.rgdId)"
            >
              <b>{{props.selectedData.genomicSection.gene.symbol}}</b>
              <i class="pi pi-link external-link"></i>
            </Button>
          </div>
          <div data-test="gene-name">Name: {{props.selectedData.genomicSection.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{props.selectedData.genomicSection.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.gene.stop)}}</div>
          <Divider />

          <template v-for="gene in props.selectedData.genomicSection?.combinedGenes" :key="gene">
            <div data-test="gene-symbol">
              Symbol: 
              <Button
                class="p-button-link rgd-link"
                @click="goToRgd(gene.gene.rgdId)"
              >
                <b>{{gene.gene.symbol}}</b>
                <i class="pi pi-link external-link"></i>
              </Button>
            </div>
            <div data-test="gene-name">Name: {{gene.gene.name ?? 'N/A'}}</div>
            <div data-test="chromosome-name">Chromosome: {{gene.gene.chromosome}}</div>
            <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</div>
            <Divider />
          </template>
        </template>

        <template v-else >
          <div data-test="gene-symbol">
            Symbol:
            <Button
              class="p-button-link rgd-link"
              @click="goToRgd(props.selectedData.genomicSection.gene.rgdId)"
            >
              <b>{{props.selectedData.genomicSection.gene.symbol}}</b>
              <i class="pi pi-link external-link"></i>
            </Button>
          </div>
          <div data-test="gene-name">Name: {{props.selectedData.genomicSection.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{props.selectedData.genomicSection.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.gene.stop)}}</div>
          <Divider />


          <template v-for="gene in props.selectedData.genomicSection?.combinedGenes" :key="gene">
            <div data-test="gene-symbol">
              Symbol:
              <Button
                class="p-button-link rgd-link"
                @click="goToRgd(gene.gene.rgdId)"
              >
                <b>{{gene.gene.symbol}}</b>
                <i class="pi pi-link external-link"></i>
              </Button></div>
            <div data-test="gene-name"> Name: {{gene.gene.name ?? 'N/A'}}</div>
            <div data-test="chromosome-name">Chromosome: {{gene.gene.chromosome}}</div>
            <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</div>
            <Divider />
          </template>
        </template>
      </template>

      <template v-else-if="props.selectedData?.type === 'orthologLine'">
        <div data-test="start-stop">BACKBONE GENE:</div>
        <div data-test="gene-symbol">Symbol: {{props.selectedData.genomicSection.backboneGene.gene.symbol}}</div>
        <div data-test="gene-name">Name:{{props.selectedData.genomicSection.backboneGene.gene.name ?? 'N/A'}}</div>
        <div data-test="chromosome-name">Chromosome: {{props.selectedData.genomicSection.backboneGene.gene.chromosome}}</div>
        <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.backboneGene.gene.start)}} - {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.backboneGene.gene.stop)}}</div>

        <div data-test="start-stop">&lt;---------------------------------------&gt;</div>

        <div data-test="start-stop">COMPARATIVE GENE HOMOLOG:</div>
        <div data-test="gene-symbol">Species: {{props.selectedData.genomicSection.comparativeGene.gene.speciesName}}</div>
        <div data-test="gene-symbol">Symbol: {{props.selectedData.genomicSection.comparativeGene.gene.symbol}}</div>
        <div data-test="gene-name">Name:{{props.selectedData.genomicSection.comparativeGene.gene.name ?? 'N/A'}}</div>
        <div data-test="chromosome-name">Chromosome: {{props.selectedData.genomicSection.comparativeGene.gene.chromosome}}</div>
        <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.comparativeGene.gene.start)}} - {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.comparativeGene.gene.stop)}}</div>
    </template>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import SelectedData from '@/models/SelectedData';
import SVGConstants from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import { computed, } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const DEFAULT_WIDTH = 130;
const DEFAULT_HEIGHT = 55;
const MAX_HEIGHT = 350;

const store = useStore(key);

interface Props
{
  selectedData: SelectedData | null;
}

const props = defineProps<Props>();

const labelModal = computed(() =>
{
  if (!props.selectedData)
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

const clearSelectedGenes = () => {
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedData', null);
};

const width = computed(() => {
  if (props.selectedData == null || props.selectedData.genomicSection.gene == null)
  {
    return DEFAULT_WIDTH;
  }

  const geneName = props.selectedData.genomicSection.gene.name;
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
  if (props.selectedData == null || props.selectedData?.type == 'trackSection')
  {
    return DEFAULT_HEIGHT;
  }

  if (props.selectedData?.type == 'orthologLine')
  {
    return 200;
  }

  const combinedGenes = props.selectedData.genomicSection.combinedGenes;
  const hiddenGenes = props.selectedData.genomicSection.hiddenGenes;
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


const labelYPosition = (index: number, textLine: number) => {
  index = index + 1;
  let yPos = ((index * 50) + (textLine * 10)) + SVGConstants.overviewTrackYPosition;
  return yPos;
};

const goToRgd = (rgdId: number) => {
  const rgdUrl = `https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=${rgdId}`;
  window.open(rgdUrl);
};
</script>

<style lang="scss" scoped>
.gene-data
{
  overflow-y: scroll;
  max-height: 550px;
}

.rgd-link
{
  padding: 0;
}

.external-link
{
  padding-left: 4px;
}
</style>
