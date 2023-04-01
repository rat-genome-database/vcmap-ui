<template>
  <svg :viewBox="'0 0 800 ' + SVGConstants.viewboxHeight" xmlns="http://www.w3.org/2000/svg" id="svg-wrapper" width="100%">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="800" :height="SVGConstants.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" x="0" @click.left="(event) => overviewSelectionHandler(event, overviewBackboneSet?.backbone)" 
      @mousemove.stop="(event) => updateOverviewSelection(event)" @contextmenu.prevent @click.right="cancelOverviewSelection"
      :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />

    <rect id="detailed" class="panel selectable" :class="{'is-loading': arePanelsLoading}" @click.left="(event) => detailedSelectionHandler(event)"
      @mousemove="updateZoomSelection" @contextmenu.prevent @click.right="cancelDetailedSelection" 
      :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />

    

    <!-- Ortholog Lines -->
    <template v-for="(line, index) in orthologLines" :key="index">
      <OrthologLineSVG :line="line" />
    </template>
    
    <!-- Overview panel SVGs ------------------------------------------->
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(region, index) in syntenySet.regions" :key="index">
        <SectionSVG show-chromosome show-synteny-on-hover show-start-stop select-on-click :region="region as SyntenyRegion" />
      </template>
    </template>

    <template v-if="overviewBackboneSet">
      <BackboneSetSVG show-data-on-hover :backbone-set="overviewBackboneSet"/>
    </template>

    <!-- Detail panel SVGs ----------------------------------------->
    <template v-if="detailedBackboneSet">
      <BackboneSetSVG show-data-on-hover :backbone-set="detailedBackboneSet" />
      <template v-if="detailedBackboneSet.datatrackLabels">
        <template v-for="(label, index) in detailedBackboneSet.datatrackLabels" :key="index">
          <template v-if="(label.isVisible)">
            <GeneLabelSVG :label="label as GeneLabel" :gene-list="geneList"/>
          </template>
        </template>
      </template>
    </template>

    <template v-if="detailedSyntenySets.length">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(syntenicRegion, index) in syntenySet.regions" :key="index">
          <SectionSVG show-chromosome :region="syntenicRegion as SyntenyRegion" />
        </template>
        <template v-for="(label, index) in syntenySet.geneLabels" :key="index">
          <template v-if="label.isVisible">
            <GeneLabelSVG :label="label" :gene-list="geneList"/>
          </template>
        </template>
      </template>
    </template>

<!--TEMP-->
    <template v-for="(rectangle, index) in testRects2" :key="index">
      <rect :fill="rectangle.elementColor" fill-opacity="0.8" x="460.0" width="10.0"
            :height="rectangle.posY2 - rectangle.posY1" :y="rectangle.posY1"
            :data-name="rectangle.name"
      />
    </template>
    <template v-for="(rectangle, index) in testRects3" :key="index">
      <rect :fill="rectangle.elementColor" fill-opacity="0.8" x="435.0" width="5.0"
            :height="rectangle.posY2 - rectangle.posY1" :y="rectangle.posY1"
            :data-name="rectangle.name"
      />
    </template>
    <template v-for="(rectangle, index) in testRects4" :key="index">
      <rect :fill="rectangle.elementColor" fill-opacity="1.0" x="437.5" width="1.0"
            :height="rectangle.posY2 - rectangle.posY1" :y="rectangle.posY1"
            :data-name="rectangle.name"
      />
    </template>
