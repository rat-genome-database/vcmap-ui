<template>
  <div>
    <div class="legend-label">{{ speciesName }}</div>
    <div class="legend-container">
      <div>
        {{ parseFloat(minValue.toPrecision(3)).toLocaleString() }}
      </div>
      <div class="color-legend">
      </div>
      <div>
        {{ parseFloat(maxValue.toPrecision(3)).toLocaleString() }}
      </div>
    </div>
  </div>

</template>

<script lang="ts" setup>

interface Props {
  minValue: number;
  maxValue: number;
  binSize: number;
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

.legend-label
{
  font-weight: bold;
  padding-top: 10px;
  padding-bottom: 5px;
}
</style>
