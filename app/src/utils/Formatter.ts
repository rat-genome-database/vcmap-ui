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

  export function truncate(text: string, charsAllowed: number)
  {
    if (text.length > charsAllowed) {
      return text.substring(0, charsAllowed) + '...';
    }

    return text;
  }
}
