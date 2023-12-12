const constants = {
  // overviewPanelWidth: 300, // Variable
  // detailsPanelWidth: 500, // Variable
  detailedRightPadding: 20,
  overviewTitleXPosition: 10, // Constant
  detailsTitleXPosition: 310, // Variable
  panelTitleYPosition: 15, // Constant
  panelTitleHeight: 55, // Constant
  backboneXPosition: 15, // Constant?
  viewboxHeight: 440, // Constant
  viewboxWidth: 800, // Constant
  trackWidth: 20, // Constant
  dataTrackWidth: 10, // Constant
  overviewTrackYPosition: 70, // Constant
  trackLabelYPosition: 25, // Constant
  trackMapLabelYPosition: 35, // Constant
  // selectedBackboneXPosition: 320, // Variable and redundant
  navigationButtonHeight: 15, // Constant
  overviewTrackPadding: 15, // Constant (maybe redundant)
  backboneDatatrackXOffset: 10, // Constant
};

export const PANEL_SVG_START = constants.panelTitleHeight;
export const PANEL_SVG_STOP = constants.viewboxHeight - constants.navigationButtonHeight;
export const PANEL_HEIGHT = PANEL_SVG_STOP - PANEL_SVG_START;

export type SVGPositionVariables = {
  overviewPanelWidth: number,
}

export default constants;