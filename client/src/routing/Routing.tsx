import { createBrowserRouter } from 'react-router-dom';
import LayoutApp from '../layouts/LayoutApp';
const appRouter = createBrowserRouter([
    {
        path: "/",
        element: (<LayoutApp/>),
        children: [
           
        ]
    }
]);
export default appRouter;