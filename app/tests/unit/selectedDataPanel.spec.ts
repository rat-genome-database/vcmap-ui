import { shallowMount } from '@vue/test-utils';
import SelectedDataPanel from '@/components/SelectedDataPanel.vue';
import SelectedData from '@/models/SelectedData';
import TrackSection from '@/models/TrackSection';
import Gene from '@/models/Gene';

describe('SelectedDataPanel', () => {

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
      gene: new Gene({geneSymbol: 'TEST', geneName: 'Test 123', geneType: '', key: 0, geneRgdId: 0, chr: '1', startPos: 0, stopPos: 10000})
    });
    const selectedData = new SelectedData(section, 'trackSection');
    const wrapper = shallowMount(SelectedDataPanel, {
      props: {
        selectedData: [selectedData]
      }
    });

    const geneText = wrapper.get('[data-test="gene-name"]');

    expect(geneText.text()).toEqual('Name: Test 123');
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
    const selectedData = new SelectedData(section, 'trackSection');
    const wrapper = shallowMount(SelectedDataPanel, {
      props: {
        selectedData: [selectedData]
      }
    });

    const chromosomeText = wrapper.get('[data-test="chromosome-name"]');
    const startStopText = wrapper.get('[data-test="start-stop"]');

    expect(chromosomeText.text()).toEqual('Chromosome: 1');
    expect(startStopText.text()).toEqual('Region: 0 - 10,000');
  });
});