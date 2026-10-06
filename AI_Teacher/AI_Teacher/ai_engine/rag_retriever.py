import os
import math
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

def cosine_similarity(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    if mag1 == 0 or mag2 == 0:
        return 0
    return dot / (mag1 * mag2)

def retrieve_relevant_context(topic, full_context, max_chars=8000, chunk_size=1000):
    """
    Chunks a large document and retrieves the most relevant chunks using semantic search.
    If the document is already small enough, returns it directly.
    """
    if not full_context or len(full_context) <= max_chars:
        return full_context

    if not client:
        # Fallback if no API key is set, just truncate
        return full_context[:max_chars]

    try:
        # 1. Chunking
        words = full_context.split()
        chunks = []
        current_chunk = []
        current_len = 0
        
        for word in words:
            if current_len + len(word) > chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_len = len(word)
            else:
                current_chunk.append(word)
                current_len += len(word) + 1 # +1 for space
                
        if current_chunk:
            chunks.append(" ".join(current_chunk))

        # 2. Embedding Retrieval
        topic_embed_response = client.models.embed_content(
            model="text-embedding-004",
            contents=topic
        )
        topic_vector = topic_embed_response.embeddings[0].values

        chunk_embeddings_response = client.models.embed_content(
            model="text-embedding-004",
            contents=chunks
        )
        chunk_vectors = [e.values for e in chunk_embeddings_response.embeddings]

        # 3. Similarity Scoring
        scored_chunks = []
        for i, vector in enumerate(chunk_vectors):
            score = cosine_similarity(topic_vector, vector)
            scored_chunks.append((score, chunks[i]))

        # 4. Sort and Assemble
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        assembled_context = ""
        for score, chunk in scored_chunks:
            if len(assembled_context) + len(chunk) > max_chars:
                break
            assembled_context += chunk + "\n\n"

        return assembled_context.strip()
    except Exception as e:
        print(f"[RAG Retriever Warning] Failed to embed/retrieve context: {e}")
        # Fallback: return the beginning of the context
        return full_context[:max_chars]
