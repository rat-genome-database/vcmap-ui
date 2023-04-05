import BackboneSet from "@/models/BackboneSet";
import { GeneDatatrack } from "@/models/DatatrackSection";
import Gene from "@/models/Gene";
import OrthologLine from "@/models/OrthologLine";
import SyntenyRegionSet from "@/models/SyntenyRegionSet";
import { getThreshold } from "./Shared";

/**
 * Creates ortholog lines and associates them with the off-backbone SyntenyRegionSets
 * 
 * @param geneList
 *   list of all genes in memory
 * @param backboneSet
 *   backbone set
 * @param offBackboneSyntenyRegionSets
 *   array of the off-backbone synteny region sets
 */
export function createOrthologLines(geneList: Map<number, Gene>, backboneMapKey: number, backboneSet: BackboneSet, offBackboneSyntenyRegionSets: SyntenyRegionSet[])
{
  console.time(`CreateOrthologLines`);
  //
  // Prep and reorganize some of our data structures TODO: There can probably be some improvement either here or with our data models

  // Get the "on-screen" gene datatracks for the backbone
  const backboneGeneDatatracks = backboneSet.datatrackSets
    .filter(datatrackSet => datatrackSet.datatracks[0]?.type === 'gene')
    .flat()
    .map(geneSet => (geneSet.datatracks as GeneDatatrack[]))
    .flat();

  // Create of map of backbone gene rgdId to its datatrack section (these are visible genes in the viewport)
  const backboneDatatrackMap = new Map<number, GeneDatatrack>();
  backboneGeneDatatracks.forEach(d => {
    // TODO: Is it possible for there to be multiple gene datatracks for the same gene?
    backboneDatatrackMap.set(d.gene.rgdId, d);
  });

  const geneArray = Array.from(geneList.values());

  // Filter our backbone and off-backbone genes into separate groups
  // NOTE: backbone genes do not have orthologs - we'll rely on the off-backbone genes to tell us what the orthologs are
  const backboneGenes = geneArray.filter(g => g.mapKey === backboneMapKey 
    && (g.stop - g.start) >= getThreshold(backboneSet.backbone.windowStop - backboneSet.backbone.windowStart));

  offBackboneSyntenyRegionSets.forEach(set => {
    for (let regionIdx = 0; regionIdx < set.regions.length; regionIdx++)
    {
      const region = set.regions[regionIdx];
      const regionGeneDatatracks = region.datatrackSets
        .filter(datatrackSet => datatrackSet.datatracks[0]?.type === 'gene')
        .map(geneSet => (geneSet.datatracks as GeneDatatrack[]))
        .flat();

      // Create maps of gene datatracks and their RGD ID (these are visible genes in the viewport)
      const offBackboneDatatrackMap = new Map<number, GeneDatatrack>();
      regionGeneDatatracks.forEach(d => {
        // TODO: Is it possible for there to be multiple gene datatracks for the same gene?
        offBackboneDatatrackMap.set(d.gene.rgdId, d);
      });

      const offBackboneGenesWithOrthologs = region.genes.filter(g => g.orthologs.length > 0 
        && (g.stop - g.start) >= getThreshold(backboneSet.backbone.windowStop - backboneSet.backbone.windowStart));
      const orthologLines: OrthologLine[] = [];
      for (let i = 0; i < offBackboneGenesWithOrthologs.length; i++)
      {
        const gene = offBackboneGenesWithOrthologs[i];
        for (let j = 0; j < gene.orthologs.length; j++)
        {
          const orthologRgdId = gene.orthologs[j];
          const backboneGene = backboneGenes.find(g => g.rgdId === orthologRgdId);
          if (backboneGene != undefined)
          {
            const backboneGeneDatatrack = backboneDatatrackMap.get(backboneGene.rgdId);
            const offBackboneGeneDatatrack = offBackboneDatatrackMap.get(gene.rgdId);
            if (backboneGeneDatatrack != undefined && offBackboneGeneDatatrack != undefined)
            {
              // Both genes are on-screen
              // FIXME: OrthologLine model takes GeneDatatracks as params but they only exist if the gene are on-screen. Will probably need to refactor the model in some way...
              orthologLines.push(new OrthologLine({
                backboneGene: backboneGeneDatatrack,
                comparativeGene: offBackboneGeneDatatrack,
              }));
            }
            else
            {
              // FIXME: At least one gene is off-screen and will need extra processing to determien approx SVG Y position 
            }
          }
        }
      }

      region.addOrthologLines(orthologLines);
    }
  });
  console.timeEnd(`CreateOrthologLines`);
}