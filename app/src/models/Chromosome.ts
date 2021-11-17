const CHROMOSOME_COLOR_MAP: {[key: string]: string} = {
  '1': 'dimgray',
  '2': 'saddlebrown',
  '3': 'olive',
  '4': 'darkslateblue',
  '5': 'green',
  '6': 'navy',
  '7': 'yellowgreen',
  '8': 'darkseagreen',
  '9': 'darkmagenta',
  '10': 'red',
  '11': 'darkturquoise',
  '12': 'orange',
  '13': 'blueviolet',
  '14': 'springgreen',
  '15': 'crimson',
  '16': 'blue',
  '17': 'thistle',
  '18': 'fuchsia',
  '19': 'palevioletred',
  '20': 'khaki',
  '21': 'cornflower',
  '22': 'deeppink',
  'X': 'lightsalmon',
  'Y': 'violet'
};

export class ChromosomeDTO
{
  mapKey: number = 0;
  chromosome: string = '';
  seqLength: number = 0;
  gapLength: number = 0;
  gapCount: number = 0;
  contigCount: number = 0;
}

export default class Chromosome extends ChromosomeDTO
{
  constructor(dto: ChromosomeDTO)
  {
    super();
    Object.assign(this, dto);
  }

  static getColor(chromosome: string)
  {
    return CHROMOSOME_COLOR_MAP[chromosome];
  }
}