import { mount } from '@vue/test-utils';
import Zoom from '@/components/Zoom.vue';
import { key, VCMapState } from '@/store';
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
    tooltipData: null,
    detailedBasePairRange: { start: 0, stop: 0 }
  };

  beforeEach(() => {
    actions = {
      setZoom: jest.fn()
    };

    store = createStore({
      state,
      actions
    });
  });

  it('increase button dispatches new zoom level to store', async () => {
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
          [key as symbol]: store
        }
      },
    });

    const decreaseZoomBtn = wrapper.get('[data-test="decrease-zoom-btn"]');

    await decreaseZoomBtn.trigger('click');
    expect(actions.setZoom).toBeCalledTimes(1);
    expect(actions.setZoom).toBeCalledWith(expect.anything(), 0.5);
  });
});