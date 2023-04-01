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
  const numCombinedGenes = label.genes.length;
  const selectedGeneIds = store.state.selectedGeneIds;
  let labelText = label.text;

  //
  // If selected gene Ids are found within this GeneLabel but it isn't the gene in the label text, switch the label
  // text to the name of the selected gene as long as it isn't an LOC gene. I believe the main reason for this logic
  // is if a user selects a gene and it has an orthologc
  if (!selectedGeneIds.includes(label.mainGene.rgdId) && selectedGeneIds.some((id) => label.rgdIds.includes(id)))
  {
    const altGenesForLabel = label.genes.filter((gene) => selectedGeneIds.includes(gene.rgdId));
    for (let i = 0; i < altGenesForLabel.length; i++) {
      // TODO: Feels a bit like a code smell to be changing the label text here from what the model says it should be. 
      // Not sure if we really need to address it though. Could be confusing to debug.
      labelText = formatTextForMultiGeneLabel(altGenesForLabel[i].symbol, numCombinedGenes);
      if (!labelText.startsWith('LOC'))
      {
        break;
      }
    }
  }
  else
  {
    // FIXME: Address these magic numbers, use a BBox measurement (https://stackoverflow.com/questions/3311126/svg-font-metrics)?
    if (numCombinedGenes > 1)
    {
      labelText = formatTextForMultiGeneLabel(label.text, numCombinedGenes);
    }
    else
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
  if (store.state.selectedGeneIds.includes(label.mainGene.rgdId))
  {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
  }
  const geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  // Keep the main gene of the label at the top of the list
  const mainGene = label.mainGene;
  const geneList = label.genes.filter(g => g.rgdId !== label.mainGene.rgdId);
  let newSelectedData: SelectedData[] = [];
  sortGeneList(geneList);
  [mainGene, ...geneList].forEach((gene: Gene) => {
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
    const newSelectedData = label.genes.map((gene) => {
      return new SelectedData(gene.clone(), 'Gene');
    });
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
  const combinedLabelGeneIds = label.rgdIds;
  return (selectedGeneIds.some((id) => combinedLabelGeneIds.includes(id)) || label.isHovered);
};

const formatTextForMultiGeneLabel = (symbol: string, numGenes: number) => {
  const geneSymbolText = numGenes > 9 ? symbol.substring(0, 7) : symbol.substring(0, 8);
  return `${geneSymbolText}...(${numGenes})`;
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