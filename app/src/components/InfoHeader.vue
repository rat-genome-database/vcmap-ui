<template>
  <div class="grid unpadded col-4">
    <div class="col-8">
      <div><h4 class="visibility-text">Visibility</h4></div>
      <div class="flex-down">
        <div class="label-row">
          <div class="setting-label" />
          <div class="checkbox-row">
            <div class="species-name-label bold-text">{{ store.state.species?.name }}</div>
            <div v-for="(species, index) in store.state.comparativeSpecies" :key="index">
              <div class="species-name-label">{{ species.name }}</div>
            </div>
          </div>
        </div> 

        <div class="setting-row">
          <div class="setting-label bold-text">Species:</div>
          <div class="checkbox-row">
            <div>
              <Checkbox :modelValue="store.state.species.visible" disabled binary />
            </div>
            <div v-for="(species, index) in store.state.comparativeSpecies" :key="index">
              <Checkbox :modelValue="species.visible" @update:modelValue="() => toggleSpeciesVisibility(index)" binary />
            </div>
          </div>
        </div>

        <div v-if="displayDensityTrackTogglePanel" class="setting-row">
          <div class="setting-label bold-text">Variants:</div>
          <div class="checkbox-row">
            <div>
              <Checkbox :modelValue="getBackboneDensityTrackVisibility()" @update:modelValue="() => toggleBackboneDensityTrack()" :disabled="disableBackboneVariantCheckbox()" binary />
            </div>
            <div v-for="(species, index) in store.state.comparativeSpecies" :key="index">
              <Checkbox :modelValue="getDensityTrackVisibility(species.activeMap.key)" @update:modelValue="() => toggleSyntenicDensityTrack(species.activeMap.key)" :disabled="disableVariantCheckbox(species)" binary />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-4">
      <div class="flex-down height-100">
        <div class="toggle-container">
          <div class="checkbox-row">
            <Checkbox v-model="store.state.showOverviewPanel" @update:modelValue="toggleOverview()" binary />
            <span class="toggle-label bold-text">Overview Panel</span>
          </div>
        </div>
        <div class="toggle-container">
          <div class="checkbox-row">
            <Checkbox v-model="store.state.svgPositions.mirroredOverivew" @update:modelValue="toggleMirroredOverview()" binary />
            <span class="toggle-label bold-text">Mirrored Overview</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';
import Species from '@/models/Species';
import { calculateOverviewWidth } from '@/utils/Shared';
import Checkbox from 'primevue/checkbox';
import { computed } from 'vue';
import VariantPositions from '@/models/VariantPositions';

interface Props {
  variantPositionsList: VariantPositions[];
  variantTrackStatus: any;
}

const props = defineProps<Props>();
const store = useStore(key);

function toggleSpeciesVisibility(index: number) {
  const newComparativeSpecies = [...store.state.comparativeSpecies];
  const newSpeciesOrder: any = {};
  const backboneKey = store.state.species?.activeMap.key || 0;
  newSpeciesOrder[backboneKey.toString()] = 0;
  newComparativeSpecies[index].visible = !newComparativeSpecies[index].visible;
  let currentOrder = 0;
  newComparativeSpecies.forEach((s: Species) => {
    if (s.visible) {
      currentOrder++;
      newSpeciesOrder[s.activeMap.key] = currentOrder;
    }
  });
  store.dispatch('setComparativeSpecies', newComparativeSpecies);
  store.dispatch('setSpeciesOrder', newSpeciesOrder);
}

const displayDensityTrackTogglePanel = computed(() => {
  if (props.variantPositionsList.length > 0) {
    return true;
  }
  return false;
});

const disableVariantCheckbox = (species: Species) => {
  const variantPositions = props.variantPositionsList.some((variantPositions: { mapKey: number; }) => variantPositions.mapKey === species.activeMap.key);
  const hiddenDensityTracks = store.state.hiddenDensityTracks;

  // disabled if track is not visible
  if (!species.visible) {
    return true;
  }

  // check if variant track is loaded but hidden
  return !(variantPositions || hiddenDensityTracks.includes(species.activeMap.key));
};

const disableBackboneVariantCheckbox = () => {
  const variantPositions = props.variantPositionsList.some((variantPositions: { mapKey: number; }) => variantPositions.mapKey === store.state.species.activeMap.key);
  return !variantPositions;
};

