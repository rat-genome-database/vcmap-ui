/**
 * Colors are based on the UCSC color palette: https://nanx.me/ggsci/reference/pal_ucscgb.html (the 2nd 'pastel' colored one)
 */
 const CHROMOSOME_COLOR_MAP: {[key: string]: string} = {
  '1': '#ff7e76',
  '2': '#fec27e',
  '3': '#fde083',
  '4': '#91ff87',
  '5': '#a4c2ff',
  '6': '#e289ff',
  '7': '#c2c280',
  '8': '#c2c2c2',
  '9': '#ff7de2',
  '10': '#e47773',
  '11': '#ffe0e1',
  '12': '#fcff89',
  '13': '#e0ff88',
  '14': '#89b374',
  '15': '#6666e2',
  '16': '#c3e0ff',
  '17': '#91ffff',
  '18': '#e0ffff',
  '19': '#c572e2',
  '20': '#e0c2ff',
  '21': '#c3a374',
  '22': '#a3a371',
  'X': '#a3a3a3',
  'Y': '#e0e0e0',
  'MT': '#b2e190',
  '2A': '#e0e0c2',
  // Ran out of colors from the UCSC color palette
  '2B': '#a52a2a'
};

const UNMAPPED_CHROMOSOME_COLOR = '#a52a2a'; // brown

export default class Chromosome
{
  mapKey: number = 0;
  chromosome: string = '';
  seqLength: number = 0;

  constructor(params: { mapKey: number, chromosome: string; seqLength?: number })
  {
    this.mapKey = params.mapKey;
    this.chromosome = params.chromosome;
    this.seqLength = params.seqLength || 0;
  }

  static getColor(chromosome: string)
  {
    return CHROMOSOME_COLOR_MAP[chromosome] ?? UNMAPPED_CHROMOSOME_COLOR;
  }
}