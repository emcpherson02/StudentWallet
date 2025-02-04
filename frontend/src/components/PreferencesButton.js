import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const PreferencesButton = ({ userData }) => {
  const navigate = useNavigate();

  // Generate initials from user's name
  const initials = useMemo(() => {
    if (!userData?.name) return '??';
    return userData.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [userData?.name]);

  // Generate a consistent background color based on the initials
  const backgroundColor = useMemo(() => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    const index = (initials.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }, [initials]);

  const handleClick = () => {
    navigate('/preferences');
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed top-4 right-4 z-50 w-12 h-12 rounded-full ${backgroundColor} 
        hover:opacity-90 text-white flex items-center justify-center shadow-lg 
        transition-all duration-300 font-semibold text-lg
        hover:scale-105 active:scale-95`}
      aria-label="Go to profile settings"
    >
      {initials}
    </button>
  );
};

export default PreferencesButton;