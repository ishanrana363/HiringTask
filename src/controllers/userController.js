const userModel = require("../models/userModel");
require("dotenv").config();
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const SendEmailUtility = require("../helper/emailHelper");
const { successResponse, errorResponse } = require("../utility/response");
const key = process.env.SECRET_KEY


exports.registration = async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
        const emailCodeExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
        const text = `Your verification code is: ${emailCode}`

        const user = new userModel({ email, password: hashedPassword, emailCode, emailCodeExpires, isEmailVerified: false, is2FAEnabled: false });
        await user.save();
        await SendEmailUtility(email, text, "Verify your Email",);
        return successResponse(res, 201, "User registration successfully", user);

    } catch (error) {
        return errorResponse(res, 500, "Something went wrong", error)
    }
};

// Verify Email Code

exports.verifyEmailCode = async (req, res) => {
    try {
        const { email, emailCode } = req.body;
        const user = await userModel.findOne({ email, emailCode });
        if (!user || user.emailCodeExpires < Date.now())
            return errorResponse(res, 400, "Invalid or expired code", null)
        user.isEmailVerified = true;
        user.emailCode = null;
        user.emailCodeExpires = null;
        await user.save();
        return successResponse(res, 200, "Email verified successfully", null)
    } catch (error) {
        return errorResponse(res, 500, "Something went wrong", error)
    }
};


// login


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return errorResponse(res, 400, "Invalid credentials", null)
        }
        if (!user.isEmailVerified) {
            return errorResponse(res, 400, "Verify email first", null)
        }
        const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailCode = emailCode;
        user.emailCodeExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
        await user.save();
        await SendEmailUtility(email, `Your login verification code is: ${emailCode}`, "Login Verification Code");
        return successResponse(res, 200, "Check email for verification code", null)
    } catch (error) {
        return errorResponse(res, 500, "Something went wrong", error)
    }
};

// Verify Login Email Code
exports.verifyLoginEmailCode = async (req, res) => {
    try {
        const { email, emailCode } = req.body;
        const user = await userModel.findOne({ email, emailCode });
        if (!user || user.emailCodeExpires < Date.now()) return errorResponse(res, 400, "Invalid or expired code", null);
        const payload = {
            email: user.email,
            password: user.password
        };
        const time = { expiresIn: '12h' }
        const token = jwt.sign(payload,key,time)
        return successResponse(res, 200, "Email verification successfully", token);
    } catch (error) {
        return errorResponse(res, 500, "Something went wrong", error)
    }
};


// Enable Google Authenticator 2FA
exports.enableGoogleAuthenticator = async (req, res) => {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return errorResponse(res, 400, "User not found", null);

    const secret = speakeasy.generateSecret({ name: `MyApp (${email})` });
    user.secret = secret;
    user.is2FAEnabled = true;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {

        return successResponse(res, 200, "Scan QR in Google Authenticator", dataUrl)
    });
};


// Verify Google Authenticator 2FA

exports.verifyGoogleAuthenticator2FA = async (req, res) => {
    const { email, token } = req.body;
    const user = await userModel.findOne({ email });
    if (!user || !user.is2FAEnabled) return res.status(400).json({ message: "2FA not enabled" });

    const verified = speakeasy.totp.verify({
        secret: user.secret.base32,
        encoding: "base32",
        token,
        window: 1,
    });

    if (!verified) return res.status(400).json({ message: "Invalid 2FA code" });

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "2FA verification successful", token: jwtToken });
};