import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { WorkPage } from './pages/WorkPage';

export function App() {
  return <Routes><Route element={<AppShell />}><Route path="/work" element={<WorkPage />} /><Route path="*" element={<Navigate to="/work" replace />} /></Route></Routes>;
}
