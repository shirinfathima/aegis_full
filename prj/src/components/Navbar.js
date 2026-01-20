// src/components/Navbar.js
function Navbar() {
  const user = JSON.parse(localStorage.getItem('user'));
  const role = user?.role?.toUpperCase();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">AegisID</Typography>
        <Box sx={{ flexGrow: 1, ml: 4 }}>
          {role === 'USER' && (
            <>
              <Button color="inherit" href="/upload">Upload Document</Button>
              <Button color="inherit" href="/issued-documents">My Wallet</Button>
            </>
          )}
          {role === 'ISSUER' && (
            <>
              <Button color="inherit" href="/issuer/dashboard">Pending Requests</Button>
              <Button color="inherit" href="/fraud-detection">Security Tools</Button>
            </>
          )}
          {role === 'VERIFIER' && (
            <>
              <Button color="inherit" href="/verifier/document-review">Review Portal</Button>
            </>
          )}
        </Box>
        <Button color="inherit" href="/profile-details">Profile</Button>
      </Toolbar>
    </AppBar>
  );
}