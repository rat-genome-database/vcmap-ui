import { shallowMount } from '@vue/test-utils';
import TrackSVG from '@/components/TrackSVG.vue';
import TrackSection from '@/models/TrackSection';
import Track from '@/models/Track';

describe('TrackSVG', () => {
  it('correctly renders single section track with base pair labels', async () => {

    const backboneTrackSection = new TrackSection(0, 10000000, 'green');
    const backboneTrack = new Track('Human', [backboneTrackSection]);
    const wrapper = shallowMount(TrackSVG, {
      props: {
        showStartStop: true,
        posX: 100,
        posY: 150,
        width: 30,
        track: backboneTrack
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
    expect(backboneAttributes.fill).toEqual('green');
    expect(backboneAttributes.x).toEqual('100');
    expect(backboneAttributes.y).toEqual('150');
    expect(backboneAttributes.width).toEqual('30');
    expect(backboneAttributes.height).toEqual('40'); // Determined by BASE_PAIR_TO_PIXEL_RATIO in TrackSection model
  });

  it('correctly renders track with multiple sections', async () => {

    const trackSection1 = new TrackSection(0, 10000000, 'green', 0);
    const trackSection2 = new TrackSection(20000000, 35000000, 'blue', 5000000);
    const trackSection3 = new TrackSection(50000000, 200000000, 'yellow', 15000000);
    const track = new Track('Rat', [trackSection1, trackSection2, trackSection3]);

    const wrapper = shallowMount(TrackSVG, {
      props: {
        posX: 100,
        posY: 150,
        width: 30,
        track: track
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
    expect(attrs1.fill).toEqual('green');
    expect(attrs1.x).toEqual('100');
    expect(attrs1.y).toEqual('150'); // Determined by starting position + height of previous section + offset of current section
    expect(attrs1.width).toEqual('30');
    expect(attrs1.height).toEqual('40'); // Determined by BASE_PAIR_TO_PIXEL_RATIO in TrackSection model

    const attrs2 = section2.attributes();
    expect(attrs2.fill).toEqual('blue');
    expect(attrs2.x).toEqual('100');
    expect(attrs2.y).toEqual('210'); // Determined by starting position + height of previous section + offset of current section
    expect(attrs2.width).toEqual('30');
    expect(attrs2.height).toEqual('60'); // Determined by BASE_PAIR_TO_PIXEL_RATIO in TrackSection model

    const attrs3 = section3.attributes();
    expect(attrs3.fill).toEqual('yellow');
    expect(attrs3.x).toEqual('100');
    expect(attrs3.y).toEqual('330'); // Determined by starting position + height of previous section + offset of current section
    expect(attrs3.width).toEqual('30');
    expect(attrs3.height).toEqual('600'); // Determined by BASE_PAIR_TO_PIXEL_RATIO in TrackSection model
  });
});