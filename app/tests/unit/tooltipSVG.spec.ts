import { shallowMount } from '@vue/test-utils';
import TooltipSVG from '@/components/TooltipSVG.vue';
import TooltipData from '@/models/TooltipData';
import TrackSection from '@/models/TrackSection';

describe('TooltipSVG', () => {

  it('displays gene name if present', async () => {
    const section = new TrackSection({
      start: 0,
      stop: 10000,
      backboneStart: 0,
      backboneStop: 10000,
      chromosome: '1',
      cutoff: 50000,
      basePairToHeightRatio: 100,
      shape: 'rect',
      gene: 'Test 123'
    });
    const tooltipData = new TooltipData(0, 0, section);
    const wrapper = shallowMount(TooltipSVG, {
      props: {
        tooltipData: tooltipData
      }
    });

    const geneTextSVG = wrapper.get('[data-test="gene-name"]');

    expect(geneTextSVG.text()).toEqual('Gene: Test 123');
  });

  it('displays data about the genomic region', async () => {
    const section = new TrackSection({
      start: 0,
      stop: 10000,
      backboneStart: 0,
      backboneStop: 10000,
      chromosome: '1',
      cutoff: 50000,
      basePairToHeightRatio: 100,
      shape: 'rect',
    });
    const tooltipData = new TooltipData(0, 0, section);
    const wrapper = shallowMount(TooltipSVG, {
      props: {
        tooltipData: tooltipData
      }
    });

    const chromosomeTextSVG = wrapper.get('[data-test="chromosome-name"]');
    const startStopTextSVG = wrapper.get('[data-test="start-stop"]');

    expect(chromosomeTextSVG.text()).toEqual('Chromosome: 1');
    expect(startStopTextSVG.text()).toEqual('Region: 0bp - 10.00Kbp');
  });

  it('expands its width if gene name is long', async () => {
    const section = new TrackSection({
      start: 0,
      stop: 10000,
      backboneStart: 0,
      backboneStop: 10000,
      chromosome: '1',
      cutoff: 50000,
      basePairToHeightRatio: 100,
      shape: 'rect',
      gene: 'This is a really long test gene name'
    });
    const tooltipData = new TooltipData(0, 0, section);
    const wrapper = shallowMount(TooltipSVG, {
      props: {
        tooltipData: tooltipData
      }
    });

    const tooltipSVG = wrapper.get('[data-test="tooltip-data-svg"]');
    // 120 is the default width in the TooltipSVG component
    expect(parseInt(tooltipSVG.attributes().width)).toBeGreaterThan(120);
  });
});