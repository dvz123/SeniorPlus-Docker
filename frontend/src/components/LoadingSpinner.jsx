import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 24, className = '' }) => (
  <div className={`loading-spinner-container ${className}`}>
    <Loader2 size={size} className="loading-spinner" />
  </div>
);

export default LoadingSpinner;