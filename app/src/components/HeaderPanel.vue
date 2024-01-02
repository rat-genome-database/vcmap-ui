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

  <VCMapDialog
    v-model:show="isHelpActive"
    :wide="false"
    header="VCMap Help"
  >
    <template #content>
      <article>
        <h3>Navigation</h3>
        <ul>
          <li>
            To navigate up and down the backbone chromosome, you can you use the gray
            <span class="pi pi-chevron-up"></span> and <span class="pi pi-chevron-down"></span>
            buttons on the <b>Detailed</b> panel.
          </li>
          <li>
            To zoom in on a region of interest, you can click anywhere on the white part of the <b>Overview</b> or <b>Detailed</b> panel to start a selection.
            Then drag your mouse and click again to finish the selection and zoom in on the region.
          </li>
          <li>
            To adjust your <b>Zoom Level</b>, you can use the slider or the shortcut buttons (1.5x, 3x, etc) in the <b>Navigation</b> section under the header.
          </li>
        </ul>
        <h3>Adjusting Your Configuration</h3>
          <ul>
            <li>
              To adjust the comparative species or load data tracks, click on the <span class="pi pi-cog"></span> button in the <b>Header Panel</b> and choose <b>Settings</b>.
              Comparative species and data tracks can be added and removed here.
            </li>
            <li>
              To swap the backbone to one of the comparative species, you can right-click on the synteny section of the comparative species and choose to make either the
              highlighted section or dotted region the backbone. The highlighted section refers to the smaller syntenic block that is highlighted when you hover over it.
              The dotted region refers to the entire level 1 block that the highlighted section belongs to. This can also be seen when hovering over the syntenic block.
            </li>
            <li>
              To open the configuration page in a new tab, click on the <span class="pi pi-cog"></span> button in the <b>Header Panel</b> and choose <b>New Configuration</b>.
            </li>
            <li>
              To return to the original configuration page, click on the VCMap logo in the upper-left corner.
            </li>
          </ul>
        <h3>Data Selection</h3>
          <ul>
            <li>
              Clicking on a syntenic block, gene, or variant will show relevant data in the <b>Selected Data Panel</b>. Clicking on a gene label will show data on
              all of the genes comprising that label.
            </li>
            <li>
              Data in the <b>Selected Data Panel</b> can be grouped by species or orthologs, sorted by label, and/or sorted by position.
            </li>
          </ul>
        <h3>Visibility Settings</h3>
        <ul>
          <li>
            Tracks for comparative species can be hidden by using their individual toggle in the <b>Selection Info</b> section under the header.
          </li>
          <li>
            The <b>Overview</b> panel can be hidden by using the toggle in the <b>Selection Info</b> section under the header.
          </li>
          <li>
            The view can be toggled back and forth between "Mirrored" and "Unmirrored" in the <b>Selection Info</b> section under the header. The "Mirrored" view
            will make the synteny tracks in the <b>Overview</b> and <b>Detailed</b> panels mirror each other.
          </li>
        </ul>
      </article>
    </template>
    <template #footer>
      <Button
        label="Close"
        class="p-button-outlined p-button-secondary"
        @click="closeHelp"
      />
    </template>
  </VCMapDialog>
</template>

<script lang="ts" setup>
import InfoHeader from '@/components/InfoHeader.vue';
import NavigationHeader from '@/components/NavigationHeader.vue';
import VCMapDialog from './VCMapDialog.vue';
import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import Chromosome from '@/models/Chromosome';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

interface Props 
{
  onShowSettings: () => void;
  queryForSynteny: (backboneChromosome: Chromosome, start: number, stop: number, mapKey: number) => void;
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

const closeHelp = () => {
  isHelpActive.value = false;
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
