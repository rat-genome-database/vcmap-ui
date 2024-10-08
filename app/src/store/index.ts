import { ActionContext, createStore, Store } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import UserHistory from '@/models/UserHistory';
import BackboneSelection, { BasePairRange } from '@/models/BackboneSelection';
import SelectedData from '@/models/SelectedData';
import { InjectionKey } from 'vue';
import { createLogger } from 'vuex';
import { ConfigurationMode } from '@/utils/Types';
import { IHoveredData } from '@/models/HoveredData';
import { SVGPositionVariables } from '@/utils/SVGConstants';

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

  shouldUpdateDetailedPanel: boolean;

  /* Selected data */
  selectedGeneIds: number[];
  selectedVariantSections: any[];
  selectedData: SelectedData[] | null;
  isDataPanelCollapsed: boolean;

  /* Hovered data */
  hoveredData: IHoveredData;

  selectionToastCount: number;
  hideBackboneDensityTrack: boolean;
  hiddenDensityTracks: number[];

  svgPositions: SVGPositionVariables;

  speciesOrder: any;

  /* History */
  history: UserHistory[];

  /* Visibility settings */
  showOverviewPanel: boolean;
  contextMenuOpen: boolean;
}

/**
 * Remove items from state that do not need to be persisted across page refreshes or when new tabs are open
 */
const storageReducer = (state: VCMapState): Partial<VCMapState> => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contextMenuOpen,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hoveredData,
    ...persistedState
  } =  state;
  return persistedState;
};

/**
 * Saves VCMap state to local storage so that newly opened tabs can default to last loaded configuration
 */
const vuexLocal = new VuexPersistence<VCMapState>({
  key: 'VCMAP_LOCAL',
  storage: window.localStorage,
  reducer: storageReducer,
});

/**
 * Saves VCMap state to session storage so that each open tab can have its own configuration loaded
 */
const vuexSession = new VuexPersistence<VCMapState>({
  key: 'VCMAP_SESSION',
  storage: window.sessionStorage,
  reducer: storageReducer,
});

const actionsToLog = [
  'setDetailedBasePairRange', 
  'setDetailedBasePairRequest', 
  'setBackboneSelection'
];
const mutationsToLog = ['detailedBasePairRange', 'addToHistory'];

const logger = createLogger({
  // Filter out frequently occurring actions/mutations (makes the console really noisy for not much benefit)
  filter: (mutation) => {
    return mutationsToLog.includes(mutation.type);
  },
  actionFilter: (action) => {
    return actionsToLog.includes(action.type);
  },
});

