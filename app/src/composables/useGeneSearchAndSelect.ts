import { BasePairRange } from "@/models/BackboneSelection";
import Chromosome from "@/models/Chromosome";
import Gene from "@/models/Gene";
import { VCMapState } from "@/store";
import { adjustSelectionWindow } from "@/utils/DataPanelHelpers";
import { Store } from "vuex";

const MAX_SEARCH_ITERS = 5;

export default function useGeneSearchAndSelect(
  store: Store<VCMapState>,
) {
  
  const getWindowBasePairRangeForGene = async (
    queryForSyntenyFunction: (chr: Chromosome, windowStart: number, windowStop: number, geneMapKey: number) => Promise<void>,
    backboneChromosome: Chromosome,
    geneRgdId: number,
    geneList: Map<number, Gene>
  ): Promise<BasePairRange | undefined> => {
    // Adapatively generate the newWindow based on the searched gene and its new position
    // when the zoom is increased
    let newWindow: BasePairRange | undefined;
    for (let i = 0; i < MAX_SEARCH_ITERS; i++) {
      // This backboneStart and backboneStop of this gene should be continuously updated as the resolution of the region changes
      const searchedGene = geneList.get(geneRgdId);
      if (searchedGene == null) {
        break;
      }

      newWindow = adjustSelectionWindow(searchedGene, geneList, store);
      // Get new synteny blocks based on the newWindow to check the location of searched gene
      await queryForSyntenyFunction(backboneChromosome, newWindow.start, newWindow.stop, searchedGene.mapKey);
      // After the gene is updated, check if it is within the new window
      if (searchedGene && searchedGene.backboneStart > newWindow.start && searchedGene.backboneStop < newWindow.stop) {
        break;
      }
    }

    return newWindow;
  };

  return {
    getWindowBasePairRangeForGene,
  };
}