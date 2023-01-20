<template>
  <line
    :x1="props.gaplessBlock.startLabel.posX"
    :y1="(props.gaplessBlock.isInverted ? props.gaplessBlock.startLabel.posY - 1 : props.gaplessBlock.startLabel.posY + 1)"
    :x2="props.gaplessBlock.startLabel.posX + LABEL_LINE_LENGTH"
    :y2="(props.gaplessBlock.isInverted ? props.gaplessBlock.startLabel.posY - 1 : props.gaplessBlock.startLabel.posY + 1)"
    :stroke="props.gaplessBlock.elementColor"
  >
  </line>
  <line
    :x1="props.gaplessBlock.stopLabel.posX"
    :y1="(props.gaplessBlock.isInverted ? props.gaplessBlock.stopLabel.posY + 1 : props.gaplessBlock.stopLabel.posY - 1)"
    :x2="props.gaplessBlock.stopLabel.posX + LABEL_LINE_LENGTH"
    :y2="(props.gaplessBlock.isInverted ? props.gaplessBlock.stopLabel.posY + 1 : props.gaplessBlock.stopLabel.posY - 1)"
    :stroke="props.gaplessBlock.elementColor"
  >
  </line>
  <text
    class="label small"
    :dominant-baseline="(props.gaplessBlock.isInverted ? 'auto' : 'hanging')"
    :x="props.gaplessBlock.startLabel.posX + 2"
    :y="(props.gaplessBlock.isInverted ? props.gaplessBlock.startLabel.posY - 1.5 : props.gaplessBlock.startLabel.posY + 1.5)"
  >
    {{props.gaplessBlock.startLabel.text}}
  </text>
  <text
    class="label small"
    :dominant-baseline="(props.gaplessBlock.isInverted ? 'hanging' : 'auto')"
    :x="props.gaplessBlock.stopLabel.posX + 2"
    :y="(props.gaplessBlock.isInverted ? props.gaplessBlock.stopLabel.posY + 1.5 : props.gaplessBlock.stopLabel.posY - 1.5)"
  >
    {{props.gaplessBlock.stopLabel.text}}
  </text>
</template>

<script lang="ts" setup>
import SyntenySection from "@/models/SyntenySection";

const LABEL_LINE_LENGTH = 45;

interface Props
{
  gaplessBlock: SyntenySection
}
const props = defineProps<Props>();

</script>