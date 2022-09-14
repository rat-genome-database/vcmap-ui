import { ActionContext, createStore, Store } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import TrackSection from '@/models/TrackSection';
import Gene from '@/models/Gene';
import BackboneSelection, { BasePairRange, SelectedRegion } from '@/models/BackboneSelection';
import SVGConstants from '@/utils/SVGConstants';
import SelectedData from '@/models/SelectedData';
import { InjectionKey } from 'vue';

export const key: InjectionKey<Store<VCMapState>> = Symbol();

export interface VCMapState
{
  species: Species | null; // backbone species
  chromosome: Chromosome | null; // backbone chromosome
  startPos: number | null; // backbone start position
  stopPos: number | null; // backbone stop position
  loadStart: number | null; // load start position
  loadStop: number | null; // load stop position
  gene: Gene | null; // backbone gene

  comparativeSpecies: Species[];
  loadedGenes: Map<string, any> | Gene[];
  loadedGeneSections: TrackSection[];

  selectedBackboneRegion: BackboneSelection;

  overviewBasePairToHeightRatio: number;
  overviewSyntenyThreshold: number;
  detailedBasePairToHeightRatio: number;
  detailsSyntenyThreshold: number;

  configTab: number;

  selectedData: SelectedData[] | null;
  selectedGeneIds: number[];

  detailedBasePairRange: BasePairRange;

  isDetailedPanelUpdating: boolean;
  isOverviewPanelUpdating: boolean;
}

const vuexLocal = new VuexPersistence<VCMapState>({
  storage: window.localStorage
});

export default createStore({
  state: (): VCMapState => ({
    species: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    loadStart: null,
    loadStop: null,
    gene: null,

    comparativeSpecies: [],
    loadedGenes: [],
    loadedGeneSections: [],

    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),

    overviewBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,

    configTab: 0,

    selectedData: null,
    selectedGeneIds: [],

    detailedBasePairRange: { start: 0, stop: 0 },

    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,
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
    loadStart (state: VCMapState, loadStart: number) {
      state.loadStart = loadStart;
    },
    loadStop (state: VCMapState, loadStop: number) {
      state.loadStop = loadStop;
    },
    gene (state: VCMapState, gene: Gene) {
      state.gene = gene;
    },
    comparativeSpecies (state: VCMapState, speciesArray: Species[]) {
      state.comparativeSpecies = speciesArray;
    },
    loadedGenes (state: VCMapState, loadedGenesArray: Gene[]) {
      state.loadedGenes = loadedGenesArray;
    },
    loadedGeneSections (state: VCMapState, loadedGeneSections: TrackSection[]) {
      state.loadedGeneSections = loadedGeneSections;
    },
    selectedBackboneRegion ( state: VCMapState, selection: BackboneSelection) {
      state.selectedBackboneRegion = selection;
    },
    detailedBasePairRange(state: VCMapState, range: BasePairRange) {
      state.detailedBasePairRange = range;
    },
    overviewBasePairToHeightRatio(state: VCMapState, ratio: number) {
      console.debug(`Setting overview panel bp resolution to ${ratio} bp/unit`);
      state.overviewBasePairToHeightRatio = ratio;
    },
    overviewSyntenyThreshold(state: VCMapState, threshold: number) {
      console.debug(`Setting overview panel synteny threshold to ${threshold}bp`);
      state.overviewSyntenyThreshold = threshold;
    },
    detailedBasePairToHeightRatio(state: VCMapState, ratio: number) {
      console.debug(`Setting details panel bp resolution to ${ratio} bp/unit`);
      state.detailedBasePairToHeightRatio = ratio;
    },
    detailsSyntenyThreshold(state: VCMapState, threshold: number) {
      console.debug(`Setting details panel synteny threshold to ${threshold}bp`);
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
    backboneOrthologs(state: VCMapState, orthologs: any) {
      state.selectedBackboneRegion.orthologData = orthologs;
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
    setLoadStart(context: ActionContext<VCMapState, VCMapState>, loadStart: number) {
      context.commit('loadStart', loadStart);
    },
    setLoadStop(context: ActionContext<VCMapState, VCMapState>, loadStop: number) {
      context.commit('loadStop', loadStop);
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
      const detailedTrackHeight = SVGConstants.viewboxHeight - (SVGConstants.panelTitleHeight + SVGConstants.navigationButtonHeight);
      context.commit('detailedBasePairToHeightRatio', backboneLength / detailedTrackHeight);
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
    setLoadedGeneSections(context: ActionContext<VCMapState, VCMapState>, loadedGeneSections: TrackSection[]) {
      context.commit('loadedGeneSections', loadedGeneSections);
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
      context.commit('loadStart', null);
      context.commit('loadStop', null);
      context.commit('comparativeSpecies', []);
      context.commit('selectedGeneIds', []);
      context.commit('loadedGenes', []);
      context.commit('loadedGeneSections', []);
      context.commit('selectedBackboneRegion', new BackboneSelection(new SelectedRegion(0,0,0,0)));
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
    },
    clearBackboneSelection(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('selectedBackboneRegion', new BackboneSelection(new SelectedRegion(0,0,0,0)));
      context.commit('detailedBasePairRange', { start: 0, stop: 0 });
    },
    setBackboneSelection(context: ActionContext<VCMapState, VCMapState>, selection: BackboneSelection) {
      if (selection.innerSelection == null)
      {
        selection.generateInnerSelection(selection.baseSelection.basePairStart, selection.baseSelection.basePairStop, context.state.overviewBasePairToHeightRatio);
      }
      context.commit('startPosition', selection.baseSelection.basePairStart);
      context.commit('stopPosition', selection.baseSelection.basePairStop);
      context.commit('selectedBackboneRegion', selection);
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
      context.commit('detailedBasePairRange', { start: selection.innerSelection?.basePairStart, stop: selection.innerSelection?.basePairStop });
    },
    setDetailedBasePairRange(context: ActionContext<VCMapState, VCMapState>, range: BasePairRange) {
      // Note: Committing a change to detailedBasePairRange will trigger an update on the Detailed panel
      context.commit('detailedBasePairRange', range);
    },
    setBackboneOrthologData(context: ActionContext<VCMapState, VCMapState>, orthologs: any) {
      context.commit('backboneOrthologs', orthologs);
    }
  },

  plugins: [
    vuexLocal.plugin
  ]
});
