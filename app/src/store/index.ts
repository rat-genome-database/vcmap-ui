import { ActionContext, createStore, Store } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import BackboneSelection, { BasePairRange } from '@/models/BackboneSelection';
import SelectedData from '@/models/SelectedData';
import { InjectionKey } from 'vue';
import { createLogger } from 'vuex';
import { LoadedGene } from '@/models/DatatrackSection';
import { ConfigurationMode } from '@/utils/Types';

export const key: InjectionKey<Store<VCMapState>> = Symbol();

export interface VCMapState
{
  /* User configuration-related properties */
  species: Species | null; // backbone species
  chromosome: Chromosome | null; // backbone chromosome
  startPos: number | null; // backbone start position
  stopPos: number | null; // backbone stop position
  gene: Gene | null; // backbone gene
  comparativeSpecies: Species[];
  configMode: ConfigurationMode;

  /* Triggers for VCMap processing/rendering */
  configurationLoaded: boolean | null;
  selectedBackboneRegion: BackboneSelection | null;
  detailedBasePairRequest: BasePairRange | null;
  detailedBasePairRange: BasePairRange;

  isDetailedPanelUpdating: boolean;
  isOverviewPanelUpdating: boolean;

  selectedGeneIds: number[];
  selectedData: SelectedData[] | null;

  selectionToastCount: number;

  /* These data structures have the potential to be pretty large */
  // TODO: I think we can remove this from state
  loadedGenes: Map<number, LoadedGene> | null;
}

const vuexLocal = new VuexPersistence<VCMapState>({
  storage: window.localStorage
});

const actionsToLog = ['setDetailedBasePairRange', 'setDetailedBasePairRequest'];
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
    configMode: 'gene',

    configurationLoaded: null,
    selectedBackboneRegion: null,
    detailedBasePairRequest: { start: 0, stop: 0 } ?? null,
    detailedBasePairRange: { start: 0, stop: 0 },

    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,

    selectedGeneIds: [],
    selectedData: null,

    selectionToastCount: 0,

    /* These data structures have the potential to be pretty large */
    loadedGenes: null,
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
    configurationLoaded(state: VCMapState, configState: boolean | null) {
      state.configurationLoaded = configState;
    },
    selectedBackboneRegion ( state: VCMapState, selection: BackboneSelection) {
      state.selectedBackboneRegion = selection;
    },
    detailedBasePairRequest(state: VCMapState, range: BasePairRange) {
      state.detailedBasePairRequest = range;
    },
    detailedBasePairRange(state: VCMapState, range: BasePairRange) {
      state.detailedBasePairRange = range;
    },
    configMode(state: VCMapState, mode: ConfigurationMode) {
      state.configMode = mode;
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
    selectionToastCount(state: VCMapState, count: number) {
      state.selectionToastCount = count;
    }
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
    setConfigMode(context: ActionContext<VCMapState, VCMapState>, mode: ConfigurationMode) {
      context.commit('configMode', mode);
    },
    setConfigurationLoaded(context: ActionContext<VCMapState, VCMapState>, configState: boolean | null) {
      context.commit('configurationLoaded', configState);
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
      context.commit('configurationLoaded', null);
      context.commit('selectionToastCount', 0);
    },
    clearBackboneSelection(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('selectedBackboneRegion', null);
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
    },
    setBackboneSelection(context: ActionContext<VCMapState, VCMapState>, selection: BackboneSelection) {
      if (selection.viewportSelection == null)
      {
        selection.setViewportSelection(0, selection.chromosome.seqLength);
      }
      context.commit('startPosition', selection.viewportSelection?.basePairStart ?? 0);
      context.commit('stopPosition', selection.viewportSelection?.basePairStop ?? selection.chromosome.seqLength);
      context.commit('selectedBackboneRegion', selection);
      context.commit('detailedBasePairRange', { start: selection.viewportSelection?.basePairStart, stop: selection.viewportSelection?.basePairStop });
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
    },
    setDetailedBasePairRequest(context: ActionContext<VCMapState, VCMapState>, range: BasePairRange) {
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
      context.commit('detailedBasePairRequest', range);
    },
    setDetailedBasePairRange(context: ActionContext<VCMapState, VCMapState>, range: BasePairRange) {
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
      context.commit('detailedBasePairRange', range);
    },
    setBackboneOrthologData(context: ActionContext<VCMapState, VCMapState>, orthologs: any) {
      context.commit('backboneOrthologs', orthologs);
    },
    setSelectionToastCount(context: ActionContext<VCMapState, VCMapState>, count: number) {
      context.commit('selectionToastCount', count);
    }
  },

  getters: {
    isLoadByGene: (state: VCMapState) => {
      return state.configMode === 'gene';
    },

    isLoadByPosition: (state: VCMapState) => {
      return state.configMode === 'position';
    },
  },

  plugins: process.env.NODE_ENV !== 'production'
    ? [vuexLocal.plugin, logger] // Only use Vuex logger in development
    : [vuexLocal.plugin]
});
