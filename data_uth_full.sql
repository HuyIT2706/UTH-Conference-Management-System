--
-- PostgreSQL database cluster dump
--

\restrict i4I0BeKeFuZ4Mew1sYZdxiYifcNsEtQAXm9eWd3k0ada08D8qciMoRsdDZWvnAp

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE admin;
ALTER ROLE admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:kN8vNYR4J7MujuyUY8XUEg==$t2NR8I6kjU69yI+IIkdWTZVS4r7Nd4L0iOOTzNpHP2I=:3xpCGWKMwW5uGnjW9DgUz3WggkQlsxkLjofR+coN4Yg=';

--
-- User Configurations
--








\unrestrict i4I0BeKeFuZ4Mew1sYZdxiYifcNsEtQAXm9eWd3k0ada08D8qciMoRsdDZWvnAp

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict ufZodLPOo0EQOcVJaUlXcr3UPewe2kNpmRkhZEZgxLsaAaiNnZFu4h9xuVxd5fx

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict ufZodLPOo0EQOcVJaUlXcr3UPewe2kNpmRkhZEZgxLsaAaiNnZFu4h9xuVxd5fx

--
-- Database "admin" dump
--

--
-- PostgreSQL database dump
--

\restrict 0mdkYIlJlPacTNYMCyQCuua9g3Im5qfqb6rrSybwpNKln3CAGV6kgoqWpVvsEqg

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: admin; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE admin WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE admin OWNER TO admin;

\unrestrict 0mdkYIlJlPacTNYMCyQCuua9g3Im5qfqb6rrSybwpNKln3CAGV6kgoqWpVvsEqg
\connect admin
\restrict 0mdkYIlJlPacTNYMCyQCuua9g3Im5qfqb6rrSybwpNKln3CAGV6kgoqWpVvsEqg

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict 0mdkYIlJlPacTNYMCyQCuua9g3Im5qfqb6rrSybwpNKln3CAGV6kgoqWpVvsEqg

--
-- Database "db_aiservice" dump
--

--
-- PostgreSQL database dump
--

\restrict buuOVzzdTUS3OaHlc3YYd8YalKeJfJTqPxngVTtsWWpdJxgaFHDgaeeuTVTEq3s

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: db_aiservice; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE db_aiservice WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE db_aiservice OWNER TO admin;

\unrestrict buuOVzzdTUS3OaHlc3YYd8YalKeJfJTqPxngVTtsWWpdJxgaFHDgaeeuTVTEq3s
\connect db_aiservice
\restrict buuOVzzdTUS3OaHlc3YYd8YalKeJfJTqPxngVTtsWWpdJxgaFHDgaeeuTVTEq3s

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: submission_summaries; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.submission_summaries (
    ai_id integer NOT NULL,
    submission_id character varying(255) NOT NULL,
    ai_summary text NOT NULL,
    ai_problem text,
    ai_solution text,
    ai_result text,
    ai_keywords text,
    ai_created_at timestamp without time zone DEFAULT now() NOT NULL,
    ai_updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.submission_summaries OWNER TO admin;

--
-- Name: submission_summaries_ai_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.submission_summaries_ai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.submission_summaries_ai_id_seq OWNER TO admin;

--
-- Name: submission_summaries_ai_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.submission_summaries_ai_id_seq OWNED BY public.submission_summaries.ai_id;


--
-- Name: submission_summaries ai_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.submission_summaries ALTER COLUMN ai_id SET DEFAULT nextval('public.submission_summaries_ai_id_seq'::regclass);


--
-- Data for Name: submission_summaries; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.submission_summaries (ai_id, submission_id, ai_summary, ai_problem, ai_solution, ai_result, ai_keywords, ai_created_at, ai_updated_at) FROM stdin;
4	d79b6016-2768-4402-87b3-ed3bf4bb6402	Nghiên cứu này đề xuất một giải pháp cải tiến mô hình YOLOv9 để nhận diện và phân loại biển báo giao thông tại Việt Nam trong điều kiện thời tiết bất lợi. Mô hình được cải tiến bằng cách tích hợp module Attention và kỹ thuật Data Augmentation đa dạng. Kết quả cho thấy mô hình đạt độ chính xác (mAP) 96.5% trên tập dữ liệu tự thu thập, cao hơn 8% so với YOLOv8 gốc. Thành tựu này có tiềm năng lớn cho các hệ thống hỗ trợ lái xe nâng cao (ADAS) tại Việt Nam.	\N	\N	\N		2026-02-24 15:17:36.281867	2026-02-24 15:17:36.281867
5	1443d904-5785-488e-9cef-aa5d61c0117d	This paper introduces a new method for building and implementing a microservices-based system for academic conference management. By using NestJS, an API Gateway, and PostgreSQL isolation, the system shows substantial enhancements in scalability, fault tolerance, and performance, especially during busy submission times. The study found that API latency was reduced by 40% when compared to traditional monolithic architectures.	\N	\N	\N		2026-03-09 02:49:58.656489	2026-03-09 02:49:58.656489
6	b5adfe18-cdbc-4b33-9e9e-8e642ba37c92	Tiêu đề: ***dasdas***. Nội dung tóm tắt: đâsdasd	\N	\N	\N		2026-03-18 14:43:27.18047	2026-03-18 14:43:27.18047
\.


--
-- Name: submission_summaries_ai_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.submission_summaries_ai_id_seq', 6, true);


--
-- Name: submission_summaries PK_ae8fd22aa00fff9f1674e4e95b8; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.submission_summaries
    ADD CONSTRAINT "PK_ae8fd22aa00fff9f1674e4e95b8" PRIMARY KEY (ai_id);


--
-- Name: IDX_ce7812c3bb3f2b4cc598cb7413; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "IDX_ce7812c3bb3f2b4cc598cb7413" ON public.submission_summaries USING btree (submission_id);


--
-- PostgreSQL database dump complete
--

\unrestrict buuOVzzdTUS3OaHlc3YYd8YalKeJfJTqPxngVTtsWWpdJxgaFHDgaeeuTVTEq3s

--
-- Database "db_conference" dump
--

--
-- PostgreSQL database dump
--

\restrict dE012OkYruIU5hfmmyMNZYa26FWMZceVNoGvSgJcByFdLEj6asyz7OYjPf5NZGo

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: db_conference; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE db_conference WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE db_conference OWNER TO admin;

\unrestrict dE012OkYruIU5hfmmyMNZYa26FWMZceVNoGvSgJcByFdLEj6asyz7OYjPf5NZGo
\connect db_conference
\restrict dE012OkYruIU5hfmmyMNZYa26FWMZceVNoGvSgJcByFdLEj6asyz7OYjPf5NZGo

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: conference_members_role_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.conference_members_role_enum AS ENUM (
    'CHAIR',
    'PC_MEMBER',
    'REVIEWER'
);


ALTER TYPE public.conference_members_role_enum OWNER TO admin;

--
-- Name: track_members_track_member_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.track_members_track_member_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);


