<template>
  <ProgressBar class="vcmap-loader" :mode="(isLoading) ? 'indeterminate' : 'determinate'" :value="0" :showValue="false"/>
  <svg :viewBox="'0 0 1000 ' + SVGConstants.viewboxHeight" xmlns="http://www.w3.org/2000/svg">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="1000" :height="SVGConstants.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />
    <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />
    <!-- Title panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />

    <!-- Backbone panel SVGs ------------------------------------------->
    <!-- backbone species track -->
    <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
    <text v-if="backboneSpecies" class="label small" :x="SVGConstants.backboneXPosition" :y="SVGConstants.trackLabelYPosition">{{backboneSpecies.name}} (backbone)</text>
    <text v-if="backboneSpecies" class="label small" :x="SVGConstants.backboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{backboneSpecies.activeMap.name}}</text>
    <BackboneTrackSVG v-if="backboneTrack" is-selectable :pos-x="SVGConstants.backboneXPosition" :track="backboneTrack as Track" />

    <!-- backbone data tracks -->
    <template v-for="(dataTrack, index) in drawnOverviewTracks" :key="dataTrack">
      <text v-if="dataTrack.type === 'dataTrack' && !dataTrack.isComparative" class="label small" :x="getBackbonePanelTrackXOffset(index + 1) + SVGConstants.backboneXPosition" :y="SVGConstants.trackLabelYPosition">{{dataTrack.trackType}}</text>
      <TrackSVG v-if="dataTrack.type === 'dataTrack' && !dataTrack.isComparative"
        show-chromosome
        show-gene-label 
        :pos-x="getBackbonePanelTrackXOffset(index + 1) + SVGConstants.backboneXPosition"
        :width="SVGConstants.trackWidth" :track="dataTrack.track as Track" />
    </template>

    <!-- Comparative species synteny tracks (overview) -->
    <template v-for="(track, index) in drawnOverviewTracks" :key="track">
      <text v-if="track.type === 'track'" class="label small" :x="getBackbonePanelTrackXOffset(index + 1) + SVGConstants.backboneXPosition" :y="SVGConstants.trackLabelYPosition">{{track.name}}</text>
      <text v-if="track.type === 'track'" class="label small" :x="getBackbonePanelTrackXOffset(index + 1) + SVGConstants.backboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{track.mapName}}</text>
      <TrackSVG v-if="track.type === 'track'"
        show-synteny-on-hover
        show-chromosome 
        :pos-x="getBackbonePanelTrackXOffset(index + 1) + SVGConstants.backboneXPosition"
        :width="SVGConstants.trackWidth" :track="track.track as Track" />
    </template>

    <!-- Comparative panel SVGs ----------------------------------------->
    <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.panelTitleYPosition">Detailed</text>
    <text v-if="backboneSpecies && backboneSelectionTrack" class="label small" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackLabelYPosition">{{backboneSpecies.name}} (backbone)</text>
    <text v-if="backboneSpecies && backboneSelectionTrack" class="label small" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{backboneSpecies.activeMap.name}}</text>
    <BackboneTrackSVG v-if="backboneSelectionTrack" show-data-on-hover :pos-x="SVGConstants.selectedBackboneXPosition" :track="backboneSelectionTrack as Track" />

    <!-- comparative backbone data tracks -->
    <template v-for="(dataTrack, index) in drawnDetailsTracks" :key="dataTrack">
      <text v-if="dataTrack.type === 'dataTrack'  && dataTrack.isComparative" class="label small" :x="getComparativePanelTrackXOffset(index + 1) + SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackLabelYPosition">{{dataTrack.trackType}}</text>
      <TrackSVG v-if="dataTrack.type === 'dataTrack'  && dataTrack.isComparative" 
        show-start-stop
        show-chromosome 
        :pos-x="getComparativePanelTrackXOffset(index + 1) + SVGConstants.selectedBackboneXPosition"
        :width="SVGConstants.trackWidth" :track="dataTrack.track as Track" />
    </template>

    <!-- Comparative species (selected region) synteny tracks -->
    <template v-for="(track, index) in drawnDetailsTracks" :key="track">
      <text v-if="track.type === 'track'" class="label small" :x="getComparativePanelTrackXOffset(index + 1) + SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackLabelYPosition">{{track.name}}</text>
      <text v-if="track.type === 'track'" class="label small" :x="getComparativePanelTrackXOffset(index + 1) + SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{track.mapName}}</text>
      <TrackSVG v-if="track.type === 'track'"
        show-start-stop 
        show-chromosome 
        :pos-x="getComparativePanelTrackXOffset(index + 1) + SVGConstants.selectedBackboneXPosition" 
        :width="SVGConstants.trackWidth" :track="track.track as Track" />
    </template>

    <TooltipSVG :tooltip-data="store.getters.getTooltipData" />
  </svg>

  <VCMapDialog v-model:show="showDialog" :header="dialogHeader" :message="dialogMessage" />
