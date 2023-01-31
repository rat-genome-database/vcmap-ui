import { GeneLabel } from '../models/Label';
import { PANEL_SVG_START, PANEL_SVG_STOP } from './SVGConstants';

const OVERLAP_SIZE = 8;

export function mergeGeneLabels(labels: GeneLabel[])
{
  // sort the labels by longest genes (by bp length)
  labels.sort((a, b) => (b.gene.stop - b.gene.start) - (a.gene.stop - a.gene.start));

  const combinedLabels = new Set<GeneLabel>();
  for (let geneLabelIdx = 0; geneLabelIdx < labels.length; geneLabelIdx++)
  {
    const geneLabel = labels[geneLabelIdx];
    geneLabel.combinedLabels = [];
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
      overlappedLabel.combinedLabels = [];

      if (combinedLabels.has(overlappedLabel))
      {
        overlappedLabel.isVisible = false;
        continue;
      }
      if (geneLabel.gene.symbol.split("", 3).join("").toLowerCase() === 'loc')
      {
        overlappedLabel.combinedLabels ? overlappedLabel.combinedLabels.push(geneLabel) : overlappedLabel.combinedLabels = [geneLabel];
        combinedLabels.add(geneLabel);
        geneLabel.isVisible = false;
        continue;
      }
      else
      {
        geneLabel.combinedLabels ? geneLabel.combinedLabels.push(overlappedLabel) : geneLabel.combinedLabels = [overlappedLabel];
        combinedLabels.add(overlappedLabel);
      }
    }
    geneLabel.isVisible = true;
  }

}