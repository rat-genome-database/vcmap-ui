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
import { getNewSelectedData } from '@/utils/DataPanelHelpers';

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
  const newData = getNewSelectedData(store, gene);
  store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
  store.dispatch('setSelectedData', newData.selectedData);
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