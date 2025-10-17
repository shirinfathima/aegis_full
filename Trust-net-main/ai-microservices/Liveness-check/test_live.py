import requests
import os

# --- Configuration ---
# URL of your running liveness-check service
LIVENESS_URL = "http://localhost:5002/liveness-check"

# Path to the document image for the test
# This path goes up one level from 'Liveness-check' and then into 'OCR-Service'
IMAGE_PATH = os.path.join("..", "OCR-Service", "sample_img", "id front.jpg")


def run_test():
    """
    Sends a test request to the liveness-check service with an ID card image.
    """
    if not os.path.exists(IMAGE_PATH):
        print(f"[ERROR] Image file not found at: {IMAGE_PATH}")
        print("Please make sure the path is correct and that the 'OCR-Service' folder is next to the 'Liveness-check' folder.")
        return

    print(f"Attempting to send '{os.path.basename(IMAGE_PATH)}' to {LIVENESS_URL}...")

    try:
        # Prepare the file for uploading in a multipart/form-data request
        with open(IMAGE_PATH, "rb") as image_file:
            files = {
                # The key 'document' must match what the server expects
                "document": (os.path.basename(IMAGE_PATH), image_file, "image/jpeg")
            }
            
            # Send the POST request with the file
            response = requests.post(LIVENESS_URL, files=files)
            
            # Check for any HTTP errors
            response.raise_for_status()

            print("\n--- ✅ Request Successful ---")
            print("Response from server:")
            # The final response will be the JSON from the face-match service
            print(response.json())

    except requests.exceptions.RequestException as e:
        print(f"\n--- ❌ Request Failed ---")
        print(f"An error occurred: {e}")
        print("Please make sure both the 'liveness-check' and 'face-match' services are running in separate terminals.")

if __name__ == "__main__":
    run_test()