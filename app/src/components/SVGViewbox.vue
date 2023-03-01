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
        <SectionSVG show-chromosome show-synteny-on-hover show-start-stop select-on-click :region="(region as SyntenyRegion)" />
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
            <GeneLabelSVG :label="(label as GeneLabel)" />
          </template>
        </template>
      </template>
    </template>

    <template v-if="detailedSyntenySets.length && isRendered">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(syntenicRegion, index) in syntenySet.regions" :key="index">
          <SectionSVG show-chromosome :region="syntenicRegion as SyntenyRegion" />
        </template>
        <template v-for="(label, index) in syntenySet.datatrackLabels" :key="index">
          <template v-if="label.isVisible">
            <GeneLabelSVG :label="(label as GeneLabel)"/>
          </template>
        </template>
      </template>
    </template>

    <!-- Title panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
    <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.panelTitleYPosition">Detailed</text>

    <!-- SyntenyRegionSet Title Labels -->
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
        <text class="label small" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="overviewBackboneSet">
      <template v-for="(label, index) in overviewBackboneSet.titleLabels" :key="index">
        <text class="label small" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="detailedBackboneSet">
      <template v-for="(label, index) in detailedBackboneSet.titleLabels" :key="index">
        <text class="label small" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="detailedSyntenySets.length">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
          <text class="label small" :x="label.posX" :y="label.posY">{{label.text}}</text>
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
    :show-back-button="showDialogBackButton" 
    :on-confirm-callback="(isMissingSynteny) ? () => {allowDetailedPanelProcessing = true} : undefined"
  />
  <LoadingSpinnerMask v-if="enableProcessingLoadMask" :style="getDetailedPosition()"></LoadingSpinnerMask>
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import SectionSVG from './SectionSVG.vue';
import SVGConstants from '@/utils/SVGConstants';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import VCMapDialog from '@/components/VCMapDialog.vue';
import GeneLabelSVG from '@/components/GeneLabelSVG.vue';
import useDialog from '@/composables/useDialog';
import Gene from '@/models/Gene';
import OrthologLine from '@/models/OrthologLine';
import { GeneLabel } from '@/models/Label';
import SelectedData from '@/models/SelectedData';
import useDetailedPanelZoom from '@/composables/useDetailedPanelZoom';
import { key } from '@/store';
import { backboneDetailedError, backboneOverviewError, missingComparativeSpeciesError, noRegionLengthError } from '@/utils/VCMapErrors';
import { createSyntenicRegionsAndDatatracks,  } from '@/utils/SectionBuilder';
import useOverviewPanelSelection from '@/composables/useOverviewPanelSelection';
import { useLogger } from 'vue-logger-plugin';
import SyntenyRegion from '@/models/SyntenyRegion';
import { createBackboneSection, backboneDatatrackBuilder, createBackboneSet } from '@/utils/BackboneBuilder';
import BackboneSetSVG from './BackboneSetSVG.vue';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import GeneApi from '@/api/GeneApi';
import QtlApi from '@/api/QtlApi';
import VariantApi from '@/api/VariantApi';
import BackboneSet from '@/models/BackboneSet';
import { LoadedGene } from '@/models/DatatrackSection';
import { LoadedBlock } from '@/utils/SectionBuilder';
import OrthologLineSVG from './OrthologLineSVG.vue';
import LoadingSpinnerMask from './LoadingSpinnerMask.vue';
import { getNewSelectedData } from '@/utils/DataPanelHelpers';
import { createQtlDatatracks } from '@/utils/QtlBuilder';
import { createVariantDatatracks } from '@/utils/VariantBuilder';
import { GenomicSectionFactory } from '@/models/GenomicSectionFactory';

const LOAD_BY_GENE_VISIBLE_SIZE_MULTIPLIER = 6;

const store = useStore(key);
const $log = useLogger();

const { showDialog, dialogHeader, dialogMessage, showDialogBackButton, onError, checkSyntenyResultsOnComparativeSpecies } = useDialog();
const { startDetailedSelectionY, stopDetailedSelectionY, updateZoomSelection, detailedSelectionHandler, cancelDetailedSelection, getDetailedSelectionStatus} = useDetailedPanelZoom(store);
const { startOverviewSelectionY, stopOverviewSelectionY, updateOverviewSelection, overviewSelectionHandler, cancelOverviewSelection, getOverviewSelectionStatus } = useOverviewPanelSelection(store);

