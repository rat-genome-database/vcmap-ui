<template>
  <rect
    class="navigation-btn"
    @click="moveSpecies(mapKey, currentOrder, newOrder)"
    :x="rightArrow ? posX + 10 : posX"
    :y="posY - ORDER_BUTTON_Y_OFFSET"
    width="10"
    height="10"
  />
  <template v-if="rightArrow">
    <image
      class="nav-btn-img"
      href="../../node_modules/primeicons/raw-svg/chevron-right.svg"
      @click="moveSpecies(mapKey, currentOrder, newOrder)"
      :x="rightArrow ? posX + 10 : posX"
      :y="posY - ORDER_BUTTON_Y_OFFSET"
      width="10"
      height="10"
    />
  </template>
  <template v-else>
    <image
      class="nav-btn-img"
      href="../../node_modules/primeicons/raw-svg/chevron-left.svg"
      @click="moveSpecies(mapKey, currentOrder, newOrder)"
      :x="rightArrow ? posX + 10 : posX"
      :y="posY - ORDER_BUTTON_Y_OFFSET"
      width="10"
      height="10"
    />
  </template>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';
const store = useStore(key);
const ORDER_BUTTON_Y_OFFSET = 20;

interface Props
{
  speciesList: any;
  rightArrow: boolean;
  posX: number;
  posY: number;
  mapKey: number;
  currentOrder: number;
  newOrder: number;
}

const props = defineProps<Props>();

function moveSpecies(key: number, oldIndex: number, newIndex: number) {
  const newSpeciesOrder: any = {};
  for (let i = 0; i < props.speciesList.length; i++) {
    const currentSpecies = props.speciesList[i];
    if (i === oldIndex) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = newIndex;
    } else if (i === newIndex) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = oldIndex;
    } else {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = i;
    }
  }
  store.dispatch('setSpeciesOrder', newSpeciesOrder);
}

</script>

<style lang="scss" scoped>
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