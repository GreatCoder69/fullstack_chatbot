from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import google.generativeai as genai
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB limit
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Set up Gemini API key
genai.configure(api_key="AIzaSyAlUit1rJO9Hz6Kl84P1iwVbaK51ipzfMI")
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/api/gemini", methods=["POST"])
def chat_with_gemini():
    try:
        # Case 1: Text input from JSON
        if request.content_type == 'application/json':
            data = request.get_json()
            question = data.get("question", "")
            if not question:
                return jsonify({"error": "Question is required"}), 400
            response = model.generate_content(question)
            return jsonify({"answer": response.text})

        # Case 2: Image (and optional prompt) from multipart/form-data
        elif request.content_type.startswith('multipart/form-data'):
            if 'image' not in request.files:
                return jsonify({"error": "Image is required"}), 400

            image_file = request.files['image']
            prompt = request.form.get("prompt", "Describe this image")

            # Validate file type
            if not allowed_file(image_file.filename):
                return jsonify({"error": "Unsupported file type"}), 400

            # Secure filename and (optionally) save to uploads folder
            filename = secure_filename(image_file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.seek(0)
            image_file.save(file_path)

            # Read image for PIL
            image_file.seek(0)
            image_bytes = image_file.read()
            try:
                image = Image.open(io.BytesIO(image_bytes))
            except Exception as e:
                return jsonify({"error": "Invalid image file"}), 400

            # Send to Gemini
            response = model.generate_content([image, prompt])
            return jsonify({"answer": response.text, "image_url": f"/uploads/{filename}"})

        else:
            return jsonify({"error": "Unsupported content type"}), 415

    except Exception as e:
        print("Gemini error:", e)
        return jsonify({"error": "Failed to generate response"}), 500

# Serve uploaded images (optional, for frontend preview)
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return app.send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
