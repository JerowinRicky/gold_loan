import multer from 'multer';
import path from 'path';
import fs from 'fs';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.resolve(process.cwd(), 'uploads');
        if (file.fieldname === 'goldImages' || file.fieldname === 'image') {
            uploadPath = path.join(uploadPath, 'gold');
        }
        else if (file.fieldname === 'screenshot') {
            uploadPath = path.join(uploadPath, 'payments');
        }
        else {
            uploadPath = path.join(uploadPath, 'documents');
        }
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, PNG, WEBP and PDF files are allowed'));
    },
});
