import Chromosome from './Chromosome';
import Label from './Label';
import { Formatter } from '@/utils/Formatter';
import GenomicSection, { BackboneAlignment, RenderType, WindowBasePairRange } from './GenomicSection';

export type SyntenySectionType = 'block' | 'gap';
export type Orientation = '+' | '-';

type SyntenySectionParams = {
  speciesName: string;
  mapName: string;
  start: number;
  stop: number;
  backboneAlignment: BackboneAlignment;
  windowBasePairRange: WindowBasePairRange;
  type: SyntenySectionType;
  orientation: '+' | '-';
  chromosome: string;
  chainLevel: number;
  isGapless?: boolean;
  renderType: RenderType;
}

export default class SyntenySection extends GenomicSection
{
  startLabel!: Label;            // start basepair label
  stopLabel!: Label;             // stop basepair label
  threshold?: number = 0;        // threshold level this object was created at
  orientation: Orientation = '+';  // orientation of the synteny block
  chainLevel: number = 0;        // level of the chain that this section is on
  isInverted: boolean = false;

  constructor(params: SyntenySectionParams)
  {
    super({
      speciesName: params.speciesName,
      mapName: params.mapName,
      start: params.start,
      stop: params.stop,
      type: params.type,
      color: Chromosome.getColor(params.chromosome),
      backboneAlignment: params.backboneAlignment,
      windowBasePairRange: params.windowBasePairRange,
      renderType: params.renderType,
      chromosome: params.chromosome,
    });

    this.orientation = params.orientation;
    this.isInverted = (params.orientation === '-');
    this.chainLevel = params.chainLevel;

    // Only build these section labels for gapless blocks to display in overview panel
    if (params.isGapless)
    {
      this.createSyntenySectionLabels();
    }
  }

  public toHoveredData(): string[] {
    return [
      this.speciesName,
      `Chr${this.chromosome}: ${Formatter.addCommasToBasePair(this.speciesStart)} - ${Formatter.addCommasToBasePair(this.speciesStop)}`,
      `Orientation: ${this.orientation}`,
      `Level: ${this.chainLevel}`,
    ];
  }

  private createSyntenySectionLabels()
  {
    this.startLabel = new Label({
      posX: this.posX2,
      posY: this.posY1,
      text: Formatter.convertBasePairToLabel(this.speciesStart) || '',
      isVisible: false,
    });
    this.stopLabel = new Label({
      posX: this.posX2,
      posY: this.posY2,
      text: Formatter.convertBasePairToLabel(this.speciesStop) || '',
      isVisible: false,
    });
  }
}