let isMissingSynteny = ref<boolean>(false);
let allowDetailedPanelProcessing = ref<boolean>(false);
let detailedSyntenySets = ref<SyntenyRegionSet[]>([]); // The currently displayed SyntenicRegions in the detailed panel
let overviewBackboneSet = ref<BackboneSet>();
let detailedBackboneSet = ref<BackboneSet>();
let overviewSyntenySets = ref<SyntenyRegionSet[]>([]);
let enableProcessingLoadMask = ref<boolean>(false); // Whether or not to show the processing load mask
let isRendered = ref<boolean>(true); // Whether or not the user is adjusting the detailed panel

let geneReload: boolean = false; //whether or not load by gene reload has occurred

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
    onError(err, 'An error occurred while updating the overview panel');
  }
  finally
  {
    store.dispatch(storeLoadingActionName, false);
  }
}

onMounted(async () => {
  // Clear any prior selections or set as the searched gene
  const gene = store.state.gene;
  if (gene) 
  {
    let selectedData = new SelectedData(gene, 'Gene');
    store.dispatch('setSelectedData', [selectedData]);
  } 
  else 
  {
    store.dispatch('setSelectedData', null);
  }

  await attachToProgressLoader('setIsOverviewPanelUpdating', updateOverviewPanel);

  // Note: We need to type cast here b/c SyntenyRegionSet contains private fields and type-checking fails
  // See: https://github.com/vuejs/core/issues/2981
  isMissingSynteny.value = !(checkSyntenyResultsOnComparativeSpecies(overviewSyntenySets.value as SyntenyRegionSet[]));

  // Prevent detailed panel processing from happening if there is an issue with off-backbone synteny
  // A dialog will appear to let the user confirm before proceeding...
  if (!isMissingSynteny.value)
  {
    allowDetailedPanelProcessing.value = true;
  }
});

watch([() => store.state.detailedBasePairRange, allowDetailedPanelProcessing], () => {
  if (allowDetailedPanelProcessing.value)
  {
    attachToProgressLoader('setIsDetailedPanelUpdating', updateDetailsPanel);
  }
});

const arePanelsLoading = computed(() => {
  return store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating;
});

const currentlySelectingRegion = () => {
  return (getOverviewSelectionStatus() || getDetailedSelectionStatus());
};

