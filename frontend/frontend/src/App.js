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

  const updateVolume = async (index, volume) => {
    const newCartItems = [...cartItems];
    const newVolume = parseInt(volume, 10) || 0;

    if (newVolume > 0) {
      try {
        const response = await fetch('http://localhost:4000/api/get-unit-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ partNumber: newCartItems[index].partNumber, volume: newVolume , dataProvider: newCartItems[index].dataProvider }),
        });

        const { unitPrice } = await response.json();

        newCartItems[index] = {
          ...newCartItems[index],
          volume: newVolume,
          unitPrice: unitPrice ? unitPrice : 0,
          totalPrice: (newVolume * unitPrice),
        };

        setCartItems(newCartItems);
      } catch (error) {
        console.error('Error fetching new unit price:', error);
      }
    } else {
      // Handle invalid volume (e.g., negative or zero)
    }
  };

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
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