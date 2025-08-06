import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

const highlightChunks = (chunks) => {
  let highlightedText = '';
  const colors = ['#70d6ff', '#e9ff70', '#ff9770', '#ffd670', '#ff70a6'];

  chunks.forEach((chunk, index) => {
    let uniquePart, overlapPart;

    if (index === 0) {
      uniquePart = chunk.text.slice(0, chunk.text.length - chunk.overlap_with_next);
      overlapPart = chunk.text.slice(chunk.text.length - chunk.overlap_with_next);
    } else if (index !== chunks.length - 1) {
      uniquePart = chunk.text.slice(chunk.overlap_with_next, chunk.text.length - chunk.overlap_with_next);
      overlapPart = chunk.text.slice(chunk.text.length - chunk.overlap_with_next);
    } else { // It's the last chunk
      uniquePart = chunk.text.slice(chunk.overlap_with_next);
      overlapPart = ''; // There's no overlap with the next chunk
    }

    // Generate a pseudo-random color for each unique part using HSL
    const color = colors[index % colors.length];

    const highlightedChunk = `<span style="background: ${color}">${uniquePart}</span>`;
    highlightedText += highlightedChunk;

    // Add overlap part only if it's not the last chunk
    if (overlapPart) {
      highlightedText += `<span class="overlap">${overlapPart}</span>`;
    }
  });
  return highlightedText;
};

