<template>
  <template v-if="isOverview && region.gaplessBlock.startLabel.isVisible">
    <OverviewSyntenyLabelsSVG :gapless-block="region.gaplessBlock"/>
  </template>
  <GapSVG v-for="(gapSection,index) in level1Gaps" :key="index" :gap-section="gapSection" />
  <GapSVG v-for="(gapSection,index) in level2Gaps" :key="index" :gap-section="gapSection" />
  <template v-for="(blockSection, index) in level1Blocks" :key="index">
    <g @contextmenu.prevent="showContextMenu($event, region, blockSection)">
      <rect v-if="blockSection.isHovered"
        :y="region.gaplessBlock.posY1"
        :x="region.gaplessBlock.posX1"
        :width="region.gaplessBlock.width"
        :height="region.gaplessBlock.height"
        fill="none"
        stroke-width=".5"
        stroke="#0000FF"
        stroke-dasharray="2,2"
      />
      <rect
        class="block-section"
        @mouseenter="onMouseEnter($event, blockSection, 'trackSection')"
        @mouseleave="onMouseLeave(blockSection)"
        @mousemove="updatePositionLabelFromMouseEvent($event, blockSection)"
        @click="onSyntenyBlockClick(blockSection, $event)"
        :y="blockSection.posY1"
        :x="blockSection.posX1"
        :width="blockSection.width"
        :height="blockSection.height"
        :fill="getSectionFill(blockSection)"
        :fill-opacity="1"
      />
    </g>

    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <template v-for="(blockSection, index) in level2Blocks" :key="index">
    <rect v-if="blockSection.isHovered"
      :y="region.gaplessBlock.posY1"
      :x="region.gaplessBlock.posX1"
      :width="region.gaplessBlock.width"
      :height="region.gaplessBlock.height"
      fill="none"
      stroke-width=".5"
      stroke="#0000FF"
      stroke-dasharray="2,2"
    />
    <rect
      class="level-2 block-section"
      @mouseenter="onMouseEnter($event, blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection)"
      @mousemove="updatePositionLabelFromMouseEvent($event, blockSection)"
      :y="blockSection.posY1"
      :x="blockSection.posX1"
      :width="blockSection.width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />
    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <template v-if="region && showSyntenyOnHover">
    <SyntenyLinesSVG v-for="(blockSection, index) in region.syntenyBlocks" :key="index" :synteny-section="blockSection" />
  </template>

  <!-- Detailed Panel Synteny Position Labels -->
  <template v-if="!isOverview && region.gaplessBlock.startLabel.isVisible && region.gaplessBlock.height > 10 && region.syntenyBlocks.some((section) => section.isHovered)">
    <WindowPositionLabelsSVG :region="region" />
  </template>
  <template v-if="showBasePairLine">
    <text
      class="label small"
      text-anchor="end"
      dominant-baseline="middle"
      :x="region.gaplessBlock.posX1 - 1"
      :y="mouseYPos"
    >
      {{ basePairPositionLabel }}
    </text>
    <text
      class="label small"
      text-anchor="end"
      dominant-baseline="middle"
      :x="region.gaplessBlock.posX1 - 10"
      :y="mouseYPos ? mouseYPos - 10 : mouseYPos"
    >
      Chr: {{ region.gaplessBlock.chromosome }}
    </text>
    <line
      class="position-label"
      :x1="region.gaplessBlock.posX1"
      :x2="region.gaplessBlock.posX1 + region.gaplessBlock.width"
      :y1="mouseYPos"
      :y2="mouseYPos"
    />
  </template>


  <!-- Genes -->
  <template v-for="(datatrackSet, index) in datatrackSets" :key="index">
    <template v-for="(datatrack, index) in datatrackSet.datatracks" :key="index">
      <rect
        :class="getDatatrackClass(datatrackSet)"
        @mouseenter="onMouseEnter($event, datatrack, 'Gene')"
        @mouseleave="onMouseLeave(datatrack)"
        @click="onDatatrackSectionClick($event, datatrack, geneList)"
        :y="datatrack.posY1"
        :x="datatrack.posX1"
        :width="datatrack.width"
        :height="datatrack.height"
        :fill="getSectionFill(datatrack)"
        :fill-opacity="datatrack.opacity"
        :stroke="getSectionFill(datatrack)"
      />
    </template>
  </template>
