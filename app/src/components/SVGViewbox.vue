<template>
  <ProgressBar class="vcmap-loader" :mode="arePanelsLoading ? 'indeterminate' : 'determinate'" :value="0" :showValue="false"/>
  <svg :viewBox="'0 0 800 ' + SVGConstants.viewboxHeight" xmlns="http://www.w3.org/2000/svg" id="svg-wrapper" width="100%">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="800" :height="SVGConstants.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" x="0" @mousedown.left="initOverviewSelection" @mousemove="updateOverviewSelection" @mouseup.left="completeOverviewSelection(overviewBackboneSet?.backbone)" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" @mousedown.left="initZoomSelection" @mousemove="updateZoomSelection" @mouseup.left="completeZoomSelection" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />

    <!-- Overview panel SVGs ------------------------------------------->
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(region, index) in syntenySet.regions" :key="index">
        <SectionSVG show-chromosome show-synteny-on-hover show-start-stop :region="(region as SyntenyRegion)" />
      </template>
    </template>

    <template v-if="overviewBackboneSet">
      <BackboneSetSVG show-data-on-hover :backbone-set="overviewBackboneSet" />
    </template>

    <!-- Detail panel SVGs ----------------------------------------->
    <template v-if="detailedBackboneSet">
      <BackboneSetSVG show-data-on-hover :backbone-set="detailedBackboneSet" />
    </template>

    <template v-if="detailedSyntenySets.length">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(syntenicRegion, index) in syntenySet.regions" :key="index">
          <SectionSVG show-gene-label show-chromosome :region="syntenicRegion as SyntenyRegion" />
        </template>
      </template>
    </template>

    <!-- Title panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
    <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.panelTitleYPosition">Detailed</text>

    <!-- SyntenyRegionSet Title Labels -->
    <template v-for="(syntenySet, index) in overviewSyntenySets" :key="index">
      <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
        <text class="label small" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="overviewBackboneSet">
      <template v-for="(label, index) in overviewBackboneSet.titleLabels" :key="index">
        <text class="label small" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="detailedBackboneSet">
      <template v-for="(label, index) in detailedBackboneSet.titleLabels" :key="index">
        <text class="label small" :x="label.posX" :y="label.posY">{{label.text}}</text>
      </template>
    </template>
    <template v-if="detailedSyntenySets.length">
      <template v-for="(syntenySet, index) in detailedSyntenySets" :key="index">
        <template v-for="(label, index) in syntenySet.titleLabels" :key="index">
          <text class="label small" :x="label.posX" :y="label.posY">{{label.text}} (test)</text>
        </template>
      </template>
    </template>

    <!-- Navigation buttons -->
    <rect class="navigation-btn" :class="{'disabled': isNavigationUpDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDownDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-up.svg" @click="navigateUp" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <image class="nav-btn-img" href="../../node_modules/primeicons/raw-svg/chevron-down.svg" @click="navigateDown" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />

    <!-- Detailed panel selection svg for zoom -->
    <rect v-if="startDetailedSelectionY && stopDetailedSelectionY" 
      @mouseup.left="completeZoomSelection"
      @mousemove="updateZoomSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="SVGConstants.overviewPanelWidth" :y="startDetailedSelectionY"
      :width="SVGConstants.detailsPanelWidth" :height="stopDetailedSelectionY - startDetailedSelectionY" />

    <!-- Overview panel selection svg for backbone -->
    <rect v-if="startOverviewSelectionY && stopOverviewSelectionY" 
      @mouseup.left="completeOverviewSelection(overviewBackboneSet?.backbone)"
      @mousemove="updateOverviewSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="0" :y="startOverviewSelectionY"
      :width="SVGConstants.overviewPanelWidth" :height="stopOverviewSelectionY - startOverviewSelectionY" />
  </svg>

  <VCMapDialog v-model:show="showDialog" :header="dialogHeader" :message="dialogMessage" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import SectionSVG from './SectionSVG.vue';
