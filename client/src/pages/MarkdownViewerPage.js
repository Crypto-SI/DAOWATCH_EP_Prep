import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MarkdownViewer from '../components/MarkdownViewer';

const MarkdownViewerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If markdown content was passed via location state, display it
    if (location.state?.markdownContent) {
      setMarkdown(location.state.markdownContent);
      setFileName(location.state.fileName || 'Untitled.md');
    }
  }, [location.state]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is a markdown file
    if (!file.name.endsWith('.md')) {
      setError('Please upload a markdown (.md) file');
      return;
    }

    setUploadedFile(file);
    setFileName(file.name);
    setError('');

    // Read the file content
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        setMarkdown(content);
      } catch (err) {
        setError('Error reading file: ' + err.message);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setMarkdown('');
    setFileName('');
    setUploadedFile(null);
  };

  const handleSendToAPI = async () => {
    if (!markdown) {
      setError('No markdown content to process');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/markdown/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdownContent: markdown }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error processing markdown');
      }

      // Success processing
      console.log('Markdown processed successfully');
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Markdown Viewer</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-bold mb-2">
              Upload Markdown File
            </label>
            <input
              type="file"
              accept=".md"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <div className="flex gap-2 items-end">
            <button
              onClick={handleClear}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
            >
              Clear
            </button>
            <button
              onClick={handleSendToAPI}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg"
              disabled={!markdown || loading}
            >
              {loading ? 'Processing...' : 'Process Markdown'}
            </button>
          </div>
        </div>

        {fileName && (
          <div className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Current file:</span> {fileName}
          </div>
        )}
      </div>

      {markdown ? (
        <MarkdownViewer markdown={markdown} />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <p className="mb-4">Upload a markdown file or navigate from the review page to view content</p>
          <p className="text-sm">Supported markdown features include headers, lists, tables, code blocks, and more.</p>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate('/submit')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
        >
          Back to Submission
        </button>
      </div>
    </div>
  );
};

export default MarkdownViewerPage; 