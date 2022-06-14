import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { Store } from "vuex";
import { VCMapState } from "@/store";
// Util methods to help process and update selection info
export function getGeneOrthologIds(store: Store<VCMapState>, gene: Gene) {
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  let geneOrthologIds: number[] = [];
  if (geneOrthologs) {
    geneOrthologIds = Object.keys(geneOrthologs).map((geneKey) => geneOrthologs[geneKey][0].geneRgdId);
  }
  return geneOrthologIds;
}

export function updateSelectedData(store: Store<VCMapState>, gene: Gene) {
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  const comparativeSpecies = store.state.comparativeSpecies;
  const compSpeciesNameMap = new Map<Number, string>();
  comparativeSpecies.forEach((species: any) => compSpeciesNameMap.set(species.activeMap.key, species.name));
  const selectedData = [new SelectedData(gene, 'Gene')];
  if (geneOrthologs) {
    const geneKeys = Object.keys(geneOrthologs);
    for (let i = 0; i < geneKeys.length; i++) {
      const ortholog = new Gene({
        ...geneOrthologs[geneKeys[i]][0],
        speciesName: compSpeciesNameMap.get(parseInt(geneKeys[i], 10))
      });
      selectedData.push(new SelectedData(ortholog, 'Gene'));
    }
  }
  store.dispatch('setSelectedData', selectedData);
}