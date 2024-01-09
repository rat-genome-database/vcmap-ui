<template>
  <Panel>
    <template #header>
      <div class="selected-data-header">
        <div class="panel-header-item">
          <div class="title-row">
            <div><b>Selected Data</b></div>
            <div class="sort-options">
              <Button
                v-tooltip.top="{ value: (groupBySymbol) ? 'Group by Species' : 'Group Orthologs'}"
                icon="pi pi-list"
                :class="{'p-button-sm': true, 'sort-button-inactive': !groupBySymbol}"
                @click="groupSymbol"
              />
              <Button
                v-tooltip.top="`Sort by Label`"
                icon="pi pi-sort-alpha-down"
                :class="{'p-button-sm': true, 'sort-button-inactive': !sortBySymbol}"
                @click="symbolSort"
              />
              <Button 
                v-tooltip.top="`Sort by Start Position`"
                :icon="sortByPosition === 'off' ? 'pi pi-sort-alt-slash' : (sortByPosition === 'desc' ? 'pi pi-sort-numeric-down-alt' : 'pi pi-sort-numeric-down')"
                :class="{'p-button-sm': true, 'sort-button-inactive': sortByPosition === 'off'}"
                @click="positionSort"
              />
            </div>
          </div>
        </div>
        <div class="panel-header-item">
          <div v-if="numberOfResults > 0">
            {{numberOfResults}} Selected Genes
          </div>
          <div v-if="numberOfRegions > 0">
            {{numberOfRegions}} Selected Regions
          </div>
        </div>
      </div>
    </template>
    
    <div class="gene-data">
      <template v-if="!props.selectedData || props.selectedData.length === 0">
        <div class="no-data">
          <p class="placeholder-msg">No data selected</p>
          <p class="placeholder-msg-txt">Select data by clicking or hovering drawn elements, or searching by gene symbol above</p>
        </div>
      </template>
      <template v-for="dataObject in sortedSelectedData" :key="dataObject">
        <template v-if="dataObject.type === 'Gene'">
          <GeneInfo
            :gene="dataObject.genomicSection.gene ? dataObject.genomicSection.gene : dataObject.genomicSection"
            :chromosome="dataObject.genomicSection.chromosome ? dataObject.genomicSection.chromosome : dataObject.genomicSection.gene.chromosome"
            :start="dataObject.genomicSection.speciesStart ? dataObject.genomicSection.speciesStart : dataObject.genomicSection.start"
            :stop="dataObject.genomicSection.speciesStop ? dataObject.genomicSection.speciesStop : dataObject.genomicSection.stop"
            :gene-list="geneList"
          />
          <Divider />
        </template>

        <template v-else-if="(dataObject.type === 'trackSection' || dataObject.type === 'backbone' || dataObject.type === 'variantDensity')">
          <template v-if="(dataObject.type === 'trackSection')">
            <BlockInfo
              class="block-info"
              :block-section="dataObject.genomicSection"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.speciesStart"
              :stop="dataObject.genomicSection.speciesStop"
              :chain-level="dataObject.genomicSection.chainLevel"
              :track-orientation="dataObject.genomicSection.isInverted ? '-' : '+'"
              :gene-list="geneList"
            />
          </template>
          <template v-else-if="(dataObject.type === 'backbone')">
            <GeneInfo
              :gene="null"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.windowStart"
              :stop="dataObject.genomicSection.windowStop"
              track-orientation="+"
              :gene-list="geneList"
            />
          </template>
          <template v-else-if="dataObject?.type === 'variantDensity'">
            <VariantInfo
              :variantSection="(dataObject.genomicSection as VariantDensity)"
            />
          </template>
          <Divider />
        </template>
        
      </template>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import SelectedData from '@/models/SelectedData';
import Gene from '@/models/Gene';
import GeneInfo from '@/components/GeneInfo.vue';
import BlockInfo from '@/components/BlockInfo.vue';
import VariantInfo from './VariantInfo.vue';
import { ref, watch, computed } from 'vue';
import { VariantDensity } from '@/models/DatatrackSection';

/**
 * FIXME: This whole component needs to be looked over. There are references to properties on objects that don't exist.
 * The template is full of v-ifs and it can be pretty confusing to wrap your head around what's going on.
 */

interface Props
{
  selectedData: SelectedData[] | null;
  geneList: Map<number, Gene>;
}