const updateOverviewPanel = async () => {
  $log.debug('Updating Overview Panel');

  enableProcessingLoadMask.value = true;
  const overviewUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const backboneStart = store.state.startPos;
  const backboneStop = store.state.stopPos;
  const loadType = store.state.configTab;

  //error if backbone is not set
  if (backboneSpecies == null || backboneChromosome == null || backboneStart == null || backboneStop == null)
  {
    onError(backboneOverviewError, backboneOverviewError.message);
    overviewSyntenySets.value = [];
    enableProcessingLoadMask.value = false;
    return;
  }

  //error if backbone info is invalid length
  if (backboneStop - backboneStart <= 0)
  {
    onError(noRegionLengthError, noRegionLengthError.message);
    overviewSyntenySets.value = [];
    enableProcessingLoadMask.value = false;
    return;
  }

  overviewSyntenySets.value = [];
  // The backbone is the entire chromosome
  store.dispatch('setOverviewResolution', backboneChromosome.seqLength);

  //build backbone set
  const overviewBackbone = createBackboneSection(backboneSpecies, backboneChromosome, 0, backboneChromosome.seqLength, 'overview');
  overviewBackboneSet.value = createBackboneSet(overviewBackbone);

  const overviewBackboneCreationTime = Date.now();

  //error if no comparative species
  if (store.state.comparativeSpecies.length === 0)
  {
    onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
    enableProcessingLoadMask.value = false;
    return;
  }

  // TODO: Do we need masterGeneMap for the overview?
  const emptyBlockMap = new Map<number, LoadedBlock>();

  //build overview synteny sets
  const overviewSyntenyData = await createSyntenicRegionsAndDatatracks(
    store.state.comparativeSpecies,
    backboneChromosome,
    0,
    backboneChromosome.seqLength,
    0,
    backboneChromosome.seqLength,
    store.state.overviewSyntenyThreshold,
    false,
    emptyBlockMap
  );

  overviewSyntenySets.value = overviewSyntenyData.syntenyRegionSets;

  const overviewSyntenyTrackCreationTime = Date.now();

  // Set the backbone selection to the start and stop positions selected on the config screen if a selection doesn't already exist
  // (the backbone should have just 1 [0] section)

  //TODO: Change so that we are using the new full chromosome/bufferzone/viewport selection options to check for and rebuild selections
  const prevBackboneSelection = store.state.selectedBackboneRegion;
  
  if (overviewBackbone != null && prevBackboneSelection == null)
  {
    const selection = new BackboneSelection(
      new SelectedRegion(SVGConstants.overviewTrackYPosition, ( backboneChromosome.seqLength / store.state.overviewBasePairToHeightRatio ), 0, backboneChromosome.seqLength), 
      backboneChromosome
    );

    //if initially loading by gene, we need to set and process the full backbone range and syntenic blocks to find ortholog positions to later adjust so all are visible in the detail panel
    if (loadType === 0)
    {
      store.dispatch('setBackboneSelection', selection);
    }
    else
    {
      selection.setViewportSelection(backboneStart, backboneStop, store.state.overviewBasePairToHeightRatio);
      store.dispatch('setBackboneSelection', selection);
    }
  }
  else if (prevBackboneSelection)
  {
    const recreatedSelection = new BackboneSelection(
      new SelectedRegion(SVGConstants.overviewTrackYPosition, ( backboneChromosome.seqLength / store.state.overviewBasePairToHeightRatio ), 0, backboneChromosome.seqLength), 
      backboneChromosome
    );

    if (prevBackboneSelection.viewportSelection)
    {
      recreatedSelection.setViewportSelection(prevBackboneSelection.viewportSelection.basePairStart, prevBackboneSelection.viewportSelection.basePairStop, store.state.overviewBasePairToHeightRatio);
    }
    else
    {
      recreatedSelection.setViewportSelection(0, backboneChromosome.seqLength, store.state.overviewBasePairToHeightRatio);
    }
    store.dispatch('setBackboneSelection', recreatedSelection);
  }

  enableProcessingLoadMask.value = false;
  const overviewCreateBackboneSelectionTime = Date.now();
  logPerformanceReport('Update Overview Time', (overviewCreateBackboneSelectionTime - overviewUpdateStart), {
    'Create Backbone Track': (overviewBackboneCreationTime - overviewUpdateStart),
    'Create Synteny Tracks': (overviewSyntenyTrackCreationTime - overviewBackboneCreationTime),
    'Create Backbone Selection': (overviewCreateBackboneSelectionTime - overviewSyntenyTrackCreationTime)
  });
};

