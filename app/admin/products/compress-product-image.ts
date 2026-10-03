const maxProductImageDimension = 1800;
const productImageQuality = 0.84;

function createImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", productImageQuality);
  });
}

export async function compressProductImage(file: File) {
  const image = await createImageElement(file);
  const scale = Math.min(
    1,
    maxProductImageDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);

  const compressedBlob = await canvasToBlob(canvas);

  if (!compressedBlob || compressedBlob.size >= file.size) {
    return file;
  }

  return new File([compressedBlob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
    lastModified: Date.now(),
    type: "image/webp",
  });
}
