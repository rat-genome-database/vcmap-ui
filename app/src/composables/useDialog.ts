import SyntenyRegionSet from '@/models/SyntenyRegionSet';
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

  const onError = (err: any, userMessage: string) => {
    $log.error(err);
    dialogHeader.value = 'Error';
    dialogMessage.value = userMessage;
    showDialogBackButton.value = false;
    showDialog.value = true;
  };
  
  const showNoResultsDialog = () => {
    dialogHeader.value = 'No Results';
    dialogMessage.value = 'No syntenic regions were found for the selected species and base pair range.';
    showDialogBackButton.value = true;
    showDialog.value = true;
  };
  
  const showPartialResultsDialog = (emptySets: SyntenyRegionSet[]) => {
    dialogHeader.value = 'Missing Results';
    dialogMessage.value = `We did not find syntenic regions for the following species: ${emptySets.map(s => `${s.speciesName} (${s.mapName})`).join(', ')}`;
    showDialogBackButton.value = true;
    showDialog.value = true;
  };
  
  /**
   * Checks if synteny was found for all off-backbone species/maps
   * 
   * @param syntenySets
   * @returns {boolean} true if results were found for all species/maps, false if not
   */
  const checkSyntenyResultsOnComparativeSpecies = (syntenySets: SyntenyRegionSet[]) => {
    const resultsFound = syntenySets.some(syntenySet => syntenySet.regions.length > 0);
    if (!resultsFound)
    {
      showNoResultsDialog();
      return false;
    }
    else if (syntenySets.some(syntenySet => syntenySet.regions.length === 0))
    {
      // If only some results were found -- notify user about which ones produced no results
      const emptySets = syntenySets.filter(syntenySet => syntenySet.regions.length === 0);
      showPartialResultsDialog(emptySets);
      return false;
    }

    return true;
  };

  return {
    onError, 
    checkSyntenyResultsOnComparativeSpecies,
    dialogHeader,
    dialogMessage,
    showDialog,
    showDialogBackButton,
  };
}