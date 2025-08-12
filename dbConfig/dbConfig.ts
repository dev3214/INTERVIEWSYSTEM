import mongoose from "mongoose";

export async function connect (){
    try{
        mongoose.connect(process.env.MONGO_URI!);
        const connection = mongoose.connection;
        connection.on("connected", () => {
            
        });
        connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
            process.exit();
        });
    }
    catch(error){
        console.error("Database connection error:", error);
    }
}