# embed_query.py
import sys
from sentence_transformers import SentenceTransformer
import json

# Load the same model as in worker
model = SentenceTransformer("all-MiniLM-L6-v2")

query = sys.argv[1]
embedding = model.encode(query).tolist()

print(json.dumps(embedding))
