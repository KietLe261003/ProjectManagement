import { FrappeProvider } from 'frappe-react-sdk'
import { ThemeProvider } from 'next-themes'
import { Layout } from './components/Layout/Layout'
import { AuthWrapper } from './components/AuthWrapper'
import { Toaster } from './components/ui/sonner'
import './App.css';

function App() {
	return (
		<FrappeProvider
			siteName={import.meta.env.VITE_SITE_NAME || 'frontend'}
			socketPort={import.meta.env.VITE_SOCKET_PORT || 9000}
			// siteName={import.meta.env.VITE_SITE_NAME || 'react.test'}
			// socketPort={import.meta.env.VITE_SOCKET_PORT || 9007}
		>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<AuthWrapper checkInterval={5} showNotifications={true}>
					<Layout />
				</AuthWrapper>
				<Toaster />
			</ThemeProvider>
		</FrappeProvider>
	)
}

export default App
