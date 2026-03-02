import cv2
import pytesseract
import re
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Ensure this path matches your Tesseract installation
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(img):
    """
    Enhances contrast and sharpens text to separate it from background watermarks.
    """
    if img is None: return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Increase contrast to make text stand out from the gray watermark
    gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
    # Sharpen edges
    kernel = np.array([[0, -1, 0], [-1, 5,-1], [0, -1, 0]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    _, thresh = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def extract_info(img, image_filename):
    details = {}
    preprocessed_img = preprocess_image(img)
    # PSM 6: Assume a single uniform block of text
    raw_text = pytesseract.image_to_string(preprocessed_img, config="--psm 6")

    print(f"\n--- Processing {image_filename} ---")
    print(raw_text)
    
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    full_text_upper = raw_text.upper()

    if "front" in image_filename:
        # 1. FIND ID (Registration Number)
        # Matches CS / digits / digits regardless of initial misread symbol
        id_pattern = r'CS\s*/\s*\d{4,5}\s*/\s*\d{2}'#recent change to allow 4 or 5 digits in the middle part
        id_match = re.search(id_pattern, full_text_upper)
        
        if id_match:
            # Force standardize to start with 'S'
            clean_id = "S" + id_match.group(0).replace(" ", "")
            details["Registration Number"] = clean_id
            
            # 2. FIND NAME BY POSITION (Directly above the ID)
            for i, line in enumerate(lines):
                # Check if this line is the ID line
                if "CS/" in line.upper().replace(" ", ""):
                    # Look at the 3 lines immediately preceding the ID line
                    search_area = lines[max(0, i-3):i]
                    for potential_name in reversed(search_area):
                        # Clean noise symbols
                        n = re.sub(r'[^A-Z\s]', '', potential_name).strip()
                        
                        # Names are usually 2-4 words and avoid header keywords
                        blacklist = ["SCHOOL", "ENGINEERING", "TECHNOLOGY", "SCMS", "PHONE", "CV", "PPO"]
                        if len(n) > 8 and not any(w in n for w in blacklist):
                            if 2 <= len(n.split()) <= 4:
                                details["Name"] = n
                                break
                    if "Name" in details: break

        # FALLBACK: If proximity search failed, scan for ALL CAPS lines
        if "Name" not in details:
            for line in lines:
                n = re.sub(r'[^A-Z\s]', '', line).strip()
                blacklist = ["SCHOOL", "ENGINEERING", "TECHNOLOGY", "SCMS", "KARUKUTTY", "CV", "PPO"]
                if len(n) > 10 and not any(w in n for w in blacklist):
                    if 2 <= len(n.split()) <= 4:
                        details["Name"] = n
                        break

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

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    if 'file' not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files['file']
    try:
        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
        filename = file.filename.lower()
        extracted_details = extract_info(img, filename)
        
        # Hardcoded predetermined context
        if "front" in filename:
             extracted_details["University"] = "SCMS SCHOOL OF ENGINEERING AND TECHNOLOGY"
             extracted_details["Course"] = "B.Tech - Computer Science & Engg"
             extracted_details["University Address"] = "Vidya Nagar, Karukutty, Ernakulam-683582"
             extracted_details["University Phone"] = "0484 2450330, 2451907"
             
        return jsonify(extracted_details)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)