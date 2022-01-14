import { shallowMount } from '@vue/test-utils';
import BackboneTrackSVG from '@/components/BackboneTrackSVG.vue';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import Chromosome from '@/models/Chromosome';
import { ActionTree, createStore, Store } from 'vuex';
import { VCMapState } from '@/store';
import SVGConstants from '@/utils/SVGConstants';

const BACKBONE_BASEPAIR_TO_HEIGHT_RATIO = 1000;

describe('BackboneTrackSVG', () => {

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
    zoom: 1,
    displayStartPos: 0,
    displayStopPos: 0,
    backboneBasePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
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
    getSelectedBackboneRegion(state: VCMapState) {
      return state.selectedBackboneRegion;
    }
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

  it('renders a single section track with base pair labels', async () => {
    const backboneTrackSection = new TrackSection({
      start: 0,
      stop: 10000000,
      backboneStart: 0,
      backboneStop: 10000000,
      chromosome: '1',
      cutoff: 120000000,
      basePairToHeightRatio: 1000,
      shape: 'rect'
    });
    const backboneTrack = new Track({ speciesName: 'Human', sections: [backboneTrackSection] });
    const wrapper = shallowMount(BackboneTrackSVG, {
      props: {
        posX: 100,
        track: backboneTrack
      },
      global: {
        provide: {
          store: store
        }
      }
    });
    const startLabel = wrapper.find('[data-test="start-bp-label"]');
    const stopLabel = wrapper.find('[data-test="stop-bp-label"');
    const allSVGs = wrapper.findAll('[data-test="track-section-svg"]');
    const backboneSVG = allSVGs[0];

    // Test visibility and text of the base pair labels
    expect(startLabel.isVisible()).toBe(true);
    expect(startLabel.text()).toEqual('- 0bp');
    expect(stopLabel.isVisible()).toBe(true);
    expect(stopLabel.text()).toEqual('- 10.00Mbp');

    // Test visibility of the backbone SVG track
    expect(allSVGs.length).toEqual(1);
    expect(backboneSVG.isVisible()).toBe(true);

    // Test dimensions and color of the backbone SVG
    const backboneAttributes = backboneSVG.attributes();
    expect(backboneAttributes.fill).toEqual(Chromosome.getColor('1'));
    expect(backboneAttributes.x).toEqual('100');
    expect(backboneAttributes.y).toEqual('60');
    expect(backboneAttributes.width).toEqual(SVGConstants.trackWidth.toString());
    expect(backboneAttributes.height).toEqual((10000000 / BACKBONE_BASEPAIR_TO_HEIGHT_RATIO).toString());
  });

  it('emits selected region', async () => {
    const backboneTrackSection = new TrackSection({
      start: 0,
      stop: 10000000,
      backboneStart: 0,
      backboneStop: 10000000,
      chromosome: '1',
      cutoff: 120000000,
      basePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
      shape: 'rect'
    });
    const backboneTrack = new Track({ speciesName: 'Human', sections: [backboneTrackSection] });
    const wrapper = shallowMount(BackboneTrackSVG, {
      props: {
        posX: 100,
        track: backboneTrack,
        isSelectable: true
      },
      global: {
        provide: {
          store: store
        }
      }
    });

    // Select a region
    const section = wrapper.get('[data-test="track-section-svg"]');
    await section.trigger('mousedown');
    await section.trigger('mousemove');
    await section.trigger('mousedown');

    expect(actions.setSelectedBackboneRegion).toBeCalledTimes(1);
  });
});