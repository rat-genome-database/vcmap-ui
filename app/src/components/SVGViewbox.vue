<template>
  <Toast />
  <svg :viewBox="'0 0 800 ' + SVGConstants.viewboxHeight" xmlns="http://www.w3.org/2000/svg" id="svg-wrapper" width="100%">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="800" :height="SVGConstants.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" x="0" @click.left="(event) => { overviewSelectionHandler(event, getDetailedSelectionStatus(), overviewBackboneSet?.backbone); showToast('info', 'Selection Initiated:', 'Drag and click again to complete the selection or right click to cancel.', 5000)}" 
      @mousemove.stop="(event) => updateOverviewSelection(event)" @contextmenu.prevent @click.right="cancelOverviewSelection"
      :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />

    <rect id="detailed" class="panel selectable" :class="{'is-loading': arePanelsLoading}" @click.left="(event) => { detailedSelectionHandler(event, getOverviewSelectionStatus()); showToast('info', 'Selection Initiated:', 'Drag and click again to complete the selection or right click to cancel.', 5000)}"
      @mousemove="updateZoomSelection" @contextmenu.prevent @click.right="cancelDetailedSelection" 
      :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />

    
    <!-- Ortholog Lines -->
    <template v-for="(line, index) in orthologLines" :key="index">
      <OrthologLineSVG :line="line" />
    </template>
    
    <!-- Overview panel SVGs ------------------------------------------->
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(region, index) in syntenySet.regions" :key="index">
        <SectionSVG show-chromosome show-synteny-on-hover :gene-list="geneList" show-start-stop select-on-click :region="region as SyntenyRegion" />
      </template>
    </template>

    <template v-if="overviewBackboneSet">
      <BackboneSetSVG show-data-on-hover :gene-list="geneList" :backbone-set="overviewBackboneSet"/>
    </template>

    <!-- Detail panel SVGs ----------------------------------------->
    <template v-if="detailedBackboneSet">
      <BackboneSetSVG 
        show-data-on-hover
        :backbone-set="detailedBackboneSet" 
        :synteny-hover-svg-y="detailedSyntenySvgYPosition"
        @synteny-hover="onDetailedSyntenyHover" :gene-list="geneList" />
      <template v-if="detailedBackboneSet.geneLabels">
        <template v-for="(label, index) in detailedBackboneSet.geneLabels" :key="index">
          <template v-if="(label.isVisible)">
            <GeneLabelSVG :label="(label as GeneLabel)" :gene-list="geneList" :ortholog-lines="orthologLines ?? []"/>
          </template>
        </template>
      </template>
    </template>

    <template v-if="detailedSyntenySets.length">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(syntenicRegion, index) in syntenySet.regions" :key="index">
          <SectionSVG 
            show-chromosome
            :region="(syntenicRegion as SyntenyRegion)" 
            :synteny-hover-svg-y="detailedSyntenySvgYPosition" 
            :gene-list="geneList"
            @synteny-hover="onDetailedSyntenyHover" />
        </template>
        <template v-for="(label, index) in syntenySet.geneLabels" :key="index">
          <template v-if="label.isVisible">
            <GeneLabelSVG :label="label" :gene-list="geneList" :ortholog-lines="orthologLines ?? []" />
          </template>
        </template>
      </template>
    </template>

    <ViewboxTitlesSVG
      :overview-backbone-set="overviewBackboneSet" :overview-synteny-sets="(overviewSyntenySets as SyntenyRegionSet[])"
      :detailed-backbone-set="detailedBackboneSet" :detailed-synteny-sets="(detailedSyntenySets as SyntenyRegionSet[])"
    />

    <!-- Navigation buttons -->
    <rect class="navigation-btn" :class="{'disabled': isNavigationUpDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDownDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-up.svg" @click="navigateUp" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-down.svg" @click="navigateDown" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />

    <!-- Transparent panels that show up once selection starts: Allows for selection on top of the other SVGs -->
    <rect v-if="currentlySelectingRegion()" id="selecting-overview" class="selecting-panel" :class="{'is-loading': arePanelsLoading}" x="0" 
      @mousemove="updateOverviewSelection" @contextmenu.prevent @click.right="cancelOverviewSelection" @click.left="(event) => overviewSelectionHandler(event, getDetailedSelectionStatus(), overviewBackboneSet?.backbone)"
      :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />

    <rect v-if="currentlySelectingRegion()" id="selecting-detailed" class="selecting-panel" :class="{'is-loading': arePanelsLoading}"
      @mousemove="updateZoomSelection" @contextmenu.prevent @click.right="cancelDetailedSelection" @click.left="(event) => detailedSelectionHandler(event, getOverviewSelectionStatus())"
      :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />

    <!-- The "gray" selection SVG that shows what area that the user is currently selecting -->
    <!-- Detailed panel selection svg for zoom -->
    <rect v-if="startDetailedSelectionY && stopDetailedSelectionY" 
      class="visible-selecting-panel"
      @mousedown.left="(event) => detailedSelectionHandler(event, getOverviewSelectionStatus())"
      @click.right="cancelDetailedSelection"
      @mousemove="updateZoomSelection"
      @contextmenu.prevent
      fill="lightgray"
      fill-opacity="0.4"
      :x="SVGConstants.overviewPanelWidth" :y="startDetailedSelectionY"
      :width="SVGConstants.detailsPanelWidth" :height="stopDetailedSelectionY - startDetailedSelectionY" />
    <!-- Overview panel selection svg for backbone -->
    <rect v-if="startOverviewSelectionY && stopOverviewSelectionY"
      class="visible-selecting-panel"
      @mousemove="(event) => updateOverviewSelection(event)"
      @contextmenu.prevent
      @mousedown.left="(event) => overviewSelectionHandler(event, getDetailedSelectionStatus(), overviewBackboneSet?.backbone)" 
      @click.right="cancelOverviewSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="0" :y="startOverviewSelectionY"
      :width="SVGConstants.overviewPanelWidth" :height="stopOverviewSelectionY - startOverviewSelectionY" />
  </svg>

  <template v-if="displayVariantLegend">
    <div class="grid">
      <div class="col-4 plus-half legend-title"><b>Variant counts (per {{ parseFloat(variantBinSize.toPrecision(3)).toLocaleString() }}bp)</b></div>
      <template v-for="speciesIndex in detailedSyntenySets.length + 1" :key="speciesIndex">
        <template v-if="detailedBackboneSet && detailedBackboneSet.order === speciesIndex - 1">
          <div class="col-2 legend-container">
            <template v-if="detailedBackboneSet && detailedBackboneSet.maxVariantCount && detailedBackboneSet.variantBinSize && detailedBackboneSet.maxVariantCount > 0">
              <GradientLegend
                :species-name="detailedBackboneSet?.speciesName || ''" :map-name="detailedBackboneSet?.mapName"
                :min-value="0" :max-value="detailedBackboneSet?.maxVariantCount || 0"
                :bin-size="detailedBackboneSet.variantBinSize"
                min-color="#0000FF" max-color="#FF0000">
              </GradientLegend>
            </template>
          </div>
        </template>
        <template v-for="(set, index) in detailedSyntenySets" :key="index">
          <template v-if="set && set.order === speciesIndex - 1">
            <div class="col-2 legend-container">
              <template v-if="set.variantBinSize && set.maxVariantCount && set.maxVariantCount > 0">
                <GradientLegend
                  :species-name="set.speciesName" :map-name="set.mapName"
                  :min-value="0" :max-value="set.maxVariantCount"
                  :bin-size="set.variantBinSize"
                  min-color="#0000FF" max-color="#FF0000">
                </GradientLegend>
              </template>
            </div>
          </template>
        </template>
      </template>
    </div>
  </template>
  <VCMapDialog 
    v-model:show="showDialog" 
    :header="dialogHeader" 
    :message="dialogMessage"
    :theme="dialogTheme"
    :show-back-button="showDialogBackButton"
  />
  <LoadingSpinnerMask v-if="arePanelsLoading" :style="getDetailedPosition()"></LoadingSpinnerMask>
  <!--
  <Button
    style="margin-right: 20px;"
    class="p-button-info"
    label="Backbone QTLs"
    @click="loadBackboneQtls"
  />
  -->
  <!-- Uncomment to see debug info in dev mode -->
  <!--
  <div v-if="SHOW_DEBUG" class="grid p-d-flex">
    <div class="col-12">
      <h2>Debug</h2>
    </div>
    <div class="col-6">
      <h3>Blocks</h3>
      <template v-for="[mapKey, blocks] in props.syntenyTree" :key="mapKey">
        <p>MapKey {{mapKey}}:</p>
        <template v-for="(block, index) in blocks" :key="index">
          <ul>
            <b>{{ index }}</b>
            <li>Chr{{ block.chromosome.chromosome }}: ({{ block.start }}, {{ block.stop }}) [{{ block.stop - block.start }}]</li>
            <li>ChainLevel: {{ block.chainLevel }}</li>
            <li>Backbone: ({{ block.backboneStart }}, {{ block.backboneStop }})</li>
            <li>Genes: {{ block.genes.length }} <a href="javascript:void(0)" @click="toggleGenesListForBlock(enabledBlockIndicesForGeneDebugList, index)">Click to see</a></li>
            <ul v-if="enabledBlockIndicesForGeneDebugList.includes(index)">
              <li v-for="(gene, geneIndex) in block.genes" :key="geneIndex">{{  gene.symbol }} ({{ gene.start }}, {{ gene.stop }}) [{{ gene.stop - gene.start }}]</li>
            </ul>
            <li>Gaps: {{ block.gaps.length }} (Level 1: {{ block.gaps.filter(g => g.chainLevel == 1).length }} | Level 2: {{ block.gaps.filter(g => g.chainLevel === 2).length }} | Level 3+: {{ block.gaps.filter(g => g.chainLevel > 2).length }})</li>
            <li>Variant Positions: {{ block.variantPositions?.positions.length }}</li>
          </ul>
        </template>
      </template>
      <h3>Genes</h3>
      <p>{{ props.geneList.size }}</p>
    </div>
    <div class="col-6">
      <h3>SyntenyRegions (Detailed Panel)</h3>
      <template v-for="(set, index) in detailedSyntenySets" :key="index">
        <p>Set {{index}} - {{ set.speciesName }} / {{ set.mapName }}</p>
        <ul>
          <li>Total Blocks: {{ set.regions.map(r => r.syntenyBlocks).flat().length }} (after splicing in gaps)</li>
          <li>Total Gaps: {{ set.regions.map(r => r.syntenyGaps).flat().length }} (rendered as single lines per block)</li>
        </ul>
        <template v-for="(region, regionIndex) in set.regions" :key="regionIndex">
          <ul>
            <b>{{ regionIndex }}</b>
            <li>Gapless block: Chr{{ region.gaplessBlock.chromosome }}: ({{ region.gaplessBlock.speciesStart }}, {{ region.gaplessBlock.speciesStop }}) [{{ region.gaplessBlock.length }}]</li>
            <li>Blocks: {{ region.syntenyBlocks.length }}</li>
            <li>Gaps: {{ region.syntenyGaps.length }}</li>
            <li>Backbone: ({{ region.gaplessBlock.backboneAlignment.start }}, {{ region.gaplessBlock.backboneAlignment.stop }})</li>
            <li>Chain Level: {{ region.gaplessBlock.chainLevel }}</li>
            <li>Orientation: {{ region.gaplessBlock.orientation }}</li>
            <li>Variant Datatracks: {{ region.datatrackSets[1]?.datatracks.length ?? 0 }}</li>
            <li>Gene Datatracks: {{ region.datatrackSets[0]?.datatracks.length ?? 0 }} <a href="javascript:void(0)" @click="toggleGenesListForBlock(enabledRegionIndicesForGeneDebugList, regionIndex)">Click to see</a></li>
            <ul v-if="enabledRegionIndicesForGeneDebugList.includes(regionIndex)">
              <li v-for="(geneData, geneIndex) in (region.datatrackSets[0]?.datatracks as GeneDatatrack[])" :key="geneIndex">
                <ul>
                  <li>Symbol: {{ geneData.gene.symbol }}</li>
                  <li>Backbone: {{ geneData.gene.backboneStart }} - {{ geneData.gene.backboneStop }} [{{ geneData.backboneAlignmentLength }}]</li>
                  <li>Gene Start/Stop: {{ geneData.gene.start }} - {{ geneData.gene.stop }} [{{ geneData.length }}]</li>
                </ul>
              </li>
            </ul>
          </ul>
        </template>
      </template>
    </div>
  </div>
  -->

