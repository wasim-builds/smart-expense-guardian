<div align="center">
  <h1>✨ Smart Expense Guardian ✨</h1>
  <p><strong>Enterprise-grade ML Categorization & Fraud Detection for Modern Finance</strong></p>
  <p><em>Built for Hackathon 3.0</em></p>
</div>

<br />

## 🚀 The Vision: Why We Built This

Personal finance apps today are mostly dumb ledger books. They require manual categorization, offer zero proactive security, and lack intelligence. 

**Smart Expense Guardian** changes the paradigm. We bring institutional-grade Machine Learning directly to personal finance. Instead of just tracking spending, our platform **actively protects and organizes** it in real-time. 

## 🏆 How This Wins Hackathons (The "Wow" Factor)

While most teams build standard CRUD (Create, Read, Update, Delete) applications wrapping an OpenAI API call, this project demonstrates genuine, defensible engineering:

1. **Real Machine Learning (No API Keys Required)**: We aren't just passing strings to an LLM. We trained a `RandomForestClassifier` (TF-IDF) for categorization and an unsupervised `IsolationForest` for anomaly/fraud detection. The models are serialized (`.pkl`) and run entirely locally with **0ms network latency**.
2. **Enterprise Architecture**: Built on a modular FastAPI backend with SQLAlchemy, Alembic migrations, and Pydantic validation. This proves an understanding of scalable system design, not just prototyping.
3. **Optimized Frontend Data Flow**: Instead of brittle state management, we use **React Query (TanStack)** for caching, optimistic UI updates, and background refetching. 
4. **Stunning Glassmorphism UX**: Hackathons are won on presentation. The UI utilizes Tailwind CSS backdrop blurs, gradients, and Recharts to deliver a premium, "fintech-unicorn" aesthetic that wows judges instantly.

---

## 🛠️ Tech Stack

**Frontend (The Glass Interface):**
- React + Vite
- Tailwind CSS v4 (Glassmorphism UI)
- TanStack React Query (State & Cache Management)
- Recharts (Data Visualization)
- Lucide React & React Hot Toast (Micro-interactions)

**Backend (The ML Engine):**
- FastAPI (High-performance async Python framework)
- SQLite + SQLAlchemy (Relational persistence)
- Alembic (Database version control)
- Pydantic (Strict data validation)

**Machine Learning (The Brain):**
- Scikit-Learn (TF-IDF, Random Forest, Isolation Forest)
- Pandas (Data wrangling)
- Joblib (Model serialization)

---

## 🧪 Testing & Reliability

This project isn't just a fragile demo; it's heavily tested:
- **Pytest Suite**: Includes a dedicated testing suite (`test_main.py`) using an isolated, in-memory SQLite database to rigorously verify that the ML models load correctly and endpoints return accurate JSON without polluting production data.
- **End-to-End Visual Verification**: The frontend includes robust error boundaries and dynamic loading states to ensure it never crashes on the demo stage.

---

## 💻 Running Locally

### 1. Backend Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn backend.main:app --reload
```
*API will run on `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*UI will run on `http://localhost:5173`*

---

## 🔮 Roadmap (Future Scalability)
- **Active Learning**: Allow users to correct miscategorized transactions in the UI, saving the correction to the database to automatically retrain the ML model nightly via a cron job.
- **Multi-Tenancy**: Integrate JWT authentication to support multiple users.
- **Async Database I/O**: Upgrade SQLAlchemy to `ext.asyncio` for maximum concurrent throughput.
