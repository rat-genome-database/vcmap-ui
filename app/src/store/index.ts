import { ActionContext, createStore, Store } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import BackboneSelection, { BasePairRange } from '@/models/BackboneSelection';
import SelectedData from '@/models/SelectedData';
import { InjectionKey } from 'vue';
import { createLogger } from 'vuex';
import { ConfigurationMode } from '@/utils/Types';
import { IHoveredData } from '@/models/HoveredData';

export const key: InjectionKey<Store<VCMapState>> = Symbol();

export interface VCMapState
{
  /* User configuration-related properties */
  species: Species | null; // backbone species
  chromosome: Chromosome | null; // backbone chromosome
  startPos: number | null; // backbone start position
  stopPos: number | null; // backbone stop position
  gene: Gene | null; // backbone gene
  flankingGene1: Gene | null;
  flankingGene2: Gene | null;
  comparativeSpecies: Species[];
  configMode: ConfigurationMode;

  /* Triggers for VCMap processing/rendering */
  configurationLoaded: boolean | null;
  selectedBackboneRegion: BackboneSelection | null;
  detailedBasePairRequest: BasePairRange | null;
  detailedBasePairRange: BasePairRange;

  isDetailedPanelUpdating: boolean;
  isOverviewPanelUpdating: boolean;
  isUpdatingVariants: boolean;

  /* Selected data */
  selectedGeneIds: number[];
  selectedData: SelectedData[] | null;
  isDataPanelCollapsed: boolean;

  /* Hovered data */
  hoveredData: IHoveredData;

  selectionToastCount: number;
  hideBackboneDensityTrack: boolean;
  hiddenDensityTracks: number[];
  // NOTE: I'm commenting these out for now because I'm not using them,
  // but I think we can use something like this to start setting some variables
  // to adjust positions and spacing of elements in the svg
  // svgPositions: SVGPositionVariables;

  speciesOrder: any;
}

/**
 * Saves VCMap state to local storage so that newly opened tabs can default to last loaded configuration
 */
const vuexLocal = new VuexPersistence<VCMapState>({
  key: 'VCMAP_LOCAL',
  storage: window.localStorage,
});

/**
 * Saves VCMap state to session storage so that each open tab can have its own configuration loaded
 */
