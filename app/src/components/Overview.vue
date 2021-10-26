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
        <ComparativeSpeciesOverview />
      </div>
      <div class="flex md4">
        <BackboneOverview />
      </div>
      <div class="flex md4">
        <DataTracksOverview />
      </div>
    </div>
  </va-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import BackboneOverview from '@/components/BackboneOverview.vue';
import DataTracksOverview from '@/components/DataTracksOverview.vue';
import ComparativeSpeciesOverview from '@/components/ComparativeSpeciesOverview.vue';

export default defineComponent({
  components: {
    BackboneOverview,
    DataTracksOverview,
    ComparativeSpeciesOverview
  },
  setup() {
    const router = useRouter();

    const goToConfigurationScreen = () => {
      router.push('/');
    };

    return {
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
</style>
