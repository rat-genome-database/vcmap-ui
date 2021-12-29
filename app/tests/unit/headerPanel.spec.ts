import { mount } from '@vue/test-utils';
import HeaderPanel from '@/components/HeaderPanel.vue';
import { VCMapState } from '@/store';
import Species from '@/models/Species';
import Map from '@/models/Map';
import { createStore } from 'vuex';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';

const mockStore = createStore({
  state: {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1, maps: [new Map({ key: 1, primaryRefAssembly: true, description: '', notes: '', name: 'GRCh38'})]}),
    map: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    gene: null,
    comparativeSpecies: [
      new Species({ typeKey: 2, name: 'Test Species 2', defaultMapKey: 2, maps: [new Map({ key: 2, primaryRefAssembly: true, description: '', notes: '', name: 'GRCh37'})] }), 
      new Species({ typeKey: 3, name: 'Test Species 3', defaultMapKey: 3, maps: [new Map({ key: 3, primaryRefAssembly: true, description: '', notes: '', name: 'GRCh36'})] })
    ],
    selectedBackboneRegion: null,
    backboneZoom: 1,
    comparativeZoom: 1,
    displayStartPos: 0,
    displayStopPos: 0,
    backboneBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    comparativeBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
    showOverviewGaps: false,
    showDetailsGaps: false,
    backboneDataTracks: [],
    configTab: 0,
    tooltipData: null,
  },
  getters: {
    getSpecies(state: VCMapState) {
      return state.species;
    },
    getComparativeSpecies(state: VCMapState) {
      return state.comparativeSpecies;
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

describe('HeaderPanel', () => {
  it('load new config button redirects to configuration screen', async () => {

    const wrapper = mount(HeaderPanel, {
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