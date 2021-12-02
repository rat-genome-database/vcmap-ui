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
      <TrackSVG v-if="track" is-highlightable :pos-x="getComparativePanelTrackXOffset(index + 1) + ViewSize.selectedBackboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="track as Track" />
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
import { Resolution } from '@/utils/Resolution';
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
  backboneSpecies.value = store.getters.getSpecies;
  backboneChromosome.value = store.getters.getChromosome;

  updateBackbonePanel();

  if (store.getters.getSelectedBackboneRegion)
  {
    updateComparativePanel();
  }
});

watch(() => store.getters.getSelectedBackboneRegion, () => {
  updateComparativePanel();
});

const updateBackbonePanel = async () => {
  let backboneStart = store.getters.getStartPosition;
  let backboneStop = store.getters.getStopPosition;
  if (backboneStart != null && backboneStop != null)
  {
    Resolution.setResolution(backboneStart, backboneStop);
    backboneTrack.value = createBackboneTrack(backboneStart, backboneStop) ?? null;
    comparativeTracks.value = await createSyntenyTracks(backboneStart, backboneStop) ?? null;
  }
  else
  {
    backboneTrack.value = null;
    comparativeTracks.value = null;
  }
};

const updateComparativePanel = async () => {
  let selectedRegion = store.getters.getSelectedBackboneRegion as BackboneSelection;
  if (selectedRegion.basePairStart && selectedRegion.basePairStop)
  {
    backboneSelectionTrack.value = createBackboneTrack(selectedRegion.basePairStart, selectedRegion.basePairStop) ?? null;
    comparativeSelectionTracks.value = await createSyntenyTracks(selectedRegion.basePairStart, selectedRegion.basePairStop) ?? null;
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
  return (trackNumber * 90);
};

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
const createBackboneTrack = (startPos: number, stopPos: number) => {
  const speciesName = backboneSpecies.value?.name;
  const backboneChromosomeString = backboneChromosome.value?.chromosome;
  if (speciesName != null && backboneChromosomeString != null)
  {
    const trackSection = new TrackSection(startPos, stopPos, backboneChromosomeString, stopPos);
    return new Track(speciesName, [trackSection]);
  }
  else
  {
    console.error('Cannot find the start position, stop position, backbone chromosome, and/or backbone species name in the user\'s local storage');
  }
};

const createSyntenyTracks = async (backboneStart: number, backboneStop: number) => {
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
      syntenyCalls.push(SyntenyApi.getSyntenyBlocks(
        backboneChr,
        backboneStart,
        backboneStop,
        map,
        1
      ));
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
      const blocks = speciesSyntenyMap[speciesName];
      const trackSections: TrackSection[] = [];
      let previousBlockBackboneStop = backboneStart;
      blocks.forEach(block => {
        const trackSection = new TrackSection(block.backboneStart, block.backboneStop, block.chromosome, backboneStop, block.backboneStart - previousBlockBackboneStop);
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