<!--endTEMP-->
    <!-- Title panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
    <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.panelTitleYPosition">Detailed</text>

    <!-- SyntenyRegionSet Title Labels -->
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
        <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="overviewBackboneSet">
      <template v-for="(label, index) in overviewBackboneSet.titleLabels" :key="index">
        <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="detailedBackboneSet">
      <template v-for="(label, index) in detailedBackboneSet.titleLabels" :key="index">
        <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="detailedSyntenySets.length">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
          <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
        </template>
      </template>
    </template>

    <!-- Navigation buttons -->
    <rect class="navigation-btn" :class="{'disabled': isNavigationUpDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDownDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-up.svg" @click="navigateUp" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-down.svg" @click="navigateDown" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />

    <rect v-if="currentlySelectingRegion()" id="selecting-overview" class="selecting-panel" :class="{'is-loading': arePanelsLoading}" x="0" 
      @mousemove="updateOverviewSelection" @contextmenu.prevent @click.right="cancelOverviewSelection" @click.left="(event) => overviewSelectionHandler(event, overviewBackboneSet?.backbone)"
      :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />

    <rect v-if="currentlySelectingRegion()" id="selecting-detailed" class="selecting-panel" :class="{'is-loading': arePanelsLoading}"
      @mousemove="updateZoomSelection" @contextmenu.prevent @click.right="cancelDetailedSelection" @click.left="(event) => detailedSelectionHandler(event)"
      :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />

    <!-- Detailed panel selection svg for zoom -->
    <rect v-if="startDetailedSelectionY && stopDetailedSelectionY" 
      @mousedown.left="(event) => detailedSelectionHandler(event)"
      @click.right="cancelDetailedSelection"
      @mousemove="updateZoomSelection"
      @contextmenu.prevent
      fill="lightgray"
      fill-opacity="0.4"
      :x="SVGConstants.overviewPanelWidth" :y="startDetailedSelectionY"
      :width="SVGConstants.detailsPanelWidth" :height="stopDetailedSelectionY - startDetailedSelectionY" />

    <!-- Overview panel selection svg for backbone -->
    <rect v-if="startOverviewSelectionY && stopOverviewSelectionY"
      @mousemove="(event) => updateOverviewSelection(event)"
      @contextmenu.prevent
      @mousedown.left="(event) => overviewSelectionHandler(event, overviewBackboneSet?.backbone)" 
      @click.right="cancelOverviewSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="0" :y="startOverviewSelectionY"
      :width="SVGConstants.overviewPanelWidth" :height="stopOverviewSelectionY - startOverviewSelectionY" />
  </svg>

  <VCMapDialog 
    v-model:show="showDialog" 
    :header="dialogHeader" 
    :message="dialogMessage"
    :theme="dialogTheme"
    :show-back-button="showDialogBackButton"
  />
  <LoadingSpinnerMask v-if="arePanelsLoading" :style="getDetailedPosition()"></LoadingSpinnerMask>
  <!--
  <Button
    style="margin-right: 20px;"
    class="p-button-info"
    label="Backbone QTLs"
    @click="loadBackboneQtls"
  />
  -->
  <!--
  <Button
    class="p-button-info"
    :label="backboneVariantsLoaded ? 'Remove Backbone Variants' : 'Load Backbone Variants'"
    @click="handleBackboneVariantClick"
  />
  -->
  <h2>Blocks</h2>
  <template v-for="[mapKey, blocks] in props.syntenyTree" :key="mapKey">
    <p>MapKey {{mapKey}}:</p>
    <template v-for="(block, index) in blocks" :key="index">
      <ul>
        <b>{{ index }}</b>
        <li>Chr{{ block.chromosome.chromosome }}: ({{ block.start }}, {{ block.stop }}) [{{ block.stop - block.start }}]</li>
        <li>ChainLevel: {{ block.chainLevel }}</li>
        <li>Backbone: ({{ block.backboneStart }}, {{ block.backboneStop }})</li>
        <li>Genes: {{ block.genes.length }}</li>
        <li>Gaps: {{ block.gaps.length }}</li>
      </ul>
    </template>
  </template>
  <h2>Genes</h2>
  <p>{{ props.geneList.size }}</p>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import SectionSVG from './SectionSVG.vue';
