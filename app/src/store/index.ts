import { ActionContext, createStore, Store } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import BackboneSelection, { BasePairRange } from '@/models/BackboneSelection';
import SVGConstants, { PANEL_HEIGHT } from '@/utils/SVGConstants';
import SelectedData from '@/models/SelectedData';
import { InjectionKey } from 'vue';
import { createLogger } from 'vuex';
import { GeneDatatrack, LoadedGene } from '@/models/DatatrackSection';
import { LoadedBlock } from '@/utils/SectionBuilder';

export const key: InjectionKey<Store<VCMapState>> = Symbol();

export interface VCMapState
{
  species: Species | null; // backbone species
  chromosome: Chromosome | null; // backbone chromosome
  startPos: number | null; // backbone start position
  stopPos: number | null; // backbone stop position
  gene: Gene | null; // backbone gene
  comparativeSpecies: Species[];
  configTab: number;

  selectedBackboneRegion: BackboneSelection | null;
  detailedBasePairRange: BasePairRange;

  overviewBasePairToHeightRatio: number;
  overviewSyntenyThreshold: number;
  detailedBasePairToHeightRatio: number;
  detailsSyntenyThreshold: number;

  isDetailedPanelUpdating: boolean;
  isOverviewPanelUpdating: boolean;

  selectedGeneIds: number[];
  selectedData: SelectedData[] | null;

  /* These data structures have the potential to be pretty large */
  loadedGenes: Map<number, LoadedGene> | null;
  loadedBlocks: Map<number, LoadedBlock> | null;
}

const vuexLocal = new VuexPersistence<VCMapState>({
  storage: window.localStorage
});

const actionsToLog = ['setDetailedBasePairRange'];
const mutationsToLog = ['detailedBasePairRange'];

const logger = createLogger({
  // Filter out frequently occurring actions/mutations (makes the console really noisy for not much benefit)
  filter: (mutation) => {
    return mutationsToLog.includes(mutation.type);
  },
  actionFilter: (action) => {
    return actionsToLog.includes(action.type);
  },
});

