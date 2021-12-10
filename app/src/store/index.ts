import { ActionContext, createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import BackboneSelection from '@/models/BackboneSelection';
import ViewSize from '@/utils/ViewSize';


export interface VCMapState
{
  species: Species | null; // backbone species
  map: Map | null; // backbone map
  chromosome: Chromosome | null; // backbone chromosome
  startPos: number | null; // original backbone start position
  stopPos: number | null; // original backbone stop position
  gene: Gene | null; // backbone gene

  // FIXME: Should be an array of species for flexibility
  comparativeSpeciesOne: Species | null;
  comparativeSpeciesTwo: Species | null;

  selectedBackboneRegion: BackboneSelection | null;
  backboneZoom: number;
  comparativeZoom: number;
  displayStartPos: number; // the displayed start position of the backbone (changes due to zoom level)
  displayStopPos: number; // the displayed stop position of the backbone (changes due to zoom level)

  backboneBasePairToHeightRatio: number;
  backboneSyntenyThreshold: number;
  comparativeBasePairToHeightRatio: number;
  comparativeSyntenyThreshold: number;
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

    comparativeSpeciesOne: null,
    comparativeSpeciesTwo: null,

    selectedBackboneRegion: null,
    backboneZoom: 1,
    comparativeZoom: 1,
    displayStartPos: 0,
    displayStopPos: 0,

    backboneBasePairToHeightRatio: 1000,
    backboneSyntenyThreshold: 0,
    comparativeBasePairToHeightRatio: 1000,
    comparativeSyntenyThreshold: 0,
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
    comparativeSpeciesOne (state: VCMapState, species: Species) {
      state.comparativeSpeciesOne = species;
    },
    comparativeSpeciesTwo (state: VCMapState, species: Species) {
      state.comparativeSpeciesTwo = species;
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
      console.debug(`Setting backbone panel bp resolution to ${ratio} bp/unit`);
      state.backboneBasePairToHeightRatio = ratio;
    },
    backboneSyntenyThreshold(state: VCMapState, threshold: number) {
      console.debug(`Setting backbone panel synteny threshold to ${threshold}bp`);
      state.backboneSyntenyThreshold = threshold;
    },
    comparativeBasePairToHeightRatio(state: VCMapState, ratio: number) {
      console.debug(`Setting comparative panel bp resolution to ${ratio} bp/unit`);
      state.comparativeBasePairToHeightRatio = ratio;
    },
    comparativeSyntenyThreshold(state: VCMapState, threshold: number) {
      console.debug(`Setting comparative panel synteny threshold to ${threshold}bp`);
      state.comparativeSyntenyThreshold = threshold;
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
    setComparativeSpeciesOne (context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('comparativeSpeciesOne', species);
    },
    setComparativeSpeciesTwo (context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('comparativeSpeciesTwo', species);
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
      // Note: Dividing by 10,000 is arbitary when calculating synteny threshold
      context.commit('backboneSyntenyThreshold', (backboneLength > 1000000) ? Math.floor((backboneLength) / 10000) : 0);
    },
    setComparativeResolution(context: ActionContext<VCMapState, VCMapState>, backboneLength: number) {
      context.commit('comparativeBasePairToHeightRatio', backboneLength / (ViewSize.viewboxHeight - 100));
      // Note: Dividing by 10,000 is arbitary when calculating synteny threshold
      context.commit('comparativeSyntenyThreshold', (backboneLength > 1000000) ? Math.floor((backboneLength) / 10000) : 0);
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
    getComparativeSpeciesOne (state: VCMapState) {
      return state.comparativeSpeciesOne;
    },
    getComparativeSpeciesTwo (state: VCMapState) {
      return state.comparativeSpeciesTwo;
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
    getBackboneSyntenyThreshold(state: VCMapState) {
      return state.backboneSyntenyThreshold;
    },
    getComparativeBasePairToHeightRatio(state: VCMapState) {
      return state.comparativeBasePairToHeightRatio;
    },
    getComparativeSyntenyThreshold(state: VCMapState) {
      return state.comparativeSyntenyThreshold;
    },
  },

  plugins: [
    vuexLocal.plugin
  ]
});
