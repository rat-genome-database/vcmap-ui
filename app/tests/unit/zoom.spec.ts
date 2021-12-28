import { mount } from '@vue/test-utils';
import Zoom from '@/components/Zoom.vue';
import { VCMapState } from '@/store';
import { ActionTree, createStore, Store } from 'vuex';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';

describe('Zoom', () => {

  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  let state = {
    species: null,
    map: null,
    chromosomeNum: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    gene: null,
    comparativeSpeciesOne: null,
    comparativeSpeciesTwo: null,
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
    configTab: 0
  };
  let getters = {
    getBackboneZoom(state: VCMapState) {
      return state.backboneZoom;
    }
  };

  beforeEach(() => {
    actions = {
      setBackboneZoom: jest.fn()
    };

    store = createStore({
      state,
      getters,
      actions
    })
  });

  it('increase button dispatches new zoom level to store', async () => {
    const wrapper = mount(Zoom, {
      props: {
        type: 'backbone'
      },
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
    expect(actions.setBackboneZoom).toBeCalledTimes(1);
    expect(actions.setBackboneZoom).toBeCalledWith(expect.anything(), 2);
  });

  it('increase button dispatches new zoom level to store', async () => {
    const wrapper = mount(Zoom, {
      props: {
        type: 'backbone'
      },
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
    expect(actions.setBackboneZoom).toBeCalledTimes(1);
    expect(actions.setBackboneZoom).toBeCalledWith(expect.anything(), 0.5);
  });
});