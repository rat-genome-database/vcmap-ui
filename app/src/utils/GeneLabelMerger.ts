import Gene from '@/models/Gene';
import { GeneLabel, IntermediateGeneLabel } from '../models/Label';
import { PANEL_SVG_START } from './SVGConstants';

const OVERLAP_SIZE = 8;
const LOC_PREFIX = 'loc';

export function mergeAndCreateGeneLabels(possibleLabels: IntermediateGeneLabel[])
{
  const geneLabels: GeneLabel[] = [];

  console.debug(` Merge gene labels [processing ${possibleLabels.length}]`);
  // Sort the labels by their SVG Y position
  possibleLabels.sort((a, b) => a.posY - b.posY);

  for (let i = 0; i < possibleLabels.length; i++)
  {
    const curLabel = possibleLabels[i];
    // If label is too close to top of detailed panel, move it down a bit
    if (Math.abs(curLabel.posY - PANEL_SVG_START) < OVERLAP_SIZE)
    {
      curLabel.posY = curLabel.posY + OVERLAP_SIZE;
    }

    let mainGene = curLabel.gene;
    const overlappingGenes: Gene[] = [];

    // If there are more labels after this one...
    if (i < possibleLabels.length - 1)
    {
      // Get nearest overlapping labels
      for (let j = i + 1; j < possibleLabels.length; j++)
      {
        const potentialOverlappingLabel = possibleLabels[j];
        if (labelsOverlap(curLabel, potentialOverlappingLabel))
        {
          // If the current label is an LOC gene or is smaller than the overlapping label, use the overlapping label
          // as the visible label
          if (!potentialOverlappingLabel.gene.symbol.toLowerCase().startsWith(LOC_PREFIX) 
            && (curLabel.gene.symbol.toLowerCase().startsWith(LOC_PREFIX) || curLabel.gene.size < potentialOverlappingLabel.gene.size))
          {
            overlappingGenes.push(mainGene);
            mainGene = potentialOverlappingLabel.gene;
          }
          else
          {
            // Add the overlapping label's genes to this label and hide it
            overlappingGenes.push(potentialOverlappingLabel.gene);
          }

          // If last label has been looked at, skip outer for-loop to the end
          // (so that it does not get set to "visible" at the beginning of the next iteration)
          if (j === possibleLabels.length - 1)
          {
            i = j;
          }
        }
        else
        {
          // Move outer for-loop to next label that doesn't overlap
          i = j - 1; // j - 1 since i will iterate by 1 at the end of the outer for-loop causing the next curLabel to be at index "j"
          break;
        }
      }
    }

    geneLabels.push(new GeneLabel({
      posX: curLabel.posX,
      posY: curLabel.posY,
      text: mainGene.symbol,
      isVisible: true,
    }, [mainGene, ...overlappingGenes]));
  }

  return geneLabels;
}

function labelsOverlap(label1: IntermediateGeneLabel, label2: IntermediateGeneLabel)
{
  return Math.abs(label1.posY - label2.posY) < OVERLAP_SIZE;
}