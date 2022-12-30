import BackboneSection from './BackboneSection';
import Chromosome from './Chromosome';
import Label from './Label';
import { Formatter } from '@/utils/Formatter';
import GenomicSection from './GenomicSection';

type SyntenySectionType = 'block' | 'gap';

interface SyntenySectionParams
{
  start: number;
  stop: number;
  backboneSection: BackboneSection;
  type: SyntenySectionType;
  threshold?: number;
  orientation: '+' | '-';
  chromosome: Chromosome;
  chainLevel: number;
}

export default class SyntenySection extends GenomicSection
{
  startLabel!: Label;            // start basepair label
  stopLabel!: Label;             // stop basepair label
  threshold?: number = 0;        // threshold level this object was created at
  orientation: '+' | '-' = '+';  // orientation of the synteny block
  blockRatio: number = 0;        // ratio of the length of the section on its original species to the length of this backbone section
  chromosome: Chromosome;        // chromosome that this section is from
  chainLevel: number = 0;        // level of the chain that this section is on
  isInverted: boolean = false;

  constructor(params: SyntenySectionParams)
  {
    super(params.start, params.stop, params.type, Chromosome.getColor(params.chromosome.chromosome), params.backboneSection);

    this.threshold = params.threshold || 0;
    this.orientation = params.orientation;
    this.isInverted = (params.orientation === '-');
    this.blockRatio = params.backboneSection.length / this.length;
    this.chromosome = params.chromosome;
    this.chainLevel = params.chainLevel;

    this.createSyntenySectionLabels();
  }

  public recalculateLabelYPositions()
  {
    this.startLabel.posY = this.startLabelYPosition;
    this.stopLabel.posY = this.stopLabelYPosition;
  }

  private createSyntenySectionLabels()
  {
    this.startLabel = new Label({
      posX: this.posX2,
      posY: this.startLabelYPosition,
      text: Formatter.convertBasePairToLabel(this.speciesStart) || '',
      isVisible: false,
    });
    this.stopLabel = new Label({
      posX: this.posX2,
      posY: this.stopLabelYPosition,
      text: Formatter.convertBasePairToLabel(this.speciesStop) || '',
      isVisible: false,
    });
  }

  private get startLabelYPosition()
  {
    return this.isInverted ? this.posY2 : this.posY1;
  }

  private get stopLabelYPosition()
  {
    return this.isInverted ? this.posY1 : this.posY2;
  }
}