ALTER TYPE public.track_members_track_member_status_enum OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cfp_settings; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cfp_settings (
    id integer NOT NULL,
    submission_deadline timestamp with time zone NOT NULL,
    review_deadline timestamp with time zone NOT NULL,
    notification_date timestamp with time zone NOT NULL,
    camera_ready_deadline timestamp with time zone NOT NULL,
    conference_id integer NOT NULL
);


ALTER TABLE public.cfp_settings OWNER TO admin;

--
-- Name: cfp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.cfp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cfp_settings_id_seq OWNER TO admin;

--
-- Name: cfp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.cfp_settings_id_seq OWNED BY public.cfp_settings.id;


--
-- Name: conference_members; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.conference_members (
    conference_member_id integer NOT NULL,
    conference_id integer NOT NULL,
    user_id integer NOT NULL,
    role public.conference_members_role_enum NOT NULL,
    "conferenceId" integer
);


ALTER TABLE public.conference_members OWNER TO admin;

--
-- Name: conference_members_conference_member_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.conference_members_conference_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.conference_members_conference_member_id_seq OWNER TO admin;

--
-- Name: conference_members_conference_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.conference_members_conference_member_id_seq OWNED BY public.conference_members.conference_member_id;


--
-- Name: conferences; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.conferences (
    conference_id integer NOT NULL,
    conference_name character varying(255) NOT NULL,
    conference_start_date timestamp with time zone NOT NULL,
    conference_end_date timestamp with time zone NOT NULL,
    conference_venue character varying(255) NOT NULL,
    conference_description text,
    short_description character varying(500),
    contact_email character varying(255),
    organizer_id integer NOT NULL,
    conference_deleted_at timestamp with time zone,
    conference_is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.conferences OWNER TO admin;

--
-- Name: conferences_conference_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.conferences_conference_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.conferences_conference_id_seq OWNER TO admin;

--
-- Name: conferences_conference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.conferences_conference_id_seq OWNED BY public.conferences.conference_id;


--
-- Name: track_members; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.track_members (
    track_member_id integer NOT NULL,
    track_id integer NOT NULL,
    user_id integer NOT NULL,
    track_member_status public.track_members_track_member_status_enum DEFAULT 'PENDING'::public.track_members_track_member_status_enum NOT NULL,
    track_member_created_at timestamp with time zone DEFAULT now() NOT NULL,
    track_member_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "trackId" integer
);


ALTER TABLE public.track_members OWNER TO admin;

--
-- Name: track_members_track_member_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.track_members_track_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.track_members_track_member_id_seq OWNER TO admin;

--
-- Name: track_members_track_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.track_members_track_member_id_seq OWNED BY public.track_members.track_member_id;


--
-- Name: tracks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tracks (
    track_id integer NOT NULL,
    track_name character varying(255) NOT NULL,
    track_conference_id integer NOT NULL,
    track_description text,
    track_created_at timestamp with time zone DEFAULT now() NOT NULL,
    track_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    track_deleted_at timestamp with time zone,
    track_is_active boolean DEFAULT true NOT NULL,
    "conferenceId" integer
);


ALTER TABLE public.tracks OWNER TO admin;

--
-- Name: tracks_track_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.tracks_track_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tracks_track_id_seq OWNER TO admin;

--
-- Name: tracks_track_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.tracks_track_id_seq OWNED BY public.tracks.track_id;


--
-- Name: cfp_settings id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cfp_settings ALTER COLUMN id SET DEFAULT nextval('public.cfp_settings_id_seq'::regclass);


--
-- Name: conference_members conference_member_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.conference_members ALTER COLUMN conference_member_id SET DEFAULT nextval('public.conference_members_conference_member_id_seq'::regclass);


--
-- Name: conferences conference_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.conferences ALTER COLUMN conference_id SET DEFAULT nextval('public.conferences_conference_id_seq'::regclass);


--
-- Name: track_members track_member_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.track_members ALTER COLUMN track_member_id SET DEFAULT nextval('public.track_members_track_member_id_seq'::regclass);


--
-- Name: tracks track_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tracks ALTER COLUMN track_id SET DEFAULT nextval('public.tracks_track_id_seq'::regclass);


--
-- Data for Name: cfp_settings; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.cfp_settings (id, submission_deadline, review_deadline, notification_date, camera_ready_deadline, conference_id) FROM stdin;
1	2026-03-26 16:20:00+00	2026-03-28 16:17:00+00	2026-04-03 16:17:00+00	2026-04-09 16:17:00+00	1
\.


--
-- Data for Name: conference_members; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.conference_members (conference_member_id, conference_id, user_id, role, "conferenceId") FROM stdin;
1	1	1	CHAIR	\N
\.


--
-- Data for Name: conferences; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.conferences (conference_id, conference_name, conference_start_date, conference_end_date, conference_venue, conference_description, short_description, contact_email, organizer_id, conference_deleted_at, conference_is_active) FROM stdin;
1	test 2026	2026-02-10 16:16:00+00	2026-03-10 16:16:00+00	Cs 3	asdsasa	\N	buivanhuy2706@gmail.com	1	\N	t
\.


--
-- Data for Name: track_members; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.track_members (track_member_id, track_id, user_id, track_member_status, track_member_created_at, track_member_updated_at, "trackId") FROM stdin;
1	1	3	ACCEPTED	2026-02-10 16:18:37.071867+00	2026-02-10 16:26:04.68364+00	1
\.


--
-- Data for Name: tracks; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.tracks (track_id, track_name, track_conference_id, track_description, track_created_at, track_updated_at, track_deleted_at, track_is_active, "conferenceId") FROM stdin;
1	AL	1	\N	2026-02-10 16:17:37.994354+00	2026-02-10 16:17:37.994354+00	\N	t	1
\.


--
-- Name: cfp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.cfp_settings_id_seq', 1, true);


--
-- Name: conference_members_conference_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.conference_members_conference_member_id_seq', 1, true);


--
-- Name: conferences_conference_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.conferences_conference_id_seq', 1, true);


--
-- Name: track_members_track_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.track_members_track_member_id_seq', 1, true);


--
-- Name: tracks_track_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.tracks_track_id_seq', 1, true);


--
-- Name: conferences PK_0a5691f16d32ffe9ecb9159ed58; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.conferences
    ADD CONSTRAINT "PK_0a5691f16d32ffe9ecb9159ed58" PRIMARY KEY (conference_id);


--
-- Name: cfp_settings PK_8e2b88add44ae30d9c476adf344; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cfp_settings
    ADD CONSTRAINT "PK_8e2b88add44ae30d9c476adf344" PRIMARY KEY (id);


--
-- Name: tracks PK_923d7025167d069f22123935afa; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tracks
    ADD CONSTRAINT "PK_923d7025167d069f22123935afa" PRIMARY KEY (track_id);


--
-- Name: conference_members PK_af9504cb3c4d024ef8d7eeeca83; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.conference_members
    ADD CONSTRAINT "PK_af9504cb3c4d024ef8d7eeeca83" PRIMARY KEY (conference_member_id);


--
-- Name: track_members PK_c47b65ce8f082288fbb2d3f0669; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.track_members
    ADD CONSTRAINT "PK_c47b65ce8f082288fbb2d3f0669" PRIMARY KEY (track_member_id);


--
-- Name: cfp_settings UQ_f892c3702667fe186ea609ec517; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cfp_settings
    ADD CONSTRAINT "UQ_f892c3702667fe186ea609ec517" UNIQUE (conference_id);


--
-- Name: tracks FK_142bb505e9cf3e848586e34caf7; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tracks
    ADD CONSTRAINT "FK_142bb505e9cf3e848586e34caf7" FOREIGN KEY ("conferenceId") REFERENCES public.conferences(conference_id) ON DELETE CASCADE;


--
-- Name: track_members FK_d939cde97837fb1e1b6265e3101; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.track_members
    ADD CONSTRAINT "FK_d939cde97837fb1e1b6265e3101" FOREIGN KEY ("trackId") REFERENCES public.tracks(track_id) ON DELETE CASCADE;


--
-- Name: conference_members FK_f43a1a1a8b391f95a2068f57cd5; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.conference_members
    ADD CONSTRAINT "FK_f43a1a1a8b391f95a2068f57cd5" FOREIGN KEY ("conferenceId") REFERENCES public.conferences(conference_id) ON DELETE CASCADE;


--
-- Name: cfp_settings FK_f892c3702667fe186ea609ec517; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cfp_settings
    ADD CONSTRAINT "FK_f892c3702667fe186ea609ec517" FOREIGN KEY (conference_id) REFERENCES public.conferences(conference_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dE012OkYruIU5hfmmyMNZYa26FWMZceVNoGvSgJcByFdLEj6asyz7OYjPf5NZGo

--
-- Database "db_identity" dump
--

--
-- PostgreSQL database dump
--

\restrict pj2vpBH3ZYcIrbZpdvRxzU1SgRQWaVlpCK5Ivd0D4tbhtTxpYWBOhepOGuFyVJR

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: db_identity; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE db_identity WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE db_identity OWNER TO admin;

\unrestrict pj2vpBH3ZYcIrbZpdvRxzU1SgRQWaVlpCK5Ivd0D4tbhtTxpYWBOhepOGuFyVJR
\connect db_identity
\restrict pj2vpBH3ZYcIrbZpdvRxzU1SgRQWaVlpCK5Ivd0D4tbhtTxpYWBOhepOGuFyVJR

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: roles_role_name_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.roles_role_name_enum AS ENUM (
    'ADMIN',
    'CHAIR',
    'AUTHOR',
    'REVIEWER',
    'PC_MEMBER'
);


ALTER TYPE public.roles_role_name_enum OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    token character varying(255) NOT NULL,
    email_verification_token_user_id integer NOT NULL,
    email_verification_token_expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    email_verification_token_created_at timestamp with time zone DEFAULT now() NOT NULL,
    "userId" integer
);


ALTER TABLE public.email_verification_tokens OWNER TO admin;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    token character varying(255) NOT NULL,
    user_id integer NOT NULL,
    password_reset_token_expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    password_reset_token_created_at timestamp with time zone DEFAULT now() NOT NULL,
    "userId" integer
);


