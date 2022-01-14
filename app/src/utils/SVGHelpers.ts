/**
 * Helper method to get the coordinates of an event in the SVG viewbox
 */
export function getMousePosSVG(svg: SVGSVGElement | null, event: any)
{
  if (svg == null)
  {
    // For some reason, trying to create an instance of DOMPoint here causes a reference error in our unit tests
    return { y: 0, x: 0 };
  }

  let p = svg.createSVGPoint();
  p.x = event.clientX;
  p.y = event.clientY;
  const ctm = svg.getScreenCTM()?.inverse();
  p = p.matrixTransform(ctm);
  return p;
}