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
import { getNewSelectedData } from '@/utils/DataPanelHelpers';
import { inject } from 'vue';
import { querySyntenyForSearchZoomKey } from '@/injection_keys/main';
import useGeneSearchAndSelect from '@/composables/useGeneSearchAndSelect';

const $log = useLogger();
const store = useStore(key);

const queryForSynteny = inject(querySyntenyForSearchZoomKey);
const { getWindowBasePairRangeForGene } = useGeneSearchAndSelect(store);

interface Props
{
  gene: Gene | null; // TODO: Should we allow null here?
  chromosome: string;
  start: number;
  stop: number;
  geneList: Map<number, Gene>;
  chainLevel?: number;
  trackOrientation?: string;
}

const props = defineProps<Props>();

const selectGene = async (gene: Gene | null) => {
  if (gene == null)
  {
    $log.warn(`Selected gene is null`);
    return;
  }

  if (!gene.backboneStart || !gene.backboneStop) {
    return;
  }

  const newData = getNewSelectedData(store, gene, props.geneList);
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedVariantSections', []);
  store.dispatch('setSelectedGeneIds', newData.rgdIds);
  store.dispatch('setSelectedData', newData.selectedData);

  if (store.state.chromosome == null || queryForSynteny == null)
  {
    $log.error(
      `Backbone chromosome or queryForSynteny function is not defined or null. Cannot dispatch setDetailedBasePairRequest action.`,
      store.state.chromosome,
      queryForSynteny,
    );
    return;
  }

  const windowRange = await getWindowBasePairRangeForGene(queryForSynteny, store.state.chromosome, gene.rgdId, props.geneList);

  store.dispatch('setDetailedBasePairRequest', {
    range: windowRange,
    source: gene.symbol
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