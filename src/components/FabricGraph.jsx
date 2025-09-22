import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

function FabricGraph({ data }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = [
      { id: 1, label: 'Switch: ' + data.switches[0].model },
      ...Array.from({ length: data.endpoints }, (_, i) => ({ id: i + 2, label: `EP ${i + 1}` }))
    ];

    const edges = Array.from({ length: data.endpoints }, (_, i) => ({ from: 1, to: i + 2 }));

    new Network(containerRef.current, { nodes, edges }, { physics: false });
  }, [data]);

  return (
    <div>
      <h2>Fabric Topology</h2>
      <div ref={containerRef} style={{ height: '400px', border: '1px solid black' }} />
    </div>
  );
}

export default FabricGraph;
