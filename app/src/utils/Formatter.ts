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

  export function timeAgo(timestamp: number) {
    const now = Date.now();
    const secondsPast = (now - timestamp) / 1000;

    if (secondsPast < 60) {
        return `${Math.round(secondsPast)}s ago`;
    }
    if (secondsPast < 3600) {
        return `${Math.round(secondsPast / 60)} mins ago`;
    }
    if (secondsPast <= 86400) {
        return `${Math.round(secondsPast / 3600)} hrs ago`;
    }
  }
}
