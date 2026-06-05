import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import TopSeinenPage from './pages/TopSeinenPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={
            <PrivateRoute><SearchPage /></PrivateRoute>
          } />
          <Route path="/top-seinen" element={
            <PrivateRoute><TopSeinenPage /></PrivateRoute>
          } />
          <Route path="/media/:id" element={
            <PrivateRoute><DetailPage /></PrivateRoute>
          } />
          <Route path="/list" element={
            <PrivateRoute><ListPage /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/top-seinen" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