import SVGConstants from '@/utils/SVGConstants';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import VCMapDialog from '@/components/VCMapDialog.vue';
import useDialog from '@/composables/useDialog';
import Gene from '@/new_models/Gene';
import SelectedData from '@/models/SelectedData';
import useDetailedPanelZoom from '@/composables/useDetailedPanelZoom';
import { key } from '@/store';
import { backboneDetailedError, backboneOverviewError, missingComparativeSpeciesError, noRegionLengthError } from '@/utils/VCMapErrors';
import { createSyntenicRegionsAndDatatracks,  } from '@/utils/SectionBuilder';
import useOverviewPanelSelection from '@/composables/useOverviewPanelSelection';
import { useLogger } from 'vue-logger-plugin';
import SyntenyRegion from '@/new_models/SyntenyRegion';
import { createBackboneSection, backboneDatatrackBuilder, createBackboneSet } from '@/utils/BackboneBuilder';
import BackboneSetSVG from './BackboneSetSVG.vue';
import SyntenyRegionSet from '@/new_models/SyntenyRegionSet';
import GeneApi from '@/api/GeneApi';
import BackboneSet from '@/new_models/BackboneSet';
import { LoadedSpeciesGenes } from '@/new_models/DatatrackSection';

const store = useStore(key);
const $log = useLogger();

const { showDialog, dialogHeader, dialogMessage, onError, checkSyntenyResultsOnComparativeSpecies } = useDialog();
const { startDetailedSelectionY, stopDetailedSelectionY, initZoomSelection, updateZoomSelection, completeZoomSelection } = useDetailedPanelZoom(store);
const { startOverviewSelectionY, stopOverviewSelectionY, initOverviewSelection, updateOverviewSelection, completeOverviewSelection } = useOverviewPanelSelection(store);

let detailedSyntenySets = ref<SyntenyRegionSet[]>([]); // The currently displayed SyntenicRegions in the detailed panel
let overviewBackboneSet = ref<BackboneSet>();
let detailedBackboneSet = ref<BackboneSet>();
let overviewSyntenySets = ref<SyntenyRegionSet[]>([]);

let geneReload: boolean = false; //whether or not load by gene reload has occurred


async function attachToProgressLoader(storeLoadingActionName: string, func: () => Promise<any>)
{
  try
  {
    store.dispatch(storeLoadingActionName, true);
    await func();
  }
  catch (err)
  {
    onError(err, 'An error occurred while updating the overview panel');
  }
  finally
  {
    store.dispatch(storeLoadingActionName, false);
  }
}

onMounted(async () => {
  // Clear any prior selections or set as the searched gene
  const gene = store.state.gene;
  if (gene) {
    let selectedData = new SelectedData(gene, 'Gene');
    store.dispatch('setSelectedData', [selectedData]);
  } else {
    store.dispatch('setSelectedData', null);
  }

  await attachToProgressLoader('setIsOverviewPanelUpdating', updateOverviewPanel);
  checkSyntenyResultsOnComparativeSpecies(overviewSyntenySets.value as SyntenyRegionSet[]);
});

watch(() => store.state.detailedBasePairRange, () => {
  attachToProgressLoader('setIsDetailedPanelUpdating', updateDetailsPanel);
});

const arePanelsLoading = computed(() => {
  return store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating;
});

