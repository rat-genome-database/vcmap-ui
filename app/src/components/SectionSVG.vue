<template>
  <template v-if="isOverview && region.gaplessBlock.startLabel.isVisible">
    <OverviewSyntenyLabelsSVG :gapless-block="region.gaplessBlock" />
  </template>
  <GapSVG v-for="(gapSection, index) in level1Gaps" :key="index" :gap-section="gapSection" />
  <GapSVG v-for="(gapSection, index) in level2Gaps" :key="index" :gap-section="gapSection" />
  <template v-for="(blockSection, index) in level1Blocks" :key="index">
    <g @contextmenu.prevent="showContextMenu({ event: $event, region, section: blockSection })">
      <rect v-if="blockSection.isHovered" :y="region.gaplessBlock.posY1" :x="region.gaplessBlock.posX1"
        :width="region.gaplessBlock.width" :height="region.gaplessBlock.height" fill="none" stroke-width="1.25"
        stroke="#0000FF" stroke-dasharray="2,2" />
      <rect class="block-section" @mouseenter="onMouseEnter($event, blockSection)"
        :class="{ 'is-overview-block': isOverview }" @mouseleave="onMouseLeave(blockSection)"
        @mousemove="updatePositionLabelFromMouseEvent($event, blockSection)"
        @click="onSyntenyBlockClick(blockSection, $event, region)" :y="blockSection.posY1" :x="blockSection.posX1"
        :width="blockSection.width" :height="blockSection.height" :fill="getSectionFill(blockSection)"
        :fill-opacity="1" />
    </g>

    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <template v-for="(blockSection, index) in level2Blocks" :key="index">
    <rect v-if="blockSection.isHovered" :y="region.gaplessBlock.posY1" :x="region.gaplessBlock.posX1"
      :width="region.gaplessBlock.width" :height="region.gaplessBlock.height" fill="none" stroke-width="1.25"
      stroke="#0000FF" stroke-dasharray="2,2" />
    <rect class="level-2 block-section" @mouseenter="onMouseEnter($event, blockSection)"
      :class="{ 'is-overview-block': isOverview }" @mouseleave="onMouseLeave(blockSection)"
      @mousemove="updatePositionLabelFromMouseEvent($event, blockSection)"
      @click="onSyntenyBlockClick(blockSection, $event, region)" :y="blockSection.posY1" :x="blockSection.posX1"
      :width="blockSection.width" :height="blockSection.height" :fill="getSectionFill(blockSection)" :fill-opacity="1" />
    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <template v-if="region && showSyntenyOnHover">
    <SyntenyLinesSVG v-for="(blockSection, index) in region.syntenyBlocks" :key="index" :synteny-section="blockSection" />
  </template>

  <!-- Detailed Panel Synteny Position Labels -->
  <template
    v-if="!isOverview && region.gaplessBlock.startLabel.isVisible && region.gaplessBlock.height > 10 && region.syntenyBlocks.some((section) => section.isHovered)">
    <WindowPositionLabelsSVG :region="region" />
  </template>
  <template v-if="showBasePairLine">
    <text class="label small" text-anchor="end" dominant-baseline="middle" :x="region.gaplessBlock.posX1 - 1"
      :y="mouseYPos">
      {{ basePairPositionLabel }}
    </text>
    <text class="label small" text-anchor="end" dominant-baseline="middle" :x="region.gaplessBlock.posX1 - 10"
      :y="mouseYPos ? mouseYPos - 10 : mouseYPos">
      Chr: {{ region.gaplessBlock.chromosome }}
    </text>
    <line class="position-label" :x1="region.gaplessBlock.posX1"
      :x2="region.gaplessBlock.posX1 + region.gaplessBlock.width" :y1="mouseYPos" :y2="mouseYPos" />
  </template>


  <!-- Genes -->
  <template v-for="(datatrackSet, index) in datatrackSets" :key="index">
    <template v-for="(datatrack, index) in datatrackSet.datatracks" :key="index">
      <g @contextmenu.prevent="showContextMenu({ event: $event, track: datatrack })">
        <rect :class="getDatatrackClass(datatrackSet)" @mouseenter="onMouseEnter($event, datatrack)"
          @mouseleave="onMouseLeave(datatrack)" @click="onDatatrackSectionClick($event, datatrack, geneList)"
          :y="datatrack.posY1" :x="datatrack.posX1" :width="datatrack.width" :height="datatrack.height"
          :fill="getSectionFill(datatrack)" :fill-opacity="datatrack.opacity" :stroke="getSectionFill(datatrack)" />
      </g>
    </template>
  </template>
</template>


