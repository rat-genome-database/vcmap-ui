<template>
    <!-- Syntenic Lines -->
  <template v-for="(line, index) in orthologLines" :key="index">
    <line
      class="ortholog-line"
      :stroke="(line.isSelected ? SELECTED_HIGHLIGHT_COLOR : 'lightgray')"
      :x1="line.posX1" :x2="line.posX2"
      :y1="line.posY1" :y2="line.posY2" 
    />
  </template>

  <template v-for="(blockSection, index) in level1Blocks" :key="index">
    <rect
      class="block-section"
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection)"
      :y="blockSection.posY1"
      :x="blockSection.posX1"
      :width="blockSection.width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />

    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <GapSVG v-for="(gapSection,index) in level1Gaps" :key="index" :gap-section="gapSection" />

  <template v-for="(blockSection, index) in level2Blocks" :key="index">
    <rect
      class="level-2 block-section"
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection)"
      :y="blockSection.posY1"
      :x="blockSection.posX1"
      :width="blockSection.width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />

    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <GapSVG v-for="(gapSection,index) in level2Gaps" :key="index" :gap-section="gapSection" />

  <template v-if="region && showSyntenyOnHover">
    <SyntenyLinesSVG v-for="(blockSection, index) in region.syntenyBlocks" :key="index" :synteny-section="blockSection" />
  </template>

  <!-- Genes -->
  <template v-for="(datatrack, index) in datatracks" :key="index">
    <rect
      class="block-section"
      @mouseenter="onMouseEnter(datatrack, 'Gene')"
      @mouseleave="onMouseLeave(datatrack)"
      :y="datatrack.posY1"
      :x="datatrack.posX1"
      :width="datatrack.width"
      :height="datatrack.height"
      :fill="getSectionFill(datatrack)"
      :fill-opacity=".7"
    />
  </template>
  
</template>


<script lang="ts" setup>
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import OrthologLine from '@/models/OrthologLine';
import SyntenyRegion from '@/new_models/SyntenyRegion';
import SyntenySection from '@/new_models/SyntenySection';
import DatatrackSection from '@/new_models/DatatrackSection';
import { computed, toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import { key } from '@/store';
import { sortGeneList, getNewSelectedData } from '@/utils/DataPanelHelpers';
import { VCMapSVGElement } from '@/new_models/VCMapSVGElement';
import ChromosomeLabelSVG from './ChromosomeLabelSVG.vue';
import SyntenyLinesSVG from './SyntenyLinesSVG.vue';
import GapSVG from './GapSVG.vue';

const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);

interface Props
{
  showSyntenyOnHover?: boolean;
  showStartStop?: boolean;
  showChromosome?: boolean;
  showGeneLabel?: boolean;
  lines?: OrthologLine[];
  region?: SyntenyRegion;
  datatrackSections?: DatatrackSection[];
}
const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);

const orthologLines = computed(() => {
  return props.region?.orthologLines ?? [];
});
const level1Blocks = computed(() => {
  return props.region?.syntenyBlocks.filter(b => b.chainLevel === 1) ?? [];
});
const level2Blocks = computed(() => {
  return props.region?.syntenyBlocks.filter(b => b.chainLevel === 2) ?? [];
});
const level1Gaps = computed(() => {
  return props.region?.syntenyGaps.filter(g => g.chainLevel === 1) ?? [];
});
const level2Gaps = computed(() => {
  return props.region?.syntenyGaps.filter(g => g.chainLevel === 2) ?? [];
});
const datatracks = computed(() => {
  return (props.region) ? props.region.datatrackSections : props.datatrackSections;
});

const onMouseEnter = (section: SyntenySection | DatatrackSection, type: SelectedDataType) => {
  section.isHovered = true;
  
  // If there are selected genes, don't update the selected data panel
  if (store.state.selectedGeneIds.length === 0) {
    const selectedData = new SelectedData(section, type);
    store.dispatch('setSelectedData', [selectedData]);
  }
};

const onMouseLeave = (section: VCMapSVGElement) => {
  if (section)
  {
    section.isHovered = false;
  }
  
  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  /* props.track.sections.forEach((section) => {
    if (checkSectionForGene(section, selectedGeneIds)) {
      section.isSelected = true;
    } else {
      section.isSelected = false;
    }
  }); */
  // Highlight the line if needed, and make sure genes highlighted too
  // (this ensures backbone and comparitive genes are highlighted, regardless of which is clicked)
  props.lines?.forEach((line) => {
    if (selectedGeneIds.includes(line.backboneGene.gene?.rgdId || -1) ||
        selectedGeneIds.includes(line.comparativeGene.gene?.rgdId || -1)) {
      line.isSelected = true;
      line.backboneGene.isSelected = true;
      line.comparativeGene.isSelected = true;
    } else {
      line.isSelected = false;
    }
  });

  // After selecting the sections, check if we should use alt labels
  props.track.geneLabels.forEach((label) => {
    // Only consider geneLabels that are already visible anyway
    if (label.isVisible) {
      // If the main gene for this section is selected, we'll use the normal label
      let useAltLabel = false;
      if (selectedGeneIds.includes(label.section.gene.rgdId)) {
        useAltLabel = false;
      } else { // Otherwise if any selected ids exist in the alt labels, we'll use an alt label
        const altLabelIds = label.section.altLabels.map((label) => label.rgdId);
        if (selectedGeneIds.some((id) => altLabelIds.includes(id))) {
          useAltLabel = true;
        }
      }
      label.section.showAltLabel = useAltLabel;
    }
  });
};

const onClick = (event: any, section: DatatrackSection, type: string) => {
  if (!section.gene?.rgdId) {
    return;
  }
  // If clicked section already selected, just reset the selectedGeneId state
  if (store.state.selectedGeneIds.includes(section.gene?.rgdId || -1)) {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
    return;
  }

  // If shift key is held, we'll just add to the selections, otherwise, reset first
  let geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  // Get the list of genes to build the selected data, if this is a gene label, we
  // add all the combined genes to the selected data panel
  // Otherwise if its a track section, we'll add the hidden genes
  let newSelectedData: SelectedData[] = [];
  const geneSectionList = type === 'geneLabel' ? [section, ...(section.combinedGenes || [])] : [section, ...(section.hiddenGenes || [])];
  if (geneSectionList && geneSectionList.length > 0) {
    // If this is a geneLabel, we're going to set all combined genes as "selected"
    geneSectionList.forEach((section) => geneIds.push(section.gene.rgdId));
    // Alphabetically sort the combined/hidden gene lists (LOC genes at end of list)
    sortGeneList(geneSectionList);
    // Set the new selected data from gene list
    geneSectionList.forEach((section) => {
      if (section.gene) {
        const newData = getNewSelectedData(store, section.gene);
        const geneAndOrthologs = newData.selectedData;
        const newGeneIds = newData.rgdIds;
        newSelectedData.push(...geneAndOrthologs);
        geneIds.push(...newGeneIds);
      }
    });
  }

  store.dispatch('setSelectedGeneIds', geneIds || []);
  if (event.shiftKey) {
    const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
    store.dispatch('setSelectedData', selectedDataArray);
  } else {
    store.dispatch('setSelectedData', newSelectedData);
  }
};

</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;

  &:hover
  {
    cursor: pointer;
  }
}

.ortholog-line
{
  stroke-width: 1;
  &:hover
  {
    stroke-width: 2.5;
  }
}

.level-2
{
  filter: brightness(60%);
}

.block-section:hover
{
  cursor: pointer;
}
</style>