import mongoose from "mongoose"

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    emailDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    domains: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Domain',
      required: true,
    }],
    logo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
)

// Create a compound index for slug uniqueness
collegeSchema.index({ slug: 1 }, { unique: true })

// Create an index for email domain for faster lookups
collegeSchema.index({ emailDomain: 1 })

const College = mongoose.models.College || mongoose.model("College", collegeSchema)

export default College

