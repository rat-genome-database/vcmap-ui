<template>
    <div class="label-row">
        <div>
            <span class="label">Variant Section:</span>
            <span>{{ props.speciesName }} </span>
        </div>
    </div>
    <div>
        <span class="label">Chr{{ props.chromosome }}: </span>
        <Button
            class="p-button-link rgd-link"
            @click="selectRegion()"
            v-tooltip.left="`Zoom to region`"
        >
            <b>{{ Formatter.addCommasToBasePair(props.speciesStart ?? null) }} - {{ Formatter.addCommasToBasePair(props.speciesStop ?? null) }}</b>
        </Button>
    </div>
    <div>
        <span class="label">Variant Count: </span>
        <span>{{ Formatter.addCommasToBasePair(props.variantCount ?? null) }}</span>
    </div>
    <div>
        <Button
            class="p-button-link rgd-link secondary-link"
            @click="goToVariantVisualizer"
        >
            <b>View in RGD Variant Visualizer</b>
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
import { Formatter } from '@/utils/Formatter';
import { useStore } from 'vuex';
import { key } from '@/store';
import { useLogger } from 'vue-logger-plugin';
import { computed } from 'vue';
import { createJBrowse2UrlForGenomicSection, createVariantVisualizerUrl } from '@/utils/ExternalLinks';
import { BackboneAlignment } from '@/models/GenomicSection';

const $log = useLogger();
const store = useStore(key);
const SEARCHED_GENE_WINDOW_FACTOR = 3;

interface Props {
    mapName: string,
    speciesName: string,
    speciesStart: number,
    speciesStop: number,
    chromosome: string,
    backboneAlignment: BackboneAlignment,
    variantCount: number,
}

const props = defineProps<Props>();

const mapKey = computed(() => {
    // iterate through store.state.comparativeSpecies and find the mapKey for the species that matches props.variantSection?.genomicSection.speciesName. If not then return store.state.species.activeMap.key
    for (const species of store.state.comparativeSpecies) {
        if (species.name === props.speciesName) {
            return species.activeMap.key;
        }
    }
    return store.state.species?.activeMap.key ?? null;
});

const selectRegion = () => {
    const speciesStart = props.speciesStart;
    const speciesStop = props.speciesStop;
    const sectionLength = speciesStop - speciesStart;

    const bbStart = props.backboneAlignment.start;
    const bbStop = props.backboneAlignment.stop;

    // New variant sections will be processed on navigation, is there selected data we CAN keep?
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedVariantSections', []);
    store.dispatch('setSelectedData', []);

    if (store.state.chromosome == null) {
        $log.error(`Chromosome in state is null. Cannot dispatch setDetailedBasePairRequest action.`);
        return;
    }

    store.dispatch('setDetailedBasePairRequest', {
        start: Math.max(bbStart - (sectionLength * SEARCHED_GENE_WINDOW_FACTOR), 0),
        stop: Math.min(bbStop + (sectionLength * SEARCHED_GENE_WINDOW_FACTOR), store.state.chromosome.seqLength)
    });
};

const goToVariantVisualizer = () => {
    if (mapKey.value === null) {
        return;
    }
    const rgdUrl = createVariantVisualizerUrl(mapKey.value, props.chromosome, props.speciesStart, props.speciesStop);
    window.open(rgdUrl);
};

const goToJBrowse2 = () => {
  const url = createJBrowse2UrlForGenomicSection(props.mapName, props.chromosome, props.speciesStart, props.speciesStop);
  window.open(url);
};

</script>

<style lang="scss" scoped>
.label-row {
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

.external-link {
    padding-left: 4px;
}

.label {
    font-weight: bold;
    margin-right: 10px;
}

.bp-range-link {

}
</style>