const updateDetailsPanel = async () => {
  $log.debug(`Updating Detailed Panel`);

  const detailedUpdateStart = Date.now();
  enableProcessingLoadMask.value = true;

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const loadType = store.state.configTab;
  const originalSelectedBackboneRegion: BackboneSelection = store.state.selectedBackboneRegion;
  const detailedBasePairRange = store.state.detailedBasePairRange;

  const masterBlockMap: Map<number, LoadedBlock> = store.state.LoadedBlocks ?? new Map<number, LoadedBlock>();

  // Get comparison species Ids for ortholog API call parameter
  const comparativeSpeciesIds: number[] = [];
  store.state.comparativeSpecies.map((gene: { defaultMapKey: number; }) => comparativeSpeciesIds.push(gene.defaultMapKey));

  // debug timers
  let timeSyntenyTracks = 0;
  let timeCreateBackboneTrack = 0;
  let timeQueryBackboneGenes = 0;
  let timeCreateBackboneDatatracks = 0;
  let timeCreateBackboneSet = 0;
  let timeAdjustVisibleRegion = 0;

  //error if invalid base pair range
  if (detailedBasePairRange.stop - detailedBasePairRange.start <= 0)
  {
    // Clear out our detailed synteny sets
    detailedSyntenySets.value = [];
    enableProcessingLoadMask.value = false;
    return;
  }

  //error if no backbone species or chromosome
  if (backboneSpecies == null || backboneChromosome == null)
  {
    onError(backboneDetailedError, backboneDetailedError.message);
    detailedSyntenySets.value = [];
    enableProcessingLoadMask.value = false;
    return;
  }

  //error if no comparative species
  if (store.state.comparativeSpecies.length === 0)
  {
    onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
    detailedSyntenySets.value = [];
    return;
  }
  // Get the range of the inner section that will be shown in the Detailed panel
  const zoomedSelection = originalSelectedBackboneRegion.setViewportSelection(detailedBasePairRange.start, detailedBasePairRange.stop, store.state.overviewBasePairToHeightRatio);

  // Update the Detailed panel rez to match that region length
  store.dispatch('setDetailsResolution', zoomedSelection.basePairStop - zoomedSelection.basePairStart);

  //check if our zoomed selection is positioned such that we need to adjust our buffer zone

  //checkAndUpdateForBufferzone(zoomedSelection.basePairStart, zoomedSelection.basePairStop);

  //Check if we have loaded synteny sets, if not, load them (initial)
  let masterGeneMap: Map<number, LoadedGene> | null = store.state.loadedGenes;
  if (detailedBackboneSet.value == null)
  {

    // Create the backbone track for the entire base selection at the updated Detailed panel resolution
    const backboneTrackStart = Date.now();

    const detailedBackbone = createBackboneSection(backboneSpecies, backboneChromosome, 0, backboneChromosome.seqLength, 'detailed');
    timeCreateBackboneTrack = Date.now() - backboneTrackStart;

    // Create the backbone data tracks for the entire selection at the updated Detailed panel resolution
    const queryBackboneboneGenesStart = Date.now();
    const tempBackboneGenes: Gene[] = await GeneApi.getGenesByRegion(backboneChromosome.chromosome, 0, backboneChromosome.seqLength, backboneSpecies.activeMap.key, backboneSpecies.name, comparativeSpeciesIds);

    timeQueryBackboneGenes = Date.now() - queryBackboneboneGenesStart;

    const backboneDatatracksStart = Date.now();
    const backboneDatatrackInfo = backboneDatatrackBuilder(backboneSpecies, tempBackboneGenes, detailedBackbone, 0, backboneChromosome.seqLength);
    masterGeneMap = backboneDatatrackInfo.masterGeneMap;
    timeCreateBackboneDatatracks = Date.now() - backboneDatatracksStart;

    const backboneSetStart = Date.now();
    detailedBackboneSet.value = createBackboneSet(detailedBackbone, backboneDatatrackInfo.processedGenomicData);
    timeCreateBackboneSet = Date.now() - backboneSetStart;
  }

  //no previously processed data, so we need to create the synteny tracks/inital load
  if (detailedSyntenySets.value.length == 0)
  {
    const syntenyTracksStart = Date.now();
    const detailedSyntenyData = await createSyntenicRegionsAndDatatracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      0,
      backboneChromosome.seqLength,
      originalSelectedBackboneRegion.viewportSelection?.basePairStart ?? 0,
      originalSelectedBackboneRegion.viewportSelection?.basePairStop ?? backboneChromosome.seqLength,
      store.state.detailsSyntenyThreshold,
      true,
      masterBlockMap,
      masterGeneMap ?? undefined,
    );
    
    detailedSyntenySets.value = detailedSyntenyData.syntenyRegionSets;
    timeSyntenyTracks = Date.now() - syntenyTracksStart;

    const adjustVisibleRegionStart = Date.now();
    await adjustDetailedVisibleSetsBasedOnZoom(zoomedSelection, false);
    timeAdjustVisibleRegion = Date.now() - adjustVisibleRegionStart;
    enableProcessingLoadMask.value = false;
  }
  else
  {
    const adjustVisibleRegionStart = Date.now();
    await adjustDetailedVisibleSetsBasedOnZoom(zoomedSelection, true);
    timeAdjustVisibleRegion = Date.now() - adjustVisibleRegionStart;
  }

  store.dispatch('setLoadedBlocks', masterBlockMap);
  store.dispatch('setLoadedGenes', masterGeneMap);

  const loadSelectedGene = store.state.gene;
  if ((loadType == 0) && (store.state.selectedGeneIds.length > 0) && (!geneReload) && loadSelectedGene != null)
  {
    const geneBasePairLength = loadSelectedGene.stop - loadSelectedGene.start;
    const newInnerStart = Math.max(Math.floor(loadSelectedGene.start - (LOAD_BY_GENE_VISIBLE_SIZE_MULTIPLIER * geneBasePairLength)), 0);
    const newInnerStop = Math.min(Math.floor(loadSelectedGene.stop + (LOAD_BY_GENE_VISIBLE_SIZE_MULTIPLIER * geneBasePairLength)), backboneChromosome.seqLength);

    const selection = detailedBackboneSet.value.backbone.generateBackboneSelection(newInnerStart, newInnerStop, store.state.detailedBasePairToHeightRatio, backboneChromosome);

    const newData = getNewSelectedData(store, loadSelectedGene);

    store.dispatch('setSelectedData', newData.selectedData);
    store.dispatch('setSelectedGeneIds', newData.rgdIds);
    store.dispatch('clearBackboneSelection');
    store.dispatch('setBackboneSelection', selection);

    geneReload = true;
    return;
  }

  const timeDetailedUpdate= Date.now() - detailedUpdateStart;
  const timeDetailedUpdateOther = timeDetailedUpdate - (
    timeCreateBackboneTrack 
    + timeQueryBackboneGenes 
    + timeCreateBackboneDatatracks 
    + timeCreateBackboneSet 
    + timeSyntenyTracks 
    + timeAdjustVisibleRegion);

  logPerformanceReport('Update Detailed Time', timeDetailedUpdate, {
    'Create Backbone Track': timeCreateBackboneTrack,
    'Query Backbone Genes': timeQueryBackboneGenes,
    'Create Backbone Datatracks': timeCreateBackboneDatatracks,
    'Create Backbone Set': timeCreateBackboneSet,
    'Create Synteny Tracks': timeSyntenyTracks,
    'Adjust Visible Region': timeAdjustVisibleRegion,
    'Misc': timeDetailedUpdateOther,
  });
};