import SVGConstants, {PANEL_SVG_START, PANEL_SVG_STOP} from '@/utils/SVGConstants';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import VCMapDialog from '@/components/VCMapDialog.vue';
import GeneLabelSVG from '@/components/GeneLabelSVG.vue';
import useDialog from '@/composables/useDialog';
import Gene from '@/models/Gene';
import OrthologLine from '@/models/OrthologLine';
import SelectedData from '@/models/SelectedData';
import useDetailedPanelZoom from '@/composables/useDetailedPanelZoom';
import { key } from '@/store';
import { backboneDetailedError, backboneOverviewError, missingComparativeSpeciesError, noRegionLengthError } from '@/utils/VCMapErrors';
import { createSyntenicRegionSets,  } from '@/utils/SectionBuilder';
import useOverviewPanelSelection from '@/composables/useOverviewPanelSelection';
import { useLogger } from 'vue-logger-plugin';
import { createBackboneSection, backboneDatatrackBuilder, createBackboneSet } from '@/utils/BackboneBuilder';
import BackboneSetSVG from './BackboneSetSVG.vue';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import QtlApi from '@/api/QtlApi';
import VariantApi from '@/api/VariantApi';
import BackboneSet from '@/models/BackboneSet';
import { createOverviewSyntenicRegionSets } from '@/utils/SectionBuilder';
import OrthologLineSVG from './OrthologLineSVG.vue';
import LoadingSpinnerMask from './LoadingSpinnerMask.vue';
import { createQtlDatatracks } from '@/utils/QtlBuilder';
import { createVariantDatatracks } from '@/utils/VariantBuilder';
import { GenomicSectionFactory } from '@/models/GenomicSectionFactory';
import {VCMapSVGEl} from "@/models/VCMapSVGElement";
import Block from "@/models/Block";

// TODO: Unneeded? (Need to rework how to "Load by Gene")
import { getNewSelectedData } from '@/utils/DataPanelHelpers';
import { GeneLabel } from '@/models/Label';
import SyntenyRegion from '@/models/SyntenyRegion';
const LOAD_BY_GENE_VISIBLE_SIZE_MULTIPLIER = 6;
const NAV_SHIFT_PERCENT = 0.2;

const store = useStore(key);
const $log = useLogger();

const { showDialog, dialogHeader, dialogMessage, showDialogBackButton, dialogTheme, onError } = useDialog();
const { startDetailedSelectionY, stopDetailedSelectionY, updateZoomSelection, detailedSelectionHandler, cancelDetailedSelection, getDetailedSelectionStatus} = useDetailedPanelZoom(store);
const { startOverviewSelectionY, stopOverviewSelectionY, updateOverviewSelection, overviewSelectionHandler, cancelOverviewSelection, getOverviewSelectionStatus } = useOverviewPanelSelection(store);

interface Props
{
  geneList: Map<number, Gene>;
  syntenyTree: Map<number, Block[]>;
  loading: boolean;
}

const props = defineProps<Props>();

let detailedSyntenySets = ref<SyntenyRegionSet[]>([]); // The currently displayed SyntenicRegions in the detailed panel
let overviewBackboneSet = ref<BackboneSet>();
let detailedBackboneSet = ref<BackboneSet>();
let overviewSyntenySets = ref<SyntenyRegionSet[]>([]);
let testRects = ref<VCMapSVGEl[]>();
let testRects2 = ref<VCMapSVGEl[]>();
let testRects3 = ref<VCMapSVGEl[]>();
let testRects4 = ref<VCMapSVGEl[]>();

const orthologLines = computed(() => {
  let lines: OrthologLine[] = [];
  detailedSyntenySets.value.forEach(set => {
    set.regions.forEach(region => {
      lines = lines.concat(region.orthologLines as OrthologLine[]);
    });
  });

  return lines;
});

const backboneVariantsLoaded = computed(() => {
  return detailedBackboneSet.value?.datatrackSets.some((set) => set.type === 'variant');
});

async function attachToProgressLoader(storeLoadingActionName: string, func: () => Promise<any>)
{
  try
  {
    store.dispatch(storeLoadingActionName, true);
    await func();
  }
  catch (err)
  {
    onError(err, 'An error occurred while updating the overview panel', false);
  }
  finally
  {
    store.dispatch(storeLoadingActionName, false);
  }
}

onMounted(async () => {
  // Clear any prior selections or set as the searched gene
  // const gene = store.state.gene;
  // store.dispatch('setSelectedData', gene ? [new SelectedData(gene.clone(), 'Gene')] : null);

  //await attachToProgressLoader('setIsOverviewPanelUpdating', updateOverviewPanel);
});

watch(() => store.state.configurationLoaded, () => {
  if (store.state.configurationLoaded === true)
  {
    attachToProgressLoader('setIsOverviewPanelUpdating', updateOverviewPanel);
  }
});

