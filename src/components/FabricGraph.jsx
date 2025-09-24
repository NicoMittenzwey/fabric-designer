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

    // Spines (top layer) - show first 1, last 1, and "..." if more than 3
    const spineIds = [];
    const maxSpinesToShow = 3;
    
    if (spineCount <= maxSpinesToShow) {
      // Show all spines
      for (let i = 0; i < spineCount; i++) {
        const id = nodeId++;
        spineIds.push(id);
        nodes.push({
          id,
          label: `Spine ${i + 1}\n${spine?.model?.model || ''}`,
          group: 'spine',
          shape: 'box',
          color: '#CDE7FF',
          font: { size: 18 }
        });
      }
    } else {
      // Show first 1 spine
      for (let i = 0; i < 1; i++) {
        const id = nodeId++;
        spineIds.push(id);
        nodes.push({
          id,
          label: `Spine ${i + 1}\n${spine?.model?.model || ''}`,
          group: 'spine',
          shape: 'box',
          color: '#CDE7FF',
          font: { size: 18 }
        });
      }
      
      // Add "..." placeholder
      const ellipsisId = nodeId++;
      spineIds.push(ellipsisId);
      nodes.push({
        id: ellipsisId,
        label: `...\n(${spineCount - 2} more)`,
        group: 'spine',
        shape: 'box',
        color: '#E8E8E8',
        font: { size: 16 }
      });
      
      // Show last 1 spine
      for (let i = spineCount - 1; i < spineCount; i++) {
        const id = nodeId++;
        spineIds.push(id);
        nodes.push({
          id,
          label: `Spine ${i + 1}\n${spine?.model?.model || ''}`,
          group: 'spine',
          shape: 'box',
          color: '#CDE7FF',
          font: { size: 18 }
        });
      }
    }

    // Leaves (middle layer) and endpoints (bottom) - show first 2, last 2, and "..." if more than 5
    const leafIds = [];
    const maxLeavesToShow = 5;
    
    if (leafCount <= maxLeavesToShow) {
      // Show all leaves
      for (let l = 0; l < leafCount; l++) {
        const leafId = nodeId++;
        leafIds.push(leafId);
        nodes.push({
          id: leafId,
          label: `Leaf ${l + 1}\n${leaf?.model?.model || ''}`,
          group: 'leaf',
          shape: 'box',
          color: '#D2E5FF',
          font: { size: 18 }
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
            font: { size: 18 }
          });
          // Connect grouped endpoint to leaf
          edges.push({ from: epGroupId, to: leafId });
        });
      }
    } else {
      // Show first 2 leaves
      for (let l = 0; l < 2; l++) {
        const leafId = nodeId++;
        leafIds.push(leafId);
        nodes.push({
          id: leafId,
          label: `Leaf ${l + 1}\n${leaf?.model?.model || ''}`,
          group: 'leaf',
          shape: 'box',
          color: '#D2E5FF',
          font: { size: 18 }
        });

        const thisLeaf = perLeaf[l] || { endpointCount: 0, endpointCounts: {} };
        const endpointCounts = thisLeaf.endpointCounts || {};

        Object.entries(endpointCounts).forEach(([speed, count]) => {
          const epGroupId = nodeId++;
          nodes.push({
            id: epGroupId,
            label: `${speed} x${count}`,
            group: 'endpoint',
            shape: 'dot',
            color: '#FFD2D2',
            size: 12,
            font: { size: 18 }
          });
          edges.push({ from: epGroupId, to: leafId });
        });
      }
      
      // Add "..." placeholder for leaves
      const leafEllipsisId = nodeId++;
      leafIds.push(leafEllipsisId);
      nodes.push({
        id: leafEllipsisId,
        label: `...\n(${leafCount - 4} more)`,
        group: 'leaf',
        shape: 'box',
        color: '#E8E8E8',
        font: { size: 16 }
      });
      
      // Add "..." placeholder for endpoints under the middle leaf
      const epEllipsisId = nodeId++;
      nodes.push({
        id: epEllipsisId,
        label: `...\n(more endpoints)`,
        group: 'endpoint',
        shape: 'dot',
        color: '#F0F0F0',
        size: 12,
        font: { size: 14 }
      });
      edges.push({ from: epEllipsisId, to: leafEllipsisId });
      
      // Show last 2 leaves
      for (let l = leafCount - 2; l < leafCount; l++) {
        const leafId = nodeId++;
        leafIds.push(leafId);
        nodes.push({
          id: leafId,
          label: `Leaf ${l + 1}\n${leaf?.model?.model || ''}`,
          group: 'leaf',
          shape: 'box',
          color: '#D2E5FF',
          font: { size: 18 }
        });

        const thisLeaf = perLeaf[l] || { endpointCount: 0, endpointCounts: {} };
        const endpointCounts = thisLeaf.endpointCounts || {};

        Object.entries(endpointCounts).forEach(([speed, count]) => {
          const epGroupId = nodeId++;
          nodes.push({
            id: epGroupId,
            label: `${speed} x${count}`,
            group: 'endpoint',
            shape: 'dot',
            color: '#FFD2D2',
            size: 12,
            font: { size: 18 }
          });
          edges.push({ from: epGroupId, to: leafId });
        });
      }
    }

    // Leaf-to-Spine links: represent linksPerLeafPerSpine with an edge label
    const linksPerLeafPerSpine = topology.linksPerLeafPerSpine || 1;
    leafIds.forEach((lid, leafIndex) => {
      spineIds.forEach((sid, spineIndex) => {
        let linkLabel = undefined;
        
        // Only show link labels on first and last leaf switches
        const isFirstOrLastLeaf = leafIndex === 0 || leafIndex === leafIds.length - 1;
        
        if (isFirstOrLastLeaf) {
          linkLabel = linksPerLeafPerSpine > 1 ? `x${linksPerLeafPerSpine}` : undefined;
          
          // If this is the "..." spine (middle spine when spineCount > 3), multiply by hidden spine count
          if (spineCount > maxSpinesToShow && spineIndex === 1) {
            const hiddenSpineCount = spineCount - 2; // Total spines minus first and last shown
            const totalLinksToHiddenSpines = linksPerLeafPerSpine * hiddenSpineCount;
            linkLabel = totalLinksToHiddenSpines > 1 ? `x${totalLinksToHiddenSpines}` : undefined;
          }
        }
        
        edges.push({ 
          from: lid, 
          to: sid, 
          dashes: true, 
          color: { color: '#888' },
          label: linkLabel,
          font: { vadjust: -10, size: 18 }
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
          levelSeparation: 150,
          nodeSpacing: 200,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
          direction: 'UD',
          sortMethod: 'hubsize',
          shakeTowards: 'roots'
        }
      },
      edges: {
        smooth: false,
        width: 1,
        color: { color: '#848484' }
      }
    };

    // Set explicit levels for better layering (spines at top, endpoints at bottom)
    const updateWithLevels = {
      nodes: nodes.map(n => {
        if (n.group === 'spine') return { ...n, level: 0 };
        if (n.group === 'leaf') return { ...n, level: 1 };
        if (n.group === 'endpoint') return { ...n, level: 2 };
        return n;
      }),
      edges
    };

    const ensureFullSize = () => {
      if (!networkRef.current) return;
      try {
        networkRef.current.setSize('100%', '100%');
        networkRef.current.redraw();
        
        // First fit to show all nodes
        networkRef.current.fit({ animation: false });
        
        // Calculate center of mass of all nodes after layout
        setTimeout(() => {
          try {
            const positions = networkRef.current.getPositions();
            const nodeIds = Object.keys(positions);
            
            if (nodeIds.length > 0) {
              let centerX = 0;
              let centerY = 0;
              
              nodeIds.forEach(id => {
                centerX += positions[id].x;
                centerY += positions[id].y;
              });
              
              centerX /= nodeIds.length;
              centerY /= nodeIds.length;
              
              // Move view to center of mass
              networkRef.current.moveTo({ 
                position: { x: centerX, y: centerY }, 
                scale: networkRef.current.getScale(),
                animation: false 
              });
            }
          } catch {}
        }, 200);
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
