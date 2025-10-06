import React, { useState } from 'react';
import switches from '../data/switches.json';

function InputForm({ setFabricData }) {
  const [endpointGroups, setEndpointGroups] = useState([]);
  const [leafModelIndex, setLeafModelIndex] = useState(0);
  const [spineModelIndex, setSpineModelIndex] = useState(switches.length > 1 ? 1 : 0);
  const [blockingType, setBlockingType] = useState('non-blocking'); // 'non-blocking' | 'blocking'
  const [customUplinksPerLeaf, setCustomUplinksPerLeaf] = useState(0);

  const getTotalFrontPanelPorts = (sw) => {
    if (!sw || !Array.isArray(sw.ports)) return 0;
    return sw.ports.reduce((sum, p) => sum + (p?.count || 0), 0);
  };

  const parseSpeedGbps = (speedStr) => {
    if (!speedStr) return 0;
    const m = String(speedStr).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const getLeafPrimaryPortSpec = (sw) => {
    // For now, use the first port spec as primary
    if (!sw || !Array.isArray(sw.ports) || sw.ports.length === 0) return null;
    return sw.ports[0];
  };

  const capacityPerPortForSpeed = (portSpec, epSpeedGbps) => {
    if (!portSpec || !epSpeedGbps) return 0;
    const max = portSpec.max_speed_gbps;
    if (!max || max % epSpeedGbps !== 0) return 0;
    const factor = max / epSpeedGbps;
    const supported = Array.isArray(portSpec.split_support) ? portSpec.split_support : [1];
    return supported.includes(factor) ? factor : 0;
  };

  const addEndpointGroup = () => {
    setEndpointGroups([
      ...endpointGroups,
      { count: 1, speed: '100G' }
    ]);
  };

  const updateEndpointGroup = (index, field, value) => {
    const newGroups = [...endpointGroups];
    newGroups[index] = { ...newGroups[index], [field]: field === 'count' ? parseInt(value, 10) || 0 : value };
    setEndpointGroups(newGroups);
  };

  const removeEndpointGroup = (index) => {
    const newGroups = [...endpointGroups];
    newGroups.splice(index, 1);
    setEndpointGroups(newGroups);
  };

  const getTotalEndpoints = () => endpointGroups.reduce((sum, g) => sum + (g.count || 0), 0);

  const distributeEndpointsAcrossLeaves = (leafCount) => {
    // Flatten endpoints preserving speed, then round-robin assign to leaves
    const allEndpoints = [];
    endpointGroups.forEach(g => {
      for (let i = 0; i < (g.count || 0); i++) allEndpoints.push(g.speed);
    });
    const perLeaf = Array.from({ length: leafCount }, () => ({ endpointCount: 0, endpointCounts: {} }));
    let idx = 0;
    allEndpoints.forEach(speed => {
      const leafIdx = idx % leafCount;
      perLeaf[leafIdx].endpointCount += 1;
      perLeaf[leafIdx].endpointCounts[speed] = (perLeaf[leafIdx].endpointCounts[speed] || 0) + 1;
      idx++;
    });
    return perLeaf;
  };

  const pickSpineCount = (leafCount, uplinksPerLeaf, spinePorts) => {
    // Find smallest S that divides U and (U/S) * L <= spinePorts
    const U = uplinksPerLeaf;
    if (U <= 0) return 1;
    const divisors = [];
    for (let d = 1; d <= U; d++) if (U % d === 0) divisors.push(d);
    for (const S of divisors) {
      const linksPerLeafPerSpine = U / S; // integer
      const portsNeededPerSpine = linksPerLeafPerSpine * leafCount;
      if (portsNeededPerSpine <= spinePorts) return { spineCount: S, linksPerLeafPerSpine };
    }
    // If no divisor satisfies capacity, choose the largest divisor (U) and warn
    const S = U;
    const linksPerLeafPerSpine = 1;
    const portsNeededPerSpine = linksPerLeafPerSpine * leafCount;
    if (portsNeededPerSpine > spinePorts) {
      console.warn('Even with one link per leaf per spine, the selected spine has insufficient ports. Consider a larger spine model or a multi-tier design.');
    }
    return { spineCount: S, linksPerLeafPerSpine };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const leafModel = switches[leafModelIndex];
    const spineModel = switches[spineModelIndex];
    const leafPorts = getTotalFrontPanelPorts(leafModel);
    const spinePorts = getTotalFrontPanelPorts(spineModel);

    const uplinksPerLeaf = blockingType === 'non-blocking' ? Math.floor(leafPorts / 2) : Math.max(0, parseInt(customUplinksPerLeaf || 0, 10));
    const remainingDownlinkPorts = Math.max(0, leafPorts - uplinksPerLeaf);

    if (remainingDownlinkPorts === 0) {
      alert('Downlinks per leaf is 0. Increase leaf ports or reduce uplinks.');
      return;
    }

    // Compute how many physical downlink ports are needed per leaf for the endpoint groups,
    // considering split_support of the leaf's primary port spec.
    const portSpec = getLeafPrimaryPortSpec(leafModel);
    let requiredDownlinkPortsTotal = 0;
    for (const g of endpointGroups) {
      const speedGbps = parseSpeedGbps(g.speed);
      const cap = capacityPerPortForSpeed(portSpec, speedGbps);
      if (g.count > 0 && cap === 0) {
        alert(`Selected leaf port type does not support ${g.speed} endpoints (split factors: ${JSON.stringify(portSpec?.split_support || [1])}, max ${portSpec?.max_speed_gbps || '?'}G).`);
        return;
      }
      requiredDownlinkPortsTotal += Math.ceil((g.count || 0) / cap || 0);
    }

    // Corner Case 1: Check if endpoints fit in a single leaf switch (no fabric needed)
    if (requiredDownlinkPortsTotal <= remainingDownlinkPorts) {
      alert(`All ${getTotalEndpoints()} endpoints fit in a single ${leafModel.model} switch (${remainingDownlinkPorts} downlink ports available).\n\nNo fabric required - use a single switch instead.`);
      return;
    }

    // Size number of leaves by how many downlink ports are available per leaf
    const leafCount = Math.max(1, Math.ceil(requiredDownlinkPortsTotal / remainingDownlinkPorts));

    const { spineCount, linksPerLeafPerSpine } = pickSpineCount(leafCount, uplinksPerLeaf, spinePorts);

    // Corner Case 2: Check if fabric exceeds physical spine port limits
    const requiredPortsPerSpine = linksPerLeafPerSpine * leafCount;
    if (requiredPortsPerSpine > spinePorts) {
      const maxLeafCount = Math.floor(spinePorts / linksPerLeafPerSpine);
      const maxEndpoints = maxLeafCount * remainingDownlinkPorts;
      
      alert(
        `⚠️ Fabric Configuration Exceeds Physical Limits\n\n` +
        `Current configuration requires:\n` +
        `  • ${leafCount} leaf switches\n` +
        `  • ${spineCount} spine switches\n` +
        `  • ${linksPerLeafPerSpine} link(s) per leaf-spine pair\n` +
        `  • ${requiredPortsPerSpine} ports per spine (EXCEEDS ${spinePorts} available)\n\n` +
        `Maximum capacity for ${spineModel.model} ${blockingType === 'non-blocking' ? 'fully non-blocking' : ''} fabric:\n` +
        `  • Max ${maxLeafCount} leaf switches\n` +
        `  • Approximately ${maxEndpoints} endpoints\n\n` +
        `Solutions:\n` +
        `  1. Reduce number of endpoints\n` +
        `  2. Select a spine switch with more ports\n` +
        `  3. Use a blocking/oversubscribed configuration (custom uplinks)\n` +
        `  4. Consider a multi-tier or pod-based architecture`
      );
      return;
    }

    const perLeafDistribution = distributeEndpointsAcrossLeaves(leafCount);

    // Build fabric data
    const totalEndpointsBySpeed = endpointGroups.reduce((acc, g) => {
      acc[g.speed] = (acc[g.speed] || 0) + (g.count || 0);
      return acc;
    }, {});

    const fabricData = {
      topology: {
        type: '2-tier-fat-tree',
        blockingType,
        uplinksPerLeaf,
        linksPerLeafPerSpine,
        downlinksPerLeaf: remainingDownlinkPorts,
        leafCount,
        spineCount
      },
      leaf: {
        model: leafModel,
        totalPorts: leafPorts
      },
      spine: {
        model: spineModel,
        totalPorts: spinePorts
      },
      endpointGroups,
      totalEndpoints: getTotalEndpoints(),
      totalEndpointsBySpeed,
      distribution: {
        perLeaf: perLeafDistribution
      }
    };

    setFabricData(fabricData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h3>System Configuration</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>Endpoint Groups</h4>
        {endpointGroups.map((group, idx) => (
          <div key={idx} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              value={group.count}
              onChange={(e) => updateEndpointGroup(idx, 'count', e.target.value)}
              style={{ width: '80px', marginRight: '10px' }}
            />
            <span style={{ marginRight: '10px' }}>×</span>
            <select
              value={group.speed}
              onChange={(e) => updateEndpointGroup(idx, 'speed', e.target.value)}
              style={{ marginRight: '10px' }}
            >
              <option value="10G">10G</option>
              <option value="25G">25G</option>
              <option value="40G">40G</option>
              <option value="50G">50G</option>
              <option value="100G">100G</option>
              <option value="200G">200G</option>
              <option value="400G">400G</option>
            </select>
            <button
              type="button"
              onClick={() => removeEndpointGroup(idx)}
              style={{
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addEndpointGroup}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Add Endpoint Group
        </button>

        <div style={{ marginTop: '15px', fontWeight: 'bold' }}>
          Total Endpoints: {getTotalEndpoints()}
        </div>
      </div>

      <h3>Topology & Switch Models</h3>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <label>
          Leaf Model:
          <select
            value={leafModelIndex}
            onChange={(e) => setLeafModelIndex(parseInt(e.target.value, 10))}
            style={{ marginLeft: '10px' }}
          >
            {switches.map((sw, i) => (
              <option key={i} value={i}>{sw.model} ({sw.technology})</option>
            ))}
          </select>
        </label>

        <label>
          Spine Model:
          <select
            value={spineModelIndex}
            onChange={(e) => setSpineModelIndex(parseInt(e.target.value, 10))}
            style={{ marginLeft: '10px' }}
          >
            {switches.map((sw, i) => (
              <option key={i} value={i}>{sw.model} ({sw.technology})</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginTop: '10px' }}>
        <label>
          <input
            type="radio"
            checked={blockingType === 'non-blocking'}
            onChange={() => setBlockingType('non-blocking')}
          />
          Fully Non-Blocking (uplinks per leaf = half of leaf ports)
        </label>

        <label style={{ display: 'block', marginTop: '5px' }}>
          <input
            type="radio"
            checked={blockingType === 'blocking'}
            onChange={() => setBlockingType('blocking')}
          />
          Custom uplinks per leaf:
          <input
            type="number"
            min="1"
            value={customUplinksPerLeaf || ''}
            onChange={(e) => setCustomUplinksPerLeaf(parseInt(e.target.value, 10))}
            disabled={blockingType !== 'blocking'}
            style={{ marginLeft: '10px', width: '60px' }}
          />
        </label>
      </div>

      <div style={{ margin: '15px 0' }}>
        <button
          type="submit"
          disabled={getTotalEndpoints() === 0}
          style={{
            backgroundColor: getTotalEndpoints() > 0 ? '#2196F3' : '#cccccc',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: getTotalEndpoints() > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Generate Fabric
        </button>
      </div>
    </form>
  );
}

export default InputForm;
