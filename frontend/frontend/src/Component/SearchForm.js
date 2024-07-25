import React, { useState } from 'react';

const SearchForm = ({ onSearch }) => {
  const [partNumber, setPartNumber] = useState('');
  const [volume, setVolume] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(partNumber, volume);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Part Number:
        <input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} required />
      </label>
      <label>
        Volume:
        <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} required />
      </label>
      <button style={{ width: '10%' }} type="submit">Enter</button>
    </form>
  );
};

export default SearchForm;
