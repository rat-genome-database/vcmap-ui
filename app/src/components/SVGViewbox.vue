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

    <!-- Overview panel SVGs ------------------------------------------->
    
    <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
    <template v-for="(trackSet, index) in overviewTrackSets" :key="trackSet">
      <template v-if="trackSet.dataTracks.length > 0">
        <template v-for="dataTrack, index2 in trackSet.dataTracks" :key="dataTrack.name">
          <TrackSVG v-if="dataTrack.isDisplayed"
            show-data-on-hover 
            show-chromosome
            show-gene-label 
            :pos-x="getBackbonePanelTrackXOffset(index, 'datatrack', index2) + SVGConstants.backboneXPosition" :pos-y="SVGConstants.trackYPosition" 
            :width="SVGConstants.dataTrackWidth" :track="dataTrack.track as Track" />
        </template>
      </template>

      <text class="label small" :x="getBackbonePanelTrackXOffset(index, 'track') + SVGConstants.backboneXPosition" :y="SVGConstants.trackLabelYPosition">{{trackSet.speciesTrack.name}}</text>
      <text class="label small" :x="getBackbonePanelTrackXOffset(index, 'track') + SVGConstants.backboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{trackSet.speciesTrack.mapName}}</text>
      <TrackSVG v-if="index != 0"
        :show-data-on-hover="index != 0"
        :show-chromosome="index != 0"
        :show-gene-label ="index != 0"
        :pos-x="getBackbonePanelTrackXOffset(index, 'track') + SVGConstants.backboneXPosition" :pos-y="SVGConstants.trackYPosition" 
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
        :show-data-on-hover="index != 0"
        :show-chromosome="index != 0"
        :show-gene-label ="index != 0"
        :pos-x="getComparativePanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :pos-y="SVGConstants.trackYPosition" 
        :width="SVGConstants.trackWidth" :track="trackSet.speciesTrack as Track" />

      <BackboneTrackSVG v-else
        is-selectable 
        :pos-x="getComparativePanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :track="trackSet.speciesTrack as Track" />

      <template v-if="trackSet.dataTracks.length > 0">
        <template v-for="dataTrack, index2 in trackSet.dataTracks" :key="dataTrack.name">
          <TrackSVG v-if="dataTrack.isDisplayed"
            show-data-on-hover 
            show-chromosome
            show-gene-label 
            :pos-x="getComparativePanelTrackXOffset(index, 'datatrack', index2) + SVGConstants.selectedBackboneXPosition" :pos-y="SVGConstants.trackYPosition" 
            :width="SVGConstants.dataTrackWidth" :track="dataTrack.track as Track" />
        </template>
      </template>
    </template>

     <!-- Navigation buttons -->
    <image href="../../node_modules/primeicons/raw-svg/chevron-up.svg" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image href="../../node_modules/primeicons/raw-svg/chevron-down.svg" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />

    <TooltipSVG :tooltip-data="store.getters.getTooltipData" />
  </svg>

  <VCMapDialog v-model:show="showDialog" :header="dialogHeader" :message="dialogMessage" />
</template>

<script setup lang="ts" >
import Species from '@/models/Species';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import SyntenyApi from '@/api/SyntenyApi';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import { SyntenyRegionData } from '@/models/SyntenicRegion';
import SpeciesApi from '@/api/SpeciesApi';
import SVGConstants from '@/utils/SVGConstants';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import DataTrack from '@/models/DataTrack';
import VCMapDialog from '@/components/VCMapDialog.vue';
import TooltipSVG from './TooltipSVG.vue';
import useDialog from '@/composables/useDialog';
import BackboneTrackSVG from './BackboneTrackSVG.vue';
import TrackSet from '@/models/TrackSet';

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

const overviewTrackSets = ref<TrackSet[]>([]);
const detailTrackSets = ref<TrackSet[]>([]);

/**
 * Once mounted, let's set our reactive data props and create the backbone and synteny tracks
 */
