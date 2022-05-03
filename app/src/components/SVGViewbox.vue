<template>
  <ProgressBar class="vcmap-loader" :mode="arePanelsLoading ? 'indeterminate' : 'determinate'" :value="0" :showValue="false"/>
  <svg :viewBox="'0 0 800 ' + SVGConstants.viewboxHeight" xmlns="http://www.w3.org/2000/svg" id="svg-wrapper" width="100%">

    <!-- Outside panel -->
    <rect class="panel" x="0" width="800" :height="SVGConstants.viewboxHeight" />
    <!-- Inner panels -->
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" x="0" @mousedown.left="initOverviewSelection" @mousemove="updateOverviewSelection" @mouseup.left="completeOverviewSelection(overviewTrackSets as TrackSet[])" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.viewboxHeight" />
    <rect class="panel selectable" :class="{'is-loading': arePanelsLoading}" @mousedown.left="initZoomSelection" @mousemove="updateZoomSelection" @mouseup.left="completeZoomSelection" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.viewboxHeight" />
    <!-- Title panels -->
    <rect class="panel" x="0" :width="SVGConstants.overviewPanelWidth" :height="SVGConstants.panelTitleHeight" />
    <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />

    <!-- Overview panel SVGs ------------------------------------------->
    <text class="label medium bold" :x="SVGConstants.overviewTitleXPosition" :y="SVGConstants.panelTitleYPosition">Overview</text>
    <template v-for="(trackSet, index) in overviewTrackSets" :key="trackSet">
      <text class="label small" :x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition" :y="SVGConstants.trackLabelYPosition">{{trackSet.speciesTrack.name}}</text>
      <text class="label small" :x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{trackSet.speciesTrack.mapName}}</text>
      <TrackSVG v-if="index != 0" show-chromosome show-synteny-on-hover show-start-stop :pos-x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition" :width="SVGConstants.trackWidth" :track="trackSet.speciesTrack as Track" />
      <BackboneTrackSVG v-else show-data-on-hover :pos-x="getOverviewPanelTrackXOffset(index) + SVGConstants.backboneXPosition" :track="trackSet.speciesTrack as Track" />
    </template>


    <!-- Detail panel SVGs ----------------------------------------->
    <text class="label medium bold" :x="SVGConstants.selectedBackboneXPosition" :y="SVGConstants.panelTitleYPosition">Detailed</text>

    <template v-for="(trackSet, index) in detailTrackSets" :key="trackSet">
      <text class="label small" :x="getDetailedPanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackLabelYPosition">{{trackSet.speciesTrack.name}}</text>
      <text class="label small" :x="getDetailedPanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :y="SVGConstants.trackMapLabelYPosition">{{trackSet.speciesTrack.mapName}}</text>
      <TrackSVG v-if="index != 0" show-chromosome :pos-x="getDetailedPanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :width="SVGConstants.trackWidth" :track="trackSet.speciesTrack as Track" />
      <BackboneTrackSVG v-else is-detailed show-data-on-hover :pos-x="getDetailedPanelTrackXOffset(index, 'track') + SVGConstants.selectedBackboneXPosition" :track="trackSet.speciesTrack as Track" />

      <template v-if="trackSet.dataTracks.length > 0">
        <template v-for="dataTrack, index2 in trackSet.dataTracks" :key="dataTrack.name">
          <TrackSVG v-if="dataTrack.isDisplayed" gene-data-track show-gene-label :pos-x="getDetailedPanelTrackXOffset(index, 'datatrack', index2 + 1) + SVGConstants.selectedBackboneXPosition" :width="SVGConstants.dataTrackWidth" :lines="dataTrack.orthologLines as OrthologLine[] ?? []" :track="dataTrack.track as Track" />
        </template>
      </template>
    </template>

     <!-- Navigation buttons -->
    <image href="../../node_modules/primeicons/raw-svg/chevron-up.svg" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationUpDisabled }" @click="navigateUp" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />
    <image href="../../node_modules/primeicons/raw-svg/chevron-down.svg" :x="SVGConstants.overviewPanelWidth + (SVGConstants.detailsPanelWidth / 2)" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight - 1" width="20" height="20" />
    <rect class="navigation-btn" :class="{'disabled': isNavigationDownDisabled }" @click="navigateDown" :x="SVGConstants.overviewPanelWidth" :y="SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.navigationButtonHeight" />

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
      @mouseup.left="completeOverviewSelection(overviewTrackSets as TrackSet[])"
      @mousemove="updateOverviewSelection"
      fill="lightgray"
      fill-opacity="0.4"
      :x="0" :y="startOverviewSelectionY"
      :width="SVGConstants.overviewPanelWidth" :height="stopOverviewSelectionY - startOverviewSelectionY" />
  </svg>

  <VCMapDialog v-model:show="showDialog" :header="dialogHeader" :message="dialogMessage" />
