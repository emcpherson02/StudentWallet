const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, StudentWallet Backend!');
});

app.listen(port, () => {
    console.log(`Backend server is running on port ${port}`);
});
