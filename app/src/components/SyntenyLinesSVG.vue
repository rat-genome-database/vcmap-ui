<template>
  <line v-if="syntenySection.isHovered"
    class="synteny-line"
    :x1="syntenySection.posX1 + syntenySection.width" :x2="SVGConstants.backboneXPosition" 
    :y1="syntenySection.posY1" :y2="(syntenySection.isInverted) ? syntenySection.posY2 : syntenySection.posY1" />
  <line v-if="syntenySection.isHovered"
    class="synteny-line"
    :x1="syntenySection.posX1 + syntenySection.width" :x2="SVGConstants.backboneXPosition" 
    :y1="syntenySection.posY2" :y2="(syntenySection.isInverted) ? syntenySection.posY1 : syntenySection.posY2" />
</template>

<script lang="ts" setup>
import SyntenySection from '@/new_models/SyntenySection';
import SVGConstants from '@/utils/SVGConstants';

interface Props
{
  syntenySection: SyntenySection;
}
defineProps<Props>();
</script>

<style lang="scss" scoped>
.synteny-line
{
  stroke-width: 1;
  stroke: black;
  stroke-dasharray: 4;
}
</style>