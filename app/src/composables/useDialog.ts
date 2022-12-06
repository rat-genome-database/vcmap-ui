import SyntenyRegionSet from '@/new_models/SyntenyRegionSet';
import { ref } from 'vue';

/**
 * Composable that holds all of our logic related to the VCMapDialog and whether or not it should be shown
 */
export default function useDialog() {
  const showDialog = ref(false);
  const dialogHeader = ref('');
  const dialogMessage = ref('');

  const onError = (err: any, userMessage: string) => {
    console.error(err);
    dialogHeader.value = 'Error';
    dialogMessage.value = userMessage;
    showDialog.value = true;
  };
  
  const showNoResultsDialog = () => {
    dialogHeader.value = 'No Results';
    dialogMessage.value = 'No syntenic regions were found for the selected species and base pair range.';
    showDialog.value = true;
  };
  
  const showPartialResultsDialog = (emptySets: SyntenyRegionSet[]) => {
    dialogHeader.value = 'Missing Results';
    dialogMessage.value = `We did not find syntenic regions for the following species: ${emptySets.map(s => `${s.speciesName} (${s.mapName})`).join(', ')}`;
    showDialog.value = true;
  };
  
  const checkSyntenyResultsOnComparativeSpecies = (syntenySets: SyntenyRegionSet[]) => {
    const resultsFound = syntenySets.some(syntenySet => syntenySet.regions.length > 0);
      if (!resultsFound)
      {
        showNoResultsDialog();
      }
      else if (syntenySets.some(syntenySet => syntenySet.regions.length === 0))
      {
        // If only some results were found -- notify user about which ones produced no results
        const emptySets = syntenySets.filter(syntenySet => syntenySet.regions.length === 0);
        showPartialResultsDialog(emptySets);
      }
  };

  return {
    onError, 
    checkSyntenyResultsOnComparativeSpecies,
    dialogHeader,
    dialogMessage,
    showDialog
  };
}