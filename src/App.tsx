import Home from './pages/Home';
import { Information } from './pages/Information';

/** 정적 HTML 경로와 동일한 화면 선택 */
export default function App() {
  const path = window.location.pathname;
  return path === '/' ? <Home /> : <Information path={path.endsWith('/') ? path : path + '/'} />;
}
