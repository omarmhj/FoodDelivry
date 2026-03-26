# Medical Exam Platform - Simple Summary

## 🎯 What We're Building

A platform where medical students practice exam questions organized by specialty and topic, with AI-generated exercises and course references.

---

## 📊 Core Structure

```
Specialty (e.g., Néphrologie)
  └─ Topic (e.g., Hématuries)
      ├─ Series (Exercise sets)
      │   ├─ Historical (Sousse 2025, Monastir 2024...)
      │   └─ AI-Generated (Progressive learning)
      └─ Courses (Learning materials)
```

---

## 🗄️ Database Tables

### **Main Tables**

```sql
-- Content hierarchy
specialties (id, name)
topics (id, specialty_id, name)
series (id, topic_id, title, type, university, year)

-- Questions
questions (id, series_id, text, explanation, course_references)
answers (id, question_id, text, is_correct)

-- Courses
courses (id, topic_id, title, content, version)

-- User activity
users (id, email, name, university, subscription_tier)
attempts (id, user_id, series_id, score, answers, completed_at)

-- AI generation
batch_jobs (id, topic_id, status, created_at)
```

---

## 🤖 How AI Works

### **Batch Generation (Not Real-Time)**

1. Admin clicks "Generate series for Hématuries"
2. System fetches courses for that topic
3. AI generates 30 questions with explanations
4. Each explanation includes course references
5. Stored in database for all users

### **Course References**

```json
{
  "question_id": "q123",
  "explanation": "L'hématurie macroscopique est visible...",
  "course_references": [
    {
      "course_id": "c456",
      "section": "Classification",
      "page": 2
    }
  ]
}
```

---

## 📱 User Flow

1. **Browse**: Specialty → Topic → Series
2. **Take Series**: Answer 30 questions
3. **View Results**: See score and mistakes
4. **Learn**: Click course references to study

---

## 🔄 Course Updates

When admin updates a course:
1. System marks related series as outdated
2. Batch job regenerates them overnight
3. New content replaces old

---

## 🏗️ Tech Stack

- **Backend**: NestJS + PostgreSQL
- **Courses**: MongoDB (flexible content)
- **AI**: OpenAI GPT-4
- **Search**: Pinecone (vector embeddings)
- **Queue**: RabbitMQ (batch jobs)
- **Frontend**: Next.js

---

## 🎯 MVP Features

1. ✅ Browse specialties/topics/series
2. ✅ Take series and get scored
3. ✅ View explanations with course links
4. ✅ Admin: Upload courses
5. ✅ Admin: Trigger AI generation

---

## 💰 Business Model

- **Free**: 5 series/month
- **Premium** (25 TND/month): Unlimited + AI series + courses
- **Target**: 1,000 paying users = 25,000 TND/month

---

That's it! Simple, focused, and achievable. 🚀
