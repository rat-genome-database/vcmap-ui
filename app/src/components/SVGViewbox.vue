<template>
  <ProgressBar class="vcmap-loader" :mode="arePanelsLoading ? 'indeterminate' : 'determinate'" :value="0" :showValue="false"/>
  <svg :viewBox="'0 0 800 ' + SVGConstants.viewboxHeight" xmlns="http://www.w3.org/2000/svg" id="svg-wrapper" width="100%">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="800" :height="SVGConstants.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" x="0" @mousedown.left="initOverviewSelection" @mousemove="updateOverviewSelection" @mouseup.left="completeOverviewSelection(overviewBackboneSet?.backbone)" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" @mousedown.left="initZoomSelection" @mousemove="updateZoomSelection" @mouseup.left="completeZoomSelection" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />

    <!-- Ortholog Lines -->
    <template v-for="(line, index) in orthologLines" :key="index">
      <OrthologLineSVG :line="line" />
    </template>
    
    <!-- Overview panel SVGs ------------------------------------------->
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(region, index) in syntenySet.regions" :key="index">
        <SectionSVG show-chromosome show-synteny-on-hover show-start-stop :region="(region as SyntenyRegion)" />
      </template>
    </template>

    <template v-if="overviewBackboneSet">
      <BackboneSetSVG show-data-on-hover :backbone-set="overviewBackboneSet" />
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

    <template v-if="detailedSyntenySets.length">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(syntenicRegion, index) in syntenySet.regions" :key="index">
          <SectionSVG show-gene-label show-chromosome :region="syntenicRegion as SyntenyRegion" />
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
          <text class="label small" :x="label.posX" :y="label.posY">{{label.text}} (test)</text>
        </template>
      </template>
    </template>

    <!-- Navigation buttons -->
    <rect class="navigation-btn" :class="{'disabled': isNavigationUpDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDownDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-up.svg" @click="navigateUp" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-down.svg" @click="navigateDown" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />

    <!-- Detailed panel selection svg for zoom -->
    <rect v-if="startDetailedSelectionY && stopDetailedSelectionY" 
      @mouseup.left="completeZoomSelection"
      @mousemove="updateZoomSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="SVGConstants.overviewPanelWidth" :y="startDetailedSelectionY"
      :width="SVGConstants.detailsPanelWidth" :height="stopDetailedSelectionY - startDetailedSelectionY" />

    <!-- Overview panel selection svg for backbone -->
    <rect v-if="startOverviewSelectionY && stopOverviewSelectionY" 
      @mouseup.left="completeOverviewSelection(overviewBackboneSet?.backbone)"
      @mousemove="updateOverviewSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="0" :y="startOverviewSelectionY"
      :width="SVGConstants.overviewPanelWidth" :height="stopOverviewSelectionY - startOverviewSelectionY" />
  </svg>

  <VCMapDialog v-model:show="showDialog" :header="dialogHeader" :message="dialogMessage" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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
import BackboneSet from '@/models/BackboneSet';
import { LoadedSpeciesGenes } from '@/models/DatatrackSection';
import OrthologLineSVG from './OrthologLineSVG.vue';
import { mergeGeneLabels } from '@/utils/GeneLabelMerger';

const store = useStore(key);
const $log = useLogger();

const { showDialog, dialogHeader, dialogMessage, onError, checkSyntenyResultsOnComparativeSpecies } = useDialog();
const { startDetailedSelectionY, stopDetailedSelectionY, initZoomSelection, updateZoomSelection, completeZoomSelection } = useDetailedPanelZoom(store);
const { startOverviewSelectionY, stopOverviewSelectionY, initOverviewSelection, updateOverviewSelection, completeOverviewSelection } = useOverviewPanelSelection(store);

let detailedSyntenySets = ref<SyntenyRegionSet[]>([]); // The currently displayed SyntenicRegions in the detailed panel
let overviewBackboneSet = ref<BackboneSet>();
let detailedBackboneSet = ref<BackboneSet>();
let overviewSyntenySets = ref<SyntenyRegionSet[]>([]);

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
  if (gene) {
    let selectedData = new SelectedData(gene, 'Gene');
    store.dispatch('setSelectedData', [selectedData]);
  } else {
    store.dispatch('setSelectedData', null);
  }

  await attachToProgressLoader('setIsOverviewPanelUpdating', updateOverviewPanel);
  checkSyntenyResultsOnComparativeSpecies(overviewSyntenySets.value as SyntenyRegionSet[]);
});

