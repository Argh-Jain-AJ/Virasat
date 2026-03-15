import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';

describe('Frontend Component Tests', () => {

  test('renders Login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  test('renders Register form correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  test('renders Dashboard initial text', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    // Since we fetch silently, we can at least assert the dashboard skeleton
    expect(screen.getByText(/Family Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Family/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Family Context/i)).toBeInTheDocument();
  });

});
