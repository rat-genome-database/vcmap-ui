<template>
  <ProgressBar class="vcmap-loader" :mode="(isLoading) ? 'indeterminate' : 'determinate'" :value="0" :showValue="false"/>
  <svg :viewBox="'0 0 1000 ' + SVGConstants.viewboxHeight" xmlns="http://www.w3.org/2000/svg" id="svg-wrapper">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="1000" :height="SVGConstants.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />
    <rect class="panel detailed" @mousedown="initZoomSelection" @mousemove="updateZoomSelection" @mouseup="completeZoomSelection" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />
    <!-- Title panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />

    <!-- Overview panel SVGs ------------------------------------------->
    
    <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
    <template v-for="(trackSet, index) in overviewTrackSets" :key="trackSet">
      <text class="label small" :x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition" :y="SVGConstants.trackLabelYPosition">{{trackSet.speciesTrack.name}}</text>
      <text class="label small" :x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{trackSet.speciesTrack.mapName}}</text>
      <TrackSVG v-if="index != 0"
        show-chromosome
        show-synteny-on-hover
        show-start-stop
        :pos-x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition"
        :width="SVGConstants.trackWidth" :track="trackSet.speciesTrack as Track" />

      <BackboneTrackSVG v-else 
        is-selectable 
        :pos-x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition" :track="trackSet.speciesTrack as Track" />
    </template>


    <!-- Detail panel SVGs ----------------------------------------->
    <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.panelTitleYPosition">Detailed</text>

    <template v-for="(trackSet, index) in detailTrackSets" :key="trackSet">
      <text class="label small" :x="getComparativePanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackLabelYPosition">{{trackSet.speciesTrack.name}}</text>
      <text class="label small" :x="getComparativePanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{trackSet.speciesTrack.mapName}}</text>
      <TrackSVG v-if="index != 0"
        show-chromosome
        show-start-stop
        :pos-x="getComparativePanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" 
        :width="SVGConstants.trackWidth" :track="trackSet.speciesTrack as Track" />

      <BackboneTrackSVG v-else
        is-selectable is-detailed
        :pos-x="getComparativePanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :track="trackSet.speciesTrack as Track" />

      <template v-if="trackSet.dataTracks.length > 0">
        <template v-for="dataTrack, index2 in trackSet.dataTracks" :key="dataTrack.name">
          <TrackSVG v-if="dataTrack.isDisplayed"
            show-gene-label 
            :pos-x="getComparativePanelTrackXOffset(index, 'datatrack', index2) + SVGConstants.selectedBackboneXPosition"
            :width="SVGConstants.dataTrackWidth" :track="dataTrack.track as Track" />
        </template>
      </template>
    </template>

     <!-- Navigation buttons -->
    <image href="../../node_modules/primeicons/raw-svg/chevron-up.svg" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationUpDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image href="../../node_modules/primeicons/raw-svg/chevron-down.svg" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDownDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />

    <TooltipSVG :tooltip-data="store.state.tooltipData" />

    <rect v-if="startSelectionY && stopSelectionY" 
      @mouseup="completeZoomSelection"
      @mousemove="updateZoomSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="SVGConstants.overviewPanelWidth" :y="startSelectionY"
      :width="SVGConstants.detailsPanelWidth" :height="stopSelectionY - startSelectionY" />
  </svg>

  <VCMapDialog v-model:show="showDialog" :header="dialogHeader" :message="dialogMessage" />
</template>

<script setup lang="ts">
import Track from '@/models/Track';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';
import SVGConstants from '@/utils/SVGConstants';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import DataTrack from '@/models/DataTrack';
import VCMapDialog from '@/components/VCMapDialog.vue';
import TooltipSVG from './TooltipSVG.vue';
import useDialog from '@/composables/useDialog';
import BackboneTrackSVG from './BackboneTrackSVG.vue';
import TrackSet from '@/models/TrackSet';
import useDetailedPanelZoom from '@/composables/useDetailedPanelZoom';
import { key } from '@/store';
import { backboneDetailedError, backboneOverviewError, missingComparativeSpeciesError, noRegionLengthError } from '@/utils/VCMapErrors';
import { createBackboneDataTracks, createBackboneTrack, createSyntenyTracks } from '@/utils/TrackBuilder';

const store = useStore(key);

const { showDialog, dialogHeader, dialogMessage, onError, checkSyntenyResultsOnComparativeSpecies } = useDialog();
const { startSelectionY, stopSelectionY, initZoomSelection, updateZoomSelection, completeZoomSelection } = useDetailedPanelZoom(store);

const isLoading = ref(false);
const overviewTrackSets = ref<TrackSet[]>([]); // The currently displayed TrackSets in the Overview panel
const detailTrackSets = ref<TrackSet[]>([]); // The currently displayed TrackSets in the Detailed panel

let comparativeOverviewTracks: Track[] = []; // Keeps track of current comparative tracks displayed in the overview panel
let selectionTrackSets: TrackSet[] = []; // The track sets for the entire selected region


