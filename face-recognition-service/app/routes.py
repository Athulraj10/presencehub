import os
from flask import Blueprint, request, jsonify
from app.utils import (
    decode_image_file,
    extract_face_embedding,
    embedding_to_string,
    string_to_embedding,
    compare_embeddings
)

face_bp = Blueprint("face", __name__)

# Load configuration from environment variables
TOLERANCE = float(os.environ.get("FACE_VERIFICATION_TOLERANCE", 0.6))

@face_bp.route("/generate-embedding", methods=["POST"])
def generate_embedding():
    """
    Endpoint: POST /generate-embedding
    Accepts an uploaded image file via multipart/form-data, extracts a single face,
    generates a 128-d embedding, and returns it as a comma-separated string.
    """
    if 'image' not in request.files:
        return jsonify({
            "success": False,
            "error": "Missing 'image' file in multipart/form-data request"
        }), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({
            "success": False,
            "error": "No selected file"
        }), 400

    try:
        # 1. Decode image file
        img_array = decode_image_file(image_file)
        
        # 2. Extract embedding (handles 0 or >1 face detection exceptions)
        embedding = extract_face_embedding(img_array)
        
        # 3. Convert embedding to string
        embedding_str = embedding_to_string(embedding)
        
        return jsonify({
            "success": True,
            "embedding": embedding_str
        }), 200

    except ValueError as ve:
        # Catch validation errors (No face, Multiple faces, Corrupted image, Invalid format)
        return jsonify({
            "success": False,
            "error": str(ve)
        }), 400
    except Exception as e:
        # Catch any unexpected errors
        return jsonify({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}"
        }), 500


@face_bp.route('/verify-face', methods=['POST'])
def verify_face():
    """
    Endpoint: POST /verify-face
    Accepts an uploaded selfie image and a stored embedding string.
    Extracts a live embedding, compares them, and returns whether they match.
    """
    if 'image' not in request.files:
        return jsonify({
            "success": False,
            "error": "Missing 'image' file in multipart/form-data request"
        }), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({
            "success": False,
            "error": "No selected file"
        }), 400

    stored_embedding_str = request.form.get('storedEmbedding')
    if not stored_embedding_str:
        return jsonify({
            "success": False,
            "error": "Missing 'storedEmbedding' field in form data"
        }), 400

    try:
        # 1. Decode the stored embedding string
        stored_embedding = string_to_embedding(stored_embedding_str)
        
        # 2. Decode the incoming image file
        img_array = decode_image_file(image_file)
        
        # 3. Extract the live face embedding
        live_embedding = extract_face_embedding(img_array)
        
        # 4. Compare the embeddings
        matched = compare_embeddings(stored_embedding, live_embedding, tolerance=TOLERANCE)
        
        return jsonify({
            "success": True,
            "matched": matched
        }), 200

    except ValueError as ve:
        # Catch validation errors (No face, Multiple faces, Corrupted image, Invalid embedding)
        return jsonify({
            "success": False,
            "error": str(ve)
        }), 400
    except Exception as e:
        # Catch any unexpected errors
        return jsonify({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}"
        }), 500
