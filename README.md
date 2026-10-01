# TestPoint Frontend

Web client for **TestPoint**, a web-based online quiz and assessment system built for CSE352 (Advanced Java Lab), Southeast University.

This Next.js app is the interface for three roles. It calls the Spring Boot API in `testpoint-backend` and does not talk to the database itself.

## Course and student information

|              |                                                        |
| ------------ | ------------------------------------------------------ |
| Course       | Advanced Java Lab (CSE352), Section 03                 |
| Department   | Computer Science and Engineering, Southeast University |
| Submitted to | Miftahul Sheikh, Lecturer, Department of CSE           |

| SL  | Name              | Student ID    |
| --- | ----------------- | ------------- |
| 1   | Emon Hossain      | 2023000010093 |
| 2   | Md Sajjad Hossain | 2024000010009 |

## What you can do in the app

**Instructor**

- Create a class and share its join code, or enroll a student by email.
- Add multiple-choice, true/false, and short-answer questions to a personal bank.
- Upload a lecture PDF and review AI drafts before saving them (requires AI on the API).
- Build a quiz, set the time window, duration, attempt limit, passing marks, and shuffle, then publish and assign it.
- Grade pending short answers by hand, or ask the API to grade an attempt with AI.
- Open analytics for a quiz: attempts, average score, pass rate, and question accuracy.

**Student**

- Join a class with a code.
- Start an assigned quiz while its window is open and an attempt remains.
- Answer against a countdown. Changes are saved automatically. Time running out submits the paper.
- See objective scores immediately. Short answers stay pending until they are graded.
- Read a result later from history, and request an AI study summary once the attempt is fully graded.

**Admin**

- See counts of users, instructors, students, quizzes, and attempts.
- Change another user's role or disable an account.

Signed-in users are sent to their own desk. A student cannot open the instructor pages, and the other way around.

## Technology

| Piece     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 16 (App Router)                                       |
| UI        | React 19, TypeScript, Tailwind CSS 4                          |
| Auth      | JWT stored in the browser and sent as `Authorization: Bearer` |

## Requirements

- Node.js with npm
- The TestPoint backend running and reachable

The API in this project defaults to `http://localhost:8080`. The backend listens on **8081**, so set the URL when you start the dev server.

## Run

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8081 npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081 npm run build
npm start
```

## Pages

| Path                             | Role                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `/`                              | Landing. Signed-in users are redirected to their desk |
| `/login`, `/register`            | Public                                                |
| `/admin`                         | Admin                                                 |
| `/instructor`                    | Instructor overview                                   |
| `/instructor/classes`            | Classes and join codes                                |
| `/instructor/questions`          | Question bank                                         |
| `/instructor/questions/generate` | Draft questions from a PDF                            |
| `/instructor/quizzes`            | Quiz list and create                                  |
| `/instructor/quizzes/[id]`       | Edit, publish, assign                                 |
| `/instructor/grading`            | Short-answer review                                   |
| `/instructor/analytics/[quizId]` | Quiz analytics                                        |
| `/student`                       | Assigned quizzes and class join                       |
| `/student/attempt/[id]`          | Timed paper                                           |
| `/student/results/[id]`          | Score and feedback                                    |
| `/student/history`               | Past attempts                                         |

Demo accounts are created by the backend seeder. See the backend README for those emails and passwords.