async function attachToProgressLoader(func: () => Promise<any>)
{
  try
  {
    isLoading.value = true;
    await func();
  }
  catch (err)
  {
    onError(err, 'An error occurred while updating the overview panel');
  }
  finally
  {
    isLoading.value = false;
  }
}

onMounted(async () => {
  // Clear any prior selections
  store.dispatch('setTooltipData', null);
  store.dispatch('setSelectedBackboneRegion', new BackboneSelection(new SelectedRegion(0,0,0,0)));
  store.dispatch('setDetailedBasePairRange', { start: 0, stop: 0 });
  store.dispatch('resetBackboneDataTracks');

  await attachToProgressLoader(updateOverviewPanel);
  checkSyntenyResultsOnComparativeSpecies(comparativeOverviewTracks);
});

watch(() => store.state.detailedBasePairRange, () => {
  removeSelectionDataTracks();
  attachToProgressLoader(updateDetailsPanel);
});

const updateOverviewPanel = async () => {
  const overviewUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const backboneStart = store.state.startPos;
  const backboneStop = store.state.stopPos;

  if (backboneSpecies == null || backboneChromosome == null || backboneStart == null || backboneStop == null)
  {
    onError(backboneOverviewError, backboneOverviewError.message);
    overviewTrackSets.value = [];
    return;
  }

  if (backboneStop - backboneStart <= 0)
  {
    onError(noRegionLengthError, noRegionLengthError.message);
    overviewTrackSets.value = [];
    return;
  }

  overviewTrackSets.value = [];
  store.dispatch('setOverviewResolution', backboneStop - backboneStart);
  let backboneTrack = createBackboneTrack(backboneSpecies, backboneChromosome, backboneStart, backboneStop, store.state.overviewBasePairToHeightRatio, SVGConstants.overviewTrackYPosition);

  const backboneTrackSet = new TrackSet(backboneTrack, []);
  overviewTrackSets.value.push(backboneTrackSet);

  if (store.state.comparativeSpecies.length === 0)
  {
    onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
    return;
  }

  comparativeOverviewTracks = await createSyntenyTracks(
    store.state.comparativeSpecies,
    backboneChromosome,
    backboneStart, 
    backboneStop, 
    store.state.overviewBasePairToHeightRatio,
    store.state.overviewSyntenyThreshold,
    SVGConstants.overviewTrackYPosition // SVG positioning of the overview tracks will start just underneath the header panels with a bit of space in between
  );

  for (let index = 0; index < comparativeOverviewTracks.length; index++)
  {
    const track = comparativeOverviewTracks[index];
    //TODO: query for comparative species datatracks

    const comparativeTrackSet = new TrackSet(track, []);
    overviewTrackSets.value.push(comparativeTrackSet);
  }

  console.log(`Update overview time: ${(Date.now() - overviewUpdateStart)} ms`);
};

const updateDetailsPanel = async () => {

  const detailedUpdateStart = Date.now();

  removeSelectionDataTracks();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const originalSelectedBackboneRegion = store.state.selectedBackboneRegion;
  const detailedBasePairRange = store.state.detailedBasePairRange;
  if (detailedBasePairRange.stop - detailedBasePairRange.start <= 0)
  {
    // Clear out our selection TrackSets
    selectionTrackSets = [];
    detailTrackSets.value = [];
    return;
  }

  if (backboneSpecies == null || backboneChromosome == null)
  {
    onError(backboneDetailedError, backboneDetailedError.message);
    selectionTrackSets = [];
    detailTrackSets.value = [];
    return;
  }

  detailTrackSets.value = [];
  selectionTrackSets = [];
  // Get the range of the inner section that will be shown in the Detailed panel
  const zoomedSelection = originalSelectedBackboneRegion.generateInnerSelection(detailedBasePairRange.start, detailedBasePairRange.stop, store.state.overviewBasePairToHeightRatio);
  // Update the Detailed panel rez to match that region length
  store.dispatch('setDetailsResolution', zoomedSelection.basePairStop - zoomedSelection.basePairStart);

  // Create the backbone track for the entire base selection at the updated Detailed panel resolution
  const backboneSelectionTrack = createBackboneTrack(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, store.state.detailedBasePairToHeightRatio);

  // Create the backbone data tracks for the entire selection at the updated Detailed panel resolution
  let tempBackboneTracks = await createBackboneDataTracks(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, store.state.detailedBasePairToHeightRatio, true, store.state.detailsSyntenyThreshold, SVGConstants.panelTitleHeight) ?? null;
  if (backboneSelectionTrack != null && tempBackboneTracks != null)
  {
    if (store.state.backboneDataTracks.length > 0)
    {
      let detailTrackPresent = false;
      let backboneDataTracks = store.state.backboneDataTracks;
      for (let index = 0; index < backboneDataTracks.length; index++)
      {
        let dataTrack = backboneDataTracks[index];
        if (dataTrack.name == tempBackboneTracks.name)
        {
          detailTrackPresent = true;
          break;
        }
      }

      if (detailTrackPresent)
      {
        store.commit('changeBackboneDataTrack', tempBackboneTracks);
      }
      else
      {
        setBackboneDataTracks(tempBackboneTracks);
      }
    }

    selectionTrackSets.push(new TrackSet(backboneSelectionTrack, [tempBackboneTracks]));

    if (store.state.comparativeSpecies.length === 0)
    {
      onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
      return;
    }

    let comparativeSelectionTracks = await createSyntenyTracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      originalSelectedBackboneRegion.baseSelection.basePairStart, 
      originalSelectedBackboneRegion.baseSelection.basePairStop, 
      store.state.detailedBasePairToHeightRatio,
      store.state.detailsSyntenyThreshold,
      SVGConstants.panelTitleHeight // SVG positioning of detailed tracks will start immediately after the header panel
    );

    for (let index = 0; index < comparativeSelectionTracks.length; index++)
    {
      let track = comparativeSelectionTracks[index] as Track;
      //TODO: query for comparative species datatracks

      selectionTrackSets.push(new TrackSet(track, []));
    }

    // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
    selectionTrackSets.forEach(trackSet => {
      const visibleTrackSet = trackSet.getVisibleRegion(zoomedSelection.basePairStart, zoomedSelection.basePairStop, store.state.detailedBasePairToHeightRatio, store.state.detailsSyntenyThreshold);
      if (visibleTrackSet)
      {
        detailTrackSets.value.push(visibleTrackSet);
      }
    });
  }
  else
  {
    // Could not create TrackSets for the backbone or its data tracks -> clear out all detailed panel TrackSets
    selectionTrackSets = [];
    detailTrackSets.value = [];
  }

  console.log(`Update detailed time: ${(Date.now() - detailedUpdateStart)} ms`);
};

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getOverviewPanelTrackXOffset = (trackNumber: number) => {
  let totalTracks = trackNumber;
  let offset = 0;

  totalTracks == 0 ? offset = 0 : offset = (totalTracks * -80);

  return offset;
};

