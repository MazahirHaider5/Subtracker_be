"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/success', (req, res) => {
    // Flutter custom scheme URL
    res.redirect('myapp://success');
});
router.get('/cancel', (req, res) => {
    res.redirect('myapp://cancel');
});
exports.default = router;