// Used to hold user history temporarily until fully completed
let partialHistory: { range: BasePairRange; source: string; } | null = null;

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

    shouldUpdateDetailedPanel: false,

    selectedGeneIds: [],
    selectedVariantSections: [],
    selectedData: null,
    isDataPanelCollapsed: false,

    hoveredData: {
      x: 0,
      y: 0,
      data: [],
    },

    selectionToastCount: 0,

    svgPositions: {
      overviewPanelWidth: 300,
      mirroredOverivew: false,
    },
    speciesOrder: {},

    hideBackboneDensityTrack: false,
    hiddenDensityTracks: [],
    history: [],
    showOverviewPanel: true,
    contextMenuOpen: false,
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
    selectedVariantSections(state: VCMapState, selectedSections: any[]) {
      state.selectedVariantSections = selectedSections;
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
    addToHistory(state: VCMapState, entry: UserHistory) {
      //check if the entry is already in the history, first by source, then by range
      const relevantEntries = state.history.filter((e) => e.source === entry.source);
      /* const index = relevantEntries.findIndex((e) => e.range.start === entry.range.start && e.range.stop === entry.range.stop);
      if (index !== -1) {
        return;
      } */
      //for now, explicitly allow only one Initial Load entry
      if (entry.source === 'Initial Configuration' && relevantEntries.length > 0) {
        return;
      }
      
      state.history.unshift(entry);
    },
    clearUserHistory(state: VCMapState) {
      state.history = [];
    },
    svgPositions(state: VCMapState, svgPositions: SVGPositionVariables) {
      state.svgPositions = svgPositions;
    },
    showOverviewPanel(state: VCMapState, showOverviewPanel: boolean) {
      state.showOverviewPanel = showOverviewPanel;
    },
    isDataPanelCollapsed(state: VCMapState, isDataPanelCollapsed: boolean) {
      state.isDataPanelCollapsed = isDataPanelCollapsed;
    },
    shouldUpdateDetailedPanel(state: VCMapState, shouldUpdateDetailedPanel: boolean) {
      state.shouldUpdateDetailedPanel = shouldUpdateDetailedPanel;
    },
    contextMenuOpen(state: VCMapState, contextMenuOpen: boolean) {
      state.contextMenuOpen = contextMenuOpen;
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
    setSelectedVariantSections(context: ActionContext<VCMapState, VCMapState>, selectedSections: any[]) {
      context.commit('selectedVariantSections', selectedSections);
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
    setHistory(context: ActionContext<VCMapState, VCMapState>, historyEntry: UserHistory) {
      context.commit('addToHistory', historyEntry);
    },
    clearConfiguration(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('species', null);
      context.commit('gene', null);
      context.commit('chromosome', null);
      context.commit('startPosition', null);
      context.commit('stopPosition', null);
      context.commit('comparativeSpecies', []);
      context.commit('selectedGeneIds', []);
      context.commit('selectedVariantSections', []);
      context.commit('selectedData', []);
      context.commit('selectedBackboneRegion', null);
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
      context.commit('configurationLoaded', null);
      context.commit('selectionToastCount', 0);
      context.commit('hideBackboneDensityTrack', false);
      context.commit('clearSynthenicDensityTrackVisibility');
      context.commit('setSpeciesOrder', {});
      context.commit('clearUserHistory');
    },
    clearSynthenicDensityTrackVisibility(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('clearSynthenicDensityTrackVisibility');
    },
    clearBackboneSelection(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('selectedBackboneRegion', null);
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
    },
    /**
     * Updates the backbone selection and the base pair range shown in the detailed panel without querying
     * for new synteny data
     */
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

      if (partialHistory) {
        const selection = context.state.selectedBackboneRegion;
        const fullHistory = {
          ...partialHistory,
          backbone: selection,
          timestamp: Date.now()
        };
        context.commit('addToHistory', fullHistory);
        partialHistory = null;
      }
    },
    /**
     * Sends a new detailed base pair request to the Main.vue page. This will trigger a query for new synteny data and 
     * reprocessing of the SVG elements in the detailed panel.
     */
    setDetailedBasePairRequest(context: ActionContext<VCMapState, VCMapState>, payload: {range: BasePairRange, source?: string}) {
      const { range, source = '' } = payload;
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
      context.commit('detailedBasePairRequest', range);

      // Capture source and new entry for user history when a new range and action is performed
      if (range) {
        partialHistory = { range, source };
      }
    },
    /**
     * Sets a new base pair range for the detailed panel. This will trigger the detailed panel to reprocess
     * its SVG elements without querying for new synteny data. See {@link setDetailedBasePairRequest} for triggering
     * a new query of synteny data + reprocessing.
     */
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
    clearUserHistory(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('clearUserHistory');
    },
    setSvgPositions(context: ActionContext<VCMapState, VCMapState>, svgPositions: SVGPositionVariables) {
      context.commit('svgPositions', svgPositions);
    },
    setShowOverviewPanel(context: ActionContext<VCMapState, VCMapState>, showOverviewPanel: boolean) {
      context.commit('showOverviewPanel', showOverviewPanel);
    },
    setShouldUpdateDetailedPanel(context: ActionContext<VCMapState, VCMapState>, shouldUpdateDetailedPanel: boolean) {
      context.commit('shouldUpdateDetailedPanel', shouldUpdateDetailedPanel);
    },
    setContextMenuOpen(context: ActionContext<VCMapState, VCMapState>, contextMenuOpen: boolean) {
      context.commit('contextMenuOpen', contextMenuOpen);
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
