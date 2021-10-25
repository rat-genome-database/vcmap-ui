<template>
  <div class="row header">
    <div class="flex md12 center-aligned">
      <h4 class="display-4">Configuration</h4>
    </div>
  </div>
  <div class="row">
    <div class="flex md6 offset--md3">
      <div class="row">
        <div class="flex md12">
          <va-select 
            label="Backbone Species"
            class="configuration-input" 
            @update:modelValue="updateSpeciesStore"
            v-model="selectedSpecies" 
            :options="speciesOptions"
            :track-by="species => species.typeKey"
            :text-by="species => species.name"
            outline />
        </div>
      </div>
      <div class="row">
        <div class="flex md6 offset--md3 center-aligned">
          <va-button @click="goToMainScreen">Load VCMap</va-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import SpeciesApi from '@/api/SpeciesApi';
import Species from '@/models/Species';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default defineComponent({
  setup() {
    const router = useRouter();
    const store = useStore();
    
    // Reactive Properties
    let speciesOptions = ref<Species[]>([]);
    let selectedSpecies = ref({});

    // Lifecycle Hooks
    onMounted(async () => {
      speciesOptions.value = await SpeciesApi.getSpecies();
    });

    // Methods
    const goToMainScreen = () => {
      router.push('/main');
    };

    const updateSpeciesStore = (species: Species) => {
      store.dispatch('setSpecies', species);
    };

    return {
      speciesOptions,
      selectedSpecies,
      goToMainScreen,
      updateSpeciesStore
    };
  },
});
</script>

<style lang="scss" scoped>
.configuration-input
{
  padding: 0.5em;
}
</style>