<script lang="ts" setup>
import { watch, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import SelectedData from '@/models/SelectedData';
import SyntenyRegion from '@/models/SyntenyRegion';
import { SyntenyRegionInfo } from '@/models/SyntenyRegion';
import SyntenySection from '@/models/SyntenySection';
import GenomicSection from '@/models/GenomicSection';
import DatatrackSection, { GeneDatatrack, VariantDensity } from '@/models/DatatrackSection';
import { computed, toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import { key } from '@/store';
import { Formatter } from '@/utils/Formatter';
import { VCMapSVGElement } from '@/models/VCMapSVGElement';
import ChromosomeLabelSVG from './ChromosomeLabelSVG.vue';
import SyntenyLinesSVG from './SyntenyLinesSVG.vue';
import GapSVG from './GapSVG.vue';
import OverviewSyntenyLabelsSVG from './OverviewSyntenyLabelsSVG.vue';
import WindowPositionLabelsSVG from './WindowPositionLabelsSVG.vue';
import useMouseBasePairPos from '@/composables/useMouseBasePairPos';
import Gene from '@/models/Gene';
import DatatrackSet from '@/models/DatatrackSet';
import { getSelectedDataAndGeneIdsFromOrthologLine } from '@/utils/OrthologHandler';
import useSyntenyAndDataInteraction from '@/composables/useSyntenyAndDataInteraction';
import { createJBrowse2UrlForGene, createJBrowse2UrlForGenomicSection, createVariantVisualizerUrl } from '@/utils/ExternalLinks';

const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);
const router = useRouter();

const { getBasePairPositionFromMouseEvent, getBasePairPositionFromSVG, mouseYPos } = useMouseBasePairPos();
const {
  setHoverOnGeneLinesAndDatatrackSections,
  onDatatrackSectionClick,
  changeHoverElementSize,
  showHoveredData,
  hideHoveredData,
} = useSyntenyAndDataInteraction(store);

interface Props {
  showSyntenyOnHover?: boolean;
  isOverview?: boolean;
  showChromosome?: boolean;
  selectOnClick?: boolean;
  region: SyntenyRegion;
  syntenyHoverSvgY?: number | null;
  geneList: Map<number, Gene>;
  contextMenuOpen: boolean;
  selectedBlocks: SyntenySection[];
}

interface MenuItem {
  label: string,
  subtext?: string,
  icon?: string,
  command?: () => void;
  items?: MenuItem[];
}

interface ContextMenuType {
  event: MouseEvent;
  region?: SyntenyRegion;
  section?: SyntenySection;
  track?: DatatrackSection;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'synteny-hover', svgY: number | null): void,
  (e: 'block-hover', startStop: number[] | null): void,
  (e: 'show-context-menu', event: MouseEvent, items: MenuItem[], section?: GenomicSection): void,
  (e: 'swap-backbone', mapKey: string, chr: string, start: number, stop: number): void,
  (e: 'select-blocks', sections: SyntenySection[]): void,
}>();

//Converts each property in this object to its own reactive prop
toRefs(props);
const basePairPositionLabel = ref<string>('');

onMounted(() => {
  highlightSelections(store.state.selectedGeneIds);
});

watch([() => store.state.selectedGeneIds, () => props.region], () => {
  highlightSelections(store.state.selectedGeneIds);
});

watch(() => props.syntenyHoverSvgY, () => {
  // If backbone is not being hovered but another synteny section is emitting a mouse event,
  // show the bp position on this backbone section
  if (!isRegionHovered.value && props.syntenyHoverSvgY != null) {
    updatePositionLabelFromSVG(props.syntenyHoverSvgY);
  }
});

const level1Blocks = computed(() => {
  return props.region.syntenyBlocks.filter(b => b.chainLevel === 1);
});
const level2Blocks = computed(() => {
  return props.region.syntenyBlocks.filter(b => b.chainLevel === 2);
});
const level1Gaps = computed(() => {
  return props.region.syntenyGaps.filter(g => g.chainLevel === 1);
});
const level2Gaps = computed(() => {
  return props.region.syntenyGaps.filter(g => g.chainLevel === 2);
});
const datatrackSets = computed(() => {
  return (props.region.datatrackSets);
});
const isRegionHovered = computed(() => {
  return props.region.syntenyBlocks.some(b => b.isHovered);
});

const showBasePairLine = computed(() => {
  return props.syntenyHoverSvgY != null && mouseYPos.value != null && !props.isOverview
    && (isRegionHovered.value || basePairPositionLabel.value !== '');
});

const isDetailed = computed(() => {
  return props.backboneSet.backbone.renderType === 'detailed';
});

