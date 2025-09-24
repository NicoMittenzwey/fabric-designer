import React, { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import ResultsTable from './components/ResultsTable.jsx';
import FabricGraph from './components/FabricGraph.jsx';

function App() {
  const [fabricData, setFabricData] = useState(null);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ margin: '0 0 20px 0' }}>Fabric Designer</h1>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Left sidebar: inputs and results */}
        <div
          style={{
            width: '420px',
            minWidth: '360px',
            maxWidth: '480px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Input form - fixed height */}
          <div style={{ 
            minHeight: 0, 
            maxHeight: '50%',
            overflowY: 'auto',
            flexShrink: 0
          }}>
            <InputForm setFabricData={setFabricData} />
          </div>
          
          {/* Results table - takes remaining space */}
          {fabricData && (
            <div style={{ 
              flex: 1,
              minHeight: 0, 
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px'
            }}>
              <ResultsTable data={fabricData} />
            </div>
          )}
        </div>

        {/* Right content: graph fills remaining space and full height */}
        <div style={{ 
          flex: 1, 
          minWidth: 0, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {fabricData && <FabricGraph data={fabricData} />}
        </div>
      </div>
    </div>
  );
}

export default App;
