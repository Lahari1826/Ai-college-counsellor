const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college-counselor';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User schema + model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    gpa: { type: Number, default: 0 },
    interests: [{ type: String }]
  },
  chatHistory: [
    {
      question: { type: String },
      answer: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Health / live
app.get('/', (req, res) => {
  res.json({ message: '🚀 AI College Counselor Backend ALIVE ✅' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Profile registration
app.post('/api/register', async (req, res) => {
  console.log('📝 PROFILE RECEIVED:', req.body);
  const { username, email, password, gpa, interests } = req.body;

  const interestsArray = typeof interests === 'string'
    ? interests.split(',').map(item => item.trim()).filter(Boolean)
    : Array.isArray(interests)
      ? interests
      : [];

  try {
    const user = await User.findOneAndUpdate(
      { email },
      {
        username,
        email,
        password,
        profile: { gpa, interests: interestsArray }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('✅ SAVED TO DATABASE:', { username, email, gpa, interests: interestsArray });

    res.json({
      success: true,
      userId: user._id,
      message: 'Profile saved successfully!',
      profile: { gpa, interests: interestsArray }
    });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ success: false, message: 'Could not save profile', error: error.message });
  }
});

// Chat route
app.post('/api/chat', async (req, res) => {
  console.log('💬 CHAT REQUEST:', req.body);
  const { userId, message, gpa, interests } = req.body;

  const normalizedMessage = (message || '').toLowerCase();
  let answer = `Based on interests ${interests} and GPA ${gpa}, I suggest exploring colleges with strong AI/CS faculties.`;

  if (normalizedMessage.includes('cs')) {
    answer = `For GPA ${gpa} and interests in ${interests}, consider top CS programs such as IITs, NITs, and BITS.`;
  } else if (normalizedMessage.includes('ai')) {
    answer = `For your AI interest, look at institutes with strong AI labs and research such as IIT Madras, IISc, and IIIT Hyderabad.`;
  } else if (normalizedMessage.includes('gpa') || normalizedMessage.includes('score')) {
    answer = `Your GPA is ${gpa}. With this profile you can target many strong AI/CS programs; aim for colleges in Tier 1 and Tier 2.`;
  } else if (normalizedMessage.includes('fee') || normalizedMessage.includes('cost') || normalizedMessage.includes('tuition')) {
    answer = `Fee ranges vary widely: public institutes ~₹1-3 LPA, private top-tier ~₹5-12 LPA. Scholarships can reduce this significantly.`;
  } else if (normalizedMessage.includes('admission') || normalizedMessage.includes('eligibility') || normalizedMessage.includes('requirements')) {
    answer = `Most top colleges use national entrance exams (JEE Main/Advanced, GATE, or state CET) plus profile-based shortlisting. Maintain strong academics and projects.`;
  } else if (normalizedMessage.includes('placements') || normalizedMessage.includes('jobs') || normalizedMessage.includes('internship')) {
    answer = `Top AI/CS colleges generally have >85% placement rates and average CTC 15-30 LPA; internships are available with top tech firms.`;
  }

  try {
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $push: { chatHistory: { question: message, answer } }
      });
    }
    res.json({ message: answer });
  } catch (error) {
    console.error('chat save error:', error);
    res.status(500).json({ message: answer, error: 'Failed to save chat in DB.' });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('✅ Ready to receive profiles from frontend');
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill existing process and retry.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});