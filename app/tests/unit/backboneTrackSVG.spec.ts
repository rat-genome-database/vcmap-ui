import { shallowMount } from '@vue/test-utils';
import BackboneTrackSVG from '@/components/BackboneTrackSVG.vue';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import Chromosome from '@/models/Chromosome';
import { ActionTree, createStore, Store } from 'vuex';
import { VCMapState } from '@/store';
import SVGConstants from '@/utils/SVGConstants';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';

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
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),
    detailedBasePairRange: { start: 0, stop: 0 },
    displayStartPos: 0,
    displayStopPos: 0,
    overviewBasePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
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
    const backboneTrack = new Track({ speciesName: 'Human', sections: [backboneTrackSection], startingSVGY: SVGConstants.panelTitleHeight });
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
    const bpLabels = wrapper.findAll('[data-test="bp-label"]');
    const allSVGs = wrapper.findAll('[data-test="track-section-svg"]');
    const backboneSVG = allSVGs[0];

    // Test visibility and text of the base pair labels
    expect(bpLabels[0].isVisible()).toBe(true);
    expect(bpLabels[0].text()).toEqual('0bp');
    expect(bpLabels[1].isVisible()).toBe(true);
    expect(bpLabels[1].text()).toEqual('10.00Mbp');

    // Test visibility of the backbone SVG track
    expect(allSVGs.length).toEqual(1);
    expect(backboneSVG.isVisible()).toBe(true);

    // Test dimensions and color of the backbone SVG
    const backboneAttributes = backboneSVG.attributes();
    expect(backboneAttributes.fill).toEqual(Chromosome.getColor('1'));
    expect(backboneAttributes.x).toEqual('100');
    expect(backboneAttributes.y).toEqual('55');
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
    const backboneTrack = new Track({ speciesName: 'Human', sections: [backboneTrackSection], startingSVGY: SVGConstants.panelTitleHeight });
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
    const section = wrapper.get('[data-test="selectable-svg"]');
    await section.trigger('mousedown');
    await section.trigger('mousemove');
    await section.trigger('mouseup');

    expect(actions.setSelectedBackboneRegion).toBeCalledTimes(1);
  });
});