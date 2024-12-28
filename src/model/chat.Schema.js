const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const chatSchema = mongoose.Schema({
  message: { type: String },
  userType: { type: [String], enum: ["driver", "user"]},
  isRead: { type: Boolean ,  default: false},
  userId: { type: Number },
  driverId: { type: Number },
  profile_pic:{type:String},
  name:{type:String},
  bookingId:{type:Number},
  isActive:{type: Boolean ,  default: false},
  deviceId:{type:String},
  image:{type:String},
  voice:{type:String}
});

chatSchema.plugin(timestamps);
module.exports = mongoose.model("Chat", chatSchema);