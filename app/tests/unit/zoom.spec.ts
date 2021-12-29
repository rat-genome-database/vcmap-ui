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
    chromosomeNum: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    gene: null,
    comparativeSpecies: [],
    selectedBackboneRegion: null,
    overviewZoom: 1,
    detailsZoom: 1,
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
  };
  let getters = {
    getOverviewZoom(state: VCMapState) {
      return state.overviewZoom;
    }
  };

  beforeEach(() => {
    actions = {
      setOverviewZoom: jest.fn()
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
        type: 'overview'
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
    expect(actions.setOverviewZoom).toBeCalledTimes(1);
    expect(actions.setOverviewZoom).toBeCalledWith(expect.anything(), 2);
  });

  it('increase button dispatches new zoom level to store', async () => {
    const wrapper = mount(Zoom, {
      props: {
        type: 'overview'
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
    expect(actions.setOverviewZoom).toBeCalledTimes(1);
    expect(actions.setOverviewZoom).toBeCalledWith(expect.anything(), 0.5);
  });
});