<template>
  <text
    class="label small"
    :x="(label.posX + 5)"
    :y="(label.posY)"
    dominant-baseline="middle"
    text-anchor="start"
  >
    {{getLabelText(label)}}
  </text>
</template>

<script lang="ts" setup>
import { GeneLabel } from '@/new_models/Label';

interface Props
{
  label: GeneLabel;
}
defineProps<Props>();

const getLabelText = (label: GeneLabel) => {

  const numCombinedGenes = label.combinedLabels.length;
  const geneSymbolText = numCombinedGenes > 9 ? label.text.substring(0, 4) : label.text.substring(0, 5);
  const labelText = `${geneSymbolText}...(${numCombinedGenes})`;
  return labelText;
}
</script>