const findMapKey = (name: string) => {
  for (const species of store.state.comparativeSpecies) {
    if (name === species.name) return species.activeMap.key;
  }
  return store.state.species?.activeMap.key;
};

const showContextMenu = ({ event, region, section, track }: ContextMenuType) => {
  let items: MenuItem[] = [];
  if (props.isOverview) {
    if (section) {
      items = [
        {
          label: 'Link to RGD JBrowse',
          command: () => { window.open(createJBrowse2UrlForGenomicSection(section)); },
          icon: 'pi pi-external-link',
        },
        {
          separator: true
        },
        {
          label: 'Set as Backbone',
          command: () => { onBackboneSwap(section); },
          icon: 'pi pi-sync'
        },
        {
          separator: true
        },
        {
          label: 'Set as Backbone (New Tab)',
          command: () => { onBackboneSwapNewWindow(section); },
          icon: 'pi pi-window-maximize'
        },
      ];
    }
  } else {
    if (section && region) {
      const secChr = section.chromosome;
      const secStart = Formatter.convertBasePairToLabel(section.speciesStart);
      const secStop = Formatter.convertBasePairToLabel(section.speciesStop);
      const regChr = region.gaplessBlock.chromosome;
      const regStart = Formatter.convertBasePairToLabel(region.gaplessBlock.speciesStart);
      const regStop = Formatter.convertBasePairToLabel(region.gaplessBlock.speciesStop);

      items = [
        {
          label: 'Link to RGD JBrowse',
          icon: 'pi pi-external-link',
          items: [
            {
              label: 'Highlighted Synteny Block',
              subtext: `Chr:${secChr} ${secStart} - ${secStop}`,
              command: () => { window.open(createJBrowse2UrlForGenomicSection(section)); }
            },
            {
              separator: true
            },
            {
              label: 'Entire Conserved Synteny Block',
              subtext: `Chr:${regChr} ${regStart} - ${regStop}`,
              command: () => { window.open(createJBrowse2UrlForGenomicSection(region.gaplessBlock)); }
            }
          ]
        },
        {
          separator: true
        },
        {
          label: 'Set as Backbone',
          icon: 'pi pi-sync',
          items: [
            {
              label: 'Highlighted Synteny Block',
              subtext: `Chr:${secChr} ${secStart} - ${secStop}`,
              command: () => { onBackboneSwap(section); },
            },
            {
              separator: true
            },
            {
              label: 'Entire Conserved Synteny Block',
              subtext: `Chr:${regChr} ${regStart} - ${regStop}`,
              command: () => { onBackboneSwap(region.gaplessBlock); }
            },
          ]
        },
        {
          separator: true
        },
        {
          label: 'Set as Backbone (New Tab)',
          icon: 'pi pi-window-maximize',
          items: [
            {
              label: 'Highlighted Synteny Block',
              subtext: `Chr:${secChr} ${secStart} - ${secStop}`,
              command: () => { onBackboneSwapNewWindow(section); }
            },
            {
              separator: true
            },
            {
              subtext: `Chr:${regChr} ${regStart} - ${regStop}`,
              label: 'Entire Conserved Synteny Block',
              command: () => { onBackboneSwapNewWindow(region.gaplessBlock); }
            },
          ]
        },
      ];
    }
  }

  if (track) {
    if (track.type === 'variant') {
      // Variant track...
      const variantMapKey = findMapKey(track.speciesName);
      if (variantMapKey != null) {
        items.push({
          label: 'Link to RGD Variant Visualizer',
          command: () => { window.open(createVariantVisualizerUrl(track, variantMapKey)); },
          icon: 'pi pi-external-link'
        });
        items.push({
          label: 'Link to RGD JBrowse',
          command: () => { window.open(createJBrowse2UrlForGenomicSection(track)); },
          icon: 'pi pi-external-link',
        });
      }
    } else if (store.state.species != null) {
      // Is non-variant datatrack (likely a GeneDatatrack) and the backbone species is defined so that we can use it
      // to search for the species model associated with the gene
      const geneSpecies = [store.state.species, ...store.state.comparativeSpecies]
        .find(s => s.activeMap.key === (track as GeneDatatrack).gene.mapKey);

      if (geneSpecies != null) {
        items.push({
          label: 'Link to RGD JBrowse',
          command: () => { window.open(createJBrowse2UrlForGene((track as GeneDatatrack).gene, geneSpecies)); },
          icon: 'pi pi-external-link',
        });
      }
    }
  }

  // Emit the appropriate selected GenomicSection when showing the menu
  if (section) {
    emit('show-context-menu', event, items, section);
  } else if (track) {
    emit('show-context-menu', event, items, track);
  } else {
    emit('show-context-menu', event, items);
  }
};
///

