import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import ServerErrorNotice from './components/ServerErrorNotice'
import './index.css'
import './themes.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <ServerErrorNotice />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              border: '1px solid var(--theme-line)',
              background: 'var(--theme-surface)',
              borderRadius: 12,
              fontSize: 13,
              color: 'var(--theme-text)',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>,
)
