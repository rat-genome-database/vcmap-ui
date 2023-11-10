import { mount } from '@vue/test-utils';
import HeaderPanel from '@/components/HeaderPanel.vue';
import Species from '@/models/Species';
import Map from '@/models/SpeciesMap';
import { TestUtils } from '../../utils/TestUtils';
import Chromosome from '@/models/Chromosome';

const mockStore = TestUtils.initStore({
  species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1, maps: [new Map({ key: 1, primaryRefAssembly: true, name: 'GRCh38'})]}),
  comparativeSpecies: [
    new Species({ typeKey: 2, name: 'Test Species 2', defaultMapKey: 2, maps: [new Map({ key: 2, primaryRefAssembly: true, name: 'GRCh37'})] }), 
    new Species({ typeKey: 3, name: 'Test Species 3', defaultMapKey: 3, maps: [new Map({ key: 3, primaryRefAssembly: true, name: 'GRCh36'})] })
  ],
  chromosome: new Chromosome ({ 'mapKey': 0, 'chromosome':'T', 'seqLength': 100 }),
});

const mockPush = jest.fn();
jest.mock('vue-router', () => ({
  useRoute: jest.fn(),
  useRouter: jest.fn(() => ({
    push: mockPush
  }))
}));

describe('HeaderPanel', () => {
  it('load new config button redirects to configuration screen', async () => {

    const wrapper = mount(HeaderPanel, {
      global: TestUtils.getGlobalMountingOptions({
        includeExternalComponents: true,
        includeDirectives: true,
        includeLogger: true,
        useStore: mockStore,
      }),
    });

    const newConfigBtn = wrapper.get('[data-test="new-config-btn"]');

    // Check that router-link is configured to open up a new tab and take us to the correct route
    expect(newConfigBtn.html()).toContain(`to="/"`);
    expect(newConfigBtn.html()).toContain(`target="_blank"`);
  });
});