</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import SectionSVG from './SectionSVG.vue';
import SVGConstants from '@/utils/SVGConstants';
import VCMapDialog from '@/components/VCMapDialog.vue';
import GeneLabelSVG from '@/components/GeneLabelSVG.vue';
import ViewboxTitlesSVG from './ViewboxTitlesSVG.vue';
import useDialog from '@/composables/useDialog';
import Gene from '@/models/Gene';
import OrthologLine from '@/models/OrthologLine';
import useDetailedPanelZoom from '@/composables/useDetailedPanelZoom';
import { key } from '@/store';
import { createSyntenicRegionSets,  } from '@/utils/SectionBuilder';
import useOverviewPanelSelection from '@/composables/useOverviewPanelSelection';
import { useLogger } from 'vue-logger-plugin';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { createBackboneSection, backboneDatatrackBuilder, createBackboneSet } from '@/utils/BackboneBuilder';
import BackboneSetSVG from './BackboneSetSVG.vue';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import QtlApi from '@/api/QtlApi';
import BackboneSet from '@/models/BackboneSet';
import { createOverviewSyntenicRegionSets } from '@/utils/SectionBuilder';
import OrthologLineSVG from './OrthologLineSVG.vue';
import LoadingSpinnerMask from './LoadingSpinnerMask.vue';
import { createQtlDatatracks } from '@/utils/QtlBuilder';
import { backboneVariantTrackBuilder } from '@/utils/VariantBuilder';
import { GenomicSectionFactory } from '@/models/GenomicSectionFactory';
import Block from "@/models/Block";

