<template>
  <line
    :x1="props.gaplessBlock.startLabel.posX"
    :y1="props.gaplessBlock.startLabel.posY + 1"
    :x2="getLineEnd(props.gaplessBlock.startLabel)"
    :y2="props.gaplessBlock.startLabel.posY + 1"
    :stroke="props.gaplessBlock.elementColor"
  >
  </line>
  <line
    :x1="props.gaplessBlock.stopLabel.posX"
    :y1="props.gaplessBlock.stopLabel.posY - 1"
    :x2="getLineEnd(props.gaplessBlock.stopLabel)"
    :y2="props.gaplessBlock.stopLabel.posY - 1"
    :stroke="props.gaplessBlock.elementColor"
  >
  </line>
  <text
    class="label small"
    dominant-baseline="hanging"
    :text-anchor="props.gaplessBlock.startLabel.labelOnLeft ? 'end' : 'start'"
    :x="getLabelXPos(props.gaplessBlock.startLabel)"
    :y="props.gaplessBlock.startLabel.posY + 1.5"
  >
    {{props.gaplessBlock.startLabel.text}}
  </text>
  <text
    class="label small"
    dominant-baseline="auto"
    :text-anchor="props.gaplessBlock.stopLabel.labelOnLeft ? 'end' : 'start'"
    :x="getLabelXPos(props.gaplessBlock.stopLabel)"
    :y="props.gaplessBlock.stopLabel.posY - 1.5"
  >
    {{props.gaplessBlock.stopLabel.text}}
  </text>
</template>

<script lang="ts" setup>
import Label from "@/models/Label";
import SyntenySection from "@/models/SyntenySection";

const LABEL_LINE_LENGTH = 45;

interface Props
{
  gaplessBlock: SyntenySection
}
const props = defineProps<Props>();

function getLineEnd(label: Label): number {
  if (label.labelOnLeft) {
    return label.posX - LABEL_LINE_LENGTH;
  } else {
    return label.posX + LABEL_LINE_LENGTH;
  }
}

function getLabelXPos(label: Label): number {
  if (label.labelOnLeft) {
    return label.posX - 2;
  } else {
    return label.posX + 2;
  }
}

</script>