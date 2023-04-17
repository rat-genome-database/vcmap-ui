import Label, { GeneLabel } from '../models/Label';

const OVERLAP_SIZE = 10; // TODO: Determine this size based on a constant for font size of the SVG label text?
const LOC_PREFIX = 'loc';

export function mergeGeneLabels(labels: GeneLabel[])
{
  console.debug(` Merge gene labels [processing ${labels.length}]`);
  // Sort the labels by their SVG Y position
  labels.sort((a, b) => a.posY - b.posY);

  // Iterate through the labels and combine any overlapping labels
  for (let i = 0; i < labels.length; i++)
  {
    const label = labels[i];
    label.isVisible = true;
    if (i < labels.length - 1)
    {
      // There are more labels after this one!
      // Get nearest overlapping labels
      for (let j = i + 1; j < labels.length; j++)
      {
        const potentialOverlappingLabel = labels[j];
        if (labelsOverlap(label, potentialOverlappingLabel))
        {
          // If the current label is an LOC gene or is smaller than the overlapping label, use the overlapping label
          // as the visible label
          if (label.mainGene.symbol.toLowerCase().startsWith(LOC_PREFIX)
            || label.mainGene.size < potentialOverlappingLabel.mainGene.size)
          {
            label.setMainGene(potentialOverlappingLabel.mainGene);
          }
          else
          {
            // Add the overlapping label's genes to this label and hide it
            label.addGenes(...potentialOverlappingLabel.genes);
          }

          potentialOverlappingLabel.isVisible = false;

          // If last label has been looked at, skip outer for-loop to the end
          // (so that it does not get set to "visible" at the beginning of the next iteration)
          if (j === labels.length - 1)
          {
            i = j - 1; // j - 1 since i will iterate by 1 at the end of the outer for-loop
          }
        }
        else
        {
          // Move outer for-loop to next label that doesn't overlap
          i = j - 1; // j - 1 since i will iterate by 1 at the end of the outer for-loop
          break;
        }
      }
    }
  }
}

function labelsOverlap(label1: Label, label2: Label)
{
  return Math.abs(label1.posY - label2.posY) < OVERLAP_SIZE;
}