/**
 * Have a progress loader for the Details Panel update process.
 */
watch(() => store.state.detailedBasePairRange, () => {
  if (store.state.configurationLoaded)
  {
    attachToProgressLoader('setIsDetailedPanelUpdating', updateDetailsPanel);
  }
});

// FIXME: check on this (probably needs to be attached to Main props instead):
const arePanelsLoading = computed(() => {
  // Either panel is processing or API is being queried
  return store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating || props.loading;
});

const currentlySelectingRegion = () => {
  return (getOverviewSelectionStatus() || getDetailedSelectionStatus());
};

const updateOverviewPanel = async () => {
  $log.debug('Updating Overview Panel');

  const overviewUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;

  if (backboneSpecies == null || backboneChromosome == null)
  {
    $log.error('Backbone species or chromosome is null during overview panel update');
    overviewSyntenySets.value = [];
    return;
  }

  // Build backbone set
  overviewSyntenySets.value = [];
  const overviewBackbone = createBackboneSection(backboneSpecies, backboneChromosome, 0, backboneChromosome.seqLength, 'overview');
  overviewBackboneSet.value = createBackboneSet(overviewBackbone);

  const overviewBackboneCreationTime = Date.now();

  // Build overview synteny sets
  const overviewSyntenyTrackCreationTime = Date.now();
  overviewSyntenySets.value = await createOverviewSyntenicRegionSets(props.syntenyTree, store.state.comparativeSpecies, backboneChromosome);

  // TODO: request an update to the detailed panel here

  // TODO: double check this logic:
  const overviewCreateBackboneSelectionTime = Date.now();
  logPerformanceReport('Update Overview Time', (overviewCreateBackboneSelectionTime - overviewUpdateStart), {
    'Create Backbone Track': (overviewBackboneCreationTime - overviewUpdateStart),
    'Create Synteny Tracks': (overviewSyntenyTrackCreationTime - overviewBackboneCreationTime),
    'Create Backbone Selection': (overviewCreateBackboneSelectionTime - overviewSyntenyTrackCreationTime)
  });
};

/**
 * Update the SVG elements on the "detailed" panel of the SVG. This involves removing those
 * previously viewed elements (by clearing our reactive refs in this class) and then creating
 * a view of the new viewport that only includes things in our visible range.
 * NOTE: Some of the elements we remove and recreate might actually have the represented the
 *   same memory structures and in a future iteration we will try to adjust the position of
 *   those elements as opposed to removing and recreating them.
 */
