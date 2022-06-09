<template>
  <div v-if="gene">
    <div class="gene-row">
      <div>
        Symbol:
        <Button
          class="p-button-link rgd-link"
          @click="selectGene(gene)"
        >
          <b>{{gene.symbol}}</b>
        </Button>
      </div>
      <div>
        <Button
          class="p-button-link rgd-link"
          @click="goToRgd(gene.rgdId)"
        >
          <i class="pi pi-external-link external-link"></i>
        </Button>
      </div>
    </div>
  </div>
  <div data-test="gene-name">Name: {{gene.name ?? 'N/A'}}</div>
  <div data-test="chromosome-name">Chromosome: {{chromosome}}</div>
  <div data-test="start-stop">
    Region: {{Formatter.addCommasToBasePair(start)}} -
      {{Formatter.addCommasToBasePair(stop)}}
  </div>
</template>

<script setup lang="ts">
import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { Formatter } from '@/utils/Formatter';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);

interface Props
{
  gene: Gene | null;
  chromosome: number;
  start: number;
  stop: number;
  chainLevel: number | null;
}

const props = defineProps<Props>();

const selectGene = (gene: Gene) => {
  const geneOrthologIds = getGeneOrthologIds(gene) || [];
  const rgdIds: number[] = [gene?.rgdId] || [];
  store.dispatch('setSelectedGeneIds', [...rgdIds, ...geneOrthologIds] || []);
  updateSelectedData(gene);
};

const goToRgd = (rgdId: number) => {
  const rgdUrl = `https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=${rgdId}`;
  window.open(rgdUrl);
};

// TODO: methods below here should be moved to a util?
const getGeneOrthologIds = (gene: Gene) => {
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  let geneOrthologIds: number[] = [];
  if (geneOrthologs) {
    geneOrthologIds = Object.keys(geneOrthologs).map((geneKey) => geneOrthologs[geneKey][0].geneRgdId);
  }
  return geneOrthologIds;
};

const updateSelectedData = (gene: Gene) => {
  console.log(gene);
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  const selectedData = [new SelectedData(gene, 'Gene')];
  if (geneOrthologs) {
    let geneKeys = Object.keys(geneOrthologs);
    for (let i = 0; i < geneKeys.length; i++) {
      let ortholog = new Gene(geneOrthologs[geneKeys[i]][0]);
      selectedData.push(new SelectedData(ortholog, 'Gene'));
    }
  }
  store.dispatch('setSelectedData', selectedData);
};

</script>

<style lang="scss" scoped>
.gene-row
{
  display: flex;
  justify-content: space-between;
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