import { GeneLabel } from '@/models/Label';
import SyntenyRegion from '@/models/SyntenyRegion';
import { createOrthologLines } from '@/utils/OrthologHandler';
import VariantPositions from '@/models/VariantPositions';
import Species from '@/models/Species';
import BackboneSection from '@/models/BackboneSection';
import GradientLegend from './GradientLegend.vue';

const SHOW_DEBUG = process.env.NODE_ENV === 'development';
const NAV_SHIFT_PERCENT = 0.2;

const store = useStore(key);
const $log = useLogger();
const router = useRouter();
const toast = useToast();

const { showDialog, dialogHeader, dialogMessage, showDialogBackButton, dialogTheme, onError } = useDialog();
const { startDetailedSelectionY, stopDetailedSelectionY, updateZoomSelection, detailedSelectionHandler, cancelDetailedSelection, getDetailedSelectionStatus} = useDetailedPanelZoom(store);
const { startOverviewSelectionY, stopOverviewSelectionY, updateOverviewSelection, overviewSelectionHandler, cancelOverviewSelection, getOverviewSelectionStatus } = useOverviewPanelSelection(store);

interface Props
{
  geneList: Map<number, Gene>;
  syntenyTree: Map<number, Block[]>;
  loading: boolean;
  variantPositionsList: VariantPositions[];
}

