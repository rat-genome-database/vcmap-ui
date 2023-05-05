import { DialogTheme } from '@/utils/Types';
import { ref } from 'vue';
import { useLogger } from 'vue-logger-plugin';

/**
 * Composable that holds all of our logic related to the VCMapDialog and whether or not it should be shown
 */
export default function useDialog() {
  const $log = useLogger();

  const showDialog = ref(false);
  const dialogHeader = ref('');
  const dialogMessage = ref('');
  const showDialogBackButton = ref(false);
  const dialogTheme = ref<DialogTheme>('normal');

  const onError = (err: any, userMessage: string, showBackButton: boolean, title?: string) => {
    $log.error(err);
    dialogHeader.value = title ?? 'Error';
    dialogMessage.value = userMessage;
    showDialogBackButton.value = showBackButton;
    dialogTheme.value = 'error';
    showDialog.value = true;
  };

  return {
    onError,
    dialogHeader,
    dialogMessage,
    showDialog,
    showDialogBackButton,
    dialogTheme,
  };
}