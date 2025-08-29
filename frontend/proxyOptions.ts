const common_site_config = require('../../../sites/common_site_config.json');
const { webserver_port } = common_site_config;

export default {
	'^/(app|api|assets|files|private)': {
		target: `http://127.0.0.1:${webserver_port}`,
		ws: true,
		router: function(req) {
			const site_name = req.headers.host.split(':')[0];
			
			// Determine protocol based on request headers and hostname
			const isHttps = 
				req.headers['x-forwarded-proto'] === 'https' ||
				req.headers['x-forwarded-ssl'] === 'on' ||
				req.headers.host.includes('rdm.ctuav.vn');
			
			const protocol = isHttps ? 'https' : 'http';
			
			// For HTTPS, use standard port 443 (no port needed)
			// For HTTP, use the configured webserver_port
			const port = protocol === 'https' ? '' : `:${webserver_port}`;
			
			return `${protocol}://${site_name}${port}`;
		}
	}
};