</template>

<script setup lang="ts">
import Track from '@/models/Track';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import TrackSVG from './TrackSVG.vue';
import SVGConstants from '@/utils/SVGConstants';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import VCMapDialog from '@/components/VCMapDialog.vue';
import useDialog from '@/composables/useDialog';
import BackboneTrackSVG from './BackboneTrackSVG.vue';
import TrackSet from '@/models/TrackSet';
import OrthologLine from '@/models/OrthologLine';
import Gene from '@/models/Gene';
import { SpeciesSyntenyData } from '@/models/SyntenicRegion';
import SelectedData from '@/models/SelectedData';
import useDetailedPanelZoom from '@/composables/useDetailedPanelZoom';
import { key } from '@/store';
import { backboneDetailedError, backboneOverviewError, missingComparativeSpeciesError, noRegionLengthError } from '@/utils/VCMapErrors';
import { createBackboneDataTracks, createBackboneGeneTrackFromGenesData, createBackboneTrack, createSyntenyTracks } from '@/utils/TrackBuilder';
import useOverviewPanelSelection from '@/composables/useOverviewPanelSelection';
import SpeciesApi from '@/api/SpeciesApi';

const store = useStore(key);

const { showDialog, dialogHeader, dialogMessage, onError, checkSyntenyResultsOnComparativeSpecies } = useDialog();
const { startDetailedSelectionY, stopDetailedSelectionY, initZoomSelection, updateZoomSelection, completeZoomSelection } = useDetailedPanelZoom(store);
const { startOverviewSelectionY, stopOverviewSelectionY, initOverviewSelection, updateOverviewSelection, completeOverviewSelection } = useOverviewPanelSelection(store);

const overviewTrackSets = ref<TrackSet[]>([]); // The currently displayed TrackSets in the Overview panel
const detailTrackSets = ref<TrackSet[]>([]); // The currently displayed TrackSets in the Detailed panel

let comparativeOverviewTracks: Track[] = []; // Keeps track of current comparative tracks displayed in the overview panel
let selectionTrackSets: TrackSet[] = []; // The track sets for the entire selected region


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
  checkSyntenyResultsOnComparativeSpecies(comparativeOverviewTracks);
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

  if (backboneSpecies == null || backboneChromosome == null || backboneStart == null || backboneStop == null)
  {
    onError(backboneOverviewError, backboneOverviewError.message);
    overviewTrackSets.value = [];
    return;
  }

  if (backboneStop - backboneStart <= 0)
  {
    onError(noRegionLengthError, noRegionLengthError.message);
    overviewTrackSets.value = [];
    return;
  }

  overviewTrackSets.value = [];
  // The backbone is the entire chromosome
  store.dispatch('setOverviewResolution', backboneChromosome.seqLength);
  let backboneTrack = createBackboneTrack(backboneSpecies, backboneChromosome, 0, backboneChromosome.seqLength, store.state.overviewBasePairToHeightRatio, SVGConstants.overviewTrackYPosition);

  const backboneTrackSet = new TrackSet(backboneTrack, []);
  overviewTrackSets.value.push(backboneTrackSet);

  if (store.state.comparativeSpecies.length === 0)
  {
    onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
    return;
  }

  let syntenyTrackResults = await createSyntenyTracks(
    store.state.comparativeSpecies,
    backboneChromosome,
    0,
    backboneChromosome.seqLength, 
    store.state.overviewBasePairToHeightRatio,
    store.state.overviewSyntenyThreshold,
    SVGConstants.overviewTrackYPosition, // SVG positioning of the overview tracks will start just underneath the header panels with a bit of space in between
    false,
 );
 comparativeOverviewTracks = syntenyTrackResults.tracks;

  for (let index = 0; index < comparativeOverviewTracks.length; index++)
  {
    const comparativeTrackSet = comparativeOverviewTracks[index];
    overviewTrackSets.value.push(comparativeTrackSet);
  }

  // Set the backbone selection to the start and stop positions selected on the config screen if a selection doesn't already exist
  // (the backbone should have just 1 [0] section)
  const prevBackboneSelection = store.state.selectedBackboneRegion;
  if (backboneTrack.sections.length > 0 && prevBackboneSelection.baseSelection.svgHeight === 0)
  {
    const selection = backboneTrack.sections[0].generateBackboneSelection(backboneStart, backboneStop, store.state.overviewBasePairToHeightRatio, backboneChromosome);
    store.dispatch('setBackboneSelection', selection);
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

  console.log(`Update overview time: ${(Date.now() - overviewUpdateStart)} ms`);
};

