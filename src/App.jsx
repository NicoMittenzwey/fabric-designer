import React, { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import ResultsTable from './components/ResultsTable.jsx';
import FabricGraph from './components/FabricGraph.jsx';

function App() {
  const [fabricData, setFabricData] = useState(null);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Fabric Designer</h1>
      <InputForm setFabricData={setFabricData} />
      {fabricData && (
        <>
          <ResultsTable data={fabricData} />
          <FabricGraph data={fabricData} />
        </>
      )}
    </div>
  );
}

export default App;
