<template>
  <div>
    Species
  </div>
  <svg width="100" height="20">
    <template v-for="i in NUM_ELEMENTS" :key=i>
      <rect
        :x="i+1"
        width="1"
        height="20"
        :fill="getFill(i)"
      />
    </template>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
interface Props {
  minValue: number;
  maxValue: number;
  minColor: string;
  maxColor: string;
}

const NUM_ELEMENTS = 100;

const props = defineProps<Props>();

const colorRange = computed(() => {
  return {
    minRgb: hexToRgb(props.minColor),
    maxRgb: hexToRgb(props.maxColor)
  }
});

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {
    r: 0,
    g: 0,
    b: 0
  };
}

function calculateColorChannel(index: number, channel: 'r' | 'g' | 'b') {
  const minVal = colorRange.value.minRgb[channel];
  const maxVal = colorRange.value.maxRgb[channel];
  const val = minVal + ((maxVal - minVal) / NUM_ELEMENTS) * index;
  return Math.round(val);
}

function getFill(index: number) {
  const red = calculateColorChannel(index, 'r');
  const green = calculateColorChannel(index, 'g');
  const blue = calculateColorChannel(index, 'b');
  const fillVal = `rgb(${red},${green},${blue})`;
  console.log(fillVal);
  return fillVal;
}
</script>