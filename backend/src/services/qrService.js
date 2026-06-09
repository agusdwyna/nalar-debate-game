import QRCode from 'qrcode';

/**
 * Generates a base64 QR code data URL.
 * @param {string} text - The invite link or URL to encode.
 * @returns {Promise<string>} Base64 data URL
 */
export async function generateQRCode(text) {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 2,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}
