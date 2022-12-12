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
import { GeneLabel } from '@/models/Label';

interface Props
{
  label: GeneLabel;
}
defineProps<Props>();

const getLabelText = (label: GeneLabel) => {
  const numCombinedGenes = label.combinedLabels.length;
  let labelText = label.text;
  if (numCombinedGenes > 0)
  {
    const geneSymbolText = numCombinedGenes > 9 ? label.text.substring(0, 4) : label.text.substring(0, 5);
    labelText = `${geneSymbolText}...(${numCombinedGenes})`;
  } else
  {
    if (labelText.length > 9)
    {
      labelText = label.text.substring(0, 10) + '...';
    }
  }
  return labelText;
}
</script>