import cv2
import pytesseract
import re
import numpy as np
import json
import os
from flask import Flask, request, jsonify # <-- Flask components added
from flask_cors import CORS

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)
# --- IMPORTANT ---
# Make sure this path is correct for your Tesseract installation.
try:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
except Exception:
    print("Warning: Tesseract command path not set or incorrect. Update the path if needed.")
# ----------------- Helper Functions (Your Original Code) -----------------

def preprocess_image(img):
    """
    Advanced preprocessing pipeline for better OCR accuracy on complex images.
    """
    if img is None:
        raise ValueError("Empty image passed to preprocess_image")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.bilateralFilter(gray, 9, 75, 75)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_contrast = clahe.apply(blur)
    _, thresh = cv2.threshold(enhanced_contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def extract_info(img, image_filename):
    """Processes a single image and extracts relevant information."""
    details = {}
    preprocessed_img = preprocess_image(img)
    raw_text = pytesseract.image_to_string(preprocessed_img, config="--psm 6")

    # --- DEBUGGING ---
    print(f"\n--- Raw OCR Output for {image_filename} ---")
    print(raw_text)
    print("------------------------------------------")

    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    full_text_lower = raw_text.lower()

    # --- Extraction Logic ---

    if "front" in image_filename:
        for line in lines:
            if re.fullmatch(r'[A-Z\s]{5,25}', line) and len(line.split()) in [2, 3]:
                 if "SCHOOL" not in line and "ENGINEERING" not in line:
                    details["Name"] = line
                    break
        reg_match = re.search(r'(scs|§cs)\s*/\s*\d{5}\s*/\s*\d{2}', full_text_lower)
        if reg_match:
            details["Registration Number"] = reg_match.group(0).upper().replace(" ", "").replace("§", "S")

    if "back" in image_filename:
        for line in lines:
            line_lower = line.lower()
            batch_match = re.search(r'(\d{4})\s*-\s*(\d{4})', line)
            if "batch" in line_lower and batch_match: details["Batch"] = f"{batch_match.group(1)}-{batch_match.group(2)}"
            
            dob_match = re.search(r'(\d{2}-\d{2}-\d{4})', line)
            if "birth" in line_lower and dob_match: details["DOB"] = dob_match.group(1)
            
            mobile_match = re.search(r'(\d{10})', line.replace(" ", ""))
            if "mobile" in line_lower and mobile_match: details["Mobile Number"] = mobile_match.group(1)
            
            contact_match = re.search(r'(\d{10})', line.replace(" ", ""))
            if "contact no" in line_lower and contact_match: details["Emergency Contact"] = contact_match.group(1)
            
            blood_match = re.search(r':\s*([A-Z0-9+\s]+VE)', line, re.IGNORECASE)
            if "blood group" in line_lower and blood_match:
                details["Blood Group"] = blood_match.group(1).strip().replace("8", "B")
            
            admn_match = re.search(r'(\d{2}-\d{2}-\d{4})', line)
            if ("admn" in line_lower or "adma" in line_lower) and admn_match:
                details["Admission Date"] = admn_match.group(1)
            
            validity_match = re.search(r'(UPTO\s*\d{4})', line, re.IGNORECASE)
            if "validity" in line_lower and validity_match: details["Validity"] = validity_match.group(1)
            
    return details

# ----------------- Flask Web Service Endpoint -----------------

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400

    try:
        # Read the image file stream into memory
        filestr = file.read()
        # Convert the image stream to a numpy array
        npimg = np.frombuffer(filestr, np.uint8)
        # Decode the numpy array into an OpenCV image
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # The filename helps determine if it's the front or back of the card
        filename = file.filename.lower()

        # Call your existing, tested extraction function
        extracted_details = extract_info(img, filename)
        
        # Add the hardcoded university info to the response if it was the front image
        if "front" in filename:
             extracted_details["University"] = "SCMS SCHOOL OF ENGINEERING AND TECHNOLOGY"
             extracted_details["University Address"] = "Vidya Nagar, Karukutty, Ernakulam-683582"
             extracted_details["University Phone"] = "0484 2450330, 2451907"
             extracted_details["Course"] = "B.Tech - Computer Science & Engg"

        return jsonify(extracted_details)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- Main Script (Now runs the Flask server) -----------------

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
