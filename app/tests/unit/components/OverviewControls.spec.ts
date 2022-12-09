import { mount } from '@vue/test-utils';
import OverviewControls from '@/components/OverviewControls.vue';
import Species from '@/new_models/Species';
import Map from '@/new_models/SpeciesMap';
import { key, VCMapState } from '@/store';
import { ActionTree, createStore, Store } from 'vuex';
import Chromosome from '@/models/Chromosome';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';


describe('OverviewControls', () => {
  let store: Store<VCMapState>;
  let actions: ActionTree<VCMapState, VCMapState>;
  const state = {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1, maps: [new Map({ key: 1, primaryRefAssembly: true, name: 'GRCh38'})]}),
    chromosome: new Chromosome({ chromosome: '1', mapKey: 38, seqLength: 1000000, gapCount: 5, gapLength: 10000, contigCount: 100, ordinalNumber: 1 }),
    startPos: 1,
    stopPos: 10000,
    loadStart: null,
    loadStop: null,
    loadedGeneSections: [],
    gene: null,
    comparativeSpecies: [],
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(50,100,100,10000)),
    detailedBasePairRange: { start: 0, stop: 0 },
    overviewBasePairToHeightRatio: 1000,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
    backboneDataTracks: [],
    configTab: 0,
    selectedGeneIds: [],
    selectedData: null,
    loadedGenes: [],
    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,
  };

  beforeEach(() => {
    actions = {
      clearBackboneSelection: jest.fn(),
    };

    store = createStore({
      state,
      actions
    });
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
    expect(speciesText.text()).toBe('Test Species chr1:0-1,000,000');
  });
});