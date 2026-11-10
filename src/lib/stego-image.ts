import { AlphaType, ColorType, ImageFormat, Skia } from "@shopify/react-native-skia";

export type DecodedImage = { width: number, height: number, pixels: Uint8Array }

export function decodeImage(base64: string): DecodedImage {
  const image = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(base64));
  if(!image) throw new Error("Obrázek se nepodařilo dekódovat.");

  const width = image.width();
  const height = image.height();
  const pixels = image.readPixels(0, 0, {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul
  });
  if(!(pixels instanceof Uint8Array)) throw new Error("Nepodařilo se přečíst pixely.");
  return { width, height, pixels };
}

export function encodePng(pixels: Uint8Array, width: number, height: number): string {
  const image = Skia.Image.MakeImage(
    { width, height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    Skia.Data.fromBytes(pixels),
    width * 4
  );
  if(!image) throw new Error("Obrázek se nepodařilo vytvořit.");
  return image.encodeToBase64(ImageFormat.PNG);
}