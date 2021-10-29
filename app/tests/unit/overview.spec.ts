import { shallowMount } from '@vue/test-utils';
import Overview from '@/components/Overview.vue';

const mockPush = jest.fn();
jest.mock('vue-router', () => ({
  useRoute: jest.fn(),
  useRouter: jest.fn(() => ({
    push: mockPush
  }))
}));

describe('Overview', () => {
  it('load new config button redirects to configuration screen', async () => {

    const wrapper = shallowMount(Overview);

    const loadButton = wrapper.get('[data-test="load-config-btn"]');
    await loadButton.trigger('click');
    expect(mockPush).toBeCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});