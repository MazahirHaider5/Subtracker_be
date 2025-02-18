"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageOnly = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
//multer for storing file
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const fileExtension = path_1.default.extname(file.originalname);
        const filename = Date.now() + fileExtension;
        cb(null, filename);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."), false);
    }
};
const uploadImageOnly = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedImageTypes = ["image/jpeg", "image/png"];
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true); // Accept only image files (JPG, PNG)
        }
        else {
            cb(new Error("Invalid file type. Only JPG and PNG images are allowed."), false); // Reject other files
        }
    }
});
exports.uploadImageOnly = uploadImageOnly;
const upload = (0, multer_1.default)({ storage, fileFilter });
exports.upload = upload;
