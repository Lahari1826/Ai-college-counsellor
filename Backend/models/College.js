import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courses: [{ type: String }],
  avgGPA: { type: Number },
  fees: { type: Number },
  location: { type: String },
  deadlines: [{ type: String }]
}, { timestamps: true });

export default mongoose.model("College", collegeSchema);
