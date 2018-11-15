import Loadable from 'react-loadable';
import Loading from './page/Loading/Loading';

const App = Loadable({
    loader: () => import('./page/Base'),
    loading: Loading,
});

export default App;