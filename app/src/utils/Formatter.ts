export namespace Formatter
{
  export function convertBasePairToLabel(bp: number | null)
  {
    if (bp == null)
    {
      return null;
    }

    return (bp / 1000000).toFixed(2) + 'Mbp';
  }

  export function addCommasToBasePair(bp: number | null)
  {
    if (bp == null)
    {
      return null;
    }

    return bp.toLocaleString();
  }

  export function evaluateBPInput(bp: number | null)
  {
    if(bp === null) {
      return null;
    }
    return bp;
  }
}