watch(() => store.state.detailedBasePairRange, () => {
  attachToProgressLoader('setIsDetailedPanelUpdating', updateDetailsPanel);
});

const arePanelsLoading = computed(() => {
  return store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating;
});

const updateOverviewPanel = async () => {
  const overviewUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const backboneStart = store.state.startPos;
  const backboneStop = store.state.stopPos;
  const loadType = store.state.configTab;

  if (backboneSpecies == null || backboneChromosome == null || backboneStart == null || backboneStop == null)
  {
    onError(backboneOverviewError, backboneOverviewError.message);
    overviewSyntenySets.value = [];
    return;
  }

  if (backboneStop - backboneStart <= 0)
  {
    onError(noRegionLengthError, noRegionLengthError.message);
    overviewSyntenySets.value = [];
    return;
  }

  overviewSyntenySets.value = [];
  // The backbone is the entire chromosome
  store.dispatch('setOverviewResolution', backboneChromosome.seqLength);
  const overviewBackbone = createBackboneSection(backboneSpecies, backboneChromosome, 0, backboneChromosome.seqLength, 'overview');
  overviewBackboneSet.value = createBackboneSet(overviewBackbone);

  const overviewBackboneCreationTime = Date.now();

  if (store.state.comparativeSpecies.length === 0)
  {
    onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
    return;
  }

  // TODO: Do we need masterGeneMap for the overview?
  const emptyMap = new Map<number, LoadedSpeciesGenes>();
  const overviewSyntenyData = await createSyntenicRegionsAndDatatracks(
    store.state.comparativeSpecies,
    backboneChromosome,
    0,
    backboneChromosome.seqLength,
    0,
    backboneChromosome.seqLength,
    store.state.overviewSyntenyThreshold,
    false,
    emptyMap,
  );

  overviewSyntenySets.value = overviewSyntenyData.syntenyRegionSets;

  const overviewSyntenyTrackCreationTime = Date.now();

  // Set the backbone selection to the start and stop positions selected on the config screen if a selection doesn't already exist
  // (the backbone should have just 1 [0] section)
  const prevBackboneSelection = store.state.selectedBackboneRegion;
  if (overviewBackbone != null && prevBackboneSelection.baseSelection.svgHeight === 0)
  {
    //if initially loading by gene, we need to set and process the full backbone range and syntenic blocks to find ortholog positions to later adjust so all are visible in the detail panel
    if (loadType === 0)
    {
      const selection = overviewBackbone.generateBackboneSelection(0, backboneChromosome.seqLength, store.state.overviewBasePairToHeightRatio, backboneChromosome);
      store.dispatch('setBackboneSelection', selection);
    }
    else
    {
      const selection = overviewBackbone.generateBackboneSelection(backboneStart, backboneStop, store.state.overviewBasePairToHeightRatio, backboneChromosome);
      store.dispatch('setBackboneSelection', selection);
    }
  }
  else
  {
    // Recreate the BackboneSelection model b/c the model loses its functions after page refresh (vuex-persist plugin does not preserve functions on objects)
    const recreatedSelection = new BackboneSelection(
      new SelectedRegion(prevBackboneSelection.baseSelection.svgYPoint, prevBackboneSelection.baseSelection.svgHeight, prevBackboneSelection.baseSelection.basePairStart, prevBackboneSelection.baseSelection.basePairStop), 
      prevBackboneSelection.chromosome
    );
    if (prevBackboneSelection.innerSelection)
    {
      recreatedSelection.generateInnerSelection(prevBackboneSelection.innerSelection.basePairStart, prevBackboneSelection.innerSelection.basePairStop, store.state.overviewBasePairToHeightRatio);
    }
    else
    {
      recreatedSelection.generateInnerSelection(prevBackboneSelection.baseSelection.basePairStart, prevBackboneSelection.baseSelection.basePairStop, store.state.overviewBasePairToHeightRatio);
    }
    
    store.dispatch('setBackboneSelection', recreatedSelection);
  }

  const overviewCreateBackboneSelectionTime = Date.now();
  logPerformanceReport('Update Overview Time', (overviewCreateBackboneSelectionTime - overviewUpdateStart), {
    'Create Backbone Track': (overviewBackboneCreationTime - overviewUpdateStart),
    'Create Synteny Tracks': (overviewSyntenyTrackCreationTime - overviewBackboneCreationTime),
    'Create Backbone Selection': (overviewCreateBackboneSelectionTime - overviewSyntenyTrackCreationTime)
  });
};

