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

export function getNewSelectedData(store: Store<VCMapState>, gene: Gene): {rgdIds: number[], selectedData: SelectedData[]} {
  const backboneSpecies = store.state.species?.name || '';
  const geneSpecies = gene.speciesName || '';
  const comparativeSpecies = store.state.comparativeSpecies;
  const compSpeciesNameMap = new Map<Number, string>();
  comparativeSpecies.forEach((species: any) => compSpeciesNameMap.set(species.activeMap.key, species.name));
  let geneOrthologs: any;
  let selectedData: SelectedData[];
  let rgdIds: number[];
  // If the selected gene is on the backbone, just search the ortholog data and set the new data
  if (geneSpecies === backboneSpecies) {
    geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
    selectedData = [new SelectedData(gene, 'Gene')];
    rgdIds = [gene.rgdId, ...getGeneOrthologIds(store, gene)];
  } else { // otherwise we'll search the ortholog data if there's an ortholog matching this gene
    // get the mapKey from the selected gene
    const mapKey = [...compSpeciesNameMap].filter(entry => entry[1] === geneSpecies).map(entry => entry[0]);
    // Check if there is a backone ortholog
    const orthologResult = getOrthologsFromComparativeSpecies(store, gene, mapKey[0]);
    geneOrthologs = orthologResult.orthologData;
    const backboneSymbol = orthologResult.backboneSymbol;
    // Check if we have the backbone gene loaded
    const backboneGene = store.state.loadedGenes.find((gene) => gene.symbol === backboneSymbol);
    // If the backbone gene is loaded, set that selected data, otherwise, just set the selected gene
    selectedData = backboneGene ? [new SelectedData(backboneGene, 'Gene')] : [new SelectedData(gene, 'Gene')];
    rgdIds = backboneGene ? [gene.rgdId, ...getGeneOrthologIds(store, backboneGene)] : [gene.rgdId];
  }
  // Go through the ortholog data for the backbone gene if it exists,
  // and update the selected data object with the ortholog genes
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
  return {rgdIds: rgdIds, selectedData: selectedData} ;
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

function getOrthologsFromComparativeSpecies(store: Store<VCMapState>, gene: Gene, mapKey: Number) {
  const orthologData = store.state.selectedBackboneRegion.orthologData;
  // Iterate through the entries in the orthologData map
  const backboneOrthologKey = [...orthologData.entries()]
      // Filter for an ortholog matching the selected gene's symbol
      .filter((entry: any) => {
        // Use the mapKey for this gene to only search the relevant ortholog results
        if (entry[1][mapKey.toString()]) {
          const orthologGeneIdx = entry[1][mapKey.toString()]
            .find((ortholog: any) => ortholog.geneSymbol === gene.symbol) || -1;
          return orthologGeneIdx !== -1;
        } else {
          return false;
        }
      })
      // And then map for the symbol (key) of the backbone gene
      .map((entry: any) => entry[0]);

  // return the symbol for the backbone gene and the ortholog data
  return {backboneSymbol: backboneOrthologKey[0], orthologData: orthologData.get(backboneOrthologKey[0])};
}