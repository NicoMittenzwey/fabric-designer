import React from 'react';

function ResultsTable({ data }) {
  return (
    <div>
      <h2>Results</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Model</th>
            <th>Ports</th>
            <th>Speed</th>
          </tr>
        </thead>
        <tbody>
          {data.switches.map((sw, idx) => (
            <tr key={idx}>
              <td>{sw.model}</td>
              <td>{sw.ports}</td>
              <td>{sw.speed}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Total Endpoints: {data.endpoints}</p>
    </div>
  );
}

export default ResultsTable;
