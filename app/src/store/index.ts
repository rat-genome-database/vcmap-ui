import { ActionContext, createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import BackboneSelection from '@/models/BackboneSelection';
import DataTrack from '@/models/DataTrack';
import ViewSize from '@/utils/ViewSize';
import TooltipData from '@/models/TooltipData';


export interface VCMapState
{
  species: Species | null; // backbone species
  map: Map | null; // backbone map
  chromosome: Chromosome | null; // backbone chromosome
  startPos: number | null; // original backbone start position
  stopPos: number | null; // original backbone stop position
  gene: Gene | null; // backbone gene

  comparativeSpecies: Species[];

  selectedBackboneRegion: BackboneSelection | null;
  backboneZoom: number;
  comparativeZoom: number;
  displayStartPos: number; // the displayed start position of the backbone (changes due to zoom level)
  displayStopPos: number; // the displayed stop position of the backbone (changes due to zoom level)

  backboneBasePairToHeightRatio: number;
  overviewSyntenyThreshold: number;
  comparativeBasePairToHeightRatio: number;
  detailsSyntenyThreshold: number;

  backboneDataTracks: DataTrack[];

  showOverviewGaps: boolean;
  showDetailsGaps: boolean;

  configTab: number;

  tooltipData: TooltipData | null;
}

const vuexLocal = new VuexPersistence<VCMapState>({
  storage: window.localStorage
});

export default createStore({
  state: (): VCMapState => ({
    species: null,
    map: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    gene: null,

    comparativeSpecies: [],

    selectedBackboneRegion: null,
    backboneZoom: 1,
    comparativeZoom: 1,
    displayStartPos: 0,
    displayStopPos: 0,

    backboneBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    comparativeBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,

    backboneDataTracks: [],
    showOverviewGaps: false,
    showDetailsGaps: false,

    configTab: 0,

    tooltipData: null,
  }),

  mutations: {
    species (state: VCMapState, species: Species) {
      state.species = species;
    },
    map(state: VCMapState, map: Map) {
      state.map = map;
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
    addComparativeSpecies(state: VCMapState, species: Species ) {
      if (state.comparativeSpecies.indexOf(species) == -1) 
      {
        state.comparativeSpecies.push(species);
      }
    },
    removeComparativeSpecies(state: VCMapState, index: number) {
      state.comparativeSpecies.splice(index, 1);
    },
    changeComparativeSpecies(state: VCMapState, species: Species) {
      for (let index = 0; index < state.backboneDataTracks.length; index++)
      {
        if (state.comparativeSpecies[index].name === species.name)
        {
          state.comparativeSpecies[index] = species;
        }
      }
    },

    selectedBackboneRegion ( state: VCMapState, selection: BackboneSelection) {
      state.selectedBackboneRegion = selection;
    },
    backboneZoom (state: VCMapState, zoom: number) {
      state.backboneZoom = zoom;
    },
    comparativeZoom (state: VCMapState, zoom: number) {
      state.comparativeZoom = zoom;
    },
    displayStartPosition(state: VCMapState, start: number) {
      state.displayStartPos = start;
    },
    displayStopPosition(state: VCMapState, stop: number) {
      state.displayStopPos = stop;
    },
    backboneBasePairToHeightRatio(state: VCMapState, ratio: number) {
      console.debug(`Setting overview panel bp resolution to ${ratio} bp/unit`);
      state.backboneBasePairToHeightRatio = ratio;
    },
    overviewSyntenyThreshold(state: VCMapState, threshold: number) {
      console.debug(`Setting overview panel synteny threshold to ${threshold}bp`);
      state.overviewSyntenyThreshold = threshold;
    },
    comparativeBasePairToHeightRatio(state: VCMapState, ratio: number) {
      console.debug(`Setting details panel bp resolution to ${ratio} bp/unit`);
      state.comparativeBasePairToHeightRatio = ratio;
    },
    detailsSyntenyThreshold(state: VCMapState, threshold: number) {
      console.debug(`Setting details panel synteny threshold to ${threshold}bp`);
      state.detailsSyntenyThreshold = threshold;
    },

    backboneDataTracks(state: VCMapState, tracks: DataTrack[]) {
      state.backboneDataTracks = tracks;
    },

    addBackboneDataTrack(state: VCMapState, track: DataTrack ) {
      if (state.backboneDataTracks.indexOf(track) == -1) 
      {
        state.backboneDataTracks.push(track);
      }
    },

    removeBackboneDataTrack(state: VCMapState, index: number) {
      state.backboneDataTracks.splice(index, 1);
    },

    changeBackboneDataTrack(state: VCMapState, track: DataTrack ) {
      for (let index = 0; index < state.backboneDataTracks.length; index++)
      {
        if (state.backboneDataTracks[index].name === track.name)
        {
          state.backboneDataTracks[index] = track;
        }
      }
    },
    showOverviewGaps(state: VCMapState, show: boolean) {
      state.showOverviewGaps = show;
    },
    showDetailsGaps(state: VCMapState, show: boolean) {
      state.showDetailsGaps = show;
    },
    configTab(state: VCMapState, tab: number) {
      state.configTab = tab;
    },
    tooltipData(state: VCMapState, tooltip: TooltipData) {
      state.tooltipData = tooltip;
    },
  },

  actions: {
    setSpecies (context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('species', species);
    },
    setMap (context: ActionContext<VCMapState, VCMapState>, map: Map) {
      context.commit('map', map);
    },
    setChromosome (context: ActionContext<VCMapState, VCMapState>, chromosome: Chromosome) {
      context.commit('chromosome', chromosome);
    },
    setStartPosition(context: ActionContext<VCMapState, VCMapState>, startPos: number) {
      context.commit('startPosition', startPos);
      context.commit('displayStartPosition', startPos);
      context.commit('backboneZoom', 1);
    },
    setStopPosition(context: ActionContext<VCMapState, VCMapState>, stopPos: number) {
      context.commit('stopPosition', stopPos);
      context.commit('displayStopPosition', stopPos);
      context.commit('backboneZoom', 1);
    },
    setGene(context: ActionContext<VCMapState, VCMapState>, gene: Gene) {
      context.commit('gene', gene);
    },
    setSelectedBackboneRegion (context: ActionContext<VCMapState, VCMapState>, selection: BackboneSelection) {
      context.commit('selectedBackboneRegion', selection);
    },
    setBackboneZoom (context: ActionContext<VCMapState, VCMapState>, zoom: number) {
      context.commit('backboneZoom', zoom);
    },
    setComparativeZoom (context: ActionContext<VCMapState, VCMapState>, zoom: number) {
      context.commit('comparativeZoom', zoom);
    },
    setDisplayStartPosition(context: ActionContext<VCMapState, VCMapState>, start: number) {
      context.commit('displayStartPosition', start);
    },
    setDisplayStopPosition(context: ActionContext<VCMapState, VCMapState>, stop: number) {
      context.commit('displayStopPosition', stop);
    },
    setBackboneResolution(context: ActionContext<VCMapState, VCMapState>, backboneLength: number) {
      context.commit('backboneBasePairToHeightRatio', backboneLength / (ViewSize.viewboxHeight - 100));
      // Note: Dividing by 8,000 is arbitary when calculating synteny threshold
      context.commit('overviewSyntenyThreshold', (backboneLength > 1000000) ? Math.floor((backboneLength) / 8000) : 0);
    },
    setComparativeResolution(context: ActionContext<VCMapState, VCMapState>, backboneLength: number) {
      context.commit('comparativeBasePairToHeightRatio', backboneLength / (ViewSize.viewboxHeight - 100));
      // Note: Dividing by 8,000 is arbitary when calculating synteny threshold
      context.commit('detailsSyntenyThreshold', (backboneLength > 1000000) ? Math.floor((backboneLength) / 8000) : 0);
    },
    resetComparativeSpecies(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('comparativeSpecies', []);
    },
    resetBackboneDataTracks(context: ActionContext<VCMapState, VCMapState>) {
      context.commit('backboneDataTracks', []);
    },
    setShowOverviewGaps(context: ActionContext<VCMapState, VCMapState>, show: boolean) {
      context.commit('showOverviewGaps', show);
    },
    setShowDetailsGaps(context: ActionContext<VCMapState, VCMapState>, show: boolean) {
      context.commit('showDetailsGaps', show);
    },
    setConfigTab(context: ActionContext<VCMapState, VCMapState>, tab: number) {
      context.commit('configTab', tab);
    },
    setTooltipData(context: ActionContext<VCMapState, VCMapState>, tooltip: TooltipData) {
      context.commit('tooltipData', tooltip);
    },
  },

  getters: {
    getSpecies (state: VCMapState) {
      return state.species;
    },
    getMap (state: VCMapState) {
      return state.map;
    },
    getChromosome (state: VCMapState) {
      return state.chromosome;
    },
    getStartPosition (state: VCMapState) {
      return state.startPos;
    },
    getStopPosition (state: VCMapState) {
      return state.stopPos;
    },
    getGene (state: VCMapState) {
      return state.gene;
    },
    getComparativeSpecies (state: VCMapState) {
      return state.comparativeSpecies as Species[];
    },
    getSelectedBackboneRegion (state: VCMapState) {
      return state.selectedBackboneRegion;
    },
    getBackboneZoom(state: VCMapState) {
      return state.backboneZoom;
    },
    getComparativeZoom(state: VCMapState) {
      return state.comparativeZoom;
    },
    getDisplayStartPosition(state: VCMapState) {
      return state.displayStartPos;
    },
    getDisplayStopPosition(state: VCMapState) {
      return state.displayStopPos;
    },
    getBackboneBasePairToHeightRatio(state: VCMapState) {
      return state.backboneBasePairToHeightRatio;
    },
    getOverviewSyntenyThreshold(state: VCMapState) {
      return state.overviewSyntenyThreshold;
    },
    getComparativeBasePairToHeightRatio(state: VCMapState) {
      return state.comparativeBasePairToHeightRatio;
    },
    getDetailsSyntenyThreshold(state: VCMapState) {
      return state.detailsSyntenyThreshold;
    },
    getBackboneDataTracks(state: VCMapState) {
      return state.backboneDataTracks as DataTrack[];
    },
    getShowOverviewGaps(state: VCMapState) {
      return state.showOverviewGaps;
    },
    getShowDetailsGaps(state: VCMapState) {
      return state.showDetailsGaps;
    },
    getConfigTab(state: VCMapState) {
      return state.configTab;
    },
    getTooltipData(state: VCMapState) {
      return state.tooltipData;
    },
  },

  plugins: [
    vuexLocal.plugin
  ]
});