ALTER TABLE public.password_reset_tokens OWNER TO admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    token character varying(255) NOT NULL,
    refresh_token_expiry_date timestamp with time zone NOT NULL,
    user_id integer NOT NULL,
    refresh_token_created_at timestamp with time zone DEFAULT now() NOT NULL,
    "userId" integer
);


ALTER TABLE public.refresh_tokens OWNER TO admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name public.roles_role_name_enum NOT NULL
);


ALTER TABLE public.roles OWNER TO admin;

--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_role_id_seq OWNER TO admin;

--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    user_email character varying(150) NOT NULL,
    user_full_name character varying(50) NOT NULL,
    user_is_verified boolean DEFAULT false NOT NULL,
    user_created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_deleted_at timestamp with time zone,
    user_is_active boolean DEFAULT true NOT NULL,
    user_password character varying(150) NOT NULL
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.email_verification_tokens (id, token, email_verification_token_user_id, email_verification_token_expires_at, used, email_verification_token_created_at, "userId") FROM stdin;
d2a3afc2-1381-4315-94ef-ff2069a5536d	801036	1	2026-02-10 16:29:25.501+00	t	2026-02-10 16:14:25.502492+00	\N
ee99e2d2-b22f-4e09-9089-0683a7bb17aa	816521	2	2026-02-10 16:33:49.941+00	t	2026-02-10 16:18:49.94229+00	\N
98682d6b-a5aa-4bf2-8d40-5b45b27d3b23	203243	3	2026-02-10 16:40:26.203+00	t	2026-02-10 16:25:26.204204+00	\N
d01fc660-8499-427e-8c55-e75c3591c011	940639	4	2026-03-09 15:37:06.473+00	f	2026-03-09 15:22:06.474206+00	\N
e7e5debd-9b56-4078-b5b6-87cf4224777c	994133	5	2026-03-18 01:21:50.218+00	f	2026-03-18 01:06:50.219557+00	\N
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.password_reset_tokens (id, token, user_id, password_reset_token_expires_at, used, password_reset_token_created_at, "userId") FROM stdin;
10d3f1da-c139-4aa9-a4be-048ae1df2b8f	544036	1	2026-03-21 03:08:33.316+00	t	2026-03-21 02:53:33.316747+00	\N
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.refresh_tokens (id, token, refresh_token_expiry_date, user_id, refresh_token_created_at, "userId") FROM stdin;
886e8224-c065-4e58-9329-873101ff51c3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoiYnVpdmFuaHV5MjcwNnRiQGdtYWlsLmNvbSIsImlhdCI6MTc3Mzg0NjQ0NywiZXhwIjoxNzc0NDUxMjQ3fQ.vajXbwYbUKMbzaTvrN7no0EOPmuH8cf1e0rKKVlCL54	2026-03-25 15:07:27.454+00	3	2026-03-18 15:07:27.455396+00	\N
aec4d9e8-481f-48af-87e4-a72a9f8abe00	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYnVpdmFuaHV5MjcwNkBnbWFpbC5jb20iLCJpYXQiOjE3NzQwNjE2MTUsImV4cCI6MTc3NDY2NjQxNX0.5E3CTOF24mLIN6RDXBhho9g2HM5bCpI6KXOehziFTLg	2026-03-28 02:53:35.071+00	1	2026-03-21 02:53:35.072988+00	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.roles (role_id, role_name) FROM stdin;
1	ADMIN
2	CHAIR
3	AUTHOR
4	REVIEWER
5	PC_MEMBER
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.user_roles (user_id, role_id) FROM stdin;
1	1
2	3
3	4
4	3
5	3
6	4
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (user_id, user_email, user_full_name, user_is_verified, user_created_at, user_updated_at, user_deleted_at, user_is_active, user_password) FROM stdin;
1	buivanhuy2706@gmail.com	Admin	t	2026-02-10 16:14:25.479426+00	2026-02-10 16:14:44.295509+00	\N	t	$2b$10$HIXetkkcZ8juqhpl.SnkAuCGykxggGzxQOQ7BTQmRDHhqXS634aiG
2	huybv1177@gmail.com	Sinh Viên	t	2026-02-10 16:17:55.846759+00	2026-02-10 16:19:30.867218+00	\N	t	$2b$10$/55asBsfy.5tqtuRv3QaBu2tuAEAM1zjA4FI0Why/DlIpZW45jzVi
3	buivanhuy2706tb@gmail.com	Review	t	2026-02-10 16:18:21.905362+00	2026-02-10 16:25:42.598142+00	\N	t	$2b$10$/C5xcKuIRU7n.in9Qr61zOjF0dG0G9EpzPKGJ9Yy9IJAHAQI2PYUa
4	huybv123@gmail.com	jsadnaskdnaskj	f	2026-03-09 15:22:06.436418+00	2026-03-18 00:49:49.261535+00	2026-03-18 00:49:49.258+00	f	$2b$10$nyiAyWhBz.l0JdOdOnWweunvbp8YC3Xt/Z3vOulzzpf1mOCEqKmRG
5	ble998180@gmail.com	Lê Thị Tuyết Băng	f	2026-03-18 01:06:50.203565+00	2026-03-18 01:06:50.203565+00	\N	t	$2b$10$yhZAspMh54BUfUKq85S15eoXiVV4KfGAMyC1MfsWTE6eHc/Oq8kBG
6	reviewer@example.com	Nguyễn Văn Reviewer	f	2026-03-21 02:53:34.045859+00	2026-03-21 02:53:34.045859+00	\N	t	$2b$10$k/yP20l2Re67ZbbdfCC0PO4teGnutkpUg.W5NenrXyNG/Z.YHHiZa
\.


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 5, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.users_user_id_seq', 6, true);