const updateDetailsPanel = async () => {
  $log.debug(`Updating Detailed Panel`);

  const detailedUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const detailedBasePairRange = store.state.detailedBasePairRange;

  // Get comparison species Ids for ortholog API call parameter
  const comparativeSpeciesIds: number[] = [];
  store.state.comparativeSpecies.map(species => comparativeSpeciesIds.push(species.defaultMapKey));

  // debug timers
  let timeSyntenyTracks = 0;
  let timeBackboneFilterGenes = 0;
  let timeCreateBackboneDatatracks = 0;
  let timeCreateBackboneSet = 0;
  let timeAdjustVisibleRegion = 0;

  // error if invalid base pair range
  if (detailedBasePairRange.stop - detailedBasePairRange.start <= 0)
  {
    // Clear out our detailed synteny sets
    $log.error(`Invalid detailedBasePairRange?? (${detailedBasePairRange.start}, ${detailedBasePairRange.stop})`);
    detailedSyntenySets.value = [];
    return;
  }

  //error if no backbone species or chromosome
  if (backboneSpecies == null || backboneChromosome == null)
  {
    detailedSyntenySets.value = [];
    return;
  }

  //
  // First, create the visible backbone elements
  const detailedBackbone = createBackboneSection(backboneSpecies, backboneChromosome,
      store.state.detailedBasePairRange.start, store.state.detailedBasePairRange.stop, 'detailed');
  const backboneFilterGenesStart = Date.now();
  const backboneGenes: Gene[] = [];
  props.geneList.forEach((gene: Gene) => {
    if (gene.mapKey == backboneSpecies.activeMap.key && isBpRangeVisible(gene.start, gene.stop))
    {
      // Only add visible genes
      backboneGenes.push(gene);
    }
  });
  timeBackboneFilterGenes = Date.now() - backboneFilterGenesStart;
  const backboneDatatracksStart = Date.now();
  const backboneDatatrackInfo = backboneDatatrackBuilder(backboneSpecies, backboneGenes, detailedBackbone);
  timeCreateBackboneDatatracks = Date.now() - backboneDatatracksStart;
  const backboneSetStart = Date.now();
  detailedBackboneSet.value = createBackboneSet(detailedBackbone, backboneDatatrackInfo.processedGenomicData);
  // TODO: Do we need to call .adjustVisibleSet anymore? Since we re-create the whole backbone set on each nav up/down and zoom,
  // the positions should already be set. We'd just need to move the gene label processing into the constructor of the BackboneSet
  // model.
  //detailedBackboneSet.value?.adjustVisibleSet(store.state.detailedBasePairRange.start, store.state.detailedBasePairRange.stop);
  timeCreateBackboneSet = Date.now() - backboneSetStart;

  //
  // Next, the visible Synteny elements
  const syntenyTracksStart = Date.now();
  detailedSyntenySets.value = await createSyntenicRegionSets(
      props.syntenyTree,
      store.state.comparativeSpecies,
      backboneChromosome,
      detailedBasePairRange.start,
      detailedBasePairRange.stop,
  );
  // TODO: Remove if able, processGeneLabels() now called from SyntenyRegionSet contstructor
  // detailedSyntenySets.value.forEach(set => {
  //   set.processGeneLabels();
  // });
  timeSyntenyTracks = Date.now() - syntenyTracksStart;

  // Report timing data
  const timeDetailedUpdate= Date.now() - detailedUpdateStart;
  const timeDetailedUpdateOther = timeDetailedUpdate - (
    + timeBackboneFilterGenes
    + timeCreateBackboneDatatracks
    + timeCreateBackboneSet
    + timeSyntenyTracks 
    + timeAdjustVisibleRegion);
  logPerformanceReport('Update Detailed Time', timeDetailedUpdate, {
    'Filter Backbone Genes': timeBackboneFilterGenes,
    'Create Backbone Datatracks': timeCreateBackboneDatatracks,
    'Create Backbone Set, and AdjustY': timeCreateBackboneSet,
    'Create Synteny Tracks': timeSyntenyTracks,
    'Adjust Visible Region': timeAdjustVisibleRegion,
    'Misc': timeDetailedUpdateOther,
  });
};

const navigateUp = () => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (isNavigationUpDisabled.value || selectedRegion?.viewportSelection == null) return;
  // const chromosome = selectedRegion.chromosome;

  if (store.state.detailedBasePairRange)
  {
    const currRange = store.state.detailedBasePairRange;
    let adjust = NAV_SHIFT_PERCENT * (currRange.stop - currRange.start);
    if (currRange.start < adjust) adjust = currRange.start;
    store.dispatch('setDetailedBasePairRequest', { start: currRange.start - adjust, stop: currRange.stop - adjust });
  }
};

const navigateDown = () => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (isNavigationDownDisabled.value || selectedRegion?.viewportSelection == null) return;
  const chromosome = selectedRegion.chromosome;

  if (store.state.detailedBasePairRange)
  {
    const currRange = store.state.detailedBasePairRange;
    let adjust = NAV_SHIFT_PERCENT * (currRange.stop - currRange.start);
    if (currRange.stop + adjust > chromosome.seqLength) adjust = chromosome.seqLength - currRange.stop;
    store.dispatch('setDetailedBasePairRequest', { start: currRange.start + adjust, stop: currRange.stop + adjust });
  }
};


const isNavigationUpDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }

  const selectedRegion = store.state.selectedBackboneRegion;

  if (selectedRegion && selectedRegion.viewportSelection)
  {
    return 0 > selectedRegion.viewportSelection.basePairStart;
  }

  return false;
});

const isNavigationDownDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }
  
  const selectedRegion = store.state.selectedBackboneRegion;
  
  if (selectedRegion && selectedRegion.viewportSelection)
  {
    return 0 >= selectedRegion.viewportSelection.basePairStop;
  }

  return false;
});


