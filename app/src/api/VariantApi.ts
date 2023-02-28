import httpInstance from './httpInstance';

export default class VariantApi
{
  static async getVariants(chr: string, start: number, stop: number, mapKey: number)
  {
    const variantStartPositions = await httpInstance.get<any>(`/vcmap/variants/position/${chr}/${start}/${stop}/${mapKey}`);

    return variantStartPositions;
  }
}