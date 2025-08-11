# embed_query.py
import os
import sys
import json
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()  # Add this

# Load query from CLI arg
query = sys.argv[1]

# Connect to MongoDB - FIXED
client = MongoClient(os.getenv("MONGODB_URI"))  # Get from environment
db = client[os.getenv("DB_NAME", "personal_cloud")]  # Add this
emb_col = db["embeddings"]

try:
    # print("inside try block")
    # Step 1: Fetch all chunk texts to fit vectorizer
    chunk_texts = [doc["chunkText"] for doc in emb_col.find({}, {"chunkText": 1})]

# Step 2: Fit TF-IDF vectorizer
    vectorizer = TfidfVectorizer()
    vectorizer.fit(chunk_texts)

# Step 3: Transform query using the fitted vectorizer
    query_vector = vectorizer.transform([query]).toarray()[0]

# Output as JSON
    print(json.dumps(query_vector.tolist()))
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