function App() {
  const [text, setText] = useState('');
  const [defaultTexts, setDefaultTexts] = useState({});
  const [chunkSize, setChunkSize] = useState(25);
  const [overlap, setOverlap] = useState(0);
  const [highlightedText, setHighlightedText] = useState('');
  const [splitter, setSplitter] = useState('characterSplitter');
  const [chunks, setChunks] = useState([]);
  const [stats, setStats] = useState({ total_characters: 0, num_chunks: 0, average_chunk_size: 0 });
  const [overlapSize, setOverlapSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MAX_TEXT_LENGTH = 100000;

  const splitterOptions = useMemo(() => ({
    'characterSplitter': {
      label: 'Character Splitter 🦜️🔗',
      type: 'character',
      language: null,
      chunk_overlap_ind: true,
      defaultTextKey: 'prose'
    },
    'recursiveCharacterTextSplitter': {
      label: 'Recursive Character Text Splitter 🦜️🔗',
      type: 'recursive',
      language: null,
      chunk_overlap_ind: false,
      defaultTextKey: 'prose'
    },
    'recursiveCharacterTextSplitterJS': {
      label: 'Recursive Character Text Splitter - JS 🦜️🔗',
      type: 'recursive',
      language: 'js',
      chunk_overlap_ind: false,
      defaultTextKey: 'javascript'
    },
    'recursiveCharacterTextSplitterPython': {
      label: 'Recursive Character Text Splitter - Python 🦜️🔗',
      type: 'recursive',
      language: 'python',
      chunk_overlap_ind: false,
      defaultTextKey: 'python'
    },
    'recursiveCharacterTextSplitterMarkdown': {
      label: 'Recursive Character Text Splitter - Markdown 🦜️🔗',
      type: 'recursive',
      language: 'markdown',
      chunk_overlap_ind: false,
      defaultTextKey: 'markdown'
    },
  }), []);

  // Fetch default texts on component mount
  useEffect(() => {
    const fetchDefaultTexts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/default-texts`);
        if (response.ok) {
          const data = await response.json();
          setDefaultTexts(data);
          // Set initial text to prose default
          setText(data.prose);
        }
      } catch (err) {
        console.error('Failed to fetch default texts:', err);
        setError('Failed to load default texts');
      }
    };

    fetchDefaultTexts();
  }, []);

  // Update text when splitter changes
  useEffect(() => {
    if (!splitterOptions[splitter].chunk_overlap_ind) {
      setOverlap(0);
    }

    // Get all default texts
    const defaultTextValues = Object.values(defaultTexts);

    // Check if the current text is blank or a default text
    if (defaultTexts && (defaultTextValues.includes(text) || !text)) {
      const textKey = splitterOptions[splitter].defaultTextKey;
      if (defaultTexts[textKey]) {
        setText(defaultTexts[textKey]);
      }
    }
  }, [splitter, text, splitterOptions, defaultTexts]);

  const handleTextChange = (event) => {
    let newText = event.target.value;
    if (newText.length > MAX_TEXT_LENGTH) {
      alert(`Error: Text cannot be longer than ${MAX_TEXT_LENGTH} characters. It will be trimmed to fit the limit.`);
      newText = newText.substring(0, MAX_TEXT_LENGTH);
    }
    setText(newText);
  };

  const handleChunkSizeChange = (event) => {
    let newChunkSize = Number(event.target.value);
    if (newChunkSize > overlap * 2) {
      setChunkSize(newChunkSize);
      setOverlapSize(newChunkSize * 0.45);
    }
  };

  const handleOverlapChange = (event) => {
    let newOverlap = Number(event.target.value);
    if (newOverlap <= chunkSize * 0.5) {
      setOverlap(newOverlap);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        setText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const chunkText = useCallback(async () => {
    if (!text.trim()) {
      setChunks([]);
      setHighlightedText('');
      setStats({ total_characters: 0, num_chunks: 0, average_chunk_size: 0 });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const splitterConfig = splitterOptions[splitter];
      const requestData = {
        text: text,
        chunk_size: chunkSize,
        chunk_overlap: splitterConfig.chunk_overlap_ind ? overlap : 0,
        splitter_type: splitterConfig.type,
        language: splitterConfig.language
      };

      const response = await fetch(`${API_BASE_URL}/chunk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to chunk text');
      }

      const data = await response.json();
      setChunks(data.chunks);
      setStats({
        total_characters: data.total_characters,
        num_chunks: data.num_chunks,
        average_chunk_size: data.average_chunk_size
      });

      // Generate highlighted text
      const highlighted = highlightChunks(data.chunks);
      setHighlightedText(highlighted);

    } catch (err) {
      console.error('Error chunking text:', err);
      setError(err.message || 'Failed to chunk text');
      setChunks([]);
      setHighlightedText('');
      setStats({ total_characters: 0, num_chunks: 0, average_chunk_size: 0 });
    } finally {
      setLoading(false);
    }
  }, [text, chunkSize, overlap, splitter, splitterOptions]);

  // Trigger chunking when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      chunkText();
    }, 300); // Debounce API calls

    return () => clearTimeout(timeoutId);
  }, [chunkText]);

  return (
    <div className="App">
      <h1>ChunkViz v0.1 (Python Backend)</h1>
      <p>Want to learn more about AI Engineering Patterns? Join me on <a href="https://x.com/GregKamradt" target="_blank" rel="noopener noreferrer">Twitter</a> or <a href="https://mail.gregkamradt.com/signup" target="_blank" rel="noopener noreferrer">Newsletter</a>.</p>
      <hr style={{width: '50%', margin: 'auto'}} />
      <p>Language Models do better when they're focused.</p>
      <p>One strategy is to pass a relevant subset (chunk) of your full data. There are many ways to chunk text.</p>
      <p>This is a tool to understand different chunking/splitting strategies.</p>
      <p><a href='#explanation'>Explain like I'm 5...</a></p>
      
      {error && (
        <div style={{ color: 'red', margin: '10px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}

      <div className='textArea'>
        <textarea 
          value={text} 
          onChange={handleTextChange} 
          rows={10} 
          cols={50} 
          disabled={loading}
        />
        <div className='uploadButtonArea'>
          <label htmlFor="file-upload" className="custom-file-upload">
            <span style={{borderRadius: '5px', padding: '5px', fontSize: '12px', backgroundColor: '#d1dcff'}}>
              Upload .txt
            </span>
          </label>
          <input 
            id="file-upload" 
            type="file" 
            accept=".txt" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <div>
          <label>
            Splitter:
            <select value={splitter} onChange={(e) => setSplitter(e.target.value)} disabled={loading}>
              {Object.entries(splitterOptions).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="slider-container">
          <label>
            <span style={{ display: 'inline-block', paddingRight: '10px' }}>Chunk Size:</span>
            <input
              type="number"
              min="1"
              max="2000"
              value={chunkSize}
              style={{ width: '50px' }}
              onChange={handleChunkSizeChange}
              disabled={loading}
            />
            <input 
              type="range" 
              min="1" 
              max="2000" 
              value={chunkSize} 
              onChange={handleChunkSizeChange}
              disabled={loading}
            />
          </label>
        </div>

        <div className="slider-container">
          <label style={{ opacity: splitterOptions[splitter].chunk_overlap_ind ? 1 : 0.5 }}>
            <span style={{ display: 'inline-block', paddingRight: '10px' }}>Chunk Overlap:</span>
            <input
              type="number"
              min="0"
              max={overlapSize}
              value={overlap}
              style={{ width: '50px' }}
              onChange={handleOverlapChange}
              disabled={!splitterOptions[splitter].chunk_overlap_ind || loading}
            />
            <input
              type="range"
              min="0"
              max={overlapSize}
              value={overlap}
              onChange={handleOverlapChange}
              disabled={!splitterOptions[splitter].chunk_overlap_ind || loading}
            />
          </label>
        </div>

        <div>
          {loading && <div>Loading...</div>}
          {!loading && (
            <>
              <div>Total Characters: {stats.total_characters}</div>
              <div>Number of chunks: {stats.num_chunks}</div>
              <div>Average chunk size: {stats.average_chunk_size.toFixed(1)}</div>
            </>
          )}
        </div>
      </div>

      <div className="chunked-text">
        <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
      </div>

      <hr style={{ width: '75%', marginTop: '15px' }} />
      <div id='info_box'>
        <h3 id="explanation">What's going on here?</h3>
        <p>Language Models have context windows. This is the length of text that they can process in a single pass.<br /> Although context lengths are getting larger, it has been shown that language models increase performance on tasks when they are given less (but more relevant) information.</p>
        <p>But which relevant subset of data do you pick? This is easy when a human is doing it by hand, but turns out it is difficult to instruct a computer to do this.</p>
        <p>One common way to do this is by chunking, or subsetting, your large data into smaller pieces. In order to do this you need to pick a chunk strategy.</p>
        <p>Pick different chunking strategies above to see how they impact the text, add your own text if you'd like.</p>
        <p>You'll see different colors that represent different chunks. <span style={{ background: "#ff70a6" }}>This could be chunk 1. </span><span style={{ background: "#70d6ff" }}>This could be chunk 2, </span><span style={{ background: "#e9ff70" }}>sometimes a chunk will change i</span><span style={{ background: "#ffd670" }}>n the middle of a sentence (this isn't great). </span><span style={{ background: "#ff9770" }}>If any chunks have overlapping text, those will appear in green.</span></p>
        <p><b>Chunk Size</b>: The length (in characters) of your end chunks</p>
        <p><b>Chunk Overlap (Green)</b>: The amount of overlap or cross over sequential chunks share</p>
        <p><b>Notes:</b> *This version uses a Python backend with FastAPI and React frontend. *Text splitters trim the whitespace on the end of the js, python, and markdown splitters which is why the text jumps around, *Overlap is locked at &lt;50% of chunk size</p>
        <p>For implementations of text splitters, view LangChain
          (<a href="https://python.langchain.com/docs/modules/data_connection/document_transformers/text_splitters/character_text_splitter" target="_blank" rel="noopener noreferrer">py</a>, <a href="https://js.langchain.com/docs/modules/data_connection/document_transformers/text_splitters/character_text_splitter" target="_blank" rel="noopener noreferrer">js</a>) & Llama Index (<a href="https://docs.llamaindex.ai/en/stable/api/llama_index.node_parser.SentenceSplitter.html#llama_index.node_parser.SentenceSplitter" target="_blank" rel="noopener noreferrer">py</a>, <a href="https://ts.llamaindex.ai/modules/low_level/node_parser" target="_blank" rel="noopener noreferrer">js</a>)</p>
        <p>MIT License, <a href="https://github.com/gkamradt/ChunkViz" target="_blank" rel="noopener noreferrer">Open Sourced</a>, PRs Welcome</p>
        <p>Made with ❤️ by <a href="https://twitter.com/GregKamradt" target="_blank" rel="noopener noreferrer">Greg Kamradt</a></p>
        <p>Python Backend Version</p>
      </div>
    </div>
  );
}

export default App;