const getDetailedPosition = () =>
{
  const detailedPanel = document.getElementById('detailed');
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  if (detailedPanel)
  {
    const detailedPanelDomPositions = detailedPanel.getBoundingClientRect();
    return {
      position: 'absolute',
      top: String(detailedPanelDomPositions.top + scrollY)+ 'px',
      bottom: String(detailedPanelDomPositions.bottom ) + 'px',
      right: String(detailedPanelDomPositions.right) + 'px',
      left: String(detailedPanelDomPositions.left + scrollX) + 'px',
      width: String(detailedPanelDomPositions.width) + 'px',
      height: String(detailedPanelDomPositions.height ) + 'px',
    };
  }
};


const tempReplace = () => {
  const chromosome = store.state.chromosome;
  const backboneSpecies = store.state.species;
  const viewportStart = store.state.detailedBasePairRange.start;
  const viewportStop = store.state.detailedBasePairRange.stop;
  if (viewportStart == undefined || viewportStop == undefined) return;

  console.log(`Looking at (${viewportStart}, ${viewportStop})`);
  // Remove all Rectangles from our special Array
  testRects.value = [];
  testRects2.value = [];

  // (Backbone) Loop loaded gene data from Main
  props.geneList.forEach((gene) => {
    //console.log(`Inspecting gene: `, gene);
    let start, stop, list:VCMapSVGEl[];
    if (gene.speciesName == backboneSpecies?.name && gene.chromosome == chromosome?.chromosome)
    {
      start = gene.start;
      stop = gene.stop;
      list = testRects.value ?? [];
    }
    else
    {
      start = gene.backboneStart ?? -1;
      stop = gene.backboneStop ?? -1;
      list = testRects2.value ?? [];
    }

    // Create new Rectangle for each gene that should be visible
    if (isBpRangeVisible(start, stop))
    {
      let newRect = new VCMapSVGEl();
      const svgHeight = PANEL_SVG_STOP - PANEL_SVG_START;
      const bpVisibleWindowLength = Math.abs(viewportStop - viewportStart);
      const pixelsPerBpRatio = svgHeight / bpVisibleWindowLength;
      // console.debug(`Visible: num pixels (${svgLength}), num bp (${bpVisibleWindowLength}) starting at (${viewportStart})`);
      newRect.posY1 = (start - viewportStart) * pixelsPerBpRatio + PANEL_SVG_START;
      newRect.posY2 = (stop - viewportStart) * pixelsPerBpRatio + PANEL_SVG_START;
      newRect.start = start;
      newRect.stop = stop;
      newRect.name = gene.symbol;

      // Add to our special list (rendered as red rectangles in the template)
      // NOTE: This proof of concept will always add all new SVG `rect`s to the SVG on each
      //   call. This is not performant because we should attempt to adjust existing, remove
      //   those that are now off-screen, and only add new ones that were previously not
      //   on-screen.
      //   Sounds like a lot of work, but less DOM manipulation and reactivity might make
      //   this more performant because there are fewer microtasks generated as side
      //   effects.
      //   However, for now this will demonstrate the concepts needed for the reorganization.
      list.push(newRect);
    }
  });

  // And Blocks
  testRects3.value = []; // Gapless blocks
  testRects4.value = []; // Gaps
  props.syntenyTree.forEach((blocks, mapKey) => {
    console.log(`Processing mapKey ${mapKey}`);
    blocks.forEach((block) => {
      if (block.chainLevel == 1)
      {
        if (isBpRangeVisible(block.backboneStart, block.backboneStop))
        {
          let newRect = new VCMapSVGEl();
          const svgLength = PANEL_SVG_STOP - PANEL_SVG_START;
          const bpVisibleWindowLength = Math.abs(viewportStop - viewportStart);
          const pixelsToBpRatio = svgLength / bpVisibleWindowLength;
          // console.debug(`Visible: num pixels (${svgLength}), num bp (${bpVisibleWindowLength}) starting at (${viewportStart})`);
          newRect.posY1 = (block.backboneStart - viewportStart) * pixelsToBpRatio + PANEL_SVG_START;
          newRect.posY2 = (block.backboneStop - viewportStart) * pixelsToBpRatio + PANEL_SVG_START;
          newRect.start = block.backboneStart;
          newRect.stop = block.backboneStop;

          // Now handle gaps
          // TODO: Gaps should actually adjust the ratio as they would add to the aligned bp for the block...
          let blockRatio = Math.abs(block.backboneStop - block.backboneStart) /
              Math.abs(block.stop - block.start);
          if (block.orientation == '+')
          {
            for (let i = 0, len = block.gaps.length; i < len; i++)
            {
              let gapStart = block.backboneStart + (block.gaps[i].start - block.start) * blockRatio;
              let gapStop = block.backboneStart + (block.gaps[i].stop - block.start) * blockRatio;
              if (gapStop > viewportStop) break;
              if (isBpRangeVisible(gapStart, gapStop))
              {
                let gapRect = new VCMapSVGEl();
                gapRect.elementColor = 'black';
                gapRect.posY1 = (gapStart - viewportStart) * pixelsToBpRatio + PANEL_SVG_START;
                gapRect.posY2 = (gapStop - viewportStart) * pixelsToBpRatio + PANEL_SVG_START;
                testRects4.value?.push(gapRect);
              }
            }
          }
          else if (block.orientation == '-')
          {
            for (let i = block.gaps.length - 1; i >= 0; i--)
            {
              let gapStart = block.backboneStart + (block.stop - block.gaps[i].stop) * blockRatio;
              let gapStop = block.backboneStart + (block.stop - block.gaps[i].start) * blockRatio;
              if (gapStop > viewportStop) break;
              if (isBpRangeVisible(gapStart, gapStop))
              {
                let gapRect = new VCMapSVGEl();
                gapRect.elementColor = 'black';
                gapRect.posY1 = (gapStart - viewportStart) * pixelsToBpRatio + PANEL_SVG_START;
                gapRect.posY2 = (gapStop - viewportStart) * pixelsToBpRatio + PANEL_SVG_START;
                testRects4.value?.push(gapRect);
              }
            }
          }

          testRects3.value?.push(newRect);
        }
      }
      // else if (block.chainLevel == 2)
      // {
      //
      // }
    });
  });
};

