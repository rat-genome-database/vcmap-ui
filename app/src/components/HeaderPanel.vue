<template>
  <div class="grid">
    <div class="col-12">
      <Panel :toggleable="true" class="vcmap-panel">
        <template #header>
          <div class="vcmap-header">
            <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.png">
            <h3 class="header">VCMap</h3><span class="version-label">v{{VERSION}}</span>
          </div>
        </template>
        <template #icons>
          <Button 
            label="New Configuration" 
            class="p-button-info header-btn"
            @click="goToConfigurationScreen"
            data-test="load-config-btn" />
        </template>
        <div class="grid p-d-flex">
          <OverviewControls />
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

.p-button.p-component.header-btn
{
  margin-right: 1rem;
}
</style>
