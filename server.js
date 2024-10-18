const express = require('express');
const path = require('path');
const app = express();

// Menggunakan folder 'public' untuk file statis
app.use(express.static(path.join(__dirname, 'public')));

// Melayani index.html di root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Untuk pengembangan lokal
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// Ekspor app untuk Vercel
module.exports = app;