import { GeneLabel } from '../new_models/Label';

export function mergeGeneLabels(labels: GeneLabel[])
{
  // sort the labels by longest genes (by bp length)
  labels.sort((a, b) => (a.gene.stop - a.gene.start) - (b.gene.stop - b.gene.start));

  labels.forEach((label: GeneLabel) => {
    // Check if this label has been combined or not

    // filter for potential overlapping genes

    // Add overlapped genes to label object
    // Add overlapped genes to alt text
  });
}