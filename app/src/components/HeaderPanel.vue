<template>
  <div class="grid">
    <div class="col-12">
      <Panel :toggleable="true" class="vcmap-panel">
        <template #icons>
          <div>
            <button class="p-panel-header-icon p-link mr-2" @click="toggleMenu">
              <span class="pi pi-cog"></span>
            </button>
            <Menu ref="menu" id="config_menu" :model="items" popup />
            <button class="p-panel-header-icon p-link mr-2" @click="openHelp">
              <span class="pi pi-question-circle"></span>
            </button>
          </div>
        </template>
        <div class="grid p-d-flex">
          <InfoHeader />
          <Divider layout="vertical" />
          <NavigationHeader :geneList="geneList" :selectedData="selectedData" :queryForSynteny="props.queryForSynteny" />
        </div>
      </Panel>
    </div>
  </div>

  <HelpModal v-model:show="isHelpActive" />
  
</template>

<script lang="ts" setup>
import InfoHeader from '@/components/InfoHeader.vue';
import NavigationHeader from '@/components/NavigationHeader.vue';
import HelpModal from './HelpModal.vue';
import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import Chromosome from '@/models/Chromosome';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

interface Props 
{
  onShowSettings: () => void;
  queryForSynteny: (backboneChromosome: Chromosome, start: number, stop: number, mapKey: number) => Promise<void>;
  geneList: Map<number, Gene>;
  selectedData: SelectedData[] | null;
}

const props = defineProps<Props>();
const menu = ref();
const items = ref<any[]>([
  {
    label: 'Settings',
    icon: 'pi pi-sliders-v',
    command: () => openSettingsModal(),
  },
  {
    label: 'New Configuration',
    icon: 'pi pi-external-link',
    command: () => {
      const route = router.resolve({path: '/'});
      window.open(route.href, '_blank');
    },
  },
]);
const isHelpActive = ref(false);

const openSettingsModal = () => {
  props.onShowSettings();
};

const toggleMenu = (event: MouseEvent) => {
  menu.value.toggle(event);
};

const openHelp = () => {
  isHelpActive.value = true;
};
</script>

<style lang="scss" scoped>
.vcmap-panel:deep() {
  >.p-panel-header {
    justify-content: end;
  }
  .p-panel-icons {
    display: flex;
    align-items: center;
  }
}
</style>