const updateOverviewPanel = async () => {
  const overviewUpdateStart = Date.now();

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const backboneStart = store.state.startPos;
  const backboneStop = store.state.stopPos;
  const loadType = store.state.configTab;

  if (backboneSpecies == null || backboneChromosome == null || backboneStart == null || backboneStop == null)
  {
    onError(backboneOverviewError, backboneOverviewError.message);
    overviewSyntenySets.value = [];
    return;
  }

  if (backboneStop - backboneStart <= 0)
  {
    onError(noRegionLengthError, noRegionLengthError.message);
    overviewSyntenySets.value = [];
    return;
  }

  overviewSyntenySets.value = [];
  // The backbone is the entire chromosome
  store.dispatch('setOverviewResolution', backboneChromosome.seqLength);
  const overviewBackbone = createBackboneSection(backboneSpecies, backboneChromosome, 0, backboneChromosome.seqLength, 'overview');
  overviewBackboneSet.value = createBackboneSet(overviewBackbone);

  if (store.state.comparativeSpecies.length === 0)
  {
    onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
    return;
  }

  // TODO: Do we need masterGeneMap for the overview?
  const emptyMap = new Map<number, LoadedSpeciesGenes>();
  const overviewSyntenyData = await createSyntenicRegionsAndDatatracks(
    store.state.comparativeSpecies,
    backboneChromosome,
    0,
    backboneChromosome.seqLength,
    0,
    backboneChromosome.seqLength,
    store.state.overviewSyntenyThreshold,
    false,
    emptyMap,
  );

  overviewSyntenySets.value = overviewSyntenyData.syntenyRegionSets;

  // Set the backbone selection to the start and stop positions selected on the config screen if a selection doesn't already exist
  // (the backbone should have just 1 [0] section)
  const prevBackboneSelection = store.state.selectedBackboneRegion;
  if (overviewBackbone != null && prevBackboneSelection.baseSelection.svgHeight === 0)
  {
    //if initially loading by gene, we need to set and process the full backbone range and syntenic blocks to find ortholog positions to later adjust so all are visible in the detail panel
    if (loadType === 0)
    {
      const selection = overviewBackbone.generateBackboneSelection(0, backboneChromosome.seqLength, store.state.overviewBasePairToHeightRatio, backboneChromosome);
      store.dispatch('setBackboneSelection', selection);
    }
    else
    {
      const selection = overviewBackbone.generateBackboneSelection(backboneStart, backboneStop, store.state.overviewBasePairToHeightRatio, backboneChromosome);
      store.dispatch('setBackboneSelection', selection);
    }
  }
  else
  {
    // Recreate the BackboneSelection model b/c the model loses its functions after page refresh (vuex-persist plugin does not preserve functions on objects)
    const recreatedSelection = new BackboneSelection(
      new SelectedRegion(prevBackboneSelection.baseSelection.svgYPoint, prevBackboneSelection.baseSelection.svgHeight, prevBackboneSelection.baseSelection.basePairStart, prevBackboneSelection.baseSelection.basePairStop), 
      prevBackboneSelection.chromosome
    );
    if (prevBackboneSelection.innerSelection)
    {
      recreatedSelection.generateInnerSelection(prevBackboneSelection.innerSelection.basePairStart, prevBackboneSelection.innerSelection.basePairStop, store.state.overviewBasePairToHeightRatio);
    }
    else
    {
      recreatedSelection.generateInnerSelection(prevBackboneSelection.baseSelection.basePairStart, prevBackboneSelection.baseSelection.basePairStop, store.state.overviewBasePairToHeightRatio);
    }
    
    store.dispatch('setBackboneSelection', recreatedSelection);
  }
  
  $log.info(`Update overview time: ${(Date.now() - overviewUpdateStart)} ms`);
 
};