/**
 * Helper function to determine if a Range of bp position in the Backbone
 * is visible in any part of the viewport. There are three possibilities:
 *   1) Start is inside the viewport
 *   2) Stop is inside the viewport
 *   3) Start & Stop surround the viewport
 */
const isBpRangeVisible = (start: number, stop: number) => {
  const backboneRegion = store.state.selectedBackboneRegion;
  const viewportStart = backboneRegion?.viewportSelection?.basePairStart ?? -1;
  const viewportStop = backboneRegion?.viewportSelection?.basePairStop ?? -1;
  // if (start >= viewportStart && start <= viewportStop)
  //   return true;
  // else if (stop >= viewportStart && stop <= viewportStop)
  //   return true;
  // else if (start < viewportStart && stop > viewportStop)
  //   return true;

  // Simplified above comparisons to single statement
  return (start <= viewportStop && stop >= viewportStart);
};

// TODO: temp ignore here, should remove once this method is actively being used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadBackboneQtls = async () => {
  const chromosome = store.state.chromosome;
  const backboneSpecies = store.state.species;
  const backboneRegion = store.state.selectedBackboneRegion;
  const start = backboneRegion?.viewportSelection?.basePairStart;
  const stop = backboneRegion?.viewportSelection?.basePairStop;
  const speciesMap = store.state.species?.activeMap;

  if (chromosome && stop && speciesMap && backboneSpecies)
  {
    const factory = new GenomicSectionFactory(
      backboneSpecies.name,
      speciesMap.name,
      chromosome.chromosome,
      { start: start || 0, stop: stop },
      'detailed'
    );
    const qtls = await QtlApi.getQtls(chromosome.chromosome, start || 0, stop, speciesMap.key);
    const qtlDatatracks = createQtlDatatracks(factory, qtls, backboneSpecies, chromosome);
    detailedBackboneSet.value?.addNewDatatrackSetToStart(qtlDatatracks, 'qtl');
  }
};

