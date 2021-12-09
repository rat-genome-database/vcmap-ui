<template>
  <Button icon="pi pi-minus" class="p-button-info p-button-sm zoom-btn" @click="decreaseZoom"/>
    <span class="zoom-level">{{zoomLevel}}x</span>
  <Button icon="pi pi-plus" class="p-button-info p-button-sm zoom-btn" @click="increaseZoom"/>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { computed, onMounted } from 'vue';

const store = useStore();

interface Props 
{
  type: 'backbone' | 'comparative';
}

const props = defineProps<Props>();

const setter = `set${props.type.charAt(0).toUpperCase() + props.type.slice(1)}Zoom`;
const getter = `get${props.type.charAt(0).toUpperCase() + props.type.slice(1)}Zoom`;

onMounted(() => {
  if (zoomLevel.value == null)
  {
    store.dispatch(setter, 1);
  }
});

const zoomLevel = computed(() => {
  return store.getters[getter];
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
}
.zoom-level
{
  margin-left: 1rem;
  margin-right: 1rem;
}
</style>