import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import { bootstrapPriorityModel } from "./services/priorityModel.js";

const startServer = async () => {
    await connectDB();

    app.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
    });

    // First run: teach the priority model from complaints already in the database
    bootstrapPriorityModel();
};

startServer();