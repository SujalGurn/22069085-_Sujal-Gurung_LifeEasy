// components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
    state = { hasError: false };
 
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
 
    componentDidCatch(error, info) {
        console.error("Error Boundary:", error, info);
    }
 
    render() {
        if (this.state.hasError) {
            return <h2>Error loading doctor details</h2>;
        }
        return this.props.children;
    }
}