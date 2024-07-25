import React, { useState } from 'react';
import SearchForm from './Component/SearchForm';
import ResultsTable from './Component/ResultsTable';
import Cart from './Component/Cart';
import Navbar from './Component/Navbar';
import './Component/styles.css';
import Modal from './Component/Modal';
const App = () => {
  const [results, setResults] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);

  const handleSearch = async (partNumber, volume) => {
    const response = await fetch('http://localhost:4000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ partNumber, volume }),
    });
    const data = await response.json();
    setResults(data);
  };

  const addToCart = (item) => {
    setCartItems([...cartItems, item]);
  };

  const updateVolume = (index, volume) => {
    const newCartItems = [...cartItems];
    newCartItems[index].volume = parseInt(volume, 10);
    newCartItems[index].totalPrice = newCartItems[index].unitPrice * newCartItems[index].volume;
    setCartItems(newCartItems);
  };

  const removeFromCart = (index) => {
    const newCartItems = cartItems.filter((_, i) => i !== index);
    setCartItems(newCartItems);
  };

  const toggleCart = () => {
    setCartVisible(!cartVisible);
  };

  return (
    <div>
      <Navbar toggleCart={toggleCart} />
      <SearchForm onSearch={handleSearch} />
      <ResultsTable results={results} addToCart={addToCart} />
      <Modal isOpen={cartVisible} onClose={toggleCart}>
        <Cart
          cartItems={cartItems}
          updateVolume={updateVolume}
          removeFromCart={removeFromCart}
        />
      </Modal>
    </div>
  );
};

export default App;
