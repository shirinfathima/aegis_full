import os
os.environ["TF_USE_LEGACY_KERAS"] = "0"

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from deepface import DeepFace
import cv2
import numpy as np
import pytesseract
import re

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ================= FACE MATCH ================= #
@app.route("/face-match", methods=["POST"])
def face_match():
    if "selfie" not in request.files or "document" not in request.files:
        return jsonify({"error": "Both images required"}), 400

    selfie = request.files["selfie"]
    document = request.files["document"]

    selfie_path = os.path.join(UPLOAD_FOLDER, secure_filename(selfie.filename))
    document_path = os.path.join(UPLOAD_FOLDER, secure_filename(document.filename))

    try:
        selfie.save(selfie_path)
        document.save(document_path)

        result = DeepFace.verify(
            img1_path=document_path,
            img2_path=selfie_path,
            model_name="Facenet512",
            enforce_detection=False
        )

        distance = float(result["distance"])
        match = distance < 0.55

        return jsonify({
            "match": match,
            "confidence": round((1 - distance) * 100, 2),
            "distance": distance
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(selfie_path): os.remove(selfie_path)
        if os.path.exists(document_path): os.remove(document_path)


# ================= LIVENESS ================= #
@app.route("/liveness-check", methods=["POST"])
def liveness_check():
    front = request.files.get("frontImage")
    selfie = request.files.get("selfieImage")

    if not front or not selfie:
        return jsonify({"error": "Missing images"}), 400

    front_path = os.path.join(UPLOAD_FOLDER, secure_filename(front.filename))
    selfie_path = os.path.join(UPLOAD_FOLDER, secure_filename(selfie.filename))

    try:
        front.save(front_path)
        selfie.save(selfie_path)

        result = DeepFace.verify(
            img1_path=front_path,
            img2_path=selfie_path,
            model_name="Facenet512",
            enforce_detection=False
        )

        return jsonify({
            "status": "success",
            "verification": result
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(front_path): os.remove(front_path)
        if os.path.exists(selfie_path): os.remove(selfie_path)


# ================= OCR ================= #
def preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

@app.route("/ocr", methods=["POST"])
def ocr():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]

    try:
        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
        processed = preprocess(img)

        text = pytesseract.image_to_string(processed)

        return jsonify({"text": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= ROOT ================= #
@app.route("/")
def home():
    return "Unified AI Service Running"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)