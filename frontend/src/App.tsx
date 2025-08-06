import { Dashboard } from './components/Dashboard'
import { FrappeProvider } from 'frappe-react-sdk'
import './App.css';
function App() {
	return (
		<FrappeProvider
			siteName={import.meta.env.VITE_SITE_NAME || 'react.custom'}
			socketPort={import.meta.env.VITE_SOCKET_PORT || 9000}
		>
			<Dashboard />
		</FrappeProvider>
	)
}

export default App
