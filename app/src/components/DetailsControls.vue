<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4>Details</h4>
      <div class="grid unpadded">
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold">{{comparativeSpecies?.map(s => s.name).join(', ')}}</div>
        <div class="col-5">Synteny Threshold:</div>
        <div class="col-7 bold">{{syntenyThreshold}}bp</div>
        <div class="col-5">Zoom Level:</div>
        <div class="col-7 bold"><Zoom type="comparative" :min="1" /></div>
        <div class="col-5">Show Gaps:</div>
        <div class="col-7">
          <div class="p-field-checkbox">
            <Checkbox id="gaps" v-model="showGaps" :binary="true" @input="changeDetailsGaps" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import Zoom from '@/components/Zoom.vue';

const store = useStore();

let showGaps = ref<boolean>(false);

onMounted(() => {
  showGaps.value = store.getters.getShowDetailsGaps;
});

const comparativeSpecies = computed(() => {
  let species = [];
  if (store.getters.getComparativeSpeciesOne)
  {
    species.push(store.getters.getComparativeSpeciesOne as Species);
  }

  if (store.getters.getComparativeSpeciesTwo)
  {
    species.push(store.getters.getComparativeSpeciesTwo as Species);
  }

  return species;
});

const syntenyThreshold = computed(() => {
  return store.getters.getComparativeSyntenyThreshold;
});

const changeDetailsGaps = (val: boolean) => {
  store.dispatch('setShowDetailsGaps', val);
};
</script>
