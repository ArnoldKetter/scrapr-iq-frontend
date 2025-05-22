import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Button } from '@mui/material';

// Get the FastAPI URL from environment variables
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL;

export default function Home() {
  const [apiStatus, setApiStatus] = useState('Loading...');
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState(null);

  const checkApiHealth = async () => {
    setApiStatus('Checking...');
    setError(null);
    try {
      // Use the environment variable for the API endpoint
      const response = await fetch(`${FASTAPI_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApiStatus(`API Status: ${data.status} (DB Connected: ${data.db_connected})`);
      setApiConnected(true);
    } catch (err) {
      setError(`Failed to connect to FastAPI backend: ${err.message}. Check console for details.`);
      setApiStatus('Disconnected');
      setApiConnected(false);
      console.error("FastAPI Health Check Error:", err);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []); // Run once on component mount

  return (
    <Container maxWidth="md">
      <Head>
        <title>ScraprIQ Dashboard</title>
        <meta name="description" content="ScraprIQ Lead Scraper Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to ScraprIQ Dashboard!
        </Typography>

        <Box sx={{ my: 2, p: 2, border: '1px solid #ccc', borderRadius: '8px', width: '100%', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
                FastAPI Backend Status:
            </Typography>
            {apiStatus === 'Checking...' ? (
                <CircularProgress size={24} />
            ) : (
                <Typography variant="body1" color={apiConnected ? 'success.main' : 'error.main'}>
                    {apiStatus}
                </Typography>
            )}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            <Button 
                variant="contained" 
                sx={{ mt: 2 }} 
                onClick={checkApiHealth}
                disabled={apiStatus === 'Checking...'}
            >
                Retry Connection
            </Button>
        </Box>

        <Typography variant="body1" sx={{ mt: 2 }}>
          This is the beginning of your Vercel-like dashboard for ScraprIQ.
          Your FastAPI backend is running on Render.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Remember to configure CORS on your FastAPI backend to allow requests from your Vercel frontend.
        </Typography>
      </Box>
    </Container>
  );
}