const updateDetailsPanel = async () => {
  const detailedUpdateStart = Date.now();
  store.dispatch('setIsDetailedPanelUpdating', true);

  const backboneSpecies = store.state.species;
  const backboneChromosome = store.state.chromosome;
  const originalSelectedBackboneRegion = store.state.selectedBackboneRegion;
  const detailedBasePairRange = store.state.detailedBasePairRange;
  if (detailedBasePairRange.stop - detailedBasePairRange.start <= 0)
  {
    // Clear out our selection TrackSets
    selectionTrackSets = [];
    detailTrackSets.value = [];
    return;
  }

  if (backboneSpecies == null || backboneChromosome == null)
  {
    onError(backboneDetailedError, backboneDetailedError.message);
    selectionTrackSets = [];
    detailTrackSets.value = [];
    return;
  }

  detailTrackSets.value = [];
  selectionTrackSets = [];
  // Get the range of the inner section that will be shown in the Detailed panel
  const zoomedSelection = originalSelectedBackboneRegion.generateInnerSelection(detailedBasePairRange.start, detailedBasePairRange.stop, store.state.overviewBasePairToHeightRatio);
  // Update the Detailed panel rez to match that region length
  store.dispatch('setDetailsResolution', zoomedSelection.basePairStop - zoomedSelection.basePairStart);

  // Create the backbone track for the entire base selection at the updated Detailed panel resolution
  const backboneSelectionTrack = createBackboneTrack(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, store.state.detailedBasePairToHeightRatio);

  // Create the backbone data tracks for the entire selection at the updated Detailed panel resolution
  let tempBackboneGenes: Gene[] = await createBackboneDataTracks(backboneSpecies, backboneChromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop) ?? null;
  tempBackboneGenes.forEach(gene => gene.speciesName = backboneSpecies.name);
  let tempBackboneTracks = createBackboneGeneTrackFromGenesData(tempBackboneGenes, backboneSpecies.name,
    originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop,
    store.state.detailedBasePairToHeightRatio, true, store.state.detailsSyntenyThreshold, SVGConstants.panelTitleHeight);

  if (backboneSelectionTrack != null && tempBackboneTracks != null)
  {
    selectionTrackSets.push(new TrackSet(backboneSelectionTrack, [tempBackboneTracks]));

    if (store.state.comparativeSpecies.length === 0)
    {
      onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message);
      return;
    }

    let syntenyTracksResults = await createSyntenyTracks(
      store.state.comparativeSpecies,
      backboneChromosome,
      originalSelectedBackboneRegion.baseSelection.basePairStart, 
      originalSelectedBackboneRegion.baseSelection.basePairStop,
      store.state.detailedBasePairToHeightRatio,
      store.state.detailsSyntenyThreshold,
      SVGConstants.panelTitleHeight, // SVG positioning of detailed tracks will start immediately after the header panel
      true
    );
    let comparativeSelectionTracks: TrackSet[] = syntenyTracksResults.tracks;
    let syntenyDataArray: SpeciesSyntenyData[] = syntenyTracksResults?.speciesSyntenyDataArray || [];
    let allSyntenyGenes: Gene[] = [];
    syntenyDataArray.forEach((dataArray) => {
      Array.prototype.push.apply(allSyntenyGenes, dataArray.allGenes ?? []);
    });
    store.dispatch('setLoadedGenes', tempBackboneGenes.concat([...allSyntenyGenes]));

    const compSpeciesMaps: Number[] = [];
    for (let index = 0; index < comparativeSelectionTracks.length; index++)
    {
      let track = comparativeSelectionTracks[index];
      selectionTrackSets.push(track);
      if (track.speciesTrack.speciesMap)
      {
        compSpeciesMaps.push(track.speciesTrack.speciesMap);
      }
    }

    const backboneGeneOrthologs = await SpeciesApi.getGeneOrthologs(backboneSpecies.defaultMapKey, backboneChromosome.chromosome, originalSelectedBackboneRegion.baseSelection.basePairStart, originalSelectedBackboneRegion.baseSelection.basePairStop, compSpeciesMaps);

    // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
    selectionTrackSets.forEach(trackSet => {
      const visibleTrackSet = trackSet.getVisibleRegion(zoomedSelection.basePairStart, zoomedSelection.basePairStop, store.state.detailedBasePairToHeightRatio, store.state.detailsSyntenyThreshold);
      if (visibleTrackSet)
      {
        detailTrackSets.value.push(visibleTrackSet);
      }
    });

    if (backboneGeneOrthologs)
    {
      store.dispatch('setBackboneOrthologData', backboneGeneOrthologs);
      generateOrthologLines(backboneGeneOrthologs, compSpeciesMaps);
    }
  }
  else
  {
    // Could not create TrackSets for the backbone or its data tracks -> clear out all detailed panel TrackSets
    selectionTrackSets = [];
    detailTrackSets.value = [];
  }

  store.dispatch('setIsDetailedPanelUpdating', false);
  console.log(`Update detailed time: ${(Date.now() - detailedUpdateStart)} ms`);
};

