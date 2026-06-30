import io
import numpy as np
from PIL import Image
import face_recognition

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def decode_image_file(image_file):
    """
    Decodes an uploaded image file into a numpy array (RGB).
    Validates file extension and image integrity.
    """
    if not image_file:
        raise ValueError("No file provided")
        
    filename = getattr(image_file, 'filename', '')
    if not filename:
        raise ValueError("Empty or invalid filename")
        
    if not allowed_file(filename):
        raise ValueError("Invalid image format. Allowed formats: png, jpg, jpeg")
        
    try:
        # Seek to beginning in case it was read/partially read
        image_file.seek(0)
        image_bytes = image_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if not already
        if image.mode != "RGB":
            image = image.convert("RGB")

        img_array = np.array(image)

        # Debug
        print("Converted Mode:", image.mode)
        print("Shape         :", img_array.shape)
        print("Dtype         :", img_array.dtype)
        print("================================\n")

        return img_array

    except Exception as e:
        raise ValueError(f"Invalid or corrupted image: {str(e)}")


def extract_face_embedding(img_array):
    """
    Detects faces in the image and returns the 128-dimensional embedding.
    Raises ValueError if 0 or >1 faces are detected.
    """

    print("\n========== NUMPY DEBUG ==========")
    print("Array Type :", type(img_array))
    print("Array Shape:", img_array.shape)
    print("Array Dtype:", img_array.dtype)
    print("Min Pixel  :", np.min(img_array))
    print("Max Pixel  :", np.max(img_array))
    print("=================================\n")

    # Detect face locations
    face_locations = face_recognition.face_locations(img_array)

    print("Faces Found:", len(face_locations))

    if len(face_locations) == 0:
        raise ValueError("No face detected")
    elif len(face_locations) > 1:
        raise ValueError("Multiple faces detected")

    # Generate embedding
    encodings = face_recognition.face_encodings(
        img_array,
        known_face_locations=face_locations
    )

    if not encodings:
        raise ValueError("Failed to generate face embedding")

    return encodings[0]


def embedding_to_string(embedding):
    """
    Converts a numpy embedding array to a comma-separated string.
    """
    return ",".join(map(str, embedding.tolist()))


def string_to_embedding(embedding_str):
    """
    Converts a comma-separated embedding string back to a numpy array.
    """
    if not embedding_str or not isinstance(embedding_str, str):
        raise ValueError("Embedding must be a non-empty string")

    try:
        parts = [x.strip() for x in embedding_str.split(",") if x.strip()]

        if len(parts) != 128:
            raise ValueError(
                f"Expected 128-dimensional embedding, but got {len(parts)} values"
            )

        return np.array(parts, dtype=np.float64)

    except ValueError as ve:
        raise ValueError(str(ve))
    except Exception as e:
        raise ValueError(f"Invalid embedding format: {str(e)}")


def compare_embeddings(stored_embedding, live_embedding, tolerance=0.6):
    """
    Compares stored embedding with live embedding.
    Returns True if they match, False otherwise.
    """
    results = face_recognition.compare_faces(
        [stored_embedding],
        live_embedding,
        tolerance=tolerance
    )

    return bool(results[0])









