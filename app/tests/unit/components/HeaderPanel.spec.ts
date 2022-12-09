import { mount } from '@vue/test-utils';
import HeaderPanel from '@/components/HeaderPanel.vue';
import Species from '@/new_models/Species';
import Map from '@/new_models/SpeciesMap';
import { createStore } from 'vuex';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import { key } from '@/store';
import { TestUtils } from '../../utils/TestUtils';

const mockStore = createStore({
  state: {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1, maps: [new Map({ key: 1, primaryRefAssembly: true, name: 'GRCh38'})]}),
    chromosome: null,
    startPos: 0,
    stopPos: 0,
    loadStart: null,
    loadStop: null,
    gene: null,
    comparativeSpecies: [
      new Species({ typeKey: 2, name: 'Test Species 2', defaultMapKey: 2, maps: [new Map({ key: 2, primaryRefAssembly: true, name: 'GRCh37'})] }), 
      new Species({ typeKey: 3, name: 'Test Species 3', defaultMapKey: 3, maps: [new Map({ key: 3, primaryRefAssembly: true, name: 'GRCh36'})] })
    ],
    loadedGeneSections: [],
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),
    detailedBasePairRange: { start: 0, stop: 0 },
    overviewBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
    backboneDataTracks: [],
    configTab: 0,
    selectedData: null,
    loadedGenes: [],
    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,
  },
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
        ...TestUtils.getGlobalMountingOptions({
          includeExternalComponents: true,
          includeDirectives: true,
          includeLogger: true,
        }),
        provide: {
          [key as symbol]: mockStore,
        }
      }
    });

    const loadButton = wrapper.get('[data-test="load-config-btn"]');
    await loadButton.trigger('click');
    expect(mockPush).toBeCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});