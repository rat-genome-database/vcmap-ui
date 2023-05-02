import logger from "@/logger";
import BackboneSet from "@/models/BackboneSet";
import { GeneDatatrack } from "@/models/DatatrackSection";
import Gene from "@/models/Gene";
import OrthologLine from "@/models/OrthologLine";
import SelectedData from "@/models/SelectedData";
import SyntenyRegionSet from "@/models/SyntenyRegionSet";
import { calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment, getDetailedPanelXPositionForBackboneDatatracks, getDetailedPanelXPositionForDatatracks, getThreshold } from "./Shared";
import SVGConstants from "./SVGConstants";

type OrthologPositionInfo = {
  order: number;
  startX: number;
  endX: number;
};

export function createOrthologLines(geneList: Map<number, Gene>, backboneSet: BackboneSet, offBackboneSyntenyRegionSets: SyntenyRegionSet[])
{ 
  logger.time(`CreateOrthologLines`);

  logger.time(`Ortholog Line Data Prep`);
  //
  // Draw ortholog lines for backbone genes that are large enough to be rendered
  const threshold = getThreshold(backboneSet.backbone.windowStop - backboneSet.backbone.windowStart);
  const visibleBackboneGenesWithOrthologs = Array.from(geneList.values())
    .filter(g => g.mapKey === backboneSet.mapKey && g.orthologs.length > 0 && (g.backboneStop - g.backboneStart) >= threshold);

  //
  // Keep track of species order and gene datatrack positional values by map key:
  const speciesPositionMap: Map<number, OrthologPositionInfo> = new Map();
  const backboneGeneStartX = getDetailedPanelXPositionForBackboneDatatracks(backboneSet.backbone.posX2, backboneSet.geneDatatrackSetIndex);
  speciesPositionMap.set(backboneSet.mapKey, {
    order: 0,
    startX: backboneGeneStartX,
    endX: backboneGeneStartX + SVGConstants.dataTrackWidth,
  });
  offBackboneSyntenyRegionSets.forEach(set => {
    const geneStartX = getDetailedPanelXPositionForDatatracks(set.order, set.geneDatatrackSetIndex);
    const geneEndX = geneStartX + SVGConstants.dataTrackWidth;
    speciesPositionMap.set(set.mapKey, {
      order: set.order,
      startX: geneStartX,
      endX: geneEndX,
    });
  });

  // Get the "on-screen" gene datatracks for the backbone
  const backboneGeneDatatracks = backboneSet.datatrackSets
    .filter(datatrackSet => datatrackSet.datatracks[0]?.type === 'gene')
    .flat()
    .map(geneSet => (geneSet.datatracks as GeneDatatrack[]))
    .flat();

  // Create of map of gene RGD ID to GeneDatatrack models (not all genes will have these -- only visible genes in the viewport)
  const geneDatatrackMap = new Map<number, GeneDatatrack>();
  backboneGeneDatatracks.forEach(d => {
    geneDatatrackMap.set(d.gene.rgdId, d);
  });

  offBackboneSyntenyRegionSets.forEach(set => {
    for (let regionIdx = 0; regionIdx < set.regions.length; regionIdx++)
    {
      const region = set.regions[regionIdx];
      const regionGeneDatatracks = region.datatrackSets
        .filter(datatrackSet => datatrackSet.datatracks[0]?.type === 'gene')
        .map(geneSet => (geneSet.datatracks as GeneDatatrack[]))
        .flat();

      // Get all genes with datatrack sections (these are visible in the detailed panel)
      regionGeneDatatracks.forEach(dt => {
        geneDatatrackMap.set(dt.gene.rgdId, dt);
      });
    }
  });
  logger.timeEnd(`Ortholog Line Data Prep`);

  logger.time(`Ortholog Line Creation`);
  //
  // Loop through backbone genes with orthologs and create lines
  const orthologLines: OrthologLine[] = [];
  const orthologChains: Array<Map<number, Gene[]>> = [];
  visibleBackboneGenesWithOrthologs.forEach(backboneGene => {
    const orthologs: Gene[] = [];
    backboneGene.orthologs.forEach(rgdId => {
      const ortholog = geneList.get(rgdId);
      if (ortholog)
        orthologs.push(ortholog);
    });

    // Place the orthologs in this map according to what "order" they appear in
    const orthologOrderMap: Map<number, Gene[]> = new Map();
    orthologOrderMap.set(0, [backboneGene]);
    // Sort orthologs by species set order
    orthologs.sort((a, b) => {
      const positionInfoA = speciesPositionMap.get(a.mapKey);
      const positionInfoB = speciesPositionMap.get(b.mapKey);
      if (!positionInfoA || !positionInfoB)
      {
        return 0;
      }

      return positionInfoA.order - positionInfoB.order;
    })
    .forEach(o => {
      const order = speciesPositionMap.get(o.mapKey)?.order;
      
      if (order == null)
      {
        logger.error(`No order was returned from speciesPositionMap for ortholog gene rgdId: ${o.rgdId}`);
        return;
      }

      if (!orthologOrderMap.has(order))
      {
        orthologOrderMap.set(order, [o]);
      }
      else
      {
        orthologOrderMap.get(order)?.push(o);
      }
    });

    if (orthologOrderMap.size > 1)
    {
      orthologChains.push(orthologOrderMap);
    }
  });

  const MAX_ORDER = offBackboneSyntenyRegionSets.length;
  const WINDOW_START = backboneSet.backbone.windowStart;
  const WINDOW_STOP = backboneSet.backbone.windowStop;
  orthologChains.forEach(chain => {
    let prevGenes: Gene[] = [];
    const chainLines: OrthologLine[] = [];
    for (let i = 0; i <= MAX_ORDER; i++)
    {
      const genes = chain.get(i);
      if (genes == null)
      {
        continue;
      }

      if (prevGenes.length === 0)
      {
        prevGenes.push(...genes);
        continue;
      }

      // Create ortholog lines from prevGenes to current genes
      prevGenes.forEach(prevGene => {
        genes.forEach(currGene => {
          if (isOrthologLineInView(prevGene, currGene, WINDOW_START, WINDOW_STOP))
          {
            chainLines.push(new OrthologLine({
              startGene: prevGene.clone(),
              endGene: currGene.clone(),
              x1: speciesPositionMap.get(prevGene.mapKey)?.endX ?? 0,
              x2: speciesPositionMap.get(currGene.mapKey)?.startX ?? 0,
              y1: calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment(prevGene.backboneStart, prevGene.backboneStop, WINDOW_START, WINDOW_STOP),
              y2: calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment(currGene.backboneStart, currGene.backboneStop, WINDOW_START, WINDOW_STOP),
              startGeneDatatrack: geneDatatrackMap.get(prevGene.rgdId),
              endGeneDatatrack: geneDatatrackMap.get(currGene.rgdId),
            }));
          }
        });
      });

      prevGenes = genes;
    }

    // Add associations to all other ortholog lines in the same chain
    for (let i = 0; i < chainLines.length; i++)
    {
      chainLines[i].chainedOrthologLines = chainLines
        .filter(l => l.startGene.rgdId !== chainLines[i].startGene.rgdId || l.endGene.rgdId !== chainLines[i].endGene.rgdId);
    }
    
    orthologLines.push(...chainLines);
  });
  logger.timeEnd(`Ortholog Line Creation`);
  logger.timeEnd(`CreateOrthologLines`);

  return orthologLines;
}

