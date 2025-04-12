import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import { HashRouter, Route, Routes } from 'react-router';
import App from './App';
import Settings from './Settings';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
// root.render(<Settings />);
root.render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <HashRouter>
      <Routes>
        <Route path="/" Component={App} />
        <Route path="/settings" Component={Settings} />
      </Routes>
    </HashRouter>
  </ThemeProvider>,
);

// calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
