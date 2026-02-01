import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MenuProvider } from './context/MenuContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Scan from './pages/Scan';
import Menu from './pages/Menu';
import ARView from './pages/ARView';
import './index.css';

function App() {
  return (
    <MenuProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/ar" element={<ARView />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </MenuProvider>
  );
}

export default App;
