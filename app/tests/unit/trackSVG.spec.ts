import { shallowMount } from '@vue/test-utils';
import TrackSVG from '@/components/TrackSVG.vue';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import Chromosome from '@/models/Chromosome';
import { ActionTree, createStore, Store } from 'vuex';
import { VCMapState } from '@/store';

const BACKBONE_BASEPAIR_TO_HEIGHT_RATIO = 1000;

describe('TrackSVG', () => {

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
    backboneBasePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
    backboneSyntenyThreshold: 0,
    comparativeBasePairToHeightRatio: 1000,
    comparativeSyntenyThreshold: 0,
    showOverviewGaps: false,
    showDetailsGaps: false,
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
    const backboneTrack = new Track('Human', [backboneTrackSection]);
    const wrapper = shallowMount(TrackSVG, {
      props: {
        showStartStop: true,
        posX: 100,
        posY: 150,
        width: 30,
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
    expect(backboneAttributes.y).toEqual('150');
    expect(backboneAttributes.width).toEqual('30');
    expect(backboneAttributes.height).toEqual((10000000 / BACKBONE_BASEPAIR_TO_HEIGHT_RATIO).toString());
  });

  it('renders a track with multiple sections', async () => {
    const trackSection1 = new TrackSection({
      start: 20000000,
      stop: 30000000,
      backboneStart: 0,
      backboneStop: 10000000,
      chromosome: '1',
      cutoff: 300000000,
      offsetCount: 0,
      basePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
      shape: 'rect'
    });
    const trackSection2 = new TrackSection({
      start: 45000000,
      stop: 60000000,
      backboneStart: 20000000,
      backboneStop: 35000000,
      chromosome: '2',
      cutoff: 300000000,
      offsetCount: 10000000,
      basePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
      shape: 'rect'
    });
    const trackSection3 = new TrackSection({
      start: 125000000,
      stop: 275000000,
      backboneStart: 50000000,
      backboneStop: 200000000,
      chromosome: '3',
      cutoff: 300000000,
      offsetCount: 15000000,
      basePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
      shape: 'rect'
    });
    const track = new Track('Rat', [trackSection1, trackSection2, trackSection3]);

    const wrapper = shallowMount(TrackSVG, {
      props: {
        posX: 100,
        posY: 150,
        width: 30,
        track: track
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
    const section1 = allSVGs[0];
    const section2 = allSVGs[1];
    const section3 = allSVGs[2];

    // Test visibility and text of the base pair labels
    expect(startLabel.exists()).toBeFalsy();
    expect(stopLabel.exists()).toBeFalsy();

    // Test visibility of the backbone SVG track
    expect(allSVGs.length).toEqual(3);
    expect(section1.isVisible()).toBe(true);
    expect(section2.isVisible()).toBe(true);
    expect(section3.isVisible()).toBe(true);

    // Test dimensions and colors of the different sections
    const attrs1 = section1.attributes();
    expect(attrs1.fill).toEqual(Chromosome.getColor('1'));
    expect(attrs1.x).toEqual('100');
    expect(attrs1.y).toEqual('150'); // Determined by starting position + height of previous section + offset of current section
    expect(attrs1.width).toEqual('30');
    expect(attrs1.height).toEqual((10000000 / BACKBONE_BASEPAIR_TO_HEIGHT_RATIO).toString()); // Determined by BASE_PAIR_TO_PIXEL_RATIO in TrackSection model

    const attrs2 = section2.attributes();
    expect(attrs2.fill).toEqual(Chromosome.getColor('2'));
    expect(attrs2.x).toEqual('100');
    const expectedAttrs2Y = (parseInt(attrs1.y) + parseInt(attrs1.height) + (10000000 / BACKBONE_BASEPAIR_TO_HEIGHT_RATIO)).toString();
    expect(attrs2.y).toEqual(expectedAttrs2Y); // Determined by starting position + height of previous section + offset of current section
    expect(attrs2.width).toEqual('30');
    expect(attrs2.height).toEqual((15000000 / BACKBONE_BASEPAIR_TO_HEIGHT_RATIO).toString()); // Determined by BASE_PAIR_TO_PIXEL_RATIO in TrackSection model

    const attrs3 = section3.attributes();
    expect(attrs3.fill).toEqual(Chromosome.getColor('3'));
    expect(attrs3.x).toEqual('100');
    const expectedAttrs3Y = (parseInt(attrs2.y) + parseInt(attrs2.height) + (15000000 / BACKBONE_BASEPAIR_TO_HEIGHT_RATIO)).toString();
    expect(attrs3.y).toEqual(expectedAttrs3Y); // Determined by starting position + height of previous section + offset of current section
    expect(attrs3.width).toEqual('30');
    expect(attrs3.height).toEqual((150000000 / BACKBONE_BASEPAIR_TO_HEIGHT_RATIO).toString()); // Determined by BASE_PAIR_TO_PIXEL_RATIO in TrackSection model
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
    const backboneTrack = new Track('Human', [backboneTrackSection]);
    const wrapper = shallowMount(TrackSVG, {
      props: {
        showStartStop: true,
        posX: 100,
        posY: 150,
        width: 30,
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