</template>

<script setup lang="ts" >
import Species from '@/models/Species';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import SyntenyApi from '@/api/SyntenyApi';
import { onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import { SyntenyRegionData } from '@/models/SyntenicRegion';
import SpeciesApi from '@/api/SpeciesApi';
import SVGConstants from '@/utils/SVGConstants';
import BackboneSelection from '@/models/BackboneSelection';
import DataTrack from '@/models/DataTrack';
import VCMapDialog from '@/components/VCMapDialog.vue';
import TooltipSVG from './TooltipSVG.vue';
import useDialog from '@/composables/useDialog';
import BackboneTrackSVG from './BackboneTrackSVG.vue';

const GENES_DATA_TRACK_THRESHOLD_MULTIPLIER = 4;
const GAPS_THRESHOLD_MULTIPLIER = 10;

const store = useStore();

const { showDialog, dialogHeader, dialogMessage, onError, checkSyntenyResultsOnComparativeSpecies } = useDialog();

// Reactive data props
const backboneSpecies = ref<Species | null>(null);
const backboneChromosome = ref<Chromosome | null>(null);
const backboneTrack = ref<Track | null>(null);
const backboneDataTracks = ref<DataTrack[]>([]);
const comparativeTracks = ref<Track[]>([]);
const isLoading = ref(false);
const backboneSelectionTrack = ref<Track | null>(null);
const comparativeSelectionTracks = ref<Track[]>([]);

const drawnOverviewTracks = ref<(DataTrack|Track)[]>([]);
const drawnDetailsTracks = ref<(DataTrack|Track)[]>([]);

/**
 * Once mounted, let's set our reactive data props and create the backbone and synteny tracks
 */
onMounted(async () => {
  // Clear any prior selections
  store.dispatch('setTooltipData', null);
  store.dispatch('setSelectedBackboneRegion', null);
  store.dispatch('resetBackboneDataTracks');

  backboneSpecies.value = store.getters.getSpecies;
  backboneChromosome.value = store.getters.getChromosome;

  await updateOverviewPanel();
  // We shouldn't have to cast this variable as Track[] but Typescript is complaining if we don't.
  // Might have something to do with initializing a typed ref to an empty array: ref<Track[]>([])
  // Still looking into it...
  checkSyntenyResultsOnComparativeSpecies(comparativeTracks.value as Track[]);
});

watch(() => store.getters.getSelectedBackboneRegion, () => {
  store.dispatch('setZoom', 1);
  updateDetailsPanel();
});

watch(() => store.getters.getZoom, () => {
  removeSelectionDataTracks();
  updateDetailsPanel();
});

watch(() => store.getters.getShowOverviewGaps, () => {
  updateOverviewPanelComparativeTracks();
});

watch(() => store.getters.getShowDetailsGaps, () => {
  updateDetailsPanelComparativeTracks();
});

watch(() => store.getters.getBackboneDataTracks, (newVal) => {
  backboneDataTracks.value = newVal;
},
{
  deep: true
});

watch(backboneDataTracks, (newVal) => {
  for (let index = 0; index < newVal.length; index++)
  {
    let dataTrack = newVal[index];
    if (dataTrack.isComparativeView)
    {
      setDisplayedObjects(true);
    }
    else
    {
      setDisplayedObjects(false);
    }
  }  
},
{
  deep: true
});


const getZoomedStartAndStopPositions = (originalStart: number, originalStop: number, zoomLevel: number) => {
  let zoomedStart = originalStart;
  let zoomedStop = originalStop;
  let originalRegionLength = originalStop - originalStart;
  let zoomedRegionLength = originalRegionLength * (1 / zoomLevel);

  if (zoomLevel > 1)
  {
    zoomedStart = originalStart + ((originalRegionLength - zoomedRegionLength) / 2);
    zoomedStop = originalStop - ((originalRegionLength - zoomedRegionLength) / 2);
  }
  else if (zoomLevel < 1)
  {
    zoomedStart = originalStart - ((zoomedRegionLength - originalRegionLength) / 2);
    zoomedStop = originalStop + ((zoomedRegionLength - originalRegionLength) / 2);
  }

  let chromosome = store.getters.getChromosome as Chromosome | null;
  zoomedStart = (zoomedStart < 0) ? 0 : Math.floor(zoomedStart);
  zoomedStop = (chromosome?.seqLength && zoomedStop > chromosome.seqLength) ? chromosome.seqLength : Math.ceil(zoomedStop);

  return {
    start: zoomedStart,
    stop: zoomedStop
  };
};

const updateOverviewPanel = async () => {
  let backboneStart = store.getters.getDisplayStartPosition;
  let backboneStop = store.getters.getDisplayStopPosition;
  if (backboneStop - backboneStart > 0)
  {
    store.dispatch('setOverviewResolution', backboneStop - backboneStart);
    backboneTrack.value = createBackboneTrack(backboneStart, backboneStop, store.getters.getBackboneBasePairToHeightRatio) ?? null;

    let tempBackboneTracks = await createBackboneDataTracks(backboneStart, backboneStop, store.getters.getBackboneBasePairToHeightRatio, false) as DataTrack;
    if (tempBackboneTracks != null)
    {
      if (store.getters.getBackboneDataTracks.length > 0)
      {
        let backboneDataTracks = store.getters.getBackboneDataTracks;
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
    }
    comparativeTracks.value = await createSyntenyTracks(
      backboneStart, 
      backboneStop, 
      store.getters.getBackboneBasePairToHeightRatio, 
      store.getters.getShowOverviewGaps,
      store.getters.getOverviewSyntenyThreshold
    );
  }
  else
  {
    backboneTrack.value = null;
    comparativeTracks.value = [];
    backboneDataTracks.value = [];
  }

  setDisplayedObjects(false);
};

const updateOverviewPanelComparativeTracks = async () => {
  let backboneStart = store.getters.getDisplayStartPosition;
  let backboneStop = store.getters.getDisplayStopPosition;
  if (backboneStop - backboneStart > 0)
  {
    comparativeTracks.value = await createSyntenyTracks(
      backboneStart, 
      backboneStop, 
      store.getters.getBackboneBasePairToHeightRatio, 
      store.getters.getShowOverviewGaps,
      store.getters.getOverviewSyntenyThreshold
    );
  }
  else
  {
    comparativeTracks.value = [];
  }
  setDisplayedObjects(false);
};

const updateDetailsPanelComparativeTracks = async () => {
  let originalSelectedBackboneRegion = store.getters.getSelectedBackboneRegion as BackboneSelection | null;
  let selectedStart = originalSelectedBackboneRegion?.basePairStart;
  let selectedStop = originalSelectedBackboneRegion?.basePairStop;

  if (originalSelectedBackboneRegion == null || selectedStart == null || selectedStop == null)
  {
    comparativeSelectionTracks.value = [];
  }
  else
  {
    const { start: selectedBackboneStart, stop: selectedBackboneStop } = getZoomedStartAndStopPositions(selectedStart, selectedStop, store.getters.getZoom);

    if (selectedBackboneStart != null && selectedBackboneStop != null)
    {
      comparativeSelectionTracks.value = await createSyntenyTracks(
        selectedBackboneStart, 
        selectedBackboneStop,
        store.getters.getComparativeBasePairToHeightRatio, 
        store.getters.getShowDetailsGaps,
        store.getters.getDetailsSyntenyThreshold
      );
    }
    else
    {
      comparativeSelectionTracks.value = [];
    }
  }
  setDisplayedObjects(true);
};

const updateDetailsPanel = async () => {

  removeSelectionDataTracks();

  let originalSelectedBackboneRegion = store.getters.getSelectedBackboneRegion as BackboneSelection | null;
  let selectedStart = originalSelectedBackboneRegion?.basePairStart;
  let selectedStop = originalSelectedBackboneRegion?.basePairStop;

  if (originalSelectedBackboneRegion == null || selectedStart == null || selectedStop == null)
  {
    backboneSelectionTrack.value = null;
    comparativeSelectionTracks.value = [];
  }
  else
  {
    const { start: selectedBackboneStart, stop: selectedBackboneStop } = getZoomedStartAndStopPositions(selectedStart, selectedStop, store.getters.getZoom);

    if (selectedBackboneStart != null && selectedBackboneStop != null)
    {
      store.dispatch('setDetailsResolution', selectedBackboneStop - selectedBackboneStart);
      backboneSelectionTrack.value = createBackboneTrack(selectedBackboneStart, selectedBackboneStop, store.getters.getComparativeBasePairToHeightRatio) ?? null;

      let tempBackboneTracks = await createBackboneDataTracks(selectedBackboneStart, selectedBackboneStop, store.getters.getComparativeBasePairToHeightRatio, true) as DataTrack;
      if (tempBackboneTracks != null)
      {
        if (store.getters.getBackboneDataTracks.length > 0)
        {
          let detailTrackPresent = false;
          let backboneDataTracks = store.getters.getBackboneDataTracks;
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
        else
        {
          setBackboneDataTracks(tempBackboneTracks);
        }
      }
      comparativeSelectionTracks.value = await createSyntenyTracks(
        selectedBackboneStart, 
        selectedBackboneStop, 
        store.getters.getComparativeBasePairToHeightRatio, 
        store.getters.getShowDetailsGaps,
        store.getters.getDetailsSyntenyThreshold
      );
    }
    else
    {
      backboneSelectionTrack.value = null;
      comparativeSelectionTracks.value = [];
    }
  }
  setDisplayedObjects(true);
};

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getBackbonePanelTrackXOffset = (trackNumber: number) => {
  let totalTracks = trackNumber;
  return (totalTracks * -70);
};

const getComparativePanelTrackXOffset = (trackNumber: number) => {
  return (trackNumber * 120);
};

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
const createBackboneTrack = (startPos: number, stopPos: number, basePairToHeightRatio: number) => {
  const speciesName = backboneSpecies.value?.name;
  const backboneChromosomeString = backboneChromosome.value?.chromosome;
  if (speciesName != null && backboneChromosomeString != null)
  {
    const trackSection = new TrackSection({
      start: startPos,
      stop: stopPos,
      backboneStart: startPos, 
      backboneStop: stopPos, 
      chromosome: backboneChromosomeString, 
      cutoff: stopPos, 
      basePairToHeightRatio: basePairToHeightRatio,
      shape: 'rect'
    });
    return new Track({ speciesName: speciesName, sections: [trackSection] });
  }
  else
  {
    console.error('Cannot find the start position, stop position, backbone chromosome, and/or backbone species name in the user\'s local storage');
  }
};

const createSyntenyTracks = async (backboneStart: number, backboneStop: number, basePairToHeightRatio: number, includeGaps: boolean, syntenyThreshold: number) => {
  const backboneChr = store.getters.getChromosome as Chromosome;
  let comparativeSpecies: Species[] = [];
  
  if (store.getters.getComparativeSpecies)
  {
    comparativeSpecies = store.getters.getComparativeSpecies;
  }

  let tempComparativeTracks: Track[] = [];
  try
  {
    isLoading.value = true;

    const comparativeSpeciesMaps = comparativeSpecies.map(s => s.activeMap);
    if (backboneStart == null || backboneStop == null || backboneChr == null || comparativeSpeciesMaps.length === 0)
    {
      onError(
        new Error(`Missing properties required for synteny. Values given: [${backboneStart}, ${backboneStop}, ${backboneChr?.chromosome}, ${comparativeSpeciesMaps.length}]`), 
        'Cannot load synteny with missing backbone chromosome, backbone start, backbone stop, or comparative species maps'
      );
      return [];
    }

    // Loop for each comparative species selected
    const syntenyCalls: Promise<SyntenyRegionData[]>[] = [];
    comparativeSpeciesMaps.forEach(map => {
      syntenyCalls.push(SyntenyApi.getSyntenicRegions({
        backboneChromosome: backboneChr,
        start: backboneStart,
        stop: backboneStop,
        comparativeSpeciesMap: map,
        chainLevel: 1,
        threshold: store.getters.getOverviewSyntenyThreshold,
        includeGaps: includeGaps
      }));
    });

    const syntenyBlockResults = await Promise.allSettled(syntenyCalls);
    const tracks: Track[] = [];
    syntenyBlockResults.forEach((result, index) => {
      if (result.status === 'fulfilled')
      {
        const speciesName = comparativeSpecies[index].name;
        const mapName = comparativeSpeciesMaps[index].name;
        // Build synteny tracks for successful API calls
        console.debug(`-- Building synteny track for species: ${speciesName} / ${mapName} --`);
        const trackSections = splitBlocksAndGapsIntoSections(result.value, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);
        const track = new Track({ speciesName: speciesName, sections: trackSections, mapName: mapName });
        tracks.push(track);
      }
      else
      {
        console.error(result.status, result.reason);
      }
    });

    tempComparativeTracks = tracks;
  }
  catch (err)
  {
    onError(err, 'An error occurred while attempting to show the syntenic regions for the comparative species');
    return [];
  }
  finally
  {
    isLoading.value = false;
  }

  return tempComparativeTracks;
};

const createBackboneDataTracks =  async (startPos: number, stopPos: number, basePairToHeightRatio: number, isComparative: boolean) => {
  const backboneChr = store.getters.getChromosome;
  const backboneSpecies = store.getters.getSpecies;

  let tempGeneTracks: Gene[] = [];

  isLoading.value = true;
  try
  {
    tempGeneTracks = await SpeciesApi.getGenesByRegion(backboneChr.chromosome, startPos, stopPos, backboneSpecies.defaultMapKey);
    
    const sections: TrackSection[] = [];
    let hiddenSections: TrackSection[] = [];
    let previousBlockBackboneStop = startPos;
  
    for (let gene of tempGeneTracks)
    {
      let threshold = (isComparative) ? (store.getters.getDetailsSyntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER) : store.getters.getOverviewSyntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
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
    let geneTrack = new Track({ speciesName: backboneSpecies.name, sections: sections });

    if (isComparative)
    { 
      geneDataTrack = new DataTrack('Genes', backboneSpecies.name + ' Detailed Genes', geneTrack, 'red');
      geneDataTrack.setIsComparativeView(true);
      geneDataTrack.isDisplayed = true;

    }
    else
    {
      geneDataTrack = new DataTrack('Genes', backboneSpecies.name + ' Overview Genes', geneTrack, 'red');
      geneDataTrack.isDisplayed = true;
    }

    return geneDataTrack;
  }
  catch (err)
  {
    onError(err, 'An error occurred while attempting to load the genes data track for the backbone species');
  }
  finally
  {
    isLoading.value = false;
  }
};

const setDisplayedObjects = (isComparative: boolean) => {
  if (isComparative)
  {
    drawnDetailsTracks.value = [];
    let comparativeSyntenyTracks = comparativeSelectionTracks.value as Track[];
    
    if (store.getters.getBackboneDataTracks && store.getters.getBackboneDataTracks.length)
    {
      let backboneComparativeDataTracks = store.getters.getBackboneDataTracks.filter((track: DataTrack) => track.isComparativeView) as DataTrack[];


      for (let index = 0; index < backboneComparativeDataTracks.length; index++)
      {
        let currentDataTrack = backboneComparativeDataTracks[index];
        if (currentDataTrack.isDisplayed)
        {
          let drawnObject = {'type': 'dataTrack', 'track': currentDataTrack.track, 'name': currentDataTrack.name, 'trackType': currentDataTrack.type, 'isComparative': true};
          drawnDetailsTracks.value.push(drawnObject);
        }
      }
    }

    for (let index = 0; index < comparativeSyntenyTracks.length; index++)
    {
      let currentTrack = comparativeSyntenyTracks[index];
      let drawnObject = {'type': 'track', 'track': currentTrack, 'name': currentTrack.name, mapName: currentTrack.mapName };
      drawnDetailsTracks.value.push(drawnObject);
    }
  }
  else
  {
    drawnOverviewTracks.value = [];
    let overviewSyntenyTracks = comparativeTracks.value as Track[];

    if (store.getters.getBackboneDataTracks)
    {
      let backboneOverviewDataTracks = store.getters.getBackboneDataTracks as DataTrack[];
      backboneOverviewDataTracks = backboneOverviewDataTracks.filter(track => !track.isComparativeView);
      for (let index = 0; index < backboneOverviewDataTracks.length; index++)
      {
        let currentDataTrack = backboneOverviewDataTracks[index];
        if (currentDataTrack.isDisplayed)
        {
          let drawnObject = {'type': 'dataTrack', 'track': currentDataTrack.track, 'name': currentDataTrack.name, 'trackType': currentDataTrack.type, 'isComparative': false};
          drawnOverviewTracks.value.push(drawnObject);
        }
      }
    }

    for (let index = 0; index < overviewSyntenyTracks.length; index++)
    {
      let currentTrack = overviewSyntenyTracks[index];
      let drawnObject = {'type': 'track', 'track': currentTrack, 'name': currentTrack.name, mapName: currentTrack.mapName };
      drawnOverviewTracks.value.push(drawnObject);
    }
  }
};

const setBackboneDataTracks = (dataTrack: DataTrack) => {
  store.commit('addBackboneDataTrack', dataTrack);
};

function removeSelectionDataTracks()
{
  let dataTracks = store.getters.getBackboneDataTracks;
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

const splitBlocksAndGapsIntoSections = (regions: SyntenyRegionData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number) => {
  let trackSections: TrackSection[] = [];
  let previousBlockBackboneStop = backboneStart;

  console.debug(`Filtering out gaps with threshold: ${threshold * GAPS_THRESHOLD_MULTIPLIER}`);
  regions.forEach(region => {
    const block = region.block;
    const gaps = region.gaps.filter(g => { return g.length >= threshold * GAPS_THRESHOLD_MULTIPLIER; });

    if (gaps.length === 0)
    {
      // No gaps, create section for this synteny block like normal
      trackSections.push(new TrackSection({
        start: block.start,
        stop: block.stop,
        backboneStart: block.backboneStart, 
        backboneStop: block.backboneStop, 
        chromosome: block.chromosome, 
        cutoff: backboneStop, 
        offsetCount: block.backboneStart - previousBlockBackboneStop,
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect'
      }));
      previousBlockBackboneStop = block.backboneStop;
      return;
    }

    // Split the block and its gaps into their own TrackSections
    gaps.forEach((gap, index) => {

      if (index === 0 && (gap.backboneStart <= backboneStart))
      {
        // Block starts off with a gap
        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop, 
          offsetCount: gap.backboneStart - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line'
        }));
      }
      else if (index === 0)
      {
        // Starts off with part of a block and then the gap
        trackSections.push(new TrackSection({
          start: block.start,
          stop: gap.start,
          backboneStart: block.backboneStart, 
          backboneStop: gap.backboneStart, 
          chromosome: block.chromosome, 
          cutoff: backboneStop, 
          offsetCount: block.backboneStart - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect'
        }));

        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line'
        }));
      }
      else
      {
        // Create a section for the part of the block that comes before this gap
        let previousGap = gaps[index - 1];
        trackSections.push(new TrackSection({
          start: previousGap.stop,
          stop: gap.start,
          backboneStart: previousGap.backboneStop, 
          backboneStop: gap.backboneStart, 
          chromosome: block.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect'
        }));

        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line'
        }));
      }
    });

    let lastGap = gaps[gaps.length - 1];
    if (lastGap.backboneStop < backboneStop && lastGap.stop < block.stop)
    {
      // Create a section for the last part of the block
      trackSections.push(new TrackSection({
        start: lastGap.stop,
        stop: block.stop,
        backboneStart: lastGap.backboneStop, 
        backboneStop: block.backboneStop, 
        chromosome: block.chromosome, 
        cutoff: backboneStop,
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect'
      }));
    }
    else
    {
      console.debug('Block section thrown out due to extending past displayed backbone region');
    }

    previousBlockBackboneStop = block.backboneStop;
  });

  console.debug(`Regions split into ${trackSections.length} sections`, trackSections);
  warnIfNegativeHeight(trackSections);
  return trackSections;
};

const warnIfNegativeHeight = (trackSections: TrackSection[]) => {
  trackSections.forEach((section, index) => {
    if (section.height < 0)
    {
      console.warn('Negative height', index, section);
    }
  });
};
</script>

<style lang="scss" scoped>
rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
}

.vcmap-loader.p-progressbar
{
  height: 0.25em;
}
</style>
