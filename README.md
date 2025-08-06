# Chunk2Viz - Python Backend + React Frontend

A text chunking visualization tool with a Python FastAPI backend and React frontend. This version separates the chunking logic (Python) from the visualization (React), allowing for better scalability and easier backend modifications.

## Architecture

- **Backend**: Python FastAPI server that handles text splitting using LangChain
- **Frontend**: React application that provides the user interface and visualization
- **Communication**: REST API calls between frontend and backend

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

## Installation and Setup

### Backend Setup (Python FastAPI)

1. **Clone or create the backend directory:**
   ```bash
   mkdir backend
   cd backend
   ```

2. **Copy the main.py file**

3. **Copy the requirements.txt**

4. **Create a virtual environment and install dependencies:**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

5. **Run the backend server:**
   ```bash
   python main.py
   ```
   
   Or alternatively:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup (React)

1. **Create a new React application:**
   ```bash
   npx create-react-app frontend
   cd frontend
   ```

2. **Replace the default files:**
   - Copy `src/App.js` with the React frontend
   - Copy `src/App.css` with the CSS

3. **Install dependencies and start the development server:**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## API Endpoints

The backend provides the following endpoints:

- `GET /` - Health check
- `GET /default-texts` - Get default text samples
- `POST /chunk` - Chunk text with specified parameters
- `GET /health` - Health check endpoint

### Chunk API Request Format

```json
{
  "text": "Your text to chunk",
  "chunk_size": 100,
  "chunk_overlap": 10,
  "splitter_type": "recursive",
  "language": "python"
}
```

### Chunk API Response Format

```json
{
  "chunks": [
    {
      "id": 1,
      "text": "chunk content",
      "start_index": 0,
      "end_index": 50,
      "overlap_with_next": 10
    }
  ],
  "total_characters": 500,
  "num_chunks": 5,
  "average_chunk_size": 100.0
}
```

## Features

- **Multiple Splitter Types**: Character and Recursive Character Text Splitters
- **Language-Specific Splitting**: Support for JavaScript, Python, and Markdown
- **Real-time Visualization**: See how different parameters affect text chunking
- **Overlap Visualization**: Green highlighting shows overlapping text between chunks
- **File Upload**: Upload .txt files for chunking
- **Responsive Design**: Works on desktop and mobile devices

## Splitter Types

1. **Character Splitter**: Simple character-based splitting with overlap support
2. **Recursive Character Text Splitter**: Intelligent splitting that tries to keep related content together
3. **Language-Specific Splitters**: Optimized for JavaScript, Python, and Markdown syntax

## Customization

### Adding New Splitter Types

To add new splitter types:

1. Update the `create_text_splitter` function in `main.py`
2. Add the new splitter configuration to `splitterOptions` in the React frontend
3. Update the default texts if needed

### Modifying Default Texts

Update the `DEFAULT_TEXTS` dictionary in `main.py` to change the default text samples.

### Styling Changes

Modify `App.css` to change the appearance of the application.

## Development

### Running in Development Mode

1. **Backend**: Run with auto-reload
   ```bash
   uvicorn main:app --reload
   ```

2. **Frontend**: React dev server with hot reload
   ```bash
   npm start
   ```

### Production Deployment

#### Backend
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend
```bash
npm run build
# Serve the build folder with your preferred web server
```

## Environment Configuration

For production, you may want to configure:

- **CORS origins**: Update the `allow_origins` in the CORS middleware
- **API URL**: Update `API_BASE_URL` in the React frontend
- **Port configuration**: Modify ports as needed for your deployment

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend CORS configuration includes your frontend URL
2. **Connection Refused**: Ensure the backend is running on the expected port
3. **Module Import Errors**: Check that all Python dependencies are installed
4. **React Build Issues**: Clear node_modules and reinstall if needed

### Performance Considerations

- Large texts may take time to process
- The 100,000 character limit helps prevent performance issues
- Consider implementing request timeouts for production use

## License

MIT License - Feel free to modify and distribute as needed.

## Contributing

This is based on the original ChunkViz by Greg Kamradt. Contributions and improvements are welcome!

## Acknowledgments

- Original ChunkViz by [Greg Kamradt](https://twitter.com/GregKamradt)
- Built with [LangChain](https://langchain.com/) for text splitting
- [FastAPI](https://fastapi.tiangolo.com/) for the backend API
- [React](https://reactjs.org/) for the frontend interface