const props = defineProps<Props>();

let detailedSyntenySets = ref<SyntenyRegionSet[]>([]); // The currently displayed SyntenicRegions in the detailed panel
let overviewBackboneSet = ref<BackboneSet>();
let detailedBackboneSet = ref<BackboneSet>();
let overviewSyntenySets = ref<SyntenyRegionSet[]>([]);
let orthologLines = ref<OrthologLine[]>();
let detailedSyntenySvgYPosition = ref<number | null>(null);

////
// Debugging helper refs and methods (debug template is currently commented out):
const enabledBlockIndicesForGeneDebugList = ref<number[]>([]);
const enabledRegionIndicesForGeneDebugList = ref<number[]>([]);
const toggleGenesListForBlock = (debugList: number[], blockIndex: number) => {
  const elementIndex = debugList.findIndex((val) => val === blockIndex);
  if (elementIndex !== -1)
  {
    // Toggle off
    debugList.splice(elementIndex, 1);
    return;
  }

  debugList.push(blockIndex);
};
////

async function attachToProgressLoader(storeLoadingActionName: string, func: () => Promise<any>)
{
  try
  {
    store.dispatch(storeLoadingActionName, true);
    await func();
  }
  catch (err)
  {
    onError(err, 'An error occurred while updating the overview panel', false);
  }
  finally
  {
    store.dispatch(storeLoadingActionName, false);
  }
}

onMounted(async () => {
  // TODO: Clear out selected data on mount?
  // Clear any prior selections or set as the searched gene
  // const gene = store.state.gene;
  // store.dispatch('setSelectedData', gene ? [new SelectedData(gene.clone(), 'Gene')] : null);

  //await attachToProgressLoader('setIsOverviewPanelUpdating', updateOverviewPanel);
});

watch(() => store.state.configurationLoaded, () => {
  if (store.state.configurationLoaded)
  {
    attachToProgressLoader('setIsOverviewPanelUpdating', updateOverviewPanel);
  }
});

/**
 * Have a progress loader for the Details Panel update process.
 */