</template>


<script lang="ts" setup>
import { watch, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import SyntenyRegion from '@/models/SyntenyRegion';
import SyntenySection from '@/models/SyntenySection';
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
import GenomicSection from '@/models/GenomicSection';
import Gene from '@/models/Gene';
import DatatrackSet from '@/models/DatatrackSet';
import { getSelectedDataAndGeneIdsFromOrthologLine } from '@/utils/OrthologHandler';
import useSyntenyAndDataInteraction from '@/composables/useSyntenyAndDataInteraction';
import ChromosomeApi from '@/api/ChromosomeApi';

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

interface Props
{
  showSyntenyOnHover?: boolean;
  isOverview?: boolean;
  showChromosome?: boolean;
  selectOnClick?: boolean;
  region: SyntenyRegion;
  syntenyHoverSvgY?: number | null;
  geneList: Map<number, Gene>;
}

interface MenuItem {
  label: string,
  command: () => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'synteny-hover', svgY: number | null): void,
  (e: 'block-hover', startStop: number[] | null): void,
  (e: 'show-context-menu', event: MouseEvent, items: MenuItem[]): void,
  (e: 'swap-backbone', mapKey: string, chr: string, start: number, stop: number): void,
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
  if (!isRegionHovered.value && props.syntenyHoverSvgY != null)
  {
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

const createJBrowseLink = (section: SyntenySection) => {
  const assembly = section.mapName === 'GRCh38' ? 'GRCh38.p14' : section.mapName;
  const chromosome = section.chromosome;
  let start = section.speciesStart;
  let stop = section.speciesStop;

  // Invert start/stop if needed
  if (start > stop) [start, stop] = [stop, start];

  // Base URL for JBrowse - replace with the actual JBrowse base URL
  const jbrowseBaseUrl = "https://rgd.mcw.edu/jbrowse2/";

  // Construct the full URL
  const jbrowseUrl = `${jbrowseBaseUrl}?&assembly=${assembly}&loc=chr${chromosome}:${start}-${stop}`;

  return jbrowseUrl;
};

const showContextMenu = (event: MouseEvent, region: SyntenyRegion, section: SyntenySection) => {
  let items: MenuItem[] = [];
  if (props.isOverview) {
    items = [
      {
        label: 'Link to JBrowse',
        command: () => { window.open(createJBrowseLink(section)); }
      },
      {
        label: 'Make Backbone',
        command: () => { onBackboneSwap(section); }
      },
      {
        label: 'Make Backbone in new window',
        command: () => { onBackboneSwapNewWindow(section); }
      },
    ];
  } else {
    items = [
      { 
        label: 'Link highlighted section to JBrowse',
        command: () => { window.open(createJBrowseLink(section)); }
      },
      {
        label: 'Link dotted region to JBrowse',
        command: () => { window.open(createJBrowseLink(region.gaplessBlock)); }
      },
      {
        label: 'Make highlighted section Backbone',
        command: () => { onBackboneSwap(section); }
      },
      {
        label: 'Make dotted region Backbone',
        command: () => { onBackboneSwap(region.gaplessBlock); }
      },
      {
        label: 'Make Backbone in new window',
        command: () => { onBackboneSwapNewWindow(section); }
      },
    ];
  }
  emit('show-context-menu', event, items);
};
///

const onMouseEnter = (event: MouseEvent, section: SyntenySection | DatatrackSection, type: SelectedDataType) => {

  section.isHovered = true;

  // NOTE: ignore qtl datatracks for now
  if (section.type === 'qtl') return;

  changeHoverElementSize(section, true);
  showHoveredData(section, event);

  const genesAreSelected = store.state.selectedGeneIds.length > 0;
  const variantSectionsAreSelected = store.state.selectedVariantSections.length > 0;
  let selectedDataList: SelectedData[] = [];
  if (section.type === 'gene')
  {
    //
    // Gene datatrack section
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection?.lines, true);
    
    // Only update the selected data panel if no Genes or Variant sections are already selected
    if (!genesAreSelected && !variantSectionsAreSelected)
    {
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
  else if (!genesAreSelected && !variantSectionsAreSelected)
  {
    //
    // Synteny section
    {
      if (section.type === 'variant')
      {

        selectedDataList.push(new SelectedData(section, 'variantDensity'));
      } else
      {
        selectedDataList.push(new SelectedData(section, type));
      }
    }
  }

  if (selectedDataList.length > 0)
  {
    store.dispatch('setSelectedData', selectedDataList);
  }
};

const onMouseLeave = (section: DatatrackSection | SyntenySection) => {
  emit('synteny-hover', null);
  if (isDetailed){
    emit('block-hover', null);
  }
  basePairPositionLabel.value = '';

  if (section)
  {
    section.isHovered = false;
  }
  
  // Only reset data onMouseLeave if there isn't a selected gene or variant sections
  if (store.state.selectedGeneIds.length === 0 && store.state.selectedVariantSections.length === 0) {
    store.dispatch('setSelectedData', null);
  }

  if (section.type === 'gene')
  {
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection.lines, false);
  }
  changeHoverElementSize(section, false);
  hideHoveredData();
};

const onSyntenyBlockClick = (section: GenomicSection, event: any) => {
  if (event.shiftKey && section instanceof SyntenySection) {
    onBackboneSwap(section);
  } else if (props.selectOnClick) {
    const backboneChromosome = store.state.chromosome;
    if (backboneChromosome && section.backboneAlignment)
    {
      const basePairStart = section.backboneAlignment.start;
      const basePairStop = section.backboneAlignment.stop;
      store.dispatch('setDetailedBasePairRequest', { range: { start: basePairStart, stop: basePairStop }, source: 'Synteny Selection'});
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
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
};

const getDatatrackClass = (datatrackSet: DatatrackSet) => {
  if (datatrackSet.type === 'variant')
  {
    return 'block-section variant';
  }
  else
  {
    return 'block-section';
  }
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  datatrackSets.value.forEach((set) => {
    if (set.datatracks && set.datatracks.length > 0 && set.datatracks[0].type === 'gene')
    {
      // TODO: Feels a bit fragile to tell the type-checker to treat this as GeneDatatrack[]. Maybe there
      // is a better way to organize our different types of DatatrackSection models to allow Typescript to
      // "know" that this is a GeneDatatrack[] type. We should be aware that "as" will not throw an error if
      // set.datatracks is not of type GeneDatatrack[].
      (set.datatracks as GeneDatatrack[]).forEach(section => {
        if (section.gene == null)
        {
          return;
        }

        if (selectedGeneIds.includes(section.gene.rgdId)) 
        {
          section.isSelected = true;
        } 
        else 
        {
          section.isSelected = false;
        }
      });
    } else if (set.datatracks && set.datatracks.length > 0 && set.datatracks[0].type === 'variant') 
    {
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

  if (isRegionHovered.value)
  {
    // Emit our svg y position so that other synteny sections can see it
    emit('synteny-hover', mouseYPos.value ?? null);

    if (isDetailed){
      emit('block-hover', [props.region.gaplessBlock.posY1, props.region.gaplessBlock.posY2]);
    }
    // emit('block-hover', [blockSection.speciesStart, blockSection.speciesStop]);

  }
};

const getBlockFromSVGPosition = (svgY: number) => {
  // First check the gapless block to see if we even need to loop through the synteny blocks
  if (props.region.gaplessBlock.posY1 <= svgY && props.region.gaplessBlock.posY2 >= svgY)
  {
    // Loop through its synteny blocks to identify which block is at this svg position
    for (let i = 0; i < props.region.syntenyBlocks.length; i++)
    {
      const block = props.region.syntenyBlocks[i];
      if (block.posY1 <= svgY && block.posY2 >= svgY)
      {
        return block;
      }
    }
  }

  return null;
};

const updatePositionLabelFromSVG = (svgY: number) => {
  const blockSection = getBlockFromSVGPosition(svgY);
  if (blockSection != null)
  {
    const basePairPos = getBasePairPositionFromSVG(svgY, blockSection.posY1, blockSection.posY2, blockSection.speciesStart, blockSection.speciesStop);
    basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';
  }
  else
  {
    basePairPositionLabel.value = '';
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
  pointer-events: none;
}

.level-2
{
  filter: brightness(60%);
}

.block-section
{
  stroke-width: 0;
  &.variant
  {
    stroke-width: 0.25;
  }
}
.block-section:hover
{
  cursor: pointer;
}

.position-label
{
  stroke: black;
  pointer-events: none;
}
</style>