const onMouseEnter = (event: MouseEvent, section: SyntenySection | DatatrackSection) => {
  if (!props.contextMenuOpen) {
    section.isHovered = true;

    // NOTE: ignore qtl datatracks for now
    if (section.type === 'qtl') return;

    showHoveredData(section, event);

    const genesAreSelected = store.state.selectedGeneIds.length > 0;
    const variantSectionsAreSelected = store.state.selectedVariantSections.length > 0;
    let selectedDataList: SelectedData[] = [];
    if (section.type === 'gene') {
      //
      // Gene datatrack section
      const geneSection = section as GeneDatatrack;
      setHoverOnGeneLinesAndDatatrackSections(geneSection?.lines, true);

      // Only update the selected data panel if no Genes or Variant sections are already selected
      if (!genesAreSelected && !variantSectionsAreSelected) {
        if (geneSection.lines.length > 0) {
          const {
            selectedData: selectedOrthologs,
          } = getSelectedDataAndGeneIdsFromOrthologLine(geneSection.lines[0]);
          selectedDataList.push(...selectedOrthologs);
        }
        else {
          selectedDataList.push(new SelectedData(geneSection.gene.clone(), 'Gene'));
        }
      }
    }
    else if (!genesAreSelected && !variantSectionsAreSelected) {
      //
      // Synteny section
      {
        if (section.type === 'variant') {

          selectedDataList.push(new SelectedData(section, 'variantDensity'));
        }
      }
    }
  }
  changeHoverElementSize(section, true);
};

const onMouseLeave = (section: DatatrackSection | SyntenySection) => {
  if (!props.contextMenuOpen) {
    emit('synteny-hover', null);
    if (isDetailed) {
      emit('block-hover', null);
    }
    basePairPositionLabel.value = '';

    if (section) {
      section.isHovered = false;
    }

    // Only reset data onMouseLeave if there isn't a selected gene or variant sections or block
    if (store.state.selectedGeneIds.length == 0 && store.state.selectedData?.length == 0) {
      store.dispatch('setSelectedData', null);
    }

    if (section.type === 'gene') {
      const geneSection = section as GeneDatatrack;
      setHoverOnGeneLinesAndDatatrackSections(geneSection.lines, false);
    }
    hideHoveredData();
  }
  changeHoverElementSize(section, false);
};

const onSyntenyBlockClick = (section: SyntenySection, event: any, region: SyntenyRegion) => {
  //select the synteny block for display in the selectedDataPanel
  let selectedDataList: SelectedData[] = [];

  //construct region info
  //loop loaded data tracks and get variant counts
  let variantCount = 0;
  region.datatrackSets.forEach((datatrackSet) => {
    if (datatrackSet.type === 'variant') {
      variantCount = datatrackSet.datatracks.length;
    }
  });

  const regionInfo: SyntenyRegionInfo = {
    blockCount: region.syntenyBlocks.length,
    gapCount: region.syntenyGaps.length,
    geneCount: region.genes.length,
    variantCount: variantCount,
  };

  section.regionInfo = regionInfo;
  //clear out any selected genes or variant sections
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedVariantSections', []);
  //set our section as selected
  selectedDataList.push(new SelectedData(section, 'trackSection'));
  const selectedBlocks = props.selectedBlocks;
  if (event.shiftKey) {
    const selectedDataArray = [...(store.state.selectedData || []), ...selectedDataList];
    section.isSelected = !section.isSelected;
    store.dispatch('setSelectedData', selectedDataArray);
    selectedBlocks.push(section);
    emit('select-blocks', selectedBlocks);
  } else if (selectedDataList.length > 0) {
    const blockIsSelcted = section.isSelected;
    if (selectedBlocks.length > 0) {
      selectedBlocks.forEach((block) => block.isSelected = false);
    }
    section.isSelected = !blockIsSelcted;
    if (section.isSelected) {
      store.dispatch('setSelectedData', selectedDataList);
      emit('select-blocks', [section]);
    } else {
      store.dispatch('setSelectedData', []);
      emit('select-blocks', []);
    }
  }


  if (props.selectOnClick) {
    const backboneChromosome = store.state.chromosome;
    if (backboneChromosome && section.backboneAlignment) {
      const basePairStart = section.backboneAlignment.start;
      const basePairStop = section.backboneAlignment.stop;
      store.dispatch('setDetailedBasePairRequest', { range: { start: basePairStart, stop: basePairStop }, source: 'Synteny Selection' });
    }
  }
};

