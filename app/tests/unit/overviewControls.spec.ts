import { mount } from '@vue/test-utils';
import OverviewControls from '@/components/OverviewControls.vue';
import Species from '@/models/Species';
import { VCMapState } from '@/store';
import { ActionTree, createStore, Store } from 'vuex';
import Chromosome from '@/models/Chromosome';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';


describe('OverviewControls', () => {
  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  let state = {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1 }),
    map: null,
    chromosome: new Chromosome({ chromosome: '1', mapKey: 38, seqLength: 1000000, gapCount: 5, gapLength: 10000, contigCount: 100, ordinalNumber: 1 }),
    startPos: 1,
    stopPos: 10000,
    gene: null,
    comparativeSpeciesOne: null,
    comparativeSpeciesTwo: null,
    selectedBackboneRegion: null,
    backboneZoom: 1,
    comparativeZoom: 1,
    displayStartPos: 1,
    displayStopPos: 10000,
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
    getSpecies(state: VCMapState) {
      return state.species;
    },
    getChromosome(state: VCMapState) {
      return state.chromosome;
    },
    getStartPosition(state: VCMapState) {
      return state.startPos;
    },
    getStopPosition(state: VCMapState) {
      return state.stopPos;
    },
    getDisplayStartPosition(state: VCMapState) {
      return state.displayStartPos;
    },
    getDisplayStopPosition(state: VCMapState) {
      return state.displayStopPos;
    },
  };

  beforeEach(() => {
    actions = {
      setSelectedBackboneRegion: jest.fn()
    };

    store = createStore({
      state,
      getters,
      actions
    })
  });

  it('renders backbone species name from store', async () => {
    const wrapper = mount(OverviewControls, {
      global: {
        plugins: ExternalComponentsHandler.getPlugins(),
        components: ExternalComponentsHandler.getComponents(),
        directives: ExternalComponentsHandler.getDirectives(),
        provide: {
          store: store
        }
      },
    });

    const speciesText = wrapper.get('[data-test="backbone-overview-display"]');
    expect(speciesText.text()).toBe('Test Species chr1:1-10,000');
  });

  it('clears selection when clear button is clicked', async () => {
    const wrapper = mount(OverviewControls, {
      global: {
        plugins: ExternalComponentsHandler.getPlugins(),
        components: ExternalComponentsHandler.getComponents(),
        directives: ExternalComponentsHandler.getDirectives(),
        provide: {
          store: store
        }
      },
    });
    
    const clearBtn = wrapper.get('[data-test="clear-selection-btn"]');
    await clearBtn.trigger('click');

    expect(actions.setSelectedBackboneRegion).toBeCalledTimes(1);
    expect(actions.setSelectedBackboneRegion).toBeCalledWith(expect.anything(), null);
  });
});