const loadBackboneVariants = async () => {
  const chromosome = store.state.chromosome;
  const backboneSpecies = store.state.species;
  const backboneRegion = store.state.selectedBackboneRegion;
  const start = backboneRegion?.viewportSelection?.basePairStart;
  const stop = backboneRegion?.viewportSelection?.basePairStop;
  const speciesMap = store.state.species?.activeMap;
  if (chromosome && stop && speciesMap && backboneSpecies)
  {
    // NOTE: for now, we always query for the whole chrom to get maxCount for chrom
    // This should/could probably get moved the VariantBuilder
    const variantPositions = await VariantApi.getVariants(chromosome.chromosome, 0, chromosome.seqLength, speciesMap.key);
    if (variantPositions.length > 0)
    {
      const factory = new GenomicSectionFactory(
        backboneSpecies.name,
        speciesMap.name,
        chromosome.chromosome,
        { start: start || 0, stop: stop },
        'detailed'
      );
      const variantDatatracks = createVariantDatatracks(factory, variantPositions, chromosome, start || 0, stop);
      detailedBackboneSet.value?.addNewDatatrackSetToStart(variantDatatracks, 'variant');
      // NOTE: because we're shifting the genes when adding to start, we also need to shift lines
      if (orthologLines.value)
      {
        orthologLines.value.forEach((line) => line.posX1 += 20);
      }
    }
    else
    {
      onError(null, 'No variants found for the requested region.', false);
    }
  }
};

const removeBackboneVariants = () => {
  const variantSetIdx = detailedBackboneSet.value?.datatrackSets.findIndex((set) => set.type === 'variant') ?? -1;
  if (variantSetIdx !== -1)
  {
    detailedBackboneSet.value?.removeDatatrackSet(variantSetIdx);

      // NOTE: this only works because we are always adding the variants first/before the genes,
      // Long term we'll want to make this more general
      if (orthologLines.value)
      {
        orthologLines.value.forEach((line) => line.posX1 -= 20);
      }
  }
};

// TODO: temp ignore here, should remove once this method is actively being used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleBackboneVariantClick = () => {
  backboneVariantsLoaded.value ? removeBackboneVariants() : loadBackboneVariants();
};

document.addEventListener('scroll' , getDetailedPosition);

// listen for escape press, cancel overview/detailed panel selection if active.
window.addEventListener('keyup', function(event) {
    // If  ESC key was pressed...
    if (event.keyCode === 27) {
      cancelOverviewSelection();
      cancelDetailedSelection();
    }
});

function logPerformanceReport(title: string, totalTimeMillis: number, detailedTimeReportObject: { [key:string]: number} )
{
  const performanceReport: any = {
    [title]: totalTimeMillis + ' ms',
    Details: {}
  };

  for (const detailTitle in detailedTimeReportObject)
  {
    performanceReport.Details[detailTitle] = detailedTimeReportObject[detailTitle] + ' ms | ' + ((detailedTimeReportObject[detailTitle] / totalTimeMillis * 100).toFixed(2) + '%');
  }

  $log.debug(JSON.stringify(performanceReport, null, 2));
}

</script>

<style lang="scss" scoped>
#svg-wrapper
{
  user-select: none ;
  z-index: -1;
}

.label.small.smaller
{
  font-size: 7px;
}

rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
  z-index: 0;

  &.selectable:not(.is-loading)
  {
    cursor: crosshair;
  }

  &.is-loading
  {
    cursor: wait;
  }
}

rect.selecting-panel
{
  fill: white;
  opacity: 0;
  position: absolute;
  z-index: 1;

  &.selectable:not(.is-loading)
  {
    cursor: crosshair;
  }

  &.is-loading
  {
    cursor: wait;
  }
}

.vcmap-loader.p-progressbar
{
  height: 0.25em;
}

rect.navigation-btn
{
  fill: lightgray;
  stroke-width: 1;
  stroke: lightslategray;
  &:hover:not(.disabled)
  {
    fill: whitesmoke;
    cursor: pointer;
  }

  &.disabled
  {
    cursor: not-allowed;
  }
}

.nav-btn-img
{
  cursor: pointer;
  pointer-events: none;
}
</style>
