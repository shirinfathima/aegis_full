from flask import Flask, jsonify, request
import cv2
import mediapipe as mp
import time
import requests # Used to send the request to the face-match service
import numpy as np

app = Flask(__name__)

# Mediapipe setup for face mesh and eye landmarks
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

def get_ear(landmarks, eye_indices, frame_width, frame_height):
    """Calculates the Eye Aspect Ratio (EAR) for a single eye."""
    # This function is the core of the blink detection
    points = [(int(landmarks[i].x * frame_width), int(landmarks[i].y * frame_height)) for i in eye_indices]
    horizontal = np.linalg.norm(np.array(points[0]) - np.array(points[3]))
    vertical1 = np.linalg.norm(np.array(points[1]) - np.array(points[5]))
    vertical2 = np.linalg.norm(np.array(points[2]) - np.array(points[4]))
    ear = (vertical1 + vertical2) / (2.0 * horizontal)
    return ear

@app.route('/liveness-check', methods=['POST'])
def liveness_check():
    """
    Performs a liveness check by detecting blinks and then forwards
    the captured selfie and the document to the face-match service.
    """
    blink_count = 0
    required_blinks = 5
    ear_threshold = 0.22 # Threshold to determine if an eye is closed
    is_blinking = False
    captured_image = None

    # Check if the document file was sent in the initial request
    doc_file = request.files.get('document')
    if not doc_file:
        return jsonify({"error": "No document file was sent with the request"}), 400

    # Start webcam capture
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        return jsonify({"error": "Could not open webcam"}), 500

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        h, w = frame.shape[:2]
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            left_ear = get_ear(landmarks, LEFT_EYE, w, h)
            right_ear = get_ear(landmarks, RIGHT_EYE, w, h)
            ear = (left_ear + right_ear) / 2.0

            # Blink detection logic
            if ear < ear_threshold:
                if not is_blinking:
                    blink_count += 1
                    is_blinking = True
                    print(f"Blink #{blink_count}")
            else:
                is_blinking = False

        # Display blink count on the frame for the user
        cv2.putText(frame, f"Blinks: {blink_count}/{required_blinks}", (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("Liveness Check - Blink 5 times", frame)

        # Check for completion or exit
        if blink_count >= required_blinks:
            # Liveness confirmed, capture the image
            print("Liveness confirmed. Capturing photo...")
            ret, jpeg = cv2.imencode('.jpg', frame)
            captured_image = jpeg.tobytes()
            time.sleep(1) # Give user a moment to see completion
            break

        if cv2.waitKey(1) & 0xFF == 27: # Allow user to exit with ESC key
            break

    cap.release()
    cv2.destroyAllWindows()

    if not captured_image:
        return jsonify({"error": "Liveness check failed or was cancelled."}), 400

    # --- Integration with Face Match Service ---
    print("Forwarding images to Face Match service...")

    # Prepare the files to be sent
    files = {
        "document": (doc_file.filename, doc_file.stream.read(), doc_file.mimetype),
        "selfie": ("captured_selfie.jpg", captured_image, 'image/jpeg')
    }

    try:
        # Send the request to the face-match service
        response = requests.post("http://localhost:5001/face-match", files=files)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        # Return the response from the face-match service directly
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error calling face-match service: {e}")
        return jsonify({"error": "Could not connect to the face-match service.", "details": str(e)}), 500

@app.route("/")
def home():
    return "Liveness Check API is running."

if __name__ == '__main__':
    # It's recommended to run the Liveness Check on a different port
    # than the Face Match service to avoid conflicts.
    app.run(port=5002, debug=True)