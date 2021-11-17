<template>
  <svg :viewBox="'0 0 1000 ' + viewBoxHeight" xmlns="http://www.w3.org/2000/svg">
    <!-- Outside panel -->
    <rect class="panel" x="0" width="1000" :height="viewBoxHeight" />
    <!-- Inner panels -->
    <rect class="panel" x="0" :width="BACKBONE_PANEL_WIDTH" :height="viewBoxHeight" />
    <rect class="panel" :x="BACKBONE_PANEL_WIDTH" :width="COMPARATIVE_PANEL_WIDTH" :height="viewBoxHeight" />
    <!-- Title panels -->
    <rect class="panel" x="0" :width="BACKBONE_PANEL_WIDTH" height="40" />
    <rect class="panel" :x="BACKBONE_PANEL_WIDTH" :width="COMPARATIVE_PANEL_WIDTH" height="40" />

    <!-- Backbone panel SVGs ------------------------------------------->
    <!-- backbone species track -->
    <text class="label medium bold" :x="BACKBONE_X_POS" :y="PANEL_TITLE_Y_POS">Backbone</text>
    <text v-if="backboneSpecies" class="label small" :x="BACKBONE_X_POS" y="30">{{backboneSpecies.name}}</text>
    <TrackSVG v-if="track" is-selectable show-start-stop :pos-x="BACKBONE_X_POS" :pos-y="TRACK_START_Y_POS" :width="TRACK_WIDTH" :track="track as Track" />

    <!-- Comparative species synteny tracks -->
    <template v-for="(track, index) in comparativeTracks" :key="track">
      <text class="label small" :x="getTrackXOffset(index + 1) + BACKBONE_X_POS" y="30">{{track.name}}</text>
      <TrackSVG v-if="track" is-highlightable :pos-x="getTrackXOffset(index + 1) + BACKBONE_X_POS" :pos-y="TRACK_START_Y_POS" :width="TRACK_WIDTH" :track="track as Track" />
    </template>
    <!------------------------------------------------------------------->

    <!-- Comparative panel SVGs ----------------------------------------->
    <text class="label medium bold" x="320" :y="PANEL_TITLE_Y_POS">Comparative</text>
    <!------------------------------------------------------------------->
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
import { ResolutionController } from '@/utils/ResolutionController';

// These can be referenced in the template but aren't reactive
const BACKBONE_PANEL_WIDTH = 300;
const COMPARATIVE_PANEL_WIDTH = 700;
const PANEL_TITLE_Y_POS = 15;
const BACKBONE_X_POS = 230;
const MINIMUM_VIEWBOX_HEIGHT = 700;
const TRACK_WIDTH = 25;
const TRACK_START_Y_POS = 60;

const store = useStore();

// Reactive data props
let viewBoxHeight = ref<number>(1000);
let backboneSpecies = ref<Species | null>(null);
let backboneChromosome = ref<Chromosome | null>(null);
let track = ref<Track | null>(null);
let comparativeTracks = ref<Track[] | null>(null);

/**
 * Once mounted, let's set our reactive data props and create the backbone and synteny tracks
 */
onMounted(async () => {
  backboneSpecies.value = store.getters.getSpecies ?? new Species({typeKey: 1, name: 'Human'});
  backboneChromosome.value = store.getters.getChromosome ?? new Chromosome({ chromosome: '1', mapKey: 38, seqLength: 0, gapLength: 0, gapCount: 0, contigCount: 0});

  // Determine starting resolution TODO
  ResolutionController.setBasePairToPixelRatio(3500);

  createBackboneTrack();
  await createSyntenyTracks();
});

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getTrackXOffset = (trackNumber: number) => {
  return (trackNumber * -70);
};

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
const createBackboneTrack = () => {
  const startPos = store.getters.getStartPosition ?? 0;
  const stopPos = store.getters.getStopPosition ?? 1000000;
  const speciesName = backboneSpecies.value?.name;
  const backboneChromosomeString = backboneChromosome.value?.chromosome;
  if (startPos != null && stopPos != null && speciesName != null && backboneChromosomeString != null)
  {
    const trackSection = new TrackSection(startPos, stopPos, backboneChromosomeString, stopPos);
    track.value = new Track(speciesName, [trackSection]);
    // Add a little breathing room after the height of the backbone track
    viewBoxHeight.value = (track.value.height + 200) > MINIMUM_VIEWBOX_HEIGHT ? (track.value.height + 200) : MINIMUM_VIEWBOX_HEIGHT;
  }
  else
  {
    console.error('Cannot find the start position, stop position, backbone chromosome, and/or backbone species name in the user\'s local storage');
  }
};

const createSyntenyTracks = async () => {
  const backboneChr = store.getters.getChromosome ?? new Chromosome({ chromosome: '1', mapKey: 38, seqLength: 0, gapLength: 0, gapCount: 0, contigCount: 0});
  const backboneStart = store.getters.getStartPosition ?? 0;
  const backboneStop = store.getters.getStopPosition ?? 1000000;

  if ( backboneStart == null || backboneStop == null || backboneChr == null)
  {
    console.error('Cannot get synteny blocks with missing backbone chromosome, backbone start, or backbone stop');
    return;
  }

  try
  {
    // Loop for each comparative species selected TODO:

    const blocks = await SyntenyApi.getSyntenyBlocks(
      backboneChr,
      backboneStart,
      backboneStop,
      // Hard-coded comparative species map + chain level
      { key: 513, name: 'Mhudiblu_PPA_v0', description: 'Bonobo Mhudiblu_PPA_v0_Assembly', notes: 'Bonobo Mhudiblu_PPA_v0 Assembly NCBI'},
      1
    );

    const trackSections: TrackSection[] = [];
    let previousBlockBackboneStop = 0;
    blocks.forEach(block => {
      const trackSection = new TrackSection(block.backboneStart, block.backboneStop, block.chromosome, backboneStop, block.backboneStart - previousBlockBackboneStop);
      trackSections.push(trackSection);
      previousBlockBackboneStop = block.backboneStop;
    });

    const track = new Track('Bonobo', trackSections);

    comparativeTracks.value = [track];
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
