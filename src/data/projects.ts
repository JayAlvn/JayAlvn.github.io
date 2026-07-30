// The Projects panel's content, lifted out of the markup so adding a project
// is a data edit rather than another 50 lines of near-duplicate JSX.
//
// Images are static ESM imports, which is what keeps astro:assets able to
// optimise them at build time — a runtime path string would skip that.
//
// Not an Astro content collection: these blurbs are a paragraph each, and
// collections start earning their keep when the write-ups become real
// Markdown articles with their own frontmatter. That's the upgrade path.
import type { ImageMetadata } from 'astro';

import fragDark from '../assets/projects/fraud-high-risk-dark.png';
import fragLight from '../assets/projects/config-low-risk-light.png';
import sqlRepl from '../assets/projects/sql-engine-repl.png';
import uuaPortal from '../assets/projects/uua-portal-selection.png';
import uuaAddSubject from '../assets/projects/uua-add-subject.png';
import uuaMyStudents from '../assets/projects/uua-my-students.png';

export type Shot = {
	src: ImageMetadata;
	/** describes the state captured, for readers who can't see the image */
	alt: string;
	/** the visible line under the shot, explaining what it demonstrates */
	caption: string;
};

/** one command typed at a REPL and what it printed back */
export type TranscriptBlock = { sql: string; out: string };

/**
 * A screen recording of the project running. Unlike screenshots these are
 * plain `public/` paths, not ESM imports: astro:assets only processes
 * images, so the file is served byte-for-byte as it sits on disk. The
 * consequence is no content hash in the filename — replacing a video keeps
 * the same URL, so a hard refresh may be needed to see the new one.
 */
export type Video = {
	/** absolute path under public/ */
	src: string;
	/** frame shown before playback; the only thing fetched on page load */
	poster: string;
	/** describes the recording for anyone who can't watch it */
	alt: string;
	caption: string;
};

export type Project = {
	id: string;
	/** the name on the shelf card — kept short enough to read at a glance */
	short: string;
	/** the rest of the title, after the em dash */
	tagline: string;
	/** the technology line under the title */
	stack: string;
	/** one line on the shelf card, to choose by */
	hook: string;
	/**
	 * the card's picture, cropped by the card. Optional: a project with no
	 * screenshots yet gets a numbered placeholder of the same proportions,
	 * so the shelf stays even until one arrives
	 */
	thumb?: ImageMetadata;
	blurb: string;
	/** the few specifics worth calling out, listed under the blurb */
	highlights?: string[];
	repo: string;
	/** screenshots, for projects that have a UI worth showing */
	shots?: Shot[];
	/** rendered as a terminal block — for projects whose interface is text */
	transcript?: { blocks: TranscriptBlock[]; caption: string };
	/** a run-through of the thing actually working, shown last */
	video?: Video;
};