--
-- Name: roles PK_09f4c8130b54f35925588a37b6a; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_09f4c8130b54f35925588a37b6a" PRIMARY KEY (role_id);


--
-- Name: user_roles PK_23ed6f04fe43066df08379fd034; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY (user_id, role_id);


--
-- Name: email_verification_tokens PK_417a095bbed21c2369a6a01ab9a; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY (id);


--
-- Name: refresh_tokens PK_7d8bee0204106019488c4c50ffa; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY (id);


--
-- Name: users PK_96aac72f1574b88752e9fb00089; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY (user_id);


--
-- Name: password_reset_tokens PK_d16bebd73e844c48bca50ff8d3d; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY (id);


--
-- Name: email_verification_tokens UQ_3d1613f95c6a564a3b588d161ae; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT "UQ_3d1613f95c6a564a3b588d161ae" UNIQUE (token);


--
-- Name: refresh_tokens UQ_4542dd2f38a61354a040ba9fd57; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE (token);


--
-- Name: users UQ_643a0bfb9391001cf11e581bdd6; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_643a0bfb9391001cf11e581bdd6" UNIQUE (user_email);


--
-- Name: password_reset_tokens UQ_ab673f0e63eac966762155508ee; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE (token);


--
-- Name: roles UQ_ac35f51a0f17e3e1fe121126039; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_ac35f51a0f17e3e1fe121126039" UNIQUE (role_name);