export default createStore({
  state: (): VCMapState => ({
    species: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    gene: null,
    comparativeSpecies: [],
    configTab: 0,

    selectedBackboneRegion: null,
    detailedBasePairRange: { start: 0, stop: 0 },

    overviewBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,

    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,

    selectedGeneIds: [],
    selectedData: null,

    /* These data structures have the potential to be pretty large */
    loadedGenes: null,
    loadedBlocks: null,
  }),

  mutations: {
    species (state: VCMapState, species: Species) {
      state.species = species;
    },
    chromosome (state: VCMapState, chromosome: Chromosome) {
      state.chromosome = chromosome;
    },
    startPosition (state: VCMapState, startPos: number) {
      state.startPos = startPos;
    },
    stopPosition (state: VCMapState, stopPos: number) {
      state.stopPos = stopPos;
    },
    gene (state: VCMapState, gene: Gene) {
      state.gene = gene;
    },
    comparativeSpecies (state: VCMapState, speciesArray: Species[]) {
      state.comparativeSpecies = speciesArray;
    },
    loadedGenes (state: VCMapState, loadedGenesMap: Map<number, LoadedGene>) {
      state.loadedGenes = loadedGenesMap;
    },
    loadedBlocks (state: VCMapState, loadedBlocksMap: Map<number, LoadedBlock>) {
      state.loadedBlocks = loadedBlocksMap;
    },
    selectedBackboneRegion ( state: VCMapState, selection: BackboneSelection) {
      state.selectedBackboneRegion = selection;
    },
    detailedBasePairRange(state: VCMapState, range: BasePairRange) {
      state.detailedBasePairRange = range;
    },
    overviewBasePairToHeightRatio(state: VCMapState, ratio: number) {
      state.overviewBasePairToHeightRatio = ratio;
    },
    overviewSyntenyThreshold(state: VCMapState, threshold: number) {
      state.overviewSyntenyThreshold = threshold;
    },
    detailedBasePairToHeightRatio(state: VCMapState, ratio: number) {
      state.detailedBasePairToHeightRatio = ratio;
    },
    detailsSyntenyThreshold(state: VCMapState, threshold: number) {
      state.detailsSyntenyThreshold = threshold;
    },
    configTab(state: VCMapState, tab: number) {
      state.configTab = tab;
    },
    selectedData(state: VCMapState, selectedData: SelectedData[]) {
      state.selectedData = selectedData;
    },
    selectedGeneIds(state: VCMapState, selectedIds: number[]) {
      state.selectedGeneIds = selectedIds;
    },
    isDetailedPanelUpdating(state: VCMapState, isUpdating: boolean) {
      state.isDetailedPanelUpdating = isUpdating;
    },
    isOverviewPanelUpdating(state: VCMapState, isUpdating: boolean) {
      state.isOverviewPanelUpdating = isUpdating;
    },
  },

  actions: {
    setSpecies(context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('species', species);
    },
    setChromosome(context: ActionContext<VCMapState, VCMapState>, chromosome: Chromosome) {
      context.commit('chromosome', chromosome);
    },
    setStartPosition(context: ActionContext<VCMapState, VCMapState>, startPos: number) {
      context.commit('startPosition', startPos);
    },
    setStopPosition(context: ActionContext<VCMapState, VCMapState>, stopPos: number) {
      context.commit('stopPosition', stopPos);
    },
    setGene(context: ActionContext<VCMapState, VCMapState>, gene: Gene) {
      context.commit('gene', gene);
    },
    setOverviewResolution(context: ActionContext<VCMapState, VCMapState>, backboneLength: number) {
      // The height of the tracks in the overview should have a little buffer on the top and bottom margins
      const overviewTrackHeight = SVGConstants.viewboxHeight - (SVGConstants.overviewTrackYPosition + SVGConstants.navigationButtonHeight + (SVGConstants.overviewTrackYPosition - SVGConstants.panelTitleHeight));
      context.commit('overviewBasePairToHeightRatio', backboneLength / overviewTrackHeight);
      // Note: Dividing by 8,000 is arbitary when calculating synteny threshold
      context.commit('overviewSyntenyThreshold', (backboneLength > 250000) ? Math.floor((backboneLength) / 8000) : 0);
    },
    setDetailsResolution(context: ActionContext<VCMapState, VCMapState>, backboneLength: number) {
      // The tracks in the detailed panel should have no top or bottom margins
      context.commit('detailedBasePairToHeightRatio', backboneLength / PANEL_HEIGHT);
      // Note: Dividing by 8,000 is arbitary when calculating synteny threshold
      context.commit('detailsSyntenyThreshold', (backboneLength > 250000) ? Math.floor((backboneLength) / 8000) : 0);
    },
    setConfigTab(context: ActionContext<VCMapState, VCMapState>, tab: number) {
      context.commit('configTab', tab);
    },
    setSelectedData(context: ActionContext<VCMapState, VCMapState>, selected: SelectedData[]) {
      context.commit('selectedData', selected);
    },
    setSelectedGeneIds(context: ActionContext<VCMapState, VCMapState>, selectedIds: number[]) {
      context.commit('selectedGeneIds', selectedIds);
    },
    setComparativeSpecies(context: ActionContext<VCMapState, VCMapState>, species: Species[]) {
      context.commit('comparativeSpecies', species);
    },
    setLoadedGenes(context: ActionContext<VCMapState, VCMapState>, loadedGenes: Gene[]) {
      context.commit('loadedGenes', loadedGenes);
    },
    setLoadedBlocks(context: ActionContext<VCMapState, VCMapState>, loadedBlocks: Map<number, LoadedBlock>) {  
      context.commit('loadedBlocks', loadedBlocks);
    },
    setIsDetailedPanelUpdating(context: ActionContext<VCMapState, VCMapState>, isUpdating: boolean) {
      context.commit('isDetailedPanelUpdating', isUpdating);
    },
    setIsOverviewPanelUpdating(context: ActionContext<VCMapState, VCMapState>, isUpdating: boolean) {
      context.commit('isOverviewPanelUpdating', isUpdating);
    },
    clearConfiguration(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('species', null);
      context.commit('gene', null);
      context.commit('chromosome', null);
      context.commit('startPosition', null);
      context.commit('stopPosition', null);
      context.commit('comparativeSpecies', []);
      context.commit('selectedGeneIds', []);
      context.commit('loadedGenes', null);
      context.commit('loadedBlocks', null);
      context.commit('selectedBackboneRegion', null);
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
    },
    clearBackboneSelection(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('selectedBackboneRegion', null);
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
    },
    setBackboneSelection(context: ActionContext<VCMapState, VCMapState>, selection: BackboneSelection) {
      if (selection.viewportSelection == null)
      {
        selection.setViewportSelection(0, selection.chromosome.seqLength, context.state.overviewBasePairToHeightRatio);
      }
      context.commit('startPosition', 0);
      context.commit('stopPosition', selection.chromosome.seqLength);
      context.commit('selectedBackboneRegion', selection);
      context.commit('detailedBasePairRange', { start: selection.viewportSelection?.basePairStart, stop: selection.viewportSelection?.basePairStop });
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
    },
    setDetailedBasePairRange(context: ActionContext<VCMapState, VCMapState>, range: BasePairRange) {
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
      context.commit('detailedBasePairRange', range);
    },
    setBackboneOrthologData(context: ActionContext<VCMapState, VCMapState>, orthologs: any) {
      context.commit('backboneOrthologs', orthologs);
    },
  },

  getters: {
    masterGeneMapByRGDId: (state: VCMapState) => {
      const loadedGenes = state.loadedGenes;

      const mapByRGDId = new Map<number, GeneDatatrack[]>();

      if (loadedGenes == null)
      {
        return mapByRGDId;
      }

      for (const [rgdId, loadedGene] of loadedGenes.entries())
      {
        const allGenes: GeneDatatrack[] = [];
        if (loadedGene.backboneOrtholog != null)
        {
          allGenes.push(loadedGene.backboneOrtholog);
        }

        for (const speciesName in loadedGene.genes)
        {
          const speciesGenes = loadedGene.genes[speciesName];
          speciesGenes.forEach(gene => allGenes.push(gene));
        }

        mapByRGDId.set(rgdId, allGenes);
      }

      return mapByRGDId;
    },

    masterGeneMapBySymbol: (state: VCMapState) => {
      const loadedGenes = state.loadedGenes;
      // Map of RGD Ids keyed by gene symbol
      const mapBySymbol = new Map<string, number[]>();

      if (loadedGenes == null)
      {
        return mapBySymbol;
      }

     for (const [rgdId, loadedGene] of loadedGenes.entries())
     {
        // Collect the backbone ortholog and all comparative species genes with this RGD ID
        const allGenes: GeneDatatrack[]  = [];
        for (const speciesName in loadedGene.genes)
        {
          const speciesGenes = loadedGene.genes[speciesName];
          speciesGenes.forEach(gene => allGenes.push(gene));
        }

        if (loadedGene.backboneOrtholog != null)
        {
          allGenes.push(loadedGene.backboneOrtholog);
        }

        allGenes.forEach(geneDatatrack => {
          const geneSymbol = geneDatatrack.gene.symbol;
          if (geneSymbol)
          {
            const rgdIds = mapBySymbol.get(geneSymbol);
            if (rgdIds != null)
            {
              mapBySymbol.set(geneSymbol, rgdIds.concat(rgdId));
            }
            else
            {
              mapBySymbol.set(geneSymbol, [rgdId]);
            }
          }
        });
      }

      return mapBySymbol;
    },
  },

  plugins: process.env.NODE_ENV !== 'production'
    ? [vuexLocal.plugin, logger] // Only use Vuex logger in development
    : [vuexLocal.plugin]
});
