# simple_worker.py

import os
import time
from dotenv import load_dotenv
from pymongo import MongoClient, ReturnDocument
import fitz  # PyMuPDF
from sklearn.feature_extraction.text import TfidfVectorizer
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "personal_cloud")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# Setup MongoDB client and collections
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
files_col = db["files"]
emb_col = db["embeddings"]

# Text splitter
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

# PDF text extraction
def extract_text_from_pdf(path):
    try:
        with fitz.open(path) as doc:
            return "\n".join([page.get_text() for page in doc])
    except Exception as e:
        print("PDF extraction error:", e)
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
        path = doc.get("path")
        if not path or not os.path.exists(path):
            raise Exception("File path invalid or missing")

        full_text = extract_text_from_pdf(path)
        if not full_text.strip():
            raise Exception("No text extracted from PDF")

        chunks = splitter.split_text(full_text)

        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform(chunks).toarray()

        for i, vector in enumerate(vectors):
            emb_col.insert_one({
                "fileId": doc["_id"],
                "versionNumber": doc.get("version", 1),
                "chunkIndex": i,
                "chunkText": chunks[i],
                "vector": vector.tolist(),
                "model": "tf-idf",
                "createdAt": time.time()
            })

        files_col.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "aiProcessed": "ready",
                "textPreview": full_text[:1000] + ("..." if len(full_text) > 1000 else "")
            }}
        )

        print(f"Processed {doc.get('originalName')} — TF-IDF vectors saved.")
    except Exception as e:
        print("Processing error:", e)
        files_col.update_one({"_id": doc["_id"]}, {"$set": {"aiProcessed": "error"}})

    return True

if __name__ == "__main__":
    print("Simple AI Worker started — polling for pending files.")
    try:
        while True:
            did = process_one()
            if not did:
                time.sleep(3)
            else:
                time.sleep(0.5)
    except KeyboardInterrupt:
        print("Worker stopped by user.")
