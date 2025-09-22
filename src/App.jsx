import React, { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import ResultsTable from './components/ResultsTable.jsx';
import FabricGraph from './components/FabricGraph.jsx';

function App() {
  const [fabricData, setFabricData] = useState(null);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>Fabric Designer</h1>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'stretch',
          width: '100%',
          flex: 1,
          overflow: 'hidden'
        }}
      >
        {/* Left sidebar: inputs and results (two rows, both scrollable) */}
        <div
          style={{
            width: '420px',
            minWidth: '360px',
            maxWidth: '480px',
            display: 'grid',
            gridTemplateRows: '1fr 1fr',
            gap: '16px',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <div style={{ minHeight: 0, overflowY: 'auto' }}>
            <InputForm setFabricData={setFabricData} />
          </div>
          <div style={{ minHeight: 0, overflowY: 'auto' }}>
            {fabricData && <ResultsTable data={fabricData} />}
          </div>
        </div>

        {/* Right content: graph fills remaining space */}
        <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
          {fabricData && <FabricGraph data={fabricData} />}
        </div>
      </div>
    </div>
  );
}

export default App;
