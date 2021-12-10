import { mount } from '@vue/test-utils';
import Overview from '@/components/Overview.vue';
import { VCMapState } from '@/store';
import Species from '@/models/Species';
import { createStore } from 'vuex';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';

const mockStore = createStore({
  state: {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1 }),
    map: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    gene: null,
    comparativeSpeciesOne: new Species({ typeKey: 2, name: 'Test Species 2', defaultMapKey: 2 }),
    comparativeSpeciesTwo: new Species({ typeKey: 3, name: 'Test Species 3', defaultMapKey: 3 }),
    selectedBackboneRegion: null,
    backboneZoom: 1,
    comparativeZoom: 1,
    displayStartPos: 0,
    displayStopPos: 0,
    backboneBasePairToHeightRatio: 1000,
    backboneSyntenyThreshold: 0,
    comparativeBasePairToHeightRatio: 1000,
    comparativeSyntenyThreshold: 0,
  },
  getters: {
    getSpecies(state: VCMapState) {
      return state.species;
    },
    getComparativeSpeciesOne(state: VCMapState) {
      return state.comparativeSpeciesOne;
    },
    getComparativeSpeciesTwo(state: VCMapState) {
      return state.comparativeSpeciesTwo;
    }
  }
});

const mockPush = jest.fn();
jest.mock('vue-router', () => ({
  useRoute: jest.fn(),
  useRouter: jest.fn(() => ({
    push: mockPush
  }))
}));

describe('Overview', () => {
  it('load new config button redirects to configuration screen', async () => {

    const wrapper = mount(Overview, {
      global: {
        plugins: ExternalComponentsHandler.getPlugins(),
        components: ExternalComponentsHandler.getComponents(),
        directives: ExternalComponentsHandler.getDirectives(),
        provide: {
          store: mockStore
        }
      }
    });

    const loadButton = wrapper.get('[data-test="load-config-btn"]');
    await loadButton.trigger('click');
    expect(mockPush).toBeCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});