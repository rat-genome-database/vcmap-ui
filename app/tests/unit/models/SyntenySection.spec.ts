import Chromosome from "@/models/Chromosome";
import SyntenySection from "@/models/SyntenySection";

let syntenySection: SyntenySection;

beforeEach(() => {
  syntenySection = new SyntenySection({
    speciesName: 'Human',
    mapName: 'GRCH38',
    start: 1,
    stop: 1000,
    type: 'block',
    windowBasePairRange: { start: 100, stop: 10000 },
    orientation: '+',
    chromosome: '1',
    chainLevel: 1,
    backboneAlignment: { start: 100, stop: 10000 },
    renderType: 'detailed',
  });
});


describe('SyntenySection', () => {
  it('uses the expected element color of its chromosome', () => {
    expect(syntenySection.elementColor === Chromosome.getColor('1')).toBeTruthy();
  });  
});