const props = defineProps<Props>();

const numberOfResults = ref<number>(0);
const numberOfRegions = ref<number>(0);
const sortByPosition = ref('off');
const sortBySymbol = ref(false);
const groupBySymbol = ref(false);

watch(() => props.selectedData, () => {
  numberOfResults.value = 0;
  if (props.selectedData != null)
  {
    numberOfResults.value = props.selectedData.filter((d: { type: string; }) => d.type === 'Gene').length;
  }
});

// add watcher for number of results where type is variantDensity
watch(() => props.selectedData, () => {
  numberOfRegions.value = 0;
  if (props.selectedData != null)
  {
    numberOfRegions.value = props.selectedData.filter((d: { type: string; }) => d.type !== 'Gene').length;
  }
});

const symbolSort = () => {
  sortBySymbol.value = !sortBySymbol.value;
  if (sortBySymbol.value) {
    sortByPosition.value = 'off';
    groupBySymbol.value = false;
  }
};
const positionSort = () => {
  const options = ['asc', 'desc', 'off'];
  const current = options.indexOf(sortByPosition.value);
  sortByPosition.value = options[(current + 1) % options.length];
  if (sortByPosition.value !== 'off') {
    sortBySymbol.value = false;
    groupBySymbol.value = false;
  }
};
const groupSymbol = () => {
  groupBySymbol.value = !groupBySymbol.value;

  if (groupBySymbol.value) {
    sortBySymbol.value = false;
    sortByPosition.value = 'off';
  }
};

const sortedSelectedData = computed(() => {
  if (!props.selectedData || props.selectedData.length === 0) return [];

  const priority = props.selectedData[0]?.genomicSection?.speciesName;

  return [...props.selectedData].sort((a, b) => {
    if (groupBySymbol.value) {
      if (a.type === 'Gene' && b.type !== 'Gene') {
        return -1;
      }
      if (b.type === 'Gene' && a.type !== 'Gene') {
        return 1;
      }
      if (a.type === 'Gene' && b.type === 'Gene') {
        if (sortBySymbol.value) {
          return a.genomicSection.symbol.localeCompare(b.genomicSection.symbol);
        }
        return a.genomicSection.symbol.localeCompare(b.genomicSection.symbol);
      }
      if (a.genomicSection.speciesName !== b.genomicSection.speciesName) {
        return a.genomicSection.speciesName.localeCompare(b.genomicSection.speciesName);
      }
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      if (sortByPosition.value === 'asc') {
        return a.genomicSection.start - b.genomicSection.start;
      }
      if (sortByPosition.value === 'desc') {
        return b.genomicSection.start - a.genomicSection.start;
      }
    } else {
      if (a.genomicSection.speciesName === priority && b.genomicSection.speciesName !== priority) {
        return -1;
      }
      if (b.genomicSection.speciesName === priority && a.genomicSection.speciesName !== priority) {
        return 1;
      }
      if (a.genomicSection.speciesName === b.genomicSection.speciesName) {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        if (a.type === 'Gene' && sortBySymbol.value) {
          return a.genomicSection.symbol.localeCompare(b.genomicSection.symbol);
        }
        if (sortByPosition.value === 'asc') {
          return a.genomicSection.start - b.genomicSection.start;
        }
        if (sortByPosition.value === 'desc') {
          return b.genomicSection.start - a.genomicSection.start;
        }
      }
      return a.genomicSection.speciesName.localeCompare(b.genomicSection.speciesName);
    }
  });
});
</script>

<style lang="scss" scoped>
.gene-data
{
  overflow-y: auto;
  height: 550px;
}

.selected-data-header
{
  flex-direction: column;
  width: 100%;
}

.selected-data-header .title-row
{
  flex-direction: row;
  display: flex;
  justify-content: space-between;
}

.panel-header-item
{
  padding-bottom: 10px;
}

.clear-selection-btn
{
  margin-top: .5em;
  margin-left: auto;
  margin-right: auto;
}

.placeholder-msg
{
  font-size: 1.1rem;
  padding-right: 3rem;
  margin-top: 0rem;
  margin-bottom: 0;
}

.placeholder-msg-txt
{
  font-size: .9rem;
  font-style: italic;
  margin-top: .5em;
}

.sort-button-inactive {
  opacity: 0.6
}

.sort-options {
  gap: 5px;
  display: flex;
}
</style>
