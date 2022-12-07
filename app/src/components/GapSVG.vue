<template>
  <line
    class="synteny-gap"
    :x1="gapSection.posX1" :x2="gapSection.posX2" 
    :y1="gapSection.posY1" :y2="gapSection.posY2" />
</template>

<script lang="ts" setup>
import SyntenySection from '@/new_models/SyntenySection';

interface Props
{
  gapSection: SyntenySection;
}
defineProps<Props>();
</script>

<style lang="scss" scoped>
.synteny-gap
{
  stroke-width: 1;
  stroke: black;
}
</style>