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
      <template v-if="trackSet.dataTracks.length > 0">
        <template v-for="dataTrack, index2 in trackSet.dataTracks" :key="dataTrack.name">
          <TrackSVG v-if="dataTrack.isDisplayed"
            show-chromosome
            show-gene-label 
            :pos-x="getBackbonePanelTrackXOffset(index, 'datatrack', index2) + SVGConstants.backboneXPosition"
            :width="SVGConstants.dataTrackWidth" :track="dataTrack.track as Track" />
        </template>
      </template>

      <text class="label small" :x="getBackbonePanelTrackXOffset(index, 'track') + SVGConstants.backboneXPosition" :y="SVGConstants.trackLabelYPosition">{{trackSet.speciesTrack.name}}</text>
      <text class="label small" :x="getBackbonePanelTrackXOffset(index, 'track') + SVGConstants.backboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{trackSet.speciesTrack.mapName}}</text>
      <TrackSVG v-if="index != 0"
        show-chromosome
        show-synteny-on-hover
        show-start-stop
        :pos-x="getBackbonePanelTrackXOffset(index, 'track') + SVGConstants.backboneXPosition"
        :width="SVGConstants.trackWidth" :track="trackSet.speciesTrack as Track" />

      <BackboneTrackSVG v-else
        is-selectable 
        :pos-x="getBackbonePanelTrackXOffset(index, 'track') + SVGConstants.backboneXPosition" :track="trackSet.speciesTrack as Track" />
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
        is-selectable 
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
    <rect class="navigation-btn" :class="{'disabled': isNavigationDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image href="../../node_modules/primeicons/raw-svg/chevron-down.svg" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />

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

<script setup lang="ts" >
import Species from '@/models/Species';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import SpeciesApi from '@/api/SpeciesApi';
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
import { createBackboneTrack, createSyntenyTracks } from '@/utils/TrackBuilder';

const GENES_DATA_TRACK_THRESHOLD_MULTIPLIER = 5;

const store = useStore(key);

const { showDialog, dialogHeader, dialogMessage, onError, checkSyntenyResultsOnComparativeSpecies } = useDialog();
const { startSelectionY, stopSelectionY, initZoomSelection, updateZoomSelection, completeZoomSelection } = useDetailedPanelZoom(store);

const isLoading = ref(false);
const overviewTrackSets = ref<TrackSet[]>([]); // The currently displayed TrackSets in the Overview panel
const detailTrackSets = ref<TrackSet[]>([]); // The currently displayed TrackSets in the Detailed panel

let comparativeOverviewTracks: Track[] = []; // Keeps track of current comparative tracks displayed in the overview panel
let selectionTrackSets: TrackSet[] = []; // The TrackSets for the entire selected region


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

  let tempBackboneTracks = await createBackboneDataTracks(backboneSpecies, backboneChromosome, backboneStart, backboneStop, store.state.overviewBasePairToHeightRatio, false, SVGConstants.overviewTrackYPosition) ?? null;
  if (backboneTrack != null && tempBackboneTracks != null)
  {
    if (store.state.backboneDataTracks.length > 0)
    {
      let backboneDataTracks = store.state.backboneDataTracks;
      let overviewTrackPresent = false;
      for (let index = 0; index < backboneDataTracks.length; index++)
      {
        let dataTrack = backboneDataTracks[index];
        if (dataTrack.name == tempBackboneTracks.name)
        {
          overviewTrackPresent = true;
          break;
        }
      }

      if (overviewTrackPresent)
      {
        store.commit('changeBackboneDataTrack', tempBackboneTracks);
      }
      else
      {
        setBackboneDataTracks(tempBackboneTracks);
      }
    }
    else
    {
      setBackboneDataTracks(tempBackboneTracks);
    }

    const backboneTrackSet = new TrackSet(backboneTrack, [tempBackboneTracks]);
    overviewTrackSets.value.push(backboneTrackSet);
  }

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
    SVGConstants.overviewTrackYPosition
  );

  for (let index = 0; index < comparativeOverviewTracks.length; index++)
  {
    const track = comparativeOverviewTracks[index];
    //TODO: query for comparative species datatracks

    const comparativeTrackSet = new TrackSet(track, []);
    overviewTrackSets.value.push(comparativeTrackSet);
  }
};

