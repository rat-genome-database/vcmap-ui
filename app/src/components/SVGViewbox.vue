<template>
  <ProgressBar class="vcmap-loader" :mode="(isLoading) ? 'indeterminate' : 'determinate'" :value="0" :showValue="false"/>
  <svg :viewBox="'0 0 1000 ' + ViewSize.viewboxHeight" xmlns="http://www.w3.org/2000/svg">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="1000" :height="ViewSize.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel" x="0" :width="ViewSize.overviewPanelWidth" :height="ViewSize.viewboxHeight" />
    <rect class="panel" :x="ViewSize.overviewPanelWidth" :width="ViewSize.detailsPanelWidth" :height="ViewSize.viewboxHeight" />
    <!-- Title panels -->
    <rect class="panel" x="0" :width="ViewSize.overviewPanelWidth" :height="ViewSize.panelTitleHeight" />
    <rect class="panel" :x="ViewSize.overviewPanelWidth" :width="ViewSize.detailsPanelWidth" :height="ViewSize.panelTitleHeight" />

    <!-- Backbone panel SVGs ------------------------------------------->
    <!-- backbone species track -->
    <text class="label medium bold" :x="ViewSize.overviewTitleXPosition" :y="ViewSize.panelTitleYPosition">Overview</text>
    <text v-if="backboneSpecies" class="label small" :x="ViewSize.backboneXPosition" :y="ViewSize.trackLabelYPosition">{{backboneSpecies.name}} (backbone)</text>
    <TrackSVG v-if="backboneTrack" is-selectable show-start-stop show-chromosome :pos-x="ViewSize.backboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="backboneTrack as Track" />

    <!-- backbone data tracks -->
    <template v-for="(dataTrack, index) in drawnOverviewTracks" :key="dataTrack">
      <text v-if="dataTrack.type === 'dataTrack' && !dataTrack.isComparative" class="label small" :x="getBackbonePanelTrackXOffset(index + 1) + ViewSize.backboneXPosition" :y="ViewSize.trackLabelYPosition">{{dataTrack.trackType}}</text>
      <TrackSVG v-if="dataTrack.type === 'dataTrack' && !dataTrack.isComparative" show-data-on-hover show-chromosome :pos-x="getBackbonePanelTrackXOffset(index + 1) + ViewSize.backboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="dataTrack.track as Track" />
    </template>

    <!-- Comparative species synteny tracks -->
    <template v-for="(track, index) in drawnOverviewTracks" :key="track">
      <text v-if="track.type === 'track'" class="label small" :x="getBackbonePanelTrackXOffset(index + 1) + ViewSize.backboneXPosition" :y="ViewSize.trackLabelYPosition">{{track.name}}</text>
      <TrackSVG v-if="track.type === 'track'" show-data-on-hover show-chromosome :pos-x="getBackbonePanelTrackXOffset(index + 1) + ViewSize.backboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="track.track as Track" />
    </template>

    <!-- Comparative panel SVGs ----------------------------------------->
    <text class="label medium bold" :x="ViewSize.selectedBackboneXPosition" :y="ViewSize.panelTitleYPosition">Detailed</text>
    <text v-if="backboneSpecies" class="label small" :x="ViewSize.selectedBackboneXPosition" :y="ViewSize.trackLabelYPosition">{{backboneSpecies.name}} (backbone)</text>
    <TrackSVG v-if="backboneSelectionTrack" show-start-stop show-chromosome :pos-x="ViewSize.selectedBackboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="backboneSelectionTrack as Track" />

    <!-- comparative backbone data tracks -->
    <template v-for="(dataTrack, index) in drawnDetailsTracks" :key="dataTrack">
      <text v-if="dataTrack.type === 'dataTrack'  && dataTrack.isComparative" class="label small" :x="getComparativePanelTrackXOffset(index + 1) + ViewSize.selectedBackboneXPosition" :y="ViewSize.trackLabelYPosition">{{dataTrack.trackType}}</text>
      <TrackSVG v-if="dataTrack.type === 'dataTrack'  && dataTrack.isComparative" show-start-stop show-data-on-hover show-chromosome :pos-x="getComparativePanelTrackXOffset(index + 1) + ViewSize.selectedBackboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="dataTrack.track as Track" />
    </template>

    <!-- Comparative species (selected region) synteny tracks -->
    <template v-for="(track, index) in drawnDetailsTracks" :key="track">
      <text v-if="track.type === 'track'" class="label small" :x="getComparativePanelTrackXOffset(index + 1) + ViewSize.selectedBackboneXPosition" :y="ViewSize.trackLabelYPosition">{{track.name}}</text>
      <TrackSVG v-if="track.type === 'track'" show-data-on-hover show-start-stop show-chromosome :pos-x="getComparativePanelTrackXOffset(index + 1) + ViewSize.selectedBackboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="track.track as Track" />
    </template>

    <TooltipSVG :tooltip-data="store.getters.getTooltipData"/>
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
import Map from '@/models/Map';
import Gene from '@/models/Gene';
import { SyntenyRegionData } from '@/models/SyntenicRegion';
import SpeciesApi from '@/api/SpeciesApi';
import ViewSize from '@/utils/ViewSize';
import BackboneSelection from '@/models/BackboneSelection';
import DataTrack from '@/models/DataTrack';
import VCMapDialog from '@/components/VCMapDialog.vue';
import TooltipSVG from './TooltipSVG.vue';

