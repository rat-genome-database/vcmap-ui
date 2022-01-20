import { mount } from '@vue/test-utils';
import Zoom from '@/components/Zoom.vue';
import { VCMapState } from '@/store';
import { ActionTree, createStore, Store } from 'vuex';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';

describe('Zoom', () => {

  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  let state = {
    species: null,
    chromosomeNum: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    gene: null,
    comparativeSpecies: [],
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),
    zoom: 1,
    displayStartPos: 0,
    displayStopPos: 0,
    overviewBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
    backboneDataTracks: [],
    configTab: 0,
    tooltipData: null,
  };
  let getters = {
    getZoom(state: VCMapState) {
      return state.zoom;
    }
  };

  beforeEach(() => {
    actions = {
      setZoom: jest.fn()
    };

    store = createStore({
      state,
      getters,
      actions
    })
  });

  it('increase button dispatches new zoom level to store', async () => {
    const wrapper = mount(Zoom, {
      global: {
        plugins: ExternalComponentsHandler.getPlugins(),
        components: ExternalComponentsHandler.getComponents(),
        directives: ExternalComponentsHandler.getDirectives(),
        provide: {
          store: store
        }
      },
    });

    const increaseZoomBtn = wrapper.get('[data-test="increase-zoom-btn"]');

    await increaseZoomBtn.trigger('click');
    expect(actions.setZoom).toBeCalledTimes(1);
    expect(actions.setZoom).toBeCalledWith(expect.anything(), 2);
  });

  it('increase button dispatches new zoom level to store', async () => {
    const wrapper = mount(Zoom, {
      global: {
        plugins: ExternalComponentsHandler.getPlugins(),
        components: ExternalComponentsHandler.getComponents(),
        directives: ExternalComponentsHandler.getDirectives(),
        provide: {
          store: store
        }
      },
    });

    const decreaseZoomBtn = wrapper.get('[data-test="decrease-zoom-btn"]');

    await decreaseZoomBtn.trigger('click');
    expect(actions.setZoom).toBeCalledTimes(1);
    expect(actions.setZoom).toBeCalledWith(expect.anything(), 0.5);
  });
});