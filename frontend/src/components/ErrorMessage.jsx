import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, className = '' }) => (
  <div className={`error-message ${className}`}>
    <AlertTriangle size={20} />
    <span>{message}</span>
  </div>
);

export default ErrorMessage;