import { mount } from '@vue/test-utils';
import Zoom from '@/components/Zoom.vue';
import { VCMapState } from '@/store';
import { ActionTree, Store } from 'vuex';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import Chromosome from '@/models/Chromosome';
import { TestUtils } from '../../utils/TestUtils';

describe('Zoom', () => {

  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  const state: Partial<VCMapState> = {};

  beforeEach(() => {
    actions = {
      setDetailedBasePairRange: jest.fn()
    };

    const test_chromosome = new Chromosome({ 'mapKey': 0, 'chromosome':'T', 'seqLength': 100 })
    state.selectedBackboneRegion = new BackboneSelection(new SelectedRegion(0, 0, 0, 100), test_chromosome);
    state.selectedBackboneRegion.setViewportSelection(0, 100, 1);
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

    const zoomLevelLabel = wrapper.get('[data-test="zoom-level-label"]');
    expect(zoomLevelLabel.text()).toEqual('1x');

    store.state.isDetailedPanelUpdating = true;
    await wrapper.vm.$nextTick();
    if (store.state.selectedBackboneRegion)
    {
      store.state.selectedBackboneRegion.zoomLevel = 2;
    }
    store.state.isDetailedPanelUpdating = false;
    await wrapper.vm.$nextTick();
    expect(zoomLevelLabel.text()).toEqual('2x');
  });

  // TODO... need to trigger moving the zoom slider in the DOM and testing the params of the setDetailedBasePairRange action
});