watch(() => store.state.detailedBasePairRange, () => {
  if (store.state.configurationLoaded)
  {
    attachToProgressLoader('setIsDetailedPanelUpdating', updateDetailsPanel);
  }
});

// TODO: I think every time the variantPositionsList is changed, the updateSyntenyVariants() method
//   is called - which triggers a detailed panel update. This watch may no longer be needed?
// TODO: not sure if watch is the best thing for this
watch(() => props.variantPositionsList, () => {
  const backboneSpecies = store.state.species;
  const detailedBackbone = detailedBackboneSet.value?.backbone;
  if (backboneSpecies && detailedBackbone)
  {
    props.variantPositionsList.forEach((variantPositions) => {
      if (variantPositions.mapKey === backboneSpecies.activeMap.key)
      {
        updateBackboneVariants(backboneSpecies, variantPositions, detailedBackbone);
      }
    });
  }
}, {deep: true});

watch(() => store.state.isUpdatingVariants, () => {
  if (store.state.isUpdatingVariants) updateSyntenyVariants();
});

watch(() => store.state.speciesOrder, () => {
  updateOverviewPanel();
  updateDetailsPanel();
});

// FIXME: check on this (probably needs to be attached to Main props instead):
const arePanelsLoading = computed(() => {
  // Either panel is processing or API is being queried
  return store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating || props.loading;
});

const displayVariantLegend = computed(() => {
  const backboneVariantIdx = detailedBackboneSet.value?.datatrackSets.findIndex((set) => set.type === 'variant');
  if (backboneVariantIdx !== undefined && backboneVariantIdx !== -1)
  {
    return true;
  }
  for (let i = 0; i < detailedSyntenySets.value.length; i++)
  {
    const hasVariantTracks = detailedSyntenySets.value[i].regions.some((region) =>
      region.datatrackSets.findIndex((set) => set.type === 'variant') !== -1
    );
    if (hasVariantTracks)
    {
      return true;
    }
  }
  return false;
});

const variantBinSize = computed(() => {
  if (detailedBackboneSet.value?.variantBinSize)
  {
    return detailedBackboneSet.value.variantBinSize;
  }
  else if (detailedSyntenySets.value.some((set) => set.variantBinSize))
  {
    const setWithVariants = detailedSyntenySets.value.find((set) => set.variantBinSize && set.variantBinSize > 0);
    return setWithVariants?.variantBinSize ?? 0;
  }
  return 0;
});

const currentlySelectingRegion = () => {
  return (getOverviewSelectionStatus() || getDetailedSelectionStatus());
};

const updateOverviewPanel = async () => {
  $log.debug('Updating Overview Panel');

  const overviewUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;

  if (backboneSpecies == null || backboneChromosome == null)
  {
    $log.error('Backbone species or chromosome is null during overview panel update');
    overviewSyntenySets.value = [];
    return;
  }

  // Build backbone set
  overviewSyntenySets.value = [];
  const overviewBackboneOrder = store.state.speciesOrder[backboneSpecies.activeMap.key.toString()];
  const overviewBackbone = createBackboneSection(backboneSpecies, backboneChromosome, 0, backboneChromosome.seqLength, 'overview', overviewBackboneOrder ?? 0);
  overviewBackboneSet.value = createBackboneSet(overviewBackbone, overviewBackboneOrder ?? 0, backboneSpecies.activeMap);

  const overviewBackboneCreationTime = Date.now();

  // Build overview synteny sets
  const overviewSyntenyTrackCreationTime = Date.now();
  overviewSyntenySets.value = await createOverviewSyntenicRegionSets(props.syntenyTree, store.state.comparativeSpecies, backboneChromosome, store.state.speciesOrder);

  // TODO: request an update to the detailed panel here

  // TODO: double check this logic:
  const overviewCreateBackboneSelectionTime = Date.now();
  logPerformanceReport('Update Overview Time', (overviewCreateBackboneSelectionTime - overviewUpdateStart), {
    'Create Backbone Track': (overviewBackboneCreationTime - overviewUpdateStart),
    'Create Synteny Tracks': (overviewSyntenyTrackCreationTime - overviewBackboneCreationTime),
    'Create Backbone Selection': (overviewCreateBackboneSelectionTime - overviewSyntenyTrackCreationTime)
  });
};

/**
 * Update the SVG elements on the "detailed" panel of the SVG. This involves removing those
 * previously viewed elements (by clearing our reactive refs in this class) and then creating
 * a view of the new viewport that only includes things in our visible range.
 * NOTE: Some of the elements we remove and recreate might actually have the represented the
 *   same memory structures and in a future iteration we will try to adjust the position of
 *   those elements as opposed to removing and recreating them.
 */
