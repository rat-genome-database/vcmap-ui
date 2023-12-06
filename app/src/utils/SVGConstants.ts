const constants = {
  overviewPanelWidth: 300,
  detailsPanelWidth: 500,
  overviewTitleXPosition: 10,
  detailsTitleXPosition: 310,
  panelTitleYPosition: 15,
  panelTitleHeight: 55,
  backboneXPosition: 15,
  viewboxHeight: 440,
  trackWidth: 20,
  dataTrackWidth: 10,
  overviewTrackYPosition: 70,
  trackLabelYPosition: 25,
  trackMapLabelYPosition: 35,
  selectedBackboneXPosition: 320,
  navigationButtonHeight: 15,
  overviewTrackPadding: 15,
  backboneDatatrackXOffset: 10,
};

export const PANEL_SVG_START = constants.panelTitleHeight;
export const PANEL_SVG_STOP = constants.viewboxHeight - constants.navigationButtonHeight;
export const PANEL_HEIGHT = PANEL_SVG_STOP - PANEL_SVG_START;

// NOTE: I'm commenting these out for now because I'm not using them,
// but I think we can use something like this to start setting some variables
// to adjust positions and spacing of elements in the svg
// export type SVGPositionVariables = {
//   detailedStart: number,
//   detailedSpeciesGap: number,
// }

export default constants;