<template>
    <div class="label-row">
        <div>
            <span class="label">Variant Section:</span>
            <span>{{ props.variantSection?.genomicSection.speciesName }} </span>
        </div>
        <Button
            class="p-button-link rgd-link"
            v-tooltip.left="`View in RGD`"
            @click="goToRgd()"
        >
            <i class="pi pi-external-link external-link"></i>
        </Button>
    </div>
    <div>
        <span class="label">Chr{{ props.variantSection?.genomicSection.chromosome }}: </span>
        <Button
            class="p-button-link rgd-link"
            @click="selectRegion()"
            v-tooltip.left="`Zoom to region`"
        >
            <b>{{ Formatter.addCommasToBasePair(props.variantSection?.genomicSection.speciesStart) }} - {{ Formatter.addCommasToBasePair(props.variantSection?.genomicSection.speciesStop) }}</b>
        </Button>
    </div>
    <div>
        <span class="label">Variant Count: </span>
        <span>{{ Formatter.addCommasToBasePair(props.variantSection?.genomicSection.variantCount) }}</span>
    </div>
</template>

<script setup lang="ts">
import { Formatter } from '@/utils/Formatter';
import { useStore } from 'vuex';
import { key } from '@/store';
import { useLogger } from 'vue-logger-plugin';
import { VariantDensity } from '@/models/DatatrackSection';
import { computed } from 'vue';

const $log = useLogger();
const store = useStore(key);
const SEARCHED_GENE_WINDOW_FACTOR = 3;

interface Props {
    variantSection: VariantDensity | null;
}

const props = defineProps<Props>();

const mapKey: number = computed(() => {
    // iterate through store.state.comparativeSpecies and find the mapKey for the species that matches props.variantSection?.genomicSection.speciesName. If not then return store.state.species.activeMap.key
    for (const species of store.state.comparativeSpecies) {
        if (species.name === props.variantSection?.genomicSection.speciesName) {
            return species.activeMap.key;
        }
    }
    return store.state.species.activeMap.key;
});

const selectRegion = () => {
    const section = props.variantSection.genomicSection;

    const speciesStart = section.speciesStart;
    const speciesStop = section.speciesStop;
    const sectionLength = speciesStop - speciesStart;

    const bbStart = section.backboneAlignment.start;
    const bbStop = section.backboneAlignment.stop;

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

const goToRgd = () => {
    const speciesStart = props.variantSection?.genomicSection.speciesStart;
    const speciesStop = props.variantSection?.genomicSection.speciesStop;
    const speciesChromosome = props.variantSection?.genomicSection.chromosome;
    const rgdUrl = `https://rgd.mcw.edu/rgdweb/front/config.html?mapKey=${mapKey.value}&chr=${speciesChromosome}&start=${speciesStart}&stop=${speciesStop}`;
    window.open(rgdUrl);
};

</script>

<style lang="scss" scoped>
.label-row {
    display: flex;
    justify-content: space-between;
}

.rgd-link {
    padding-bottom: 0;
    padding-left: 0;
    padding-top: 0;
    overflow: hidden;
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