const updateDetailsPanel = async () => {
  $log.debug(`Updating Detailed Panel`);

  const detailedUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const detailedBasePairRange = store.state.detailedBasePairRange;

  // Get comparison species Ids for ortholog API call parameter
  const comparativeSpeciesIds: number[] = [];
  store.state.comparativeSpecies.map(species => comparativeSpeciesIds.push(species.defaultMapKey));

  // debug timers
  let timeSyntenyTracks = 0;
  let timeBackboneFilterGenes = 0;
  let timeCreateBackboneDatatracks = 0;
  let timeCreateBackboneSet = 0;
  let timeAdjustVisibleRegion = 0;

  // error if invalid base pair range
  if (detailedBasePairRange.stop - detailedBasePairRange.start <= 0)
  {
    // Clear out our detailed synteny sets
    $log.error(`Invalid detailedBasePairRange?? (${detailedBasePairRange.start}, ${detailedBasePairRange.stop})`);
    detailedSyntenySets.value = [];
    return;
  }

  //error if no backbone species or chromosome
  if (backboneSpecies == null || backboneChromosome == null)
  {
    detailedSyntenySets.value = [];
    return;
  }
  const backboneOrder = store.state.speciesOrder[backboneSpecies.activeMap.key];
  //
  // First, create the visible backbone elements
  const detailedBackbone = createBackboneSection(backboneSpecies, backboneChromosome,
      store.state.detailedBasePairRange.start, store.state.detailedBasePairRange.stop, 'detailed', backboneOrder ?? 0);
  const backboneFilterGenesStart = Date.now();
  const backboneGenes: Gene[] = [];
  props.geneList.forEach((gene: Gene) => {
    if (gene.mapKey == backboneSpecies.activeMap.key && isBpRangeVisible(gene.start, gene.stop))
    {
      // Only add visible genes
      backboneGenes.push(gene);
    }
  });
  timeBackboneFilterGenes = Date.now() - backboneFilterGenesStart;
  const backboneDatatracksStart = Date.now();
  const backboneDatatrackInfo = backboneDatatrackBuilder(backboneSpecies, backboneGenes, detailedBackbone);
  timeCreateBackboneDatatracks = Date.now() - backboneDatatracksStart;
  const backboneSetStart = Date.now();
  detailedBackboneSet.value = createBackboneSet(detailedBackbone, backboneOrder ?? 0, backboneSpecies.activeMap, backboneDatatrackInfo.processedGenomicData);

  // Now check for other potential datatracks to add to the backbone (like variant positions)
  props.variantPositionsList.forEach((variantPositions) => {
    if (variantPositions.mapKey === backboneSpecies.activeMap.key)
    {
      updateBackboneVariants(backboneSpecies, variantPositions, detailedBackbone);
    }
  });

  timeCreateBackboneSet = Date.now() - backboneSetStart;

  //
  // Next, the visible Synteny elements
  const syntenyTracksStart = Date.now();
  detailedSyntenySets.value = await createSyntenicRegionSets(
      props.syntenyTree,
      store.state.comparativeSpecies,
      detailedBasePairRange.start,
      detailedBasePairRange.stop,
      store.state.speciesOrder,
  );
  timeSyntenyTracks = Date.now() - syntenyTracksStart;

  //
  // Create ortholog lines
  // NOTE: Casting the type here since .value can't "unpack" the private methods on the object and thus,
  //  doesn't see it as equaling the SyntenyRegionSet type
  orthologLines.value = createOrthologLines(props.geneList, detailedBackboneSet.value, detailedSyntenySets.value as SyntenyRegionSet[]);
  
  // Report timing data
  const timeDetailedUpdate= Date.now() - detailedUpdateStart;
  const timeDetailedUpdateOther = timeDetailedUpdate - (
    + timeBackboneFilterGenes
    + timeCreateBackboneDatatracks
    + timeCreateBackboneSet
    + timeSyntenyTracks 
    + timeAdjustVisibleRegion);
  logPerformanceReport('Update Detailed Time', timeDetailedUpdate, {
    'Filter Backbone Genes': timeBackboneFilterGenes,
    'Create Backbone Datatracks': timeCreateBackboneDatatracks,
    'Create Backbone Set, and AdjustY': timeCreateBackboneSet,
    'Create Synteny Tracks': timeSyntenyTracks,
    'Adjust Visible Region': timeAdjustVisibleRegion,
    'Misc': timeDetailedUpdateOther,
  });
};

