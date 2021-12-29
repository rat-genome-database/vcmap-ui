<template>
  <Button 
    data-test="decrease-zoom-btn"
    v-tooltip.left="'Zoom Out'" 
    icon="pi pi-minus" 
    class="p-button-info p-button-sm zoom-btn" 
    :disabled="isZoomOutDisabled"
    @click="decreaseZoom"/>
    <span class="zoom-level">{{zoomLevel}}x</span>
  <Button 
    data-test="increase-zoom-btn"
    v-tooltip.right="'Zoom In'" 
    icon="pi pi-plus" 
    class="p-button-info p-button-sm zoom-btn" 
    @click="increaseZoom"/>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { computed } from 'vue';

const store = useStore();

interface Props 
{
  type: 'overview' | 'details';
  min?: number;
}

const props = defineProps<Props>();

const setter = `set${props.type.charAt(0).toUpperCase() + props.type.slice(1)}Zoom`;
const getter = `get${props.type.charAt(0).toUpperCase() + props.type.slice(1)}Zoom`;

const zoomLevel = computed(() => {
  return store.getters[getter];
});

const isZoomOutDisabled = computed(() => {
  if (props.min != null && props.min > 0 && (zoomLevel.value / 2) < props.min)
  {
    return 'disabled';
  }

  return undefined;
});

const decreaseZoom = () => {
  let newZoomLevel = 1;
  if (zoomLevel.value <= 1)
  {
    newZoomLevel = zoomLevel.value / 2;
  }
  else
  {
    newZoomLevel = zoomLevel.value - 1;
  }

  if (props.min != null && newZoomLevel < props.min)
  {
    return;
  }

  store.dispatch(setter, newZoomLevel);
};

const increaseZoom = () => {
  let newZoomLevel = 1;
  if (zoomLevel.value <= 1)
  {
    newZoomLevel = zoomLevel.value * 2;
  }
  else
  {
    newZoomLevel = zoomLevel.value + 1;
  }

  store.dispatch(setter, newZoomLevel);
};
</script>

<style lang="scss" scoped>
.p-button.p-button-sm.zoom-btn
{
  padding: 0.1rem;
  width: 1.5rem;
}
.zoom-level
{
  margin: 0 0.5rem;
}
</style>