const updateDetailsPanel = async () => {
  const detailedUpdateStart = Date.now();
  store.dispatch('setIsDetailedPanelUpdating', true);

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const loadType = store.state.configTab;
  const originalSelectedBackboneRegion = store.state.selectedBackboneRegion;
  const detailedBasePairRange = store.state.detailedBasePairRange;

  // debug timers
  let timeSyntenyTracks = 0;
  let timeCreateBackboneTrack = 0;
  let timeAdjustVisibleRegion = 0;

  if (detailedBasePairRange.stop - detailedBasePairRange.start <= 0)
  {
    // Clear out our detailed synteny sets
    detailedSyntenySets.value = [];
    return;
  }

  if (backboneSpecies == null || backboneChromosome == null)
  {
    onError(backboneDetailedError, backboneDetailedError.message);
    detailedSyntenySets.value = [];
    return;
  }

  // Reset our detailed synteny sets before generating new ones
  detailedSyntenySets.value = [];

  // Get the range of the inner section that will be shown in the Detailed panel
  const zoomedSelection = originalSelectedBackboneRegion.generateInnerSelection(detailedBasePairRange.start, detailedBasePairRange.stop, store.state.overviewBasePairToHeightRatio);
  // Update the Detailed panel rez to match that region length
  store.dispatch('setDetailsResolution', zoomedSelection.basePairStop - zoomedSelection.basePairStart);

  const createBackboneTrackStart = Date.now();
  // Create the backbone track for the entire base selection at the updated Detailed panel resolution
  const detailedBackbone = createBackboneSection(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, 'detailed');
  // Create the backbone data tracks for the entire selection at the updated Detailed panel resolution
  const tempBackboneGenes: Gene[] = await GeneApi.getGenesByRegion(backboneChromosome.chromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, backboneSpecies.activeMap.key, backboneSpecies.name);

  const backboneDatatrackInfo = backboneDatatrackBuilder(tempBackboneGenes, detailedBackbone, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, );
  detailedBackboneSet.value = createBackboneSet(detailedBackbone, backboneDatatrackInfo.processedGenomicData);
  const masterGeneMap = backboneDatatrackInfo.masterGeneMap;

  timeCreateBackboneTrack = Date.now() - createBackboneTrackStart;

  if (detailedBackbone != null && detailedBackboneSet.value.datatracks.length > 0)
  {
    if (store.state.comparativeSpecies.length === 0)
    {
      onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
      return;
    }

    const createSyntenyTracksStart = Date.now();
    const detailedSyntenyData = await createSyntenicRegionsAndDatatracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      originalSelectedBackboneRegion.baseSelection.basePairStart,
      originalSelectedBackboneRegion.baseSelection.basePairStop,
      originalSelectedBackboneRegion.innerSelection?.basePairStart ?? originalSelectedBackboneRegion.baseSelection.basePairStart,
      originalSelectedBackboneRegion.innerSelection?.basePairStop ?? originalSelectedBackboneRegion.baseSelection.basePairStop,
      store.state.detailsSyntenyThreshold,
      true,
      masterGeneMap
    );

    detailedSyntenySets.value = detailedSyntenyData.syntenyRegionSets;

    timeSyntenyTracks = Date.now() - createSyntenyTracksStart;

    // Throw our master gene map on the store
    store.dispatch('setLoadedGenes', masterGeneMap);

    //if loading by gene initially, we need to find the backbone start of the "highest" positioned ortholog, and the backbone stop of the "lowest" positioned ortholog, then setting the backbone selection to those coords
    const loadSelectedGene = store.state.gene;
    if ((loadType == 0) && (store.state.selectedGeneIds.length > 0) && (!geneReload) && loadSelectedGene != null)
    {
      const geneBasePairLength = loadSelectedGene.stop - loadSelectedGene.start;
      const newInnerStart = Math.max(Math.floor(loadSelectedGene.start - 3 * geneBasePairLength), originalSelectedBackboneRegion.baseSelection.basePairStart);
      const newInnerStop = Math.min(Math.floor(loadSelectedGene.stop + 3 * geneBasePairLength), originalSelectedBackboneRegion.baseSelection.basePairStop);

      const selection = detailedBackboneSet.value.backbone.generateBackboneSelection(newInnerStart, newInnerStop, store.state.detailedBasePairToHeightRatio, backboneChromosome);
      store.dispatch('clearBackboneSelection');
      store.dispatch('setBackboneSelection', selection);

      geneReload = true;
      return;
    }

    const adjustVisibleRegionStart = Date.now();
    adjustDetailedVisibleSetsBasedOnZoom(zoomedSelection);
    timeAdjustVisibleRegion = Date.now() - adjustVisibleRegionStart;
  }
  else
  {
    // Could not create synteny sets for the backbone or its data tracks -> clear out all detailed panel synteny sets
    detailedSyntenySets.value = [];
  }

  store.dispatch('setIsDetailedPanelUpdating', false);
  const timeDetailedUpdate= Date.now() - detailedUpdateStart;
  const timeDetailedUpdateOther = timeDetailedUpdate - (timeSyntenyTracks + timeCreateBackboneTrack + timeAdjustVisibleRegion);

  logPerformanceReport('Update Detailed Time', timeDetailedUpdate, {
    'Create Backbone Track': timeCreateBackboneTrack,
    'Create Synteny Tracks': timeSyntenyTracks,
    'Adjust Visible Region': timeAdjustVisibleRegion,
    'Misc': timeDetailedUpdateOther,
  });
};

