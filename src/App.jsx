import React, { useState, useRef } from 'react';
import InputForm from './components/InputForm.jsx';
import ResultsTable from './components/ResultsTable.jsx';
import FabricGraph from './components/FabricGraph.jsx';

function App() {
  const [fabricData, setFabricData] = useState(null);
  // Resizable left panel width (System Config / Results)
  const [leftWidth, setLeftWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 800;

  const onResizeMouseMove = (e) => {
    const dx = e.clientX - startXRef.current;
    let next = startWidthRef.current + dx;
    if (next < MIN_WIDTH) next = MIN_WIDTH;
    if (next > MAX_WIDTH) next = MAX_WIDTH;
    setLeftWidth(next);
  };

  const onResizeMouseUp = () => {
    setIsResizing(false);
    window.removeEventListener('mousemove', onResizeMouseMove);
    window.removeEventListener('mouseup', onResizeMouseUp);
  };

  const onResizeMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    window.addEventListener('mousemove', onResizeMouseMove);
    window.addEventListener('mouseup', onResizeMouseUp);
  };

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
          overflow: 'hidden',
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        {/* Left sidebar: inputs and results */}
        <div
          style={{
            width: `${leftWidth}px`,
            minWidth: `${MIN_WIDTH}px`,
            maxWidth: `${MAX_WIDTH}px`,
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

        {/* Vertical splitter */}
        <div
          onMouseDown={onResizeMouseDown}
          title="Drag to resize"
          style={{
            width: '6px',
            cursor: 'col-resize',
            background: isResizing ? '#bbb' : '#e5e5e5',
            borderRadius: '3px',
            alignSelf: 'stretch',
            flexShrink: 0
          }}
        />

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
