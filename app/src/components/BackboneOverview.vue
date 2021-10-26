<template>
  <h6 class="display-6">Backbone</h6>
  <p v-if="backboneSpecies" data-test="backbone-overview-species">Species: {{backboneSpecies.name}}</p>
</template>

<script lang="ts">
import Species from '@/models/Species';
import { defineComponent, onMounted, ref } from 'vue'
import { useStore } from 'vuex';

export default defineComponent({
  setup() {
    const store = useStore();

    let backboneSpecies = ref<Species | null>(null);

    onMounted(() => {
      backboneSpecies.value = store.getters.getSpecies;
    });

    return {
      backboneSpecies
    };
  },
})
</script>
