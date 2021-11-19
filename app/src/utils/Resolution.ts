import ViewSize from "./ViewSize";

let basePairToHeightRatio = 1000;
let syntenyBlockThreshold: number | null = null;

/**
 * Essentially controls the "base pair resolution" or the number of base pairs that can be displayed per unit of height
 */
export namespace Resolution
{
  export function setResolution(backboneStart: number, backboneStop: number)
  {
    const backboneLength = backboneStop - backboneStart;
    basePairToHeightRatio = backboneLength / (ViewSize.viewboxHeight - 100);
    console.debug(`Setting bp resolution to ${basePairToHeightRatio} bp/unit`);

    syntenyBlockThreshold = (backboneLength > 1000000) ? Math.floor((backboneLength) / 10000) : 0;
    console.debug(`Setting synteny threshold to ${syntenyBlockThreshold}bp`);
  }

  export function getBasePairToHeightRatio()
  {
    return basePairToHeightRatio;
  }
  
  export function getSyntenyThreshold()
  {
    return syntenyBlockThreshold;
  }
}