--
-- Name: IDX_87b8888186ca9769c960e92687; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON public.user_roles USING btree (user_id);


--
-- Name: IDX_b23c65e50a758245a33ee35fda; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON public.user_roles USING btree (role_id);


--
-- Name: email_verification_tokens FK_10f285d038feb767bf7c2da14b3; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT "FK_10f285d038feb767bf7c2da14b3" FOREIGN KEY ("userId") REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: refresh_tokens FK_610102b60fea1455310ccd299de; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_roles FK_87b8888186ca9769c960e926870; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles FK_b23c65e50a758245a33ee35fda1; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- Name: password_reset_tokens FK_d6a19d4b4f6c62dcd29daa497e2; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2" FOREIGN KEY ("userId") REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict pj2vpBH3ZYcIrbZpdvRxzU1SgRQWaVlpCK5Ivd0D4tbhtTxpYWBOhepOGuFyVJR

--
-- Database "db_review" dump
--

--
-- PostgreSQL database dump
--

\restrict 7cbw4eVo5iZvyX4ifh70wIfQdRAIEjc2sqWcDa6tr11U3b7apKNdEfnQedafG1O

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: db_review; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE db_review WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE db_review OWNER TO admin;

\unrestrict 7cbw4eVo5iZvyX4ifh70wIfQdRAIEjc2sqWcDa6tr11U3b7apKNdEfnQedafG1O
\connect db_review
\restrict 7cbw4eVo5iZvyX4ifh70wIfQdRAIEjc2sqWcDa6tr11U3b7apKNdEfnQedafG1O

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: assignments_assignment_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.assignments_assignment_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'COMPLETED'
);


ALTER TYPE public.assignments_assignment_status_enum OWNER TO admin;

--
-- Name: decisions_decision_value_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.decisions_decision_value_enum AS ENUM (
    'ACCEPT',
    'REJECT',
    'BORDERLINE'
);


ALTER TYPE public.decisions_decision_value_enum OWNER TO admin;

--
-- Name: review_preferences_preference_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.review_preferences_preference_enum AS ENUM (
    'INTERESTED',
    'MAYBE',
    'CONFLICT',
    'NOT_INTERESTED'
);


ALTER TYPE public.review_preferences_preference_enum OWNER TO admin;

--
-- Name: reviews_review_confidence_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.reviews_review_confidence_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public.reviews_review_confidence_enum OWNER TO admin;

--
-- Name: reviews_review_recommendation_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.reviews_review_recommendation_enum AS ENUM (
    'ACCEPT',
    'WEAK_ACCEPT',
    'REJECT',
    'WEAK_REJECT'
);


