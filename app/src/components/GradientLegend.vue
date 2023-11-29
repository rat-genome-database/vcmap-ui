<template>
  <div>
    <div class="legend-label">{{ speciesName }} ({{ mapName }})</div>
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
  mapName: string;
}


defineProps<Props>();

</script>

<style scoped>
.color-legend
{
  width: 100px;
  height: 20px;
  background: 
    linear-gradient(
      to right in oklch decreasing hue, 
      oklch(68% 0.19 250) 6% 6%, oklch(68% 0.19 15) 93% 93%
    )
  ;
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
  padding-top: 5px;
  padding-bottom: 5px;
}
</style>
