import BackboneSet from "@/models/BackboneSet";
import { GeneDatatrack } from "@/models/DatatrackSection";
import Gene from "@/models/Gene";
import OrthologLine, { OrthologPair } from "@/models/OrthologLine";
import SyntenyRegionSet from "@/models/SyntenyRegionSet";
import { getDetailedPanelXPositionForDatatracks } from "./Shared";
import SVGConstants, { PANEL_HEIGHT, PANEL_SVG_START, PANEL_SVG_STOP } from "./SVGConstants";

type GeneDetails = {
  posX1: number;
  gene: Gene;
  datatrack?: GeneDatatrack;
};

/**
 * Creates ortholog lines and associates them with the off-backbone SyntenyRegionSets
 * 
 * @param orthologs
 *   list of ortholog pairs
 * @param backboneSet
 *   backbone set
 * @param offBackboneSyntenyRegionSets
 *   array of the off-backbone synteny region sets
 */
export function createOrthologLines(orthologs: OrthologPair[], backboneSet: BackboneSet, offBackboneSyntenyRegionSets: SyntenyRegionSet[])
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
    backboneDatatrackMap.set(d.gene.rgdId, d);
  });

  const offBackboneGeneMap = getOffbackboneGeneDetails(offBackboneSyntenyRegionSets);

  const orthologLines: OrthologLine[] = [];
  for (let i = 0; i < orthologs.length; i++)
  {
    const pair = orthologs[i];
    const backboneGeneDatatrack = backboneDatatrackMap.get(pair.backboneGene.rgdId);
    const offBackboneGeneDetails = offBackboneGeneMap.get(pair.offBackboneGene.rgdId);
    const offBackboneGeneDatatrack = offBackboneGeneDetails?.datatrack;

    const line = new OrthologLine({
      backboneGene: pair.backboneGene,
      backboneGeneDatatrack: backboneGeneDatatrack,
      offBackboneGene: pair.offBackboneGene,
      offBackboneGeneDatatrack: offBackboneGeneDatatrack,
    });

    try
    {
      //
      // Use gene datatrack to calculate most accurate position if available, otherwise use other methods to get the approx positions
      const x1 = (backboneGeneDatatrack) ? backboneGeneDatatrack.posX2 : backboneSet.backbone.posX2 + SVGConstants.backboneDatatrackXOffset;

      const y1 = (backboneGeneDatatrack) 
        ? backboneGeneDatatrack.posY1 + (backboneGeneDatatrack.height / 2)
        : calculateSVGYPositionBasedOnBackboneAlignment(pair.backboneGene.start, pair.backboneGene.stop, backboneSet.backbone.windowStart, backboneSet.backbone.windowStop);
      
      const x2 = (offBackboneGeneDatatrack) ? offBackboneGeneDatatrack.posX1 : offBackboneGeneDetails?.posX1;

      let y2 = null;
      if (offBackboneGeneDatatrack)
      {
        y2 = offBackboneGeneDatatrack.posY1 + (offBackboneGeneDatatrack.height / 2);
      }
      else
      {
        if (pair.offBackboneGene.backboneStart == null || pair.offBackboneGene.backboneStop == null)
        {
          throw new Error(`Off-backbone gene is missing backboneStart and backboneStop properties`);
        }
        y2 = calculateSVGYPositionBasedOnBackboneAlignment(pair.offBackboneGene.backboneStart, pair.offBackboneGene.backboneStop, backboneSet.backbone.windowStart, backboneSet.backbone.windowStop);
      }
      
      // Throw error if any possible null positions are null...
      if (y1 == null || x2 == null || y2 == null)
      {
        throw new Error(`Error: y1, x2, or y2 positions are null`);
      }
      
      line.setBackboneSVGPosition(x1, y1);
      line.setOffBackboneSVGPositions(x2, y2);
    }
    catch (err)
    {
      console.error(`An error occurred while calculating ortholog line position. See debug logs.`, err);
      console.debug(`Ortholog Line at time of error`, line);
      continue;
    }

    orthologLines.push(line);
  }

  console.timeEnd(`CreateOrthologLines`);
  return orthologLines;
}

function getOffbackboneGeneDetails(offBackboneSyntenyRegionSets: SyntenyRegionSet[])
{
  const offBackboneGeneMap = new Map<number, GeneDetails>();

  offBackboneSyntenyRegionSets.forEach(set => {
    for (let regionIdx = 0; regionIdx < set.regions.length; regionIdx++)
    {
      const region = set.regions[regionIdx];
      const regionGeneDatatracks = region.datatrackSets
        .filter(datatrackSet => datatrackSet.datatracks[0]?.type === 'gene')
        .map(geneSet => (geneSet.datatracks as GeneDatatrack[]))
        .flat();

      // Get the x position of the off-backbone gene based on the order of the SyntenyRegionSet it belongs to
      // TODO: The second arg is always "0" b/c the first DatatrackSet is always genes. This will need to be adjusted
      //   if this becomes more flexible in the future.
      const posX1 = getDetailedPanelXPositionForDatatracks(set.order, 0);

      // Get all genes with datatrack sections (these are visible in the detailed panel)
      regionGeneDatatracks.forEach(dt => {
        offBackboneGeneMap.set(dt.gene.rgdId, {
          posX1: posX1,
          gene: dt.gene.clone(),
          datatrack: dt,
        });
      });

      // Get all genes whether they have a datatrack section or not and set them in the map if they haven't been already
      region.genes.forEach(g => {
        if (!offBackboneGeneMap.has(g.rgdId))
        {
          offBackboneGeneMap.set(g.rgdId, {
            posX1: posX1,
            gene: g.clone(),
          });
        }
      });
    }
  });

  return offBackboneGeneMap;
}

function calculateSVGYPositionBasedOnBackboneAlignment(geneBackboneStart: number, geneBackboneStop: number, visibleBackboneStart: number, visibleBackboneStop: number)
{
  const svgToBackboneRatio = (PANEL_HEIGHT) / (visibleBackboneStop - visibleBackboneStart);

  const backboneStartDiff = geneBackboneStart - visibleBackboneStart;
  const backboneStopDiff = visibleBackboneStop - geneBackboneStop;

  const svgStart = PANEL_SVG_START + (backboneStartDiff * svgToBackboneRatio);
  const svgStop = PANEL_SVG_STOP - (backboneStopDiff * svgToBackboneRatio);

  return svgStart + ((svgStop - svgStart) / 2);
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