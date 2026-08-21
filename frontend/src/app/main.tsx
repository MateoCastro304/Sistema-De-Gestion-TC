import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//TODO: cuando se mergee la rama de estilos, importar aca la hoja global:
// import '@/styles/styles.css'
import App from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
