import React, { memo } from "react";

const LoadingIndicator = memo(({ label }) => (
  <div className="loading-indicator">
    <div className="spinner"></div>
    <p>⏳ Loading {label}...</p>
  </div>
));

export default LoadingIndicator;
