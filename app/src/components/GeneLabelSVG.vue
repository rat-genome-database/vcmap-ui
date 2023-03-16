<template>
  <text
    @click="onGeneLabelClick($event, label)"
    @mouseenter="onMouseEnter(label)"
    @mouseleave="onMouseLeave(label)"
    :class="(isLabelSelected(label) ? 'bold-label' : 'label small')"
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
import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { getNewSelectedData, sortGeneList } from '@/utils/DataPanelHelpers';

const store = useStore(key);

interface Props
{
  label: GeneLabel;
  geneList: Map<number, Gene>;
}
defineProps<Props>();

const getLabelText = (label: GeneLabel) => {
  const numCombinedGenes = label.combinedLabels.length;
  const selectedGeneIds = store.state.selectedGeneIds;
  const combinedLabelGeneIds = label.combinedLabels.map((label) => label.gene.rgdId);
  let labelText = label.text;
  if (!selectedGeneIds.includes(label.gene.rgdId) && selectedGeneIds.some((id) => combinedLabelGeneIds.includes(id)))
  {
    const altLabelOptions = label.combinedLabels.filter((label) => selectedGeneIds.includes(label.gene.rgdId));
    for (let i = 0; i < altLabelOptions.length; i++) {
      labelText = altLabelOptions[i].text;
      if (!labelText.startsWith('LOC'))
      {
        break;
      }
    }
  }
  else
  {
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
  }
  return labelText;
};

const onGeneLabelClick = (event: any, label: GeneLabel) => {
  if (store.state.selectedGeneIds.includes(label.gene.rgdId))
  {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
  }
  const geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  const combinedGenes = label.combinedLabels.map((label) => label.gene);
  const geneList = [label.gene, ...combinedGenes];
  let newSelectedData: SelectedData[] = [];
  sortGeneList(geneList);
  geneList.forEach((gene: Gene) => {
    // FIXME (orthologs): TEMP
    newSelectedData.push(new SelectedData(gene.clone(), 'Gene'));
    geneIds.push(gene.rgdId);
    // endTEMP
  });

  store.dispatch('setSelectedGeneIds', geneIds || []);
  if (event.shiftKey)
  {
    const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
    store.dispatch('setSelectedData', selectedDataArray);
  } else {
    store.dispatch('setSelectedData', newSelectedData);
  }
};

const onMouseEnter = (label: GeneLabel) => {
  label.isHovered = true;

  // If there are selected genes, don't update the selected data panel
  if (store.state.selectedGeneIds.length === 0) {
    const newSelectedData = label.combinedLabels.map((label) => {
      return new SelectedData(label.gene.clone(), 'Gene');
    });
    newSelectedData.unshift(new SelectedData(label.gene.clone(), 'Gene'));
    store.dispatch('setSelectedData', newSelectedData);
  }
};

const onMouseLeave = (label: GeneLabel) => {
  label.isHovered = false;
  
  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }
};

const isLabelSelected = (label: GeneLabel) => {
  const selectedGeneIds = store.state.selectedGeneIds;
  const combinedLabelGeneIds = label.combinedLabels.map((label) => label.gene.rgdId);
  return (selectedGeneIds.includes(label.gene.rgdId) || selectedGeneIds.some((id) => combinedLabelGeneIds.includes(id)) || label.isHovered);
};
</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;

  &:hover
  {
    cursor: pointer;
  }
}

.bold-label
{
  font: 8px sans-serif;
  font-weight: bold;

  &:hover
  {
    cursor: pointer;
  }
}
</style>