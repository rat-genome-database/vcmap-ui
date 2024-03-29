import { shallowMount } from '@vue/test-utils';
import GeneInfo from '@/components/GeneInfo.vue';
import Gene from '@/models/Gene';
import { TestUtils } from '../../utils/TestUtils';

const mockStore = TestUtils.initStore({});

describe('GeneInfo', () => {

  it('displays gene name if present', async () => {

    const gene = new Gene({
      mapKey: 1,
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

    expect(geneText.text()).toEqual('(Test 123)');
    expect(geneSpeciesName.text()).toEqual('Test species');
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

    expect(chromosomeText.text()).toEqual('Chr1:');
    expect(startStopText.text()).toEqual('0 - 10,000');
  });
});