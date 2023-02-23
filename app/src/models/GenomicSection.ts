import BackboneSection from "./BackboneSection";
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";

type GenomicSectionType = 'block' | 'gap' | 'gene';

/**
 * Represents an individual Genomic Section of data. 
 * This could be a syntenic section (block or gap), a datatrack section, etc...
 */
export default abstract class GenomicSection implements VCMapSVGElement
{
  // VCMapSVGElement props
  posX1: number = 0;
  posX2: number = 0;
  posY1: number = 0;
  posY2: number = 0;
  height: number = 0;
  width: number = 0;
  shape: SVGShape = 'rect';
  representation: string = '';
  isHovered: boolean = false;
  isSelected: boolean = false;
  elementColor: string = '';

  speciesStart: number = 0;  // start basepair of the section on its original species
  speciesStop: number = 0;   // stop basepair of the section on its original species
  backboneStart: number = 0; // start basepair of the section on the backbone species
  backboneStop: number = 0;  // stop basepair of the section on the backbone species
  length: number = 0;        // length of the section on its original species
  type: GenomicSectionType = 'block';

  backboneSection: BackboneSection;  // backbone section that this genomic section is aligned against
  
  constructor(speciesStart: number, speciesStop: number, type: GenomicSectionType, color: string, backboneSection: BackboneSection)
  {
    this.speciesStart = speciesStart;
    this.speciesStop = speciesStop;
    this.length = Math.abs(this.speciesStop - this.speciesStart);
    this.type = type;
    this.elementColor = color;

    this.backboneSection = backboneSection;
    this.backboneStart = this.backboneSection.start;
    this.backboneStop = this.backboneSection.stop;
    this.setYPositionsBasedOnBackboneSection();

    if (type === 'block' || type === 'gene')
    {
      this.shape = 'rect';
    }
    else
    {
      this.shape = 'line';
    }
  }

  public abstract recalculateLabelYPositions(): void;

  public adjustYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart: number, visibleBackboneStop: number)
  {
    this.backboneSection.changeWindowStartAndStop(visibleBackboneStart, visibleBackboneStop);
    this.setYPositionsBasedOnBackboneSection();
  }

  private setYPositionsBasedOnBackboneSection()
  {
    // This synteny section adopts the Y positions of its respective backbone section
    this.posY1 = this.backboneSection.posY1;
    this.posY2 = this.backboneSection.posY2;
    this.height = this.backboneSection.height;
  }
}