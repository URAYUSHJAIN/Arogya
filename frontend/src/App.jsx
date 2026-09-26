import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { WorkspaceProvider } from './context/WorkspaceContext';

function App() {
  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </WorkspaceProvider>
  );
}

export default App;
