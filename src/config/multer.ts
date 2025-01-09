import multer from "multer";
import path from "path";

//multer for storing file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        const filename = Date.now() + fileExtension; 
        cb(null, filename);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = ["image/jpeg","image/png","application/pdf"];
    if(allowedTypes.includes(file.mimetype)) {
        cb(null,true);
    } else {
        cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."),false);
    }
};

const uploadImageOnly = multer({
    storage,
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedImageTypes = ["image/jpeg", "image/png"];
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true); // Accept only image files (JPG, PNG)
      } else {
        cb(new Error("Invalid file type. Only JPG and PNG images are allowed."), false); // Reject other files
      }
    }
  });



const upload = multer ({storage, fileFilter});

export {upload, uploadImageOnly};