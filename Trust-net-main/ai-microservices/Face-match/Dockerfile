FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Force correct OpenCV
RUN pip uninstall -y opencv-python && \
    pip install opencv-python-headless==4.8.1.78

EXPOSE 8080

CMD ["python", "app.py"]