// src/components/SearchableDropdown.js
import React, { useState, useEffect, useRef } from 'react';

const SearchableDropdown = ({ options, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Efeito para fechar o dropdown se o usuário clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      <button type="button" className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
        {placeholder || 'Selecione...'}
      </button>

      {isOpen && (
        <div className="dropdown-panel">
          <input
            type="text"
            className="dropdown-search"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <ul className="dropdown-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li key={option.id} onClick={() => handleSelect(option)}>
                  {option.label}
                </li>
              ))
            ) : (
              <li className="dropdown-no-results">Nenhum resultado encontrado.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;