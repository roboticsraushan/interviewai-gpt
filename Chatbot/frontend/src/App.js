import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [screeningResult, setScreeningResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setScreeningResult(null);

    try {
      const response = await fetch('http://34.44.243.178:5000/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await response.json();
      if (response.ok) {
        setScreeningResult(data);
      } else {
        setErrorMsg(data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2b7a78' }}>üëPukaar Health Screening</h1>
      <p style={{ fontStyle: 'italic', color: '#444' }}>
        This is not a medical diagnosis. It is a screening tool based on WHO, IMNCI, and IAP guidelines to help identify potential warning signs. Please consult a pediatrician if unsure.
      </p>

      <textarea
        rows="4"
        cols="50"
        placeholder="Describe your baby's symptoms here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          marginBottom: '1rem',
        }}
      />

      <button
        onClick={handleSubmit}
        style={{
          backgroundColor: '#3aafa9',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Run Screening'}
      </button>

      {errorMsg && (
        <p style={{ color: 'red', marginTop: '1rem' }}>{errorMsg}</p>
      )}

      {screeningResult && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3>üîç Screening Result</h3>

          {screeningResult.screenable === false ? (
            <p style={{ color: '#d9534f' }}>{screeningResult.response}</p>
          ) : (
            <ul>
              {screeningResult.ranked_list?.map((item, index) => (
                <li key={index}>
                  <strong>{item.condition}:</strong> {item.likelihood}%
                </li>
              ))}
            </ul>
          )}

          <pre
            style={{
              marginTop: '1rem',
              backgroundColor: '#eee',
              padding: '1rem',
              borderRadius: '6px',
              overflowX: 'auto',
            }}
          >
{JSON.stringify(screeningResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
