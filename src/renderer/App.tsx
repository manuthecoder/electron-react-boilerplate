import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.css';

function Hello() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        ['WebkitAppRegion' as any]: 'drag',
        padding: 20,
        textAlign: 'center',
      }}
    >
      <h1>Manu's setup</h1>
      <p>
        Keep this window open to open commication with the Raspberry Pi server
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
