import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";
import config from "../config/complaintConfig.js";

const departmentIds = config.departments.map((d) => d.id);

// Public shape of a user account (register, login)
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    department: user.department,
});

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, userType = "Student", department = null } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (!config.userTypes.includes(userType)) {
            return res.status(400).json({
                success: false,
                message: `userType must be one of: ${config.userTypes.join(", ")}`,
            });
        }

        if (department !== null && !departmentIds.includes(department)) {
            return res.status(400).json({
                success: false,
                message: "Invalid department",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            userType,
            department,
        });

        const token = generateToken(user._id, "user");

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: publicUser(user),
        });

    } catch (error) {
    console.error("Register user error:", error);

    res.status(500).json({
        success: false,
        message: error.message
    });
}
};


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = generateToken(user._id, "user");

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: publicUser(user),
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = generateToken(admin._id, "admin");

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: "Admin already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword
        });

        const token = generateToken(admin._id, "admin");

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Register admin error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to register admin"
        });
    }
};