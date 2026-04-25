import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SubmitProposalPage from './pages/SubmitProposalPage';
import ReviewDataPage from './pages/ReviewDataPage';
import HistoryPage from './pages/HistoryPage';
import MarkdownViewerPage from './pages/MarkdownViewerPage';

// Create a router with future flags to address the warnings
const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'submit',
          element: <SubmitProposalPage />,
        },
        {
          path: 'review',
          element: <ReviewDataPage />,
        },
        {
          path: 'history',
          element: <HistoryPage />,
        },
        {
          path: 'markdown-viewer',
          element: <MarkdownViewerPage />,
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