const adjustDetailedVisibleSetsBasedOnZoom = (zoomedSelection: SelectedRegion) => {
  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  if (detailedBackboneSet.value)
  {
    const updatedMasterGeneMap = detailedBackboneSet.value.adjustVisibleSet(zoomedSelection.basePairStart, zoomedSelection.basePairStop);
    if (updatedMasterGeneMap)
    {
      detailedSyntenySets.value.forEach(set => {
        set.adjustVisibleSet(zoomedSelection.basePairStart, zoomedSelection.basePairStop, updatedMasterGeneMap);
      });
      store.dispatch('setLoadedGenes', updatedMasterGeneMap);
    }
  }
};

const navigateUp = () => {
  if (isNavigationUpDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionUp(store.state.overviewBasePairToHeightRatio);

  if (selectedRegion.innerSelection)
  {
    adjustDetailedVisibleSetsBasedOnZoom(selectedRegion.innerSelection);
  }
};

const navigateDown = () => {
  if (isNavigationDownDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionDown(store.state.overviewBasePairToHeightRatio);

  if (selectedRegion.innerSelection)
  {
    adjustDetailedVisibleSetsBasedOnZoom(selectedRegion.innerSelection);
  }
};

const isNavigationUpDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }

  const selectedRegion = store.state.selectedBackboneRegion;
  if (selectedRegion.zoomLevel <= 1)
  {
    return true;
  }

  if (selectedRegion.innerSelection)
  {
    return selectedRegion.baseSelection.basePairStart >= selectedRegion.innerSelection.basePairStart;
  }

  return false;
});

const isNavigationDownDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }
  
  const selectedRegion = store.state.selectedBackboneRegion;
  if (selectedRegion.zoomLevel <= 1)
  {
    return true;
  }

  if (selectedRegion.innerSelection)
  {
    return selectedRegion.baseSelection.basePairStop <= selectedRegion.innerSelection.basePairStop;
  }

  return false;
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
}

rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;

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
}
</style>
