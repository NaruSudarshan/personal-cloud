# embed_query.py

import sys
import json
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer

# Load query from CLI arg
query = sys.argv[1]

# Connect to MongoDB
client = MongoClient("your_mongodb_uri_here")  # replace with os.getenv or hardcode for now 
db = client["personal_cloud"]
emb_col = db["embeddings"]

# Step 1: Fetch all chunk texts to fit vectorizer
chunk_texts = [doc["chunkText"] for doc in emb_col.find({}, {"chunkText": 1})]

# Step 2: Fit TF-IDF vectorizer
vectorizer = TfidfVectorizer()
vectorizer.fit(chunk_texts)

# Step 3: Transform query using the fitted vectorizer
query_vector = vectorizer.transform([query]).toarray()[0]

# Output as JSON
print(json.dumps(query_vector.tolist()))
