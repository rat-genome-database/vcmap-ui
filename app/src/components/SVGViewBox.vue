<template>
  <svg :viewBox="'0 0 1000 ' + viewBoxHeight" xmlns="http://www.w3.org/2000/svg">
    <!-- Outside panel -->
    <rect class="panel" x="0" width="1000" :height="viewBoxHeight" />
    <!-- Inner panels -->
    <rect class="panel" x="0" width="375" :height="viewBoxHeight" />
    <rect class="panel" x="375" width="625" :height="viewBoxHeight" />
    <!-- Title panels -->
    <rect class="panel" x="0" width="375" height="50" />
    <rect class="panel" x="375" width="625" height="50" />

    <!-- Backbone panel SVGs ------------------------------------------->
    <!-- backbone species track -->
    <text class="label medium bold" x="240" y="25">Backbone</text>
    <text v-if="backboneSpecies" class="label small" :x="BACKBONE_X_POS" y="40">{{backboneSpecies.name}}</text>
    <TrackSVG v-if="track" :show-start-stop="true" :pos-x="BACKBONE_X_POS" :pos-y=100 :width=30 :track="track as Track" />

    <!-- Comparative species synteny tracks -->
    <template v-for="(track, index) in comparativeTracks" :key="track">
      <text class="label small" :x="getTrackXOffset(index + 1) + BACKBONE_X_POS" y="40">{{track.name}}</text>
      <TrackSVG v-if="track" :pos-x="getTrackXOffset(index + 1) + BACKBONE_X_POS" :pos-y=100 :width=30 :track="track as Track" />
    </template>
    <!------------------------------------------------------------------->

    <!-- Comparative panel SVGs ----------------------------------------->
    <text class="label medium bold" x="400" y="25">Comparative</text>
    <!------------------------------------------------------------------->
  </svg>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';

const BACKBONE_X_POS = 240;

const store = useStore();

let viewBoxHeight = ref<number>(1000);
let backboneSpecies = ref<Species | null>(null);
let track = ref<Track | null>(null);
let comparativeTracks = ref<Track[] | null>(null);

onMounted(() => {
  backboneSpecies.value = store.getters.getSpecies;

  // Create backbone track
  const startPos = store.getters.getStartPosition;
  const stopPos = store.getters.getStopPosition;
  const speciesName = backboneSpecies.value?.name;
  if (startPos != null && stopPos != null && speciesName != null)
  {
    const trackSection = new TrackSection(startPos, stopPos, 'lightgreen');
    track.value = new Track(speciesName, [trackSection]);
    viewBoxHeight.value = track.value.height + 200; // Add a little breathing room after the height of the backbone track
  }
  else
  {
    console.error('Cannot find the start position, stop position, and/or name for the backbone species in the user\'s local store');
  }

  // Set up comparative species tracks (hard-coded for now)
  // Eventually, we will grab the selected comparative species from the store and make API calls to 
  // find the syntenic regions between them and the backbone species
  const ratTrackSection1 = new TrackSection(50000, 60000000, 'lightblue');
  const ratTrackSection2 = new TrackSection(120000000, 165000000, 'lightsalmon', 20000000);
  const ratTrack = new Track('Rat', [ratTrackSection1, ratTrackSection2]);

  const horseTrackSection1 = new TrackSection(50000, 2000000, 'burlywood', 5000000);
  const horseTrackSection2 = new TrackSection(10000000, 100000000, 'lightblue', 3000000);
  const horseTrackSection3 = new TrackSection(35000000, 70000000, 'lightsalmon', 8000000);
  const horseTrack = new Track('Horse', [horseTrackSection1, horseTrackSection2, horseTrackSection3]);

  comparativeTracks.value = [ratTrack, horseTrack];
});

/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getTrackXOffset = (trackNumber: number) => {
  return (trackNumber * -90);
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
  font: normal 10px sans-serif;
}

.label.medium
{
  font: normal 13px sans-serif;
}

.label.bold
{
  font-style: bold;
}
</style>