const onBackboneSwap = async (section: SyntenySection) => {
  const sectionMapName = section.mapName;
  const chr = section.chromosome;
  const newStart = section.isInverted ? section.speciesStop : section.speciesStart;
  const newStop = section.isInverted ? section.speciesStart : section.speciesStop;
  emit('swap-backbone', sectionMapName, chr, newStart, newStop);
};

const onBackboneSwapNewWindow = async (section: SyntenySection) => {
  const sectionMapName = section.mapName;
  const sectionChr = section.chromosome;
  const start = section.isInverted ? section.speciesStop : section.speciesStart;
  const stop = section.isInverted ? section.speciesStart : section.speciesStop;
  const route = router.resolve({
    path: '/main',
    query: {
      key: sectionMapName,
      chr: sectionChr,
      start: start,
      stop: stop,
    },
  });
  window.open(route.href, '_blank');
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) { return SELECTED_HIGHLIGHT_COLOR; }
  if (section.isHovered) { return HOVER_HIGHLIGHT_COLOR; }
  return section.elementColor;
};

const getDatatrackClass = (datatrackSet: DatatrackSet) => {
  if (datatrackSet.type === 'variant') {
    return 'block-section variant';
  }
  else {
    return 'block-section';
  }
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  datatrackSets.value.forEach((set) => {
    if (set.datatracks && set.datatracks.length > 0 && set.datatracks[0].type === 'gene') {
      // TODO: Feels a bit fragile to tell the type-checker to treat this as GeneDatatrack[]. Maybe there
      // is a better way to organize our different types of DatatrackSection models to allow Typescript to
      // "know" that this is a GeneDatatrack[] type. We should be aware that "as" will not throw an error if
      // set.datatracks is not of type GeneDatatrack[].
      (set.datatracks as GeneDatatrack[]).forEach(section => {
        if (section.gene == null) {
          return;
        }

        if (selectedGeneIds.includes(section.gene.rgdId)) {
          section.isSelected = true;
        }
        else {
          section.isSelected = false;
        }
      });
    } else if (set.datatracks && set.datatracks.length > 0 && set.datatracks[0].type === 'variant') {
      set.datatracks.forEach(section => {
        if (store.state.selectedVariantSections.some((selectedSection: VariantDensity) => selectedSection.speciesStart === section.speciesStart)) {
          section.isSelected = true;
        } else {
          section.isSelected = false;
        }
      });
    }
  });
};

const updatePositionLabelFromMouseEvent = (event: MouseEvent, blockSection: SyntenySection) => {
  const basePairPos = getBasePairPositionFromMouseEvent(event, blockSection.posY1, blockSection.posY2, blockSection.speciesStart, blockSection.speciesStop);
  basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';

  if (isRegionHovered.value) {
    // Emit our svg y position so that other synteny sections can see it
    emit('synteny-hover', mouseYPos.value ?? null);

    if (isDetailed) {
      emit('block-hover', [props.region.gaplessBlock.posY1, props.region.gaplessBlock.posY2]);
    }
    // emit('block-hover', [blockSection.speciesStart, blockSection.speciesStop]);

  }
};

const getBlockFromSVGPosition = (svgY: number) => {
  // First check the gapless block to see if we even need to loop through the synteny blocks
  if (props.region.gaplessBlock.posY1 <= svgY && props.region.gaplessBlock.posY2 >= svgY) {
    // Loop through its synteny blocks to identify which block is at this svg position
    for (let i = 0; i < props.region.syntenyBlocks.length; i++) {
      const block = props.region.syntenyBlocks[i];
      if (block.posY1 <= svgY && block.posY2 >= svgY) {
        return block;
      }
    }
  }

  return null;
};

const updatePositionLabelFromSVG = (svgY: number) => {
  const blockSection = getBlockFromSVGPosition(svgY);
  if (blockSection != null) {
    const basePairPos = getBasePairPositionFromSVG(svgY, blockSection.posY1, blockSection.posY2, blockSection.speciesStart, blockSection.speciesStop);
    basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';
  }
  else {
    basePairPositionLabel.value = '';
  }
};
</script>

<style lang="scss" scoped>
.label.small {
  font: normal 8px sans-serif;

  &:hover {
    cursor: pointer;
  }

  pointer-events: none;
}

.level-2 {
  filter: brightness(60%);
}

.block-section {
  stroke-width: 0;

  &.variant {
    stroke-width: 0.25;
  }
}

.block-section:hover {
  cursor: pointer;

  &.is-overview-block {
    cursor: zoom-in;
  }
}

.position-label {
  stroke: black;
  pointer-events: none;
}</style>