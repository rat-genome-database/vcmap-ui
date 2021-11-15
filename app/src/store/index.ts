import { ActionContext, createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';


export interface VCMapState
{
  species: Species | null;
  map: Map | null;
  chromosomeNum: number | null;
  chromosome: Chromosome | null;
  startPos: number | null;
  stopPos: number | null;

  comparativeSpeciesOne: Species | null;
  comparativeSpeciesTwo: Species | null;
}

const vuexLocal = new VuexPersistence<VCMapState>({
  storage: window.localStorage
});

export default createStore({
  state: (): VCMapState => ({
    species: null,
    map: null,
    chromosomeNum: null,
    chromosome: null,
    startPos: null,
    stopPos: null,

    comparativeSpeciesOne: null,
    comparativeSpeciesTwo: null
  }),

  mutations: {
    species (state: VCMapState, species: Species) {
      state.species = species;
    },
    map(state: VCMapState, map: Map) {
      state.map = map;
    },
    chromosomeNum (state: VCMapState, chromosomeNum: number) {
      state.chromosomeNum = chromosomeNum;
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
    comparativeSpeciesOne (state: VCMapState, species: Species) {
      state.comparativeSpeciesOne = species;
    },
    comparativeSpeciesTwo (state: VCMapState, species: Species) {
      state.comparativeSpeciesTwo = species;
    },
  },

  actions: {
    setSpecies (context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('species', species);
    },
    setMap (context: ActionContext<VCMapState, VCMapState>, map: Map) {
      context.commit('map', map);
    },
    setChromosomeNum (context: ActionContext<VCMapState, VCMapState>, chromosomeNum: number) {
      context.commit('chromosomeNum', chromosomeNum);
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
    setComparativeSpeciesOne (context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('comparativeSpeciesOne', species);
    },
    setComparativeSpeciesTwo (context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('comparativeSpeciesTwo', species);
    },
  },

  getters: {
    getSpecies (state: VCMapState) {
      return state.species;
    },
    getMap (state: VCMapState) {
      return state.map;
    },
    getChromosomeNum (state: VCMapState) {
      return state.chromosomeNum;
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
    getComparativeSpeciesOne (state: VCMapState) {
      return state.comparativeSpeciesOne;
    },
    getComparativeSpeciesTwo (state: VCMapState) {
      return state.comparativeSpeciesTwo;
    }
  },

  plugins: [
    vuexLocal.plugin
  ]
});
