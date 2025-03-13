import React, { useState } from 'react';

const ApiTest = () => {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      // Make a simple API request to test connectivity
      const response = await fetch('/api/health', {
        method: 'GET',
      });
      
      console.log(`API Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        let errorText = `HTTP Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        } catch (e) {
          errorText = await response.text() || errorText;
        }
        throw new Error(errorText);
      }
      
      // Parse the response
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message || 'Failed to connect to the API');
      console.error('API Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
      
      <button
        onClick={testApi}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
          <h3 className="font-semibold">Error:</h3>
          <p className="font-mono text-sm">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
          <h3 className="font-semibold">Success:</h3>
          <pre className="font-mono text-sm overflow-auto">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest; 