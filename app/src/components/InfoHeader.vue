<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4 class="select-text">Selection Info</h4>
      <div class="grid unpadded">
        <div class="col-3">Backbone:</div>
        <div class="col-9 bold" data-test="backbone-overview-display">{{store.state.species?.name}} chr{{ store.state.chromosome?.chromosome }} ({{ store.state.species?.activeMap.name }})</div>
        <div class="col-12 species-toggles">Comparative Species:</div>
          <div v-for="(species, index) in store.state.comparativeSpecies" :key="index">
            <div class="toggle-container">
              <InputSwitch
                v-model="species.visible"
                title="Toggle Species Visibility"
                @click="toggleSpeciesVisibility(index)"
              />
              <span class="toggle-label">{{ species.name }} ({{ species.activeMap.name }})</span>
            </div>
        </div>
        <div class="col-12 species-toggles">Other:</div>
        <div class="toggle-container">
          <InputSwitch
            v-model="store.state.showOverviewPanel"
            title="Overview Panel"
            @click="toggleOverview()"
          />
          <span class="toggle-label">Overview Panel</span>
        </div>
        <div class="toggle-container">
          <InputSwitch
            v-model="store.state.svgPositions.mirroredOverivew"
            title="MirroredOverview"
            @click="toggleMirroredOverview()"
          />
          <span class="toggle-label">Mirrored Overview</span>
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

.select-text
{
  margin-top: .5em;

}

.p-inputswitch{
  transform: scale(.75);
}


.toggle-label {
  margin-left: 10px;
  //move the label down a bit to align with the toggle
  margin-top: 5px;
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
</style>