const GENES_DATA_TRACK_THRESHOLD_MULTIPLIER = 4;
const GAPS_THRESHOLD_MULTIPLIER = 10;

const store = useStore();

// Reactive data props
const backboneSpecies = ref<Species | null>(null);
const backboneChromosome = ref<Chromosome | null>(null);
const backboneTrack = ref<Track | null>(null);
const backboneDataTracks = ref<DataTrack[]>([]);
const comparativeTracks = ref<Track[]>([]);
const isLoading = ref(false);
const backboneSelectionTrack = ref<Track | null>(null);
const comparativeSelectionTracks = ref<Track[]>([]);

const drawnOverviewTracks = ref<DataTrack[] | Track[]>([]);
const drawnDetailsTracks = ref<DataTrack[] | Track[]>([]);

const showDialog = ref(false);
const dialogHeader = ref('');
const dialogMessage = ref('');

/**
 * Once mounted, let's set our reactive data props and create the backbone and synteny tracks
 */
onMounted(() => {
  // Clear any prior selections
  store.dispatch('setTooltipData', null);
  store.dispatch('setSelectedBackboneRegion', null);
  store.dispatch('resetBackboneDataTracks');

  backboneSpecies.value = store.getters.getSpecies;
  backboneChromosome.value = store.getters.getChromosome;

  updateOverviewPanel();
});

watch(() => store.getters.getSelectedBackboneRegion, () => {
  store.dispatch('setComparativeZoom', 1);
  removeSelectionDataTracks();
  updateDetailsPanel();
});

watch(() => store.getters.getBackboneZoom, (newVal, oldVal) => {
  let backboneStart = store.getters.getStartPosition;
  let backboneStop = store.getters.getStopPosition;

  if (oldVal === newVal || backboneStart == null || backboneStop == null)
  {
    return;
  }
  removeOverviewDataTracks();
  const zoomedPositions = getZoomedStartAndStopPositions(backboneStart, backboneStop, newVal);
  store.dispatch('setDisplayStartPosition', zoomedPositions.start);
  store.dispatch('setDisplayStopPosition', zoomedPositions.stop);
  updateOverviewPanel();
});

