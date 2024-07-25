import React from 'react';

const ResultsTable = ({ results, addToCart }) => (
  <table>
    <thead>
      <tr>
        <th>Part Number</th>
        <th>Manufacturer</th>
        <th>Data Provider</th>
        <th>Volume</th>
        <th>Unit Price (INR)</th>
        <th>Total Price (INR)</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {results.map((result, index) => (
        <tr key={index}>
          <td>{result.partNumber}</td>
          <td>{result.manufacturer}</td>
          <td>{result.dataProvider}</td>
          <td>{result.volume}</td>
          <td>{result.unitPrice}</td>
          <td>{result.totalPrice}</td>
          <td><button onClick={() => addToCart(result)}>Add to Cart</button></td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default ResultsTable;
