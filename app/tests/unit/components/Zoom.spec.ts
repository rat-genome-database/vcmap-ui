import { mount } from '@vue/test-utils';
import Zoom from '@/components/Zoom.vue';
import { VCMapState } from '@/store';
import { ActionTree, Store } from 'vuex';
import BackboneSelection from '@/models/BackboneSelection';
import Chromosome from '@/models/Chromosome';
import { TestUtils } from '../../utils/TestUtils';

describe('Zoom', () => {

  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  const state: Partial<VCMapState> = {};
  const test_chromosome = new Chromosome({ 'mapKey': 0, 'chromosome':'T', 'seqLength': 100 });

  beforeEach(() => {
    actions = {
      setDetailedBasePairRange: jest.fn()
    };

    state.selectedBackboneRegion = new BackboneSelection(test_chromosome);
    state.selectedBackboneRegion.setViewportSelection(0, 100);
    state.chromosome = test_chromosome;
    store = TestUtils.initStore(state, actions);
  });

  it('slider updates when zoom level changes due to manual zoom selection', async () => {
    const wrapper = mount(Zoom, {
      global: TestUtils.getGlobalMountingOptions({
        includeExternalComponents: true,
        includeDirectives: true,
        useStore: store,
      }),
    });

    await wrapper.vm.$nextTick();
    store.state.detailedBasePairRange = {start:0, stop:test_chromosome.seqLength};
    await wrapper.vm.$nextTick();
    const zoomLevelLabel = wrapper.get('[data-test="zoom-level-label"]');
    expect(zoomLevelLabel.text()).toEqual('1x');
  });

  // TODO... need to trigger moving the zoom slider in the DOM and testing the params of the setDetailedBasePairRange action
});