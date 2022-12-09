<template>
  <text v-if="syntenySection.height > 15"
    class="chromosome-label"
    :x="syntenySection.posX1 + (syntenySection.width / 2)"
    :y="syntenySection.posY1 + (syntenySection.height / 2)"
    dominant-baseline="middle"
    text-anchor="middle">
    {{syntenySection.chromosome.chromosome}}
  </text>
</template>

<script lang="ts" setup>
import SyntenySection from '@/models/SyntenySection';

interface Props
{
  syntenySection: SyntenySection;
}
defineProps<Props>();
</script>

<style lang="scss" scoped>
.chromosome-label
{
  font: normal 12px sans-serif;
  fill: #4c4b4b;
}
</style>