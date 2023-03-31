import Gene from '@/models/Gene';
import { GeneLabel } from '../models/Label';
import { PANEL_SVG_START, PANEL_SVG_STOP } from './SVGConstants';

const OVERLAP_SIZE = 8;

// TODO: Remove old mergeGeneLabels function (keeping for reference) 
// export function mergeGeneLabels(labels: GeneLabel[])
// {
//   // sort the labels by longest genes (by bp length)
//   labels.sort((a, b) => (b.gene.stop - b.gene.start) - (a.gene.stop - a.gene.start));

//   const combinedLabels = new Set<GeneLabel>();
//   for (let geneLabelIdx = 0; geneLabelIdx < labels.length; geneLabelIdx++)
//   {
//     const geneLabel = labels[geneLabelIdx];
//     geneLabel.combinedLabels = [];
//     // Check if this label has been combined or not
//     if (combinedLabels.has(geneLabel) || geneLabel.posY > PANEL_SVG_STOP || geneLabel.posY < PANEL_SVG_START)
//     {
//       geneLabel.isVisible = false;
//       continue;
//     }
//     // filter for potential overlapping genes
//     const overlappedLabels = labels.filter((label) => {
//       return (Math.abs(geneLabel.posY - label.posY) < OVERLAP_SIZE && label != geneLabel);
//     });

//     for (let overlapIdx = 0; overlapIdx < overlappedLabels.length; overlapIdx++)
//     {
//       const overlappedLabel = overlappedLabels[overlapIdx];
//       overlappedLabel.combinedLabels = [];

//       if (combinedLabels.has(overlappedLabel))
//       {
//         overlappedLabel.isVisible = false;
//         continue;
//       }
//       if (geneLabel.gene.symbol.split("", 3).join("").toLowerCase() === 'loc')
//       {
//         overlappedLabel.combinedLabels ? overlappedLabel.combinedLabels.push(geneLabel) : overlappedLabel.combinedLabels = [geneLabel];
//         combinedLabels.add(geneLabel);
//         geneLabel.isVisible = false;
//         continue;
//       }
//       else
//       {
//         geneLabel.combinedLabels ? geneLabel.combinedLabels.push(overlappedLabel) : geneLabel.combinedLabels = [overlappedLabel];
//         combinedLabels.add(overlappedLabel);
//       }
//     }
//     geneLabel.isVisible = true;
//   }

// }

/**
 * Merge overlapping gene labels into a single GeneLabel, add non-visible genes to any labels that overlap them
 * 
 * @param labels GeneLabels from visible DatatrackSections
 * @param genes all genes that belong to the region whether they are visible or not
 */
export function mergeGeneLabels(labels: GeneLabel[], genes: Gene[])
{
  console.debug(` Merge gene labels: [labels: ${labels.length}, all genes: ${genes.length}]`);
  // At this point in time, these labels should only be associated with a single Gene. Filter to make sure
  // we don't have any gene-less labels, and then sort them by size.
  labels
    .filter(l => l.genes.length > 0)
    .sort((a, b) => (b.mainGene.stop - b.mainGene.start) - (a.mainGene.stop - a.mainGene.start));

  //
  // First, handle overlapping of the visible GeneLabels. Add any genes from overlapped labels
  // to the one that overlaps them.
  //const combinedLabels = new Set<GeneLabel>();
  const combinedGeneRGDIds: number[] = [];
  for (let geneLabelIdx = 0; geneLabelIdx < labels.length; geneLabelIdx++)
  {
    const geneLabel = labels[geneLabelIdx];
    // Check if this label has been combined or not
    if (combinedGeneRGDIds.includes(geneLabel.mainGene.rgdId) || geneLabel.posY > PANEL_SVG_STOP || geneLabel.posY < PANEL_SVG_START)
    {
      console.log(`GeneLabel: ${geneLabel.mainGene.symbol} has already been combined with another`);
      geneLabel.isVisible = false;
      continue;
    }
    // filter for potential overlapping genes
    const overlappedLabels = labels.filter((label) => {
      return (Math.abs(geneLabel.posY - label.posY) < OVERLAP_SIZE && label != geneLabel);
    });

    console.log(`GeneLabel: ${geneLabel.mainGene.symbol} has ${overlappedLabels.length} overlapping labels`);
    overlappedLabels.forEach(l => console.log(` overlap: ${l.mainGene.symbol}`));

    //
    // If no overlapping labels, set label is visible and continue processing next label
    if (overlappedLabels.length === 0)
    {
      geneLabel.isVisible = true;
    }

    //
    // If overlapping labels, adjust visibility and combine their genes accordingly...
    for (let overlapIdx = 0; overlapIdx < overlappedLabels.length; overlapIdx++)
    {
      const overlappedLabel = overlappedLabels[overlapIdx];

      if (combinedGeneRGDIds.includes(overlappedLabel.mainGene.rgdId))
      {
        overlappedLabel.isVisible = false;
        geneLabel.isVisible = true;
        continue;
      }
      if (geneLabel.mainGene.symbol.toLowerCase().startsWith('loc'))
      {
        overlappedLabel.addGenes(...geneLabel.genes);
        combinedGeneRGDIds.push(geneLabel.mainGene.rgdId);
        geneLabel.isVisible = false;
        continue;
      }
      else
      {
        geneLabel.addGenes(...overlappedLabel.genes);
        combinedGeneRGDIds.push(overlappedLabel.mainGene.rgdId);
        geneLabel.isVisible = true;
      }
    }
  }

  //
  // Next, add any non-visible genes to visible GeneLabels if they overlap with them
  const visibleLabels = labels.filter(l => l.isVisible);
  const visibleLabelMainGeneIds = visibleLabels.map(l => l.mainGene.rgdId);
  for (let i = 0; i < genes.length; i++)
  {
    const gene = genes[i];
    for (let j = 0; j < visibleLabels.length; j++)
    {
      const label = visibleLabels[j];
      // If:
      //  + gene has not already been combined with another label
      //  + gene is not the "main" gene of an already visible label
      //  + label does not already contain the gene (this might be redundant with the first check TODO)
      //  + gene overlaps the "main" gene of the label
      // Then:
      //  + Add the gene to the GeneLabel
      //  + Add the gene RGD ID to the list of already "combined" (merged) genes
      if (!combinedGeneRGDIds.includes(gene.rgdId) && !visibleLabelMainGeneIds.includes(gene.rgdId) 
        && !label.hasGene(gene) && isOverlappingGeneLabel(gene, label))
      {
        console.log(` Label ${label.mainGene.symbol} overlaps with gene ${gene.symbol}`);
        label.addGenes(gene);
        combinedGeneRGDIds.push(gene.rgdId);
      }
    }
  }
}

function isOverlappingGeneLabel(gene: Gene, label: GeneLabel)
{
  const isLabelOverlappingGeneStart = label.mainGene.start <= gene.stop && label.mainGene.start >= gene.start;
  const isLabelOverlappingGeneStop = label.mainGene.stop >= gene.start && label.mainGene.stop <= gene.stop;
  const isGeneContainedInLabel = label.mainGene.start <= gene.start && label.mainGene.stop >= gene.stop;
  return (isLabelOverlappingGeneStart || isLabelOverlappingGeneStop || isGeneContainedInLabel);
}