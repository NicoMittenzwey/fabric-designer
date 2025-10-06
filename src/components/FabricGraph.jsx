import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';

function FabricGraph({ data }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

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
    
    // Get uplink speed from spine port spec
    const spinePortSpeed = spine?.model?.ports?.[0]?.max_speed_gbps || 0;
    const uplinkSpeedLabel = spinePortSpeed > 0 ? `${spinePortSpeed}G` : '';
    
    leafIds.forEach((lid, leafIndex) => {
      spineIds.forEach((sid, spineIndex) => {
        let linkLabel = undefined;
        
        // Only show link labels on first and last leaf switches
        const isFirstOrLastLeaf = leafIndex === 0 || leafIndex === leafIds.length - 1;
        
        if (isFirstOrLastLeaf) {
          // Always show link count label on first/last leaves, even if x1, with speed
          linkLabel = `${uplinkSpeedLabel} x${linksPerLeafPerSpine} `;
          
          // If this is the "..." spine (middle spine when spineCount > 3), multiply by hidden spine count
          if (spineCount > maxSpinesToShow && spineIndex === 1) {
            const hiddenSpineCount = spineCount - 2; // Total spines minus first and last shown
            const totalLinksToHiddenSpines = linksPerLeafPerSpine * hiddenSpineCount;
            linkLabel = `x${totalLinksToHiddenSpines}`;
          }
        }
        
        // Determine if this edge should be highlighted (has link count label)
        const hasLinkCount = linkLabel !== undefined;
        
        edges.push({ 
          from: lid, 
          to: sid, 
          dashes: !hasLinkCount, // Solid line for edges with link counts, dashed for others
          color: { color: hasLinkCount ? '#333' : '#888' }, // Darker color for edges with link counts
          width: hasLinkCount ? 2 : 1, // Thicker line for edges with link counts
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

  // PowerPoint export function with native shapes
  const exportToPowerPoint = async () => {
    if (!containerRef.current || !data) {
      console.log('Export cancelled: missing container or data');
      return;
    }
    
    setIsExporting(true);
    try {
      console.log('Starting PowerPoint export with native shapes...');
      
      const { topology, leaf, spine, distribution } = data;
      const leafCount = topology.leafCount || 0;
      const spineCount = topology.spineCount || 0;
      const perLeaf = distribution?.perLeaf || [];
      
      // Create PowerPoint presentation
      const pptx = new pptxgen();
      console.log('PowerPoint instance created');
      
      // Set presentation properties
      pptx.author = 'Fabric Designer';
      pptx.company = 'Network Design Tool';
      pptx.title = 'Fabric Topology';
      pptx.subject = 'Network Fabric Design';
      
      // Add main slide with topology
      const slide = pptx.addSlide();
      console.log('Main slide created');
      
      // Add title
      slide.addText('Fabric Topology', {
        x: 0.5, y: 0.2, w: 9, h: 0.6,
        fontSize: 28, bold: true, color: '363636',
        align: 'center'
      });
      console.log('Title added');
      
      // Calculate layout positions
      const slideWidth = 10;
      const slideHeight = 7.5;
      const startY = 1.2;
      const layerHeight = 1.5;
      
      // Spine layer (top) - follow same logic as web visualization
      const spineY = startY;
      const maxSpinesToShow = 3; // Same as web version
      
      console.log(`Creating spine switches (${spineCount} total, showing pattern)...`);
      
      // Create spine switches following web visualization pattern
      const spinePositions = [];
      let spineSpacing, totalSpinesToDraw;
      
      if (spineCount <= maxSpinesToShow) {
        // Show all spines
        totalSpinesToDraw = spineCount;
        spineSpacing = slideWidth / (totalSpinesToDraw + 1);
        
        for (let i = 0; i < spineCount; i++) {
          const x = spineSpacing * (i + 1) - 0.6;
          spinePositions.push({ x, y: spineY });
          
          // Add spine switch rectangle
          slide.addShape(pptx.ShapeType.rect, {
            x: x, y: spineY, w: 1.2, h: 0.8,
            fill: { color: 'CDE7FF' },
            line: { color: '4472C4', width: 2 },
            shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '888888', opacity: 0.3 }
          });
          
          // Add spine label
          slide.addText(`Spine ${i + 1}\n${spine?.model?.model || 'Switch'}`, {
            x: x, y: spineY + 0.1, w: 1.2, h: 0.6,
            fontSize: 10, bold: true, color: '1F4E79',
            align: 'center', valign: 'middle'
          });
        }
      } else {
        // Show first 1, "...", last 1 (total 3 elements)
        totalSpinesToDraw = 3;
        spineSpacing = slideWidth / (totalSpinesToDraw + 1);
        
        // First spine
        const firstX = spineSpacing * 1 - 0.6;
        spinePositions.push({ x: firstX, y: spineY });
        
        slide.addShape(pptx.ShapeType.rect, {
          x: firstX, y: spineY, w: 1.2, h: 0.8,
          fill: { color: 'CDE7FF' },
          line: { color: '4472C4', width: 2 },
          shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '888888', opacity: 0.3 }
        });
        
        slide.addText(`Spine 1\n${spine?.model?.model || 'Switch'}`, {
          x: firstX, y: spineY + 0.1, w: 1.2, h: 0.6,
          fontSize: 10, bold: true, color: '1F4E79',
          align: 'center', valign: 'middle'
        });
        
        // Ellipsis spine
        const ellipsisX = spineSpacing * 2 - 0.6;
        spinePositions.push({ x: ellipsisX, y: spineY });
        
        slide.addShape(pptx.ShapeType.rect, {
          x: ellipsisX, y: spineY, w: 1.2, h: 0.8,
          fill: { color: 'E8E8E8' },
          line: { color: '888888', width: 1 }
        });
        
        slide.addText(`...\n(${spineCount - 2} more)`, {
          x: ellipsisX, y: spineY + 0.1, w: 1.2, h: 0.6,
          fontSize: 9, color: '666666',
          align: 'center', valign: 'middle'
        });
        
        // Last spine
        const lastX = spineSpacing * 3 - 0.6;
        spinePositions.push({ x: lastX, y: spineY });
        
        slide.addShape(pptx.ShapeType.rect, {
          x: lastX, y: spineY, w: 1.2, h: 0.8,
          fill: { color: 'CDE7FF' },
          line: { color: '4472C4', width: 2 },
          shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '888888', opacity: 0.3 }
        });
        
        slide.addText(`Spine ${spineCount}\n${spine?.model?.model || 'Switch'}`, {
          x: lastX, y: spineY + 0.1, w: 1.2, h: 0.6,
          fontSize: 10, bold: true, color: '1F4E79',
          align: 'center', valign: 'middle'
        });
      }
      
      // Leaf layer (middle) - follow same logic as web visualization
      const leafY = startY + layerHeight * 1.5;
      const maxLeavesToShow = 5; // Same as web version
      
      console.log(`Creating leaf switches (${leafCount} total, showing pattern)...`);
      
      // Create leaf switches following web visualization pattern
      const leafPositions = [];
      let leafSpacing, totalLeavesToDraw;
      
      if (leafCount <= maxLeavesToShow) {
        // Show all leaves
        totalLeavesToDraw = leafCount;
        leafSpacing = slideWidth / (totalLeavesToDraw + 1);
        
        for (let i = 0; i < leafCount; i++) {
          const x = leafSpacing * (i + 1) - 0.6;
          leafPositions.push({ x, y: leafY });
          
          // Add leaf switch rectangle
          slide.addShape(pptx.ShapeType.rect, {
            x: x, y: leafY, w: 1.2, h: 0.8,
            fill: { color: 'D2E5FF' },
            line: { color: '2F5496', width: 2 },
            shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '888888', opacity: 0.3 }
          });
          
          // Add leaf label
          slide.addText(`Leaf ${i + 1}\n${leaf?.model?.model || 'Switch'}`, {
            x: x, y: leafY + 0.1, w: 1.2, h: 0.6,
            fontSize: 10, bold: true, color: '1F4E79',
            align: 'center', valign: 'middle'
          });
        }
      } else {
        // Show first 2, "...", last 2 (total 5 elements)
        totalLeavesToDraw = 5;
        leafSpacing = slideWidth / (totalLeavesToDraw + 1);
        
        // First 2 leaves
        for (let i = 0; i < 2; i++) {
          const x = leafSpacing * (i + 1) - 0.6;
          leafPositions.push({ x, y: leafY });
          
          slide.addShape(pptx.ShapeType.rect, {
            x: x, y: leafY, w: 1.2, h: 0.8,
            fill: { color: 'D2E5FF' },
            line: { color: '2F5496', width: 2 },
            shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '888888', opacity: 0.3 }
          });
          
          slide.addText(`Leaf ${i + 1}\n${leaf?.model?.model || 'Switch'}`, {
            x: x, y: leafY + 0.1, w: 1.2, h: 0.6,
            fontSize: 10, bold: true, color: '1F4E79',
            align: 'center', valign: 'middle'
          });
        }
        
        // Ellipsis leaf
        const ellipsisX = leafSpacing * 3 - 0.6;
        leafPositions.push({ x: ellipsisX, y: leafY });
        
        slide.addShape(pptx.ShapeType.rect, {
          x: ellipsisX, y: leafY, w: 1.2, h: 0.8,
          fill: { color: 'E8E8E8' },
          line: { color: '888888', width: 1 }
        });
        
        slide.addText(`...\n(${leafCount - 4} more)`, {
          x: ellipsisX, y: leafY + 0.1, w: 1.2, h: 0.6,
          fontSize: 9, color: '666666',
          align: 'center', valign: 'middle'
        });
        
        // Last 2 leaves
        for (let i = 0; i < 2; i++) {
          const leafIndex = leafCount - 2 + i;
          const x = leafSpacing * (4 + i) - 0.6;
          leafPositions.push({ x, y: leafY });
          
          slide.addShape(pptx.ShapeType.rect, {
            x: x, y: leafY, w: 1.2, h: 0.8,
            fill: { color: 'D2E5FF' },
            line: { color: '2F5496', width: 2 },
            shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '888888', opacity: 0.3 }
          });
          
          slide.addText(`Leaf ${leafIndex + 1}\n${leaf?.model?.model || 'Switch'}`, {
            x: x, y: leafY + 0.1, w: 1.2, h: 0.6,
            fontSize: 10, bold: true, color: '1F4E79',
            align: 'center', valign: 'middle'
          });
        }
      }
      
      // Endpoint layer (bottom)
      const endpointY = startY + layerHeight * 3;
      
      console.log('Creating endpoint groups...');
      
      // Create endpoint groups for each leaf (including ellipsis leaf)
      for (let i = 0; i < leafPositions.length; i++) {
        const leafX = leafPositions[i].x;
        
        // Check if this is the ellipsis leaf
        const isEllipsisLeaf = leafCount > maxLeavesToShow && i === 2;
        
        if (isEllipsisLeaf) {
          // Add ellipsis endpoint under ellipsis leaf
          const endpointX = leafX;
          
          slide.addShape(pptx.ShapeType.ellipse, {
            x: endpointX, y: endpointY, w: 0.4, h: 0.4,
            fill: { color: 'F0F0F0' },
            line: { color: '999999', width: 1 }
          });
          
          slide.addText(`...\n(more)`, {
            x: endpointX, y: endpointY, w: 0.4, h: 0.4,
            fontSize: 6, color: '666666',
            align: 'center', valign: 'middle'
          });
          
          // Add connection line from ellipsis leaf to ellipsis endpoint
          slide.addShape(pptx.ShapeType.line, {
            x: leafX + 0.6, y: leafY + 0.8,
            w: endpointX + 0.2 - (leafX + 0.6), h: endpointY - (leafY + 0.8),
            line: { color: '888888', width: 1 }
          });
          
          continue; // Skip normal endpoint processing for ellipsis leaf
        }
        
        // Map to correct leaf data index for actual leaves
        let leafDataIndex;
        if (leafCount <= maxLeavesToShow) {
          leafDataIndex = i;
        } else {
          // First 2 leaves: positions 0,1 → data index 0,1
          // Last 2 leaves: positions 3,4 → data index leafCount-2, leafCount-1
          if (i < 2) {
            leafDataIndex = i; // First 2 leaves
          } else {
            leafDataIndex = leafCount - 2 + (i - 3); // Last 2 leaves (i-3 because positions 3,4 map to indices 0,1)
          }
        }
        
        const thisLeaf = perLeaf[leafDataIndex] || { endpointCount: 0, endpointCounts: {} };
        const endpointCounts = thisLeaf.endpointCounts || {};
        
        let endpointIndex = 0;
        Object.entries(endpointCounts).forEach(([speed, count]) => {
          const endpointX = leafX + (endpointIndex * 0.3) - 0.15;
          
          // Add endpoint circle
          slide.addShape(pptx.ShapeType.ellipse, {
            x: endpointX, y: endpointY, w: 0.4, h: 0.4,
            fill: { color: 'FFD2D2' },
            line: { color: 'CC6677', width: 1 }
          });
          
          // Add endpoint label
          slide.addText(`${speed}\nx${count}`, {
            x: endpointX, y: endpointY, w: 0.4, h: 0.4,
            fontSize: 7, bold: true, color: '8B0000',
            align: 'center', valign: 'middle'
          });
          
          // Add connection line from leaf to endpoint
          slide.addShape(pptx.ShapeType.line, {
            x: leafX + 0.6, y: leafY + 0.8,
            w: endpointX + 0.2 - (leafX + 0.6), h: endpointY - (leafY + 0.8),
            line: { color: '888888', width: 1 }
          });
          
          endpointIndex++;
        });
      }
      
      // Create leaf-to-spine connections
      console.log('Creating leaf-to-spine connections...');
      const linksPerLeafPerSpine = topology.linksPerLeafPerSpine || 1;
      
      // Get uplink speed from spine port spec
      const spinePortSpeed = spine?.model?.ports?.[0]?.max_speed_gbps || 0;
      const uplinkSpeedLabel = spinePortSpeed > 0 ? `${spinePortSpeed}G` : '';
      
      // Include ellipsis nodes in connections
      const totalSpinePositions = spinePositions.length;
      const totalLeafPositions = leafPositions.length;
      
      for (let leafIdx = 0; leafIdx < totalLeafPositions; leafIdx++) {
        for (let spineIdx = 0; spineIdx < totalSpinePositions; spineIdx++) {
          const leafPos = leafPositions[leafIdx];
          const spinePos = spinePositions[spineIdx];
          
          // Determine if this should be a highlighted connection (with link count)
          const isFirstOrLastLeaf = leafIdx === 0 || leafIdx === totalLeafPositions - 1;
          const isEllipsisSpine = spineCount > maxSpinesToShow && spineIdx === 1; // Middle position is ellipsis
          const isLastSpine = spineCount > maxSpinesToShow && spineIdx === totalSpinePositions - 1; // Last spine
          
          // Show link count for first/last leaves to all spines, even if x1
          const showLinkCount = isFirstOrLastLeaf;
          
          // Create connection line
          const lineColor = showLinkCount ? '333333' : '888888';
          const lineWidth = showLinkCount ? 3 : 1;
          const lineDash = showLinkCount ? 'solid' : 'dash';
          
          slide.addShape(pptx.ShapeType.line, {
            x: leafPos.x + 0.6, y: leafPos.y,
            w: spinePos.x + 0.6 - (leafPos.x + 0.6), h: spinePos.y + 0.8 - leafPos.y,
            line: { 
              color: lineColor, 
              width: lineWidth,
              dashType: lineDash
            }
          });
          
          // Add link count label if needed
          if (showLinkCount) {
            const midX = (leafPos.x + spinePos.x + 1.2) / 2;
            const midY = (leafPos.y + spinePos.y + 0.8) / 2;
            
            // Calculate link count - multiply by hidden spine count for ellipsis spine
            let linkCount = linksPerLeafPerSpine;
            if (isEllipsisSpine) {
              const hiddenSpineCount = spineCount - 2; // Total spines minus first and last shown
              linkCount = linksPerLeafPerSpine * hiddenSpineCount;
            }
            
            const labelText = isEllipsisSpine ? `x${linkCount}` : `${uplinkSpeedLabel} x${linkCount} `;
            slide.addText(labelText, {
              x: midX - 0.25, y: midY - 0.1, w: 0.6, h: 0.2,
              fontSize: 8, bold: true, color: '333333',
              align: 'center', valign: 'middle',
              fill: { color: 'FFFFFF' },
              line: { color: '333333', width: 1 }
            });
          }
        }
      }
      
      // Add topology summary
      slide.addText([
        `Topology: ${topology.type || 'N/A'}`,
        `Leaves: ${leafCount} | Spines: ${spineCount}`,
        `Uplinks/Leaf: ${topology.uplinksPerLeaf || 0}`,
        `Links Leaf↔Spine: ${linksPerLeafPerSpine}`
      ].join('\n'), {
        x: 0.5, y: startY + layerHeight * 4, w: 9, h: 1,
        fontSize: 12, color: '555555',
        align: 'left'
      });
      
      console.log('All shapes created successfully');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `fabric-topology-editable-${timestamp}.pptx`;
      
      // Save the presentation
      console.log('Saving PowerPoint file...');
      await pptx.writeFile({ fileName: filename });
      
      console.log(`Editable PowerPoint presentation saved as: ${filename}`);
    } catch (error) {
      console.error('Detailed error exporting to PowerPoint:', error);
      console.error('Error stack:', error.stack);
      alert(`Error exporting to PowerPoint: ${error.message}. Check console for details.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Fabric Topology</h2>
        <button 
          onClick={exportToPowerPoint}
          disabled={isExporting || !data}
          style={{
            padding: '8px 16px',
            backgroundColor: isExporting ? '#ccc' : '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isExporting ? 'Exporting...' : '📊 Export to PowerPoint'}
        </button>
      </div>
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
