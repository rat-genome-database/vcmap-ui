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
  <div>
    <Button
      class="p-button-link rgd-link secondary-link"
      @click="goToRgdGeneSummary"
    >
      <b>View RGD Gene Report</b>
    </Button>
  </div>
  <div>
    <Button
      class="p-button-link rgd-link secondary-link"
      @click="goToJBrowse2"
    >
      <b>View in RGD JBrowse</b>
    </Button>
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
import { urlConstants } from '@/utils/Urls';

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

const goToRgdGeneSummary = () => {
  if (props.gene == null) {
    return null;
  }

  const rgdUrl = `${urlConstants.geneReport}?id=${props.gene.rgdId}`;
  window.open(rgdUrl);
};

const goToJBrowse2 = () => {
  if (props.gene == null || store.state.species == null) {
    return null;
  }

  const geneSpecies = [store.state.species, ...store.state.comparativeSpecies]
    .find(s => s.activeMap.key === props.gene?.mapKey);

  if (geneSpecies == null) {
    return null;
  }

  const url = `${urlConstants.jbrowse2}?dest=jbrowse2&assembly=${geneSpecies.activeMap.name}&loc=chr${props.gene.chromosome}:${props.gene.start}-${props.gene.stop}`;
  window.open(url);
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

  &.secondary-link {
    font-size: 12px;
  }

  &:hover {
    color: deepskyblue;
  }
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