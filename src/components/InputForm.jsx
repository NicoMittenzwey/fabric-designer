import React, { useState } from 'react';

function InputForm({ setFabricData }) {
  const [endpoints, setEndpoints] = useState(8);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFabricData({
      endpoints,
      switches: [{ model: 'QM8700', ports: 40, speed: '200G' }],
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <label>
        Number of Endpoints:
        <input
          type="number"
          value={endpoints}
          onChange={(e) => setEndpoints(e.target.value)}
          min="1"
          style={{ marginLeft: '10px' }}
        />
      </label>
      <button type="submit" style={{ marginLeft: '10px' }}>Generate</button>
    </form>
  );
}

export default InputForm;