const updateDetailsPanel = async () => {

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
  // Get the range of the inner section that will be shown in the Detailed panel
  const zoomedSelection = originalSelectedBackboneRegion.generateInnerSelection(detailedBasePairRange.start, detailedBasePairRange.stop, store.state.overviewBasePairToHeightRatio);
  // Update the Detailed panel rez to match that region length
  store.dispatch('setDetailsResolution', zoomedSelection.basePairStop - zoomedSelection.basePairStart);

  // Create the backbone track for the entire base selection at the updated Detailed panel resolution
  const backboneSelectionTrack = createBackboneTrack(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, store.state.detailedBasePairToHeightRatio);

  // Create the backbone data tracks for the entire selection at the updated Detailed panel resolution
  let tempBackboneTracks = await createBackboneDataTracks(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, store.state.detailedBasePairToHeightRatio, true) ?? null;
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

      selectionTrackSets.push(new TrackSet(backboneSelectionTrack, [tempBackboneTracks]));
      detailTrackSets.value.push(new TrackSet(backboneSelectionTrack, [tempBackboneTracks]));
    }

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
      store.state.detailsSyntenyThreshold
    );

    for (let index = 0; index < comparativeSelectionTracks.length; index++)
    {
      let track = comparativeSelectionTracks[index] as Track;
      //TODO: query for comparative species datatracks

      let detailComparativeTrackSet = new TrackSet(track, []);
      selectionTrackSets.push(new TrackSet(track, []));
      detailTrackSets.value.push(detailComparativeTrackSet);
    }

    // TODO: Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
    console.log(selectionTrackSets);
    console.log('Trimming selection TrackSets to be between ', zoomedSelection.basePairStart, zoomedSelection.basePairStop);
  }
  else
  {
    // Could not create TrackSets for the backbone or its data tracks -> clear out all detailed panel TrackSets
    selectionTrackSets = [];
    detailTrackSets.value = [];
  }
};

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getBackbonePanelTrackXOffset = (trackNumber: number, trackType: string, dataTrackNum?: number) => {
  let totalTracks = trackNumber;
  let offset = 0;
  
  //data tracks are drawn on the right side of the backbone track, and first
  if (trackType == 'datatrack' && dataTrackNum != null)
  {
    //every displayed datatrack will have a buffer of 30 between tracks - if last datatrack
    offset = (totalTracks * -80) + (dataTrackNum * -30);
  }
  else
  {
    //the backbone track will have no calculable offset for its datatrack, so we set it to 30.  Later tracks will have a buffer of 30 added between them
    totalTracks == 0 ? offset = -30 : offset = (totalTracks * -80) - 30;
  }

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

const createBackboneDataTracks =  async (species: Species, chromosome: Chromosome, startPos: number, stopPos: number, basePairToHeightRatio: number, isComparative: boolean, startingSVGYPos = SVGConstants.panelTitleHeight) => {
  let tempGeneTracks: Gene[] = [];

  try
  {
    tempGeneTracks = await SpeciesApi.getGenesByRegion(chromosome.chromosome, startPos, stopPos, species.defaultMapKey);
    
    const sections: TrackSection[] = [];
    let hiddenSections: TrackSection[] = [];
    let previousBlockBackboneStop = startPos;
  
    for (let gene of tempGeneTracks)
    {
      let threshold = (isComparative) ? (store.state.detailsSyntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER) : store.state.overviewSyntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
      let geneSize = gene.stop - gene.start;
      if ( geneSize < threshold)
      {
        const hiddenTrackSection = new TrackSection({
          start: gene.start,
          stop: gene.stop,
          backboneStart: gene.start, 
          backboneStop: gene.stop, 
          chromosome: gene.chromosome, 
          cutoff: stopPos, 
          offsetCount: gene.start - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect',
          gene: gene
        });

        hiddenSections.push(hiddenTrackSection);
      }
      else
      {
        if (gene.start < previousBlockBackboneStop && previousBlockBackboneStop !== startPos)
        {
          continue;
        }
        else
        {
          const trackSection = new TrackSection({
            start: gene.start,
            stop: gene.stop,
            backboneStart: gene.start, 
            backboneStop: gene.stop, 
            chromosome: gene.chromosome, 
            cutoff: stopPos, 
            offsetCount: gene.start - previousBlockBackboneStop,
            basePairToHeightRatio: basePairToHeightRatio,
            shape: 'rect',
            gene: gene,
            hiddenGenes: hiddenSections.length > 0 ? hiddenSections : []
          });

          hiddenSections =  [];
          sections.push(trackSection);
          previousBlockBackboneStop = gene.stop;
        }
      }
    }
    let geneDataTrack;
    let geneTrack = new Track({ speciesName: species.name, sections: sections, startingSVGY: startingSVGYPos });

    if (isComparative)
    { 
      geneDataTrack = new DataTrack('Genes', species.name + ' Detailed Genes', geneTrack, 'red');
      geneDataTrack.setIsComparativeView(true);
      geneDataTrack.isDisplayed = true;

    }
    else
    {
      geneDataTrack = new DataTrack('Genes', species.name + ' Overview Genes', geneTrack, 'red');
      geneDataTrack.isDisplayed = true;
    }

    return geneDataTrack;
  }
  catch (err)
  {
    onError(err, 'An error occurred while attempting to load the genes data track for the backbone species');
  }
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
  if (isNavigationDisabled.value) return;

  console.log('Navigate Up placeholder');
};

const navigateDown = () => {
  if (isNavigationDisabled.value) return;

  console.log('Navigate Down placeholder');
};

const isNavigationDisabled = computed(() => {
  const selectedRegion = store.state.selectedBackboneRegion;
  return selectedRegion.zoomLevel <= 1;
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
    cursor: crosshair
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