const navigateUp = () => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (isNavigationUpDisabled.value || selectedRegion?.viewportSelection == null) return;
  // const chromosome = selectedRegion.chromosome;

  if (store.state.detailedBasePairRange)
  {
    const currRange = store.state.detailedBasePairRange;
    let adjust = NAV_SHIFT_PERCENT * (currRange.stop - currRange.start);
    if (currRange.start < adjust) adjust = currRange.start;
    store.dispatch('setDetailedBasePairRequest', { start: currRange.start - adjust, stop: currRange.stop - adjust });
  }
};

const navigateDown = () => {
  const selectedRegion = store.state.selectedBackboneRegion;

  if (isNavigationDownDisabled.value || selectedRegion?.viewportSelection == null) return;
  const chromosome = selectedRegion.chromosome;

  if (store.state.detailedBasePairRange)
  {
    const currRange = store.state.detailedBasePairRange;
    let adjust = NAV_SHIFT_PERCENT * (currRange.stop - currRange.start);
    if (currRange.stop + adjust > chromosome.seqLength) adjust = chromosome.seqLength - currRange.stop;
    store.dispatch('setDetailedBasePairRequest', { start: currRange.start + adjust, stop: currRange.stop + adjust });
  }
};


const isNavigationUpDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }

  const selectedRegion = store.state.selectedBackboneRegion;

  if (selectedRegion && selectedRegion.viewportSelection)
  {
    return 0 > selectedRegion.viewportSelection.basePairStart;
  }

  return false;
});

const isNavigationDownDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }
  
  const selectedRegion = store.state.selectedBackboneRegion;
  
  if (selectedRegion && selectedRegion.viewportSelection)
  {
    return 0 >= selectedRegion.viewportSelection.basePairStop;
  }

  return false;
});

const onDetailedSyntenyHover = (svgY: number | null) => {
  detailedSyntenySvgYPosition.value = svgY;
};


const getDetailedPosition = () =>
{
  const detailedPanel = document.getElementById('detailed');
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  if (detailedPanel)
  {
    const detailedPanelDomPositions = detailedPanel.getBoundingClientRect();
    return {
      position: 'absolute',
      top: String(detailedPanelDomPositions.top + scrollY)+ 'px',
      bottom: String(detailedPanelDomPositions.bottom ) + 'px',
      right: String(detailedPanelDomPositions.right) + 'px',
      left: String(detailedPanelDomPositions.left + scrollX) + 'px',
      width: String(detailedPanelDomPositions.width) + 'px',
      height: String(detailedPanelDomPositions.height ) + 'px',
    };
  }
};

/**
 * Helper function to determine if a Range of bp position in the Backbone
 * is visible in any part of the viewport. There are three possibilities:
 *   1) Start is inside the viewport
 *   2) Stop is inside the viewport
 *   3) Start & Stop surround the viewport
 */
const isBpRangeVisible = (start: number, stop: number) => {
  const backboneRegion = store.state.selectedBackboneRegion;
  const viewportStart = backboneRegion?.viewportSelection?.basePairStart ?? -1;
  const viewportStop = backboneRegion?.viewportSelection?.basePairStop ?? -1;
  // if (start >= viewportStart && start <= viewportStop)
  //   return true;
  // else if (stop >= viewportStart && stop <= viewportStop)
  //   return true;
  // else if (start < viewportStart && stop > viewportStop)
  //   return true;

  // Simplified above comparisons to single statement
  return (start <= viewportStop && stop >= viewportStart);
};

// TODO: temp ignore here, should remove once this method is actively being used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadBackboneQtls = async () => {
  const chromosome = store.state.chromosome;
  const backboneSpecies = store.state.species;
  const backboneRegion = store.state.selectedBackboneRegion;
  const start = backboneRegion?.viewportSelection?.basePairStart;
  const stop = backboneRegion?.viewportSelection?.basePairStop;
  const speciesMap = store.state.species?.activeMap;

  if (chromosome && stop && speciesMap && backboneSpecies)
  {
    const factory = new GenomicSectionFactory(
      backboneSpecies.name,
      speciesMap.name,
      chromosome.chromosome,
      { start: start || 0, stop: stop },
      'detailed'
    );
    const qtls = await QtlApi.getQtls(chromosome.chromosome, start || 0, stop, speciesMap.key);
    const qtlDatatracks = createQtlDatatracks(factory, qtls, backboneSpecies, chromosome);
    detailedBackboneSet.value?.addNewDatatrackSetToStart(qtlDatatracks, 'qtl');
  }
};

