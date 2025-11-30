--
-- PostgreSQL database dump
--

\restrict OLauefnngCuCmuur9ciGL72Z08wGOas5BfipuGQSFvxyX2j4vGYczwiuvmOIZZY

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    description text,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: backups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backups (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    file_path text NOT NULL,
    size bigint NOT NULL,
    created_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.backups OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.backups_id_seq OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.backups_id_seq OWNED BY public.backups.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(45) NOT NULL,
    description text,
    slug character varying(45) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_likes (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comment_likes OWNER TO postgres;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_likes_id_seq OWNER TO postgres;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_likes_id_seq OWNED BY public.comment_likes.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    content text NOT NULL,
    likes integer DEFAULT 0,
    user_id integer NOT NULL,
    parent_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    topic_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: grand_prix; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grand_prix (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    circuit character varying(100) NOT NULL,
    race_date date NOT NULL,
    year integer NOT NULL,
    round character varying(50) NOT NULL
);


ALTER TABLE public.grand_prix OWNER TO postgres;

--
-- Name: grand_prix_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grand_prix_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grand_prix_id_seq OWNER TO postgres;

--
-- Name: grand_prix_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grand_prix_id_seq OWNED BY public.grand_prix.id;


--
-- Name: moderator_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moderator_actions (
    id integer NOT NULL,
    moderator_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.moderator_actions OWNER TO postgres;

--
-- Name: moderator_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.moderator_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moderator_actions_id_seq OWNER TO postgres;

--
-- Name: moderator_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.moderator_actions_id_seq OWNED BY public.moderator_actions.id;


--
-- Name: report_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_notes (
    id integer NOT NULL,
    report_id integer NOT NULL,
    moderator_id integer NOT NULL,
    note text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.report_notes OWNER TO postgres;

--
-- Name: report_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_notes_id_seq OWNER TO postgres;

--
-- Name: report_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_notes_id_seq OWNED BY public.report_notes.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    reporter_id integer NOT NULL,
    author_id integer NOT NULL,
    content_type character varying(20) NOT NULL,
    content_id integer NOT NULL,
    reason text NOT NULL,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    resolution text,
    moderator_id integer,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    moderator_notes text
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: topic_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topic_likes (
    id integer NOT NULL,
    topic_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.topic_likes OWNER TO postgres;

--
-- Name: topic_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.topic_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.topic_likes_id_seq OWNER TO postgres;

--
-- Name: topic_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.topic_likes_id_seq OWNED BY public.topic_likes.id;


--
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    content text NOT NULL,
    tags text,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer NOT NULL,
    category_id integer,
    status character varying(20) DEFAULT 'pending'::character varying
);


ALTER TABLE public.topics OWNER TO postgres;

--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.topics_id_seq OWNER TO postgres;

--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- Name: user_warnings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_warnings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    moderator_id integer NOT NULL,
    reason text NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_warnings OWNER TO postgres;

--
-- Name: user_warnings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_warnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_warnings_id_seq OWNER TO postgres;

--
-- Name: user_warnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_warnings_id_seq OWNED BY public.user_warnings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(45) NOT NULL,
    email character varying(45) NOT NULL,
    password_hash character varying(255) NOT NULL,
    favorite_team character varying(45),
    favorite_driver character varying(45),
    role character varying(20) DEFAULT 'user'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    is_moderator boolean DEFAULT false,
    is_banned boolean DEFAULT false,
    last_login timestamp without time zone,
    login_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_url character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: backups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups ALTER COLUMN id SET DEFAULT nextval('public.backups_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: comment_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes ALTER COLUMN id SET DEFAULT nextval('public.comment_likes_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: grand_prix id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grand_prix ALTER COLUMN id SET DEFAULT nextval('public.grand_prix_id_seq'::regclass);


--
-- Name: moderator_actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderator_actions ALTER COLUMN id SET DEFAULT nextval('public.moderator_actions_id_seq'::regclass);


--
-- Name: report_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_notes ALTER COLUMN id SET DEFAULT nextval('public.report_notes_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: topic_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_likes ALTER COLUMN id SET DEFAULT nextval('public.topic_likes_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- Name: user_warnings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_warnings ALTER COLUMN id SET DEFAULT nextval('public.user_warnings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, action, description, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: backups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backups (id, filename, file_path, size, created_by, notes, created_at) FROM stdin;
7	backup-2025-11-30T08-15-04-175Z.sql	C:\\Users\\Mikhail\\Downloads\\f1forum\\backend\\backups\\backup-2025-11-30T08-15-04-175Z.sql	44673	4	ьшл\n	2025-11-30 16:15:04.426117
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, slug, created_at) FROM stdin;
\.


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_likes (id, comment_id, user_id, created_at) FROM stdin;
96	122	4	2025-11-26 22:04:45.014081
97	133	4	2025-11-26 22:04:46.039301
98	124	4	2025-11-28 20:29:20.363121
80	88	6	2025-11-18 23:53:11.936948
81	94	4	2025-11-20 22:36:21.238653
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, content, likes, user_id, parent_id, created_at, updated_at, topic_id, status) FROM stdin;
88	ыыыы	1	6	\N	2025-11-18 23:53:10.295826	2025-11-18 23:53:10.295826	45	approved
124	факты	1	10	\N	2025-11-26 20:53:19.284171	2025-11-26 21:48:24.471738	61	approved
89	фыфыфы	0	6	88	2025-11-18 23:53:15.207522	2025-11-18 23:53:15.207522	45	approved
90	ыыы	0	6	\N	2025-11-18 23:53:25.390348	2025-11-18 23:53:25.390348	46	approved
134	ка	0	6	\N	2025-11-30 14:48:21.910622	2025-11-30 14:48:21.910622	61	approved
135	цуаауца	0	4	\N	2025-11-30 15:59:35.654751	2025-11-30 15:59:35.654751	61	approved
102	аукаукаывывывыв	0	6	\N	2025-11-24 22:07:55.653618	2025-11-25 21:36:57.415858	54	approved
94	длввввввввввв	1	4	\N	2025-11-20 22:36:02.796685	2025-11-20 22:36:29.54893	51	approved
96	фыфыфыфыфыфы	0	4	94	2025-11-20 22:36:17.844104	2025-11-20 22:36:17.844104	51	approved
123	прпр	0	6	\N	2025-11-26 20:45:55.539569	2025-11-26 20:45:55.539569	53	approved
105	вавава	0	4	90	2025-11-24 22:14:28.262859	2025-11-24 22:14:28.262859	46	approved
130	балдеж	0	4	\N	2025-11-26 21:56:32.491447	2025-11-26 21:56:32.491447	61	approved
122	ыыыы	1	4	\N	2025-11-25 22:20:54.262237	2025-11-25 22:20:54.262237	60	approved
131	ввв	0	4	130	2025-11-26 21:56:53.891295	2025-11-26 21:56:53.891295	61	approved
132	ввввв	0	4	\N	2025-11-26 21:59:18.637067	2025-11-26 21:59:18.637067	58	approved
133	ывывывывывывыв	1	4	122	2025-11-26 22:04:40.429189	2025-11-26 22:04:53.796347	60	approved
\.


--
-- Data for Name: grand_prix; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grand_prix (id, name, country, circuit, race_date, year, round) FROM stdin;
1	Bahrain Grand Prix	Bahrain	Bahrain International Circuit	2024-03-02	2024	1
2	Saudi Arabian Grand Prix	Saudi Arabia	Jeddah Corniche Circuit	2024-03-09	2024	2
\.


--
-- Data for Name: moderator_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.moderator_actions (id, moderator_id, action_type, description, created_at) FROM stdin;
1	6	comment_approved	Одобрен комментарий #88	2025-11-20 21:31:47.263099
2	6	comment_approved	Одобрен комментарий #86	2025-11-20 21:31:48.44391
3	6	comment_approved	Одобрен комментарий #89	2025-11-20 21:31:49.129491
4	6	comment_approved	Одобрен комментарий #90	2025-11-20 21:31:49.729944
5	4	user_warned	Выдано предупреждение пользователю #7	2025-11-20 21:35:54.224157
6	4	topic_approved	Одобрена тема #44	2025-11-20 21:43:58.255217
7	4	topic_approved	Одобрена тема #45	2025-11-20 21:43:59.029676
8	4	topic_approved	Одобрена тема #46	2025-11-20 21:43:59.573264
9	4	topic_approved	Одобрена тема #47	2025-11-20 21:44:00.05483
10	4	topic_approved	Одобрена тема #48	2025-11-20 21:44:00.680168
11	4	topic_approved	Одобрена тема #49	2025-11-20 21:54:48.800045
12	4	topic_approved	Одобрена тема #50	2025-11-20 22:08:19.70927
13	4	topic_approved	Одобрена тема #51	2025-11-20 22:35:54.588031
14	4	topic_approved	Одобрена тема #52	2025-11-20 22:51:38.022596
15	6	comment_approved	Одобрен комментарий #93	2025-11-24 21:50:54.32387
16	6	comment_approved	Одобрен комментарий #94	2025-11-24 21:50:55.397585
17	6	comment_approved	Одобрен комментарий #96	2025-11-24 21:50:56.01432
18	6	comment_approved	Одобрен комментарий #98	2025-11-24 21:50:56.572792
19	6	comment_approved	Одобрен комментарий #99	2025-11-24 21:50:57.005206
20	6	comment_approved	Одобрен комментарий #100	2025-11-24 21:50:57.4013
21	6	topic_approved	Одобрена тема #53	2025-11-24 21:50:59.017061
22	6	topic_approved	Одобрена тема #54	2025-11-24 22:07:48.104726
23	6	comment_deleted	Удален комментарий #101	2025-11-24 22:07:51.325452
24	4	comment_approved	Одобрен комментарий #102	2025-11-24 22:14:34.523951
25	4	comment_approved	Одобрен комментарий #103	2025-11-24 22:14:35.269173
26	4	comment_approved	Одобрен комментарий #105	2025-11-24 22:14:36.056567
27	4	comment_deleted	Удален комментарий #106	2025-11-24 22:14:58.492593
28	4	comment_deleted	Удален комментарий #107	2025-11-24 22:15:12.927046
29	6	topic_approved	Одобрена тема #55	2025-11-24 22:28:57.903621
30	4	topic_approved	Одобрена тема #56	2025-11-24 22:34:18.413871
31	4	comment_approved	Одобрен комментарий #108	2025-11-24 22:34:20.372578
32	4	comment_approved	Одобрен комментарий #109	2025-11-24 22:34:20.945223
33	4	comment_approved	Одобрен комментарий #111	2025-11-24 22:34:21.274441
34	4	comment_approved	Одобрен комментарий #112	2025-11-24 22:34:21.961528
35	4	comment_approved	Одобрен комментарий #113	2025-11-24 22:34:22.672152
36	4	comment_approved	Одобрен комментарий #114	2025-11-24 22:40:43.248494
37	4	topic_approved	Одобрена тема #57	2025-11-24 22:46:39.438357
38	4	topic_approved	Одобрена тема #57	2025-11-24 22:52:17.350625
39	4	comment_approved	Одобрен комментарий #115	2025-11-24 22:52:18.983438
40	4	topic_approved	Одобрена тема #56	2025-11-25 21:16:02.389283
41	4	comment_approved	Одобрен комментарий #116	2025-11-25 21:32:16.587129
42	4	topic_approved	Одобрена тема #54	2025-11-25 21:37:22.303829
43	4	report_resolved	Обработана жалоба #2	2025-11-25 21:37:55.31541
44	4	topic_approved	Одобрена тема #58	2025-11-25 21:42:36.47215
45	4	topic_approved	Одобрена тема #58	2025-11-25 21:43:24.682182
46	4	comment_approved	Одобрен комментарий #117	2025-11-25 21:45:03.556498
47	4	comment_approved	Одобрен комментарий #118	2025-11-25 21:45:04.188871
48	4	report_resolved	Обработана жалоба #4	2025-11-25 21:45:14.254753
49	4	report_resolved	Обработана жалоба #3	2025-11-25 21:45:17.081079
50	4	report_resolved	Обработана жалоба #5	2025-11-25 21:47:30.087026
51	4	user_suspended	Заблокирован пользователь #8	2025-11-25 21:48:13.341466
52	4	topic_rejected	Отклонена тема #59	2025-11-25 21:49:15.341197
53	4	user_unsuspended	Разблокирован пользователь #8	2025-11-25 21:49:25.091817
54	4	user_suspended	Заблокирован пользователь #8	2025-11-25 21:51:19.272389
55	4	topic_approved	Одобрена тема #60	2025-11-25 22:17:33.722135
56	4	comment_approved	Одобрен комментарий #121	2025-11-25 22:25:48.543956
57	4	comment_approved	Одобрен комментарий #122	2025-11-25 22:25:49.16475
58	4	topic_approved	Одобрена тема #61	2025-11-26 20:49:45.283812
59	4	comment_approved	Одобрен комментарий #123	2025-11-26 20:49:46.551642
60	4	user_unsuspended	Разблокирован пользователь #8	2025-11-26 20:50:09.257583
61	4	comment_approved	Одобрен комментарий #124	2025-11-26 21:10:26.04321
62	4	comment_approved	Одобрен комментарий #125	2025-11-26 21:10:26.818823
63	4	comment_approved	Одобрен комментарий #126	2025-11-26 21:10:27.590862
64	4	topic_approved	Одобрена тема #48	2025-11-26 21:10:29.517639
65	4	topic_approved	Одобрена тема #61	2025-11-26 21:10:30.185553
66	4	comment_approved	Одобрен комментарий #127	2025-11-26 21:19:41.573936
67	4	comment_approved	Одобрен комментарий #129	2025-11-26 21:19:42.258591
68	4	report_reopened	Переоткрыта жалоба #13	2025-11-26 21:45:39.055813
69	4	report_reopened	Переоткрыта жалоба #12	2025-11-26 21:55:07.576569
70	4	comment_approved	Одобрен комментарий #130	2025-11-26 21:56:37.745772
71	4	topic_approved	Одобрена тема #60	2025-11-26 22:05:28.981732
72	4	comment_approved	Одобрен комментарий #131	2025-11-26 22:05:30.884909
73	4	comment_approved	Одобрен комментарий #132	2025-11-26 22:05:31.448804
74	4	comment_approved	Одобрен комментарий #133	2025-11-26 22:05:31.921113
75	6	comment_approved	Одобрен комментарий #134	2025-11-30 14:49:45.814951
76	4	comment_approved	Одобрен комментарий #135	2025-11-30 15:59:42.665844
\.


--
-- Data for Name: report_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_notes (id, report_id, moderator_id, note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, reporter_id, author_id, content_type, content_id, reason, type, status, resolution, moderator_id, resolved_at, created_at, moderator_notes) FROM stdin;
2	4	6	comment	102	вв	comment	resolved	approved	4	2025-11-25 21:37:55.314797	2025-11-25 21:37:34.786066	\N
4	8	6	topic	44	Нецензурная лексика	topic	resolved	removed	4	2025-11-25 21:45:14.253217	2025-11-25 21:40:09.377827	\N
3	8	6	comment	86	Сапам	comment	resolved	approved	4	2025-11-25 21:45:17.080632	2025-11-25 21:39:52.900226	\N
5	4	8	comment	118	спам	comment	resolved	approved	4	2025-11-25 21:47:30.08608	2025-11-25 21:46:34.644569	\N
11	6	4	comment	117	ыыыыы	comment	resolved	Жалоба отклонена - нарушений не обнаружено	4	2025-11-26 21:42:37.43159	2025-11-26 21:19:03.640651	Быстрое решение: отклонить жалобу
10	6	8	comment	118	Спам	comment	resolved	Пользователю выдано предупреждение	4	2025-11-26 21:42:51.009128	2025-11-26 21:17:37.450807	Быстрое решение: предупредить пользователя
9	10	8	comment	118	Спам	comment	resolved	Жалоба отклонена - нарушений не обнаружено	4	2025-11-26 21:43:07.210811	2025-11-26 20:53:44.739475	Быстрое решение: отклонить жалобу
7	6	4	comment	122	Спам	comment	resolved	Пользователю выдано предупреждение	4	2025-11-26 21:43:13.243185	2025-11-25 22:25:28.552638	Быстрое решение: предупредить пользователя
13	4	6	comment	127	Нарушение	comment	resolved	Комментарий удален	4	2025-11-26 21:45:45.637406	2025-11-26 21:39:36.164658	Быстрое решение: удалить контент
8	6	4	comment	121	Нецензурная лексика	comment	resolved	Пользователю выдано предупреждение	4	2025-11-26 21:45:49.794452	2025-11-25 22:25:38.776728	Быстрое решение: предупредить пользователя
6	4	8	comment	118	Спам	comment	resolved	Комментарий удален	4	2025-11-26 21:54:55.969324	2025-11-25 22:25:14.536178	Быстрое решение: удалить контент
14	4	6	comment	129	ааааа	comment	resolved	Комментарий удален	4	2025-11-26 21:58:41.855748	2025-11-26 21:57:00.300367	Быстрое решение: удалить контент
15	4	8	comment	126	цу	comment	resolved	Комментарий удален	4	2025-11-26 21:58:59.638227	2025-11-26 21:58:50.890775	Быстрое решение: удалить контент
12	4	10	comment	124	Спам	comment	resolved	Пользователю выдано предупреждение	4	2025-11-26 22:07:21.420033	2025-11-26 21:36:03.89946	Быстрое решение: предупредить пользователя
\.


--
-- Data for Name: topic_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topic_likes (id, topic_id, user_id, created_at) FROM stdin;
64	54	4	2025-11-24 22:14:07.556691
67	58	8	2025-11-25 21:44:50.833375
68	61	10	2025-11-26 20:53:22.135345
73	51	4	2025-11-26 22:05:19.337245
77	61	4	2025-11-30 16:47:27.914133
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topics (id, title, content, tags, views, likes, comments_count, is_pinned, is_locked, created_at, updated_at, user_id, category_id, status) FROM stdin;
51	ура	работает	["эта"]	11	1	0	f	f	2025-11-20 22:35:48.215874	2025-11-20 22:35:48.215874	4	\N	approved
54	аааввввввввввввв	аааввввввв	["ааа"]	34	1	0	f	f	2025-11-24 22:07:35.578258	2025-11-25 21:37:17.124109	6	\N	approved
60	ыыввввв	ыыввввв	["ыывввв"]	29	0	0	f	f	2025-11-25 22:14:13.024055	2025-11-26 22:05:00.482	4	\N	approved
58	Миха гришаев	Миха ывывывывывыв	["Миха"]	15	1	0	f	f	2025-11-25 21:42:23.201795	2025-11-25 21:43:09.768067	8	\N	approved
47	топ	топ	["топ"]	5	0	0	f	f	2025-11-19 00:07:25.712992	2025-11-19 00:07:25.712992	4	\N	approved
46	фыы	фыфы	["фыфы"]	9	0	0	f	f	2025-11-18 23:53:22.219084	2025-11-18 23:53:22.219084	6	\N	approved
61	пмаыыыыыыыыыыыыыыыыыы	ыыыыыы	["аппа"]	52	2	0	f	f	2025-11-26 20:47:49.309053	2025-11-26 21:09:48.587139	6	\N	approved
59	п	п	["п"]	0	0	0	f	f	2025-11-25 21:49:02.365385	2025-11-25 21:49:02.365385	8	\N	rejected
48	ыыыыыыыы	ыыы	["{\\"ы\\"}"]	1	0	0	f	f	2025-11-20 21:29:53.528334	2025-11-26 21:10:14.363538	6	\N	approved
45	ййй	йййййййййй	["йййй"]	6	0	0	f	f	2025-11-18 19:59:26.826334	2025-11-18 19:59:26.826334	6	\N	approved
53	Мото мото	мото	["тото"]	8	0	0	f	f	2025-11-24 21:50:44.234784	2025-11-24 21:50:44.234784	6	\N	approved
\.


--
-- Data for Name: user_warnings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_warnings (id, user_id, moderator_id, reason, expires_at, created_at) FROM stdin;
2	4	4	Жалоба #8: Быстрое решение: предупредить пользователя	\N	2025-11-25 22:25:54.640769
3	4	4	Жалоба #8: Быстрое решение: предупредить пользователя	\N	2025-11-25 22:26:18.66421
4	10	4	Жалоба #12: Быстрое решение: предупредить пользователя	\N	2025-11-26 21:39:57.414875
5	8	4	Жалоба #10: Быстрое решение: предупредить пользователя	\N	2025-11-26 21:42:51.008203
6	4	4	Жалоба #7: Быстрое решение: предупредить пользователя	\N	2025-11-26 21:43:13.242469
7	4	4	Жалоба #8: Быстрое решение: предупредить пользователя	\N	2025-11-26 21:45:49.793642
8	10	4	Жалоба #12: Быстрое решение: предупредить пользователя	\N	2025-11-26 22:07:21.4191
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, favorite_team, favorite_driver, role, status, is_moderator, is_banned, last_login, login_count, created_at, avatar_url) FROM stdin;
10	mams	lol@gmail.com	$2a$10$DrpsClQnjJUcfbYI.O29Ae2w89VSJk1771/5JCNHE3Meh715ku1KC	Mercedes		user	active	f	f	2025-11-26 20:53:03.093169	1	2025-11-26 20:52:40.993167	\N
11	moderator	moderator@f1forum.com	$2a$10$TvQWQNSHJoIgPYbi/2.MdO20plOtMt2.0Cqi7qSHMXTQcZkt98cQe	\N	\N	moderator	active	f	f	\N	0	2025-11-26 20:56:09.436496	\N
8	mima	amim@gmail.ru	$2a$10$Gblt4bAFXU2QG.ZlKxg0Je80xop6TL9dvzWbsumE2yXRp6fv2WSOO	Ferrari	wdwd	user	active	f	f	2025-11-26 21:04:26.425106	11	2025-11-24 22:45:57.057933	\N
6	mamamamamamamamama	moto@gmail.com	$2a$10$1k3bnxYynGoQFnNTBfIlNuMcCDfjhzv.jqc0PWsCBbo0U1M12CueK			moderator	active	f	f	2025-11-30 16:01:12.02856	32	2025-11-10 21:01:40.961258	\N
4	admin	admin@f1forum.com	$2a$10$gDsRwOHx1W.aenN9EI0jh.g7kJ7R2p8B76OAZk0fRmQy4qTxJztSe	\N	\N	admin	active	t	f	2025-11-30 16:17:09.099422	81	2025-11-09 18:22:32.225715	\N
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: backups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.backups_id_seq', 7, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- Name: comment_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_likes_id_seq', 98, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 135, true);


--
-- Name: grand_prix_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grand_prix_id_seq', 2, true);


--
-- Name: moderator_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moderator_actions_id_seq', 76, true);


--
-- Name: report_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_notes_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 15, true);


--
-- Name: topic_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topic_likes_id_seq', 77, true);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topics_id_seq', 61, true);


--
-- Name: user_warnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_warnings_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: backups backups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: comment_likes comment_likes_comment_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: grand_prix grand_prix_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grand_prix
    ADD CONSTRAINT grand_prix_pkey PRIMARY KEY (id);


--
-- Name: moderator_actions moderator_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderator_actions
    ADD CONSTRAINT moderator_actions_pkey PRIMARY KEY (id);


--
-- Name: report_notes report_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_notes
    ADD CONSTRAINT report_notes_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: topic_likes topic_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_likes
    ADD CONSTRAINT topic_likes_pkey PRIMARY KEY (id);


--
-- Name: topic_likes topic_likes_topic_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_likes
    ADD CONSTRAINT topic_likes_topic_id_user_id_key UNIQUE (topic_id, user_id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: user_warnings user_warnings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_warnings
    ADD CONSTRAINT user_warnings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: idx_comments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_status ON public.comments USING btree (status);


--
-- Name: idx_moderator_actions_moderator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moderator_actions_moderator ON public.moderator_actions USING btree (moderator_id);


--
-- Name: idx_report_notes_report_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_notes_report_id ON public.report_notes USING btree (report_id);


--
-- Name: idx_reports_content; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_content ON public.reports USING btree (content_type, content_id);


--
-- Name: idx_reports_reporter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_reporter ON public.reports USING btree (reporter_id);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status);


--
-- Name: idx_topics_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_topics_status ON public.topics USING btree (status);


--
-- Name: idx_user_warnings_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_warnings_expires ON public.user_warnings USING btree (expires_at);


--
-- Name: idx_user_warnings_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_warnings_user ON public.user_warnings USING btree (user_id);


--
-- Name: idx_user_warnings_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_warnings_user_id ON public.user_warnings USING btree (user_id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: backups backups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: moderator_actions moderator_actions_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderator_actions
    ADD CONSTRAINT moderator_actions_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: report_notes report_notes_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_notes
    ADD CONSTRAINT report_notes_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(id);


--
-- Name: report_notes report_notes_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_notes
    ADD CONSTRAINT report_notes_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: reports reports_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: topic_likes topic_likes_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_likes
    ADD CONSTRAINT topic_likes_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: topic_likes topic_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_likes
    ADD CONSTRAINT topic_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: topics topics_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: topics topics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_warnings user_warnings_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_warnings
    ADD CONSTRAINT user_warnings_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_warnings user_warnings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_warnings
    ADD CONSTRAINT user_warnings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OLauefnngCuCmuur9ciGL72Z08wGOas5BfipuGQSFvxyX2j4vGYczwiuvmOIZZY

