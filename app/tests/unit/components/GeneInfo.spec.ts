import { shallowMount } from '@vue/test-utils';
import GeneInfo from '@/components/GeneInfo.vue';
import Gene from '@/new_models/Gene';
import { TestUtils } from '../../utils/TestUtils';

const mockStore = TestUtils.initStore({});

describe('GeneInfo', () => {

  it('displays gene name if present', async () => {

    const gene = new Gene({
      speciesName: 'Test species',
      symbol: 'TEST',
      name: 'Test 123',
      rgdId: 0,
      chromosome: '1',
      start: 0,
      stop: 10000
    });

    const wrapper = shallowMount(GeneInfo, {
      props: {
        gene: gene,
        chromosome: '1',
        start: 0,
        stop: 10000,
      },
      global: TestUtils.getGlobalMountingOptions({
        includeExternalComponents: true,
        useStore: mockStore,
      }),
    });

    const geneText = wrapper.get('[data-test="gene-name"]');
    const geneSpeciesName = wrapper.get('[data-test="species-name"]');

    expect(geneText.text()).toEqual('Name: Test 123');
    expect(geneSpeciesName.text()).toEqual('Species: Test species');
  });

  it('displays data about the genomic region', async () => {
    const wrapper = shallowMount(GeneInfo, {
      props: {
        gene: null,
        chromosome: '1',
        start: 0,
        stop: 10000,
      },
      global: TestUtils.getGlobalMountingOptions({
        includeExternalComponents: true,
        useStore: mockStore,
      }),
    });

    const chromosomeText = wrapper.get('[data-test="chromosome-name"]');
    const startStopText = wrapper.get('[data-test="start-stop"]');

    expect(chromosomeText.text()).toEqual('Chromosome: 1');
    expect(startStopText.text()).toEqual('Region: 0 - 10,000');
  });
});