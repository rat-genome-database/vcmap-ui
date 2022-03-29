<template>
  <Panel>
    <template #header>
      <div class="selected-data-header">
        <div>
          Selected Genes
          <Button
            label="Clear Selection"
            class="p-button-info"
            @click="clearSelectedGenes"
          />
        </div>
        <!--@item-select="setGeneChromosomeAndDefaultStartAndStopPositions($event.value)"-->
        <div>
          <AutoComplete
            v-model="searchedGene"
            :suggestions="geneSuggestions"
            @complete="searchGene($event)"
            field="symbol"
            :minLength="3"
          />
        </div>
      </div>
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
        <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.sectionStart)}} - {{Formatter.addCommasToBasePair(props.selectedData.genomicSection.sectionStop)}}</div>
        <div>Orientation: {{props.selectedData.genomicSection.isInverted ? '-' : '+'}}</div>
        <div v-if="props.selectedData.genomicSection.chainLevel != null" data-test="level">Level: {{props.selectedData.genomicSection.chainLevel}}</div>
      </template>

      <template v-else-if="props.selectedData?.type === 'geneLabel'">
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
import Gene from '@/models/Gene';
import SpeciesApi from '@/api/SpeciesApi';
import { Formatter } from '@/utils/Formatter';
import { ref, computed, } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);

interface Props
{
  selectedData: SelectedData | null;
}

const props = defineProps<Props>();

const searchedGene = ref<Gene | null>(null);
const geneSuggestions = ref<Gene[]>([]);

const clearSelectedGenes = () => {
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedData', null);
};

const searchGene = async (event: {query: string}) => {
  const backboneSpeciesKey = store.state.species?.activeMap.key;
  if (backboneSpeciesKey) {
    try {
      const matches = await SpeciesApi.getGenesBySymbol(backboneSpeciesKey, event.query)
      geneSuggestions.value = matches;
    } catch (err: any) {
      // TODO could probably use a better error handle there too...
      // onApiError(err, 'An error occurred while looking up genes');
      console.log(err);
    }
  }
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
  height: 550px;
}

.rgd-link
{
  padding: 0;
}

.external-link
{
  padding-left: 4px;
}

.selected-data-header.p-panel-header
{
  flex-direction: column
}
</style>
