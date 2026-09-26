/**
 * ImageKit Integration Utility
 * Supports image optimization, transformations, and client-side uploads
 */
import ImageKit from 'imagekit-javascript';

export const getImageKitClient = () => {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || 'your_imagekit_public_key';
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/your_imagekit_id';

  return new ImageKit({
    publicKey,
    urlEndpoint,
  });
};

/**
 * Fetch authentication parameters from server endpoint
 */
export async function getAuthParameters(): Promise<{ token: string; expire: number; signature: string }> {
  const response = await fetch('/api/imagekit-auth');
  if (!response.ok) {
    throw new Error('Failed to retrieve ImageKit authentication parameters');
  }
  return response.json();
}

/**
 * Upload an image file directly to ImageKit
 * @param file - File object from input[type="file"]
 * @param fileName - Desired file name
 * @param folder - Folder path in ImageKit (e.g. '/products', '/banners')
 */
export async function uploadImageToImageKit(
  file: File,
  fileName?: string,
  folder: string = '/products'
): Promise<{ url: string; fileId: string; name: string }> {
  const ik = getImageKitClient();
  const authParams = await getAuthParameters();

  return new Promise((resolve, reject) => {
    ik.upload(
      {
        file,
        fileName: fileName || file.name,
        folder,
        useUniqueFileName: true,
        tags: ['sari-ecommerce', folder.replace('/', '')],
        token: authParams.token,
        expire: authParams.expire,
        signature: authParams.signature,
      },
      (err, result) => {
        if (err) {
          console.error('ImageKit upload error:', err);
          reject(err);
        } else if (result) {
          resolve({
            url: result.url,
            fileId: result.fileId,
            name: result.name,
          });
        } else {
          reject(new Error('Unknown upload failure'));
        }
      }
    );
  });
}

/**
 * Generate an optimized ImageKit transformation URL
 * @param path - Image path or full URL
 * @param width - Desired width
 * @param height - Desired height
 * @param quality - Quality (1-100)
 */
export function getOptimizedImageUrl(
  path: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  if (!path) return '';
  if (path.startsWith('/')) return path;

  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!urlEndpoint) return path;

  const transformations: string[] = [`q-${quality}`];
  if (width) transformations.push(`w-${width}`);
  if (height) transformations.push(`h-${height}`);
  transformations.push('f-auto');

  return `${urlEndpoint.replace(/\/$/, '')}/tr:${transformations.join(',')}/${path.replace(/^\//, '')}`;
}
