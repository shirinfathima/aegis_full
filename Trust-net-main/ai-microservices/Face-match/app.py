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


# ================= HELPERS ================= #

def preprocess_image(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)  # contrast
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(gray, -1, kernel)            # sharpen
    _, thresh = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh


def extract_info(img, image_filename):
    details = {}
    preprocessed_img = preprocess_image(img)
    raw_text = pytesseract.image_to_string(preprocessed_img, config="--psm 6")
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    full_text_upper = raw_text.upper()

    if "front" in image_filename:
        cleaned_text = full_text_upper.replace("$", "S")
        id_match = re.search(r'[A-Z]{2,4}\s*/\s*\d{3,6}\s*/\s*\d{2}', cleaned_text)
        if id_match:
            raw_id = id_match.group(0).replace(" ", "")
            if not raw_id.startswith("SCS"):
                raw_id = "SCS" + raw_id[-8:]
            details["Registration Number"] = raw_id

        blacklist = ["SCHOOL", "ENGINEERING", "TECHNOLOGY", "SCMS",
                     "PHONE", "KARUKUTTY", "VIDYA", "NAGAR", "WWW"]
        for line in lines:
            normalized = re.sub(r'[^A-Z\s]', '', line.upper()).strip()
            if (len(normalized) > 8 and
                2 <= len(normalized.split()) <= 4 and
                not any(w in normalized for w in blacklist)):
                details["Name"] = normalized
                break

    if "back" in image_filename:
        for line in lines:
            ll = line.lower()
            if "batch" in ll:
                m = re.search(r'(\d{4})\s*-\s*(\d{4})', line)
                if m: details["Batch"] = f"{m.group(1)}-{m.group(2)}"
            if "birth" in ll:
                m = re.search(r'(\d{2}-\d{2}-\d{4})', line)
                if m: details["DOB"] = m.group(1)
            if "mobile" in ll:
                m = re.search(r'(\d{10})', line.replace(" ", ""))
                if m: details["Mobile Number"] = m.group(1)
            if "contact no" in ll:
                m = re.search(r'(\d{10})', line.replace(" ", ""))
                if m: details["Emergency Contact"] = m.group(1)
            if "blood group" in ll:
                m = re.search(r':\s*([A-Z0-9+\s]+VE)', line, re.IGNORECASE)
                if m: details["Blood Group"] = m.group(1).strip().replace("8", "B")
            if "admn" in ll or "adma" in ll:
                m = re.search(r'(\d{2}-\d{2}-\d{4})', line)
                if m: details["Admission Date"] = m.group(1)
            if "validity" in ll:
                m = re.search(r'(UPTO\s*\d{4})', line, re.IGNORECASE)
                if m: details["Validity"] = m.group(1)

    return details


# ================= FACE MATCH ================= #

@app.route("/face-match", methods=["POST"])
def face_match():
    if "selfie" not in request.files or "document" not in request.files:
        return jsonify({"error": "Both selfie and document images are required"}), 400

    selfie = request.files["selfie"]
    document = request.files["document"]
    selfie_path = os.path.join(UPLOAD_FOLDER, secure_filename(selfie.filename))
    document_path = os.path.join(UPLOAD_FOLDER, secure_filename(document.filename))

    try:
        selfie.save(selfie_path)
        document.save(document_path)

        model_name = request.form.get("model", "Facenet512")
        result = DeepFace.verify(
            img1_path=document_path,
            img2_path=selfie_path,
            model_name=model_name,
            enforce_detection=False
        )

        distance = float(result["distance"])
        threshold = 0.55
        match = distance < threshold

        return jsonify({
            "match": match,
            "confidence": round((1 - distance) * 100, 2),
            "distance": distance,
            "threshold": threshold
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(selfie_path): os.remove(selfie_path)
        if os.path.exists(document_path): os.remove(document_path)


# ================= LIVENESS CHECK ================= #

@app.route("/liveness-check", methods=["POST"])
def liveness_check():
    front = request.files.get("frontImage")
    selfie = request.files.get("selfieImage")

    if not front or not selfie:
        return jsonify({"error": "Missing required images. Please ensure Front ID and Selfie are provided."}), 400

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

        distance = float(result["distance"])
        match = distance < 0.55

        return jsonify({
            "status": "success",
            "verification": {
                "match": match,
                "confidence": round((1 - distance) * 100, 2),
                "distance": distance,
                "threshold": 0.55
            },
            "message": "Identity verification completed successfully."
        })

    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

    finally:
        if os.path.exists(front_path): os.remove(front_path)
        if os.path.exists(selfie_path): os.remove(selfie_path)


# ================= OCR ================= #

@app.route("/ocr", methods=["POST"])
def ocr():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    filename = file.filename.lower()

    try:
        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
        extracted = extract_info(img, filename)

        if "front" in filename:
            extracted["University"] = "SCMS SCHOOL OF ENGINEERING AND TECHNOLOGY"
            extracted["Course"] = "B.Tech - Computer Science & Engg"
            extracted["University Address"] = "Vidya Nagar, Karukutty, Ernakulam-683582"
            extracted["University Phone"] = "0484 2450330, 2451907"

        return jsonify(extracted)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= ROOT ================= #

@app.route("/")
def home():
    return "Unified AI Service Running"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)