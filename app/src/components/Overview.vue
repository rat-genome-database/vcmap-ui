<template>
  <div class="grid">
    <div class="col-12">
      <Panel :toggleable="true" class="vcmap-panel">
        <template #header>
          <div class="overview-header">
            <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.jpg">
            <h3 class="header">VCMap</h3>
          </div>
        </template>
        <template #icons>
          <Button 
            @click="goToConfigurationScreen"
            v-tooltip.left="'Load New Configuration'" 
            icon="pi pi-cog" 
            class="p-panel-header-icon p-link p-mr-2" 
            data-test="load-config-btn" />
        </template>
        <div class="grid p-d-flex">
          <BackboneOverview />
          <Divider layout="vertical" />
          <DataTracksOverview />
          <Divider layout="vertical" />
          <ComparativeSpeciesOverview />
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
.overview-header
{
  display: inline-flex;
  align-items: center;
  .header
  {
    margin-left: 2rem;
  }
}
</style>