const updateBackboneVariants = (backboneSpecies: Species, variantPositions: VariantPositions, detailedBackbone: BackboneSection) => {
  const variantDatatrackInfo = backboneVariantTrackBuilder(backboneSpecies, variantPositions, detailedBackbone);
  if (detailedBackboneSet.value)
  {
    detailedBackboneSet.value?.addNewDatatrackSetToStart(variantDatatrackInfo.datatracks, 'variant');
    detailedBackboneSet.value.maxVariantCount = variantDatatrackInfo.maxCount;
    detailedBackboneSet.value.variantBinSize = variantDatatrackInfo.binSize;

    // TODO: I believe this code is no longer needed since ortholog lines get rebuilt every time the details panel is updated
    // NOTE: we can do this because we always know the variant track is first and then the genes
    // When variants are displayed, lines should start two gaps and two track widths from the right of the backbone
    const xPos = detailedBackboneSet.value.backbone.posX2 + SVGConstants.backboneDatatrackXOffset * 2 + SVGConstants.dataTrackWidth * 2;
    orthologLines.value?.forEach((line) => {
      if (line.startGene.mapKey === detailedBackboneSet.value?.mapKey)
      {
        line.posX1 = xPos;
      }
    });
  }
};

const updateSyntenyVariants = () => {
  updateDetailsPanel();
  store.dispatch('setIsUpdatingVariants', false);
};

document.addEventListener('scroll' , getDetailedPosition);

//Back button handling from svg page.  User must confirm they want to leave the page.
router.beforeEach((to, from, next) => {
  if (window && window.event && window.event.type == 'popstate')
  {  
    const response = confirm('Are you sure you want to leave this page? You may lose progress.');
    if (response == true)
    {
      next();
    }
    else
    {
      next(false);
    }
  }
  else
  {
    next();
  }
});

// listen for escape press, cancel overview/detailed panel selection if active.
window.addEventListener('keyup', function(event) {
    // If  ESC key was pressed...
    if (event.keyCode === 27) {
      cancelOverviewSelection();
      cancelDetailedSelection();
    }
});

const showToast = (severity: string, title: string, details: string, duration: number) => {
  const toastCount = store.state.selectionToastCount;
  
  if (toastCount % 10 == 0)
  {
    toast.add({severity: severity, summary: title, detail: details, life: duration });
  }
};

function logPerformanceReport(title: string, totalTimeMillis: number, detailedTimeReportObject: { [key:string]: number} )
{
  const performanceReport: any = {
    [title]: totalTimeMillis + ' ms',
    Details: {}
  };

  for (const detailTitle in detailedTimeReportObject)
  {
    performanceReport.Details[detailTitle] = detailedTimeReportObject[detailTitle] + ' ms | ' + ((detailedTimeReportObject[detailTitle] / totalTimeMillis * 100).toFixed(2) + '%');
  }

  $log.debug(JSON.stringify(performanceReport, null, 2));
}

</script>

<style lang="scss" scoped>
#svg-wrapper
{
  user-select: none ;
  z-index: -1;
}


rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
  z-index: 0;

  &.selectable:not(.is-loading)
  {
    cursor: crosshair;
  }

  &.is-loading
  {
    cursor: wait;
  }
}

rect.selecting-panel
{
  fill: white;
  opacity: 0;
  position: absolute;
  z-index: 1;

  &:not(.is-loading)
  {
    cursor: crosshair;
  }

  &.is-loading
  {
    cursor: wait;
  }
}

rect.visible-selecting-panel
{
  cursor: crosshair;
}

.vcmap-loader.p-progressbar
{
  height: 0.25em;
}

rect.navigation-btn
{
  fill: lightgray;
  stroke-width: 1;
  stroke: lightslategray;
  &:hover:not(.disabled)
  {
    fill: whitesmoke;
    cursor: pointer;
  }

  &.disabled
  {
    cursor: not-allowed;
  }
}

.nav-btn-img
{
  cursor: pointer;
  pointer-events: none;
}
.legend-title
{
  text-align: right;
  margin-top: auto;
  margin-bottom: auto;
}
.legend-container
{
  margin-left: 1%;
}
.col-4
{
  &.plus-half{
    width: 37.5%;
  }
}
</style>
