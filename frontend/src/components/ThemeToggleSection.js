import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggleSection = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="card" style={{
      backgroundColor: isDarkMode ? '#374151' : 'white',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginBottom: '1rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
      transition: 'background-color 150ms, color 150ms'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '1rem'
      }}>
        Appearance
      </h2>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <p style={{
            fontWeight: '500',
            marginBottom: '0.25rem'
          }}>
            Dark Mode
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            Toggle between light and dark theme
          </p>
        </div>

        <button
          onClick={toggleTheme}
          style={{
            position: 'relative',
            width: '3.5rem',
            height: '2rem',
            borderRadius: '999px',
            backgroundColor: isDarkMode ? '#3b82f6' : '#e5e7eb',
            transition: 'background-color 150ms',
            cursor: 'pointer',
            border: 'none',
            padding: 0
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0.25rem',
              left: isDarkMode ? 'calc(100% - 1.75rem)' : '0.25rem',
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              backgroundColor: 'white',
              transition: 'left 150ms',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          />
          
          {/* Icons */}
          <div style={{
            position: 'absolute',
            top: '0.4rem',
            left: '0.4rem',
            fontSize: '0.75rem',
            opacity: isDarkMode ? 0 : 0.8
          }}>
            ☀️
          </div>
          <div style={{
            position: 'absolute',
            top: '0.4rem',
            right: '0.4rem',
            fontSize: '0.75rem',
            opacity: isDarkMode ? 0.8 : 0
          }}>
            🌙
          </div>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggleSection;