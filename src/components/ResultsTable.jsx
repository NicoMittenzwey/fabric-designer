import React from 'react';

function ResultsTable({ data }) {
  const leafModel = data?.leaf?.model;
  const spineModel = data?.spine?.model;
  const topo = data?.topology || {};
  const perLeaf = data?.distribution?.perLeaf || [];

  const totalEndpoints = data?.totalEndpoints || perLeaf.reduce((s, l) => s + (l.endpointCount || 0), 0);

  // Calculate cable information
  const calculateCableInfo = () => {
    const uplinkCables = topo.leafCount * topo.uplinksPerLeaf;

    // Get uplink speed from spine port spec
    const uplinkSpeed = spineModel?.ports?.[0]?.max_speed_gbps || 'N/A';

    // Group downlink cables by speed
    const downlinkCableGroups = {};

    perLeaf.forEach(leaf => {
      if (leaf.splitConfigurations) {
        Object.entries(leaf.splitConfigurations).forEach(([speed, config]) => {
          const splitFactor = config.splitFactor;
          const cableCount = config.cableCount;

          // Calculate the actual cable speed (port speed / split factor)
          // We need the port spec to get max_speed_gbps
          if (leafModel?.ports?.[0]?.max_speed_gbps) {
            const cableSpeed = leafModel.ports[0].max_speed_gbps / splitFactor;

            if (!downlinkCableGroups[cableSpeed]) {
              downlinkCableGroups[cableSpeed] = {
                speed: cableSpeed,
                splitFactor: splitFactor,
                totalCables: 0,
                endpointSpeed: speed,
                portSpeed: leafModel.ports[0].max_speed_gbps
              };
            }
            downlinkCableGroups[cableSpeed].totalCables += cableCount;
          }
        });
      }
    });

    return { uplinkCables, uplinkSpeed, downlinkCableGroups };
  };

  const { uplinkCables, uplinkSpeed, downlinkCableGroups } = calculateCableInfo();

  const renderEndpointBreakdown = (counts) => {
    if (!counts) return null;
    return Object.entries(counts).map(([speed, count]) => (
      <div key={speed}>{count} × {speed}</div>
    ));
  };

  return (
    <div>
      <h2>Results</h2>

      <table border="1" cellPadding="5" style={{ marginBottom: '12px' }}>
        <thead>
          <tr>
            <th>Role</th>
            <th>Model</th>
            <th>Technology</th>
            <th>Count</th>
            <th>Uplinks/Leaf</th>
            <th>Downlinks/Leaf</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Leaf</td>
            <td>{leafModel?.model || '—'}</td>
            <td>{leafModel?.technology || '—'}</td>
            <td>{topo.leafCount || 0}</td>
            <td>{topo.uplinksPerLeaf || 0}</td>
            <td>{topo.downlinksPerLeaf || 0}</td>
          </tr>
          <tr>
            <td>Spine</td>
            <td>{spineModel?.model || '—'}</td>
            <td>{spineModel?.technology || '—'}</td>
            <td>{topo.spineCount || 0}</td>
            <td colSpan={2}>{topo.blockingType === 'non-blocking' ? 'Fully Non-Blocking' : (() => {
              const uplinks = topo.uplinksPerLeaf || 0;
              const downlinks = topo.downlinksPerLeaf || 0;
              return uplinks > 0 ? `1:${(downlinks / uplinks).toFixed(2)} Blocking` : 'Custom Blocking';
            })()}</td>
          </tr>
        </tbody>
      </table>

      {/* Cable Information Table */}
      <h3>Cable Summary</h3>
      <table border="1" cellPadding="5" style={{ marginBottom: '12px' }}>
        <thead>
          <tr>
            <th>Cable Type</th>
            <th>Total Cables</th>
            <th>Speed / Configuration</th>
            <th>Split Factor</th>
            <th>Endpoint Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Uplink Cables</strong></td>
            <td>{uplinkCables}</td>
            <td>{uplinkSpeed}G</td>
            <td colSpan={2}>Leaf to Spine connections</td>
          </tr>
          {Object.entries(downlinkCableGroups).map(([cableSpeed, info]) => (
            <tr key={cableSpeed}>
              <td><strong>Downlink Cables</strong></td>
              <td>{info.totalCables}</td>
              <td>{info.portSpeed}G → {info.splitFactor}× {info.endpointSpeed}</td>
              <td>{info.splitFactor}×</td>
              <td>{info.endpointSpeed}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginBottom: '8px' }}>
        <strong>Total Endpoints:</strong> {totalEndpoints}
      </div>
      {data.totalEndpointsBySpeed && (
        <div style={{ marginBottom: '12px' }}>
          {Object.entries(data.totalEndpointsBySpeed).map(([speed, count]) => (
            <div key={speed}>{count} × {speed}</div>
          ))}
        </div>
      )}

      {perLeaf.length > 0 && (
        <div>
          <h3>Per-Leaf Endpoint Distribution</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Leaf</th>
                <th>Total Endpoints</th>
                <th>Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {perLeaf.map((leaf, i) => (
                <tr key={i}>
                  <td>L{i + 1}</td>
                  <td>{leaf.endpointCount || 0}</td>
                  <td>{renderEndpointBreakdown(leaf.endpointCounts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ResultsTable;
