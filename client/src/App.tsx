import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import ForgetPassword from './pages/auth/forget-password';
import ResetPassword from './pages/auth/reset-password';
import VendorHome from './pages/vendor/VendorHome';
import CustomerHome from './pages/customer/CustomerHome';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forget-password" element={<ForgetPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/vendor/home" element={<VendorHome />} />
                <Route path="/customer/home" element={<CustomerHome />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

