import ViewSize from "./ViewSize";

/**
 * Essentially controls the:
 * + "base pair resolution" or the number of base pairs that can be displayed per unit of height
 * + "synteny threshold" or the minimum size that a synteny block can be before we display it
 */
export namespace Resolution
{
  export namespace BackbonePanel
  {
    let basePairToHeightRatio = 1000;
    let syntenyBlockThreshold: number = 0;

    export function setResolution(backboneStart: number, backboneStop: number)
    {
      const backboneLength = backboneStop - backboneStart;
      basePairToHeightRatio = backboneLength / (ViewSize.viewboxHeight - 100);
      console.debug(`Setting backbone panel bp resolution to ${basePairToHeightRatio} bp/unit`);

      syntenyBlockThreshold = (backboneLength > 1000000) ? Math.floor((backboneLength) / 10000) : 0;
      console.debug(`Setting backbone panel synteny threshold to ${syntenyBlockThreshold}bp`);
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

  export namespace ComparativePanel
  {
    let basePairToHeightRatio = 1000;
    let syntenyBlockThreshold: number | null = null;
    
    export function setResolution(backboneStart: number, backboneStop: number)
    {
      const backboneLength = backboneStop - backboneStart;
      basePairToHeightRatio = backboneLength / (ViewSize.viewboxHeight - 100);
      console.debug(`Setting comparative panel bp resolution to ${basePairToHeightRatio} bp/unit`);

      syntenyBlockThreshold = (backboneLength > 1000000) ? Math.floor((backboneLength) / 10000) : 0;
      console.debug(`Setting comparative panel synteny threshold to ${syntenyBlockThreshold}bp`);
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
}