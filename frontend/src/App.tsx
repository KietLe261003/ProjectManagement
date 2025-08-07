import { FrappeProvider } from 'frappe-react-sdk'
import { Layout } from './components/Layout/Layout'
import './App.css';

function App() {
	return (
		<FrappeProvider
			siteName={import.meta.env.VITE_SITE_NAME || 'react.custom'}
			socketPort={import.meta.env.VITE_SOCKET_PORT || 9000}
		>
			<Layout />
		</FrappeProvider>
	)
}

export default App
