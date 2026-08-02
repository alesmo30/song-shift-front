import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Signup } from './pages/Signup/Signup';
import { Landing } from './pages/Landing/Landing';
import { NotFound } from './pages/NotFound/NotFound';
import { PrivateRoutes } from './route-protection/PrivateRoutes';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Landing />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