export const projects: Project[] = [
	{
		id: 'f-rag',
		short: 'F-RAG',
		tagline: 'Fraud Detection RAG Pipeline',
		stack:
			'Python · FastAPI · ChromaDB · sentence-transformers · Llama 3.2 via Ollama · Tauri · React · TypeScript',
		hook: 'Reads enterprise documents and scores their fraud risk, citing the passage it judged from.',
		thumb: fragDark,
		blurb:
			'A desktop application that uses Retrieval-Augmented Generation to analyse enterprise documents, answer questions about them, and flag fraud risk with a confidence-scored, source-cited breakdown for human review.',
		repo: 'https://github.com/JayAlvn/Fraud-Detection-RAG-Pipeline',
		shots: [
			{
				src: fragDark,
				alt: 'F-RAG scoring a suspicious invoice 80 / HIGH, with a risk-factor breakdown and the cited source passage',
				caption:
					'Fraud detected — a suspicious payment request is scored 80 / HIGH, with the contributing risk factors broken down and the exact source passage cited.',
			},
			{
				src: fragLight,
				alt: 'F-RAG scoring a clean configuration-management document 0 / LOW, shown in the light theme',
				caption:
					'Clean document — a normal reference file is correctly scored 0 / LOW; the model does not invent risk where there is none.',
			},
		],
		video: {
			src: '/video/frag-demo.mp4',
			poster: '/video/frag-demo-poster.webp',
			alt: 'Screen recording of F-RAG ingesting the EU AI Act as a PDF, answering a question about Article 56, and returning six ranked sources with a confidence score and the cited passages',
			caption:
				'The pipeline end to end — the EU AI Act is ingested and chunked, a question is put to it, and the answer returns ranked across six retrieved sources with a confidence score, a live token budget, and the exact passages it drew from. 2 min 26 s, no narration.',
		},
	},
	{
		id: 'sql-engine',
		short: 'SQL Engine',
		tagline: 'Hand-Written Parser & Query Executor',
		stack: 'Java 17 · Gradle · Jackson · JSON file storage',
		hook: 'A miniature SQL database in Java — its own tokenizer, parser and executor, over tables kept as JSON.',
		thumb: sqlRepl,
		blurb:
			'A miniature SQL database built from scratch — no parser generator and no database backend. A hand-written tokenizer and parser turn typed SQL into command objects that execute against tables persisted as JSON, and each comparison operator is its own strategy class, so supporting a new one means adding a class rather than another branch.',
		repo: 'https://github.com/JayAlvn/SQL-clause-implementations-using-java-and-jackson',
		// captured from a real `./gradlew run` session against the sample
		// students table, not reconstructed from the README
		transcript: {
			caption:
				'A live session against the sample table: a full scan, then the BETWEEN and IN operators narrowing it. Results are formatted as an aligned table with a row count, the way a real client would print them.',
			blocks: [
				{
					sql: 'SELECT * FROM students',
					out: `NAME   | ID | LASTNAME
-------+----+---------
ashley | 23 | borro
max    | 66 | bright
Pency  | 12 | Brown
(3 rows)`,
				},
				{
					sql: 'SELECT * FROM students WHERE ID BETWEEN 10 AND 30',
					out: `NAME   | ID | LASTNAME
-------+----+---------
ashley | 23 | borro
Pency  | 12 | Brown
(2 rows)`,
				},
				{
					sql: "SELECT * FROM students WHERE NAME IN ('max', 'Pency')",
					out: `NAME  | ID | LASTNAME
------+----+---------
max   | 66 | bright
Pency | 12 | Brown
(2 rows)`,
				},
			],
		},
		shots: [
			{
				src: sqlRepl,
				alt: 'The students table stored as JSON in an editor, with the engine running in a terminal below it answering a SELECT with a formatted table',
				caption:
					'The whole engine in one frame — a table is just a JSON file of a name, a schema and its rows (top), and the REPL reads, filters and prints it back (bottom).',
			},
		],
	},
	{
		id: 'uua',
		short: 'Universal University App',
		tagline: 'Role-Based University Management System',
		stack:
			'Java 17 · Spring Boot 4 · Spring Security · JWT · JPA/Hibernate · PostgreSQL 16 · Docker Compose · Angular 21 · TypeScript · Angular Material',
		hook: 'Teachers run the courses, students see their own marks — one system, two very different views of it.',
		blurb:
			'A three-tier university management system that forks at the front door: you pick a portal before you even sign in, and what you can reach afterwards is decided by the role you hold. Teachers create subjects, add and enrol students, assign grades and keep a roster of everyone they teach; students see only the courses they are enrolled in and the marks they have been given. Authentication is stateless — a signed JWT on every request instead of a server-side session — and the same rules are enforced on both sides of the wire.',
		highlights: [
			'Two roles, ROLE_STUDENT and ROLE_TEACHER, held as a many-to-many join against the user — the whole permission model falls out of which one you hold.',
			'Authorisation is enforced twice over: Angular route guards keep the wrong screens out of view, and Spring Security @PreAuthorize checks guard the endpoints themselves, so a hand-written request cannot walk around the missing button.',
			'Stateless JWT auth — passwords BCrypt-hashed, tokens signed and verified by a servlet filter ahead of the security chain, and no session kept on the server.',
			'A JPA/Hibernate model over PostgreSQL, with a unique constraint on the enrolment pair so the same student cannot land in one subject twice.',
			'Postgres and pgAdmin both come up from one docker-compose file, so the database side of the stack is a single command.',
		],
		repo: 'https://github.com/JayAlvn/Universal-University-App',
		thumb: uuaAddSubject,
		shots: [
			{
				src: uuaPortal,
				alt: 'The University Portal landing card offering two buttons: sign in as Teacher, or sign in as Student',
				caption:
					'The fork the whole system turns on — the role is chosen before any credentials are entered, and it decides which half of the app exists for you.',
			},
			{
				src: uuaAddSubject,
				alt: 'The Add Subject form with name, code, ECTS and optional description fields, under a nav bar of teacher-only routes',
				caption:
					'A teacher creating a course. The nav bar above it — Assign Grade, My Students, Add Student, Enrol Student — is the half of the app a student signing in never sees.',
			},
			{
				src: uuaMyStudents,
				alt: 'The My Students table listing three students with their usernames, IDs, enrolled subjects and grades, plus a search box and per-row remove buttons',
				caption:
					'The teacher’s roster, joining users, enrolments and grades into one view — searchable by name, username or ID, with each student’s marks shown against the subject they were given for.',
			},
		],
	},
];
