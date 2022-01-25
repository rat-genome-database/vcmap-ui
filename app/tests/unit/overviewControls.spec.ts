import { mount } from '@vue/test-utils';
import OverviewControls from '@/components/OverviewControls.vue';
import Species from '@/models/Species';
import Map from '@/models/Map';
import { key, VCMapState } from '@/store';
import { ActionTree, createStore, Store } from 'vuex';
import Chromosome from '@/models/Chromosome';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';


describe('OverviewControls', () => {
  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  let state = {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1, maps: [new Map({ key: 1, primaryRefAssembly: true, description: '', notes: '', name: 'GRCh38'})]}),
    chromosome: new Chromosome({ chromosome: '1', mapKey: 38, seqLength: 1000000, gapCount: 5, gapLength: 10000, contigCount: 100, ordinalNumber: 1 }),
    startPos: 1,
    stopPos: 10000,
    gene: null,
    comparativeSpecies: [],
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),
    detailedBasePairRange: { start: 0, stop: 0 },
    overviewBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
    backboneDataTracks: [],
    configTab: 0,
    tooltipData: null,
  };

  beforeEach(() => {
    actions = {
      setSelectedBackboneRegion: jest.fn(),
      setDetailedBasePairRange: jest.fn(),
    };

    store = createStore({
      state,
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
          [key as symbol]: store
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
          [key as symbol]: store
        }
      },
    });
    
    const clearBtn = wrapper.get('[data-test="clear-selection-btn"]');
    await clearBtn.trigger('click');

    expect(actions.setSelectedBackboneRegion).toBeCalledTimes(1);
    expect(actions.setSelectedBackboneRegion).toBeCalledWith(expect.anything(), new BackboneSelection(new SelectedRegion(0,0,0,0)));
    expect(actions.setDetailedBasePairRange).toBeCalledTimes(1);
    expect(actions.setDetailedBasePairRange).toBeCalledWith(expect.anything(), { start: 0, stop: 0 });
  });
});