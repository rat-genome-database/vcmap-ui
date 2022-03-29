import { shallowMount } from '@vue/test-utils';
import TrackSVG from '@/components/TrackSVG.vue';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';
import Chromosome from '@/models/Chromosome';
import { ActionTree, createStore, Store } from 'vuex';
import { key, VCMapState } from '@/store';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import SVGConstants from '@/utils/SVGConstants';

const BACKBONE_BASEPAIR_TO_HEIGHT_RATIO = 1000;

describe('TrackSVG', () => {

  let store: Store<VCMapState>;
  const state = {
    species: null,
    chromosomeNum: null,
    chromosome: null,
    startPos: 0,
    stopPos: 0,
    gene: null,
    comparativeSpecies: [],
    selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),
    detailedBasePairRange: { start: 0, stop: 0 },
    overviewBasePairToHeightRatio: BACKBONE_BASEPAIR_TO_HEIGHT_RATIO,
    overviewSyntenyThreshold: 0,
    detailedBasePairToHeightRatio: 1000,
    detailsSyntenyThreshold: 0,
    backboneDataTracks: [],
    configTab: 0,
    selectedData: null,
    isDetailedPanelUpdating: false,
    isOverviewPanelUpdating: false,
  };

  beforeEach(() => {
    store = createStore({
      state
    });
  });

  it('renders a single section track with base pair labels', async () => {
    const trackSection = new TrackSection({
      start: 0,
      stop: 10000000,
      backboneStart: 0,
      backboneStop: 10000000,
      chromosome: '1',
      cutoff: 120000000,
      basePairToHeightRatio: 1000,
      shape: 'rect'
    });
    const track = new Track({ speciesName: 'Human', sections: [trackSection], startingSVGY: SVGConstants.panelTitleHeight, type: 'comparative' });
    const wrapper = shallowMount(TrackSVG, {
      props: {
        showStartStop: true,
        posX: 100,
        width: 30,
        track: track
      },
      global: {
        provide: {
          [key as symbol]: store
        }
      }
    });
    const bpLabels = wrapper.findAll('[data-test="bp-label"]');
    const allSVGs = wrapper.findAll('[data-test="track-section-svg"]');
    const backboneSVG = allSVGs[0];

    // Test visibility and text of the base pair labels
    expect(bpLabels[0].isVisible()).toBe(true);
    expect(bpLabels[0].text()).toEqual('- 0.00Mbp');
    expect(bpLabels[1].isVisible()).toBe(true);
    expect(bpLabels[1].text()).toEqual('- 10.00Mbp');

    // Test visibility of the backbone SVG track
    expect(allSVGs.length).toEqual(1);
    expect(backboneSVG.isVisible()).toBe(true);

    // Test dimensions and color of the backbone SVG
    const backboneAttributes = backboneSVG.attributes();
    expect(backboneAttributes.fill).toEqual(Chromosome.getColor('1'));
    expect(backboneAttributes.x).toEqual('100');
    expect(backboneAttributes.y).toEqual('55');
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
    const track = new Track({ speciesName: 'Rat', sections: [trackSection1, trackSection2, trackSection3], startingSVGY: SVGConstants.panelTitleHeight, type: 'comparative' });

    const wrapper = shallowMount(TrackSVG, {
      props: {
        posX: 100,
        width: 30,
        track: track
      },
      global: {
        provide: {
          [key as symbol]: store
        }
      }
    });
    const bpLabels = wrapper.findAll('[data-test="bp-label"]');
    const allSVGs = wrapper.findAll('[data-test="track-section-svg"]');
    const section1 = allSVGs[0];
    const section2 = allSVGs[1];
    const section3 = allSVGs[2];

    // Test visibility and text of the base pair labels
    expect(bpLabels.length).toEqual(0);

    // Test visibility of the backbone SVG track
    expect(allSVGs.length).toEqual(3);
    expect(section1.isVisible()).toBe(true);
    expect(section2.isVisible()).toBe(true);
    expect(section3.isVisible()).toBe(true);

    // Test dimensions and colors of the different sections
    const attrs1 = section1.attributes();
    expect(attrs1.fill).toEqual(Chromosome.getColor('1'));
    expect(attrs1.x).toEqual('100');
    expect(attrs1.y).toEqual('55'); // Determined by starting position + height of previous section + offset of current section
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
});