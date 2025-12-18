import { RouterProvider } from 'react-router-dom';
import './App.css';
import appRouter from './routing/Routing';

function App() {
  return (
    <>
      <RouterProvider router={appRouter} />

    </>
  );
}

export default App;
