<template>
  <div v-if="gene">
    <div class="gene-row">
      <div>
        <Button
          class="p-button-link rgd-link"
          @click="selectGene(gene)"
        >
          <b>{{gene.symbol}}</b>
        </Button>
        <span v-if="gene" data-test="gene-name">({{gene.name ?? 'N/A'}})</span>
      </div>
      <div v-if="gene != null">
        <!-- Using '!' to assert that gene is for sure not null here as it is being checked in the parent div's v-if directive -->
        <Button
          class="p-button-link rgd-link"
          v-tooltip.left="`View in RGD`"
          @click="goToRgd(gene!.rgdId)"
        >
          <i class="pi pi-external-link external-link"></i>
        </Button>
      </div>
    </div>
  </div>

  <div>
    <span v-if="gene" data-test="species-name" class="species-label">{{gene.speciesName ?? 'N/A'}} </span>
    <span data-test="chromosome-name">Chr{{chromosome}}: </span>
    <span data-test="start-stop">
      {{Formatter.addCommasToBasePair(start)}} - {{Formatter.addCommasToBasePair(stop)}}
    </span>
  </div>
  <div v-if="trackOrientation">Orientation: {{trackOrientation}}</div>
  <div v-if="chainLevel"
    data-test="level">
      Level: {{chainLevel}}
  </div>
</template>

<script setup lang="ts">
import Gene from '@/models/Gene';
import { Formatter } from '@/utils/Formatter';
import { useStore } from 'vuex';
import { key } from '@/store';
import { useLogger } from 'vue-logger-plugin';
import SelectedData from '@/models/SelectedData';

const $log = useLogger();
const store = useStore(key);
const SEARCHED_GENE_WINDOW_FACTOR = 3;

interface Props
{
  gene: Gene | null; // TODO: Should we allow null here?
  chromosome: string;
  start: number;
  stop: number;
  chainLevel?: number;
  trackOrientation?: string;
}

defineProps<Props>();

const selectGene = (gene: Gene | null) => {
  if (gene == null)
  {
    $log.warn(`Selected gene is null`);
    return;
  }

  const geneLength = gene.stop - gene.start;
  if (!gene.backboneStart || !gene.backboneStop) {
    return;
  }

  //const newData = getNewSelectedData(store, gene);
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedGeneIds', [gene.rgdId]);
  store.dispatch('setSelectedData', [new SelectedData(gene, 'Gene')]);

  if (store.state.chromosome == null)
  {
    $log.error(`Chromosome in state is null. Cannot dispatch setDetailedBasePairRequest action.`);
    return;
  }

  store.dispatch('setDetailedBasePairRequest', {
    start: Math.max(gene.backboneStart - (geneLength * SEARCHED_GENE_WINDOW_FACTOR), 0),
    stop: Math.min(gene.backboneStop + (geneLength * SEARCHED_GENE_WINDOW_FACTOR), store.state.chromosome.seqLength)
  });
};

const goToRgd = (rgdId: number) => {
  const rgdUrl = `https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=${rgdId}`;
  window.open(rgdUrl);
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
  padding-bottom: 0;
  padding-left: 0;
  padding-top: 0;
}

.external-link
{
  padding-left: 4px;
}

.species-label
{
  font-weight: bold;
  margin-right: 10px;
}
</style>