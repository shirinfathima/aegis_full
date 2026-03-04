import os

# Force TensorFlow to NOT use legacy keras
os.environ["TF_USE_LEGACY_KERAS"] = "0"

from flask import Flask, request, jsonify
from deepface import DeepFace
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/face-match", methods=["POST"])
def face_match():
    # Validate required files
    if "selfie" not in request.files or "document" not in request.files:
        return jsonify({
            "error": "Both selfie and document images are required"
        }), 400

    selfie_file = request.files["selfie"]
    document_file = request.files["document"]

    if selfie_file.filename == "" or document_file.filename == "":
        return jsonify({
            "error": "Invalid file upload"
        }), 400

    selfie_filename = secure_filename(selfie_file.filename)
    document_filename = secure_filename(document_file.filename)

    selfie_path = os.path.join(UPLOAD_FOLDER, selfie_filename)
    document_path = os.path.join(UPLOAD_FOLDER, document_filename)

    try:
        # Save uploaded images
        selfie_file.save(selfie_path)
        document_file.save(document_path)

        # Optional model parameter
        model_name = request.form.get("model", "Facenet512")

        # Perform face verification
        result = DeepFace.verify(
            img1_path=document_path,
            img2_path=selfie_path,
            model_name=model_name
        )

        # Convert numpy types to Python native types
        distance = float(result["distance"])
        threshold = 0.55

        match = bool(distance < threshold)
        confidence = float(round((1 - distance) * 100, 2))

        response = {
            "match": match,
            "confidence": confidence,
            "distance": distance,
            "threshold": threshold
        }

        return jsonify(response), 200

    except ValueError as ve:
        return jsonify({
            "error": f"Face detection error: {str(ve)}"
        }), 400

    except Exception as e:
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500

    finally:
        # Cleanup uploaded files
        if os.path.exists(selfie_path):
            os.remove(selfie_path)
        if os.path.exists(document_path):
            os.remove(document_path)


if __name__ == "__main__":
    app.run(debug=True, port=5001)