const adjustDetailedVisibleSetsBasedOnZoom = async (zoomedSelection: SelectedRegion, updateCache: boolean) => {
  enableProcessingLoadMask.value = true;
  let masterGeneMap: Map<number, LoadedGene> | null = store.state.loadedGenes;
  let masterBlockMap: Map<number, LoadedBlock> = store.state.loadedBlocks;

  const selectedRegion = store.state.selectedBackboneRegion;
  const backboneChromosome = selectedRegion.chromosome;
  const bufferZoneSelection = selectedRegion.bufferZoneSelection;

  //need to query for data in the new viewport to update it with new gaps + blocks + genes data
  let detailedSyntenyData = null;

  if (updateCache)
  {
    detailedSyntenyData = await createSyntenicRegionsAndDatatracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      bufferZoneSelection.basePairStart,
      bufferZoneSelection.basePairStop,
      zoomedSelection.basePairStart,
      zoomedSelection.basePairStop,
      store.state.detailsSyntenyThreshold,
      true,
      masterBlockMap,
      masterGeneMap ?? undefined,
      true
    );
  }
  
  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  if (detailedBackboneSet.value)
  {
    const startTime = Date.now();
    const backboneTiming = detailedBackboneSet.value.adjustVisibleSet(zoomedSelection.basePairStart, zoomedSelection.basePairStop);
    const backboneEndTime = Date.now();

    detailedSyntenySets.value.forEach((set: SyntenyRegionSet) => {
      let updateData = null;
      if (detailedSyntenyData && updateCache)
      {
        updateData = detailedSyntenyData.gapData.find((s: SyntenyRegionSet) => s.speciesName == set.speciesName);
      }

      set.adjustVisibleSet(zoomedSelection.basePairStart, zoomedSelection.basePairStop, updateCache, bufferZoneSelection, store.state.detailsSyntenyThreshold, updateData?.regionData);
    });
    const endTime = Date.now();

    logPerformanceReport('Visible Set Adjustment Time', endTime - startTime, {
      ...backboneTiming,
      'synteny sets adjustment': endTime -backboneEndTime,
    });
  }

  if (detailedSyntenyData)
  {
    updateSyntenyData(detailedSyntenyData.syntenyRegionSets);
    updateMasterGeneMap(detailedSyntenyData.masterGeneMap);
    store.dispatch('setLoadedBlocks', detailedSyntenyData.masterBlockMap);
  }

  const originalRegionLength = (backboneChromosome.seqLength);
  const detailedRegionLength = (zoomedSelection.basePairStop - zoomedSelection.basePairStart);
  const tempZoomLevel = parseFloat((1 / (detailedRegionLength / originalRegionLength)).toFixed(2));

  store.dispatch('setZoomLevel', tempZoomLevel);
  enableProcessingLoadMask.value = false;
};

