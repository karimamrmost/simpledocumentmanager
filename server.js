const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');


const app = express();
const upload = multer({ dest: 'uploads/' });
app.use('/Image', express.static(path.join(__dirname, 'Image')));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());




const users = {
    admin: { password: bcrypt.hashSync('M@rc0gypt2022', 10), role: 'admin' },
    owner: { password: bcrypt.hashSync('ownerpassword', 10), role: 'owner' },
    IT: { password: bcrypt.hashSync('itpassword', 10), role: 'IT' },
    HR: { password: bcrypt.hashSync('M.A', 10), role: 'HR' },
    Finance: { password: bcrypt.hashSync('acc', 10), role: 'Finance' },
    Commercial: { password: bcrypt.hashSync('commercialpassword', 10), role: 'Commercial' },
    Warehouse: { password: bcrypt.hashSync('warehousepassword', 10), role: 'Warehouse' }
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (user && bcrypt.compareSync(password, user.password)) {
        res.json({ success: true, role: user.role });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/files/:directory/:subdirectory', (req, res) => {
    const { directory, subdirectory } = req.params;
    const dirPath = path.join(__dirname, 'uploads', directory, subdirectory);

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Unable to read files' });
        }
        const fileDetails = files.map(file => ({
            name: file,
            uploadDate: fs.statSync(path.join(dirPath, file)).mtime
        }));
        res.json(fileDetails);
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    const { directory, subdirectory } = req.body;
    const dirPath = path.join(__dirname, 'uploads', directory, subdirectory);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, req.file.originalname);
    fs.rename(req.file.path, filePath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'File upload failed' });
        }
        res.json({ success: true });
    });
});

app.delete('/delete/:directory/:subdirectory/:filename', (req, res) => {
    const { directory, subdirectory, filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', directory, subdirectory, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'File deletion failed' });
        }
        res.json({ success: true });
    });
});

app.listen(4000, () => {
    console.log('Server started on http://localhost:4000');
});


