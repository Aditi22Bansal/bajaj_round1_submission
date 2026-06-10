import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://bajaj-round1-backend.onrender.com/api/graph";

function App() {
  const [input, setInput] = useState("A->B, A->C, B->D");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setResponse(null);

    const edges = input
      .split(",")
      .map(item => item.trim())
      .filter(item => item.length > 0);

    try {
      const res = await axios.post(API_URL, { edges });
      setResponse(res.data);
    } catch (err) {
      setError("API call failed. Please check backend or input.");
    }
  };

  return (
    <div className="container">
      <h1>Bajaj Finserv Full-Stack Round 1 API test</h1>
      <p>Enter the edges like A-&gt;B, A-&gt;C, B-&gt;D</p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows="6"
      />

      <button onClick={handleSubmit}>Submit</button>

      {error && <div className="error">{error}</div>}

      {response && (
        <div className="result">
          <h2>API Response</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;