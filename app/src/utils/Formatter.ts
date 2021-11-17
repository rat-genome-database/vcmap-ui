export namespace Formatter
{
  export function convertBasePairToLabel(bp: number | null)
  {
    if (bp == null)
    {
      return null;
    }

    if (bp >= 1000000)
    {
      return (bp / 1000000).toFixed(2) + 'Mbp';
    }
    else if (bp >= 1000)
    {
      return (bp / 1000).toFixed(2) + 'Kbp';
    }
    else
    {
      return bp + 'bp';
    }
  }
}
