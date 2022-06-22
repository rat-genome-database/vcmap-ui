import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import TrackSection from '@/models/TrackSection';
// Util methods to help process and update selection info
export function getGeneOrthologIds(store: Store<VCMapState>, gene: Gene) {
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  let geneOrthologIds: number[] = [];
  if (geneOrthologs) {
    geneOrthologIds = Object.keys(geneOrthologs).map((geneKey) => geneOrthologs[geneKey][0].geneRgdId);
  }
  return geneOrthologIds;
}

export function getNewSelectedData(store: Store<VCMapState>, gene: Gene): SelectedData[] {
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
  return selectedData;
}

export function sortGeneList(geneList: TrackSection[]) {
  // for combined or hiddent gene lists, sort LOC
  // genes to end of list, otherwise sort alphabetically
  geneList.sort((geneA, geneB) => {
    const isGeneALOC = geneA.gene?.symbol.startsWith('LOC') || false;
    const isGeneBLOC = geneB.gene?.symbol.startsWith('LOC') || false;
    if (isGeneALOC && isGeneBLOC) {
      const geneASymbol = geneA.gene?.symbol.toLowerCase() || '';
      const geneBSymbol = geneB.gene?.symbol.toLowerCase() || '';
      return (geneASymbol < geneBSymbol) ? -1 : (geneASymbol > geneBSymbol) ? 1 : 0;
    }
    else if (isGeneALOC) {
      return 1;
    }
    else if (isGeneBLOC) {
      return -1;
    }
    const geneASymbol = geneA.gene?.symbol.toLowerCase() || '';
    const geneBSymbol = geneB.gene?.symbol.toLowerCase() || '';
    return (geneASymbol < geneBSymbol) ? -1 : (geneASymbol > geneBSymbol) ? 1 : 0;
  });
}