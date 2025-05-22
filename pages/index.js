
import Head from 'next/head';
import { useEffect, useState } from 'react';
import {
  Container, Typography, Box, CircularProgress,
  Alert, Button, TextField, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';


// Get the FastAPI URL from environment variables
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL;

export default function Home() {
  const [apiStatus, setApiStatus] = useState('Loading...');
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState(null);

  // New states for scraping functionality
  const [targetUrl, setTargetUrl] = useState('');
  const [scrapedLeads, setScrapedLeads] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);

  const checkApiHealth = async () => {
    setApiStatus('Checking...');
    setError(null);
    try {
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

  // Function to handle scraping
  const handleScrape = async () => {
    if (!targetUrl.trim()) {
      setScrapeError("Please enter a URL to scrape.");
      return;
    }

    setIsScraping(true);
    setScrapedLeads([]); // Clear previous results
    setScrapeError(null); // Clear previous errors

    try {
      const response = await fetch(`${FASTAPI_URL}/scrapr-iq/?target_url=${encodeURIComponent(targetUrl)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setScrapedLeads(data);
      if (Array.isArray(data) && data.length === 0) {
        setScrapeError("No leads found on the provided page, or all leads were duplicates.");
      }
    } catch (err) {
      setScrapeError(`Scraping failed: ${err.message}`);
      console.error("Scraping Error:", err);
    } finally {
      setIsScraping(false);
    }
  };

  // Function to clear results
  const handleClear = () => {
    setTargetUrl('');
    setScrapedLeads([]);
    setScrapeError(null);
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <Container maxWidth="md">
      <Head>
        <title>ScraprIQ Dashboard</title>
        <meta name="description" content="ScraprIQ Lead Scraper Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ScraprIQ Dashboard
        </Typography>

        {/* FastAPI Backend Status Section */}
        <Paper elevation={3} sx={{ my: 2, p: 2, width: '100%', textAlign: 'center' }}>
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
                Retry Backend Connection
            </Button>
        </Paper>

        {/* Scrape Input Section */}
        <Paper elevation={3} sx={{ my: 4, p: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Scrape Company Leads
          </Typography>
          <TextField
            label="Company Team/About Us Page URL"
            variant="outlined"
            fullWidth
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="e.g., https://www.scrapingbee.com/team/"
            disabled={isScraping || !apiConnected}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleScrape}
              disabled={isScraping || !apiConnected || !targetUrl.trim()}
              fullWidth
            >
              {isScraping ? <CircularProgress size={24} color="inherit" /> : 'Scrape Leads'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClear}
              disabled={isScraping || (!targetUrl.trim() && scrapedLeads.length === 0 && !scrapeError)}
              fullWidth
            >
              Clear
            </Button>
          </Box>
          {scrapeError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {scrapeError}
            </Alert>
          )}
        </Paper>

        {/* Scrape Results Section */}
        <Box sx={{ my: 4, width: '100%' }}>
            {scrapedLeads.length > 0 && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Scraped Leads ({scrapedLeads.length})
                    </Typography>
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="scraped leads table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Job Title</TableCell>
                                    <TableCell>Company</TableCell>
                                    <TableCell>Inferred Email</TableCell>
                                    <TableCell>Verified Status</TableCell>
                                    <TableCell>Verification Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {scrapedLeads.map((lead) => (
                                    <TableRow
                                        key={lead.id || lead.inferred_email}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">{lead.name}</TableCell>
                                        <TableCell>{lead.job_title}</TableCell>
                                        <TableCell>{lead.company}</TableCell>
                                        <TableCell>{lead.inferred_email}</TableCell>
                                        <TableCell>{lead.verified_status}</TableCell>
                                        <TableCell>{lead.verification_details}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>

      </Box>
    </Container>
  );
}
