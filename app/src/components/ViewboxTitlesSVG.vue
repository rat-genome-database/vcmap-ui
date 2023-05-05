<template>
  <!-- Title panels -->
  <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
  <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />
  <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
  <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition - 5" :y="SVGConstants.panelTitleYPosition">Detailed</text>

  <!-- SyntenyRegionSet Title Labels -->
  <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
    <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
      <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
    </template>
  </template>
  <template v-if="overviewBackboneSet">
    <template v-for="(label, index) in overviewBackboneSet.titleLabels" :key="index">
      <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
    </template>
  </template>
  <template v-if="detailedBackboneSet">
    <template v-for="(label, index) in detailedBackboneSet.titleLabels" :key="index">
      <text :class="`label small ${label.addClass}`" :x="label.posX - 5" :y="label.posY">{{label.text}}</text>
    </template>
    <template v-for="(datatrackSet, index) in detailedBackboneSet.datatrackSets" :key="index">
      <template v-if="datatrackSet.datatracks.length > 0">
        <text
            class="label small"
            :x="(datatrackSet.datatracks[0].posX1 + datatrackSet.datatracks[0].posX2) / 2"
            :y="SVGConstants.panelTitleHeight - 20"
            :transform="rotateString(TITLE_ROTATION, (datatrackSet.datatracks[0].posX1 + datatrackSet.datatracks[0].posX2) / 2, SVGConstants.panelTitleHeight - 20)"
          >
            {{ datatrackSet.getTrackTypeDisplayName() }}
        </text>
      </template>
    </template>
  </template>
  <template v-if="detailedSyntenySets.length">
    <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
      <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
        <text :class="`label small ${label.addClass}`" :x="label.posX - 5" :y="label.posY">{{label.text}}</text>
      </template>
      <template v-for="(datatrackSet, index) in syntenySet.regions[0].datatrackSets" :key="index">
        <text
            class="label small"
            :x="getSyntenyDatatrackXPos(syntenySet.order, index)"
            :y="SVGConstants.panelTitleHeight - 20"
            :transform="rotateString(TITLE_ROTATION, getSyntenyDatatrackXPos(syntenySet.order, index), SVGConstants.panelTitleHeight - 20)"
          >
            {{ datatrackSet.getTrackTypeDisplayName() }}
        </text>
      </template>
    </template>
  </template>
</template>

<script lang="ts" setup>
import SVGConstants from '@/utils/SVGConstants';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import BackboneSet from '@/models/BackboneSet';
import { getDetailedPanelXPositionForDatatracks } from '@/utils/Shared';

const TITLE_ROTATION = -30;

interface Props {
  overviewBackboneSet?: BackboneSet;
  overviewSyntenySets: SyntenyRegionSet[];
  detailedBackboneSet?: BackboneSet;
  detailedSyntenySets: SyntenyRegionSet[];
}

defineProps<Props>();

function rotateString(degree: number, x: number, y: number): string
{
  return `rotate(${degree} ${x} ${y})`;
}

function getSyntenyDatatrackXPos(setOrder: number, datatrackSetIdx: number) {
  const posX1 = getDetailedPanelXPositionForDatatracks(setOrder, datatrackSetIdx);
  const xPos = posX1 + SVGConstants.dataTrackWidth / 2;
  return xPos;
}

</script>

<style lange="scss" scoped>
.label.small.smaller
{
  font-size: 7px;
}
rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
  z-index: 0;
}
</style>