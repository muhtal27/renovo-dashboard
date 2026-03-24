from pgvector.sqlalchemy import Vector

DEFAULT_EMBEDDING_DIMENSION = 1536
EmbeddingVector = Vector(dim=DEFAULT_EMBEDDING_DIMENSION)
