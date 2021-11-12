<template>
  <div class="grid">
    <div class="col-12">
      <Panel header="Overview" :toggleable="true">
        <template #icons>
          <Button 
            @click="goToConfigurationScreen" 
            v-tooltip.left="'Load New Configuration'" 
            icon="pi pi-cog" 
            class="p-button-rounded overview-btn" 
            data-test="load-config-btn" />
        </template>
        <div class="grid p-d-flex">
          <ComparativeSpeciesOverview />
          <Divider layout="vertical" />
          <BackboneOverview />
          <Divider layout="vertical" />
          <DataTracksOverview />
        </div>
      </Panel>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import BackboneOverview from '@/components/BackboneOverview.vue';
import DataTracksOverview from '@/components/DataTracksOverview.vue';
import ComparativeSpeciesOverview from '@/components/ComparativeSpeciesOverview.vue';

const router = useRouter();

const goToConfigurationScreen = () => {
  router.push('/');
};
</script>

<style lang="scss" scoped>
.overview-btn
{
  margin-right: 1rem;
}
</style>
