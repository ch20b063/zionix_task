
import React from 'react';

const Cart = ({ cartItems, updateVolume, removeFromCart }) => (
  <div className="cart">
    <h2>My Cart</h2>
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
        {cartItems.map((item, index) => (
          <tr key={index}>
            <td>{item.partNumber}</td>
            <td>{item.manufacturer}</td>
            <td>{item.dataProvider}</td>
            <td>
              <input
                type="number"
                value={item.volume}
                onChange={(e) => updateVolume(index, e.target.value)}
              />
            </td>
            <td>{item.unitPrice}</td>
            <td>{item.totalPrice}</td>
            <td>
              <button onClick={() => removeFromCart(index)}>Remove</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Cart;