const adjustDetailedVisibleSetsBasedOnNav = async (lastBufferzone: SelectedRegion, navDirection: string) =>
{
  enableProcessingLoadMask.value = true;
  let masterGeneMap: Map<number, LoadedGene> | null = store.state.loadedGenes;
  let masterBlockMap: Map<number, LoadedBlock> = store.state.loadedBlocks;

  const selectedRegion = store.state.selectedBackboneRegion;
  const currBufferzone = selectedRegion.bufferZoneSelection;
  const zoomedSelection = selectedRegion.viewportSelection;
  const backboneChromosome = selectedRegion.chromosome;

  //need to query for data in the new viewport to update it with new gaps + blocks + genes data
  let detailedSyntenyData = null;
  let adjustedRegion: SelectedRegion = currBufferzone;

  if (navDirection == 'up')
  {
    adjustedRegion = new SelectedRegion(
      currBufferzone.svgYPoint, currBufferzone.svgHeight, currBufferzone.basePairStart, lastBufferzone.basePairStart
    );
    detailedSyntenyData = await createSyntenicRegionsAndDatatracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      currBufferzone.basePairStart,
      currBufferzone.basePairStop,
      zoomedSelection.basePairStart,
      zoomedSelection.basePairStop,
      store.state.detailsSyntenyThreshold,
      true,
      masterBlockMap,
      masterGeneMap ?? undefined,
      true
    )
  }
  else if (navDirection == 'down')
  {
    adjustedRegion = new SelectedRegion(
      currBufferzone.svgYPoint, currBufferzone.svgHeight, lastBufferzone.basePairStart, currBufferzone.basePairStop
    );
    detailedSyntenyData = await createSyntenicRegionsAndDatatracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      zoomedSelection.basePairStart,
      zoomedSelection.basePairStop,
      zoomedSelection.basePairStart,
      zoomedSelection.basePairStop,
      store.state.detailsSyntenyThreshold,
      true,
      masterBlockMap,
      masterGeneMap ?? undefined,
      true
    );
  }
  
  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  if (detailedBackboneSet.value && detailedSyntenyData)
  {
    const startTime = Date.now();
    const backboneTiming = detailedBackboneSet.value.adjustVisibleSet(zoomedSelection.basePairStart, zoomedSelection.basePairStop);
    const backboneEndTime = Date.now();

    detailedSyntenySets.value.forEach((set: SyntenyRegionSet) => {
      const updateData = detailedSyntenyData.gapData.find((s: SyntenyRegionSet) => s.speciesName == set.speciesName);
      set.adjustVisibleSetOnNav(zoomedSelection.basePairStart, zoomedSelection.basePairStop, adjustedRegion, true, store.state.detailsSyntenyThreshold, updateData?.regionData);
    });

    const endTime = Date.now();

    logPerformanceReport('Visible Set Adjustment Time', endTime - startTime, {
      ...backboneTiming,
      'synteny sets adjustment': endTime -backboneEndTime,
    });

    updateSyntenyData(detailedSyntenyData.syntenyRegionSets);
    updateMasterGeneMap(detailedSyntenyData.masterGeneMap);
  }

  enableProcessingLoadMask.value = false;
};