const getDensityTrackVisibility = (mapKey: number) => {
  const variantPositions = props.variantPositionsList.find((variantPositions: { mapKey: number; }) => variantPositions.mapKey === mapKey);
  const hiddenDensityTracks = store.state.hiddenDensityTracks;
  return variantPositions && !hiddenDensityTracks.includes(mapKey);
};

const getBackboneDensityTrackVisibility = () => {
  const variantPositions = props.variantPositionsList.some((variantPositions: { mapKey: number; }) => variantPositions.mapKey === store.state.species.activeMap.key);
  return variantPositions && !store.state.hideBackboneDensityTrack;
};

function toggleSyntenicDensityTrack(mapKey: number) {
  store.dispatch('setToggleSyntenicDensityTrackVisibility', mapKey);
  store.dispatch('setShouldUpdateDetailedPanel', true);
}

function toggleBackboneDensityTrack() {
  const hideDensityTrack: boolean = store.state.hideBackboneDensityTrack;
  store.dispatch('setHideBackboneDensityTrack', !hideDensityTrack);
  store.dispatch('setShouldUpdateDetailedPanel', true);
}

function toggleOverview() {
  const oldOverviewPanelWidth = store.state.svgPositions.overviewPanelWidth;
  if (oldOverviewPanelWidth === 0) {
    store.dispatch('setShowOverviewPanel', true);
    const numComparativeSpecies = store.state.comparativeSpecies.length;
    const newOverviewWidth = calculateOverviewWidth(numComparativeSpecies);
    store.dispatch('setSvgPositions', { overviewPanelWidth: newOverviewWidth });
  } else {
    store.dispatch('setShowOverviewPanel', false);
    store.dispatch('setSvgPositions', { overviewPanelWidth: 0 });
  }
}

function toggleMirroredOverview() {
  const currentMirrored = store.state.svgPositions.mirroredOverivew;
  store.dispatch('setSvgPositions', {
    ...store.state.svgPositions,
    mirroredOverview: !currentMirrored,
  });
}

</script>

<style lang="scss" scoped>
.p-button.p-button-sm.selection-btn
{
  margin-right: 0.5rem;
  padding: 0.1rem;
  width: 1.5rem;
}

.gaps-label
{
  margin-right: 1rem;
}

.selection-btn-row
{
  margin-top: 0.5rem;
}

.clickable-range:hover
{
  color: var(--primary-color);
  cursor: pointer;
}

p.label-description
{
  margin: 0 0 0.5rem 0;
  font-style: italic;
}

.load-by-position-label
{
  margin-top: 0.5em;
  font-weight: bold;
}

.config-label
{
  margin-bottom: 0;
}

.left-align-btn
{
  text-align: left;
}

.edit-bp-btn
{
  width: 10rem;
  margin-top: 0.5rem;
  height: 2rem;
}

.visibility-text
{
  margin-top: .5em;
  margin-left: .5em;
  pointer-events: none;
}

.p-inputswitch{
  transform: scale(.75);
}


.toggle-label {
  margin-left: 10px;
  //move the label down a bit to align with the toggle
  margin-top: 5px;
  font-size: 0.85em;
}

.toggle-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 5px;
}

.species-toggles {
  margin-top: 10px;
}

.toggle-item {
  display: flex;
  width: 50%; 
  border: 1px solid blue;
}

.setting-row {
  display: flex;
  margin-top: 5px;
  width: 100%;
  align-items: center;
}

.label-row {
  display: flex;
  margin-top: 5px;
  width: 100%;
  align-items: center;
  margin-bottom: 1em;
}

.checkbox-row {
  display: flex;
  justify-content: space-around;
  width: 100%;
  align-items: center;
}

.setting-label {
  margin-left: 0.5rem;
  min-width: 25%;
  font-size: 0.85em;
  pointer-events: none;
}

// tilt labels upwards 45 degrees
.species-name-label {
  transform: rotate(-45deg);
  font-size: 0.75em;
  pointer-events: none;
}

.bold-text {
  font-weight: bold;
}

.flex-down {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: flex-start;
}

.height-100 {
  height: 100%;
}
</style>
