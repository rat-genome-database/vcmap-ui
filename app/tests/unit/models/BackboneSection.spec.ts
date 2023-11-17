import BackboneSection, { BackboneSectionParams } from "@/models/BackboneSection";
import Species from "@/models/Species";
import SpeciesMap from "@/models/SpeciesMap";
import { Formatter } from "@/utils/Formatter";
import SVGConstants, { PANEL_HEIGHT, PANEL_SVG_START, PANEL_SVG_STOP } from "@/utils/SVGConstants";

let backboneSectionParams: BackboneSectionParams;

beforeEach(() => {
  backboneSectionParams = {
    start: 100,
    stop: 10000,
    windowBasePairRange: { start: 100, stop: 10000 },
    chromosome: '2',
    species: new Species({ typeKey: 1, name: 'Human', maps: [new SpeciesMap({ key: 1, name: 'Map', primaryRefAssembly: true })] }),
    renderType: 'overview',
    order: 0,
  };
});


describe('BackboneSection', () => {

  it('creates basepair labels according to createLabels param', () => {
    let backbone = new BackboneSection({
      ...backboneSectionParams,
      createLabels: true
    });

    expect(backbone.labels.length > 0).toBeTruthy();
    expect(backbone.labels[0].text).toEqual(Formatter.convertBasePairToLabel(100));
    expect(backbone.labels[1].text).toEqual(Formatter.convertBasePairToLabel(10000));

    backbone = new BackboneSection(backboneSectionParams);
    expect(backbone.labels.length).toEqual(0);
  });

  describe('Overview Panel', () => {
    it('correctly calculates Y positions when the backbone is the same size as the visible window', () => {
      const backbone = new BackboneSection(backboneSectionParams);

      const expectedPosY1 = PANEL_SVG_START + SVGConstants.overviewTrackPadding;
      const expectedPosY2 = PANEL_SVG_STOP - SVGConstants.overviewTrackPadding;

      expect(backbone.posY1).toEqual(expectedPosY1);
      expect(backbone.posY2).toEqual(expectedPosY2);
    });
  });


  describe('Detailed Panel', () => {
    it('correctly calculates Y positions when the backbone is the same size as the visible window', () => {
      const backbone = new BackboneSection({
        ...backboneSectionParams,
        renderType: 'detailed',
      });

      const expectedPosY1 = PANEL_SVG_START;
      const expectedPosY2 = PANEL_SVG_STOP;

      expect(backbone.posY1).toEqual(expectedPosY1);
      expect(backbone.posY2).toEqual(expectedPosY2);
    });

    it('correctly calculates Y positions when the backbone is larger than the visible window', () => {
      // Simulates being zoomed in on the detailed panel backbone

      const backbone = new BackboneSection({
        ...backboneSectionParams,
        // Use friendly start/stop numbers for this test
        start: 0,
        stop: 3000,
        windowBasePairRange: { start: 1000, stop: 2000 },
        renderType: 'detailed',
      });

      expect(backbone.posY1).toEqual(PANEL_SVG_START - PANEL_HEIGHT);
      expect(backbone.posY2).toEqual(PANEL_SVG_STOP + PANEL_HEIGHT);
    });

    it('correctly calculates Y positions when only a portion of the backbone is visible in the window', () => {
      // Simulates being zoomed in on the detailed panel backbone

      const backbone = new BackboneSection({
        ...backboneSectionParams,
        // Use friendly start/stop numbers for this test
        start: 500,
        stop: 1500,
        windowBasePairRange: { start: 0, stop: 2000 },
        renderType: 'detailed',
      });

      expect(backbone.posY1).toEqual(PANEL_SVG_START + (PANEL_HEIGHT / 4));
      expect(backbone.posY2).toEqual(PANEL_SVG_STOP - (PANEL_HEIGHT / 4));
    });
  });

});