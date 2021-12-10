<template>
  <ProgressBar class="vcmap-loader" :mode="(isLoading) ? 'indeterminate' : 'determinate'" :value="0" :showValue="false"/>
  <svg :viewBox="'0 0 1000 ' + ViewSize.viewboxHeight" xmlns="http://www.w3.org/2000/svg">
    <!-- Outside panel -->
    <rect class="panel" x="0" width="1000" :height="ViewSize.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel" x="0" :width="ViewSize.backbonePanelWidth" :height="ViewSize.viewboxHeight" />
    <rect class="panel" :x="ViewSize.backbonePanelWidth" :width="ViewSize.comparativePanelWidth" :height="ViewSize.viewboxHeight" />
    <!-- Title panels -->
    <rect class="panel" x="0" :width="ViewSize.backbonePanelWidth" :height="ViewSize.panelTitleHeight" />
    <rect class="panel" :x="ViewSize.backbonePanelWidth" :width="ViewSize.comparativePanelWidth" :height="ViewSize.panelTitleHeight" />

    <!-- Backbone panel SVGs ------------------------------------------->
    <!-- backbone species track -->
    <text class="label medium bold" :x="ViewSize.backboneXPosition" :y="ViewSize.panelTitleYPosition">Backbone</text>
    <text v-if="backboneSpecies" class="label small" :x="ViewSize.backboneXPosition" :y="ViewSize.trackLabelYPosition">{{backboneSpecies.name}}</text>
    <TrackSVG v-if="backboneTrack" is-selectable show-start-stop :pos-x="ViewSize.backboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="backboneTrack as Track" />

    <!-- Comparative species synteny tracks -->
    <template v-for="(track, index) in comparativeTracks" :key="track">
      <text class="label small" :x="getBackbonePanelTrackXOffset(index + 1) + ViewSize.backboneXPosition" :y="ViewSize.trackLabelYPosition">{{track.name}}</text>
      <TrackSVG v-if="track" is-highlightable :pos-x="getBackbonePanelTrackXOffset(index + 1) + ViewSize.backboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="track as Track" />
    </template>

    <!-- Comparative panel SVGs ----------------------------------------->
    <text class="label medium bold" :x="ViewSize.selectedBackboneXPosition" :y="ViewSize.panelTitleYPosition">Comparative</text>
    <text v-if="backboneSpecies" class="label small" :x="ViewSize.selectedBackboneXPosition" :y="ViewSize.trackLabelYPosition">{{backboneSpecies.name}}</text>
    <TrackSVG v-if="backboneSelectionTrack" show-start-stop :pos-x="ViewSize.selectedBackboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="backboneSelectionTrack as Track" />

    <!-- Comparative species (selected region) synteny tracks -->
    <template v-for="(track, index) in comparativeSelectionTracks" :key="track">
      <text class="label small" :x="getComparativePanelTrackXOffset(index + 1) + ViewSize.selectedBackboneXPosition" :y="ViewSize.trackLabelYPosition">{{track.name}}</text>
      <TrackSVG v-if="track" is-highlightable show-start-stop :pos-x="getComparativePanelTrackXOffset(index + 1) + ViewSize.selectedBackboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="track as Track" />
    </template>

  </svg>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import SyntenyApi from '@/api/SyntenyApi';
import { onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';
import Chromosome from '@/models/Chromosome';
import Map from '@/models/Map';
import SyntenyBlock from '@/models/SyntenyBlock';
import SpeciesApi from '@/api/SpeciesApi';
import ViewSize from '@/utils/ViewSize';
import BackboneSelection from '@/models/BackboneSelection';

const store = useStore();

// Reactive data props
let backboneSpecies = ref<Species | null>(null);
let backboneChromosome = ref<Chromosome | null>(null);
let backboneTrack = ref<Track | null>(null);
let comparativeTracks = ref<Track[] | null>(null);
let isLoading = ref<boolean>(false);
let backboneSelectionTrack = ref<Track | null>(null);
let comparativeSelectionTracks = ref<Track[] | null>(null);

/**
 * Once mounted, let's set our reactive data props and create the backbone and synteny tracks
 */
onMounted(() => {
  // Clear any prior selections
  store.dispatch('setSelectedBackboneRegion', null);

  backboneSpecies.value = store.getters.getSpecies;
  backboneChromosome.value = store.getters.getChromosome;

  updateBackbonePanel();
});

watch(() => store.getters.getSelectedBackboneRegion, (newVal) => {
  let selectedRegion = newVal as BackboneSelection | null;
  store.dispatch('setComparativeZoom', 1);
  updateComparativePanel(selectedRegion?.basePairStart, selectedRegion?.basePairStop);
});

watch(() => store.getters.getBackboneZoom, (newVal, oldVal) => {
  let backboneStart = store.getters.getStartPosition;
  let backboneStop = store.getters.getStopPosition;

  if (oldVal === newVal || backboneStart == null || backboneStop == null)
  {
    return;
  }

  const zoomedPositions = getZoomedStartAndStopPositions(backboneStart, backboneStop, newVal);
  store.dispatch('setDisplayStartPosition', zoomedPositions.start);
  store.dispatch('setDisplayStopPosition', zoomedPositions.stop);
  updateBackbonePanel();
});

watch(() => store.getters.getComparativeZoom, (newVal, oldVal) => {
  let originalSelectedBackboneRegion = store.getters.getSelectedBackboneRegion as BackboneSelection;
  if (oldVal !== newVal && originalSelectedBackboneRegion != null)
  {
    let selectedStart = originalSelectedBackboneRegion.basePairStart;
    let selectedStop = originalSelectedBackboneRegion.basePairStop;
    const zoomedPositions = getZoomedStartAndStopPositions(selectedStart, selectedStop, newVal);
    updateComparativePanel(zoomedPositions.start, zoomedPositions.stop);
  }
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

const updateBackbonePanel = async () => {
  let backboneStart = store.getters.getDisplayStartPosition;
  let backboneStop = store.getters.getDisplayStopPosition;
  if (backboneStop - backboneStart > 0)
  {
    store.dispatch('setBackboneResolution', backboneStop - backboneStart);
    backboneTrack.value = createBackboneTrack(backboneStart, backboneStop, store.getters.getBackboneBasePairToHeightRatio) ?? null;
    comparativeTracks.value = await createSyntenyTracks(backboneStart, backboneStop, store.getters.getBackboneBasePairToHeightRatio) ?? null;
  }
  else
  {
    backboneTrack.value = null;
    comparativeTracks.value = null;
  }
};

const updateComparativePanel = async (selectedBackboneStart: number | undefined, selectedBackboneStop: number | undefined) => {
  if (selectedBackboneStart != null && selectedBackboneStop != null)
  {
    store.dispatch('setComparativeResolution', selectedBackboneStop - selectedBackboneStart);
    backboneSelectionTrack.value = createBackboneTrack(selectedBackboneStart, selectedBackboneStop, store.getters.getComparativeBasePairToHeightRatio) ?? null;
    comparativeSelectionTracks.value = await createSyntenyTracks(selectedBackboneStart, selectedBackboneStop, store.getters.getComparativeBasePairToHeightRatio) ?? null;
  }
  else
  {
    backboneSelectionTrack.value = null;
    comparativeSelectionTracks.value = null;
  }
};

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getBackbonePanelTrackXOffset = (trackNumber: number) => {
  return (trackNumber * -70);
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
      basePairToHeightRatio: basePairToHeightRatio
    });
    return new Track(speciesName, [trackSection]);
  }
  else
  {
    console.error('Cannot find the start position, stop position, backbone chromosome, and/or backbone species name in the user\'s local storage');
  }
};

const createSyntenyTracks = async (backboneStart: number, backboneStop: number, basePairToHeightRatio: number) => {
  const backboneChr = store.getters.getChromosome as Chromosome;
  const comparativeSpecies: Species[] = [];
  
  if (store.getters.getComparativeSpeciesOne)
  {
    comparativeSpecies.push(store.getters.getComparativeSpeciesOne as Species);
  }

  if (store.getters.getComparativeSpeciesTwo)
  {
    comparativeSpecies.push(store.getters.getComparativeSpeciesTwo as Species);
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
      console.error('Cannot get synteny blocks with missing backbone chromosome, backbone start, backbone stop, or comparative species maps');
      return;
    }

    // Loop for each comparative species selected
    const syntenyCalls: Promise<SyntenyBlock[]>[] = [];
    comparativeSpeciesMaps.forEach(map => {
      syntenyCalls.push(SyntenyApi.getSyntenyBlocks({
        backboneChromosome: backboneChr,
        start: backboneStart,
        stop: backboneStop,
        comparativeSpeciesMap: map,
        chainLevel: 1,
        threshold: store.getters.getBackboneSyntenyThreshold
      }));
    });

    const syntenyResults = await Promise.allSettled(syntenyCalls);
    let speciesSyntenyMap: {[key: string]: SyntenyBlock[]} = {};
    syntenyResults.forEach((result, index) => {
      if (result.status === 'fulfilled')
      {
        speciesSyntenyMap[comparativeSpecies[index].name] = result.value;
      }
      else
      {
        console.error(result.status, result.reason);
      }
    });

    const tracks: Track[] = [];
    for (let speciesName in speciesSyntenyMap)
    {
      console.debug(`-- Building synteny track for species: ${speciesName} --`);
      const blocks = speciesSyntenyMap[speciesName];
      const trackSections: TrackSection[] = [];
      let previousBlockBackboneStop = backboneStart;
      blocks.forEach(block => {
        const trackSection = new TrackSection({
          start: block.start,
          stop: block.stop,
          backboneStart: block.backboneStart, 
          backboneStop: block.backboneStop, 
          chromosome: block.chromosome, 
          cutoff: backboneStop, 
          offsetCount: block.backboneStart - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio
        });
        console.debug(speciesName, trackSection, block, previousBlockBackboneStop);
        trackSections.push(trackSection);
        previousBlockBackboneStop = block.backboneStop;
      });
      const track = new Track(speciesName, trackSections);
      tracks.push(track);
    }

    tempComparativeTracks = tracks;
  }
  catch (err)
  {
    console.error(err);
  }
  finally
  {
    isLoading.value = false;
  }

  return tempComparativeTracks;
};
</script>

<style lang="scss" scoped>
rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
}

.label.small
{
  font: normal 8px sans-serif;
}

.label.medium
{
  font: normal 11px sans-serif;
}

.label.bold
{
  font-style: bold;
}

.vcmap-loader.p-progressbar
{
  height: 0.25em;
}
</style>
