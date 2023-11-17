import Label from './Label';
import SVGConstants from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import Chromosome from './Chromosome';
import Gene from '@/models/Gene';
import GenomicSection, { RenderType, WindowBasePairRange } from './GenomicSection';
import Species from './Species';

export type BackboneSectionParams = {
  start: number;
  stop: number;
  windowBasePairRange: WindowBasePairRange;
  chromosome: string;
  species: Species;
  renderType: RenderType;
  createLabels?: boolean;
}

export default class BackboneSection extends GenomicSection
{
  labels: Label[] = []; // BP labels for the backbone section
  renderType: RenderType = 'overview';
  hasLabels: boolean = false;
  backboneGenes?: Gene[]; // All Genes that fit within this backbone section

  constructor(params: BackboneSectionParams)
  {
    super({
      speciesName: params.species.name,
      mapName: params.species.activeMap.name,
      chromosome: params.chromosome,
      start: params.start,
      stop: params.stop,
      type: 'block',
      color: Chromosome.getColor(params.chromosome ?? ''),
      backboneAlignment: {
        start: params.start,
        stop: params.stop,
      },
      windowBasePairRange: params.windowBasePairRange,
      renderType: params.renderType,
    });

    this.renderType = params.renderType;
    this.hasLabels = params.createLabels ?? false;

    if (this.hasLabels)
    {
      this.createLabels();
    }
  }

  public setBackboneGenes(backboneGenes: Gene[])
  {
    this.backboneGenes = backboneGenes.map(g => g.clone());
  }

  public toHoveredData(): string[] {
    return [
      this.speciesName,
      `Chr${this.chromosome}: ${Formatter.addCommasToBasePair(this.speciesStart)} - ${Formatter.addCommasToBasePair(this.speciesStop)}`,
      `Orientation: +`,
    ];
  }

  private createLabels()
  {
    let startBPLabel: Label;
    let stopBPLabel: Label;

    if (this.renderType === 'overview')
    {
      startBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStart - 3,
        text: Formatter.convertBasePairToLabel(this.windowStart) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStop + 7,
        text: Formatter.convertBasePairToLabel(this.windowStop) ?? ''
      });
    }
    else
    {
      startBPLabel = new Label({
        posX: SVGConstants.selectedBackboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStart + 10,
        text: Formatter.convertBasePairToLabel(this.windowStart) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.selectedBackboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStop - 10,
        text: Formatter.convertBasePairToLabel(this.windowStop) ?? ''
      });
    }
    
    this.labels = [startBPLabel, stopBPLabel];
  }
}