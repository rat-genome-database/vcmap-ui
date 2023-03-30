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
  // At this point in time, these labels should only be associated with a single Gene. Filter to make sure
  // we don't have any gene-less labels, and then sort them by size.
  labels
    .filter(l => l.genes.length > 0)
    .sort((a, b) => (b.genes[0].stop - b.genes[0].start) - (a.genes[0].stop - a.genes[0].start));

  //
  // First, handle overlapping of the visible GeneLabels. Add any genes from overlapped labels
  // to the one that overlaps them.
  const combinedLabels = new Set<GeneLabel>();
  for (let geneLabelIdx = 0; geneLabelIdx < labels.length; geneLabelIdx++)
  {
    const geneLabel = labels[geneLabelIdx];
    // Check if this label has been combined or not
    if (combinedLabels.has(geneLabel) || geneLabel.posY > PANEL_SVG_STOP || geneLabel.posY < PANEL_SVG_START)
    {
      geneLabel.isVisible = false;
      continue;
    }
    // filter for potential overlapping genes
    const overlappedLabels = labels.filter((label) => {
      return (Math.abs(geneLabel.posY - label.posY) < OVERLAP_SIZE && label != geneLabel);
    });

    for (let overlapIdx = 0; overlapIdx < overlappedLabels.length; overlapIdx++)
    {
      const overlappedLabel = overlappedLabels[overlapIdx];

      if (combinedLabels.has(overlappedLabel))
      {
        overlappedLabel.isVisible = false;
        continue;
      }
      if (geneLabel.genes[0].symbol.split("", 3).join("").toLowerCase() === 'loc')
      {
        overlappedLabel.addGenes(...geneLabel.genes);
        combinedLabels.add(geneLabel);
        // TODO: Here we are setting geneLabel visibility to false but it is always being set back to true after this for-loop ends
        // Unsure what the logic should be here.
        geneLabel.isVisible = false;
        continue;
      }
      else
      {
        geneLabel.addGenes(...overlappedLabel.genes);
        combinedLabels.add(overlappedLabel);
      }
    }
    geneLabel.isVisible = true;
  }

  //
  // Next, add any non-visible genes to visible GeneLabels if they overlap with them
  const visibleLabels = labels.filter(l => l.isVisible);
  for (let i = 0; i < genes.length; i++)
  {
    const gene = genes[i];
    for (let j = 0; j < visibleLabels.length; j++)
    {
      const label = visibleLabels[j];
      if (!label.hasGene(gene) && isOverlappingGeneLabel(gene, label))
      {
        label.addGenes(gene);
      }
    }
  }
}

function isOverlappingGeneLabel(gene: Gene, label: GeneLabel)
{
  const isLabelOverlappingGeneStart = label.bpRange.start <= gene.stop && label.bpRange.start >= gene.start;
  const isLabelOverlappingGeneStop = label.bpRange.stop >= gene.start && label.bpRange.stop <= gene.stop;
  const isGeneContainedInLabel = label.bpRange.start <= gene.start && label.bpRange.stop >= gene.stop;
  return (isLabelOverlappingGeneStart || isLabelOverlappingGeneStop || isGeneContainedInLabel);
}