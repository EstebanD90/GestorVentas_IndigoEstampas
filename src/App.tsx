import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import Calculators from './pages/Calculators';
import Backup from './pages/Backup';
import PriceList from './pages/PriceList';
import Expenses from './pages/Expenses';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="price-list" element={<PriceList />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="clients" element={<Clients />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="sales" element={<Sales />} />
          <Route path="calculators" element={<Calculators />} />
          <Route path="backup" element={<Backup />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
