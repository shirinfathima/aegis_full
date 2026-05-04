from flask import Flask, jsonify, request
import requests
import os

app = Flask(__name__)

# Configuration: URL of the Face-Match microservice
# Based on your setup, Face-match is running on port 5001
FACE_MATCH_SERVICE_URL = os.environ.get("FACE_MATCH_URL", "http://localhost:5001/face-match")

@app.route('/liveness-check', methods=['POST'])
def liveness_check():
    """
    Refactored Coordinator API:
    Receives the ID documents and the live selfie (captured after blinks) 
    from the React frontend and forwards them for face matching.
    """
    # 1. Retrieve the files sent from the frontend wizard
    # These names must match what you append in documentService.js
    front_file = request.files.get('frontImage')
    back_file = request.files.get('backImage')
    selfie_file = request.files.get('selfieImage')

    # Validate that all required parts are present
    if not front_file or not selfie_file:
        return jsonify({
            "error": "Missing required images. Please ensure Front ID and Selfie are provided."
        }), 400

    print(f"Received verification request for: {front_file.filename}")

    # 2. Prepare files for the Face-Match service
    # We match the 'front' of the ID against the 'live selfie'
    files_to_verify = {
        "document": (front_file.filename, front_file.stream.read(), front_file.mimetype),
        "selfie": (selfie_file.filename, selfie_file.stream.read(), selfie_file.mimetype)
    }
    
    # Optional: Reset stream if you need to perform more operations (like OCR) on these files
    front_file.stream.seek(0)
    selfie_file.stream.seek(0)

    try:
        # 3. Forward images to the Face Match microservice
        print("Forwarding to Face-Match service...")
        response = requests.post(FACE_MATCH_SERVICE_URL, files=files_to_verify)
        response.raise_for_status()
        
        match_result = response.json()

        # 4. Return the final consolidated result to the React Frontend
        return jsonify({
            "status": "success",
            "verification": match_result,
            "message": "Identity verification completed successfully."
        })

    except requests.exceptions.RequestException as e:
        print(f"Error communicating with AI services: {e}")
        return jsonify({
            "status": "error",
            "error": "AI service communication failure",
            "details": str(e)
        }), 500

@app.route("/")
def home():
    return "Liveness Coordination Service is running (Headless Mode)."

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=False)