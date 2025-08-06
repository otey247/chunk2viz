from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from langchain.text_splitter import CharacterTextSplitter, RecursiveCharacterTextSplitter
import uvicorn

app = FastAPI(title="Chunk2Viz API", description="Text chunking visualization API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChunkRequest(BaseModel):
    text: str
    chunk_size: int
    chunk_overlap: int = 0
    splitter_type: str
    language: Optional[str] = None

class ChunkData(BaseModel):
    id: int
    text: str
    start_index: int
    end_index: int
    overlap_with_next: int

class ChunkResponse(BaseModel):
    chunks: List[ChunkData]
    total_characters: int
    num_chunks: int
    average_chunk_size: float

class DefaultTexts(BaseModel):
    prose: str
    javascript: str
    python: str
    markdown: str

# Custom text splitters that preserve whitespace (similar to the JS version)
class CharacterTextSplitterPreserveWhitespace(CharacterTextSplitter):
    def _join_docs(self, docs: List[str], separator: str) -> str:
        # Override to not trim chunks
        return separator.join(docs)

class RecursiveCharacterTextSplitterPreserveWhitespace(RecursiveCharacterTextSplitter):
    def _join_docs(self, docs: List[str], separator: str) -> str:
        # Override to not trim chunks
        return separator.join(docs)

# Default texts
DEFAULT_TEXTS = {
    "prose": """One of the most important things I didn't understand about the world when I was a child is the degree to which the returns for performance are superlinear.

Teachers and coaches implicitly told us the returns were linear. "You get out," I heard a thousand times, "what you put in." They meant well, but this is rarely true. If your product is only half as good as your competitor's, you don't get half as many customers. You get no customers, and you go out of business.

It's obviously true that the returns for performance are superlinear in business. Some think this is a flaw of capitalism, and that if we changed the rules it would stop being true. But superlinear returns for performance are a feature of the world, not an artifact of rules we've invented. We see the same pattern in fame, power, military victories, knowledge, and even benefit to humanity. In all of these, the rich get richer. [1]

You can't understand the world without understanding the concept of superlinear returns. And if you're ambitious you definitely should, because this will be the wave you surf on.

It may seem as if there are a lot of different situations with superlinear returns, but as far as I can tell they reduce to two fundamental causes: exponential growth and thresholds.

The most obvious case of superlinear returns is when you're working on something that grows exponentially. For example, growing bacterial cultures. When they grow at all, they grow exponentially. But they're tricky to grow. Which means the difference in outcome between someone who's adept at it and someone who's not is very great.

Startups can also grow exponentially, and we see the same pattern there. Some manage to achieve high growth rates. Most don't. And as a result you get qualitatively different outcomes: the companies with high growth rates tend to become immensely valuable, while the ones with lower growth rates may not even survive.

Y Combinator encourages founders to focus on growth rate rather than absolute numbers. It prevents them from being discouraged early on, when the absolute numbers are still low. It also helps them decide what to focus on: you can use growth rate as a compass to tell you how to evolve the company. But the main advantage is that by focusing on growth rate you tend to get something that grows exponentially.

YC doesn't explicitly tell founders that with growth rate "you get out what you put in," but it's not far from the truth. And if growth rate were proportional to performance, then the reward for performance p over time t would be proportional to pt.

Even after decades of thinking about this, I find that sentence startling.""",
    
    "javascript": '''import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const text = "Some other considerations include:

- Do you deploy your backend and frontend together, or separately?
- Do you deploy your backend co-located with your database, or separately?

**Production Support:** As you move your LangChains into production, we'd love to offer more hands-on support.
Fill out [this form](https://airtable.com/appwQzlErAS2qiP0L/shrGtGaVBVAz7NcV2) to share more about what you're building, and our team will get in touch.

## Deployment Options

See below for a list of deployment options for your LangChain app. If you don't see your preferred option, please get in touch and we can add it to this list.";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 50,
  chunkOverlap: 1,
  separators: ["|", "##", ">", "-"],
});

const docOutput = await splitter.splitDocuments([
  new Document({ pageContent: text }),
]);

console.log(docOutput);''',
    
    "python": '''from operator import itemgetter

from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnableLambda, RunnablePassthrough
from langchain.vectorstores import FAISS

vectorstore = FAISS.from_texts(
    ["harrison worked at kensho"], embedding=OpenAIEmbeddings()
)
retriever = vectorstore.as_retriever()

template = """Answer the question based only on the following context:
{context}

Question: {question}
"""
prompt = ChatPromptTemplate.from_template(template)

model = ChatOpenAI()

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)''',
    
    "markdown": '''# Needle In A Haystack - Pressure Testing LLMs

Supported model providers: OpenAI, Anthropic

A simple 'needle in a haystack' analysis to test in-context retrieval ability of long context LLMs.

Get the behind the scenes on the [overview video](https://youtu.be/KwRRuiCCdmc).

![GPT-4-128 Context Testing](img/NeedleHaystackCodeSnippet.png)

git clone https://github.com/gkamradt/LLMTest_NeedleInAHaystack.git

## The Test
1. Place a random fact or statement (the 'needle') in the middle of a long context window (the 'haystack')
2. Ask the model to retrieve this statement
3. Iterate over various document depths (where the needle is placed) and context lengths to measure performance'''
}

def create_text_splitter(splitter_type: str, chunk_size: int, chunk_overlap: int, language: Optional[str] = None):
    """Create the appropriate text splitter based on type and parameters."""
    
    if splitter_type == "character":
        return CharacterTextSplitterPreserveWhitespace(
            separator="",
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            keep_separator=True
        )
    
    elif splitter_type == "recursive":
        if language:
            return RecursiveCharacterTextSplitterPreserveWhitespace.from_language(
                language=language,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                keep_separator=True
            )
        else:
            return RecursiveCharacterTextSplitterPreserveWhitespace(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                keep_separator=True
            )
    
    else:
        raise ValueError(f"Unknown splitter type: {splitter_type}")

def reconstruct_chunks(chunks: List[str], chunk_overlap: int) -> List[ChunkData]:
    """Reconstruct chunk data with position information."""
    chunk_data = []
    current_start_index = 0
    
    for index, chunk in enumerate(chunks):
        is_last_chunk = index == len(chunks) - 1
        start_index = current_start_index
        end_index = start_index + len(chunk)
        
        chunk_data.append(ChunkData(
            id=index + 1,
            text=chunk,
            start_index=start_index,
            end_index=end_index,
            overlap_with_next=chunk_overlap if not is_last_chunk else 0
        ))
        
        current_start_index = end_index - (0 if is_last_chunk else chunk_overlap)
    
    return chunk_data

@app.get("/")
async def root():
    return {"message": "Chunk2Viz API is running"}

@app.get("/default-texts", response_model=DefaultTexts)
async def get_default_texts():
    """Get default texts for different content types."""
    return DefaultTexts(
        prose=DEFAULT_TEXTS["prose"],
        javascript=DEFAULT_TEXTS["javascript"],
        python=DEFAULT_TEXTS["python"],
        markdown=DEFAULT_TEXTS["markdown"]
    )

@app.post("/chunk", response_model=ChunkResponse)
async def chunk_text(request: ChunkRequest):
    """Chunk text using the specified splitter and parameters."""
    
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if request.chunk_size <= 0:
        raise HTTPException(status_code=400, detail="Chunk size must be positive")
    
    if request.chunk_overlap < 0:
        raise HTTPException(status_code=400, detail="Chunk overlap cannot be negative")
    
    if request.chunk_overlap >= request.chunk_size:
        raise HTTPException(status_code=400, detail="Chunk overlap must be less than chunk size")
    
    try:
        # Create text splitter
        splitter = create_text_splitter(
            request.splitter_type, 
            request.chunk_size, 
            request.chunk_overlap, 
            request.language
        )
        
        # Create documents and split
        from langchain.schema import Document
        docs = [Document(page_content=request.text)]
        split_docs = splitter.split_documents(docs)
        
        # Extract text from documents
        chunks = [doc.page_content for doc in split_docs]
        
        # Reconstruct chunk data with positions
        chunk_data = reconstruct_chunks(chunks, request.chunk_overlap)
        
        # Calculate statistics
        total_chars = sum(len(chunk.text) for chunk in chunk_data)
        num_chunks = len(chunk_data)
        avg_chunk_size = total_chars / num_chunks if num_chunks > 0 else 0
        
        return ChunkResponse(
            chunks=chunk_data,
            total_characters=total_chars,
            num_chunks=num_chunks,
            average_chunk_size=avg_chunk_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error chunking text: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
