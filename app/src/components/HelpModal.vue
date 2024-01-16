<template>
  <VCMapDialog v-model:show="isHelpActive" :wide="false" header="VCMap Help">
    <template #content>
      <article>
        <h3>Navigation</h3>
        <ul class="padded-list">
          <li>
            To navigate up and down the backbone chromosome, you can you use the gray
            <span class="pi pi-chevron-up"></span> and <span class="pi pi-chevron-down"></span>
            buttons on the <b>Detailed</b> panel.
          </li>
          <li>
            To zoom in on a region of interest, you can click anywhere on the white part of the <b>Overview</b> or
            <b>Detailed</b> panel to start a selection.
            Then drag your mouse and click again to finish the selection and zoom in on the region.
          </li>
          <li>
            To adjust your <b>Zoom Level</b>, you can use the slider or the shortcut buttons (1.5x, 3x, etc) in the
            <b>Navigation</b> section under the header.
          </li>
        </ul>
        <h3>Adjusting Your Configuration</h3>
        <ul class="padded-list">
          <li>
            To adjust the comparative species or load data tracks, click on the <span class="pi pi-cog"></span> button in
            the <b>Header Panel</b> and choose <b>Settings</b>.
            Comparative species and data tracks can be added and removed here.
          </li>
          <li>
            To swap the backbone to one of the comparative species, you can right-click on the synteny section of the
            comparative species and choose to make either the
            highlighted synteny block or entire conserved synteny block the backbone. The highlighted synteny block refers
            to the
            smaller syntenic block that is highlighted when you hover over it.
            The entire conserved synteny block refers to the entire level 1 block that the highlighted synteny block
            belongs to.
            This can also be seen when hovering over the syntenic block.
          </li>
          <li>
            To change the positions of the comparative species tracks, you can use the gray <span
              class="pi pi-chevron-left"></span> and <span class="pi pi-chevron-right"></span> buttons
            above the species names in the <b>Detailed</b> panel.
          </li>
          <li>
            To open the configuration page in a new tab, click on the <span class="pi pi-cog"></span> button in the
            <b>Header Panel</b> and choose <b>New Configuration</b>.
          </li>
          <li>
            To return to the original configuration page, click on the VCMap logo in the upper-left corner.
          </li>
        </ul>
        <h3>Data Selection</h3>
        <ul class="padded-list">
          <li>
            Clicking on a syntenic block, gene, or variant will show relevant data in the <b>Selected Data Panel</b>.
            Clicking on a gene label will show data on
            all of the genes comprising that label.
          </li>
          <li>
            Clicking on a syntenic block, gene, gene label, or variant while holding the <b>Shift</b> key will
            add the data to the <b>Selected Data Panel</b> without clearing the previous selection (Multi-Select).
          </li>
          <li>
            Clicking on a syntenic block, gene, gene label, or variant while holding the <b>Ctrl</b> (Windows) or <b>Command</b> (Mac) key will
            remove the selection (De-Select).
          </li>
          <li>
            Data in the <b>Selected Data Panel</b> can be grouped by species or orthologs, sorted by label, and/or sorted
            by position.
          </li>
        </ul>
        <h3>Visibility Settings</h3>
        <ul class="padded-list">
          <li>
            Tracks for comparative species can be hidden by using their individual toggle in the <b>Selection Info</b>
            section under the header.
          </li>
          <li>
            The <b>Overview</b> panel can be hidden by using the toggle in the <b>Selection Info</b> section under the
            header.
          </li>
          <li>
            The view can be toggled back and forth between "Mirrored" and "Unmirrored" in the <b>Selection Info</b>
            section under the header. The "Mirrored" view
            will make the synteny tracks in the <b>Overview</b> and <b>Detailed</b> panels mirror each other.
          </li>
        </ul>
      </article>
    </template>
    <template #footer>
      <Button label="Close" class="p-button-outlined p-button-secondary" @click="closeHelp" />
    </template>
  </VCMapDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VCMapDialog from './VCMapDialog.vue';

/**
 * Can use v-model:show to do 2 way binding
 */
interface Props {
  show: boolean;
}

interface Emits {
  (eventName: 'update:show', value: boolean): void
}
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isHelpActive = computed({
  get() {
    return props.show;
  },
  set(value: boolean) {
    emit('update:show', value);
  }
});

const closeHelp = () => {
  isHelpActive.value = false;
};
</script>

<style scoped>
.padded-list li {
  padding-bottom: 10px;
}
</style>