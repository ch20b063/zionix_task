
import React from 'react';
import './styles.css';

const Modal = ({ children, isOpen, onClose }) => (
  <div className={`modal ${isOpen ? 'open' : ''}`}>
    <div className="modal-content">
      <div className="modal-header">
        <h2>My Cart</h2>
        <button style={{ width: '10%' }} onClick={onClose}>Close</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export default Modal;
