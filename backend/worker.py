# worker.py
import os
import time
from dotenv import load_dotenv
from pymongo import MongoClient, ReturnDocument
import fitz  # PyMuPDF
from PIL import Image
import pytesseract
from sentence_transformers import SentenceTransformer
from transformers import pipeline  # for summarization

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "personal_cloud")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
files_col = db["files"]
emb_col = db["embeddings"]

print("Loading embedding model (this may take a moment)...")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Embedding model loaded.")

print("Loading summarization model (this may take a moment)...")
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
print("Summarization model loaded.")

def extract_text_from_pdf(path):
    text_pages = []
    try:
        with fitz.open(path) as doc:
            for page in doc:
                text_pages.append(page.get_text())
    except Exception as e:
        print("PDF extraction failed:", e)
    return "\n".join(text_pages)

def extract_text(file_doc):
    path = file_doc.get("path")
    if not path or not os.path.exists(path):
        return ""

    mime = (file_doc.get("mimeType") or "").lower()
    lower = path.lower()

    if mime == "text/plain" or lower.endswith(".txt"):
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            print("Text read error:", e)
            return ""

    if "pdf" in mime or lower.endswith(".pdf"):
        return extract_text_from_pdf(path)

    if mime.startswith("image/") or any(lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".tiff", ".bmp"]):
        try:
            img = Image.open(path)
            return pytesseract.image_to_string(img)
        except Exception as e:
            print("Image OCR error:", e)
            return ""

    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except:
        return ""

def summarize_text(text):
    if not text.strip():
        return ""
    short_text = text[:3000]  # keep within model limits
    try:
        summary = summarizer(short_text, max_length=130, min_length=30, do_sample=False)
        return summary[0]['summary_text']
    except Exception as e:
        print("Summarization error:", e)
        return ""

def process_one():
    doc = files_col.find_one_and_update(
        {"aiProcessed": "pending"},
        {"$set": {"aiProcessed": "processing"}},
        sort=[("uploadDate", 1)],
        return_document=ReturnDocument.AFTER
    )

    if not doc:
        return False

    print(f"Picked file: {doc.get('originalName')} (id={doc.get('_id')})")

    try:
        full_text = extract_text(doc) or ""
        short_text = full_text if len(full_text) < 100000 else full_text[:100000]

        embedding = embed_model.encode(short_text).tolist()

        emb_doc = {
            "fileId": doc["_id"],
            "versionNumber": doc.get("version", 1),
            "vector": embedding,
            "model": "all-MiniLM-L6-v2",
            "createdAt": time.time()
        }
        emb_col.insert_one(emb_doc)

        preview_text = full_text[:1000] + ("..." if len(full_text) > 1000 else "")

        summary = summarize_text(full_text)

        files_col.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "textPreview": preview_text,
                "summary": summary,
                "aiProcessed": "ready"
            }}
        )

        print(f"Processed {doc.get('originalName')} — embedding + preview + summary saved.")
    except Exception as e:
        print("Processing error:", e)
        files_col.update_one({"_id": doc["_id"]}, {"$set": {"aiProcessed": "error"}})

    return True

if __name__ == "__main__":
    print("AI Worker started — polling for pending files.")
    try:
        while True:
            did = process_one()
            if not did:
                time.sleep(3)
            else:
                time.sleep(0.5)
    except KeyboardInterrupt:
        print("Worker stopped by user.")
