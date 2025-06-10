from flask import Flask, request, jsonify
import google.generativeai as genai

app = Flask(__name__)

# Set up Gemini API key
genai.configure(api_key="AIzaSyAlUit1rJO9Hz6Kl84P1iwVbaK51ipzfMI")

# Use a supported and available model
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash-latest")

@app.route("/api/gemini", methods=["POST"])
def chat_with_gemini():
    data = request.get_json()
    question = data.get("question", "")

    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        # generate_content accepts string or list of parts
        response = model.generate_content(question)
        return jsonify({"answer": response.text})
    except Exception as e:
        print("Gemini error:", e)
        return jsonify({"error": "Failed to generate response"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
