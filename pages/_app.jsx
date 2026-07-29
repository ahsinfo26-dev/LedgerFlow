import dynamic from 'next/dynamic'; import '../src/index.css';

const App = dynamic(() => import('../src/App'), { ssr: false });

export default function MyApp({ Component, pageProps }) { // App contains your BrowserRouter and all routes, so we just mount it client-side return <App {...pageProps} />; }