const updateDetailsPanel = async () => {
  const detailedUpdateStart = Date.now();
  store.dispatch('setIsDetailedPanelUpdating', true);

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const loadType = store.state.configTab;
  const originalSelectedBackboneRegion = store.state.selectedBackboneRegion;
  const detailedBasePairRange = store.state.detailedBasePairRange;

  // debug timers
  let timeSyntenyTracks = 0;
  let timeCreateBackboneTrack = 0;

  if (detailedBasePairRange.stop - detailedBasePairRange.start <= 0)
  {
    // Clear out our detailed synteny sets
    detailedSyntenySets.value = [];
    return;
  }

  if (backboneSpecies == null || backboneChromosome == null)
  {
    onError(backboneDetailedError, backboneDetailedError.message);
    detailedSyntenySets.value = [];
    return;
  }

  // Reset our detailed synteny sets before generating new ones
  detailedSyntenySets.value = [];

  // Get the range of the inner section that will be shown in the Detailed panel
  const zoomedSelection = originalSelectedBackboneRegion.generateInnerSelection(detailedBasePairRange.start, detailedBasePairRange.stop, store.state.overviewBasePairToHeightRatio);
  // Update the Detailed panel rez to match that region length
  store.dispatch('setDetailsResolution', zoomedSelection.basePairStop - zoomedSelection.basePairStart);

  const createBackboneTrackStart = Date.now();
  // Create the backbone track for the entire base selection at the updated Detailed panel resolution
  const detailedBackbone = createBackboneSection(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, 'detailed');
  // Create the backbone data tracks for the entire selection at the updated Detailed panel resolution
  const tempBackboneGenes: Gene[] = await GeneApi.getGenesByRegion(backboneChromosome.chromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, backboneSpecies.activeMap.key, backboneSpecies.name);

  const backboneDatatrackInfo = backboneDatatrackBuilder(tempBackboneGenes, detailedBackbone, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, );
  detailedBackboneSet.value = createBackboneSet(detailedBackbone, backboneDatatrackInfo.processedGenomicData);
  const masterGeneMap = backboneDatatrackInfo.masterGeneMap;

  timeCreateBackboneTrack = Date.now() - createBackboneTrackStart;

  if (detailedBackbone != null && detailedBackboneSet.value.datatracks.length > 0)
  {
    if (store.state.comparativeSpecies.length === 0)
    {
      onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
      return;
    }

    const createSyntenyTracksStart = Date.now();
    const detailedSyntenyData = await createSyntenicRegionsAndDatatracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      originalSelectedBackboneRegion.baseSelection.basePairStart,
      originalSelectedBackboneRegion.baseSelection.basePairStop,
      originalSelectedBackboneRegion.innerSelection?.basePairStart ?? originalSelectedBackboneRegion.baseSelection.basePairStart,
      originalSelectedBackboneRegion.innerSelection?.basePairStop ?? originalSelectedBackboneRegion.baseSelection.basePairStop,
      store.state.detailsSyntenyThreshold,
      true,
      masterGeneMap
    );

    //TODO
    //Create a combined single array of all region ortholog lines in order to draw after regions for proper overlapping

    detailedSyntenySets.value = detailedSyntenyData.syntenyRegionSets;

    timeSyntenyTracks = Date.now() - createSyntenyTracksStart;

    // Throw our master gene map on the store
    store.dispatch('setLoadedGenes', masterGeneMap);

    //if loading by gene initially, we need to find the backbone start of the "highest" positioned ortholog, and the backbone stop of the "lowest" positioned ortholog, then setting the backbone selection to those coords
    const loadSelectedGene = store.state.gene;
    if ((loadType == 0) && (store.state.selectedGeneIds.length > 0) && (!geneReload) && loadSelectedGene != null)
    {
      const geneBasePairLength = loadSelectedGene.stop - loadSelectedGene.start;
      const newInnerStart = Math.max(Math.floor(loadSelectedGene.start - 3 * geneBasePairLength), originalSelectedBackboneRegion.baseSelection.basePairStart);
      const newInnerStop = Math.min(Math.floor(loadSelectedGene.stop + 3 * geneBasePairLength), originalSelectedBackboneRegion.baseSelection.basePairStop);

      const selection = detailedBackboneSet.value.backbone.generateBackboneSelection(newInnerStart, newInnerStop, store.state.detailedBasePairToHeightRatio, backboneChromosome);
      store.dispatch('clearBackboneSelection');
      store.dispatch('setBackboneSelection', selection);

      geneReload = true;
      return;
    }
    
    //const backboneGeneOrthologs = await SpeciesApi.getGeneOrthologs(backboneSpecies.defaultMapKey, backboneChromosome.chromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, compSpeciesMaps);
    //const backboneGeneOrthologs = null;
    //const syntenicGeneMaps = [];

    adjustDetailedVisibleSetsBasedOnZoom(zoomedSelection);

    // if (syntenicGeneMaps.length > 0)
    // {
    //   constructLoadedGenes(syntenicGeneMaps, allSpeciesGeneMap, compSpeciesNames);
    // }

    // if (backboneGeneOrthologs)
    // {
    //   store.dispatch('setBackboneOrthologData', backboneGeneOrthologs);
    //   generateOrthologLines(backboneGeneOrthologs, compSpeciesMaps);
    // }
  }
  else
  {
    // Could not create synteny sets for the backbone or its data tracks -> clear out all detailed panel synteny sets
    detailedSyntenySets.value = [];
  }

  store.dispatch('setIsDetailedPanelUpdating', false);
  const timeDetailedUpdate= Date.now() - detailedUpdateStart;
  const timeDetailedUpdateOther = timeDetailedUpdate - (timeSyntenyTracks + timeCreateBackboneTrack);

  // debug: log performance assessment for updating detailed panel
  let viewboxDebugReport = {
    "Update Detailed Time":timeDetailedUpdate + " ms",
    Details: {
      "Backbone Tracks": timeCreateBackboneTrack + " ms | " +  ((timeCreateBackboneTrack/timeDetailedUpdate) * 100).toFixed(2) + '%',
      "Synteny Tracks": timeSyntenyTracks + " ms | " +  ((timeSyntenyTracks/timeDetailedUpdate) * 100).toFixed(2) + '%',
      "Misc": timeDetailedUpdateOther + " ms | " +  ((timeDetailedUpdateOther/timeDetailedUpdate) * 100).toFixed(2) + '%',
    },
  };
  $log.debug(JSON.stringify(viewboxDebugReport, null, 2));
};

