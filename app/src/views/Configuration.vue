<template>
  <div class="grid">
    <div class="col-12 text-center">
      <h2>Configuration</h2>
    </div>
    <div class="col-12">
      <div class="grid">
        <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
          <h4>Backbone Species</h4>
          <Dropdown 
            v-model="selectedSpecies" 
            :options="speciesOptions" 
            :loading="isLoadingSpecies"
            @change="updateSpeciesStore"
            optionLabel="name" 
            placeholder="Backbone species" />
        </div>
        <div class="col-12 text-center">
          <Button @click="goToMainScreen" label="Load VCMap" icon="pi pi-play" class="p-button-lg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import SpeciesApi from '@/api/SpeciesApi';
import Species from '@/models/Species';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

// Reactive Properties
let speciesOptions = ref<Species[]>([]);
let selectedSpecies = ref({});
let isLoadingSpecies = ref(false);

// Lifecycle Hooks
onMounted(async () => {
  isLoadingSpecies.value = true;
  try
  {
    speciesOptions.value = await SpeciesApi.getSpecies();
  }
  catch (err)
  {
    console.error(err);
  }
  finally
  {
    isLoadingSpecies.value = false;
  }
  
  if (store.getters.getSpecies)
  {
    selectedSpecies.value = store.getters.getSpecies;
  }
});

// Methods
const goToMainScreen = () => {
  router.push('/main');
};

const updateSpeciesStore = (event: any) => {
  store.dispatch('setSpecies', event.value);
};

</script>

<style lang="scss" scoped>
.p-dropdown
{
  width: 100%;
}
</style>
