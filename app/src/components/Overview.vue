<template>
  <va-card square outlined color="background" class="comparative-summary">
    <div class="row">
      <div class="flex md10">
        <h5 class="display-5">Configuration</h5>
      </div>
      <div class="flex md2 right-aligned">
        <va-button @click="goToConfigurationScreen">Load New Configuration</va-button>
      </div>
    </div>
    <va-divider />
    <div class="row">
      <div class="flex md4">
        <h6 class="display-6">Comparative Species</h6>
        <ul class="va-unordered">
          <li v-for="species in comparativeSpecies" :key="species.id">
            <p>{{species.name}}</p>
            <p class="species-description">{{species.syntenyString}}</p>
          </li>
        </ul>
      </div>
      <div class="flex md4">
        <h6 class="display-6">Backbone</h6>
        <p v-if="backboneSpecies">Species: {{backboneSpecies.name}}</p>
      </div>
      <div class="flex md4">
        <h6 class="display-6">Data Tracks</h6>
        <div v-for="track in dataTracks" class="row" :key="track.id">
          <div class="flex md-9">
            {{track.name}}
          </div>
        </div>
      </div>
    </div>
  </va-card>
</template>

<script lang="ts">
import Species from '@/models/Species';
import { defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default defineComponent({
  setup() {
    const store = useStore();
    const router = useRouter();

    // Reactive Props
    const comparativeSpecies = ref([
      { id: 1, name: 'Rattus Norvegicus', syntenyString: 'Synteny in chr1, chr4, chr11' },
      { id: 2, name: 'Equus Caballus', syntenyString: 'Synteny in chr2, chr7' }
    ]);

    let backboneSpecies = ref<Species | null>(null);

    const dataTracks = ref([
      { id: 1, name: 'Clinical', color: 'blue' }
    ]);

    onMounted(() => {
      console.log('Overview mounted');
      backboneSpecies.value = store.getters.getSpecies;
    });

    const goToConfigurationScreen = () => {
      router.push('/');
    };

    return {
      comparativeSpecies,
      backboneSpecies,
      dataTracks,
      goToConfigurationScreen
    };
  },
});
</script>

<style lang="scss" scoped>
.va-card.comparative-summary
{
  padding: 0.75rem;
}

p.species-description
{
  margin-left: 0.25rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
