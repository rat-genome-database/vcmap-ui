import BackboneSection from "@/new_models/BackboneSection";
import Chromosome from "@/new_models/Chromosome";
import Species from "@/new_models/Species";
import SpeciesMap from "@/new_models/SpeciesMap";
import SyntenySection from "@/new_models/SyntenySection";

const testBackboneSection = new BackboneSection({
  start: 100,
  stop: 10000,
  windowStart: 100,
  windowStop: 10000,
  chromosome: '2',
  species: new Species({ typeKey: 1, name: 'Human', maps: [new SpeciesMap({ key: 1, name: 'Map', primaryRefAssembly: true })] }),
  renderType: 'overview',
});

const testChromosome = new Chromosome({
  mapKey: 38, chromosome: '1', seqLength: 1000000
});

let syntenySection: SyntenySection;

beforeEach(() => {
  syntenySection = new SyntenySection({
    start: 1,
    stop: 1000,
    type: 'block',
    threshold: 500,
    orientation: '+',
    chromosome: testChromosome,
    chainLevel: 1,
    backboneSection: testBackboneSection,
  });
});


describe('SyntenySection', () => {

  it('adopts the Y positions of its equivalent backbone section', () => {
    expect(syntenySection.posY1 === testBackboneSection.posY1 && syntenySection.posY2 === testBackboneSection.posY2).toBeTruthy();
  });

  it('uses the expected element color of its chromosome', () => {
    expect(syntenySection.elementColor === Chromosome.getColor(testChromosome.chromosome)).toBeTruthy();
  });
  
});