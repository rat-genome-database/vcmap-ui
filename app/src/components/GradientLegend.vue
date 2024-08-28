<template>
  <div>
    <div class="legend-label">{{ speciesName }} ({{ mapName }})</div>
    <div class="legend-container">
      <div>
        {{ parseFloat(minValue.toPrecision(3)).toLocaleString() }}
      </div>
      <div class="color-legend">
        <img src="../../public/color-legend.png">
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
  margin-right: 1rem;
  margin-block-end: 1rem;
  /* do not remove. currently there is a hack in place of using an image to maintain a consitent legend across browsers. However, the image is of this grid below as 
  /* shown in Chrome. If the track colors are updated, this linear-gradient should be upgraded and used to create the new image 
 /* background: 
    linear-gradient(
      to right in oklch decreasing hue, 
      oklch(100% 0 9) 6% 6%, 
      oklch(0% 0.5 15) 93% 93%
    ); */
}

.legend-container
{
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 10px;
}

.legend-label
{
  font-weight: bold;
  padding-top: 5px;
  padding-bottom: 5px;
}
</style>
