const axios = require("axios");
const FormData = require("form-data");

class FaceService {
  /**
   * Generates embedding for the provided image buffer.
   * @param {Buffer} fileBuffer - The image file buffer.
   * @param {string} originalName - The original name of the file.
   * @param {string} mimeType - The mime type of the file.
   * @returns {Promise<string>} The generated face embedding.
   */
  static async generateEmbedding(fileBuffer, originalName, mimeType) {
    const url = `${process.env.FACE_SERVICE_URL || "http://127.0.0.1:5001"}/generate-embedding`;
    const form = new FormData();
    form.append("image", fileBuffer, {
      filename: originalName || "image.jpg",
      contentType: mimeType || "image/jpeg",
    });

    try {
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 10000, // 10 second timeout for face processing
      });

      if (response.data && response.data.success) {
        return response.data.embedding;
      }
      throw new Error(response.data.error || "Failed to generate face embedding.");
    } catch (error) {
      this.handleAxiosError(error, "generating face embedding");
    }
  }

  /**
   * Verifies the face selfie against the stored embedding.
   * @param {Buffer} fileBuffer - The selfie image file buffer.
   * @param {string} originalName - The original name of the file.
   * @param {string} mimeType - The mime type of the file.
   * @param {string} storedEmbedding - The stored face embedding string.
   * @returns {Promise<boolean>} True if matched, false otherwise.
   */
  static async verifyFace(fileBuffer, originalName, mimeType, storedEmbedding) {
    const url = `${process.env.FACE_SERVICE_URL || "http://127.0.0.1:5001"}/verify-face`;
    const form = new FormData();
    form.append("image", fileBuffer, {
      filename: originalName || "image.jpg",
      contentType: mimeType || "image/jpeg",
    });
    form.append("storedEmbedding", storedEmbedding);

    try {
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 10000, // 10 second timeout for face verification
      });

      if (response.data && response.data.success) {
        return response.data.matched;
      }
      throw new Error(response.data.error || "Failed to verify face.");
    } catch (error) {
      this.handleAxiosError(error, "verifying face");
    }
  }

  /**
   * Centralized axios error handler that maps error codes to domain-specific errors.
   */
  static handleAxiosError(error, context) {
    if (error.code === "ECONNREFUSED") {
      const err = new Error("Face recognition service is currently unavailable.");
      err.status = 503;
      throw err;
    }
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      const err = new Error("Face recognition service request timed out.");
      err.status = 504;
      throw err;
    }
    if (error.response) {
      const serverError = error.response.data && error.response.data.error;
      const err = new Error(serverError || `Face recognition service error during ${context}.`);
      err.status = error.response.status || 400;
      throw err;
    }
    throw error;
  }
}

module.exports = FaceService;
