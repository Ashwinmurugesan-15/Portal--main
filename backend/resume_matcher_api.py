from flask import Flask, request, jsonify
from flask_cors import CORS
import os, re, tempfile, logging, time, sys
from pypdf import PdfReader
from collections import Counter

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from config import DevelopmentConfig, ProductionConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

env = os.getenv("APP_ENV", "development").lower()
if env == "production":
    app_config = ProductionConfig()
else:
    app_config = DevelopmentConfig()

app = Flask(__name__)

allowed_origins = os.getenv(
    "RESUME_CORS_ORIGINS",
    app_config.RESUME_API_BASE_URL or ""
).split(",") if (os.getenv("RESUME_CORS_ORIGINS") or app_config.RESUME_API_BASE_URL) else []

CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True
)

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# ----------------------------------------
# Text Processing
# ----------------------------------------
def clean_text(text):
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def get_tokens(text):
    stop_words = {
        "and","or","the","in","of","with","a","an","to","for","on","at","by",
        "is","are","was","were","be","been","being","have","has","had"
    }
    return set(clean_text(text).split()) - stop_words

def extract_text_from_pdf(path):
    try:
        reader = PdfReader(path)
        return " ".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        logger.error(f"Failed to read {path}: {e}")
        return ""

def calculate_score(jd, resume):
    jd_tokens = Counter(get_tokens(jd))
    resume_tokens = get_tokens(resume)
    matched = sum(c for w, c in jd_tokens.items() if w in resume_tokens)
    total = sum(jd_tokens.values())
    return (round(matched / total, 4) if total else 0.0), matched

# ----------------------------------------
# Routes
# ----------------------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Backend running"})

@app.route("/upload", methods=["POST", "OPTIONS"])
def upload():
    if request.method == "OPTIONS":
        return "", 200

    start = time.time()
    job_description = request.form.get("job_description", "")
    resumes = request.files.getlist("resumes")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400
    if not resumes:
        return jsonify({"error": "At least one resume file is required"}), 400

    results = []

    for resume_file in resumes:
        if resume_file.filename.lower().endswith(".pdf"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                resume_file.save(temp_pdf.name)
                temp_pdf_path = temp_pdf.name
            
            try:
                text = extract_text_from_pdf(temp_pdf_path)
                score, matches = calculate_score(job_description, text)

                results.append({
                    "filename": resume_file.filename,
                    "score": score,
                    "details": {"matches": matches},
                    "text_length": len(text)
                })
            finally:
                os.remove(temp_pdf_path) # Clean up the temporary file

    results.sort(key=lambda x: x["score"], reverse=True)

    return jsonify({
        "top_resume": results[0] if results else None,
        "all_results": results,
        "processing_time": round(time.time() - start, 3)
    })

# ----------------------------------------
# Run App
# ----------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=app_config.PORT, debug=app_config.DEBUG)
