import { SpeciesSyntenyData } from "@/api/SyntenyApi";

const speciesSyntenyData: SpeciesSyntenyData = {
  speciesName: 'Bonobo',
  mapName: 'Mhudiblu_PPA_v0',
  mapKey: 513,
  regionData: [
    // Non-inverted block w/ no gaps
    {
      genes: [],
      block: {
        backboneMapKey: 38,
        backboneChromosome: "1",
        backboneStart: 10_000,
        backboneStop: 40_000,
        mapKey: 513,
        chromosome: "12",
        start: 60_000,
        stop: 100_000,
        orientation: "+",
        chainLevel: 1,
        chainType: "top",
      },
      gaps: [],
    },
    // Non-inverted block with a single gap
    {
      genes: [],
      block: {
        backboneMapKey: 38,
        backboneChromosome: "1",
        backboneStart: 70_000,
        backboneStop: 73_000,
        mapKey: 513,
        chromosome: "7",
        start: 130_000,
        stop: 131_000,
        orientation: "+",
        chainLevel: 1,
        chainType: "top",
      },
      gaps: [
        {
          backboneMapKey: 38,
          backboneChromosome: "1",
          backboneStart: 71_000,
          backboneStop: 72_000,
          mapKey: 513,
          chromosome: "7",
          start: 130_300,
          stop: 130_600,
          orientation: "+",
          chainLevel: 1,
          chainType: "gap",
        },
      ],
    },
    // Inverted block w/ no gaps
    {
      genes: [],
      block: {
        backboneMapKey: 38,
        backboneChromosome: "1",
        backboneStart: 80_000,
        backboneStop: 87_000,
        mapKey: 513,
        chromosome: "15",
        start: 80_000_000,
        stop: 81_000_000,
        orientation: "-",
        chainLevel: 1,
        chainType: "top",
      },
      gaps: [],
    },
    // Inverted block w/ single gap
    {
      genes: [],
      block: {
        backboneMapKey: 38,
        backboneChromosome: "1",
        backboneStart: 90_000,
        backboneStop: 100_000,
        mapKey: 513,
        chromosome: "15",
        start: 82_000_000,
        stop: 85_000_000,
        orientation: "-",
        chainLevel: 1,
        chainType: "top",
      },
      gaps: [
        {
          backboneMapKey: 38,
          backboneChromosome: "1",
          backboneStart: 92_000,
          backboneStop: 94_000,
          mapKey: 513,
          chromosome: "7",
          start: 82_500_000,
          stop: 83_500_000,
          orientation: "+",
          chainLevel: 1,
          chainType: "gap",
        },
      ],
    },
  ],
};
/* 
describe('SectionBuilder', () => {

  it('sets the correct start and stops during processing of syntenic blocks and gaps', () => {
    const syntenyRegionSet = syntenicSectionBuilder(speciesSyntenyData, 1, 100_000, 0, 'overview', 1, new Map<number, LoadedBlock>());

    expect(syntenyRegionSet.regions.length).toEqual(4);

    const region1 = syntenyRegionSet.regions[0];
    expect(region1.syntenyBlocks.length).toEqual(1);
    expect(region1.syntenyGaps.length).toEqual(0);
    expect(region1.syntenyBlocks[0].speciesStart).toEqual(60_000);
    expect(region1.syntenyBlocks[0].speciesStop).toEqual(100_000);

    const region2 = syntenyRegionSet.regions[1];
    expect(region2.syntenyBlocks.length).toEqual(2);
    expect(region2.syntenyGaps.length).toEqual(1);
    expect(region2.syntenyBlocks[0].speciesStart).toEqual(130_000);
    expect(region2.syntenyBlocks[0].speciesStop).toEqual(130_300);
    expect(region2.syntenyGaps[0].speciesStart).toEqual(130_000);
    expect(region2.syntenyGaps[0].speciesStop).toEqual(131_000);
    expect(region2.syntenyBlocks[1].speciesStart).toEqual(130_600);
    expect(region2.syntenyBlocks[1].speciesStop).toEqual(131_000);

    const region3 = syntenyRegionSet.regions[2];
    expect(region3.syntenyBlocks.length).toEqual(1);
    expect(region3.syntenyGaps.length).toEqual(0);
    expect(region3.syntenyBlocks[0].speciesStart).toEqual(81_000_000);
    expect(region3.syntenyBlocks[0].speciesStop).toEqual(80_000_000);

    const region4 = syntenyRegionSet.regions[3];
    expect(region4.syntenyBlocks.length).toEqual(2);
    expect(region4.syntenyGaps.length).toEqual(1);
    expect(region4.syntenyBlocks[0].speciesStart).toEqual(85_000_000);
    expect(region4.syntenyBlocks[0].speciesStop).toEqual(83_500_000);
    expect(region4.syntenyGaps[0].speciesStart).toEqual(85_000_000);
    expect(region4.syntenyGaps[0].speciesStop).toEqual(82_000_000);
    expect(region4.syntenyBlocks[1].speciesStart).toEqual(82_500_000);
    expect(region4.syntenyBlocks[1].speciesStop).toEqual(82_000_000);
  });
}); */