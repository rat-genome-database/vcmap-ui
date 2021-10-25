import { ActionContext, createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';
import Species from '@/models/Species';

interface VCMapState
{
  species: Species | null
}

const vuexLocal = new VuexPersistence<VCMapState>({
  storage: window.localStorage
});

export default createStore({
  state: (): VCMapState => ({
    species: null
  }),

  mutations: {
    species (state: VCMapState, species: Species) {
      state.species = species;
    }
  },

  actions: {
    setSpecies (context: ActionContext<VCMapState, VCMapState>, species: Species) {
      context.commit('species', species);
    }
  },

  getters: {
    getSpecies (state: VCMapState) {
      return state.species;
    }
  },

  plugins: [
    vuexLocal.plugin
  ]
});
