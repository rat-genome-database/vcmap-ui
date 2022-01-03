<template>
  <div class="grid">
    <div class="col-12">
      <Panel :toggleable="true" class="vcmap-panel">
        <template #header>
          <div class="vcmap-header">
            <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.jpg">
            <h3 class="header">VCMap</h3><span class="version-label">v{{VERSION}}</span>
          </div>
        </template>
        <template #icons>
          <Button 
            @click="goToConfigurationScreen"
            v-tooltip.left="'Edit Configuration'" 
            icon="pi pi-cog" 
            class="p-panel-header-icon p-link p-mr-2" 
            data-test="load-config-btn" />
        </template>
        <div class="grid p-d-flex">
          <OverviewControls />
          <Divider layout="vertical" />
          <DataTracksOverview />
          <Divider layout="vertical" />
          <DetailsControls />
        </div>
      </Panel>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import OverviewControls from '@/components/OverviewControls.vue';
import DataTracksOverview from '@/components/DataTracksOverview.vue';
import DetailsControls from '@/components/DetailsControls.vue';
import { VERSION } from '@/version';

const router = useRouter();

const goToConfigurationScreen = () => {
  router.push('/');
};
</script>

<style lang="scss" scoped>
.vcmap-header
{
  display: inline-flex;
  align-items: center;
  .header
  {
    margin-left: 2rem;
  }
}
</style>
