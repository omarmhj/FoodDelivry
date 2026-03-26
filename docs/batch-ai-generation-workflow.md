# Batch AI Generation Workflow

## 🎯 Overview

The system uses **batch processing** (not real-time) to generate AI-powered series and explanations. All generated content is stored in the database and shared across all users.

---

## 📊 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: Course Content Management                                  │
│  - Admin uploads courses (PDF, videos, text)                        │
│  - Courses are organized by Specialty → Topic                       │
│  - Content is stored in MongoDB                                     │
│  - Vector embeddings are generated and stored in Pinecone           │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Batch AI Generation (Triggered Manually or Scheduled)      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Admin triggers: "Generate AI Series for Topic X"          │     │
│  │ Input:                                                     │     │
│  │   - Topic ID: "Hématuries"                                │     │
│  │   - Number of series to generate: 3                       │     │
│  │   - Series types: [PROGRESSIVE, WEAK_AREA, COMPREHENSIVE] │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: AI Processing (Background Job)                             │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ a) Fetch all course content for topic                     │     │
│  │ b) Extract concepts and build learning path                │     │
│  │ c) Generate questions (30-50 per series)                   │     │
│  │ d) Generate explanations with course references            │     │
│  │ e) Link each explanation to specific course sections       │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Store in Database                                          │
│  - Series records (PostgreSQL)                                      │
│  - Questions with multiple course references (PostgreSQL)           │
│  - Explanations linked to course sections (PostgreSQL)              │
│  - All users can now access these series                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: Student Takes Series                                       │
│  - Student completes series                                         │
│  - System shows results: correct/incorrect answers                  │
│  - For wrong answers: Display explanation + course links            │
│  - Student clicks link → Redirected to specific course section      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: Course Update Trigger                                      │
│  - Admin updates course content                                     │
│  - System marks affected series as "needs_regeneration"             │
│  - Batch job re-runs to update series and explanations              │
│  - Updated content replaces old content in database                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Enhanced Database Schema

### **Course Tables**

```sql
-- Courses (MongoDB for flexibility)
{
  "_id": "course_123",
  "specialty_id": "nephrologie",
  "topic_id": "hematuries",
  "title": "Hématuries - Cours Complet",
  "content": {
    "sections": [
      {
        "section_id": "section_1",
        "title": "1. Définition",
        "content": "L'hématurie est définie comme...",
        "page_number": 1,
        "timestamp_start": 0,  // For video courses
        "timestamp_end": 120
      },
      {
        "section_id": "section_2",
        "title": "2. Classification",
        "content": "On distingue deux types...",
        "page_number": 2,
        "timestamp_start": 120,
        "timestamp_end": 300
      }
    ]
  },
  "content_type": "PDF",
  "file_url": "s3://courses/hematuries.pdf",
  "version": 2,
  "last_updated": "2025-01-15T10:00:00Z",
  "embeddings_generated": true
}
```

### **Question-Course Reference Table**

```sql
CREATE TABLE question_course_references (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions(id),
  course_id VARCHAR(255),
  section_id VARCHAR(255),
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  reference_type VARCHAR(50), -- 'EXPLANATION', 'CONTEXT', 'RELATED'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example data:
-- Question: "Quelle est la différence entre hématurie macroscopique et microscopique?"
-- References:
-- 1. course_123, section_2, 0.95, 'EXPLANATION'
-- 2. course_123, section_5, 0.70, 'RELATED'
```

### **Answer Explanation Table**

```sql
CREATE TABLE answer_explanations (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions(id),
  answer_id UUID REFERENCES answers(id),
  explanation_text TEXT NOT NULL,
  is_correct_explanation BOOLEAN, -- True if explaining correct answer
  course_references JSONB, -- Array of course section references
  generated_by VARCHAR(50), -- 'AI_BATCH', 'MANUAL', 'HYBRID'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example:
{
  "question_id": "q_456",
  "answer_id": "a_789",
  "explanation_text": "Cette réponse est incorrecte car l'hématurie macroscopique est visible à l'œil nu, contrairement à l'hématurie microscopique qui nécessite un examen au microscope.",
  "is_correct_explanation": false,
  "course_references": [
    {
      "course_id": "course_123",
      "section_id": "section_2",
      "section_title": "2. Classification",
      "page_number": 2,
      "excerpt": "L'hématurie macroscopique est visible à l'œil nu..."
    }
  ],
  "generated_by": "AI_BATCH"
}
```

### **Batch Job Tracking**

```sql
CREATE TABLE ai_batch_jobs (
  id UUID PRIMARY KEY,
  job_type VARCHAR(50), -- 'SERIES_GENERATION', 'EXPLANATION_UPDATE'
  topic_id UUID REFERENCES topics(id),
  status VARCHAR(50), -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  input_params JSONB,
  output_summary JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_by UUID REFERENCES users(id)
);
```

