import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

function FabricGraph({ data }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || !data.topology) return;

    const { topology, leaf, spine, distribution } = data;
    const leafCount = topology.leafCount || 0;
    const spineCount = topology.spineCount || 0;
    const perLeaf = distribution?.perLeaf || [];

    const nodes = [];
    const edges = [];
    let nodeId = 1;

    // Spines (top layer)
    const spineIds = [];
    for (let i = 0; i < spineCount; i++) {
      const id = nodeId++;
      spineIds.push(id);
      nodes.push({
        id,
        label: `Spine ${i + 1}\n${spine?.model?.model || ''}`,
        group: 'spine',
        shape: 'box',
        color: '#CDE7FF',
        font: { size: 12 }
      });
    }

    // Leaves (middle layer) and endpoints (bottom)
    const leafIds = [];
    for (let l = 0; l < leafCount; l++) {
      const leafId = nodeId++;
      leafIds.push(leafId);
      nodes.push({
        id: leafId,
        label: `Leaf ${l + 1}\n${leaf?.model?.model || ''}`,
        group: 'leaf',
        shape: 'box',
        color: '#D2E5FF',
        font: { size: 12 }
      });

      const thisLeaf = perLeaf[l] || { endpointCount: 0, endpointCounts: {} };
      const endpointCounts = thisLeaf.endpointCounts || {};

      // Create one endpoint node per speed group: label like "100G xN"
      Object.entries(endpointCounts).forEach(([speed, count]) => {
        const epGroupId = nodeId++;
        nodes.push({
          id: epGroupId,
          label: `${speed} x${count}`,
          group: 'endpoint',
          shape: 'dot',
          color: '#FFD2D2',
          size: 12,
          font: { size: 12 }
        });
        // Connect grouped endpoint to leaf
        edges.push({ from: epGroupId, to: leafId });
      });
    }

    // Leaf-to-Spine links: represent linksPerLeafPerSpine with an edge label
    const linksPerLeafPerSpine = topology.linksPerLeafPerSpine || 1;
    leafIds.forEach((lid) => {
      spineIds.forEach((sid) => {
        edges.push({ 
          from: lid, 
          to: sid, 
          dashes: true, 
          color: { color: '#888' },
          label: linksPerLeafPerSpine > 1 ? `x${linksPerLeafPerSpine}` : undefined,
          font: { vadjust: -10, size: 10 }
        });
      });
    });

    const options = {
      groups: {
        spine: { color: { background: '#CDE7FF' } },
        leaf: { color: { background: '#D2E5FF' } },
        endpoint: { color: { background: '#FFD2D2' } }
      },
      physics: { enabled: false },
      layout: {
        hierarchical: {
          enabled: true,
          levelSeparation: 220,
          nodeSpacing: 220,
          treeSpacing: 260,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
          direction: 'UD',
          sortMethod: 'hubsize'
        }
      },
      edges: {
        smooth: { type: 'continuous', roundness: 0.4 },
        width: 1,
        color: { color: '#848484' }
      }
    };

    // Prepare data with explicit levels
    const updateWithLevels = {
      nodes: nodes.map(n => {
        if (n.group === 'endpoint') return { ...n, level: 0 };
        if (n.group === 'leaf') return { ...n, level: 1 };
        if (n.group === 'spine') return { ...n, level: 2 };
        return n;
      }),
      edges
    };

    const ensureFullSize = () => {
      if (!networkRef.current) return;
      try {
        networkRef.current.setSize('100%', '100%');
        networkRef.current.redraw();
        networkRef.current.fit({ animation: false });
      } catch {}
    };

    if (networkRef.current) {
      networkRef.current.setData(updateWithLevels);
      networkRef.current.setOptions(options);
      ensureFullSize();
    } else {
      networkRef.current = new Network(containerRef.current, updateWithLevels, options);
      // Initial size & fit after first draw
      const fitOnce = () => {
        ensureFullSize();
        networkRef.current && networkRef.current.off('afterDrawing', fitOnce);
      };
      networkRef.current.on('afterDrawing', fitOnce);
    }

    // Observe container size changes and refit
    if ('ResizeObserver' in window && containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => ensureFullSize());
      resizeObserverRef.current.observe(containerRef.current);
    } else {
      const onResize = () => ensureFullSize();
      window.addEventListener('resize', onResize);
      resizeObserverRef.current = { disconnect: () => window.removeEventListener('resize', onResize) };
    }

    return () => {
      if (resizeObserverRef.current) {
        try { resizeObserverRef.current.disconnect(); } catch {}
        resizeObserverRef.current = null;
      }
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data]);

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>Fabric Topology</h2>
      <div style={{ marginBottom: '8px' }}>
        {data?.topology && (
          <div>
            <strong>Topology:</strong> {data.topology.type} | Leaves: {data.topology.leafCount} | Spines: {data.topology.spineCount} | Uplinks/Leaf: {data.topology.uplinksPerLeaf} | Links Leaf↔Spine: {data.topology.linksPerLeafPerSpine} | Downlinks/Leaf: {data.topology.downlinksPerLeaf}
          </div>
        )}
      </div>
      <div ref={containerRef} style={{ flex: 1, height: '100%', minHeight: 0, border: '1px solid #ccc', borderRadius: '4px' }} />
    </div>
  );
}

export default FabricGraph;
