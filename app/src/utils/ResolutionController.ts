export namespace ResolutionController
{
  let basePairToPixelRatio = 250000;

  export function setBasePairToPixelRatio(ratio: number)
  {
    basePairToPixelRatio = ratio;
  }

  export function getBasePairToPixelRatio()
  {
    return basePairToPixelRatio;
  }
}