const vuexSession = new VuexPersistence<VCMapState>({
  key: 'VCMAP_SESSION',
  storage: window.sessionStorage,
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
    flankingGene1: null,
    flankingGene2: null,
    comparativeSpecies: [],
    configMode: 'gene',

    configurationLoaded: null,
    selectedBackboneRegion: null,
    detailedBasePairRequest: { start: 0, stop: 0 } ?? null,
    detailedBasePairRange: { start: 0, stop: 0 },

    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,
    isUpdatingVariants: false,

    selectedGeneIds: [],
    selectedData: null,
    isDataPanelCollapsed: false,

    hoveredData: {
      x: 0,
      y: 0,
      data: [],
    },

    selectionToastCount: 0,

    // NOTE: I'm commenting these out for now because I'm not using them,
    // but I think we can use something like this to start setting some variables
    // to adjust positions and spacing of elements in the svg
    // svgPositions: {
    //   detailedStart: 320,
    //   detailedSpeciesGap: 20,
    // },
    speciesOrder: {},

    hideBackboneDensityTrack: false,
    hiddenDensityTracks: [],
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
    isUpdatingVariants(state: VCMapState, isUpdating: boolean) {
      state.isUpdatingVariants = isUpdating;
    },
    selectionToastCount(state: VCMapState, count: number) {
      state.selectionToastCount = count;
    },
    hideBackboneDensityTrack(state: VCMapState, isHidden: boolean) {
      state.hideBackboneDensityTrack = isHidden;
    },
    toggleSyntenicDensityTrackVisibility(state: VCMapState, mapKey: number) {
      if (!state.hiddenDensityTracks.includes(mapKey)) {
        state.hiddenDensityTracks.push(mapKey);
      } else {
        state.hiddenDensityTracks = state.hiddenDensityTracks.filter((key) => key !== mapKey);
      }
    },
    clearSynthenicDensityTrackVisibility(state: VCMapState) {
      state.hiddenDensityTracks = [];
    },
    flankingGene1(state: VCMapState, gene: Gene | null) {
      state.flankingGene1 = gene;
    },
    flankingGene2(state: VCMapState, gene: Gene | null) {
      state.flankingGene2 = gene;
    },
    speciesOrder(state: VCMapState, speciesOrder: any) {
      state.speciesOrder = speciesOrder;
    },
    hoveredData(state: VCMapState, hoveredData: IHoveredData) {
      state.hoveredData = hoveredData;
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
    setIsDetailedPanelUpdating(context: ActionContext<VCMapState, VCMapState>, isUpdating: boolean) {
      context.commit('isDetailedPanelUpdating', isUpdating);
    },
    setIsOverviewPanelUpdating(context: ActionContext<VCMapState, VCMapState>, isUpdating: boolean) {
      context.commit('isOverviewPanelUpdating', isUpdating);
    },
    setIsUpdatingVariants(context: ActionContext<VCMapState, VCMapState>, isUpdating: boolean) {
      context.commit('isUpdatingVariants', isUpdating);
    },
    setHideBackboneDensityTrack(context: ActionContext<VCMapState, VCMapState>, isHidden: boolean) {
      context.commit('hideBackboneDensityTrack', isHidden);
    },
    setToggleSyntenicDensityTrackVisibility(context: ActionContext<VCMapState, VCMapState>, mapKey: number) {
      context.commit('toggleSyntenicDensityTrackVisibility', mapKey);
    },
    clearConfiguration(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('species', null);
      context.commit('gene', null);
      context.commit('chromosome', null);
      context.commit('startPosition', null);
      context.commit('stopPosition', null);
      context.commit('comparativeSpecies', []);
      context.commit('selectedGeneIds', []);
      context.commit('selectedData', []);
      context.commit('selectedBackboneRegion', null);
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
      context.commit('configurationLoaded', null);
      context.commit('selectionToastCount', 0);
      context.commit('hideBackboneDensityTrack', false);
      context.commit('clearSynthenicDensityTrackVisibility');
      context.commit('setSpeciesOrder', {});
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
    },
    setFlankingGenes(context: ActionContext<VCMapState, VCMapState>, genes: [gene1: Gene | null, gene2: Gene | null]) {
      context.commit('flankingGene1', genes[0]);
      context.commit('flankingGene2', genes[1]);
    },
    setDataPanelCollapsed(context: ActionContext<VCMapState, VCMapState>, isCollapsed: boolean) {
      context.commit('isDataPanelCollapsed', isCollapsed);
    },
    setSpeciesOrder(context: ActionContext<VCMapState, VCMapState>, speciesOrder: any) {
      context.commit('speciesOrder', speciesOrder);
    },
    setHoveredData(context: ActionContext<VCMapState, VCMapState>, hoveredData: IHoveredData) {
      context.commit('hoveredData', hoveredData);
    },
  },

  getters: {
    isLoadByGene: (state: VCMapState) => {
      return state.configMode === 'gene';
    },

    isLoadByPosition: (state: VCMapState) => {
      return state.configMode === 'position';
    },

    isLoadByFlankingGenes: (state: VCMapState) => {
      return state.configMode === 'flanking';
    },
  },

  // The order of these plugins matter. Local storage will be overwritten by session storage
  // as long as the vuexSession comes after vuexLocal.
  plugins: process.env.NODE_ENV !== 'production'
    ? [vuexLocal.plugin, vuexSession.plugin, logger] // Only use Vuex logger in development
    : [vuexLocal.plugin, vuexSession.plugin]
});
