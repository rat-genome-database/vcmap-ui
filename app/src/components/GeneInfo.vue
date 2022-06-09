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
  <div v-if="gene" data-test="gene-name">Name: {{gene.name ?? 'N/A'}}</div>
  <div data-test="chromosome-name">Chromosome: {{chromosome}}</div>
  <div data-test="start-stop">
    Region: {{Formatter.addCommasToBasePair(start)}} -
      {{Formatter.addCommasToBasePair(stop)}}
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
import { getGeneOrthologIds, updateSelectedData } from '@/utils/DataPanelHelpers';

const store = useStore(key);

interface Props
{
  gene: Gene | null;
  chromosome: string;
  start: number;
  stop: number;
  chainLevel?: number;
  trackOrientation?: string;
}

defineProps<Props>();

const selectGene = (gene: Gene) => {
  const geneOrthologIds = getGeneOrthologIds(store, gene) || [];
  const rgdIds: number[] = [gene?.rgdId] || [];
  store.dispatch('setSelectedGeneIds', [...rgdIds, ...geneOrthologIds] || []);
  updateSelectedData(store, gene);
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
</style>