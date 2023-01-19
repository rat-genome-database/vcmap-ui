<template>
  <text
    class="label small"
    dominant-baseline="middle"
    :x="props.gaplessBlock.startLabel.posX"
    :y="props.gaplessBlock.startLabel.posY"
  >
    {{"-"}}
  </text>
  <text
    class="label small"
    dominant-baseline="middle"
    :x="props.gaplessBlock.stopLabel.posX"
    :y="props.gaplessBlock.stopLabel.posY"
  >
    {{"-"}}
  </text>
  <text
    class="label small"
    :dominant-baseline="(props.gaplessBlock.isInverted ? 'auto' : 'hanging')"
    :x="props.gaplessBlock.startLabel.posX + 2"
    :y="(props.gaplessBlock.isInverted ? props.gaplessBlock.startLabel.posY - 1 : props.gaplessBlock.startLabel.posY + 1)"
    :fill="(props.gaplessBlock.elementColor)"
    stroke="#555555"
    stroke-width="0.25px"
    stroke-linejoin="round"
    paint-order="stroke"
  >
    {{props.gaplessBlock.startLabel.text}}
  </text>
  <text
    class="label small"
    :dominant-baseline="(props.gaplessBlock.isInverted ? 'hanging' : 'auto')"
    :x="props.gaplessBlock.stopLabel.posX + 2"
    :y="(props.gaplessBlock.isInverted ? props.gaplessBlock.stopLabel.posY + 1 : props.gaplessBlock.stopLabel.posY - 1)"
    :fill="(props.gaplessBlock.elementColor)"
    stroke="#555555"
    stroke-width="0.25px"
    stroke-linejoin="round"
    paint-order="stroke"
  >
    {{props.gaplessBlock.stopLabel.text}}
  </text>
</template>

<script lang="ts" setup>
import SyntenySection from "@/models/SyntenySection";
import { toRefs } from "@vue/reactivity";

interface Props
{
  gaplessBlock: SyntenySection
}
const props = defineProps<Props>();

</script>