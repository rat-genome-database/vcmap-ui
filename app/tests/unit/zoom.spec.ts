import { mount } from '@vue/test-utils';
import Zoom from '@/components/Zoom.vue';
import { key, VCMapState } from '@/store';
import { ActionTree, createStore, Store } from 'vuex';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';

describe('Zoom', () => {

  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  const state = {
    species: null,
    chromosomeNum: null,
    chromosome: null,
    startPos: 0,
    stopPos: 0,
    gene: null,
    comparativeSpecies: [],
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),
    zoom: 1,
    overviewBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
    backboneDataTracks: [],
    configTab: 0,
    selectedGeneIds: [],
    selectedData: null,
    detailedBasePairRange: { start: 0, stop: 0 },
    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,
  };

  beforeEach(() => {
    actions = {
      setDetailedBasePairRange: jest.fn()
    };

    state.selectedBackboneRegion = new BackboneSelection(new SelectedRegion(0, 0, 0, 100));
    state.selectedBackboneRegion.generateInnerSelection(0, 100, 1);
    store = createStore({
      state,
      actions
    });
  });

  it('slider updates when zoom level changes due to manual zoom selection', async () => {
    const wrapper = mount(Zoom, {
      global: {
        plugins: ExternalComponentsHandler.getPlugins(),
        components: ExternalComponentsHandler.getComponents(),
        directives: ExternalComponentsHandler.getDirectives(),
        provide: {
          [key as symbol]: store
        }
      },
    });

    const zoomLevelLabel = wrapper.get('[data-test="zoom-level-label"]');
    expect(zoomLevelLabel.text()).toEqual('1x');

    store.state.isDetailedPanelUpdating = true;
    await wrapper.vm.$nextTick();
    store.state.selectedBackboneRegion.zoomLevel = 2;
    store.state.isDetailedPanelUpdating = false;
    await wrapper.vm.$nextTick();
    expect(zoomLevelLabel.text()).toEqual('2x');
  });

  // TODO... need to trigger moving the zoom slider in the DOM and testing the params of the setDetailedBasePairRange action
});