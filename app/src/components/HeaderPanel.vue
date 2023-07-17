<template>
  <div class="grid">
    <div class="col-12">
      <Panel :toggleable="true" class="vcmap-panel">
        <template #header>
          <div class="vcmap-header">
            <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.png">
            <Tag icon="pi pi-tag" severity="info" rounded>v{{ VERSION }}</Tag>
          </div>
        </template>
        <template #icons>
          <div class="icon-container">
            <a  href="https://rgd.mcw.edu/" target="_blank"><img class="rgd-logo" src="../assets/images/rgd_logo.png" alt="RGD logo"
              v-tooltip.bottom="`Go to RGD Home Page`"
            ></a>
            <Button 
              label="New Configuration"
              icon="pi pi-cog" 
              class="p-button-secondary header-btn"
              @click="goToConfigurationScreen"
              data-test="load-config-btn" />
            <Button 
              label="Load Variant Data Tracks" 
              class="p-button-secondary header-btn"
              @click="openLoadVariantDataTrackModal"
              data-test="load-config-btn" />
              <Button 
              label="Load Epigenome Data Tracks" 
              class="p-button-secondary header-btn"
              @click="openLoadEpigenomeDataTrackModal"
              data-test="load-config-btn" />
          </div>
        </template>
        <div class="grid p-d-flex">
          <OverviewControls />
          <Divider layout="vertical" />
          <DetailsControls />
        </div>
      </Panel>
    </div>
  </div>
  <LoadDataTrackControls
    v-model:show="showLoadVariantDataTrackModal"
    :on-load-synteny-variants="onLoadSyntenyVariants"
    :on-close-load-variant-data-track-modal="closeLoadVariantDataTrackModal"
    header="Load Variant Data Tracks"
  />
  <LoadEpigenomeTrackControls
    v-model:show="showLoadEpigenomeDataTrackModal"
    :on-load-synteny-epigenome="onLoadSyntenyEpigenome"
    :on-close-load-epigenome-data-track-modal="closeLoadEpigenomeDataTrackModal"
    header="Load Epigenome Data Tracks"
  />
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import OverviewControls from '@/components/OverviewControls.vue';
import DetailsControls from '@/components/DetailsControls.vue';
import { VERSION } from '@/version';
import { ref } from 'vue';
import LoadDataTrackControls from '@/components/LoadDataTrackControls.vue';
import LoadEpigenomeTrackControls from '@/components/LoadEpigenomeTrackControls.vue';


interface Props 
{
  onLoadSyntenyVariants: (mapKeys: number[] | null, triggerUpdate: boolean) => Promise<void>;
  onLoadSyntenyEpigenome: (mapKeys: number[] | null, triggerUpdate: boolean) => Promise<void>;
}

const props = defineProps<Props>();

const router = useRouter();

let showLoadVariantDataTrackModal = ref(false);

const openLoadVariantDataTrackModal = () => {
  showLoadVariantDataTrackModal.value = true;
};
let showLoadEpigenomeDataTrackModal = ref(false);

const openLoadEpigenomeDataTrackModal = () => {
  showLoadEpigenomeDataTrackModal.value = true;
};
const onLoadSyntenyVariants = async (mapKeys: number[] | null, triggerUpdate: boolean) => {
  props.onLoadSyntenyVariants(mapKeys, triggerUpdate);
};
const onLoadSyntenyEpigenome = async (mapKeys: number[] | null, triggerUpdate: boolean) => {
  props.onLoadSyntenyEpigenome(mapKeys, triggerUpdate);
};

const closeLoadVariantDataTrackModal = () => {
  showLoadVariantDataTrackModal.value = false;
};
const closeLoadEpigenomeDataTrackModal = () => {
  showLoadEpigenomeDataTrackModal.value = false;
};

const goToConfigurationScreen = () => {
  router.push('/');
};
</script>

<style lang="scss" scoped>
.vcmap-panel:deep() .p-panel-icons {
   display: flex;
   align-items: center;
}

.vcmap-header
{
  display: flex;
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

.icon-container {
  align-items: center;
  display: inline-flex;
  
  .rgd-logo {
    padding-right: 1em;
    width: 80%;
  }
}
</style>