const generateOrthologLines = (orthologData: any, comparativeMaps: Number[]) => {
  let orthologLines: OrthologLine[] = [];
  let possibleOrthologs = [];
  let backboneGenes = detailTrackSets.value[0].dataTracks[0].track.sections;
  

  backboneGenes.forEach(backboneGene => {
    //check ortholog data for currently visible backbone genes that have orthologs
    let orthologInfo = orthologData.get(backboneGene.gene.symbol);
    if (orthologInfo)
    {
      possibleOrthologs.push({'backboneGene': backboneGene, 'orthologs': orthologInfo});

      // if this is a selected gene, set orthologs as selected and for data panel
      if (store.state.selectedGeneIds.includes(backboneGene.gene.rgdId))
      {
        const selectedIds: number[] = store.state.selectedGeneIds;
        const selectedData: SelectedData[] = store.state.selectedData;
        const orthologKeys = Object.keys(orthologInfo)
        orthologKeys.forEach((key) => {
          const orthologGene = new Gene({...orthologInfo[key][0], key: orthologInfo[key][0].mapKey});
          selectedIds.push(orthologGene.rgdId);
          selectedData.push(new SelectedData(orthologGene, 'Gene'));
        });
        store.dispatch('setSelectedGeneIds', selectedIds);
        store.dispatch('setSelectedData', selectedData);
      }
    }
  });
  
  //gather the genes for each comparative species
  let comparativeGenes = {};
  comparativeMaps.forEach(comparativeMap => {
    //create a key for each comparative species
    comparativeGenes[comparativeMap] = [];
  });
  
  //gather the genes for each comparative species from the currently visible data tracks
  detailTrackSets.value.forEach((trackSet, index) => {
    const speciesMap = trackSet.speciesTrack.speciesMap;
    if (speciesMap)
    {
      if (comparativeGenes[speciesMap])
      {
        const sections = trackSet.dataTracks[0].track.sections;
        const sectionMap = new Map<string, any>();
        const xPos = getDetailedPanelTrackXOffset(index, 'datatrack', 1) + SVGConstants.selectedBackboneXPosition;
        sections.forEach(section => {
          sectionMap.set(section.gene.symbol, {'section': section, 'xPos': xPos});
        });
        comparativeGenes[speciesMap] = sectionMap;
      }
    }
  });

  //find correlating orthologs on comparative species and create orhtolog lines
  possibleOrthologs.forEach(possibleOrtholog => {
    const compSpeciesOrthologs = possibleOrtholog.orthologs;
    const backboneGene = possibleOrtholog.backboneGene;

    Object.entries(compSpeciesOrthologs).forEach(speciesMap =>{
      const compOrthologInfo = speciesMap[1];
      const speciesMapKey = speciesMap[0];
      
      if (compOrthologInfo.length > 1)
      {
        compOrthologInfo.forEach(gene => {
          const geneSymbol = gene.geneSymbol;
          const comparativeGene = comparativeGenes[speciesMapKey].get(geneSymbol);
          if (comparativeGene)
          {
            const orthologLine = createOrthologLine(backboneGene, comparativeGene);
            orthologLines.push(orthologLine);
          }
        });
      }
      else
      {
        const geneSymbol = compOrthologInfo[0].geneSymbol;
        const comparativeGene = comparativeGenes[speciesMapKey].get(geneSymbol);
        if (comparativeGene)
        {
          const orthologLine = createOrthologLine(backboneGene, comparativeGene);
          orthologLines.push(orthologLine);
        }
      }
    });
  });

  if (detailTrackSets.value[0].dataTracks[0].orthologLines.length > 0)
  {
    detailTrackSets.value[0].dataTracks[0].orthologLines = [];
    detailTrackSets.value[0].dataTracks[0].setOrthologLines(orthologLines);
  }
  else
  {
    detailTrackSets.value[0].dataTracks[0].setOrthologLines(orthologLines);
  }
};

