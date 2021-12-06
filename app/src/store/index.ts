import { ActionContext, createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';
import BackboneSelection from '@/models/BackboneSelection';


export interface VCMapState
{
  species: Species | null;
  map: Map | null;
  chromosome: Chromosome | null;
  startPos: number | null;
  stopPos: number | null;
  gene: Gene | null;

  comparativeSpeciesOne: Species | null;
  comparativeSpeciesTwo: Species | null;

  selectedBackboneRegion: BackboneSelection | null;
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

    selectedBackboneRegion: null
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
    }
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
    },
    setStopPosition(context: ActionContext<VCMapState, VCMapState>, stopPos: number) {
      context.commit('stopPosition', stopPos);
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
    }
  },

  plugins: [
    vuexLocal.plugin
  ]
});
