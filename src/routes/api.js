const express = require("express");
const { registration, verifyEmailCode, login, verifyLoginEmailCode, enableGoogleAuthenticator, verifyGoogleAuthenticator2FA } = require("../controllers/userController");
const router = express.Router();

router.post("/registration", registration);
router.post("/verifyEmailCode", verifyEmailCode);
router.post("/login", login);
router.post("/verifyLoginEmailCode", verifyLoginEmailCode);
router.post("/enableGoogleAuthenticator", enableGoogleAuthenticator);
router.post("/verifyGoogleAuthenticator2FA", verifyGoogleAuthenticator2FA)








module.exports = router;