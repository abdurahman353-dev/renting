// lib/cloudinary.ts
// Create this file to handle Cloudinary uploads

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  // Add other fields you need
}

export const uploadToCloudinary = async (
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  // Optional: Add folder organization
  formData.append('folder', 'properties');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    return await response.json();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const uploadMultipleToCloudinary = async (
  files: File[],
  cloudName: string,
  uploadPreset: string,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const result = await uploadToCloudinary(file, cloudName, uploadPreset);
    if (onProgress) {
      onProgress(((index + 1) / files.length) * 100);
    }
    return result;
  });

  return Promise.all(uploadPromises);
};