export function isOrthologLineInView(geneA: Gene, geneB: Gene, visibleBackboneStart: number, visibleBackboneStop: number)
{
  // Get backbone start/stops of each gene -- if backboneStart or backboneStop is missing, assume it's a backbone gene
  // and use the regular start/stop of the gene
  const geneABackboneStart = geneA.backboneStart ?? geneA.start;
  const geneABackboneStop = geneA.backboneStop ?? geneA.stop;
  const geneBBackboneStart = geneB.backboneStart ?? geneB.start;
  const geneBBackboneStop = geneB.backboneStop ?? geneB.stop;

  // Test if any part of either gene is inside of the bp range
  if (isInBPRange(geneABackboneStart, visibleBackboneStart, visibleBackboneStop)
    || isInBPRange(geneABackboneStop, visibleBackboneStart, visibleBackboneStop)
    || isInBPRange(geneBBackboneStart, visibleBackboneStart, visibleBackboneStop)
    || isInBPRange(geneBBackboneStop, visibleBackboneStart, visibleBackboneStop))
  {
    return true;
  }

  // Test if either gene includes the bp range
  if ((geneABackboneStart < visibleBackboneStart && geneABackboneStop > visibleBackboneStop)
    || (geneBBackboneStart < visibleBackboneStart && geneBBackboneStop > visibleBackboneStop))
  {
    return true;
  }

  // Test if both genes are outside of the bp range (ortholog line should cross the viewport)
  return (geneABackboneStop < visibleBackboneStart && geneBBackboneStart > visibleBackboneStop)
    || (geneBBackboneStop < visibleBackboneStart && geneABackboneStart > visibleBackboneStop);
}

function isInBPRange(testBP: number, visibleBackboneStart: number, visibleBackboneStop: number)
{
  return testBP >= visibleBackboneStart && testBP <= visibleBackboneStop;
}

export function getOrthologLineGenes(line: OrthologLine)
{
  const genes: Map<number, Gene> = new Map();
  [line, ...line.chainedOrthologLines].forEach(l => {
    genes.set(l.startGene.rgdId, l.startGene);
    genes.set(l.endGene.rgdId, l.endGene);
  });

  return genes;
}

export function getSelectedDataAndGeneIdsFromOrthologLine(line: OrthologLine)
{
  const orthologGenesMap = getOrthologLineGenes(line);

  const selectedData = Array.from(orthologGenesMap.values())
    .map(g => new SelectedData(g, 'Gene'));

  const selectedGeneIds = Array.from(orthologGenesMap.keys());

  return {
    selectedData,
    selectedGeneIds,
  };
}


/**
 * Gets all ortholog RGD Ids for a gene and adds them to the rgdIds array
 */
export function collectAllOrthologIds(gene: Gene, geneList: Map<number, Gene>, rgdIds: number[])
{
  // Needed for 1st iteration of this function -> add current gene to rgdId list
  if (!rgdIds.includes(gene.rgdId))
  {
    rgdIds.push(gene.rgdId);
  }
  
  gene.orthologs.forEach(orthoId => {
    if (rgdIds.includes(orthoId))
    {
      return;
    }

    const orthologGene = geneList.get(orthoId);
    if (orthologGene != null)
    {
      rgdIds.push(orthoId);
      collectAllOrthologIds(orthologGene, geneList, rgdIds);
    }
  });
}