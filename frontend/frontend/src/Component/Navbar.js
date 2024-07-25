import React from 'react';

const Navbar = ({ toggleCart }) => (
  <nav>
    <button style={{ width: '10%' }} onClick={toggleCart}>Toggle Cart</button>
  </nav>
);

export default Navbar;