const getComparativePanelTrackXOffset = (trackNumber: number, trackType: string, dataTrackNum?: number) => {
  let totalTracks = trackNumber;
  let offset = 0;
  
  //data tracks are drawn on the right side of the backbone track, and first
  if (trackType == 'datatrack' && dataTrackNum != null)
  {
    //every displayed datatrack will have a buffer of 30 between tracks - if last datatrack
    totalTracks == 0 ? offset = 30 : offset = (totalTracks * 120) + (dataTrackNum * 30);
  }
  else
  {
    //the backbone track will have no calculable offset for its datatrack, so we set it to 30.  Later tracks will have a buffer of 30 added between them
    offset = (totalTracks * 120);
  }

  return offset;
};

const setBackboneDataTracks = (dataTrack: DataTrack) => {
  store.commit('addBackboneDataTrack', dataTrack);
};

function removeSelectionDataTracks()
{
  let dataTracks = store.state.backboneDataTracks;
  for (let index = 0; index < dataTracks.length; index++)
  {
    let currentDataTrack = dataTracks[index];
    if (currentDataTrack.isComparativeView)
    {
      store.commit('removeBackboneDataTrack', index);
      index--;
    }
  }
}

const navigateUp = () => {
  if (isNavigationUpDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionUp(store.state.overviewBasePairToHeightRatio);
  store.dispatch('setSelectedBackboneRegion', selectedRegion);

  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  detailTrackSets.value = [];
  selectionTrackSets.forEach(trackSet => {
    if (!selectedRegion.innerSelection) return;

    const visibleTrackSet = trackSet.getVisibleRegion(selectedRegion.innerSelection.basePairStart, selectedRegion.innerSelection.basePairStop, store.state.detailedBasePairToHeightRatio, store.state.detailsSyntenyThreshold);
    if (visibleTrackSet)
    {
      detailTrackSets.value.push(visibleTrackSet);
    }
  });
};

const navigateDown = () => {
  if (isNavigationDownDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionDown(store.state.overviewBasePairToHeightRatio);
  store.dispatch('setSelectedBackboneRegion', selectedRegion);

  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  detailTrackSets.value = [];
  selectionTrackSets.forEach(trackSet => {
    if (!selectedRegion.innerSelection) return;

    const visibleTrackSet = trackSet.getVisibleRegion(selectedRegion.innerSelection.basePairStart, selectedRegion.innerSelection.basePairStop, store.state.detailedBasePairToHeightRatio, store.state.detailsSyntenyThreshold);
    if (visibleTrackSet)
    {
      detailTrackSets.value.push(visibleTrackSet);
    }
  });
};

const isNavigationUpDisabled = computed(() => {
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

  &.detailed
  {
    cursor: crosshair;
  }
}

.vcmap-loader.p-progressbar
{
  height: 0.25em;
}

rect.navigation-btn
{
  fill: lightgray;
  fill-opacity: 0.5;
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
</style>