// const generateOrthologLines = (orthologData: any, comparativeMaps: Number[]) => {
//   if (detailTrackSets.value[0] == null)
//   {
//     return;
//   }

//   let orthologLines: OrthologLine[] = [];
//   let possibleOrthologs: Object[] = [];
//   let backboneGenes = detailTrackSets.value[0].dataTracks[0].track.sections ?? [];
  

//   backboneGenes.forEach(backboneGene => {
//     //check ortholog data for currently visible backbone genes that have orthologs
//     let orthologInfo = orthologData.get(backboneGene.gene.symbol);
//     const comparativeSpecies = store.state.comparativeSpecies;
//     const compSpeciesNameMap = new Map<Number, string>();
//     comparativeSpecies.forEach((species: any) => compSpeciesNameMap.set(species.activeMap.key, species.name));
//     if (orthologInfo)
//     {
//       possibleOrthologs.push({'backboneGene': backboneGene, 'orthologs': orthologInfo});

//       // if this is a selected gene, set orthologs as selected and for data panel
//       if (store.state.selectedGeneIds.includes(backboneGene.gene.rgdId))
//       {
//         const selectedIds: number[] = store.state.selectedGeneIds;
//         const selectedData: SelectedData[] = store.state.selectedData;
//         const orthologKeys = Object.keys(orthologInfo);
//         orthologKeys.forEach((key) => {
//           const orthologGene = new Gene({
//             ...orthologInfo[key][0],
//             key: orthologInfo[key][0].mapKey,
//             speciesName: compSpeciesNameMap.get(orthologInfo[key][0].mapKey)
//           });
//           if (!selectedIds.includes(orthologGene.rgdId)) {
//             selectedIds.push(orthologGene.rgdId);
//             selectedData.push(new SelectedData(orthologGene, 'Gene'));
//           }
//         });
//         store.dispatch('setSelectedGeneIds', selectedIds);
//         store.dispatch('setSelectedData', selectedData);
//       }
//     }
//   });
  
//   //gather the genes for each comparative species
//   let comparativeGenes = {};
//   comparativeMaps.forEach(comparativeMap => {
//     //create a key for each comparative species
//     comparativeGenes[comparativeMap] = [];
//   });
  
//   //gather the genes for each comparative species from the currently visible data tracks
//   detailTrackSets.value.forEach((trackSet, index) => {
//     const speciesMap = trackSet.speciesTrack.speciesMap;
//     if (speciesMap)
//     {
//       if (comparativeGenes[speciesMap])
//       {
//         const sections = trackSet.dataTracks[0].track.sections;
//         const sectionMap = new Map<string, any>();
//         const xPos = getDetailedPanelTrackXOffset(index, 'datatrack', 1) + SVGConstants.selectedBackboneXPosition;
//         sections.forEach(section => {
//           let existingGene = sectionMap.get(section.gene.symbol);

