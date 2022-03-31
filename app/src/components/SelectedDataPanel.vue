<template>
  <Panel>
    <template #header>
      <div class="selected-data-header">
        <div class="panel-header-item">
          <b>Selected Data</b>
        </div>
        <div class="panel-header-item">
          <Button
            label="Clear Selection"
            class="p-button-info"
            @click="clearSelectedGenes"
          />
        </div>
        <div class="panel-header-item">
          <Button
            icon="pi pi-search"
            @click="searchSVG()"
          />
          <AutoComplete
            v-model="searchedGene"
            :suggestions="geneSuggestions"
            @complete="searchGene($event)"
            :field="getSuggestionDisplay"
            :minLength="3"
            placeholder="Search loaded genes..."
          />
        </div>
      </div>
    </template>
    <div class="gene-data">

      <template v-if="searchedGene && showSearch">
        <div class="searched-gene-divider">Searched Gene</div>
        <div>
          Symbol:
          <Button
            class="p-button-link rgd-link"
            @click="goToRgd(searchedGene?.rgdId || -1)"
          >
            <b>{{searchedGene.symbol}}</b>
            <i class="pi pi-link external-link"></i>
          </Button>
        </div>
        <div>Name: {{searchedGene.name}}</div>
        <div>Chromosome: {{searchedGene.chromosome}}</div>
        <div>Region: {{Formatter.addCommasToBasePair(searchedGene.start)}} - {{Formatter.addCommasToBasePair(searchedGene.stop)}}</div>
        <Divider><b>Highlighted Sections</b></Divider>
      </template>

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
import { Formatter } from '@/utils/Formatter';
import { ref } from 'vue';
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
const showSearch = ref<boolean>(false);

const clearSelectedGenes = () => {
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedData', null);
  store.dispatch('setGene', null);
  searchedGene.value = null;
  showSearch.value = false;
};

const searchGene = (event: {query: string}) => {
  const loadedGenes = store.state.loadedGenes;
  let matches: Gene[] = loadedGenes.filter((gene) => gene.symbol.toLowerCase().includes(event.query.toLowerCase()));
  geneSuggestions.value = matches;
};

const searchSVG = () => {
  store.dispatch('setGene', searchedGene.value);
  store.dispatch('setSelectedGeneIds', [searchedGene.value?.rgdId] || []);
  showSearch.value = true;
};

const goToRgd = (rgdId: number) => {
  const rgdUrl = `https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=${rgdId}`;
  window.open(rgdUrl);
};

const getSuggestionDisplay = (item: any) => {
  return `${item.symbol} - ${item.speciesName}`;
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

.selected-data-header
{
  flex-direction: column;
}

.panel-header-item
{
  padding-bottom: 10px;
}

.searched-gene-divider
{
  padding-bottom: 1rem;
  font-weight: bold;
}
</style>
