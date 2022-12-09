import Label, { GeneLabel } from '../new_models/Label';

export function mergeGeneLabels(labels: GeneLabel[])
{
  // sort the labels by longest genes (by bp length)
  labels.sort((a, b) => (a.gene.stop - a.gene.start) - (b.gene.stop - b.gene.start));

  const combinedLabels: GeneLabel[] = [];
  for (let geneLabelIdx = 0; geneLabelIdx < labels.length; geneLabelIdx++)
  {
    const geneLabel = labels[geneLabelIdx];
    // Check if this label has been combined or not
    if (combinedLabels.some((combinedLabel) => combinedLabel.gene.rgdId === geneLabel.gene.rgdId))
    {
      geneLabel.isVisible = false;
      continue;
    }
    // filter for potential overlapping genes
    const overlappedLabels = labels.filter((label) => {
      return Math.abs(geneLabel.posY - label.posY) < 10;
    });

    for (let overlapIdx = 0; overlapIdx < overlappedLabels.length; overlapIdx++)
    {
      const overlappedLabel = overlappedLabels[overlapIdx];
      if (combinedLabels.some((combinedLabel) => combinedLabel.gene.rgdId === overlappedLabel.gene.rgdId))
      {
        overlappedLabel.isVisible = false;
      }
      else if (overlappedLabel.gene.symbol.split("", 3).join("").toLowerCase() == 'loc')
      {
        overlappedLabel.combinedLabels ? overlappedLabel.combinedLabels.push(geneLabel) : overlappedLabel.combinedLabels = [geneLabel];
        combinedLabels.push(geneLabel);
        geneLabel.isVisible = false;
        continue;
      }
      else
      {
        geneLabel.combinedLabels ? geneLabel.combinedLabels.push(overlappedLabel) : geneLabel.combinedLabels = [overlappedLabel];
        if (overlappedLabel.combinedLabels)
        {
          overlappedLabel.combinedLabels.forEach((lab) => {
            geneLabel.combinedLabels.push(lab);
          });
        }
      }
    }
  }
}