ALTER TYPE public.reviews_review_recommendation_enum OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.assignments (
    assignment_id integer NOT NULL,
    assignment_reviewer_id integer NOT NULL,
    assignment_submission_id uuid NOT NULL,
    assignment_conference_id integer,
    assignment_status public.assignments_assignment_status_enum DEFAULT 'PENDING'::public.assignments_assignment_status_enum NOT NULL,
    assignment_assigned_by integer NOT NULL,
    assignment_due_date timestamp with time zone,
    assignment_created_at timestamp with time zone DEFAULT now() NOT NULL,
    assignment_updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assignments OWNER TO admin;

--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assignments_assignment_id_seq OWNER TO admin;

--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.assignments_assignment_id_seq OWNED BY public.assignments.assignment_id;


--
-- Name: decisions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.decisions (
    decision_id integer NOT NULL,
    decision_submission_id uuid NOT NULL,
    decision_conference_id integer,
    decision_value public.decisions_decision_value_enum NOT NULL,
    decision_decided_by integer NOT NULL,
    decision_note text,
    decision_decided_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.decisions OWNER TO admin;

--
-- Name: decisions_decision_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.decisions_decision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.decisions_decision_id_seq OWNER TO admin;

--
-- Name: decisions_decision_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.decisions_decision_id_seq OWNED BY public.decisions.decision_id;


--
-- Name: pc_discussions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.pc_discussions (
    pc_discussion_id integer NOT NULL,
    pc_discussion_submission_id uuid NOT NULL,
    pc_discussion_conference_id integer,
    pc_discussion_user_id integer NOT NULL,
    pc_discussion_message text NOT NULL,
    pc_discussion_created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pc_discussions OWNER TO admin;

--
-- Name: pc_discussions_pc_discussion_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.pc_discussions_pc_discussion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pc_discussions_pc_discussion_id_seq OWNER TO admin;

--
-- Name: pc_discussions_pc_discussion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.pc_discussions_pc_discussion_id_seq OWNED BY public.pc_discussions.pc_discussion_id;


--
-- Name: rebuttals; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rebuttals (
    rebuttal_id integer NOT NULL,
    rebuttal_submission_id uuid NOT NULL,
    rebuttal_author_id integer NOT NULL,
    rebuttal_conference_id integer,
    rebuttal_message text NOT NULL,
    rebuttal_created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rebuttals OWNER TO admin;

--
-- Name: rebuttals_rebuttal_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.rebuttals_rebuttal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rebuttals_rebuttal_id_seq OWNER TO admin;

--
-- Name: rebuttals_rebuttal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.rebuttals_rebuttal_id_seq OWNED BY public.rebuttals.rebuttal_id;


--
-- Name: review_preferences; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.review_preferences (
    review_preference_id integer NOT NULL,
    review_preference_reviewer_id integer NOT NULL,
    review_preference_submission_id uuid NOT NULL,
    review_preference_conference_id integer,
    preference public.review_preferences_preference_enum DEFAULT 'MAYBE'::public.review_preferences_preference_enum NOT NULL,
    review_preference_created_at timestamp with time zone DEFAULT now() NOT NULL,
    review_preference_updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.review_preferences OWNER TO admin;

--
-- Name: review_preferences_review_preference_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.review_preferences_review_preference_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.review_preferences_review_preference_id_seq OWNER TO admin;

--
-- Name: review_preferences_review_preference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.review_preferences_review_preference_id_seq OWNED BY public.review_preferences.review_preference_id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.reviews (
    review_id integer NOT NULL,
    review_assignment_id integer NOT NULL,
    review_conference_id integer,
    review_score integer NOT NULL,
    review_confidence public.reviews_review_confidence_enum DEFAULT 'MEDIUM'::public.reviews_review_confidence_enum NOT NULL,
    review_comment_for_author text,
    review_comment_for_pc text,
    review_recommendation public.reviews_review_recommendation_enum NOT NULL,
    review_created_at timestamp with time zone DEFAULT now() NOT NULL,
    review_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "assignmentId" integer
);


ALTER TABLE public.reviews OWNER TO admin;

--
-- Name: reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_review_id_seq OWNER TO admin;

--
-- Name: reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.reviews_review_id_seq OWNED BY public.reviews.review_id;


--
-- Name: assignments assignment_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.assignments_assignment_id_seq'::regclass);


--
-- Name: decisions decision_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.decisions ALTER COLUMN decision_id SET DEFAULT nextval('public.decisions_decision_id_seq'::regclass);


--
-- Name: pc_discussions pc_discussion_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pc_discussions ALTER COLUMN pc_discussion_id SET DEFAULT nextval('public.pc_discussions_pc_discussion_id_seq'::regclass);


--
-- Name: rebuttals rebuttal_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rebuttals ALTER COLUMN rebuttal_id SET DEFAULT nextval('public.rebuttals_rebuttal_id_seq'::regclass);


--
-- Name: review_preferences review_preference_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.review_preferences ALTER COLUMN review_preference_id SET DEFAULT nextval('public.review_preferences_review_preference_id_seq'::regclass);


--
-- Name: reviews review_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reviews ALTER COLUMN review_id SET DEFAULT nextval('public.reviews_review_id_seq'::regclass);


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.assignments (assignment_id, assignment_reviewer_id, assignment_submission_id, assignment_conference_id, assignment_status, assignment_assigned_by, assignment_due_date, assignment_created_at, assignment_updated_at) FROM stdin;
1	3	9b72fc9a-00cd-480c-8630-2a9890b9590b	1	ACCEPTED	3	\N	2026-02-10 16:26:21.479262+00	2026-02-10 16:26:21.479262+00
2	3	d79b6016-2768-4402-87b3-ed3bf4bb6402	1	ACCEPTED	3	\N	2026-02-23 03:03:27.759098+00	2026-02-23 03:03:27.759098+00
3	3	1443d904-5785-488e-9cef-aa5d61c0117d	1	COMPLETED	3	\N	2026-03-09 02:42:55.235135+00	2026-03-09 02:56:02.810935+00
4	3	b5adfe18-cdbc-4b33-9e9e-8e642ba37c92	1	COMPLETED	3	\N	2026-03-18 14:43:02.442778+00	2026-03-18 14:43:36.181124+00
\.


--
-- Data for Name: decisions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.decisions (decision_id, decision_submission_id, decision_conference_id, decision_value, decision_decided_by, decision_note, decision_decided_at) FROM stdin;
\.


--
-- Data for Name: pc_discussions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.pc_discussions (pc_discussion_id, pc_discussion_submission_id, pc_discussion_conference_id, pc_discussion_user_id, pc_discussion_message, pc_discussion_created_at) FROM stdin;
\.


--
-- Data for Name: rebuttals; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.rebuttals (rebuttal_id, rebuttal_submission_id, rebuttal_author_id, rebuttal_conference_id, rebuttal_message, rebuttal_created_at) FROM stdin;
\.


--
-- Data for Name: review_preferences; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.review_preferences (review_preference_id, review_preference_reviewer_id, review_preference_submission_id, review_preference_conference_id, preference, review_preference_created_at, review_preference_updated_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.reviews (review_id, review_assignment_id, review_conference_id, review_score, review_confidence, review_comment_for_author, review_comment_for_pc, review_recommendation, review_created_at, review_updated_at, "assignmentId") FROM stdin;
1	3	1	10	MEDIUM	Tốt	\N	ACCEPT	2026-03-09 02:56:02.797214+00	2026-03-09 02:56:02.797214+00	\N
2	4	1	5	MEDIUM	sadsad	\N	ACCEPT	2026-03-18 14:43:36.166304+00	2026-03-18 14:43:36.166304+00	\N
\.


--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.assignments_assignment_id_seq', 4, true);


--
-- Name: decisions_decision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.decisions_decision_id_seq', 1, false);


--
-- Name: pc_discussions_pc_discussion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.pc_discussions_pc_discussion_id_seq', 1, false);


--
-- Name: rebuttals_rebuttal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.rebuttals_rebuttal_id_seq', 1, false);


--
-- Name: review_preferences_review_preference_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.review_preferences_review_preference_id_seq', 1, false);


--
-- Name: reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.reviews_review_id_seq', 2, true);


--
-- Name: review_preferences PK_68b73a98f7310dc7e5a78e0e15e; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.review_preferences
    ADD CONSTRAINT "PK_68b73a98f7310dc7e5a78e0e15e" PRIMARY KEY (review_preference_id);


--
-- Name: decisions PK_72dc066f53e2a393ba2fabe8d67; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT "PK_72dc066f53e2a393ba2fabe8d67" PRIMARY KEY (decision_id);


--
-- Name: pc_discussions PK_8bed6c08195d3ac541a9cfe562b; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pc_discussions
    ADD CONSTRAINT "PK_8bed6c08195d3ac541a9cfe562b" PRIMARY KEY (pc_discussion_id);


--
-- Name: rebuttals PK_ae8e48ed1162d983a4e8a73e490; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rebuttals
    ADD CONSTRAINT "PK_ae8e48ed1162d983a4e8a73e490" PRIMARY KEY (rebuttal_id);


--
-- Name: reviews PK_bfe951d9dca4ba99674c5772905; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "PK_bfe951d9dca4ba99674c5772905" PRIMARY KEY (review_id);


--
-- Name: assignments PK_d6c1d70f2bb5464c5b3a5269bb9; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "PK_d6c1d70f2bb5464c5b3a5269bb9" PRIMARY KEY (assignment_id);


--
-- Name: reviews REL_e218628c6582d1ed56f7a9b301; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "REL_e218628c6582d1ed56f7a9b301" UNIQUE ("assignmentId");


--
-- Name: decisions UQ_27c25829f4b0ebb09b7e7fe3bcf; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT "UQ_27c25829f4b0ebb09b7e7fe3bcf" UNIQUE (decision_submission_id);


--
-- Name: reviews UQ_bad27d788e2d09ca7333299b5e5; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "UQ_bad27d788e2d09ca7333299b5e5" UNIQUE (review_assignment_id);


--
-- Name: review_preferences UQ_c9591dded48c8efe96d880f629a; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.review_preferences
    ADD CONSTRAINT "UQ_c9591dded48c8efe96d880f629a" UNIQUE (review_preference_reviewer_id, review_preference_submission_id);


--
-- Name: reviews FK_e218628c6582d1ed56f7a9b3016; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_e218628c6582d1ed56f7a9b3016" FOREIGN KEY ("assignmentId") REFERENCES public.assignments(assignment_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 7cbw4eVo5iZvyX4ifh70wIfQdRAIEjc2sqWcDa6tr11U3b7apKNdEfnQedafG1O

--
-- Database "db_submission" dump
--

--
-- PostgreSQL database dump
--

\restrict zkp4AENkO6kjOjwBp7MzsshgiDjo9XAfvTzVsQBjJpVTxciKFlw4uCU8OWXyIgF

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: db_submission; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE db_submission WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE db_submission OWNER TO admin;

\unrestrict zkp4AENkO6kjOjwBp7MzsshgiDjo9XAfvTzVsQBjJpVTxciKFlw4uCU8OWXyIgF
\connect db_submission
\restrict zkp4AENkO6kjOjwBp7MzsshgiDjo9XAfvTzVsQBjJpVTxciKFlw4uCU8OWXyIgF

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: submissions_submission_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.submissions_submission_status_enum AS ENUM (
    'SUBMITTED',
    'REVIEWING',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
    'CAMERA_READY'
);


ALTER TYPE public.submissions_submission_status_enum OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: submission_versions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.submission_versions (
    submission_version_id integer NOT NULL,
    submission_version_submission_id uuid NOT NULL,
    submission_version_number integer NOT NULL,
    submission_version_title character varying(500) NOT NULL,
    submission_version_abstract text NOT NULL,
    submission_version_file_url text NOT NULL,
    submission_version_keywords character varying(500),
    submission_version_created_at timestamp with time zone DEFAULT now() NOT NULL,
    "submissionId" uuid
);


ALTER TABLE public.submission_versions OWNER TO admin;

--
-- Name: submission_versions_submission_version_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.submission_versions_submission_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.submission_versions_submission_version_id_seq OWNER TO admin;

--
-- Name: submission_versions_submission_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.submission_versions_submission_version_id_seq OWNED BY public.submission_versions.submission_version_id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    submission_title character varying(500) NOT NULL,
    submission_abstract text NOT NULL,
    submission_keywords character varying(500),
    submission_file_url text NOT NULL,
    submission_status public.submissions_submission_status_enum DEFAULT 'SUBMITTED'::public.submissions_submission_status_enum NOT NULL,
    submission_author_id integer NOT NULL,
    submission_author_name character varying(255),
    submission_author_affiliation character varying(255),
    submission_track_id integer NOT NULL,
    submission_conference_id integer NOT NULL,
    submission_co_authors jsonb,
    submission_camera_ready_file_url text,
    submission_created_at timestamp with time zone DEFAULT now() NOT NULL,
    submission_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    submission_submitted_at timestamp with time zone,
    submission_deleted_at timestamp with time zone,
    submission_is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.submissions OWNER TO admin;

--
-- Name: submission_versions submission_version_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.submission_versions ALTER COLUMN submission_version_id SET DEFAULT nextval('public.submission_versions_submission_version_id_seq'::regclass);


--
-- Data for Name: submission_versions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.submission_versions (submission_version_id, submission_version_submission_id, submission_version_number, submission_version_title, submission_version_abstract, submission_version_file_url, submission_version_keywords, submission_version_created_at, "submissionId") FROM stdin;
1	9b72fc9a-00cd-480c-8630-2a9890b9590b	1	Bài tập Docker	Docker giúp chúng ta đóng gói	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1770740708825-2e7b4778-080b-4638-a211-4535d7565f6e.pdf	dsada	2026-02-10 16:25:08.825432+00	\N
2	9b72fc9a-00cd-480c-8630-2a9890b9590b	2	Bài tập Docker	Docker giúp chúng ta đóng gói	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1770740708825-2e7b4778-080b-4638-a211-4535d7565f6e.pdf	dsada	2026-02-10 16:47:06.524375+00	\N
3	d79b6016-2768-4402-87b3-ed3bf4bb6402	1	Phát hiện và phân loại biển báo giao thông trong điều kiện thời tiết xấu sử dụng mô hình YOLOv9 cải tiến.	Nghiên cứu này đề xuất một giải pháp cải tiến mô hình YOLOv9 nhằm nâng cao độ chính xác trong việc nhận diện và phân loại biển báo giao thông tại Việt Nam dưới các điều kiện thời tiết bất lợi (mưa rào, sương mù, sương mù dày đặc). Bằng cách tích hợp thêm module Attention và kỹ thuật Data Augmentation đa dạng, mô hình đạt độ chính xác (mAP) lên tới 96.5% trên tập dữ liệu tự thu thập, vượt trội hơn 8% so với mô hình YOLOv8 gốc. Kết quả này mở ra tiềm năng lớn cho các hệ thống hỗ trợ lái xe nâng cao (ADAS) tại Việt Nam.	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1771815787642-1d9fca1e-a9fe-416a-8a54-1ce83a74086c.pdf	YOLOv9, Traffic Sign Recognition, Deep Learning, ADAS, Computer Vision	2026-02-23 03:03:07.641839+00	\N
4	1443d904-5785-488e-9cef-aa5d61c0117d	1	Scaling Microservices Architecture in Academic Conference Management Systems.	This paper presents a novel approach to designing and deploying a microservices-based conference management system. Utilizing NestJS, API Gateway, and PostgreSQL isolation, we demonstrate significant improvements in scalability, fault tolerance, and system performance during peak submission periods. The results show a 40% decrease in API latency compared to monolithic architectures.	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1773024149789-3e40b922-967c-46bf-9eac-6a943d8becb8.pdf	Microservices, NestJS, Distributed Systems, Software Architecture.	2026-03-09 02:42:29.788411+00	\N
5	b5adfe18-cdbc-4b33-9e9e-8e642ba37c92	1	dasdas	đâsdasd	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1773844911585-e8e9426a-52c0-4a24-a5d2-d41c119cd0a8.pdf	ádasdas	2026-03-18 14:41:51.584384+00	\N
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.submissions (id, submission_title, submission_abstract, submission_keywords, submission_file_url, submission_status, submission_author_id, submission_author_name, submission_author_affiliation, submission_track_id, submission_conference_id, submission_co_authors, submission_camera_ready_file_url, submission_created_at, submission_updated_at, submission_submitted_at, submission_deleted_at, submission_is_active) FROM stdin;
9b72fc9a-00cd-480c-8630-2a9890b9590b	Bài tập Docker	Docker giúp chúng ta đóng gói ứng dụng vào một thùng chứa, giúp người khác lấy code về, build và cài đặt, biến nó thành một ứng dụng có thể chạy được mà không cần cài đặt quá nhiều thư viện phức tạp.	dsada	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1770740708825-2e7b4778-080b-4638-a211-4535d7565f6e.pdf	WITHDRAWN	2	Sinh Viên	ádsadsa	1	1	\N	\N	2026-02-10 16:25:08.825432+00	2026-02-23 03:01:11.832969+00	2026-02-10 16:47:06.586+00	\N	t
d79b6016-2768-4402-87b3-ed3bf4bb6402	Phát hiện và phân loại biển báo giao thông trong điều kiện thời tiết xấu sử dụng mô hình YOLOv9 cải tiến.	Nghiên cứu này đề xuất một giải pháp cải tiến mô hình YOLOv9 nhằm nâng cao độ chính xác trong việc nhận diện và phân loại biển báo giao thông tại Việt Nam dưới các điều kiện thời tiết bất lợi (mưa rào, sương mù, sương mù dày đặc). Bằng cách tích hợp thêm module Attention và kỹ thuật Data Augmentation đa dạng, mô hình đạt độ chính xác (mAP) lên tới 96.5% trên tập dữ liệu tự thu thập, vượt trội hơn 8% so với mô hình YOLOv8 gốc. Kết quả này mở ra tiềm năng lớn cho các hệ thống hỗ trợ lái xe nâng cao (ADAS) tại Việt Nam.	YOLOv9, Traffic Sign Recognition, Deep Learning, ADAS, Computer Vision	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1771815787642-1d9fca1e-a9fe-416a-8a54-1ce83a74086c.pdf	WITHDRAWN	2	Sinh Viên	Đại học Giao thông Vận tải TP.HCM (UTH)	1	1	\N	\N	2026-02-23 03:03:07.641839+00	2026-03-09 02:39:01.577368+00	2026-02-23 03:03:08.982+00	\N	t
b5adfe18-cdbc-4b33-9e9e-8e642ba37c92	dasdas	đâsdasd	ádasdas	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1773844911585-e8e9426a-52c0-4a24-a5d2-d41c119cd0a8.pdf	REJECTED	2	Sinh Viên	đâsdsa	1	1	\N	\N	2026-03-18 14:41:51.584384+00	2026-03-18 14:44:07.790148+00	2026-03-18 14:41:53.24+00	\N	t
1443d904-5785-488e-9cef-aa5d61c0117d	Scaling Microservices Architecture in Academic Conference Management Systems.	This paper presents a novel approach to designing and deploying a microservices-based conference management system. Utilizing NestJS, API Gateway, and PostgreSQL isolation, we demonstrate significant improvements in scalability, fault tolerance, and system performance during peak submission periods. The results show a 40% decrease in API latency compared to monolithic architectures.	Microservices, NestJS, Distributed Systems, Software Architecture.	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1773024149789-3e40b922-967c-46bf-9eac-6a943d8becb8.pdf	CAMERA_READY	2	Sinh Viên	Ho Chi Minh City University of Transport (UTH)	1	1	\N	https://plqynycfvwpgycvikefx.supabase.co/storage/v1/object/public/submissions/1773025044902-8259fb93-cb8b-42c7-b589-455880010f09.pdf	2026-03-09 02:42:29.788411+00	2026-03-09 02:57:27.984923+00	2026-03-09 02:42:32.783+00	\N	t
\.


--
-- Name: submission_versions_submission_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.submission_versions_submission_version_id_seq', 5, true);


--
-- Name: submissions PK_10b3be95b8b2fb1e482e07d706b; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY (id);


--
-- Name: submission_versions PK_9c18725ba3a26fc0222db510479; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.submission_versions
    ADD CONSTRAINT "PK_9c18725ba3a26fc0222db510479" PRIMARY KEY (submission_version_id);


--
-- Name: submission_versions FK_6071314ee6dbce9b1e04566d85c; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.submission_versions
    ADD CONSTRAINT "FK_6071314ee6dbce9b1e04566d85c" FOREIGN KEY ("submissionId") REFERENCES public.submissions(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict zkp4AENkO6kjOjwBp7MzsshgiDjo9XAfvTzVsQBjJpVTxciKFlw4uCU8OWXyIgF

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict KA7HS6cundck1Rc6S7ptyOckYcA3MhZLQQw6jQeCz75ei2BdvC3AoPXAvudtHVi

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict KA7HS6cundck1Rc6S7ptyOckYcA3MhZLQQw6jQeCz75ei2BdvC3AoPXAvudtHVi

--
-- PostgreSQL database cluster dump complete
--

