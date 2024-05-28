import mongoose from "mongoose";
import Message from "./Message.js";

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    messages: {
        type: [Message.modelName],
        required: true
    }
    
});

const Room = mongoose.model("Room", RoomSchema);

export default Room;