const createOrthologLine = (backboneGeneSection: any, comparativeGeneSection: any) => {
  let orthologLine = new OrthologLine({backboneY: backboneGeneSection.svgY + (backboneGeneSection.height/2), backboneGene:backboneGeneSection, comparativeY: comparativeGeneSection.section.svgY + (comparativeGeneSection.section.height/2), comparativeX: comparativeGeneSection.xPos, comparativeGene: comparativeGeneSection.section});
  return orthologLine;
};


/**
 * Gets the offset of the X position relative to the backbone species track
 */
const getOverviewPanelTrackXOffset = (trackNumber: number) => {
  let totalTracks = trackNumber;
  let offset = 0;

  totalTracks == 0 ? offset = 0 : offset = (totalTracks * -80);

  return offset;
};

const getDetailedPanelTrackXOffset = (trackNumber: number, trackType: string, dataTrackNum?: number) => {
  let totalTracks = trackNumber;
  let offset = 0;
  
  //data tracks are drawn on the right side of the backbone track, and first
  if (trackType == 'datatrack' && dataTrackNum != null)
  {
    //every displayed datatrack will have a buffer of 30 between tracks - if last datatrack
    totalTracks == 0 ? offset = 30 : offset = (totalTracks * 120) + (dataTrackNum * 30);
  }
  else
  {
    //the backbone track will have no calculable offset for its datatrack, so we set it to 30.  Later tracks will have a buffer of 30 added between them
    offset = (totalTracks * 120);
  }

  return offset;
};

const navigateUp = () => {
  if (isNavigationUpDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionUp(store.state.overviewBasePairToHeightRatio);

  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  detailTrackSets.value = [];
  selectionTrackSets.forEach(trackSet => {
    if (!selectedRegion.innerSelection) return;

    const visibleTrackSet = trackSet.getVisibleRegion(selectedRegion.innerSelection.basePairStart, selectedRegion.innerSelection.basePairStop, store.state.detailedBasePairToHeightRatio, store.state.detailsSyntenyThreshold);
    if (visibleTrackSet)
    {
      detailTrackSets.value.push(visibleTrackSet);
    }
  });

  if (selectedRegion.orthologData)
  {
    const comparativeSpecies = store.state.comparativeSpecies;
    const comparativeSpeciesMaps = [];
    comparativeSpecies.forEach(species => {comparativeSpeciesMaps.push(species.defaultMapKey);});
    generateOrthologLines(selectedRegion.orthologData, comparativeSpeciesMaps);
  }
};

const navigateDown = () => {
  if (isNavigationDownDisabled.value) return;

  const selectedRegion = store.state.selectedBackboneRegion;
  // Adjust the inner selection on the selected region
  selectedRegion.moveInnerSelectionDown(store.state.overviewBasePairToHeightRatio);

  // Create the displayed TrackSets for the Detailed panel based on the zoomed start/stop
  detailTrackSets.value = [];
  selectionTrackSets.forEach(trackSet => {
    if (!selectedRegion.innerSelection) return;

    const visibleTrackSet = trackSet.getVisibleRegion(selectedRegion.innerSelection.basePairStart, selectedRegion.innerSelection.basePairStop, store.state.detailedBasePairToHeightRatio, store.state.detailsSyntenyThreshold);
    if (visibleTrackSet)
    {
      detailTrackSets.value.push(visibleTrackSet);
    }
  });

  if (selectedRegion.orthologData)
  {
    const comparativeSpecies = store.state.comparativeSpecies;
    const comparativeSpeciesMaps = [];
    comparativeSpecies.forEach(species => {comparativeSpeciesMaps.push(species.defaultMapKey);});
    generateOrthologLines(selectedRegion.orthologData, comparativeSpeciesMaps);
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
  fill-opacity: 0.5;
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
</style>