onMounted(async () => {
  // Clear any prior selections
  store.dispatch('setTooltipData', null);
  store.dispatch('setSelectedBackboneRegion', new BackboneSelection(new SelectedRegion(0,0,0,0)));
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

watch(() => store.getters.getBackboneDataTracks, (newVal) => {
  backboneDataTracks.value = newVal;
},
{
  deep: true
});


const updateOverviewPanel = async () => {
  let backboneStart = store.getters.getDisplayStartPosition;
  let backboneStop = store.getters.getDisplayStopPosition;

  if (backboneStop - backboneStart > 0)
  {
    overviewTrackSets.value = [];
    let backboneTrackSet;
    store.dispatch('setOverviewResolution', backboneStop - backboneStart);
    backboneTrack.value = createBackboneTrack(backboneStart, backboneStop, store.getters.getOverviewBasePairToHeightRatio, SVGConstants.overviewTrackYPosition) ?? null;

    let tempBackboneTracks = await createBackboneDataTracks(backboneStart, backboneStop, store.getters.getOverviewBasePairToHeightRatio, false, SVGConstants.overviewTrackYPosition) as DataTrack;
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

      backboneTrackSet = new TrackSet(backboneTrack.value, [tempBackboneTracks]);
      overviewTrackSets.value.push(backboneTrackSet);
    }
    comparativeTracks.value = await createSyntenyTracks(
      backboneStart, 
      backboneStop, 
      store.getters.getOverviewBasePairToHeightRatio,
      store.getters.getOverviewSyntenyThreshold,
      SVGConstants.overviewTrackYPosition
    );

    for (let index = 0; index < comparativeTracks.value.length; index++)
    {
      let track = comparativeTracks.value[index];
      //TODO: query for comparative species datatracks

      let comparativeTrackSet = new TrackSet(track, []);
      overviewTrackSets.value.push(comparativeTrackSet);
    }
  }
  else
  {
    backboneTrack.value = null;
    comparativeTracks.value = [];
    backboneDataTracks.value = [];
  }
};

const updateDetailsPanel = async () => {

  removeSelectionDataTracks();

  const originalSelectedBackboneRegion = store.getters.getSelectedBackboneRegion as BackboneSelection;
  if (originalSelectedBackboneRegion.baseSelection.svgHeight === 0)
  {
    backboneSelectionTrack.value = null;
    comparativeSelectionTracks.value = [];
  }
  else
  {
    const zoomedSelection = originalSelectedBackboneRegion.generateInnerSelection(store.getters.getZoom, store.getters.getOverviewBasePairToHeightRatio);
    detailTrackSets.value = [];
    let detailBackboneTrackSet;

    store.dispatch('setDetailsResolution', zoomedSelection.basePairStop - zoomedSelection.basePairStart);
    backboneSelectionTrack.value = createBackboneTrack(zoomedSelection.basePairStart, zoomedSelection.basePairStop, store.getters.getComparativeBasePairToHeightRatio) ?? null;

    let tempBackboneTracks = await createBackboneDataTracks(zoomedSelection.basePairStart, zoomedSelection.basePairStop, store.getters.getComparativeBasePairToHeightRatio, true) as DataTrack;
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

        detailBackboneTrackSet = new TrackSet(backboneSelectionTrack.value, [tempBackboneTracks]);
        detailTrackSets.value.push(detailBackboneTrackSet);
      }

      comparativeSelectionTracks.value = await createSyntenyTracks(
        zoomedSelection.basePairStart, 
        zoomedSelection.basePairStop, 
        store.getters.getComparativeBasePairToHeightRatio,
        store.getters.getDetailsSyntenyThreshold
      );

      for (let index = 0; index < comparativeSelectionTracks.value.length; index++)
      {
        let track = comparativeSelectionTracks.value[index];
        //TODO: query for comparative species datatracks

        let detailComparativeTrackSet = new TrackSet(track, []);
        detailTrackSets.value.push(detailComparativeTrackSet);
      }
    }
    else
    {
      backboneSelectionTrack.value = null;
      comparativeSelectionTracks.value = [];
    }
  }
};

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getBackbonePanelTrackXOffset = (trackNumber: number, trackType: string, dataTrackNum: number) => {
  let totalTracks = trackNumber;
  let offset = 0;
  
  //data tracks are drawn on the right side of the backbone track, and first
  if (trackType == 'datatrack')
  {
    //every displayed datatrack will have a buffer of 30 between tracks - if last datatrack
    offset = (totalTracks * -60) + (dataTrackNum * -30);
  }
  else
  {
    //the backbone track will have no calculable offset for its datatrack, so we set it to 30.  Later tracks will have a buffer of 30 added between them
    totalTracks == 0 ? offset = -30 : offset = (totalTracks * -60) - 30;
  }

  return offset;
};

