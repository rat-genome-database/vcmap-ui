<template>
  <text
    class="label small"
    @click="onGeneLabelClick($event, label)"
    :x="(label.posX + 5)"
    :y="(label.posY)"
    dominant-baseline="middle"
    text-anchor="start"
  >
    {{getLabelText(label)}}
  </text>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { key } from '@/store';
import { GeneLabel } from '@/models/Label';
import { Gene } from '@/models/Gene';
import { sortGeneList } from '@/utils/DataPanelHelpers';

const store = useStore(key);

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

const onGeneLabelClick = (event: any, label: GeneLabel) => {
  if (store.state.selectedGeneIds.includes(label.gene.rgdId))
  {
    store.dispatch('setSelectedGenedIs', []);
    store.dispatch('setSelectedData', null);
  }
  const geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  const combinedGenes = label.combinedLabels.map((label) => label.gene);
  const geneList = [label.gene, ...combinedGenes];
  // sortGeneList(geneList);
  geneList.forEach((gene: Gene) => {
    geneIds.push(gene.rgdId);
  });

  store.dispatch('setSelectedGeneIds', geneIds || []);

}
</script>