### **Course Version Tracking**

```sql
CREATE TABLE course_versions (
  id UUID PRIMARY KEY,
  course_id VARCHAR(255),
  version_number INTEGER,
  changes_summary TEXT,
  updated_at TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  requires_series_regeneration BOOLEAN DEFAULT true
);
```

---

## 🤖 Batch Generation Implementation

### **1. Admin Triggers Batch Job**

```typescript
// Admin Controller
@Post('batch/generate-series')
@Roles('ADMIN')
async triggerSeriesGeneration(@Body() dto: GenerateSeriesDto) {
  const job = await this.batchService.createJob({
    jobType: 'SERIES_GENERATION',
    topicId: dto.topicId,
    inputParams: {
      seriesCount: dto.seriesCount,
      seriesTypes: dto.seriesTypes,
      difficulty: dto.difficulty
    }
  });
  
  // Queue the job (RabbitMQ)
  await this.queueService.addJob('ai-generation', job.id);
  
  return {
    message: 'Batch job queued successfully',
    jobId: job.id,
    estimatedTime: '10-15 minutes'
  };
}
```

### **2. Batch Worker Processes Job**

```typescript
// Batch Worker Service
@RabbitSubscribe({
  exchange: 'ai-generation',
  routingKey: 'series.generate'
})
async processSeriesGeneration(jobId: string) {
  const job = await this.getJob(jobId);
  
  try {
    await this.updateJobStatus(jobId, 'PROCESSING');
    
    // 1. Fetch course content
    const courses = await this.courseService.getCoursesByTopic(job.topicId);
    
    // 2. Generate series for each type
    const generatedSeries = [];
    for (const seriesType of job.inputParams.seriesTypes) {
      const series = await this.aiService.generateSeries({
        topicId: job.topicId,
        seriesType,
        courses,
        questionCount: 30
      });
      
      generatedSeries.push(series);
    }
    
    // 3. Store in database
    for (const series of generatedSeries) {
      await this.seriesService.saveSeries(series);
      await this.questionService.saveQuestions(series.questions);
      await this.saveExplanationsWithReferences(series.questions);
    }
    
    // 4. Update job status
    await this.updateJobStatus(jobId, 'COMPLETED', {
      seriesGenerated: generatedSeries.length,
      totalQuestions: generatedSeries.reduce((sum, s) => sum + s.questions.length, 0)
    });
    
  } catch (error) {
    await this.updateJobStatus(jobId, 'FAILED', null, error.message);
  }
}
```

### **3. AI Series Generation with Course References**

```typescript
// AI Service
async generateSeries(params: GenerateSeriesParams) {
  const { topicId, seriesType, courses, questionCount } = params;
  
  // 1. Build prompt with course content
  const prompt = this.buildGenerationPrompt(courses, seriesType, questionCount);
  
  // 2. Call LLM (OpenAI GPT-4)
  const response = await this.openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an expert medical educator creating exam questions with detailed explanations sourced from provided course materials.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7
  });
  
  const generatedData = JSON.parse(response.choices[0].message.content);
  
  // 3. Enrich with course references
  for (const question of generatedData.questions) {
    // For each answer explanation, find relevant course sections
    for (const answer of question.answers) {
      const references = await this.findCourseReferences(
        answer.explanation,
        courses
      );
      answer.courseReferences = references;
    }
  }
  
  return {
    title: generatedData.title,
    seriesType,
    topicId,
    questions: generatedData.questions
  };
}
```

### **4. Find Course References (Vector Search)**

```typescript
async findCourseReferences(explanationText: string, courses: Course[]) {
  // 1. Generate embedding for explanation
  const embedding = await this.openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: explanationText
  });
  
  // 2. Search in Pinecone for similar course sections
  const results = await this.pinecone.query({
    vector: embedding.data[0].embedding,
    topK: 3,
    filter: {
      course_id: { $in: courses.map(c => c.id) }
    }
  });
  
  // 3. Return references with metadata
  return results.matches.map(match => ({
    courseId: match.metadata.course_id,
    sectionId: match.metadata.section_id,
    sectionTitle: match.metadata.section_title,
    pageNumber: match.metadata.page_number,
    excerpt: match.metadata.content.substring(0, 200),
    relevanceScore: match.score
  }));
}
```

---

## 🔄 Course Update Workflow

### **When Admin Updates Course:**

