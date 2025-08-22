import { FrappeProvider } from 'frappe-react-sdk'
import { ThemeProvider } from 'next-themes'
import { Layout } from './components/Layout/Layout'
import './App.css';

function App() {
	return (
		<FrappeProvider
			siteName={import.meta.env.VITE_SITE_NAME || 'frontend'}
			socketPort={import.meta.env.VITE_SOCKET_PORT || 9000}
		>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<Layout />
			</ThemeProvider>
		</FrappeProvider>
	)
}

export default App