const getComparativePanelTrackXOffset = (trackNumber: number, trackType: string, dataTrackNum: number) => {
  let totalTracks = trackNumber;
  let offset = 0;
  
  //data tracks are drawn on the right side of the backbone track, and first
  if (trackType == 'datatrack')
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

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
const createBackboneTrack = (startPos: number, stopPos: number, basePairToHeightRatio: number, startingSVGYPos = SVGConstants.panelTitleHeight) => {
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
    return new Track({ speciesName: speciesName, sections: [trackSection], startingSVGY: startingSVGYPos });
  }
  else
  {
    console.error('Cannot find the start position, stop position, backbone chromosome, and/or backbone species name in the user\'s local storage');
  }
};

const createSyntenyTracks = async (backboneStart: number, backboneStop: number, basePairToHeightRatio: number, syntenyThreshold: number, startingSVGYPos = SVGConstants.panelTitleHeight) => {
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
        threshold: store.getters.getOverviewSyntenyThreshold,
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
        const trackSections = splitLevel1And2RegionsIntoSections(result.value, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);
        const track = new Track({ speciesName: speciesName, sections: trackSections, mapName: mapName, isSyntenyTrack: true, startingSVGY: startingSVGYPos });
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

const createBackboneDataTracks =  async (startPos: number, stopPos: number, basePairToHeightRatio: number, isComparative: boolean, startingSVGYPos = SVGConstants.panelTitleHeight) => {
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
    let geneTrack = new Track({ speciesName: backboneSpecies.name, sections: sections, startingSVGY: startingSVGYPos });

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

const splitLevel1And2RegionsIntoSections = (regions: SyntenyRegionData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number) => {
  console.debug('LEVEL 1');
  const level1Sections = splitBlocksAndGapsIntoSections(
    regions.filter(r => r.block.chainLevel === 1),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold
  );
  console.debug('LEVEL 2');
  const level2Sections = splitBlocksAndGapsIntoSections(
    regions.filter(r => r.block.chainLevel === 2),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold
  );

  return level1Sections.concat(level2Sections);
};

const splitBlocksAndGapsIntoSections = (regions: SyntenyRegionData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number) => {
  let trackSections: TrackSection[] = [];
  let previousBlockBackboneStop = backboneStart;

  console.debug(`Filtering out gaps with threshold: ${threshold * GAPS_THRESHOLD_MULTIPLIER}`);
  regions.forEach(region => {
    const block = region.block;
    const gaps = region.gaps.filter(g => { return g.length >= threshold * GAPS_THRESHOLD_MULTIPLIER && g.chainLevel === block.chainLevel; });

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
        shape: 'rect',
        chainLevel: block.chainLevel,
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
          shape: 'line',
          chainLevel: block.chainLevel,
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
          shape: 'rect',
          chainLevel: block.chainLevel,
        }));

        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
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
          shape: 'rect',
          chainLevel: block.chainLevel,
        }));

        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
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
        shape: 'rect',
        chainLevel: block.chainLevel,
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

const navigateUp = () => {
  if (isNavigationDisabled.value) return;

  console.log('Navigate Up placeholder');
};

const navigateDown = () => {
  if (isNavigationDisabled.value) return;

  console.log('Navigate Down placeholder');
};

const isNavigationDisabled = computed(() => {
  return store.getters.getZoom <= 1;
});
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