const navigateUp = () => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (isNavigationUpDisabled.value || selectedRegion?.viewportSelection == null) return;
  const chromosome = selectedRegion.chromosome;

  if (selectedRegion && selectedRegion.viewportSelection.length != chromosome.seqLength)
  {
    const currBufferzone = new SelectedRegion(selectedRegion.bufferZoneSelection.SVGYPoint, selectedRegion.bufferZoneSelection.SVGHeight, selectedRegion.bufferZoneSelection.basePairStart, selectedRegion.bufferZoneSelection.basePairStop);
    // Adjust the inner selection on the selected region
    selectedRegion.moveInnerSelectionUp(store.state.overviewBasePairToHeightRatio);
    adjustDetailedVisibleSetsBasedOnNav(currBufferzone, 'up');
  }
};

const navigateDown = () => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (isNavigationDownDisabled.value || selectedRegion?.viewportSelection == null) return;
  const chromosome = selectedRegion.chromosome;

  if (selectedRegion && selectedRegion.viewportSelection.length != chromosome.seqLength)
  {
    const currBufferzone = new SelectedRegion(selectedRegion.bufferZoneSelection.SVGYPoint, selectedRegion.bufferZoneSelection.SVGHeight, selectedRegion.bufferZoneSelection.basePairStart, selectedRegion.bufferZoneSelection.basePairStop);
    // Adjust the inner selection on the selected region
    selectedRegion.moveInnerSelectionDown(store.state.overviewBasePairToHeightRatio);
    adjustDetailedVisibleSetsBasedOnNav(currBufferzone, 'down');
  }
};


const updateSyntenyData = (syntenyRegionSets: SyntenyRegionSet[]) => 
{
  if (detailedSyntenySets.value)
  {
    detailedSyntenySets.value.forEach((syntenySet: SyntenyRegionSet) => {
      // TODO: What if there are two of the same species off-backbone? I don't think speciesName will be reliable enough
      const newSyntenySet = syntenyRegionSets.find((newSet: SyntenyRegionSet) => newSet.speciesName === syntenySet.speciesName);
      if (newSyntenySet)
      {
        syntenySet.addRegions(newSyntenySet.regions);
        syntenySet.addDatatrackLabels(newSyntenySet.datatrackLabels);
      }
      syntenySet.processGeneLabels();
    });
  }
  else
  {
    console.error('No detailed synteny sets found');
    return;
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

const updateMasterGeneMap = (newMappedGenes: Map<number, LoadedGene>) =>
{
  const masterGeneMap: Map<number, LoadedGene> = store.state.loadedGenes;

  if (!newMappedGenes)
  {
    return;
  }
  
  for (const [key, value] of newMappedGenes.entries())
  {
    const geneRgdId: number = key;
    const loadedGene: LoadedGene = masterGeneMap.get(geneRgdId);
    if (loadedGene)
    {
      //backbone genes will not have multiple fragments and thus not need to update the master gene map
      //only backbone genes should have the backboneOrtholog property populated
      if (loadedGene.backboneOrtholog)
      {
        continue;
      }
      //TODO: Verify comparative gene map additions are valid and not duplicates 
    }
    else
    {
      masterGeneMap.set(geneRgdId, value);
    }
  }
  store.dispatch('setLoadedGenes', masterGeneMap);
};

const getDetailedPosition = () =>
{
  const detailedPanel = document.getElementById('detailed');
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  if (detailedPanel)
  {
    const detailedPanelRec = detailedPanel.getBoundingClientRect();
    const detailedPanelDomPositions = detailedPanelRec;
    const styleElement = {
      position: 'absolute',
      top: String(detailedPanelDomPositions.top + scrollY)+ 'px',
      bottom: String(detailedPanelDomPositions.bottom ) + 'px',
      right: String(detailedPanelDomPositions.right) + 'px',
      left: String(detailedPanelDomPositions.left + scrollX) + 'px',
      width: String(detailedPanelDomPositions.width) + 'px',
      height: String(detailedPanelDomPositions.height ) + 'px',
    };

    return styleElement;
  }
};

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
      onError(null, 'No variants found for the requested region.');
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
