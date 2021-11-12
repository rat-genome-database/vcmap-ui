import { mount } from '@vue/test-utils';
import Overview from '@/components/Overview.vue';
import { VCMapState } from '@/store';
import Species from '@/models/Species';
import { createStore } from 'vuex';
import { ExternalComponentsHandler } from '@/utils/ExternalComponentsHandler';

const mockStore = createStore({
  state: {
    species: new Species({ typeKey: 1, name: 'Test Species'}),
    startPos: null,
    stopPos: null
  },
  getters: {
    getSpecies(state: VCMapState) {
      return state.species;
    }
  }
});

const mockPush = jest.fn();
jest.mock('vue-router', () => ({
  useRoute: jest.fn(),
  useRouter: jest.fn(() => ({
    push: mockPush
  }))
}));

describe('Overview', () => {
  it('load new config button redirects to configuration screen', async () => {

    const wrapper = mount(Overview, {
      global: {
        components: ExternalComponentsHandler.getComponents(),
        directives: ExternalComponentsHandler.getDirectives(),
        provide: {
          store: mockStore
        }
      }
    });

    const loadButton = wrapper.get('[data-test="load-config-btn"]');
    await loadButton.trigger('click');
    expect(mockPush).toBeCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});