<template>
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
    <TrackSVG v-if="track" is-selectable show-start-stop :pos-x="ViewSize.backboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="track as Track" />

    <!-- Comparative species synteny tracks -->
    <template v-for="(track, index) in comparativeTracks" :key="track">
      <text class="label small" :x="getTrackXOffset(index + 1) + ViewSize.backboneXPosition" :y="ViewSize.trackLabelYPosition">{{track.name}}</text>
      <TrackSVG v-if="track" is-highlightable :pos-x="getTrackXOffset(index + 1) + ViewSize.backboneXPosition" :pos-y="ViewSize.trackYPosition" :width="ViewSize.trackWidth" :track="track as Track" />
    </template>

    <!-- Comparative panel SVGs ----------------------------------------->
    <text class="label medium bold" x="320" :y="ViewSize.panelTitleYPosition">Comparative</text>
  </svg>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import SyntenyApi from '@/api/SyntenyApi';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';
import Chromosome from '@/models/Chromosome';
import Map from '@/models/Map';
import { ResolutionController } from '@/utils/ResolutionController';
import SyntenyBlock from '@/models/SyntenyBlock';
import SpeciesApi from '@/api/SpeciesApi';
import ViewSize from '@/utils/ViewSize';

const store = useStore();

// Reactive data props
let backboneSpecies = ref<Species | null>(null);
let backboneChromosome = ref<Chromosome | null>(null);
let track = ref<Track | null>(null);
let comparativeTracks = ref<Track[] | null>(null);

/**
 * Once mounted, let's set our reactive data props and create the backbone and synteny tracks
 */
onMounted(() => {
  backboneSpecies.value = store.getters.getSpecies;
  backboneChromosome.value = store.getters.getChromosome;

  setResolution(store.getters.getStartPosition, store.getters.getStopPosition);

  createBackboneTrack();
  createSyntenyTracks();
});

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getTrackXOffset = (trackNumber: number) => {
  return (trackNumber * -70);
};

const setResolution = (start: number, stop: number) => {
  const backboneLength = stop - start;
  const startingResolution = backboneLength / (ViewSize.viewboxHeight - 100);
  ResolutionController.setBasePairToHeightRatio(startingResolution);
};

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
const createBackboneTrack = () => {
  const startPos = store.getters.getStartPosition;
  const stopPos = store.getters.getStopPosition;
  const speciesName = backboneSpecies.value?.name;
  const backboneChromosomeString = backboneChromosome.value?.chromosome;
  if (startPos != null && stopPos != null && speciesName != null && backboneChromosomeString != null)
  {
    const trackSection = new TrackSection(startPos, stopPos, backboneChromosomeString, stopPos);
    track.value = new Track(speciesName, [trackSection]);
  }
  else
  {
    console.error('Cannot find the start position, stop position, backbone chromosome, and/or backbone species name in the user\'s local storage');
  }
};

const createSyntenyTracks = async () => {
  const backboneChr = store.getters.getChromosome as Chromosome;
  const backboneStart = store.getters.getStartPosition as number;
  const backboneStop = store.getters.getStopPosition as number;
  const comparativeSpecies: Species[] = [store.getters.getComparativeSpeciesOne, store.getters.getComparativeSpeciesTwo];

  try
  {
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

    if ( backboneStart == null || backboneStop == null || backboneChr == null || comparativeSpeciesMaps.length === 0)
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

    comparativeTracks.value = tracks;
  }
  catch (err)
  {
    console.error(err);
  }
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
</style>
