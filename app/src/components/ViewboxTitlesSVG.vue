<template>
  <!-- Title panels -->
  <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
  <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />
  <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
  <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition + 30" :y="SVGConstants.panelTitleYPosition">Detailed</text>

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
    <rect
      class="navigation-btn"
      @click="moveSpecies(detailedBackboneSet.mapKey, detailedBackboneSet.order, detailedBackboneSet.order - 1)"
      :x="detailedBackboneSet.titleLabels[0].posX"
      :y="detailedBackboneSet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
      width="10"
      height="10"
    />
    <image
      class="nav-btn-img"
      href="../../node_modules/primeicons/raw-svg/chevron-left.svg"
      @click="moveSpecies(detailedBackboneSet.mapKey, detailedBackboneSet.order, detailedBackboneSet.order - 1)"
      :x="detailedBackboneSet.titleLabels[0].posX"
      :y="detailedBackboneSet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
      width="10"
      height="10"
    />
    <rect
      class="navigation-btn"
      @click="moveSpecies(detailedBackboneSet.mapKey, detailedBackboneSet.order, detailedBackboneSet.order + 1)"
      :x="detailedBackboneSet.titleLabels[0].posX + 10"
      :y="detailedBackboneSet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
      width="10"
      height="10"
    />
    <image
      class="nav-btn-img"
      href="../../node_modules/primeicons/raw-svg/chevron-right.svg"
      @click="moveSpecies(detailedBackboneSet.mapKey, detailedBackboneSet.order, detailedBackboneSet.order + 1)"
      :x="detailedBackboneSet.titleLabels[0].posX + 10"
      :y="detailedBackboneSet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
      width="10"
      height="10"
    />
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
      <rect
        class="navigation-btn"
        @click="moveSpecies(syntenySet.mapKey, syntenySet.order, syntenySet.order - 1)"
        :x="syntenySet.titleLabels[0].posX"
        :y="syntenySet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
        width="10"
        height="10"
      />
      <image
        class="nav-btn-img"
        href="../../node_modules/primeicons/raw-svg/chevron-left.svg"
        @click="moveSpecies(syntenySet.mapKey, syntenySet.order, syntenySet.order - 1)"
        :x="syntenySet.titleLabels[0].posX"
        :y="syntenySet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
        width="10"
        height="10"
      />
      <rect
        class="navigation-btn"
        @click="moveSpecies(syntenySet.mapKey, syntenySet.order, syntenySet.order + 1)"
        :x="syntenySet.titleLabels[0].posX + 10"
        :y="syntenySet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
        width="10"
        height="10"
      />
      <image
        class="nav-btn-img"
        href="../../node_modules/primeicons/raw-svg/chevron-right.svg"
        @click="moveSpecies(syntenySet.mapKey, syntenySet.order, syntenySet.order + 1)"
        :x="syntenySet.titleLabels[0].posX + 10"
        :y="syntenySet.titleLabels[0].posY - ORDER_BUTTON_Y_OFFSET"
        width="10"
        height="10"
      />
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
import { computed } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import SVGConstants from '@/utils/SVGConstants';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import BackboneSet from '@/models/BackboneSet';
import { getDetailedPanelXPositionForDatatracks } from '@/utils/Shared';

const TITLE_ROTATION = -30;
const ORDER_BUTTON_Y_OFFSET = 20;

const store = useStore(key);
const speciesList = computed(() => {
  const list: any[] = [];
  const speciesOrder = store.state.speciesOrder;
  const backboneSpecies = store.state.species;
  const comparativeSpecies = store.state.comparativeSpecies;
  const numSpecies = comparativeSpecies.length + 1;
  for (let i = 0; i < numSpecies; i++) {
    Object.keys(speciesOrder).forEach((key) => {
      const value = speciesOrder[key];
      if (value === i) {
        let speciesName = '';
        if (backboneSpecies?.activeMap.key.toString() === key) {
          speciesName = `${backboneSpecies.name} (${backboneSpecies.activeMap.name})`;
        } else {
          comparativeSpecies.forEach((species) => {
            if (species.activeMap.key.toString() === key) {
              speciesName = `${species.name} (${species.activeMap.name})`;
            }
          })
        }
        list.push({mapKey: key, speciesName: speciesName});
      }
    })
  }

  return list;
});

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

function moveSpecies(key: number, oldIndex: number, newIndex: number) {
  const newSpeciesOrder: any = {};
  for (let i = 0; i < speciesList.value.length; i++) {
    const currentSpecies = speciesList.value[i];
    if (i === oldIndex) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = newIndex;
    } else if (i === newIndex) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] =  oldIndex;
    } else {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = i;
    }
  }
  console.log('in moveSpecies');
  console.log(oldIndex);
  console.log(newIndex);
  store.dispatch('setSpeciesOrder', newSpeciesOrder);
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
rect.navigation-btn
{
  fill: lightgray;
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

.nav-btn-img
{
  cursor: pointer;
  pointer-events: none;
}
</style>