```typescript
// Course Service
async updateCourse(courseId: string, updates: UpdateCourseDto) {
  // 1. Update course content
  const updatedCourse = await this.courseRepo.update(courseId, updates);
  
  // 2. Increment version
  await this.courseVersionRepo.create({
    courseId,
    versionNumber: updatedCourse.version + 1,
    changesSummary: updates.changesSummary,
    requiresSeriesRegeneration: true
  });
  
  // 3. Mark affected series for regeneration
  const affectedSeries = await this.seriesRepo.findByTopicId(updatedCourse.topicId);
  await this.seriesRepo.updateMany(
    { id: { $in: affectedSeries.map(s => s.id) } },
    { needsRegeneration: true, outdatedSince: new Date() }
  );
  
  // 4. Trigger batch regeneration job
  await this.batchService.createJob({
    jobType: 'SERIES_REGENERATION',
    topicId: updatedCourse.topicId,
    inputParams: {
      courseId,
      seriesIds: affectedSeries.map(s => s.id)
    }
  });
  
  return updatedCourse;
}
```

---

## 📱 Student Experience: Viewing Results

### **After Completing Series:**

```typescript
// Results Screen Component (Frontend)
interface SeriesResult {
  seriesId: string;
  score: number;
  percentage: number;
  questions: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: Answer;
  correctAnswers: Answer[];
  isCorrect: boolean;
  explanation: {
    text: string;
    courseReferences: CourseReference[];
  };
}

interface CourseReference {
  courseId: string;
  sectionId: string;
  sectionTitle: string;
  pageNumber?: number;
  excerpt: string;
  url: string; // Deep link to course section
}
```

### **UI Display:**

```tsx
// Results Component
<div className="question-result">
  <h3>{question.questionText}</h3>
  
  {/* Show user's answer */}
  <div className={question.isCorrect ? 'correct' : 'incorrect'}>
    <p>Your answer: {question.userAnswer.text}</p>
    {!question.isCorrect && (
      <p className="correct-answer">
        Correct answer: {question.correctAnswers.map(a => a.text).join(', ')}
      </p>
    )}
  </div>
  
  {/* Explanation */}
  <div className="explanation">
    <h4>Explanation:</h4>
    <p>{question.explanation.text}</p>
    
    {/* Course References */}
    <div className="course-references">
      <h5>📚 Learn more from course:</h5>
      {question.explanation.courseReferences.map(ref => (
        <div key={ref.sectionId} className="reference-card">
          <h6>{ref.sectionTitle}</h6>
          <p className="excerpt">{ref.excerpt}...</p>
          <a href={`/courses/${ref.courseId}?section=${ref.sectionId}`}>
            Go to course section {ref.pageNumber && `(Page ${ref.pageNumber})`}
          </a>
        </div>
      ))}
    </div>
  </div>
</div>
```

---

## ⚙️ Batch Job Scheduling

### **Automated Regeneration:**

```typescript
// Cron Job (runs daily at 2 AM)
@Cron('0 2 * * *')
async checkAndRegenerateSeries() {
  // Find series that need regeneration
  const outdatedSeries = await this.seriesRepo.find({
    needsRegeneration: true
  });
  
  if (outdatedSeries.length > 0) {
    // Group by topic
    const byTopic = this.groupBy(outdatedSeries, 'topicId');
    
    // Create batch jobs
    for (const [topicId, series] of Object.entries(byTopic)) {
      await this.batchService.createJob({
        jobType: 'SERIES_REGENERATION',
        topicId,
        inputParams: {
          seriesIds: series.map(s => s.id)
        }
      });
    }
  }
}
```

---

## 🎯 Key Benefits

1. ✅ **No Real-Time Delays**: Students get instant results
2. ✅ **Shared Resources**: All users benefit from generated content
3. ✅ **Quality Control**: Admin can review before publishing
4. ✅ **Cost Efficient**: Batch processing reduces API costs
5. ✅ **Always Up-to-Date**: Auto-regeneration when courses change
6. ✅ **Course-Grounded**: All explanations reference actual course content
7. ✅ **Scalable**: Can generate hundreds of series overnight

---

## 📊 Monitoring Dashboard

### **Admin View:**

```
┌─────────────────────────────────────────────────────────┐
│  AI Batch Jobs Dashboard                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Active Jobs:                                           │
│  ├─ Generating series for "Hématuries" (75% complete)  │
│  └─ Regenerating "Insuffisance Rénale" (pending)       │
│                                                         │
│  Completed Today: 12 jobs                               │
│  Total Series Generated: 156                            │
│  Total Questions: 4,680                                 │
│                                                         │
│  [Trigger New Batch] [View History] [Settings]         │
└─────────────────────────────────────────────────────────┘
```

This architecture ensures high-quality, course-grounded content that's always synchronized with your course materials! 🚀
