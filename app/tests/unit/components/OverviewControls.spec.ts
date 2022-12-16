import { mount } from '@vue/test-utils';
import OverviewControls from '@/components/OverviewControls.vue';
import Species from '@/models/Species';
import Map from '@/models/SpeciesMap';
import { VCMapState } from '@/store';
import { ActionTree, Store } from 'vuex';
import Chromosome from '@/models/Chromosome';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import { TestUtils } from '../../utils/TestUtils';

describe('OverviewControls', () => {
  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  const state: Partial<VCMapState> = {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1, maps: [new Map({ key: 1, primaryRefAssembly: true, name: 'GRCh38'})]}),
    chromosome: new Chromosome({ chromosome: '1', mapKey: 38, seqLength: 1000000}),
    startPos: 1,
    stopPos: 10000,
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(50,100,100,10000)),
  };

  beforeEach(() => {
    actions = {
      clearBackboneSelection: jest.fn(),
    };

    store = TestUtils.initStore(state, actions);
  });

  it('renders backbone species name from store', async () => {
    const wrapper = mount(OverviewControls, {
      global: TestUtils.getGlobalMountingOptions({
        includeDirectives: true,
        includeExternalComponents: true,
        includeLogger: true,
        useStore: store,
      }),
    });

    const speciesText = wrapper.get('[data-test="backbone-overview-display"]');
    expect(speciesText.text()).toBe('Test Species chr1:0-1,000,000');
  });
});