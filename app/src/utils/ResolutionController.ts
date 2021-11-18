let basePairToHeightRatio = 250000;

/**
 * Essentially controls the "base pair resolution" or the number of base pairs that can be displayed per unit of height
 */
export namespace ResolutionController
{
  export function setBasePairToHeightRatio(ratio: number)
  {
    console.debug(`Setting resolution to ${ratio} bp/unit`);
    basePairToHeightRatio = ratio;
  }

  export function getBasePairToHeightRatio()
  {
    return basePairToHeightRatio;
  }
}