watch(() => store.getters.getComparativeZoom, () => {
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
    store.dispatch('setBackboneResolution', backboneStop - backboneStart);
    backboneTrack.value = createBackboneTrack(backboneStart, backboneStop, store.getters.getBackboneBasePairToHeightRatio) ?? null;

    let tempBackboneTracks = await createBackboneDataTracks(backboneStart, backboneStop, store.getters.getBackboneBasePairToHeightRatio, false) as DataTrack;
    if (tempBackboneTracks != null)
    {
      setBackboneDataTracks(tempBackboneTracks);
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
    const { start: selectedBackboneStart, stop: selectedBackboneStop } = getZoomedStartAndStopPositions(selectedStart, selectedStop, store.getters.getComparativeZoom);

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
    const { start: selectedBackboneStart, stop: selectedBackboneStop } = getZoomedStartAndStopPositions(selectedStart, selectedStop, store.getters.getComparativeZoom);

    if (selectedBackboneStart != null && selectedBackboneStop != null)
    {
      store.dispatch('setComparativeResolution', selectedBackboneStop - selectedBackboneStart);
      backboneSelectionTrack.value = createBackboneTrack(selectedBackboneStart, selectedBackboneStop, store.getters.getComparativeBasePairToHeightRatio) ?? null;

      let tempBackboneTracks = await createBackboneDataTracks(selectedBackboneStart, selectedBackboneStop, store.getters.getComparativeBasePairToHeightRatio, true) as DataTrack;
      if (tempBackboneTracks != null)
      {
        setBackboneDataTracks(tempBackboneTracks);
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
    return new Track(speciesName, [trackSection]);
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
    // Primary maps for comparative species
    const mapCalls = comparativeSpecies.map(s => SpeciesApi.getMaps(s.typeKey));
    const mapResults = await Promise.allSettled(mapCalls);
    const comparativeSpeciesMaps: Map[] = [];
    mapResults.forEach(result => {
      if (result.status === 'fulfilled')
      {
        const maps = result.value;
        for (let i = 0; i < maps.length; i++)
        {
          if (maps[i].primaryRefAssembly)
          {
            comparativeSpeciesMaps.push(maps[i]);
            break;
          }
        }
      }
      else
      {
        console.error(result.status, result.reason);
      }
    });

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
    let speciesSyntenyMap: {[speciesName: string]: SyntenyRegionData[]} = {};
    syntenyBlockResults.forEach((result, index) => {
      if (result.status === 'fulfilled')
      {
        speciesSyntenyMap[comparativeSpecies[index].name] = result.value;
      }
      else
      {
        console.error(result.status, result.reason);
        speciesSyntenyMap[comparativeSpecies[index].name] = [];
      }
    });

    const tracks: Track[] = [];
    for (let speciesName in speciesSyntenyMap)
    {
      console.debug(`-- Building synteny track for species: ${speciesName} --`);
      const trackSections = splitBlocksAndGapsIntoSections(speciesSyntenyMap[speciesName], backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);
      const track = new Track(speciesName, trackSections);
      tracks.push(track);
    }
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

  let resultsFound = tempComparativeTracks.some(track => track.sections.length > 0);
  if (!resultsFound)
  {
    showNoResultsDialog();
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
    let previousBlockBackboneStop = startPos;
  
    for (let gene of tempGeneTracks)
    {
      let threshold = (isComparative) ? (store.getters.getDetailsSyntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER) : store.getters.getOverviewSyntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
      let geneSize = gene.stop - gene.start;
      if ( geneSize < threshold)
      {
        continue;
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
            gene: gene.name
          });

          sections.push(trackSection);
          previousBlockBackboneStop = gene.stop;
        }
      }
    }
    let geneDataTrack;
    let geneTrack = new Track(backboneSpecies.name, sections);

    if (isComparative)
    { 
      geneDataTrack = new DataTrack('Genes', backboneSpecies.name + ' Detailed Genes', geneTrack, 'red');
      geneDataTrack.setIsComparativeView(true);
    }
    else
    {
      geneDataTrack = new DataTrack('Genes', backboneSpecies.name + ' Overview Genes', geneTrack, 'red');
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
        let drawnObject = {'type': 'track', 'track': currentTrack, 'name': currentTrack.name, };
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
        let drawnObject = {'type': 'track', 'track': currentTrack, 'name': currentTrack.name, };
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

function removeOverviewDataTracks()
{
  let dataTracks = store.getters.getBackboneDataTracks;
  for (let index = 0; index < dataTracks.length; index++)
  {
    let currentDataTrack = dataTracks[index];
    if (!currentDataTrack.isComparativeView)
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

const onError = (err: any, userMessage: string) => {
  console.error(err);
  dialogHeader.value = 'Error';
  dialogMessage.value = userMessage;
  showDialog.value = true;
};

const showNoResultsDialog = () => {
  dialogHeader.value = 'No Results';
  dialogMessage.value = 'No syntenic regions were found for the selected species and base pair range.';
  showDialog.value = true;
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