//           if (!section.isVisible)
//           {
//             if (section.height < 0)
//             {
//               return;
//             }
//           }
//           if (!existingGene)
//           {
//             sectionMap.set(section.gene.symbol, {'section': section, 'xPos': xPos, 'duplicates': []});
//           }
//           else
//           {
//             existingGene.duplicates.push({'section': section, 'xPos': xPos});
//           }
//         });
//         comparativeGenes[speciesMap] = sectionMap;
//       }
//     }
//   });

//   //find correlating orthologs on comparative species and create ortholog lines
//   possibleOrthologs.forEach(possibleOrtholog => {
//     const compSpeciesOrthologs = possibleOrtholog.orthologs;
//     const backboneGene = possibleOrtholog.backboneGene;

//     Object.entries(compSpeciesOrthologs).forEach(speciesMap =>{
//       const compOrthologInfo = speciesMap[1];
//       const speciesMapKey = speciesMap[0];
      
//       if (compOrthologInfo.length > 1)
//       {
//         compOrthologInfo.forEach(gene => {
//           const geneSymbol = gene.geneSymbol;
//           const comparativeGene = comparativeGenes[speciesMapKey].get(geneSymbol);
          
//           if (comparativeGene)
//           {
//             const orthologLine = createOrthologLine(backboneGene, comparativeGene, );
//             orthologLines.push(orthologLine);

//             //if this gene has duplicate located elsewhere, add an ortholog line for each duplicate
//             if (comparativeGene.duplicates.length > 0)
//             {
//               comparativeGene.duplicates.forEach(duplicate => {
//                 const orthologLine = createOrthologLine(backboneGene, duplicate, );
//                 orthologLines.push(orthologLine);
//               });
//             }
//           }
//         });
//       }
//       else
//       {
//         if (comparativeGenes[speciesMapKey])
//         {
//           const geneSymbol = compOrthologInfo[0].geneSymbol;
//           const comparativeGene = comparativeGenes[speciesMapKey].get(geneSymbol);
//           if (comparativeGene)
//           {
//             const orthologLine = createOrthologLine(backboneGene, comparativeGene);
//             orthologLines.push(orthologLine);
            
//             if (comparativeGene.duplicates.length > 0)
//             {
//               comparativeGene.duplicates.forEach(duplicate => {
//                 const orthologLine = createOrthologLine(backboneGene, duplicate);
//                 orthologLines.push(orthologLine);
//               });
//             }
//           }
//         }
//       }
//     });
//   });

//   if (detailTrackSets.value[0].dataTracks[0].orthologLines.length > 0)
//   {
//     detailTrackSets.value[0].dataTracks[0].orthologLines = [];
//     detailTrackSets.value[0].dataTracks[0].setOrthologLines(orthologLines);
//   }
//   else
//   {
//     detailTrackSets.value[0].dataTracks[0].setOrthologLines(orthologLines);
//   }
// };

// const createOrthologLine = (backboneGeneSection: any, comparativeGeneSection: any,) => {
//   let orthologLine = new OrthologLine({backboneY: backboneGeneSection.svgY + (backboneGeneSection.height/2), backboneGene: backboneGeneSection, comparativeY: comparativeGeneSection.section.svgY + (comparativeGeneSection.section.height/2), comparativeX: comparativeGeneSection.xPos, comparativeGene: comparativeGeneSection.section});
//   return orthologLine;
// };

// const constructLoadedGenes = (comparativeSpeciesGeneMapsArray: any, allGenesMap: any, comparativeSpeciesArray: string[]) => {
//   let visibleSpeciesGenesMap: Map<string, any> = new Map();
  

