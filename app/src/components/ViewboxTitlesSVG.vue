<template>
  <!-- Title panels -->
  <rect class="panel" x="0" :width="store.state.svgPositions.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
  <rect class="panel" :x="store.state.svgPositions.overviewPanelWidth" :width="SVGConstants.viewboxWidth - store.state.svgPositions.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
  <text v-if="showOverviewPanel" class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
  <text class="label medium bold" :x="store.state.svgPositions.overviewPanelWidth + SVGConstants.detailedRightPadding + 30" :y="SVGConstants.panelTitleYPosition">Detailed</text>

  <!-- SyntenyRegionSet Title Labels -->
  <template v-if="showOverviewPanel">
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
        <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
  </template>
  <template v-if="overviewBackboneSet && showOverviewPanel">
    <template v-for="(label, index) in overviewBackboneSet.titleLabels" :key="index">
      <text :class="`label small ${label.addClass}`" :x="label.posX" :y="label.posY">{{label.text}}</text>
    </template>
  </template>
  <template v-if="detailedBackboneSet">
    <template v-for="(label, index) in detailedBackboneSet.titleLabels" :key="index">
      <text :class="`label small ${label.addClass}`" :x="label.posX - 5" :y="label.posY">{{label.text}}</text>
    </template>
    <template v-if="detailedBackboneSet.order !== 0">
      <SpeciesOrderButtonSVG
        :species-list="speciesList"
        :right-arrow="false"
        :pos-x="detailedBackboneSet.titleLabels[0].posX"
        :pos-y="detailedBackboneSet.titleLabels[0].posY"
        :map-key="detailedBackboneSet.mapKey"
        :current-order="detailedBackboneSet.order"
        :new-order="detailedBackboneSet.order - 1"
      />
    </template>
    <template v-if="detailedBackboneSet.order !== speciesList.length - 1">
      <SpeciesOrderButtonSVG
        :species-list="speciesList"
        :right-arrow="true"
        :pos-x="detailedBackboneSet.titleLabels[0].posX"
        :pos-y="detailedBackboneSet.titleLabels[0].posY"
        :map-key="detailedBackboneSet.mapKey"
        :current-order="detailedBackboneSet.order"
        :new-order="detailedBackboneSet.order + 1"
      />
    </template>
    <template v-for="(datatrackSet, index) in detailedBackboneSet?.datatrackSets" :key="index">
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
      <template v-if="syntenySet.order !== 0">
        <SpeciesOrderButtonSVG
          :species-list="speciesList"
          :right-arrow="false"
          :pos-x="syntenySet.titleLabels[0].posX"
          :pos-y="syntenySet.titleLabels[0].posY"
          :map-key="syntenySet.mapKey"
          :current-order="syntenySet.order"
          :new-order="syntenySet.order - 1"
        />
      </template>
      <template v-if="syntenySet.order !== speciesList.length - 1">
        <SpeciesOrderButtonSVG
          :species-list="speciesList"
          :right-arrow="true"
          :pos-x="syntenySet.titleLabels[0].posX"
          :pos-y="syntenySet.titleLabels[0].posY"
          :map-key="syntenySet.mapKey"
          :current-order="syntenySet.order"
          :new-order="syntenySet.order + 1"
        />
      </template>
      <template v-for="(datatrackSet, index) in syntenySet.regions[0]?.datatrackSets" :key="index">
        <text
            class="label small"
            :x="getSyntenyDatatrackXPos(syntenySet.order, index, store.state.svgPositions.overviewPanelWidth)"
            :y="SVGConstants.panelTitleHeight - 20"
            :transform="rotateString(TITLE_ROTATION, getSyntenyDatatrackXPos(syntenySet.order, index, store.state.svgPositions.overviewPanelWidth), SVGConstants.panelTitleHeight - 20)"
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
import SpeciesOrderButtonSVG from './SpeciesOrderButtonSVG.vue';
import { getDetailedPanelXPositionForDatatracks } from '@/utils/Shared';

const TITLE_ROTATION = -30;const store = useStore(key);
const speciesList = computed(() => {
  const list: any[] = [];
  const speciesOrder = store.state.speciesOrder;
  const backboneSpecies = store.state.species;
  // NOTE: we're only going to count visible species for this list
  const comparativeSpecies = store.state.comparativeSpecies.filter(s => s.visible);
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
          });
        }
        list.push({mapKey: key, speciesName: speciesName});
      }
    });
  }

  return list;
});

interface Props {
  overviewBackboneSet?: BackboneSet;
  overviewSyntenySets: SyntenyRegionSet[];
  detailedBackboneSet?: BackboneSet;
  detailedSyntenySets: SyntenyRegionSet[];
  showOverviewPanel: boolean;
}

defineProps<Props>();

function rotateString(degree: number, x: number, y: number): string
{
  return `rotate(${degree} ${x} ${y})`;
}

function getSyntenyDatatrackXPos(setOrder: number, datatrackSetIdx: number, overviewWidth: number) {
  const posX1 = getDetailedPanelXPositionForDatatracks(setOrder, datatrackSetIdx, overviewWidth);
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