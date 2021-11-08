<template>
  <template v-for="(section, index) in track.sections" :key="index">
    <text v-if="showStartStop" 
      data-test="start-bp-label"
      class="label small" 
      :x="posX + width" 
      :y="getSectionYPosition(posY, index) + LABEL_Y_OFFSET">
      - {{section.startBP}}
    </text>
    <rect 
      data-test="track-section-svg"
      class="section" 
      :fill="section.color" 
      :x="posX" :y="getSectionYPosition(posY, index)" 
      :width="width" 
      :height="section.height" />
    <text v-if="showStartStop" 
      data-test="stop-bp-label"
      class="label small" 
      :x="posX + width" 
      :y="getSectionYPosition(posY, index) + section.height + LABEL_Y_OFFSET">
      - {{section.stopBP}}
    </text>
  </template>
</template>

<script lang="ts" setup>
import Track from '@/models/Track';
import { toRefs } from '@vue/reactivity';

const LABEL_Y_OFFSET = 3;

interface Props 
{
  showStartStop?: boolean;
  posX: number;
  posY: number;
  width: number;
  track: Track;
}

const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);

/**
 * Gets the starting Y position of each track section based on the height of the previous section
 * and any offsets that might need to be applied for gaps.
 */
const getSectionYPosition = (startingYPos: number, sectionIndex: number) => {
  let currentYPos = startingYPos;
  let previousSectionIndex = sectionIndex - 1;
  while (previousSectionIndex >= 0 && sectionIndex !== 0)
  {
    let previousTrackSection = props.track.sections[previousSectionIndex];
    currentYPos += previousTrackSection.height + previousTrackSection.offsetHeight;
    previousSectionIndex--;
  }

  // Add offset if one is defined
  currentYPos += props.track.sections[sectionIndex].offsetHeight;
  return currentYPos;
};
</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 10px sans-serif;
}

.section
{
  stroke-width: 1;
  stroke: lightgray;

  &.chr-1
  {
    fill: lightgreen;
  }

  &.chr-2
  {
    fill: burlywood;
  }

  &.chr-3
  {
    fill: lightblue;
  }

  &.chr-4
  {
    fill: lightsalmon;
  }
}
</style>