//   comparativeSpeciesArray.forEach( (species: string) => {
//     const speciesName = species.toLowerCase();
//     comparativeSpeciesGeneMapsArray.forEach( (speciesGeneMap: Map<string, any>) => {
//       if (visibleSpeciesGenesMap.size == 0) 
//       {
//         //if the map is empty, add all genes from the first species
//         visibleSpeciesGenesMap = new Map(speciesGeneMap as Map<string, any>);
//         return;
//       } 
//       else
//       {
//         //begin inserting genes from the second species map into the master map
//         speciesGeneMap.forEach((value, key) => {
//           if (!visibleSpeciesGenesMap.has(key)) 
//           {
//             //if gene is not already in the master map, add it
//             visibleSpeciesGenesMap.set(key, value);
//           }
//           else
//           {
//             let masterEntry = visibleSpeciesGenesMap.get(key);
//             let speciesEntry = (speciesGeneMap as Map<string, any>).get(key);
            
//             if (!masterEntry[speciesName] && speciesEntry[speciesName])
//             {
//               //if the gene is already in the master map, but the species is not, add the species
//               masterEntry[speciesName] = speciesEntry[speciesName];
//             }
//           }
//         });
//       }
//     });
//   });

//   //merge the allGenesMap and visible GenesMap so we have accurate positional data for all genes
//   comparativeSpeciesArray.forEach( (species: string) => {
//     const speciesName = species.toLowerCase();
//     visibleSpeciesGenesMap.forEach((value, key) => {
//       if (allGenesMap.has(key)) 
//       {
//         let masterEntry = allGenesMap.get(key);
//         let speciesEntry = value;

//         if (speciesEntry[speciesName])
//         {
//           if(speciesEntry[speciesName].drawn.length > 0)
//           {
//             masterEntry[speciesName].visible = speciesEntry[speciesName].drawn;
//           }
//         }
//       }
//       else
//       {
//         //if gene is not already in the master map, add it
//         allGenesMap.set(key, value);
//       }
//     });
//   });

//   store.dispatch('setLoadedGenes', allGenesMap);
// };

const adjustDetailedVisibleSetsBasedOnZoom = (zoomedSelection: SelectedRegion) => {
  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  if (detailedBackboneSet.value)
  {
    const updatedMasterGeneMap = detailedBackboneSet.value.adjustVisibleSet(zoomedSelection.basePairStart, zoomedSelection.basePairStop);
    if (updatedMasterGeneMap)
    {
      detailedSyntenySets.value.forEach(set => {
        set.adjustVisibleSet(zoomedSelection.basePairStart, zoomedSelection.basePairStop, updatedMasterGeneMap);
      });
      store.dispatch('setLoadedGenes', updatedMasterGeneMap);
    }
  }
};

const navigateUp = () => {
  if (isNavigationUpDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionUp(store.state.overviewBasePairToHeightRatio);

  if (selectedRegion.innerSelection)
  {
    adjustDetailedVisibleSetsBasedOnZoom(selectedRegion.innerSelection);
  }
};

const navigateDown = () => {
  if (isNavigationDownDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionDown(store.state.overviewBasePairToHeightRatio);

  if (selectedRegion.innerSelection)
  {
    adjustDetailedVisibleSetsBasedOnZoom(selectedRegion.innerSelection);
  }
};

const isNavigationUpDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }

  const selectedRegion = store.state.selectedBackboneRegion;
  if (selectedRegion.zoomLevel <= 1)
  {
    return true;
  }

  if (selectedRegion.innerSelection)
  {
    return selectedRegion.baseSelection.basePairStart >= selectedRegion.innerSelection.basePairStart;
  }

  return false;
});

const isNavigationDownDisabled = computed(() => {
  if (arePanelsLoading.value)
  {
    return true;
  }
  
  const selectedRegion = store.state.selectedBackboneRegion;
  if (selectedRegion.zoomLevel <= 1)
  {
    return true;
  }

  if (selectedRegion.innerSelection)
  {
    return selectedRegion.baseSelection.basePairStop <= selectedRegion.innerSelection.basePairStop;
  }

  return false;
});
</script>

<style lang="scss" scoped>
#svg-wrapper
{
  user-select: none ;
}

rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;

  &.selectable:not(.is-loading)
  {
    cursor: crosshair;
  }

  &.is-loading
  {
    cursor: wait;
  }
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
}
</style>
