<template>
  <div>{{ speciesName }}</div>
  <div class="legend-container">
    <div>
      {{ minValue }}
    </div>
    <div class="color-legend">
    </div>
    <div>
      {{ maxValue }}
    </div>
  </div>

</template>

<script lang="ts" setup>

interface Props {
  minValue: number;
  maxValue: number;
  minColor: string;
  maxColor: string;
  speciesName: string;
}


const props = defineProps<Props>();

</script>

<style scoped>
.color-legend
{
  width: 100px;
  height: 20px;
  background: linear-gradient(90deg, v-bind(minColor), v-bind(maxColor));
}

.legend-container
{
  display: flex;
  flex-direction: row;
  gap: 10px;
}
</style>
