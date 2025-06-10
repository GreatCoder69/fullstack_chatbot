from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

# Set up Gemini API key
genai.configure(api_key="AIzaSyAlUit1rJO9Hz6Kl84P1iwVbaK51ipzfMI")
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")

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

            image_bytes = image_file.read()
            image = Image.open(io.BytesIO(image_bytes))

            response = model.generate_content([image, prompt])
            return jsonify({"answer": response.text})

        else:
            return jsonify({"error": "Unsupported content type"}), 415

    except Exception as e:
        print("Gemini error:", e)
        return jsonify({"error": "Failed to generate response"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

