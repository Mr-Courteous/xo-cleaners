--
-- PostgreSQL database dump
--

\restrict dlfSxUXzYvRGhYZrEoiM3ZQbTUbmBlmP5iwVqpRpqUhF3dcfOW67yY6f2Rffdnt

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

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

ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_transferred_to_org_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_items DROP CONSTRAINT IF EXISTS ticket_items_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_items DROP CONSTRAINT IF EXISTS ticket_items_clothing_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_feedback DROP CONSTRAINT IF EXISTS ticket_feedback_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.racks DROP CONSTRAINT IF EXISTS racks_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_parent_org_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS fk_tickets_organization;
ALTER TABLE IF EXISTS ONLY public.ticket_items DROP CONSTRAINT IF EXISTS fk_ticket_items_organization;
ALTER TABLE IF EXISTS ONLY public.clothing_types DROP CONSTRAINT IF EXISTS fk_racks_organization;
ALTER TABLE IF EXISTS ONLY public.racks DROP CONSTRAINT IF EXISTS fk_racks_organization;
ALTER TABLE IF EXISTS ONLY public.customer_payment_methods DROP CONSTRAINT IF EXISTS customer_payment_methods_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_coupons DROP CONSTRAINT IF EXISTS customer_coupons_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branch_payment_methods DROP CONSTRAINT IF EXISTS branch_payment_methods_branch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.allusers DROP CONSTRAINT IF EXISTS allusers_organization_id_fkey;
DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.idx_tickets_transfer_to;
DROP INDEX IF EXISTS public.idx_tickets_transfer_rack;
DROP INDEX IF EXISTS public.idx_ticket_items_org_id;
DROP INDEX IF EXISTS public.idx_audit_org;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS uq_ticket_number_org_id;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_pkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_org_id_ticket_number_key;
ALTER TABLE IF EXISTS ONLY public.ticket_items DROP CONSTRAINT IF EXISTS ticket_items_pkey;
ALTER TABLE IF EXISTS ONLY public.ticket_feedback DROP CONSTRAINT IF EXISTS ticket_feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.tag_configurations DROP CONSTRAINT IF EXISTS tag_configurations_pkey;
ALTER TABLE IF EXISTS ONLY public.racks DROP CONSTRAINT IF EXISTS racks_unique_per_org;
ALTER TABLE IF EXISTS ONLY public.racks DROP CONSTRAINT IF EXISTS racks_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_admins DROP CONSTRAINT IF EXISTS platform_admins_uuid_key;
ALTER TABLE IF EXISTS ONLY public.platform_admins DROP CONSTRAINT IF EXISTS platform_admins_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_admins DROP CONSTRAINT IF EXISTS platform_admins_email_key;
ALTER TABLE IF EXISTS ONLY public.pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_pkey;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_owner_email_key;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_name_key;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_connection_code_key;
ALTER TABLE IF EXISTS ONLY public.organization_settings DROP CONSTRAINT IF EXISTS organization_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE IF EXISTS ONLY public.customer_payment_methods DROP CONSTRAINT IF EXISTS customer_payment_methods_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_coupons DROP CONSTRAINT IF EXISTS customer_coupons_pkey;
ALTER TABLE IF EXISTS ONLY public.clothing_types DROP CONSTRAINT IF EXISTS clothing_types_pkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_pkey;
ALTER TABLE IF EXISTS ONLY public.branch_payment_methods DROP CONSTRAINT IF EXISTS branch_payment_methods_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.allusers DROP CONSTRAINT IF EXISTS allusers_pkey;
ALTER TABLE IF EXISTS ONLY public.allusers DROP CONSTRAINT IF EXISTS allusers_email_key;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tickets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ticket_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ticket_feedback ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.racks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.platform_admins ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pickup_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.organizations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customer_payment_methods ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customer_coupons ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clothing_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.branches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.allusers ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.tickets_id_seq;
DROP TABLE IF EXISTS public.tickets;
DROP SEQUENCE IF EXISTS public.ticket_items_id_seq;
DROP TABLE IF EXISTS public.ticket_items;
DROP SEQUENCE IF EXISTS public.ticket_feedback_id_seq;
DROP TABLE IF EXISTS public.ticket_feedback;
DROP TABLE IF EXISTS public.tag_configurations;
DROP SEQUENCE IF EXISTS public.racks_id_seq;
DROP TABLE IF EXISTS public.racks;
DROP SEQUENCE IF EXISTS public.platform_admins_id_seq;
DROP TABLE IF EXISTS public.platform_admins;
DROP SEQUENCE IF EXISTS public.pickup_requests_id_seq;
DROP TABLE IF EXISTS public.pickup_requests;
DROP SEQUENCE IF EXISTS public.organizations_id_seq;
DROP TABLE IF EXISTS public.organizations;
DROP TABLE IF EXISTS public.organization_settings;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.customer_payment_methods_id_seq;
DROP TABLE IF EXISTS public.customer_payment_methods;
DROP SEQUENCE IF EXISTS public.customer_coupons_id_seq;
DROP TABLE IF EXISTS public.customer_coupons;
DROP SEQUENCE IF EXISTS public.clothing_types_id_seq;
DROP TABLE IF EXISTS public.clothing_types;
DROP SEQUENCE IF EXISTS public.branches_id_seq;
DROP TABLE IF EXISTS public.branches;
DROP TABLE IF EXISTS public.branch_payment_methods;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.allusers_id_seq;
DROP TABLE IF EXISTS public.allusers;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: allusers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allusers (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    email character varying(255),
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    uuid uuid DEFAULT gen_random_uuid(),
    address text,
    phone character varying(25),
    joined_at timestamp with time zone,
    is_deactivated boolean DEFAULT false,
    loyalty_points integer DEFAULT 0,
    referral_code character varying(50),
    marketing_opt_in boolean DEFAULT false,
    is_paused boolean DEFAULT false,
    dob date
);


ALTER TABLE public.allusers OWNER TO postgres;

--
-- Name: allusers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.allusers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.allusers_id_seq OWNER TO postgres;

--
-- Name: allusers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.allusers_id_seq OWNED BY public.allusers.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    actor_id integer NOT NULL,
    actor_name character varying(255),
    actor_role character varying(50),
    action character varying(100) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ticket_id integer,
    customer_id integer
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: branch_payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch_payment_methods (
    branch_id integer NOT NULL,
    payment_method character varying(50) NOT NULL,
    is_enabled boolean DEFAULT true
);


ALTER TABLE public.branch_payment_methods OWNER TO postgres;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    name character varying(100) NOT NULL,
    address text NOT NULL,
    phone character varying(20),
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    location_type character varying(20),
    is_plant boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT branches_location_type_check CHECK (((location_type)::text = ANY ((ARRAY['Plant'::character varying, 'Drop-off'::character varying])::text[])))
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.branches_id_seq OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: clothing_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clothing_types (
    id integer NOT NULL,
    name text NOT NULL,
    plant_price numeric(10,2) NOT NULL,
    margin numeric(10,2) NOT NULL,
    total_price numeric(10,2) GENERATED ALWAYS AS ((plant_price + margin)) STORED,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url text,
    organization_id integer,
    pieces integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.clothing_types OWNER TO postgres;

--
-- Name: clothing_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clothing_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.clothing_types_id_seq OWNER TO postgres;

--
-- Name: clothing_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clothing_types_id_seq OWNED BY public.clothing_types.id;


--
-- Name: customer_coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_coupons (
    id integer NOT NULL,
    customer_id integer,
    code character varying(50) NOT NULL,
    description text,
    discount_amount numeric(10,2),
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_coupons OWNER TO postgres;

--
-- Name: customer_coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_coupons_id_seq OWNER TO postgres;

--
-- Name: customer_coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_coupons_id_seq OWNED BY public.customer_coupons.id;


--
-- Name: customer_payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_payment_methods (
    id integer NOT NULL,
    customer_id integer,
    provider character varying(50) NOT NULL,
    token_id character varying(255) NOT NULL,
    last_four character varying(4),
    card_type character varying(20),
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_payment_methods OWNER TO postgres;

--
-- Name: customer_payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_payment_methods_id_seq OWNER TO postgres;

--
-- Name: customer_payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_payment_methods_id_seq OWNED BY public.customer_payment_methods.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    address text,
    last_visit_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: organization_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_settings (
    organization_id integer NOT NULL,
    primary_color character varying(7) DEFAULT '#000000'::character varying,
    secondary_color character varying(7) DEFAULT '#ffffff'::character varying,
    logo_url text,
    receipt_header text,
    receipt_footer text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    starch_price_light numeric(10,2) DEFAULT 0.00,
    starch_price_medium numeric(10,2) DEFAULT 0.00,
    starch_price_heavy numeric(10,2) DEFAULT 0.00,
    starch_price_extra_heavy numeric(10,2) DEFAULT 0.00,
    size_price_s numeric(10,2) DEFAULT 0.00,
    size_price_m numeric(10,2) DEFAULT 0.00,
    size_price_l numeric(10,2) DEFAULT 0.00,
    size_price_xl numeric(10,2) DEFAULT 0.00,
    size_price_xxl numeric(10,2) DEFAULT 0.00
);


ALTER TABLE public.organization_settings OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    industry character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    owner_first_name character varying(100),
    owner_last_name character varying(100),
    owner_email character varying(255),
    owner_password_hash text,
    role character varying(50) DEFAULT 'store_owner'::character varying,
    is_active boolean DEFAULT true,
    phone character varying(50),
    address text,
    org_type character varying(50) DEFAULT 'full_store'::character varying,
    parent_org_id integer,
    connection_code character varying(20)
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organizations_id_seq OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: pickup_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pickup_requests (
    id integer NOT NULL,
    customer_id integer,
    address_id integer,
    requested_date timestamp without time zone NOT NULL,
    notes text,
    is_recurring boolean DEFAULT false,
    recurrence_rule character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pickup_requests OWNER TO postgres;

--
-- Name: pickup_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pickup_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pickup_requests_id_seq OWNER TO postgres;

--
-- Name: pickup_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pickup_requests_id_seq OWNED BY public.pickup_requests.id;


--
-- Name: platform_admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_admins (
    id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    full_name character varying(150) NOT NULL,
    email character varying(120) NOT NULL,
    password_hash text NOT NULL,
    role character varying(50) DEFAULT 'platform_admin'::character varying,
    is_super_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone
);


ALTER TABLE public.platform_admins OWNER TO postgres;

--
-- Name: platform_admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platform_admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.platform_admins_id_seq OWNER TO postgres;

--
-- Name: platform_admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platform_admins_id_seq OWNED BY public.platform_admins.id;


--
-- Name: racks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.racks (
    id integer NOT NULL,
    number integer NOT NULL,
    is_occupied boolean DEFAULT false,
    ticket_id integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    organization_id integer
);


ALTER TABLE public.racks OWNER TO postgres;

--
-- Name: racks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.racks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.racks_id_seq OWNER TO postgres;

--
-- Name: racks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.racks_id_seq OWNED BY public.racks.id;


--
-- Name: tag_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tag_configurations (
    organization_id integer NOT NULL,
    tag_type character varying(50),
    start_sequence integer DEFAULT 1,
    current_sequence integer DEFAULT 1,
    printer_name character varying(100),
    CONSTRAINT tag_configurations_tag_type_check CHECK (((tag_type)::text = ANY ((ARRAY['Heat Press'::character varying, 'Paper'::character varying, 'Internal'::character varying])::text[])))
);


ALTER TABLE public.tag_configurations OWNER TO postgres;

--
-- Name: ticket_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_feedback (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    customer_id integer,
    rating integer,
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ticket_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ticket_feedback OWNER TO postgres;

--
-- Name: ticket_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ticket_feedback_id_seq OWNER TO postgres;

--
-- Name: ticket_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_feedback_id_seq OWNED BY public.ticket_feedback.id;


--
-- Name: ticket_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_items (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    clothing_type_id integer,
    quantity integer NOT NULL,
    starch_level text DEFAULT 'no_starch'::text,
    crease text DEFAULT 'no_crease'::text,
    item_total numeric(10,2) NOT NULL,
    plant_price numeric(10,2) DEFAULT 0 NOT NULL,
    margin numeric(10,2) DEFAULT 0 NOT NULL,
    organization_id integer,
    alterations text,
    item_instructions text,
    additional_charge numeric(10,2) DEFAULT 0.00,
    alteration_behavior character varying(50) DEFAULT 'none'::character varying,
    instruction_charge numeric(10,2) DEFAULT 0.00,
    custom_name character varying(255),
    starch_charge numeric(10,2) DEFAULT 0.00,
    clothing_size character varying(50) DEFAULT 'standard'::character varying,
    size_charge numeric(10,2) DEFAULT 0.00
);


ALTER TABLE public.ticket_items OWNER TO postgres;

--
-- Name: ticket_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ticket_items_id_seq OWNER TO postgres;

--
-- Name: ticket_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_items_id_seq OWNED BY public.ticket_items.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    ticket_number text NOT NULL,
    customer_id integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status text DEFAULT 'in_process'::text,
    rack_number character varying(50),
    special_instructions text,
    pickup_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_amount numeric,
    is_void boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now(),
    is_refunded boolean DEFAULT false NOT NULL,
    organization_id integer,
    transferred_to_org_id integer,
    transfer_status character varying(50) DEFAULT 'at_origin'::character varying,
    transferred_at timestamp with time zone,
    transfer_rack_number character varying(50) DEFAULT NULL::character varying
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    email text,
    role text DEFAULT 'user'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: allusers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allusers ALTER COLUMN id SET DEFAULT nextval('public.allusers_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: clothing_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clothing_types ALTER COLUMN id SET DEFAULT nextval('public.clothing_types_id_seq'::regclass);


--
-- Name: customer_coupons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_coupons ALTER COLUMN id SET DEFAULT nextval('public.customer_coupons_id_seq'::regclass);


--
-- Name: customer_payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_payment_methods ALTER COLUMN id SET DEFAULT nextval('public.customer_payment_methods_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: pickup_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_requests ALTER COLUMN id SET DEFAULT nextval('public.pickup_requests_id_seq'::regclass);


--
-- Name: platform_admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins ALTER COLUMN id SET DEFAULT nextval('public.platform_admins_id_seq'::regclass);


--
-- Name: racks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.racks ALTER COLUMN id SET DEFAULT nextval('public.racks_id_seq'::regclass);


--
-- Name: ticket_feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_feedback ALTER COLUMN id SET DEFAULT nextval('public.ticket_feedback_id_seq'::regclass);


--
-- Name: ticket_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_items ALTER COLUMN id SET DEFAULT nextval('public.ticket_items_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: allusers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.allusers (id, organization_id, email, password_hash, first_name, last_name, role, is_active, created_at, uuid, address, phone, joined_at, is_deactivated, loyalty_points, referral_code, marketing_opt_in, is_paused, dob) FROM stdin;
18	11	stan@gmail.com	100000:b1944f58af3ad1b13f1684244eb359422fc0f40a43ffd1f6bc63caed7b6300cb:396e1fd49b28927894eab83cbb460e11ee6805af19d7fda0f61068d88904b125	amara1	stanley2	customer	t	2025-10-30 09:22:10.312524	d997a204-e30b-462f-b174-5f741d76a8e7		08038021900	2025-12-11 12:09:43.505485+00	f	0	\N	f	f	\N
28	22	amuludunfavour@gmail.com	100000:c69f0c18a7325fd5babef50041f3678b902eb5f3731448d05720cbc8301e7577:16bec5bb7dd2e1b58f8a32c2cfab3e06994bc6ad18284be3dc48bbe167ea24b7	Taiwo	Courteous	customer	t	2025-11-02 01:15:17.782003	cd6dddda-3265-4d08-961f-8bf365fed328	Okegbogi street	\N	2025-11-02 01:24:58.148406+00	f	0	\N	f	f	\N
15	12	courteous@yahoo.com	100000:41d7ba60606f49945543aab3fcf5315ec18aae2d08bec5c693241266f17030b2:f2ffbf9805dd0c3744ec4654ee2b7e0b20dad0ac90a94972859ae5dd631651a2	Solomon	Inumidun	store_manager	t	2025-10-30 09:09:27.846038	64c3a038-219b-45b8-ac41-b259139e8cd4	\N	\N	2025-10-30 09:09:27.846038+00	f	0	\N	f	f	\N
16	14	ugo@gmaio.com	100000:54cac6819f0a5addad9754c34b203bd1cf16adc75a2ac1bb199521107adfd4f9:ea6798445d58fdbfab7404454b2ff05131f00bde8519604ea7c109d50330443a	ugo	victor	cashier	t	2025-10-30 09:18:33.298049	02ff76c8-3ce9-4ab5-8d94-8b43427c9b55	\N	\N	2025-10-30 09:18:33.298049+00	f	0	\N	f	f	\N
17	14	bless1@gmail.com	100000:2546735d05353010ee76e6777024590e0daad49b14aa9b256b3b2066dd4a16aa:c2f55b667b2c6b2d7b9dced10bf92eb537457aa1d98145760d8531c7ca0e9dbc	matthew	bless	store_manager	t	2025-10-30 09:19:18.840378	bff16c17-87d6-4a45-a032-38f9dfb6418d	\N	\N	2025-10-30 09:19:18.840378+00	f	0	\N	f	f	\N
20	19	Inumiduncourteous1@gmail.com	100000:7e3095862af5984a9ab02124ea6092d4557a8ba20131f40871bffe5e66d27751:c4eb44ccb73f2311dae76bed6b1ad60b37ae1eedde68dff3be7f84889f203828	Taiwo	Courteous	cashier	t	2025-10-30 19:21:18.851706	df55e841-3ad7-43a3-adc6-b91294c59c16	\N	\N	2025-10-30 19:21:18.851706+00	f	0	\N	f	f	\N
21	19	sss1@nail.com	100000:3f35a95beb56e242f5d7f7f15518bec8600a38ac5130ad5d1ff05261838598ec:6c42c6f17517a5c6680dba5ac54d5bc9e65536ef64eb238e8b2036b4aa6bf400	Solomon	Inumidun	cashier	t	2025-10-30 19:22:07.062058	60ea654f-5124-4607-83e7-4ede3be8a623	\N	\N	2025-10-30 19:22:07.062058+00	f	0	\N	f	f	\N
24	21	inumiduncourteous@gmail.com	100000:ebdfbf0935d29d77988c87da1bf1593777005d562b9c59ae57b8dcf90cafc8db:a8e3d90e3793995cb2afcb5fefb1e1c63a207ac40573888cdf84b63b3aff25bd	Taiwo	Courteous	customer	t	2025-11-01 16:39:00.630706	3cb8a6ed-2042-4e14-904e-de4545e72f64	Okegbogi street	999	2025-11-02 00:57:44.882285+00	f	0	\N	f	f	\N
25	21	edu@gmail.com	100000:91b1ec8845579945bb4851b7b562c31693ef328d23244e01e18160af568f38b3:1bb8bd54551583612b45c6dbd6d32af10d2336feb42ba1c63280eab25d7f0595	Edutemi	Inumidun	customer	t	2025-11-01 17:15:57.438613	5b8c1757-f071-4c9b-adf3-e25ef0f59014	Olanrewaju	08039112681	2025-11-02 00:06:54.110488+00	f	0	\N	f	f	\N
51	28	work@gmail.com	100000:4fa4042c379c65a08517ccbcbffdaf7b78b1841aa4409fff46b1f23cd686b146:eebad624da5b79aa934e67625f54ba85cae6fd9c5ea02e585e42466f3c0a7f7d	Taiwo	Courteous	cashier	t	2025-12-11 21:36:23.310722	668ca80a-974e-4b7f-b89f-dd31e2b2952a	\N	\N	2025-12-11 21:36:23.733932+00	f	0	\N	f	f	\N
41	26	worker@gmail.com	100000:ef4cd3698ed478ba13b3b4bae3f6cf66ed591a08447b21b70eba89877fa6391a:cd077e87a6a9580db4c95516c68e3a826a8ef522094fc34ae0f61da1481b5cc4	Worker	Courteous	cashier	t	2025-12-03 08:21:29.535434	0b8b049a-291b-49d2-9abc-9acea757b3c3	\N	08138021900	2025-12-03 08:21:29.530522+00	f	0	\N	f	f	\N
22	20	Inumiduncourteous4@gmail.com	100000:b00d96d5dc0bb2c202392edcc17da5053ebaf159b3799f43c74fbe12a869f8e4:acf249cbc4c9c57758fbad08c4f219374bbe9d393aa5cef1e801ece7251e75b0	Taiwo	Courteous	cashier	t	2025-10-30 19:48:25.268593	21a3dc6b-df69-4bd5-b881-56194ca9f237	\N	\N	2025-10-30 19:48:25.268593+00	f	0	\N	f	f	\N
44	21	inumiduncourteous@gmail77.com	100000:78d1293cb12bf403df947f34faa51bd3c12af4ff8ffe4bf625811763cabd56e3:91b3ad26dffd6fdf01993c42e78fc5585c0d9f400a739a5ed850f8f8ad87fd67	Akuma	Victor	driver	t	2025-12-10 11:48:51.586076	2df699df-17a8-4423-8ef3-a4e715273241	Okegbogi street	\N	\N	f	0	\N	f	f	\N
26	22	amuludun@gmail.com	100000:4d9a3be07b9a7c45bae6a7d797f893ff7b52af37e555c6f08df909d8aff4a2b1:c2802e0db15b0fd33a4ce2e2ee1e18af01c0c3547815260883d422337cdfaa40	Amuludun	Favour	cashier	t	2025-11-02 01:13:46.258573	ec372ee6-91df-4870-8d98-f915871a3a42	\N	\N	2025-11-02 01:13:46.258573+00	f	0	\N	f	f	\N
30	25	tunde1@gmail.com	100000:a47d543c5d34a7c6676a1b38e30ca2fac579593f2fdbb8eadbebc6496179196f:687f99258fc038f41bfd7fe72068024325c224fe601be24e5038485a6c2a70f6	Taiwo	Inumidun	cashier	t	2025-11-19 13:06:24.632661	cc24ee7c-0476-4f1e-826e-0a8b45608b5b	\N	08138021900	2025-11-19 13:06:24.632661+00	f	0	\N	f	f	\N
32	21	inumiduncourteous5@gmail.com	100000:fda0c25089dbd77ab377ae8bf6018a934fa8a79b88dbe5bca3f7b48ced10d6f9:54d11f337dc9cb84b3187c946b0b8289623794819bfc13558bc164b4758cb4db	Taiwo	Courteous	customer	t	2025-11-28 16:54:06.359006	4abec0e9-8607-4395-9304-77105b3a19c2	ondo state	\N	2025-11-28 17:55:13.71029+00	f	0	\N	f	f	\N
36	21	inumiduncourteous0@gmail.com	100000:39d3e53d732b91f361ac68b2e6b0b7d8c0e61a45a9e52e86ea35fa3fee576708:6d111ae1fb301843c5aebc4142e7a5a13f6023db1b767c75f77407651d803431	Taiwo	Courteous	customer	t	2025-11-28 17:35:43.002934	6c26d2e2-b5e8-4224-92d2-64bdd9a28035		\N	2025-12-05 15:17:11.067818+00	f	0	\N	f	f	\N
37	25	courteous@gmail.com	100000:c8fcfe90062ddc0c062e58c7f841920ceb543f5b08b4bfdf01678f8edb021c1c:626238011bd62e88cc1fef6dd61555895f42ee1aedf0ca93ea563d84fd5aea57	Taiwo	Courteous	customer	t	2025-12-02 15:21:37.667285	053be0be-6cc1-439d-ae71-6835080d7ede	\N	08138021900	2025-12-02 15:21:37.66421+00	f	0	\N	f	f	\N
38	25	stann@gmail.com	100000:7b89a5cfb626099afd3fa53c65835df384976131b76b9cbeb07217e1b2e4f94c:13ece464f19ad91c8567c72810ee6e28d7f20b66da924867edd3cf9e9ec6e928	Taiwo	Courteous	customer	t	2025-12-02 15:33:57.602225	d7d4972c-e71f-4a68-8bd4-135269aede39	\N	08138021900	2025-12-02 15:33:57.601403+00	t	0	\N	f	f	\N
35	21	inumiduncourteous9@gmail.com	100000:929669b7b1e2fc5005d5c474fb9488cfed3cabe698f531e56db039cf6d4502cf:456aad836702489aab1745b1e6fcbe91d990f75c5e2ff5b53a349cf13de7704d	Taiwo		customer	t	2025-11-28 17:35:18.082449	d59e6bf8-1a13-44e3-966f-aca2a4214ce4		\N	2025-12-03 06:58:53.980008+00	f	0	\N	f	f	\N
42	11	customer@gmail.com	100000:faff7a2af694260a1e0f8384639838cc8e0b1f0eac4def3d74365a73b4f0d9fb:277f71baeab345647611d204dfdeaed734dc07dba5dd4bab76e400ff781d1936	Taiwo	Courteous	customer	t	2025-12-10 11:24:53.76138	04b41aaa-00ea-444d-82c1-a4b7f48a03cd	Okegbogi street	08039112678	2025-12-10 11:58:32.778871+00	f	0	\N	f	f	\N
48	11	odunola@gmail.com	100000:d85e0b8d3a5d1531cd79988ae17c9b1ce242f4cb25a0f6aae809a7e6b877a403:64373b0bb39d0a0f7b51a9f03f177f3d5c9b4de9078b347e9ea13f148a1637b5	odun	Taiwo	cashier	t	2025-12-11 13:49:38.444257	7fa2fdb0-1cb1-4514-a646-eb75a7b7b7d5	\N	\N	2025-12-11 13:49:38.700812+00	f	0	\N	f	f	\N
49	11	gift@gmail.com	100000:dceaf2e5bb0cdbef852c7458f75edaa4edd61eb3a3c7b2d05b0cdd2a21538bbb:a9b64b2617863da75f820d244da42ac173c0e70641807e55dbf288ca4c924a64	Emmanuel	Gift	cashier	t	2025-12-11 13:50:53.840075	dbf24336-2bc4-423d-82b1-85503b255400	\N	\N	2025-12-11 13:50:54.150431+00	f	0	\N	f	f	\N
47	11	odun@gmail.com	100000:ba39a4dfb0850ee9f31885c24058e263e043cdd54974ef015170c5d19fe36f16:be82540551f847bbe43f4a7ed22024e023db44772b3943764a9a9f463f66dfac	Odun	Taiwo	customer	t	2025-12-11 12:38:41.779021	6f1dd648-eb43-426e-bd2b-78a12b895bf8	Okegbogi street	87384637	2025-12-18 20:00:01.783951+00	f	0	\N	f	f	\N
50	27	testworker@gmail.com	100000:b4c32c096d3af02aba584818c44a64adaec4b45fd2136ffc18fe72fbf7801476:95306bd42309f35274db1b14c65609d8aa6e9375905075f790c0a3896dbb6ea7	Taiwo	Courteous	cashier	t	2025-12-11 13:57:26.373407	2364243a-55ae-41cf-8fd3-aa529775d6c2	\N	9999	2025-12-11 13:57:26.597797+00	f	0	\N	f	f	\N
39	26	paul@gmail.com	100000:b864c5c8f901afbc4b3c6f9b7f76db0980703c1d3851c6bfba85a24c651a6ba3:e611441387cffb4e6fc217cb321f8a80cf1d152d8b29f291584e720ddcbd589b	Chinedu	Paul	customer	t	2025-12-03 01:52:59.918176	983cd33c-f3e2-4db2-8e73-de9e6463c982	MainLand, Lagos, Nigeria	090322144911	2025-12-03 01:52:59.91737+00	f	0	\N	f	f	\N
74	28	customer1@gmail.com	100000:af7eb6631839e531e4e3884c73534413d49565d0242382c33f8328f3c7e2936a:502bbd54ea3620ae41c19e498296f647bb7aaee0245db2e93539c2c9edf52190	customer	Courteous	customer	t	2025-12-11 21:38:12.460844	5675f5cb-7b78-4476-a963-f80c23fa2431	Okegbogi street, Ondo	08138021902	2025-12-11 21:39:30.454964+00	f	0	\N	f	f	\N
84	27	no-email-9809099@placeholder.com	100000:58cd08ebbd6902390e16a987d4b3c18ce1107d7d6857f283b5d40ae267f8287c:508523d3997875ae1ac694289a7fbcd3a406e866661cf0bd48d9c6a436ffd1ca	gonni	dee	customer	t	2025-12-24 23:22:46.301104	f884100f-d479-4291-a257-d8e10574eab5	adura street	9809099	\N	f	0	\N	f	f	\N
75	21	bisola@gmail.com	100000:a34a4ff3af568b3d9b01d60505c9c0bce835923ebfa9fb30cbe85522331344d5:31631c1a5c05b1e9fa3df7e386f3f9195ea88b2a921a56a0a89c9f1568513075	Alade	Abisola	customer	t	2025-12-18 05:41:13.003046	c018443c-4613-4e00-9851-f3ba2c055ef2	\N	08138021900	2025-12-18 05:41:13.003046+00	f	0	\N	f	f	\N
23	21	emmanuel@gmail.com	100000:3616c3f5b36397a18abe3c770c70a49dcdc826aca21581849accc78ecda63b01:2ce7e3c441ff6841e9df30caa357665b4bfd977228ab80c61bb3354a12c62601	Taiwo	Courteous	cashier	t	2025-11-01 15:07:18.238202	34015113-0c30-41ce-bf4d-1ea74ef939d6	\N	08129298494	2025-11-01 15:07:18.238202+00	f	0	\N	f	f	\N
78	11	john@example.com	100000:6442e5ab066943dfd3691123091b6f6b94ca836e9bff2b4cffd21ca244b57fe2:b0622a4d33736c7a4b98752a7c7cf566501f996bd07cee766ec12538012e36e2	John	Doe	customer	t	2025-12-24 12:03:12.363858	4cc21f8b-369d-45ad-a1b9-465de6b36971	123 Main St	8012345678	\N	f	0	\N	f	f	\N
79	11	no-email-9090999@placeholder.com	100000:9e88a8eb33dd60a72dd66fc03a9a4f721d5fe2eab851d58c907e4945f94d5115:4f93d9b45b48aff8f3dd249d0a3b16a532a3a887554c01b9ab7e5f947f0be5d0	gonni	dee	customer	t	2025-12-24 12:03:12.363858	95113744-3cca-47b3-9fb8-d4ce2c899ccf		9090999	\N	f	0	\N	f	f	\N
81	21	jphn@gmail.com	100000:2153e86c83d00241172dc93e2df762b361d775d6e9145bc70f0c9ad641c27272:a5db028d54a0bb340eace7c5607d26d39e1f0996dd4898c72c8f486fa0ed693a	Taiwo	Courteous	customer	t	2025-12-24 21:24:41.448932	f76198f7-2cac-4e29-b853-b73e509476c8		8888	\N	f	0	\N	f	f	\N
85	27	no-email-788888@placeholder.com	100000:c050f83ed39cb90c8f4e32b4e279e7df8eb9ce8056b808563f6a2d6691ab104a:84df82e1fc230118b1c6c3e851c5b83c6493e690d6b521a76b4ecdb27d6ddb13	fish	gift	customer	t	2025-12-24 23:22:46.301104	019c972b-be7e-475b-b0c8-fd9642bd8eb3	gbenga street	999555	2025-12-24 23:23:17.88295+00	f	0	\N	f	f	\N
80	11	no-email-888888@placeholder.com	100000:7457786aaf47cf0a096a9c260172ca85319a320c60013d607f2a5456503da0c5:6f234a7aa5abc96b034d1992dbf0a22e763006dab201c0cb03f710b2ba42647b	fish	gift	customer	t	2025-12-24 12:03:12.363858	311f57cf-28c7-400d-a1ea-b1a2eca00320		9	\N	f	0	\N	f	f	\N
76	11	no-email-7777@placeholder.com	100000:0b052477723582132b08cf074166a12505ce46a5045bb7db0fd0ff50b5685c6c:9f2439f4311db1ab60289914a34a957438a2b182a282c621975c1da10e7c219d	jone	do	customer	t	2025-12-24 10:34:54.693488	5396145c-27eb-4477-a334-f59e0ba93fb2		888888888888888	\N	f	0	\N	f	f	\N
83	27	no-email-90329910@placeholder.com	100000:0517d194d2ec00a7f0295ee12bb8b04bd9f63614ce7aedb077a2f014a9c43cfc:53e29f6abe7319478a4e44e58af1a13e77be31f159bd51862f3f9e706d191b69	John	Doe	customer	t	2025-12-24 23:22:46.301104	b40a3783-25ea-4a92-a36f-203934ac1184	123 Main St	90329910	2025-12-31 08:30:11.429788+00	f	0	\N	f	f	\N
87	47	\N	100000:e48e42a3f37f35ff9b1c6d8273fc085606829656e00e8d31f74768d53947107c:b6752b5e164af9c18e7ae22cdef78d67b80660c44c3ad4276efa51a3cdb99c12	Sabo Man		customer	t	2026-01-12 12:05:33.659082	22eb3c95-e3d3-42b2-80ec-8663821cafc0		08138021900	2026-01-12 12:05:54.276781+00	f	0	\N	f	f	\N
89	26	doe@example.com	100000:7dd8e06c624c39dcf113ec2b337c7664120179a9c6e3a09464862bb29f987d00:1e4f727fae5b8ddb81d687b11733994023cf85441e20b7a9c9e7c444950f39fa	John	Doe	customer	t	2026-01-20 00:47:16.221013	0e06ef06-50fe-47a0-9a44-11c34d2ed44a	123 Main St, Lagos	8012345678	\N	f	0	\N	f	f	\N
90	26	no-email-22222@placeholder.com	100000:c0ccffe4872e2e8937988a6af5edc997a5d7d952c360c4cb6b0a98a685af9a4e:0bd91018c64ad7e67da4dbb771c21427baf19a011338c428a5385588f4d1af3a	simon	Josh	customer	t	2026-01-20 00:47:16.221013	8b09f45a-183e-49b4-b567-e6eb0a13c314	28, joihn street	22222	\N	f	0	\N	f	f	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, organization_id, actor_id, actor_name, actor_role, action, details, created_at, ticket_id, customer_id) FROM stdin;
1	27	0	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 2, "ticket_id": 165, "customer_id": 83}	2025-12-31 08:43:22.274057+00	\N	\N
2	27	0	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 166, "customer_id": 83}	2025-12-31 08:56:35.186191+00	\N	\N
3	27	0	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 2, "ticket_id": 167, "customer_id": 83}	2025-12-31 09:16:43.842256+00	\N	\N
4	27	0	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 2, "ticket_id": 168, "customer_id": 83}	2025-12-31 09:18:19.171784+00	\N	\N
5	27	0	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 2, "ticket_id": 169, "customer_id": 83}	2025-12-31 09:20:55.645858+00	\N	\N
6	27	0	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 170, "customer_id": 83}	2025-12-31 09:28:26.41422+00	\N	\N
7	27	0	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 171, "customer_id": 83}	2025-12-31 09:30:47.851459+00	\N	\N
8	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 172, "customer_id": 83}	2025-12-31 09:36:26.089321+00	\N	\N
9	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 173, "customer_id": 83}	2025-12-31 09:54:19.995517+00	\N	\N
10	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 2, "ticket_id": 174, "customer_id": 83}	2025-12-31 09:56:42.901948+00	\N	\N
11	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 175, "customer_id": 83}	2025-12-31 09:58:59.738994+00	175	83
12	27	27	test@gmail.com	STORE_OWNER	PICKUP TICKET	{"ticket_id": 171}	2025-12-31 10:32:25.967995+00	171	\N
13	27	27	test@gmail.com	STORE_OWNER	Rack a ticket	{"ticket_id": 169}	2025-12-31 10:46:29.35728+00	169	\N
14	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 176, "customer_id": 83}	2025-12-31 11:17:49.93593+00	176	83
15	27	27	test@gmail.com	STORE_OWNER	Rack a ticket	{"ticket_id": 176}	2025-12-31 11:18:18.110167+00	176	\N
16	27	27	test@gmail.com	STORE_OWNER	PICKUP TICKET	{"ticket_id": 176}	2025-12-31 11:27:46.09352+00	176	\N
17	27	27	test@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 200.0, "ticket_id": 176, "fully_paid": false, "previous_paid": 1000.0, "new_total_paid": 1200.0}	2025-12-31 11:50:28.819685+00	176	\N
18	27	27	test@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 0.0, "ticket_id": 176, "fully_paid": false, "previous_paid": 1200.0, "new_total_paid": 1200.0}	2025-12-31 11:53:13.300066+00	176	\N
19	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 2, "ticket_id": 177, "customer_id": 83}	2025-12-31 11:53:44.632872+00	177	83
20	27	27	test@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 155.4, "ticket_id": 176, "fully_paid": true, "previous_paid": 1200.0, "new_total_paid": 1355.4}	2025-12-31 11:54:10.282974+00	176	\N
21	27	27	test@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 3049.65, "ticket_id": 169, "fully_paid": true, "previous_paid": 0.0, "new_total_paid": 3049.65}	2025-12-31 11:58:14.377156+00	169	\N
22	27	27	test@gmail.com	STORE_OWNER	Rack a ticket	{"ticket_id": 160}	2025-12-31 12:05:46.186542+00	160	\N
23	27	27	test@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 3049.65, "ticket_id": 160, "fully_paid": true, "previous_paid": 0.0, "new_total_paid": 3049.65}	2025-12-31 12:06:16.775991+00	160	\N
24	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET_BULK	{"total": 1000.0, "item_count": 1}	2026-01-05 10:48:25.668419+00	180	83
25	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET_BULK	{"total": 2000.0, "item_count": 1}	2026-01-05 10:48:25.783562+00	181	83
26	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET_BULK	{"total": 3000.0, "item_count": 2}	2026-01-05 10:52:06.56287+00	182	83
27	27	27	test@gmail.com	STORE_OWNER	Rack a ticket	{"ticket_id": 182}	2026-01-05 10:52:54.962759+00	182	\N
28	27	27	test@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 2388.5, "ticket_id": 182, "fully_paid": true, "previous_paid": 1000.0, "new_total_paid": 3388.5}	2026-01-05 10:53:06.303992+00	182	\N
29	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET_BULK	{"total": 3000.0, "item_count": 2}	2026-01-05 10:54:17.981599+00	184	83
30	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET_BULK	{"total": 3000.0, "item_count": 2}	2026-01-05 11:15:17.397124+00	187	85
31	27	27	test@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 188, "customer_id": 83}	2026-01-07 10:24:52.497355+00	188	83
32	27	27	test@gmail.com	STORE_OWNER	Rack a ticket	{"ticket_id": 188}	2026-01-07 10:25:18.81883+00	188	\N
33	27	27	test@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 1694.25, "ticket_id": 188, "fully_paid": true, "previous_paid": 0.0, "new_total_paid": 1694.25}	2026-01-07 10:34:29.343978+00	188	\N
34	47	47	sabobranch@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 189, "customer_id": 87}	2026-01-12 12:05:54.505276+00	189	87
35	26	26	taiwo@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 190, "customer_id": 39}	2026-01-14 14:10:47.049289+00	190	39
36	26	26	taiwo@gmail.com	STORE_OWNER	LOGISTICS_TRANSFER	"Ticket #251230-007 dispatched to company. Status: in_transit"	2026-01-15 11:43:17.42894+00	156	\N
37	26	26	taiwo@gmail.com	STORE_OWNER	LOGISTICS_TRANSFER	"Ticket #260114-001 dispatched to company. Status: in_transit"	2026-01-15 11:43:17.525097+00	190	\N
38	26	26	taiwo@gmail.com	STORE_OWNER	LOGISTICS_TRANSFER	"Ticket #251203-006 dispatched to company. Status: in_transit"	2026-01-15 11:43:45.535844+00	77	\N
39	26	27	test@gmail.com	STORE_OWNER	LOGISTICS_RECEIVE	"Ticket #251203-006 received at Plant. Status updated to 'processing'."	2026-01-15 11:52:20.638601+00	77	\N
40	26	27	test@gmail.com	STORE_OWNER	LOGISTICS_RECEIVE	"Ticket #260114-001 received at Plant. Status updated to 'processing'."	2026-01-15 11:56:18.786677+00	190	\N
41	26	26	taiwo@gmail.com	STORE_OWNER	LOGISTICS_TRANSFER	"Ticket #251203-005 dispatched to company. Status: in_transit"	2026-01-15 12:07:10.209243+00	76	\N
42	26	27	test@gmail.com	STORE_OWNER	LOGISTICS_RECEIVE	"Ticket #251230-007 received at Plant. Status updated to 'processing'."	2026-01-15 12:07:28.018299+00	156	\N
43	26	26	taiwo@gmail.com	STORE_OWNER	LOGISTICS_TRANSFER	"Ticket #260114-001 dispatched to company. Status: in_transit"	2026-01-15 12:09:53.626205+00	190	\N
44	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	"Ticket #260114-001 received at Plant. Tracking: AT_PLANT."	2026-01-15 12:10:54.571205+00	190	\N
45	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	"Received ticket #260114-001 from branch."	2026-01-15 12:10:54.619564+00	190	\N
46	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	"Ticket #251203-005 received at Plant. Tracking: AT_PLANT."	2026-01-15 12:44:57.714871+00	76	\N
47	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	"Received ticket #251203-005 from branch."	2026-01-15 12:44:57.787105+00	76	\N
48	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	"Ticket #251203-013 received at Plant. Tracking: AT_PLANT."	2026-01-15 12:44:57.80848+00	85	\N
49	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	"Received ticket #251203-013 from branch."	2026-01-15 12:44:57.831697+00	85	\N
50	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251230-001"}	2026-01-15 12:52:58.978495+00	150	\N
51	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251230-001", "origin_branch_id": 26}	2026-01-15 12:52:59.038785+00	150	\N
52	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251230-005"}	2026-01-15 12:52:59.060004+00	154	\N
53	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251230-005", "origin_branch_id": 26}	2026-01-15 12:52:59.085128+00	154	\N
54	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251230-007", "destination_id": 27, "destination_name": "company"}	2026-01-15 21:02:48.740348+00	156	\N
55	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251230-007"}	2026-01-15 21:02:48.782941+00	156	\N
56	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251230-006", "destination_id": 27, "destination_name": "company"}	2026-01-15 21:02:48.805244+00	155	\N
57	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251230-006"}	2026-01-15 21:02:48.8282+00	155	\N
58	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251230-005", "destination_id": 27, "destination_name": "company"}	2026-01-15 21:02:48.847974+00	154	\N
59	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251230-005"}	2026-01-15 21:02:48.868033+00	154	\N
60	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251230-007"}	2026-01-15 21:04:38.279983+00	156	\N
61	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251230-007", "origin_branch_id": 26}	2026-01-15 21:04:38.302302+00	156	\N
62	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251230-005"}	2026-01-15 21:56:53.497725+00	154	\N
63	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251230-005", "origin_branch_id": 26}	2026-01-15 21:56:53.577956+00	154	\N
64	27	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251231-012", "destination_id": 26, "destination_name": "Taiwo and Bridget"}	2026-01-15 22:02:12.472334+00	170	\N
65	26	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 27, "origin_name": "company", "ticket_number": "251231-012"}	2026-01-15 22:02:12.501256+00	170	\N
66	27	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251231-014", "destination_id": 26, "destination_name": "Taiwo and Bridget"}	2026-01-15 22:02:12.516925+00	172	\N
67	26	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 27, "origin_name": "company", "ticket_number": "251231-014"}	2026-01-15 22:02:12.543898+00	172	\N
68	27	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251231-013", "destination_id": 26, "destination_name": "Taiwo and Bridget"}	2026-01-15 22:02:12.565477+00	171	\N
69	26	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 27, "origin_name": "company", "ticket_number": "251231-013"}	2026-01-15 22:02:12.588692+00	171	\N
70	27	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "260107-001", "destination_id": 26, "destination_name": "Taiwo and Bridget"}	2026-01-15 22:02:12.640514+00	188	\N
71	26	27	test@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 27, "origin_name": "company", "ticket_number": "260107-001"}	2026-01-15 22:02:12.6763+00	188	\N
72	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 26, "plant_name": null, "ticket_number": "251231-014"}	2026-01-16 03:48:34.819865+00	172	\N
73	26	26	taiwo@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251231-014", "origin_branch_id": 27}	2026-01-16 03:48:34.875748+00	172	\N
74	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 26, "plant_name": null, "ticket_number": "251231-013"}	2026-01-16 03:49:05.590277+00	171	\N
75	26	26	taiwo@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251231-013", "origin_branch_id": 27}	2026-01-16 03:49:05.610617+00	171	\N
76	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251203-011", "destination_id": 27, "destination_name": "company"}	2026-01-16 03:54:43.672578+00	83	\N
77	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251203-011"}	2026-01-16 03:54:43.704234+00	83	\N
78	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251203-012", "destination_id": 27, "destination_name": "company"}	2026-01-16 03:54:43.722962+00	84	\N
79	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251203-012"}	2026-01-16 03:54:43.753297+00	84	\N
80	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251230-002", "destination_id": 27, "destination_name": "company"}	2026-01-16 03:54:43.797981+00	151	\N
81	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251230-002"}	2026-01-16 03:54:43.851904+00	151	\N
82	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251230-002"}	2026-01-16 03:56:05.831489+00	151	\N
83	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251230-002", "origin_branch_id": 26}	2026-01-16 03:56:05.869231+00	151	\N
85	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251230-006", "origin_branch_id": 26}	2026-01-16 03:56:05.929909+00	155	\N
84	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251230-006"}	2026-01-16 03:56:05.898734+00	155	\N
86	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251203-012"}	2026-01-16 05:14:47.774078+00	84	\N
87	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251203-012", "origin_branch_id": 26}	2026-01-16 05:14:47.803049+00	84	\N
88	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 11, "ticket_number": "251230-005"}	2026-01-16 05:54:40.639182+00	154	\N
89	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 10, "ticket_number": "251230-006"}	2026-01-16 05:58:24.616307+00	155	\N
90	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 13, "ticket_number": "251203-005"}	2026-01-16 06:00:29.376211+00	76	\N
91	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 14, "ticket_number": "260114-001"}	2026-01-16 06:13:47.797697+00	190	\N
92	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 8, "ticket_number": "251230-007"}	2026-01-16 06:15:31.700737+00	156	\N
93	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 7, "ticket_number": "251230-001"}	2026-01-16 06:16:16.99977+00	150	\N
94	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 20, "ticket_number": "251203-013"}	2026-01-16 06:16:45.271988+00	85	\N
95	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 6, "ticket_number": "251230-002"}	2026-01-16 06:18:31.881661+00	151	\N
96	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251203-011"}	2026-01-16 06:20:40.75126+00	83	\N
97	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251203-011", "origin_branch_id": 26}	2026-01-16 06:20:40.768436+00	83	\N
98	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 9, "ticket_number": "251203-011"}	2026-01-16 06:21:39.273226+00	83	\N
99	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 12, "ticket_number": "251203-012"}	2026-01-16 06:31:58.897642+00	84	\N
100	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 15, "ticket_number": "251203-006"}	2026-01-16 06:32:06.823537+00	77	\N
101	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251203-006", "released_to_customer": true}	2026-01-16 07:33:30.783668+00	77	\N
102	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251203-012", "released_to_customer": true}	2026-01-16 07:36:22.341471+00	84	\N
103	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251203-013", "released_to_customer": true}	2026-01-16 07:36:32.819575+00	85	\N
104	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251230-006", "released_to_customer": true}	2026-01-16 07:43:30.18351+00	155	\N
105	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251230-002", "released_to_customer": true}	2026-01-16 07:43:32.665143+00	151	\N
106	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251230-005", "released_to_customer": true}	2026-01-16 07:43:35.727227+00	154	\N
107	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251230-007", "released_to_customer": true}	2026-01-16 07:53:37.90238+00	156	\N
108	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251230-001", "released_to_customer": true}	2026-01-16 07:54:17.629214+00	150	\N
109	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251203-005", "released_to_customer": true}	2026-01-16 07:55:02.57435+00	76	\N
110	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 10, "ticket_number": "251231-014"}	2026-01-16 08:02:10.586062+00	172	\N
111	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251231-014", "released_to_customer": true}	2026-01-16 08:03:05.010826+00	172	\N
112	26	26	taiwo@gmail.com	STORE_OWNER	Rack a ticket	{"ticket_id": 190}	2026-01-19 00:24:53.332799+00	190	\N
113	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251203-012", "destination_id": 27, "destination_name": "company"}	2026-01-19 00:29:17.773472+00	84	\N
114	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251203-012"}	2026-01-19 00:29:17.799202+00	84	\N
115	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "251203-012"}	2026-01-19 00:30:18.346165+00	84	\N
116	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "251203-012", "origin_branch_id": 26}	2026-01-19 00:30:18.370037+00	84	\N
117	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"rack_number": 23, "ticket_number": "251203-012"}	2026-01-19 00:30:29.072579+00	84	\N
118	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251203-012", "released_to_customer": true}	2026-01-19 00:30:57.54039+00	84	\N
119	26	26	taiwo@gmail.com	STORE_OWNER	Rack a ticket	{"new_rack": 11, "old_rack": "20", "is_rerack": true, "ticket_id": 190}	2026-01-20 01:54:05.234499+00	190	\N
120	26	26	taiwo@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 1694.25, "ticket_id": 190, "fully_paid": true, "previous_paid": 0.0, "new_total_paid": 1694.25}	2026-01-20 01:54:37.555695+00	190	\N
121	26	26	taiwo@gmail.com	STORE_OWNER	Rack a ticket	{"new_rack": 20, "old_rack": "11", "is_rerack": true, "ticket_id": 190}	2026-01-20 01:54:50.58559+00	190	\N
122	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"new_rack": 6, "old_rack": null, "is_rerack": false, "ticket_number": "251231-013"}	2026-01-20 02:01:23.836364+00	171	\N
123	26	26	taiwo@gmail.com	STORE_OWNER	Rack a ticket	{"new_rack": 16, "old_rack": "20", "is_rerack": true, "ticket_id": 190}	2026-01-20 02:03:13.477484+00	190	\N
124	26	26	taiwo@gmail.com	STORE_OWNER	Rack a ticket	{"new_rack": 20, "old_rack": "16", "is_rerack": true, "ticket_id": 190}	2026-01-20 02:03:24.167135+00	190	\N
125	26	26	taiwo@gmail.com	STORE_OWNER	PICKUP_PAYMENT	{"paid_now": 0.0, "ticket_id": 190, "fully_paid": true, "previous_paid": 1694.25, "new_total_paid": 1694.25}	2026-01-20 02:03:41.8585+00	190	\N
126	26	26	taiwo@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 191, "customer_id": 39}	2026-01-20 08:24:51.708534+00	191	39
127	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251203-009", "destination_id": 27, "destination_name": "company"}	2026-01-20 14:59:35.745722+00	81	\N
128	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251203-009"}	2026-01-20 14:59:36.149457+00	81	\N
129	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251203-007", "destination_id": 27, "destination_name": "company"}	2026-01-20 14:59:36.328314+00	78	\N
130	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251203-007"}	2026-01-20 14:59:36.529369+00	78	\N
131	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "251203-008", "destination_id": 27, "destination_name": "company"}	2026-01-20 14:59:36.553848+00	80	\N
132	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "251203-008"}	2026-01-20 14:59:36.73119+00	80	\N
133	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "260120-001", "destination_id": 27, "destination_name": "company"}	2026-01-20 14:59:36.755492+00	191	\N
134	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "260120-001"}	2026-01-20 14:59:36.863843+00	191	\N
135	26	26	taiwo@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 192, "customer_id": 39}	2026-01-20 15:00:12.095005+00	192	39
136	26	26	taiwo@gmail.com	STORE_OWNER	CREATE_TICKET	{"pieces": 1, "ticket_id": 193, "customer_id": 39}	2026-01-20 15:00:27.448669+00	193	39
137	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "260120-002", "destination_id": 27, "destination_name": "company"}	2026-01-20 15:03:36.959766+00	192	\N
138	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "260120-002"}	2026-01-20 15:03:37.093589+00	192	\N
139	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "260120-003", "destination_id": 27, "destination_name": "company"}	2026-01-20 15:03:37.325895+00	193	\N
140	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "260120-003"}	2026-01-20 15:03:37.385779+00	193	\N
141	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "260120-001", "destination_id": 27, "destination_name": "company"}	2026-01-20 15:10:58.889719+00	191	\N
142	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "260120-001"}	2026-01-20 15:10:59.255432+00	191	\N
143	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "260120-002", "destination_id": 27, "destination_name": "company"}	2026-01-20 15:10:59.338495+00	192	\N
144	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "260120-002"}	2026-01-20 15:10:59.419553+00	192	\N
145	26	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_SENT	{"event": "request_sent", "ticket_number": "260120-003", "destination_id": 27, "destination_name": "company"}	2026-01-20 15:10:59.51208+00	193	\N
146	27	26	taiwo@gmail.com	STORE_OWNER	TRANSFER_REQUEST_RECEIVED	{"event": "request_incoming", "origin_id": 26, "origin_name": "Taiwo and Bridget", "ticket_number": "260120-003"}	2026-01-20 15:10:59.54459+00	193	\N
147	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "260120-001"}	2026-01-20 15:11:36.930178+00	191	\N
148	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "260120-001", "origin_branch_id": 26}	2026-01-20 15:11:36.996121+00	191	\N
149	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "260120-002"}	2026-01-20 15:11:37.04979+00	192	\N
150	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "260120-002", "origin_branch_id": 26}	2026-01-20 15:11:37.090415+00	192	\N
151	26	27	test@gmail.com	STORE_OWNER	TRANSFER_RECEIVED_BY_PLANT	{"event": "received_by_plant", "plant_id": 27, "plant_name": null, "ticket_number": "260120-003"}	2026-01-20 15:11:37.156976+00	193	\N
152	27	27	test@gmail.com	STORE_OWNER	PLANT_INVENTORY_IN	{"event": "plant_inventory_in", "ticket_number": "260120-003", "origin_branch_id": 26}	2026-01-20 15:11:37.17466+00	193	\N
153	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"new_rack": 18, "old_rack": null, "is_rerack": false, "ticket_number": "260120-002"}	2026-01-20 15:12:28.1512+00	192	\N
154	27	27	test@gmail.com	STORE_OWNER	TRANSFER_TICKET_RACKED	{"new_rack": 25, "old_rack": null, "is_rerack": false, "ticket_number": "260120-003"}	2026-01-20 15:13:31.74784+00	193	\N
155	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "260120-002", "released_to_customer": true}	2026-01-20 15:14:04.550444+00	192	\N
156	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "260120-003", "released_to_customer": true}	2026-01-20 15:14:08.048677+00	193	\N
157	27	27	test@gmail.com	STORE_OWNER	TRANSFER_COMPLETED	{"event": "transfer_completed", "ticket_number": "251203-011", "released_to_customer": true}	2026-01-20 15:14:11.509679+00	83	\N
\.


--
-- Data for Name: branch_payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch_payment_methods (branch_id, payment_method, is_enabled) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, organization_id, name, address, phone, timezone, location_type, is_plant, is_active, created_at) FROM stdin;
1	26	Owo	@1a Okegbogi	9999	UTC	Drop-off	f	t	2025-12-03 09:16:49.308705
\.


--
-- Data for Name: clothing_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clothing_types (id, name, plant_price, margin, created_at, image_url, organization_id, pieces) FROM stdin;
4	Suit Jacket	6.00	3.00	2025-10-02 05:44:10.573864	\N	\N	1
5	Tie	2.50	1.50	2025-10-02 05:44:10.573864	\N	\N	1
36	small agbada	100.00	10.00	2025-12-17 01:34:27.871555	/static/clothing_images/b62da633-0890-4059-b004-d18defeaf4f1.jpg	11	4
21	Dress	1700.00	300.00	2025-11-01 15:04:54.245676	/static/clothing_images/22cc6611-f38d-4c3c-ba9b-b358fdbf4573.svg	21	3
37	Shirt	1000.00	200.00	2026-01-11 19:43:30.930244	/static/images/shirt.jpg	42	1
38	Trousers	1200.00	300.00	2026-01-11 19:43:30.930244	/static/images/trousers.jpg	42	1
11	Socks	50.00	5.00	2025-10-23 09:32:57.958811	/static/clothing_images/c61415a7-623d-434e-92c6-8df21b5247a1.jpg	\N	1
2	Pants	4.00	2.00	2025-10-02 05:44:10.573864	/static/clothing_images/edf7065e-777e-4cc6-81e2-8cdcb98dbdbc.jpeg	\N	1
39	Shirt	1000.00	200.00	2026-01-11 20:34:46.917108	/static/images/shirt.jpg	45	1
17	socks	1200.00	300.00	2025-10-30 19:04:44.556988	/static/clothing_images/c61415a7-623d-434e-92c6-8df21b5247a1.jpg	19	1
40	Trousers	1200.00	300.00	2026-01-11 20:34:46.917108	/static/images/trousers.jpg	45	1
41	Shirt	1000.00	200.00	2026-01-12 04:21:24.045237	/static/images/shirt.jpg	46	1
42	Trousers	1200.00	300.00	2026-01-12 04:21:24.045237	/static/images/trousers.jpg	46	1
43	Shirt	1000.00	200.00	2026-01-12 04:36:15.023449	/static/images/shirt.jpg	47	1
44	Trousers	1200.00	300.00	2026-01-12 04:36:15.023449	/static/images/trousers.jpg	47	1
45	Shirt	1000.00	200.00	2026-01-12 08:14:17.864053	/static/images/shirt.jpg	49	1
46	Trousers	1200.00	300.00	2026-01-12 08:14:17.864053	/static/images/trousers.jpg	49	1
47	Shirt	1000.00	200.00	2026-01-12 14:22:57.746676	/static/images/shirt.jpg	50	1
48	Trousers	1200.00	300.00	2026-01-12 14:22:57.746676	/static/images/trousers.jpg	50	1
49	Shirt	1000.00	200.00	2026-01-18 16:46:37.281698	/static/images/shirt.jpg	51	1
24	shoes	12900.00	111.00	2025-11-07 09:30:07.028254	/static/clothing_images/0e0950f9-93ef-4fbc-b33b-74043167dcfb.jpeg	21	5
20	socks	1000.00	200.00	2025-11-01 15:04:54.245676	/static/clothing_images/c61415a7-623d-434e-92c6-8df21b5247a1.jpg	21	2
19	Trousers	1200.00	300.00	2025-10-30 19:46:57.720257	/static/clothing_images/edf7065e-777e-4cc6-81e2-8cdcb98dbdbc.jpeg	20	1
23	Trousers	1200.00	300.00	2025-11-02 01:09:25.644549	/static/clothing_images/edf7065e-777e-4cc6-81e2-8cdcb98dbdbc.jpeg	22	1
26	Trousers	1200.00	300.00	2025-11-12 00:11:19.884853	/static/clothing_images/edf7065e-777e-4cc6-81e2-8cdcb98dbdbc.jpeg	24	1
28	Trousers	1200.00	300.00	2025-11-19 13:05:30.587167	/static/clothing_images/edf7065e-777e-4cc6-81e2-8cdcb98dbdbc.jpeg	25	1
3	Dress	8.00	4.00	2025-10-02 05:44:10.573864	/static/clothing_images/af143d5b-ef41-4e5b-97af-3a0db6fe8a42.png	\N	1
16	Dress	1000.00	200.00	2025-10-30 19:04:44.556988	/static/clothing_images/af143d5b-ef41-4e5b-97af-3a0db6fe8a42.png	19	1
1	Shirt	3.50	1.50	2025-10-02 05:44:10.573864	/static/clothing_images/Shirt.jpeg	\N	1
18	Shirt	1000.00	200.00	2025-10-30 19:46:57.720257	/static/clothing_images/Shirt.jpeg	20	1
22	Shirt	1000.00	200.00	2025-11-02 01:09:25.644549	/static/clothing_images/Shirt.jpeg	22	1
25	Shirt	1000.00	200.00	2025-11-12 00:11:19.884853	/static/clothing_images/Shirt.jpeg	24	1
27	Shirt	1000.00	200.00	2025-11-19 13:05:30.587167	/static/clothing_images/Shirt.jpeg	25	1
29	Shirt	1000.00	200.00	2025-12-03 01:51:55.041511	/static/images/shirt.jpg	26	1
30	Trousers	1200.00	300.00	2025-12-03 01:51:55.041511	/static/images/trousers.jpg	26	1
31	shh	10000.00	500.00	2025-12-10 11:57:28.728596	/static/clothing_images/4b67a76a-388c-4db8-b808-f42f0c3dc8dc.jpg	11	5
32	Shirt	1000.00	200.00	2025-12-11 13:56:47.758777	/static/images/shirt.jpg	27	1
33	Trousers	1200.00	300.00	2025-12-11 13:56:47.758777	/static/images/trousers.jpg	27	1
34	Shirt	1000.00	200.00	2025-12-11 21:34:50.992226	/static/images/shirt.jpg	28	1
35	Trousers	1200.00	300.00	2025-12-11 21:34:50.992226	/static/images/trousers.jpg	28	1
50	Trousers	1200.00	300.00	2026-01-18 16:46:37.281698	/static/images/trousers.jpg	51	1
\.


--
-- Data for Name: customer_coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_coupons (id, customer_id, code, description, discount_amount, is_used, created_at) FROM stdin;
\.


--
-- Data for Name: customer_payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_payment_methods (id, customer_id, provider, token_id, last_four, card_type, is_default, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, phone, email, address, last_visit_date, created_at) FROM stdin;
1	Taiwo Solomon Courteous	08138021900	Inumiduncourteous@gmail.com	Okegbogi street	2025-10-14 13:45:04.038856	2025-10-09 01:40:56.087872
11	Taiwo Solomon Courteous	08138021901	Inumiduncourteous1@gmail.com	Okegbogi street	2025-10-14 14:04:38.045569	2025-10-09 01:44:26.740386
13	Taiwo Solomon Courteous	08138021911	courteous@yahoo.com	Okegbogi street	2025-10-14 14:24:57.746218	2025-10-09 08:57:29.889866
\.


--
-- Data for Name: organization_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_settings (organization_id, primary_color, secondary_color, logo_url, receipt_header, receipt_footer, created_at, updated_at, starch_price_light, starch_price_medium, starch_price_heavy, starch_price_extra_heavy, size_price_s, size_price_m, size_price_l, size_price_xl, size_price_xxl) FROM stdin;
46	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2026-01-12 04:21:24.045237	2026-01-12 04:21:24.045237	100.00	200.00	300.00	400.00	0.00	0.00	0.00	0.00	0.00
42	#da1010	#723636				2026-01-11 19:43:30.930244	2026-01-12 04:24:36.550118	100.00	200.00	300.00	400.00	0.00	0.00	0.00	0.00	0.00
49	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2026-01-12 08:14:17.864053	2026-01-12 08:14:17.864053	100.00	200.00	300.00	400.00	0.00	0.00	0.00	0.00	0.00
47	#000000	#FFFFFF	\N	Welcome to our Stored	Thank you for visiting!	2026-01-12 04:36:15.023449	2026-01-12 12:14:42.650558	100.00	200.00	300.00	400.00	0.00	0.00	0.00	0.00	0.00
50	#21ca3d	#ed0226	\N	Welcome to our Store	Thank you for visiting!	2026-01-12 14:22:57.746676	2026-01-12 14:23:44.468242	100.00	200.00	300.00	400.00	0.00	0.00	0.00	0.00	0.00
12	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
21	#de1717	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 17:58:31.749523	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
26	#f03c0f	#1a3be0				2025-12-03 02:01:40.685811	2026-01-16 03:52:43.030846	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
13	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
14	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
19	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
20	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
24	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
25	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
27	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
28	#000000	#ffffff		This is clothing 	bye bye	2025-12-11 21:48:28.029897	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
22	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-18 16:27:41.461196	100.00	200.00	300.00	400.00	20.00	25.00	30.00	35.00	40.00
51	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2026-01-18 16:46:37.281698	2026-01-18 16:46:37.281698	100.00	200.00	300.00	400.00	0.00	0.00	0.00	0.00	0.00
11	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2025-12-18 16:21:21.655302	2025-12-19 20:48:05.850239	100.00	200.00	300.00	500.00	23.00	25.00	30.00	35.00	46.00
45	#000000	#FFFFFF	\N	Welcome to our Store	Thank you for visiting!	2026-01-11 20:34:46.917108	2026-01-11 20:34:46.917108	100.00	200.00	300.00	400.00	0.00	0.00	0.00	0.00	0.00
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, industry, created_at, owner_first_name, owner_last_name, owner_email, owner_password_hash, role, is_active, phone, address, org_type, parent_org_id, connection_code) FROM stdin;
12	Taiwo and Sons	Dry Cleaning	2025-10-30 08:54:06.215863	Taiwo	Inumidun	inumiduncourteous@gmail.com	100000:f9264e1f802f6a98102fac203fc6907b7944a64ea779beaca1523e70a37dac2c:417274661d389fdc14c72306a86544630959153460ccebaed865f85cce4aa15d	STORE_OWNER	t	\N	\N	full_store	\N	C20AD4
13	Thank God Ventures	Dry Cleaning	2025-10-30 09:15:16.629333	Victor	Blessing	victor@gmail.com	100000:005ee169bfa868a74c298c0a66da5d0e21161db5623d7198d72288925eaae733:03be15d6e6f1220299b152e7e2dfd8775b0bf0ccb41345c90a869aefc4f111d0	STORE_OWNER	t	\N	\N	full_store	\N	C51CE4
14	Blissful Stores	Dry Cleaning	2025-10-30 09:16:53.408114	Blessed	Goodness	bless@gmail.com	100000:004d54f4b80b3ec4b018ddaeca74b02518865d0354e63c2aff0f06bf1916134a:13f99ac5e8bcfdc91938f8eb87e7ec99aaa34197134b19832505358f84d8aea7	STORE_OWNER	t	\N	\N	full_store	\N	AAB323
19	Morak ventures	Dry Cleaning	2025-10-30 19:04:44.556988	Morakiyo	Favour	morak@gmail.com	100000:53f5aa9b4bf18393e9320d38f321aac9fe4f6c3c80a34f3ba244ed6af29e98ba:fe1b85ccf6c75a60620a58f6866dfc9b8d05ad9eebcebc3b9f2aaf39ffdd7166	STORE_OWNER	t	\N	\N	full_store	\N	1F0E3D
20	Victory Laubdry store	Dry Cleaning	2025-10-30 19:46:57.720257	Victory	Emmanuel	victory@gmail.com	100000:27d3de1ba6e8728df53472cf2e2b0cf9ef43d0de9067aef9ec15af7ea28a1c7f:358615f4114c201e8d8ad79995ac257c7a6b9fb4c8eb02a8a4a0cb76a9d381cf	STORE_OWNER	t	\N	\N	full_store	\N	98F137
24	Amara and Taiwo	Dry Cleaning	2025-11-12 00:11:19.884853	Amara	Taiwo	amarataiwo@gmail.com	100000:46fab2f0dad15f0902b9666c9814c1dd688aba169bbb679a1b5093e0ddb38a0a:8e80e949af9f8e83db7b6b899395f37ea0c1039753f95aa94ef378ee00d6e480	store_owner	t	\N	\N	full_store	\N	1FF1DE
25	Tunde Stores	Dry Cleaning	2025-11-19 13:05:30.587167	Tunde	Admin	tunde@gmail.com	100000:4c26735b81f43425282e52791a7ae2c5782cdee13b2b8d5071f919185a792d35:42c9edbfc1e90142604b7a65c697f8bcfa441ff8cad5f4eaaf4fc0b54a482260	store_owner	t	\N	\N	full_store	\N	8E296A
26	Taiwo and Bridget	Dry Cleaning	2025-12-03 01:51:55.041511	Taiwo	Bridget	taiwo@gmail.com	100000:454023817861ca09f38c740482fa42f4ccd539e21c54f502d162c3c979164485:8699f858676f508cf7959899943ce93ecaee3d0c315c107936d2b61090549a0a	store_owner	t	\N	\N	full_store	\N	4E732C
27	company	Dry Cleaning	2025-12-11 13:56:47.758777	First name	Last name	test@gmail.com	100000:b86f67e0f4ba8a92aedee2e4393e2bc357b769f75398d4ec0ccca87b3d5c2caf:c6b114261623ad47b10c02c2d01045e4904ea0db1331890b04425e8040073923	store_owner	t	\N	\N	full_store	\N	02E74F
42	Hay Jay	Dry Cleaning	2026-01-11 19:43:30.930244	Ajulo	Stephen	ajulo@gmail.com	100000:58b0d641e7df3a8a7bca9f18ce9bed4c1d0f5dadd636e246e77afec1c7107994:ae36b95b223eb4c96ee64a94f9d6a7b049bc2b3ac6058e726e3dfa7809887cf6	store_owner	t	\N	\N	full_store	\N	A1D0C6
28	Mr Mike Laundry	Dry Cleaning	2025-12-11 21:34:50.992226	Mike	Fred	mike@gmail.com	100000:1e2bfa23b9ed283a84202a4524c5e853c85a176804fa6e89be781e3e2a732911:05059bdc0b628e01503fe50b3d636210747fc21f6e6c5da4e88a7071d84d3325	store_owner	t	\N	\N	full_store	\N	33E75F
21	Emmauel Stores	Dry Cleaning	2025-11-01 15:04:54.245676	Emmy	Tayo	emmanuel@gmail.com	100000:ba0285b527d135a3790aaa9cf708575082cb948a30e0e2623bc96b0c9df4ba64:1dd361cad1209e0d791df1d21cb06648b69de8c694c456fd9a44a968c39c81fb	store_owner	t	2348138021900	Okegbogi Street	full_store	\N	3C59DC
22	Amuludun Laundry	Dry Cleaning	2025-11-02 01:09:25.644549	Amuludun	Ayedatiwa	amuludun@gmail.com	100000:0c1b2e95534a9956fd43a20f32878d4d999276fa56f43e97d746db10200c1e91:91fa0e77979f627179f4372dddf85a2c96479e21819eadd3c52796b25519ccad	store_owner	t	\N	\N	full_store	\N	B6D767
11	Amara and Sons	Dry Cleaning	2025-10-30 08:47:26.964489	Amara	Stanley	amara@gmail.com	100000:0c12c965d1226bf39d74c396374f3b971a846996cf3f63c490b7116c8fa53dba:0486e05e93de2a3e72da311f7584020a6713fa81c5d359e15c79677543941f23	store_owner	t	\N	\N	full_store	\N	6512BD
45	Okegbogi Branch	Dry Cleaning	2026-01-11 20:34:46.917108	Branch	Manager	branch_1768163685528@system.com	100000:ad5029b5dbe99d2f33a93343e4f495b64eb5f4579b311ca6d7d380c78b55ff9b:30a942753693074df47d4235700c703a343e95c8dc20a000563b881b7059378e	store_owner	t	\N	\N	drop_off_internal	42	6C8349
46	Ondo Branch	Dry Cleaning	2026-01-12 04:21:24.045237	Branch	Manager	branch_1768191683568@system.com	100000:5153853dab19e7d1c6aa1994974adc7355b647e90336ca7de3e839e52de1aa43:3c41fe93d9781c36348c1b49bcf2f825790aebb3ae1d76d47f61566e69823dfb	store_owner	t	\N	\N	drop_off_internal	42	D9D4F4
47	Sabo branch	Dry Cleaning	2026-01-12 04:36:15.023449	Branch	Manager	sabobranch@gmail.com	100000:79e2c8023633d46a7506e5bbc0d83bb16d7631ef80be848dbbae3d327cca65e9:8a03db24b845f839437312684c7ffdbfac649cc855424d8e060de82119dfc7e4	store_owner	t	\N	\N	drop_off_internal	42	67C6A1
49	Sabo branch 2	Dry Cleaning	2026-01-12 08:14:17.864053	Branch	Manager	sabobanch@gmail.com	100000:37f242e4db6910f34d910eb24e3de0caff8aba211a72efe3efd4e3a14515cdeb:177ca1ec976e437c29308eca381b65baf62a56aeca2a12d2b529570c15dcc9dc	store_owner	t	\N	\N	drop_off_internal	26	F457C5
50	stunt	Dry Cleaning	2026-01-12 14:22:57.746676	Saheed	Saheed	saheed@gmail.com	100000:68259fc1e4b07b8e629e656d0ce8a201af24a5483db8eca8b2d9cc7db0a0fc5c:857010d8a5d5b3bfe3fe37fe1eaa4ff9dca96fdacf8bc53504abea40d6732621	store_owner	t	\N	\N	full_store	\N	C0C7C7
51	Onwordi wash	Dry Cleaning	2026-01-18 16:46:37.281698	Emmanuel	Onwordi	onwordi@gmail.com	100000:d3385198ed9fa07a484542dfe177887fbbf062e3fd63c9c462f1668e09115674:143fd4e99d742b90ffae00028c5a190b267de0e262951568302cac7ccb0caaf1	store_owner	t	\N	\N	full_store	\N	1NSN52IW
\.


--
-- Data for Name: pickup_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pickup_requests (id, customer_id, address_id, requested_date, notes, is_recurring, recurrence_rule, status, created_at) FROM stdin;
\.


--
-- Data for Name: platform_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_admins (id, uuid, full_name, email, password_hash, role, is_super_admin, created_at, last_login) FROM stdin;
2	f5d4103a-4992-4859-b097-4fdf8b480cb2	Taiwo Courteous	tinumidun@moduslights.com	100000:0aaebaae49973fcc9140d7d13bed339efbe3c62d64748fd17e604f9406829eaf:3b42ec0e97c7b136844f4aaa5f19d3e57c17ecbff7d7e08b3135857f942a42c6	platform_admin	t	2025-10-30 00:50:13.510547	\N
\.


--
-- Data for Name: racks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.racks (id, number, is_occupied, ticket_id, updated_at, organization_id) FROM stdin;
2002	1	f	\N	2025-10-30 19:04:44.556988	19
2003	2	f	\N	2025-10-30 19:04:44.556988	19
2004	3	f	\N	2025-10-30 19:04:44.556988	19
2005	4	f	\N	2025-10-30 19:04:44.556988	19
2006	5	f	\N	2025-10-30 19:04:44.556988	19
2007	6	f	\N	2025-10-30 19:04:44.556988	19
2008	7	f	\N	2025-10-30 19:04:44.556988	19
2009	8	f	\N	2025-10-30 19:04:44.556988	19
2010	9	f	\N	2025-10-30 19:04:44.556988	19
2011	10	f	\N	2025-10-30 19:04:44.556988	19
2012	11	f	\N	2025-10-30 19:04:44.556988	19
2013	12	f	\N	2025-10-30 19:04:44.556988	19
2014	13	f	\N	2025-10-30 19:04:44.556988	19
2015	14	f	\N	2025-10-30 19:04:44.556988	19
2016	15	f	\N	2025-10-30 19:04:44.556988	19
2017	16	f	\N	2025-10-30 19:04:44.556988	19
2018	17	f	\N	2025-10-30 19:04:44.556988	19
2019	18	f	\N	2025-10-30 19:04:44.556988	19
2020	19	f	\N	2025-10-30 19:04:44.556988	19
2021	20	f	\N	2025-10-30 19:04:44.556988	19
2022	21	f	\N	2025-10-30 19:04:44.556988	19
2023	22	f	\N	2025-10-30 19:04:44.556988	19
2024	23	f	\N	2025-10-30 19:04:44.556988	19
2025	24	f	\N	2025-10-30 19:04:44.556988	19
2026	25	f	\N	2025-10-30 19:04:44.556988	19
2027	26	f	\N	2025-10-30 19:04:44.556988	19
2028	27	f	\N	2025-10-30 19:04:44.556988	19
2029	28	f	\N	2025-10-30 19:04:44.556988	19
2030	29	f	\N	2025-10-30 19:04:44.556988	19
2031	30	f	\N	2025-10-30 19:04:44.556988	19
2032	31	f	\N	2025-10-30 19:04:44.556988	19
2033	32	f	\N	2025-10-30 19:04:44.556988	19
2034	33	f	\N	2025-10-30 19:04:44.556988	19
2035	34	f	\N	2025-10-30 19:04:44.556988	19
2036	35	f	\N	2025-10-30 19:04:44.556988	19
2037	36	f	\N	2025-10-30 19:04:44.556988	19
2038	37	f	\N	2025-10-30 19:04:44.556988	19
2039	38	f	\N	2025-10-30 19:04:44.556988	19
2040	39	f	\N	2025-10-30 19:04:44.556988	19
2041	40	f	\N	2025-10-30 19:04:44.556988	19
2042	41	f	\N	2025-10-30 19:04:44.556988	19
2043	42	f	\N	2025-10-30 19:04:44.556988	19
2044	43	f	\N	2025-10-30 19:04:44.556988	19
2045	44	f	\N	2025-10-30 19:04:44.556988	19
2046	45	f	\N	2025-10-30 19:04:44.556988	19
2047	46	f	\N	2025-10-30 19:04:44.556988	19
2048	47	f	\N	2025-10-30 19:04:44.556988	19
2049	48	f	\N	2025-10-30 19:04:44.556988	19
2050	49	f	\N	2025-10-30 19:04:44.556988	19
2051	50	f	\N	2025-10-30 19:04:44.556988	19
2052	51	f	\N	2025-10-30 19:04:44.556988	19
2053	52	f	\N	2025-10-30 19:04:44.556988	19
2054	53	f	\N	2025-10-30 19:04:44.556988	19
2055	54	f	\N	2025-10-30 19:04:44.556988	19
2056	55	f	\N	2025-10-30 19:04:44.556988	19
2057	56	f	\N	2025-10-30 19:04:44.556988	19
2058	57	f	\N	2025-10-30 19:04:44.556988	19
2059	58	f	\N	2025-10-30 19:04:44.556988	19
2060	59	f	\N	2025-10-30 19:04:44.556988	19
2061	60	f	\N	2025-10-30 19:04:44.556988	19
2062	61	f	\N	2025-10-30 19:04:44.556988	19
2063	62	f	\N	2025-10-30 19:04:44.556988	19
2064	63	f	\N	2025-10-30 19:04:44.556988	19
2065	64	f	\N	2025-10-30 19:04:44.556988	19
2066	65	f	\N	2025-10-30 19:04:44.556988	19
2067	66	f	\N	2025-10-30 19:04:44.556988	19
2068	67	f	\N	2025-10-30 19:04:44.556988	19
2069	68	f	\N	2025-10-30 19:04:44.556988	19
2070	69	f	\N	2025-10-30 19:04:44.556988	19
2071	70	f	\N	2025-10-30 19:04:44.556988	19
2072	71	f	\N	2025-10-30 19:04:44.556988	19
2073	72	f	\N	2025-10-30 19:04:44.556988	19
2074	73	f	\N	2025-10-30 19:04:44.556988	19
2075	74	f	\N	2025-10-30 19:04:44.556988	19
2076	75	f	\N	2025-10-30 19:04:44.556988	19
2077	76	f	\N	2025-10-30 19:04:44.556988	19
2078	77	f	\N	2025-10-30 19:04:44.556988	19
2079	78	f	\N	2025-10-30 19:04:44.556988	19
2080	79	f	\N	2025-10-30 19:04:44.556988	19
2081	80	f	\N	2025-10-30 19:04:44.556988	19
2082	81	f	\N	2025-10-30 19:04:44.556988	19
2083	82	f	\N	2025-10-30 19:04:44.556988	19
2084	83	f	\N	2025-10-30 19:04:44.556988	19
2085	84	f	\N	2025-10-30 19:04:44.556988	19
2086	85	f	\N	2025-10-30 19:04:44.556988	19
2087	86	f	\N	2025-10-30 19:04:44.556988	19
2088	87	f	\N	2025-10-30 19:04:44.556988	19
2089	88	f	\N	2025-10-30 19:04:44.556988	19
2090	89	f	\N	2025-10-30 19:04:44.556988	19
2091	90	f	\N	2025-10-30 19:04:44.556988	19
2092	91	f	\N	2025-10-30 19:04:44.556988	19
2093	92	f	\N	2025-10-30 19:04:44.556988	19
2094	93	f	\N	2025-10-30 19:04:44.556988	19
2095	94	f	\N	2025-10-30 19:04:44.556988	19
2096	95	f	\N	2025-10-30 19:04:44.556988	19
2097	96	f	\N	2025-10-30 19:04:44.556988	19
2098	97	f	\N	2025-10-30 19:04:44.556988	19
2099	98	f	\N	2025-10-30 19:04:44.556988	19
2100	99	f	\N	2025-10-30 19:04:44.556988	19
2101	100	f	\N	2025-10-30 19:04:44.556988	19
2102	101	f	\N	2025-10-30 19:04:44.556988	19
2103	102	f	\N	2025-10-30 19:04:44.556988	19
2104	103	f	\N	2025-10-30 19:04:44.556988	19
2105	104	f	\N	2025-10-30 19:04:44.556988	19
2106	105	f	\N	2025-10-30 19:04:44.556988	19
2107	106	f	\N	2025-10-30 19:04:44.556988	19
2108	107	f	\N	2025-10-30 19:04:44.556988	19
2109	108	f	\N	2025-10-30 19:04:44.556988	19
2110	109	f	\N	2025-10-30 19:04:44.556988	19
2111	110	f	\N	2025-10-30 19:04:44.556988	19
2112	111	f	\N	2025-10-30 19:04:44.556988	19
2113	112	f	\N	2025-10-30 19:04:44.556988	19
2114	113	f	\N	2025-10-30 19:04:44.556988	19
2115	114	f	\N	2025-10-30 19:04:44.556988	19
2116	115	f	\N	2025-10-30 19:04:44.556988	19
2117	116	f	\N	2025-10-30 19:04:44.556988	19
2118	117	f	\N	2025-10-30 19:04:44.556988	19
2119	118	f	\N	2025-10-30 19:04:44.556988	19
2120	119	f	\N	2025-10-30 19:04:44.556988	19
2121	120	f	\N	2025-10-30 19:04:44.556988	19
2122	121	f	\N	2025-10-30 19:04:44.556988	19
2123	122	f	\N	2025-10-30 19:04:44.556988	19
2124	123	f	\N	2025-10-30 19:04:44.556988	19
2125	124	f	\N	2025-10-30 19:04:44.556988	19
2126	125	f	\N	2025-10-30 19:04:44.556988	19
2127	126	f	\N	2025-10-30 19:04:44.556988	19
2128	127	f	\N	2025-10-30 19:04:44.556988	19
2129	128	f	\N	2025-10-30 19:04:44.556988	19
2130	129	f	\N	2025-10-30 19:04:44.556988	19
2131	130	f	\N	2025-10-30 19:04:44.556988	19
2132	131	f	\N	2025-10-30 19:04:44.556988	19
2133	132	f	\N	2025-10-30 19:04:44.556988	19
2134	133	f	\N	2025-10-30 19:04:44.556988	19
2135	134	f	\N	2025-10-30 19:04:44.556988	19
2136	135	f	\N	2025-10-30 19:04:44.556988	19
2137	136	f	\N	2025-10-30 19:04:44.556988	19
2138	137	f	\N	2025-10-30 19:04:44.556988	19
2139	138	f	\N	2025-10-30 19:04:44.556988	19
2140	139	f	\N	2025-10-30 19:04:44.556988	19
2141	140	f	\N	2025-10-30 19:04:44.556988	19
2142	141	f	\N	2025-10-30 19:04:44.556988	19
2143	142	f	\N	2025-10-30 19:04:44.556988	19
2144	143	f	\N	2025-10-30 19:04:44.556988	19
2145	144	f	\N	2025-10-30 19:04:44.556988	19
2146	145	f	\N	2025-10-30 19:04:44.556988	19
2147	146	f	\N	2025-10-30 19:04:44.556988	19
2148	147	f	\N	2025-10-30 19:04:44.556988	19
2149	148	f	\N	2025-10-30 19:04:44.556988	19
2150	149	f	\N	2025-10-30 19:04:44.556988	19
2151	150	f	\N	2025-10-30 19:04:44.556988	19
2152	151	f	\N	2025-10-30 19:04:44.556988	19
2153	152	f	\N	2025-10-30 19:04:44.556988	19
2154	153	f	\N	2025-10-30 19:04:44.556988	19
2155	154	f	\N	2025-10-30 19:04:44.556988	19
2156	155	f	\N	2025-10-30 19:04:44.556988	19
2157	156	f	\N	2025-10-30 19:04:44.556988	19
2158	157	f	\N	2025-10-30 19:04:44.556988	19
2159	158	f	\N	2025-10-30 19:04:44.556988	19
2160	159	f	\N	2025-10-30 19:04:44.556988	19
2161	160	f	\N	2025-10-30 19:04:44.556988	19
2162	161	f	\N	2025-10-30 19:04:44.556988	19
2163	162	f	\N	2025-10-30 19:04:44.556988	19
2164	163	f	\N	2025-10-30 19:04:44.556988	19
2165	164	f	\N	2025-10-30 19:04:44.556988	19
2166	165	f	\N	2025-10-30 19:04:44.556988	19
2167	166	f	\N	2025-10-30 19:04:44.556988	19
2168	167	f	\N	2025-10-30 19:04:44.556988	19
2169	168	f	\N	2025-10-30 19:04:44.556988	19
2170	169	f	\N	2025-10-30 19:04:44.556988	19
2171	170	f	\N	2025-10-30 19:04:44.556988	19
2172	171	f	\N	2025-10-30 19:04:44.556988	19
2173	172	f	\N	2025-10-30 19:04:44.556988	19
2174	173	f	\N	2025-10-30 19:04:44.556988	19
2175	174	f	\N	2025-10-30 19:04:44.556988	19
2176	175	f	\N	2025-10-30 19:04:44.556988	19
2177	176	f	\N	2025-10-30 19:04:44.556988	19
2178	177	f	\N	2025-10-30 19:04:44.556988	19
2179	178	f	\N	2025-10-30 19:04:44.556988	19
2180	179	f	\N	2025-10-30 19:04:44.556988	19
2181	180	f	\N	2025-10-30 19:04:44.556988	19
2182	181	f	\N	2025-10-30 19:04:44.556988	19
2183	182	f	\N	2025-10-30 19:04:44.556988	19
2184	183	f	\N	2025-10-30 19:04:44.556988	19
2185	184	f	\N	2025-10-30 19:04:44.556988	19
2186	185	f	\N	2025-10-30 19:04:44.556988	19
2187	186	f	\N	2025-10-30 19:04:44.556988	19
2188	187	f	\N	2025-10-30 19:04:44.556988	19
2189	188	f	\N	2025-10-30 19:04:44.556988	19
2190	189	f	\N	2025-10-30 19:04:44.556988	19
2191	190	f	\N	2025-10-30 19:04:44.556988	19
2192	191	f	\N	2025-10-30 19:04:44.556988	19
2193	192	f	\N	2025-10-30 19:04:44.556988	19
2194	193	f	\N	2025-10-30 19:04:44.556988	19
2195	194	f	\N	2025-10-30 19:04:44.556988	19
2196	195	f	\N	2025-10-30 19:04:44.556988	19
2197	196	f	\N	2025-10-30 19:04:44.556988	19
2198	197	f	\N	2025-10-30 19:04:44.556988	19
2199	198	f	\N	2025-10-30 19:04:44.556988	19
2200	199	f	\N	2025-10-30 19:04:44.556988	19
2201	200	f	\N	2025-10-30 19:04:44.556988	19
2202	201	f	\N	2025-10-30 19:04:44.556988	19
2203	202	f	\N	2025-10-30 19:04:44.556988	19
2204	203	f	\N	2025-10-30 19:04:44.556988	19
2205	204	f	\N	2025-10-30 19:04:44.556988	19
2206	205	f	\N	2025-10-30 19:04:44.556988	19
2207	206	f	\N	2025-10-30 19:04:44.556988	19
2208	207	f	\N	2025-10-30 19:04:44.556988	19
2209	208	f	\N	2025-10-30 19:04:44.556988	19
2210	209	f	\N	2025-10-30 19:04:44.556988	19
2211	210	f	\N	2025-10-30 19:04:44.556988	19
2212	211	f	\N	2025-10-30 19:04:44.556988	19
2213	212	f	\N	2025-10-30 19:04:44.556988	19
2214	213	f	\N	2025-10-30 19:04:44.556988	19
2215	214	f	\N	2025-10-30 19:04:44.556988	19
2216	215	f	\N	2025-10-30 19:04:44.556988	19
2217	216	f	\N	2025-10-30 19:04:44.556988	19
2218	217	f	\N	2025-10-30 19:04:44.556988	19
2219	218	f	\N	2025-10-30 19:04:44.556988	19
2220	219	f	\N	2025-10-30 19:04:44.556988	19
2221	220	f	\N	2025-10-30 19:04:44.556988	19
2222	221	f	\N	2025-10-30 19:04:44.556988	19
2223	222	f	\N	2025-10-30 19:04:44.556988	19
2224	223	f	\N	2025-10-30 19:04:44.556988	19
2225	224	f	\N	2025-10-30 19:04:44.556988	19
2226	225	f	\N	2025-10-30 19:04:44.556988	19
2227	226	f	\N	2025-10-30 19:04:44.556988	19
2228	227	f	\N	2025-10-30 19:04:44.556988	19
2229	228	f	\N	2025-10-30 19:04:44.556988	19
2230	229	f	\N	2025-10-30 19:04:44.556988	19
2231	230	f	\N	2025-10-30 19:04:44.556988	19
2232	231	f	\N	2025-10-30 19:04:44.556988	19
2233	232	f	\N	2025-10-30 19:04:44.556988	19
2234	233	f	\N	2025-10-30 19:04:44.556988	19
2235	234	f	\N	2025-10-30 19:04:44.556988	19
2236	235	f	\N	2025-10-30 19:04:44.556988	19
2237	236	f	\N	2025-10-30 19:04:44.556988	19
2238	237	f	\N	2025-10-30 19:04:44.556988	19
2239	238	f	\N	2025-10-30 19:04:44.556988	19
2240	239	f	\N	2025-10-30 19:04:44.556988	19
2241	240	f	\N	2025-10-30 19:04:44.556988	19
2242	241	f	\N	2025-10-30 19:04:44.556988	19
2243	242	f	\N	2025-10-30 19:04:44.556988	19
2244	243	f	\N	2025-10-30 19:04:44.556988	19
2245	244	f	\N	2025-10-30 19:04:44.556988	19
2246	245	f	\N	2025-10-30 19:04:44.556988	19
2247	246	f	\N	2025-10-30 19:04:44.556988	19
2248	247	f	\N	2025-10-30 19:04:44.556988	19
2249	248	f	\N	2025-10-30 19:04:44.556988	19
2250	249	f	\N	2025-10-30 19:04:44.556988	19
2251	250	f	\N	2025-10-30 19:04:44.556988	19
2252	251	f	\N	2025-10-30 19:04:44.556988	19
2253	252	f	\N	2025-10-30 19:04:44.556988	19
2254	253	f	\N	2025-10-30 19:04:44.556988	19
2255	254	f	\N	2025-10-30 19:04:44.556988	19
2256	255	f	\N	2025-10-30 19:04:44.556988	19
2257	256	f	\N	2025-10-30 19:04:44.556988	19
2258	257	f	\N	2025-10-30 19:04:44.556988	19
2259	258	f	\N	2025-10-30 19:04:44.556988	19
2260	259	f	\N	2025-10-30 19:04:44.556988	19
2261	260	f	\N	2025-10-30 19:04:44.556988	19
2262	261	f	\N	2025-10-30 19:04:44.556988	19
2263	262	f	\N	2025-10-30 19:04:44.556988	19
2264	263	f	\N	2025-10-30 19:04:44.556988	19
2265	264	f	\N	2025-10-30 19:04:44.556988	19
2266	265	f	\N	2025-10-30 19:04:44.556988	19
2267	266	f	\N	2025-10-30 19:04:44.556988	19
2268	267	f	\N	2025-10-30 19:04:44.556988	19
2269	268	f	\N	2025-10-30 19:04:44.556988	19
2270	269	f	\N	2025-10-30 19:04:44.556988	19
2271	270	f	\N	2025-10-30 19:04:44.556988	19
2272	271	f	\N	2025-10-30 19:04:44.556988	19
2273	272	f	\N	2025-10-30 19:04:44.556988	19
2274	273	f	\N	2025-10-30 19:04:44.556988	19
2275	274	f	\N	2025-10-30 19:04:44.556988	19
2276	275	f	\N	2025-10-30 19:04:44.556988	19
2277	276	f	\N	2025-10-30 19:04:44.556988	19
2278	277	f	\N	2025-10-30 19:04:44.556988	19
2279	278	f	\N	2025-10-30 19:04:44.556988	19
2280	279	f	\N	2025-10-30 19:04:44.556988	19
2281	280	f	\N	2025-10-30 19:04:44.556988	19
2282	281	f	\N	2025-10-30 19:04:44.556988	19
2283	282	f	\N	2025-10-30 19:04:44.556988	19
2284	283	f	\N	2025-10-30 19:04:44.556988	19
2285	284	f	\N	2025-10-30 19:04:44.556988	19
2286	285	f	\N	2025-10-30 19:04:44.556988	19
2287	286	f	\N	2025-10-30 19:04:44.556988	19
2288	287	f	\N	2025-10-30 19:04:44.556988	19
2289	288	f	\N	2025-10-30 19:04:44.556988	19
2290	289	f	\N	2025-10-30 19:04:44.556988	19
2291	290	f	\N	2025-10-30 19:04:44.556988	19
2292	291	f	\N	2025-10-30 19:04:44.556988	19
2293	292	f	\N	2025-10-30 19:04:44.556988	19
2294	293	f	\N	2025-10-30 19:04:44.556988	19
2295	294	f	\N	2025-10-30 19:04:44.556988	19
2296	295	f	\N	2025-10-30 19:04:44.556988	19
2297	296	f	\N	2025-10-30 19:04:44.556988	19
2298	297	f	\N	2025-10-30 19:04:44.556988	19
2299	298	f	\N	2025-10-30 19:04:44.556988	19
2300	299	f	\N	2025-10-30 19:04:44.556988	19
2301	300	f	\N	2025-10-30 19:04:44.556988	19
2302	301	f	\N	2025-10-30 19:04:44.556988	19
2303	302	f	\N	2025-10-30 19:04:44.556988	19
2304	303	f	\N	2025-10-30 19:04:44.556988	19
2305	304	f	\N	2025-10-30 19:04:44.556988	19
2306	305	f	\N	2025-10-30 19:04:44.556988	19
2307	306	f	\N	2025-10-30 19:04:44.556988	19
2308	307	f	\N	2025-10-30 19:04:44.556988	19
2309	308	f	\N	2025-10-30 19:04:44.556988	19
2310	309	f	\N	2025-10-30 19:04:44.556988	19
2311	310	f	\N	2025-10-30 19:04:44.556988	19
2312	311	f	\N	2025-10-30 19:04:44.556988	19
2313	312	f	\N	2025-10-30 19:04:44.556988	19
2314	313	f	\N	2025-10-30 19:04:44.556988	19
2315	314	f	\N	2025-10-30 19:04:44.556988	19
2316	315	f	\N	2025-10-30 19:04:44.556988	19
2317	316	f	\N	2025-10-30 19:04:44.556988	19
2318	317	f	\N	2025-10-30 19:04:44.556988	19
2319	318	f	\N	2025-10-30 19:04:44.556988	19
2320	319	f	\N	2025-10-30 19:04:44.556988	19
2321	320	f	\N	2025-10-30 19:04:44.556988	19
2322	321	f	\N	2025-10-30 19:04:44.556988	19
2323	322	f	\N	2025-10-30 19:04:44.556988	19
2324	323	f	\N	2025-10-30 19:04:44.556988	19
2325	324	f	\N	2025-10-30 19:04:44.556988	19
2326	325	f	\N	2025-10-30 19:04:44.556988	19
2327	326	f	\N	2025-10-30 19:04:44.556988	19
2328	327	f	\N	2025-10-30 19:04:44.556988	19
2329	328	f	\N	2025-10-30 19:04:44.556988	19
2330	329	f	\N	2025-10-30 19:04:44.556988	19
2331	330	f	\N	2025-10-30 19:04:44.556988	19
2332	331	f	\N	2025-10-30 19:04:44.556988	19
2333	332	f	\N	2025-10-30 19:04:44.556988	19
2334	333	f	\N	2025-10-30 19:04:44.556988	19
2335	334	f	\N	2025-10-30 19:04:44.556988	19
2336	335	f	\N	2025-10-30 19:04:44.556988	19
2337	336	f	\N	2025-10-30 19:04:44.556988	19
2338	337	f	\N	2025-10-30 19:04:44.556988	19
2339	338	f	\N	2025-10-30 19:04:44.556988	19
2340	339	f	\N	2025-10-30 19:04:44.556988	19
2341	340	f	\N	2025-10-30 19:04:44.556988	19
2342	341	f	\N	2025-10-30 19:04:44.556988	19
2343	342	f	\N	2025-10-30 19:04:44.556988	19
2344	343	f	\N	2025-10-30 19:04:44.556988	19
2345	344	f	\N	2025-10-30 19:04:44.556988	19
2346	345	f	\N	2025-10-30 19:04:44.556988	19
2347	346	f	\N	2025-10-30 19:04:44.556988	19
2348	347	f	\N	2025-10-30 19:04:44.556988	19
2349	348	f	\N	2025-10-30 19:04:44.556988	19
2350	349	f	\N	2025-10-30 19:04:44.556988	19
2351	350	f	\N	2025-10-30 19:04:44.556988	19
2352	351	f	\N	2025-10-30 19:04:44.556988	19
2353	352	f	\N	2025-10-30 19:04:44.556988	19
2354	353	f	\N	2025-10-30 19:04:44.556988	19
2355	354	f	\N	2025-10-30 19:04:44.556988	19
2356	355	f	\N	2025-10-30 19:04:44.556988	19
2357	356	f	\N	2025-10-30 19:04:44.556988	19
2358	357	f	\N	2025-10-30 19:04:44.556988	19
2359	358	f	\N	2025-10-30 19:04:44.556988	19
2360	359	f	\N	2025-10-30 19:04:44.556988	19
2361	360	f	\N	2025-10-30 19:04:44.556988	19
2362	361	f	\N	2025-10-30 19:04:44.556988	19
2363	362	f	\N	2025-10-30 19:04:44.556988	19
2364	363	f	\N	2025-10-30 19:04:44.556988	19
2365	364	f	\N	2025-10-30 19:04:44.556988	19
2366	365	f	\N	2025-10-30 19:04:44.556988	19
2367	366	f	\N	2025-10-30 19:04:44.556988	19
2368	367	f	\N	2025-10-30 19:04:44.556988	19
2369	368	f	\N	2025-10-30 19:04:44.556988	19
2370	369	f	\N	2025-10-30 19:04:44.556988	19
2371	370	f	\N	2025-10-30 19:04:44.556988	19
2372	371	f	\N	2025-10-30 19:04:44.556988	19
2373	372	f	\N	2025-10-30 19:04:44.556988	19
2374	373	f	\N	2025-10-30 19:04:44.556988	19
2375	374	f	\N	2025-10-30 19:04:44.556988	19
2376	375	f	\N	2025-10-30 19:04:44.556988	19
2377	376	f	\N	2025-10-30 19:04:44.556988	19
2378	377	f	\N	2025-10-30 19:04:44.556988	19
2379	378	f	\N	2025-10-30 19:04:44.556988	19
2380	379	f	\N	2025-10-30 19:04:44.556988	19
2381	380	f	\N	2025-10-30 19:04:44.556988	19
2382	381	f	\N	2025-10-30 19:04:44.556988	19
2383	382	f	\N	2025-10-30 19:04:44.556988	19
2384	383	f	\N	2025-10-30 19:04:44.556988	19
2385	384	f	\N	2025-10-30 19:04:44.556988	19
2386	385	f	\N	2025-10-30 19:04:44.556988	19
2387	386	f	\N	2025-10-30 19:04:44.556988	19
2388	387	f	\N	2025-10-30 19:04:44.556988	19
2389	388	f	\N	2025-10-30 19:04:44.556988	19
2390	389	f	\N	2025-10-30 19:04:44.556988	19
2391	390	f	\N	2025-10-30 19:04:44.556988	19
2392	391	f	\N	2025-10-30 19:04:44.556988	19
2393	392	f	\N	2025-10-30 19:04:44.556988	19
2394	393	f	\N	2025-10-30 19:04:44.556988	19
2395	394	f	\N	2025-10-30 19:04:44.556988	19
2396	395	f	\N	2025-10-30 19:04:44.556988	19
2397	396	f	\N	2025-10-30 19:04:44.556988	19
2398	397	f	\N	2025-10-30 19:04:44.556988	19
2399	398	f	\N	2025-10-30 19:04:44.556988	19
2400	399	f	\N	2025-10-30 19:04:44.556988	19
2401	400	f	\N	2025-10-30 19:04:44.556988	19
2402	401	f	\N	2025-10-30 19:04:44.556988	19
2403	402	f	\N	2025-10-30 19:04:44.556988	19
2404	403	f	\N	2025-10-30 19:04:44.556988	19
2405	404	f	\N	2025-10-30 19:04:44.556988	19
2406	405	f	\N	2025-10-30 19:04:44.556988	19
2407	406	f	\N	2025-10-30 19:04:44.556988	19
2408	407	f	\N	2025-10-30 19:04:44.556988	19
2409	408	f	\N	2025-10-30 19:04:44.556988	19
2410	409	f	\N	2025-10-30 19:04:44.556988	19
2411	410	f	\N	2025-10-30 19:04:44.556988	19
2412	411	f	\N	2025-10-30 19:04:44.556988	19
2413	412	f	\N	2025-10-30 19:04:44.556988	19
2414	413	f	\N	2025-10-30 19:04:44.556988	19
2415	414	f	\N	2025-10-30 19:04:44.556988	19
2416	415	f	\N	2025-10-30 19:04:44.556988	19
2417	416	f	\N	2025-10-30 19:04:44.556988	19
2418	417	f	\N	2025-10-30 19:04:44.556988	19
2419	418	f	\N	2025-10-30 19:04:44.556988	19
2420	419	f	\N	2025-10-30 19:04:44.556988	19
2421	420	f	\N	2025-10-30 19:04:44.556988	19
2422	421	f	\N	2025-10-30 19:04:44.556988	19
2423	422	f	\N	2025-10-30 19:04:44.556988	19
2424	423	f	\N	2025-10-30 19:04:44.556988	19
2425	424	f	\N	2025-10-30 19:04:44.556988	19
2426	425	f	\N	2025-10-30 19:04:44.556988	19
2427	426	f	\N	2025-10-30 19:04:44.556988	19
2428	427	f	\N	2025-10-30 19:04:44.556988	19
2429	428	f	\N	2025-10-30 19:04:44.556988	19
2430	429	f	\N	2025-10-30 19:04:44.556988	19
2431	430	f	\N	2025-10-30 19:04:44.556988	19
2432	431	f	\N	2025-10-30 19:04:44.556988	19
2433	432	f	\N	2025-10-30 19:04:44.556988	19
2434	433	f	\N	2025-10-30 19:04:44.556988	19
2435	434	f	\N	2025-10-30 19:04:44.556988	19
2436	435	f	\N	2025-10-30 19:04:44.556988	19
2437	436	f	\N	2025-10-30 19:04:44.556988	19
2438	437	f	\N	2025-10-30 19:04:44.556988	19
2439	438	f	\N	2025-10-30 19:04:44.556988	19
2440	439	f	\N	2025-10-30 19:04:44.556988	19
2441	440	f	\N	2025-10-30 19:04:44.556988	19
2442	441	f	\N	2025-10-30 19:04:44.556988	19
2443	442	f	\N	2025-10-30 19:04:44.556988	19
2444	443	f	\N	2025-10-30 19:04:44.556988	19
2445	444	f	\N	2025-10-30 19:04:44.556988	19
2446	445	f	\N	2025-10-30 19:04:44.556988	19
2447	446	f	\N	2025-10-30 19:04:44.556988	19
2448	447	f	\N	2025-10-30 19:04:44.556988	19
2449	448	f	\N	2025-10-30 19:04:44.556988	19
2450	449	f	\N	2025-10-30 19:04:44.556988	19
2451	450	f	\N	2025-10-30 19:04:44.556988	19
2452	451	f	\N	2025-10-30 19:04:44.556988	19
2453	452	f	\N	2025-10-30 19:04:44.556988	19
2454	453	f	\N	2025-10-30 19:04:44.556988	19
2455	454	f	\N	2025-10-30 19:04:44.556988	19
2456	455	f	\N	2025-10-30 19:04:44.556988	19
2457	456	f	\N	2025-10-30 19:04:44.556988	19
2458	457	f	\N	2025-10-30 19:04:44.556988	19
2459	458	f	\N	2025-10-30 19:04:44.556988	19
2460	459	f	\N	2025-10-30 19:04:44.556988	19
2461	460	f	\N	2025-10-30 19:04:44.556988	19
2462	461	f	\N	2025-10-30 19:04:44.556988	19
2463	462	f	\N	2025-10-30 19:04:44.556988	19
2464	463	f	\N	2025-10-30 19:04:44.556988	19
2465	464	f	\N	2025-10-30 19:04:44.556988	19
2466	465	f	\N	2025-10-30 19:04:44.556988	19
2467	466	f	\N	2025-10-30 19:04:44.556988	19
2468	467	f	\N	2025-10-30 19:04:44.556988	19
2469	468	f	\N	2025-10-30 19:04:44.556988	19
2470	469	f	\N	2025-10-30 19:04:44.556988	19
2471	470	f	\N	2025-10-30 19:04:44.556988	19
2472	471	f	\N	2025-10-30 19:04:44.556988	19
2473	472	f	\N	2025-10-30 19:04:44.556988	19
2474	473	f	\N	2025-10-30 19:04:44.556988	19
2475	474	f	\N	2025-10-30 19:04:44.556988	19
2476	475	f	\N	2025-10-30 19:04:44.556988	19
2477	476	f	\N	2025-10-30 19:04:44.556988	19
2478	477	f	\N	2025-10-30 19:04:44.556988	19
2479	478	f	\N	2025-10-30 19:04:44.556988	19
2480	479	f	\N	2025-10-30 19:04:44.556988	19
2481	480	f	\N	2025-10-30 19:04:44.556988	19
2482	481	f	\N	2025-10-30 19:04:44.556988	19
2483	482	f	\N	2025-10-30 19:04:44.556988	19
2484	483	f	\N	2025-10-30 19:04:44.556988	19
2485	484	f	\N	2025-10-30 19:04:44.556988	19
2486	485	f	\N	2025-10-30 19:04:44.556988	19
2487	486	f	\N	2025-10-30 19:04:44.556988	19
2488	487	f	\N	2025-10-30 19:04:44.556988	19
2489	488	f	\N	2025-10-30 19:04:44.556988	19
2490	489	f	\N	2025-10-30 19:04:44.556988	19
2491	490	f	\N	2025-10-30 19:04:44.556988	19
2492	491	f	\N	2025-10-30 19:04:44.556988	19
2493	492	f	\N	2025-10-30 19:04:44.556988	19
2494	493	f	\N	2025-10-30 19:04:44.556988	19
2495	494	f	\N	2025-10-30 19:04:44.556988	19
2496	495	f	\N	2025-10-30 19:04:44.556988	19
2497	496	f	\N	2025-10-30 19:04:44.556988	19
2498	497	f	\N	2025-10-30 19:04:44.556988	19
2499	498	f	\N	2025-10-30 19:04:44.556988	19
2500	499	f	\N	2025-10-30 19:04:44.556988	19
2501	500	f	\N	2025-10-30 19:04:44.556988	19
2502	1	f	\N	2025-10-30 19:46:57.720257	20
2503	2	f	\N	2025-10-30 19:46:57.720257	20
2504	3	f	\N	2025-10-30 19:46:57.720257	20
2505	4	f	\N	2025-10-30 19:46:57.720257	20
2506	5	f	\N	2025-10-30 19:46:57.720257	20
2507	6	f	\N	2025-10-30 19:46:57.720257	20
2508	7	f	\N	2025-10-30 19:46:57.720257	20
2509	8	f	\N	2025-10-30 19:46:57.720257	20
2510	9	f	\N	2025-10-30 19:46:57.720257	20
2511	10	f	\N	2025-10-30 19:46:57.720257	20
2512	11	f	\N	2025-10-30 19:46:57.720257	20
2513	12	f	\N	2025-10-30 19:46:57.720257	20
2514	13	f	\N	2025-10-30 19:46:57.720257	20
2515	14	f	\N	2025-10-30 19:46:57.720257	20
2516	15	f	\N	2025-10-30 19:46:57.720257	20
2517	16	f	\N	2025-10-30 19:46:57.720257	20
2518	17	f	\N	2025-10-30 19:46:57.720257	20
2519	18	f	\N	2025-10-30 19:46:57.720257	20
2520	19	f	\N	2025-10-30 19:46:57.720257	20
2521	20	f	\N	2025-10-30 19:46:57.720257	20
2522	21	f	\N	2025-10-30 19:46:57.720257	20
2523	22	f	\N	2025-10-30 19:46:57.720257	20
2524	23	f	\N	2025-10-30 19:46:57.720257	20
2525	24	f	\N	2025-10-30 19:46:57.720257	20
2526	25	f	\N	2025-10-30 19:46:57.720257	20
2527	26	f	\N	2025-10-30 19:46:57.720257	20
2528	27	f	\N	2025-10-30 19:46:57.720257	20
2529	28	f	\N	2025-10-30 19:46:57.720257	20
2530	29	f	\N	2025-10-30 19:46:57.720257	20
2531	30	f	\N	2025-10-30 19:46:57.720257	20
2532	31	f	\N	2025-10-30 19:46:57.720257	20
2533	32	f	\N	2025-10-30 19:46:57.720257	20
2534	33	f	\N	2025-10-30 19:46:57.720257	20
2535	34	f	\N	2025-10-30 19:46:57.720257	20
2536	35	f	\N	2025-10-30 19:46:57.720257	20
2537	36	f	\N	2025-10-30 19:46:57.720257	20
2538	37	f	\N	2025-10-30 19:46:57.720257	20
2539	38	f	\N	2025-10-30 19:46:57.720257	20
2540	39	f	\N	2025-10-30 19:46:57.720257	20
2541	40	f	\N	2025-10-30 19:46:57.720257	20
2542	41	f	\N	2025-10-30 19:46:57.720257	20
2543	42	f	\N	2025-10-30 19:46:57.720257	20
2544	43	f	\N	2025-10-30 19:46:57.720257	20
2545	44	f	\N	2025-10-30 19:46:57.720257	20
2546	45	f	\N	2025-10-30 19:46:57.720257	20
2547	46	f	\N	2025-10-30 19:46:57.720257	20
2548	47	f	\N	2025-10-30 19:46:57.720257	20
2549	48	f	\N	2025-10-30 19:46:57.720257	20
2550	49	f	\N	2025-10-30 19:46:57.720257	20
2551	50	f	\N	2025-10-30 19:46:57.720257	20
2552	51	f	\N	2025-10-30 19:46:57.720257	20
2553	52	f	\N	2025-10-30 19:46:57.720257	20
2554	53	f	\N	2025-10-30 19:46:57.720257	20
2555	54	f	\N	2025-10-30 19:46:57.720257	20
2556	55	f	\N	2025-10-30 19:46:57.720257	20
2557	56	f	\N	2025-10-30 19:46:57.720257	20
2558	57	f	\N	2025-10-30 19:46:57.720257	20
2559	58	f	\N	2025-10-30 19:46:57.720257	20
2560	59	f	\N	2025-10-30 19:46:57.720257	20
2561	60	f	\N	2025-10-30 19:46:57.720257	20
2562	61	f	\N	2025-10-30 19:46:57.720257	20
2563	62	f	\N	2025-10-30 19:46:57.720257	20
2564	63	f	\N	2025-10-30 19:46:57.720257	20
2565	64	f	\N	2025-10-30 19:46:57.720257	20
2566	65	f	\N	2025-10-30 19:46:57.720257	20
2567	66	f	\N	2025-10-30 19:46:57.720257	20
2568	67	f	\N	2025-10-30 19:46:57.720257	20
2569	68	f	\N	2025-10-30 19:46:57.720257	20
2570	69	f	\N	2025-10-30 19:46:57.720257	20
2571	70	f	\N	2025-10-30 19:46:57.720257	20
2572	71	f	\N	2025-10-30 19:46:57.720257	20
2573	72	f	\N	2025-10-30 19:46:57.720257	20
2574	73	f	\N	2025-10-30 19:46:57.720257	20
2575	74	f	\N	2025-10-30 19:46:57.720257	20
2576	75	f	\N	2025-10-30 19:46:57.720257	20
2577	76	f	\N	2025-10-30 19:46:57.720257	20
2578	77	f	\N	2025-10-30 19:46:57.720257	20
2579	78	f	\N	2025-10-30 19:46:57.720257	20
2580	79	f	\N	2025-10-30 19:46:57.720257	20
2581	80	f	\N	2025-10-30 19:46:57.720257	20
2582	81	f	\N	2025-10-30 19:46:57.720257	20
2583	82	f	\N	2025-10-30 19:46:57.720257	20
2584	83	f	\N	2025-10-30 19:46:57.720257	20
2585	84	f	\N	2025-10-30 19:46:57.720257	20
2586	85	f	\N	2025-10-30 19:46:57.720257	20
2587	86	f	\N	2025-10-30 19:46:57.720257	20
2588	87	f	\N	2025-10-30 19:46:57.720257	20
2589	88	f	\N	2025-10-30 19:46:57.720257	20
2590	89	f	\N	2025-10-30 19:46:57.720257	20
2591	90	f	\N	2025-10-30 19:46:57.720257	20
2592	91	f	\N	2025-10-30 19:46:57.720257	20
2593	92	f	\N	2025-10-30 19:46:57.720257	20
2594	93	f	\N	2025-10-30 19:46:57.720257	20
2595	94	f	\N	2025-10-30 19:46:57.720257	20
2596	95	f	\N	2025-10-30 19:46:57.720257	20
2597	96	f	\N	2025-10-30 19:46:57.720257	20
2598	97	f	\N	2025-10-30 19:46:57.720257	20
2599	98	f	\N	2025-10-30 19:46:57.720257	20
2600	99	f	\N	2025-10-30 19:46:57.720257	20
2601	100	f	\N	2025-10-30 19:46:57.720257	20
2602	101	f	\N	2025-10-30 19:46:57.720257	20
2603	102	f	\N	2025-10-30 19:46:57.720257	20
2604	103	f	\N	2025-10-30 19:46:57.720257	20
2605	104	f	\N	2025-10-30 19:46:57.720257	20
2606	105	f	\N	2025-10-30 19:46:57.720257	20
2607	106	f	\N	2025-10-30 19:46:57.720257	20
2608	107	f	\N	2025-10-30 19:46:57.720257	20
2609	108	f	\N	2025-10-30 19:46:57.720257	20
2610	109	f	\N	2025-10-30 19:46:57.720257	20
2611	110	f	\N	2025-10-30 19:46:57.720257	20
2612	111	f	\N	2025-10-30 19:46:57.720257	20
2613	112	f	\N	2025-10-30 19:46:57.720257	20
2614	113	f	\N	2025-10-30 19:46:57.720257	20
2615	114	f	\N	2025-10-30 19:46:57.720257	20
2616	115	f	\N	2025-10-30 19:46:57.720257	20
2617	116	f	\N	2025-10-30 19:46:57.720257	20
2618	117	f	\N	2025-10-30 19:46:57.720257	20
2619	118	f	\N	2025-10-30 19:46:57.720257	20
2620	119	f	\N	2025-10-30 19:46:57.720257	20
2621	120	f	\N	2025-10-30 19:46:57.720257	20
2622	121	f	\N	2025-10-30 19:46:57.720257	20
2623	122	f	\N	2025-10-30 19:46:57.720257	20
2624	123	f	\N	2025-10-30 19:46:57.720257	20
2625	124	f	\N	2025-10-30 19:46:57.720257	20
2626	125	f	\N	2025-10-30 19:46:57.720257	20
2627	126	f	\N	2025-10-30 19:46:57.720257	20
2628	127	f	\N	2025-10-30 19:46:57.720257	20
2629	128	f	\N	2025-10-30 19:46:57.720257	20
2630	129	f	\N	2025-10-30 19:46:57.720257	20
2631	130	f	\N	2025-10-30 19:46:57.720257	20
2632	131	f	\N	2025-10-30 19:46:57.720257	20
2633	132	f	\N	2025-10-30 19:46:57.720257	20
2634	133	f	\N	2025-10-30 19:46:57.720257	20
2635	134	f	\N	2025-10-30 19:46:57.720257	20
2636	135	f	\N	2025-10-30 19:46:57.720257	20
2637	136	f	\N	2025-10-30 19:46:57.720257	20
2638	137	f	\N	2025-10-30 19:46:57.720257	20
2639	138	f	\N	2025-10-30 19:46:57.720257	20
2640	139	f	\N	2025-10-30 19:46:57.720257	20
2641	140	f	\N	2025-10-30 19:46:57.720257	20
2642	141	f	\N	2025-10-30 19:46:57.720257	20
2643	142	f	\N	2025-10-30 19:46:57.720257	20
2644	143	f	\N	2025-10-30 19:46:57.720257	20
2645	144	f	\N	2025-10-30 19:46:57.720257	20
2646	145	f	\N	2025-10-30 19:46:57.720257	20
2647	146	f	\N	2025-10-30 19:46:57.720257	20
2648	147	f	\N	2025-10-30 19:46:57.720257	20
2649	148	f	\N	2025-10-30 19:46:57.720257	20
2650	149	f	\N	2025-10-30 19:46:57.720257	20
2651	150	f	\N	2025-10-30 19:46:57.720257	20
2652	151	f	\N	2025-10-30 19:46:57.720257	20
2653	152	f	\N	2025-10-30 19:46:57.720257	20
2654	153	f	\N	2025-10-30 19:46:57.720257	20
2655	154	f	\N	2025-10-30 19:46:57.720257	20
2656	155	f	\N	2025-10-30 19:46:57.720257	20
2657	156	f	\N	2025-10-30 19:46:57.720257	20
2658	157	f	\N	2025-10-30 19:46:57.720257	20
2659	158	f	\N	2025-10-30 19:46:57.720257	20
2660	159	f	\N	2025-10-30 19:46:57.720257	20
2661	160	f	\N	2025-10-30 19:46:57.720257	20
2662	161	f	\N	2025-10-30 19:46:57.720257	20
2663	162	f	\N	2025-10-30 19:46:57.720257	20
2664	163	f	\N	2025-10-30 19:46:57.720257	20
2665	164	f	\N	2025-10-30 19:46:57.720257	20
2666	165	f	\N	2025-10-30 19:46:57.720257	20
2667	166	f	\N	2025-10-30 19:46:57.720257	20
2668	167	f	\N	2025-10-30 19:46:57.720257	20
2669	168	f	\N	2025-10-30 19:46:57.720257	20
2670	169	f	\N	2025-10-30 19:46:57.720257	20
2671	170	f	\N	2025-10-30 19:46:57.720257	20
2672	171	f	\N	2025-10-30 19:46:57.720257	20
2673	172	f	\N	2025-10-30 19:46:57.720257	20
2674	173	f	\N	2025-10-30 19:46:57.720257	20
2675	174	f	\N	2025-10-30 19:46:57.720257	20
2676	175	f	\N	2025-10-30 19:46:57.720257	20
2677	176	f	\N	2025-10-30 19:46:57.720257	20
2678	177	f	\N	2025-10-30 19:46:57.720257	20
2679	178	f	\N	2025-10-30 19:46:57.720257	20
2680	179	f	\N	2025-10-30 19:46:57.720257	20
2681	180	f	\N	2025-10-30 19:46:57.720257	20
2682	181	f	\N	2025-10-30 19:46:57.720257	20
2683	182	f	\N	2025-10-30 19:46:57.720257	20
2684	183	f	\N	2025-10-30 19:46:57.720257	20
2685	184	f	\N	2025-10-30 19:46:57.720257	20
2686	185	f	\N	2025-10-30 19:46:57.720257	20
2687	186	f	\N	2025-10-30 19:46:57.720257	20
2688	187	f	\N	2025-10-30 19:46:57.720257	20
2689	188	f	\N	2025-10-30 19:46:57.720257	20
2690	189	f	\N	2025-10-30 19:46:57.720257	20
2691	190	f	\N	2025-10-30 19:46:57.720257	20
2692	191	f	\N	2025-10-30 19:46:57.720257	20
2693	192	f	\N	2025-10-30 19:46:57.720257	20
2694	193	f	\N	2025-10-30 19:46:57.720257	20
2695	194	f	\N	2025-10-30 19:46:57.720257	20
2696	195	f	\N	2025-10-30 19:46:57.720257	20
2697	196	f	\N	2025-10-30 19:46:57.720257	20
2698	197	f	\N	2025-10-30 19:46:57.720257	20
2699	198	f	\N	2025-10-30 19:46:57.720257	20
2700	199	f	\N	2025-10-30 19:46:57.720257	20
2701	200	f	\N	2025-10-30 19:46:57.720257	20
2702	201	f	\N	2025-10-30 19:46:57.720257	20
2703	202	f	\N	2025-10-30 19:46:57.720257	20
2704	203	f	\N	2025-10-30 19:46:57.720257	20
2705	204	f	\N	2025-10-30 19:46:57.720257	20
2706	205	f	\N	2025-10-30 19:46:57.720257	20
2707	206	f	\N	2025-10-30 19:46:57.720257	20
2708	207	f	\N	2025-10-30 19:46:57.720257	20
2709	208	f	\N	2025-10-30 19:46:57.720257	20
2710	209	f	\N	2025-10-30 19:46:57.720257	20
2711	210	f	\N	2025-10-30 19:46:57.720257	20
2712	211	f	\N	2025-10-30 19:46:57.720257	20
2713	212	f	\N	2025-10-30 19:46:57.720257	20
2714	213	f	\N	2025-10-30 19:46:57.720257	20
2715	214	f	\N	2025-10-30 19:46:57.720257	20
2716	215	f	\N	2025-10-30 19:46:57.720257	20
2717	216	f	\N	2025-10-30 19:46:57.720257	20
2718	217	f	\N	2025-10-30 19:46:57.720257	20
2719	218	f	\N	2025-10-30 19:46:57.720257	20
2720	219	f	\N	2025-10-30 19:46:57.720257	20
2721	220	f	\N	2025-10-30 19:46:57.720257	20
2722	221	f	\N	2025-10-30 19:46:57.720257	20
2723	222	f	\N	2025-10-30 19:46:57.720257	20
2724	223	f	\N	2025-10-30 19:46:57.720257	20
2725	224	f	\N	2025-10-30 19:46:57.720257	20
2726	225	f	\N	2025-10-30 19:46:57.720257	20
2727	226	f	\N	2025-10-30 19:46:57.720257	20
2728	227	f	\N	2025-10-30 19:46:57.720257	20
2729	228	f	\N	2025-10-30 19:46:57.720257	20
2730	229	f	\N	2025-10-30 19:46:57.720257	20
2731	230	f	\N	2025-10-30 19:46:57.720257	20
2732	231	f	\N	2025-10-30 19:46:57.720257	20
2733	232	f	\N	2025-10-30 19:46:57.720257	20
2734	233	f	\N	2025-10-30 19:46:57.720257	20
2735	234	f	\N	2025-10-30 19:46:57.720257	20
2736	235	f	\N	2025-10-30 19:46:57.720257	20
2737	236	f	\N	2025-10-30 19:46:57.720257	20
2738	237	f	\N	2025-10-30 19:46:57.720257	20
2739	238	f	\N	2025-10-30 19:46:57.720257	20
2740	239	f	\N	2025-10-30 19:46:57.720257	20
2741	240	f	\N	2025-10-30 19:46:57.720257	20
2742	241	f	\N	2025-10-30 19:46:57.720257	20
2743	242	f	\N	2025-10-30 19:46:57.720257	20
2744	243	f	\N	2025-10-30 19:46:57.720257	20
2745	244	f	\N	2025-10-30 19:46:57.720257	20
2746	245	f	\N	2025-10-30 19:46:57.720257	20
2747	246	f	\N	2025-10-30 19:46:57.720257	20
2748	247	f	\N	2025-10-30 19:46:57.720257	20
2749	248	f	\N	2025-10-30 19:46:57.720257	20
2750	249	f	\N	2025-10-30 19:46:57.720257	20
2751	250	f	\N	2025-10-30 19:46:57.720257	20
2752	251	f	\N	2025-10-30 19:46:57.720257	20
2753	252	f	\N	2025-10-30 19:46:57.720257	20
2754	253	f	\N	2025-10-30 19:46:57.720257	20
2755	254	f	\N	2025-10-30 19:46:57.720257	20
2756	255	f	\N	2025-10-30 19:46:57.720257	20
2757	256	f	\N	2025-10-30 19:46:57.720257	20
2758	257	f	\N	2025-10-30 19:46:57.720257	20
2759	258	f	\N	2025-10-30 19:46:57.720257	20
2760	259	f	\N	2025-10-30 19:46:57.720257	20
2761	260	f	\N	2025-10-30 19:46:57.720257	20
2762	261	f	\N	2025-10-30 19:46:57.720257	20
2763	262	f	\N	2025-10-30 19:46:57.720257	20
2764	263	f	\N	2025-10-30 19:46:57.720257	20
2765	264	f	\N	2025-10-30 19:46:57.720257	20
2766	265	f	\N	2025-10-30 19:46:57.720257	20
2767	266	f	\N	2025-10-30 19:46:57.720257	20
2768	267	f	\N	2025-10-30 19:46:57.720257	20
2769	268	f	\N	2025-10-30 19:46:57.720257	20
2770	269	f	\N	2025-10-30 19:46:57.720257	20
2771	270	f	\N	2025-10-30 19:46:57.720257	20
2772	271	f	\N	2025-10-30 19:46:57.720257	20
2773	272	f	\N	2025-10-30 19:46:57.720257	20
2774	273	f	\N	2025-10-30 19:46:57.720257	20
2775	274	f	\N	2025-10-30 19:46:57.720257	20
2776	275	f	\N	2025-10-30 19:46:57.720257	20
2777	276	f	\N	2025-10-30 19:46:57.720257	20
2778	277	f	\N	2025-10-30 19:46:57.720257	20
2779	278	f	\N	2025-10-30 19:46:57.720257	20
2780	279	f	\N	2025-10-30 19:46:57.720257	20
2781	280	f	\N	2025-10-30 19:46:57.720257	20
2782	281	f	\N	2025-10-30 19:46:57.720257	20
2783	282	f	\N	2025-10-30 19:46:57.720257	20
2784	283	f	\N	2025-10-30 19:46:57.720257	20
2785	284	f	\N	2025-10-30 19:46:57.720257	20
2786	285	f	\N	2025-10-30 19:46:57.720257	20
2787	286	f	\N	2025-10-30 19:46:57.720257	20
2788	287	f	\N	2025-10-30 19:46:57.720257	20
2789	288	f	\N	2025-10-30 19:46:57.720257	20
2790	289	f	\N	2025-10-30 19:46:57.720257	20
2791	290	f	\N	2025-10-30 19:46:57.720257	20
2792	291	f	\N	2025-10-30 19:46:57.720257	20
2793	292	f	\N	2025-10-30 19:46:57.720257	20
2794	293	f	\N	2025-10-30 19:46:57.720257	20
2795	294	f	\N	2025-10-30 19:46:57.720257	20
2796	295	f	\N	2025-10-30 19:46:57.720257	20
2797	296	f	\N	2025-10-30 19:46:57.720257	20
2798	297	f	\N	2025-10-30 19:46:57.720257	20
2799	298	f	\N	2025-10-30 19:46:57.720257	20
2800	299	f	\N	2025-10-30 19:46:57.720257	20
2801	300	f	\N	2025-10-30 19:46:57.720257	20
2802	301	f	\N	2025-10-30 19:46:57.720257	20
2803	302	f	\N	2025-10-30 19:46:57.720257	20
2804	303	f	\N	2025-10-30 19:46:57.720257	20
2805	304	f	\N	2025-10-30 19:46:57.720257	20
2806	305	f	\N	2025-10-30 19:46:57.720257	20
2807	306	f	\N	2025-10-30 19:46:57.720257	20
2808	307	f	\N	2025-10-30 19:46:57.720257	20
2809	308	f	\N	2025-10-30 19:46:57.720257	20
2810	309	f	\N	2025-10-30 19:46:57.720257	20
2811	310	f	\N	2025-10-30 19:46:57.720257	20
2812	311	f	\N	2025-10-30 19:46:57.720257	20
2813	312	f	\N	2025-10-30 19:46:57.720257	20
2814	313	f	\N	2025-10-30 19:46:57.720257	20
2815	314	f	\N	2025-10-30 19:46:57.720257	20
2816	315	f	\N	2025-10-30 19:46:57.720257	20
2817	316	f	\N	2025-10-30 19:46:57.720257	20
2818	317	f	\N	2025-10-30 19:46:57.720257	20
2819	318	f	\N	2025-10-30 19:46:57.720257	20
2820	319	f	\N	2025-10-30 19:46:57.720257	20
2821	320	f	\N	2025-10-30 19:46:57.720257	20
2822	321	f	\N	2025-10-30 19:46:57.720257	20
2823	322	f	\N	2025-10-30 19:46:57.720257	20
2824	323	f	\N	2025-10-30 19:46:57.720257	20
2825	324	f	\N	2025-10-30 19:46:57.720257	20
2826	325	f	\N	2025-10-30 19:46:57.720257	20
2827	326	f	\N	2025-10-30 19:46:57.720257	20
2828	327	f	\N	2025-10-30 19:46:57.720257	20
2829	328	f	\N	2025-10-30 19:46:57.720257	20
2830	329	f	\N	2025-10-30 19:46:57.720257	20
2831	330	f	\N	2025-10-30 19:46:57.720257	20
2832	331	f	\N	2025-10-30 19:46:57.720257	20
2833	332	f	\N	2025-10-30 19:46:57.720257	20
2834	333	f	\N	2025-10-30 19:46:57.720257	20
2835	334	f	\N	2025-10-30 19:46:57.720257	20
2836	335	f	\N	2025-10-30 19:46:57.720257	20
2837	336	f	\N	2025-10-30 19:46:57.720257	20
2838	337	f	\N	2025-10-30 19:46:57.720257	20
2839	338	f	\N	2025-10-30 19:46:57.720257	20
2840	339	f	\N	2025-10-30 19:46:57.720257	20
2841	340	f	\N	2025-10-30 19:46:57.720257	20
2842	341	f	\N	2025-10-30 19:46:57.720257	20
2843	342	f	\N	2025-10-30 19:46:57.720257	20
2844	343	f	\N	2025-10-30 19:46:57.720257	20
2845	344	f	\N	2025-10-30 19:46:57.720257	20
2846	345	f	\N	2025-10-30 19:46:57.720257	20
2847	346	f	\N	2025-10-30 19:46:57.720257	20
2848	347	f	\N	2025-10-30 19:46:57.720257	20
2849	348	f	\N	2025-10-30 19:46:57.720257	20
2850	349	f	\N	2025-10-30 19:46:57.720257	20
2851	350	f	\N	2025-10-30 19:46:57.720257	20
2852	351	f	\N	2025-10-30 19:46:57.720257	20
2853	352	f	\N	2025-10-30 19:46:57.720257	20
2854	353	f	\N	2025-10-30 19:46:57.720257	20
2855	354	f	\N	2025-10-30 19:46:57.720257	20
2856	355	f	\N	2025-10-30 19:46:57.720257	20
2857	356	f	\N	2025-10-30 19:46:57.720257	20
2858	357	f	\N	2025-10-30 19:46:57.720257	20
2859	358	f	\N	2025-10-30 19:46:57.720257	20
2860	359	f	\N	2025-10-30 19:46:57.720257	20
2861	360	f	\N	2025-10-30 19:46:57.720257	20
2862	361	f	\N	2025-10-30 19:46:57.720257	20
2863	362	f	\N	2025-10-30 19:46:57.720257	20
2864	363	f	\N	2025-10-30 19:46:57.720257	20
2865	364	f	\N	2025-10-30 19:46:57.720257	20
2866	365	f	\N	2025-10-30 19:46:57.720257	20
2867	366	f	\N	2025-10-30 19:46:57.720257	20
2868	367	f	\N	2025-10-30 19:46:57.720257	20
2869	368	f	\N	2025-10-30 19:46:57.720257	20
2870	369	f	\N	2025-10-30 19:46:57.720257	20
2871	370	f	\N	2025-10-30 19:46:57.720257	20
2872	371	f	\N	2025-10-30 19:46:57.720257	20
2873	372	f	\N	2025-10-30 19:46:57.720257	20
2874	373	f	\N	2025-10-30 19:46:57.720257	20
2875	374	f	\N	2025-10-30 19:46:57.720257	20
2876	375	f	\N	2025-10-30 19:46:57.720257	20
2877	376	f	\N	2025-10-30 19:46:57.720257	20
2878	377	f	\N	2025-10-30 19:46:57.720257	20
2879	378	f	\N	2025-10-30 19:46:57.720257	20
2880	379	f	\N	2025-10-30 19:46:57.720257	20
2881	380	f	\N	2025-10-30 19:46:57.720257	20
2882	381	f	\N	2025-10-30 19:46:57.720257	20
2883	382	f	\N	2025-10-30 19:46:57.720257	20
2884	383	f	\N	2025-10-30 19:46:57.720257	20
2885	384	f	\N	2025-10-30 19:46:57.720257	20
2886	385	f	\N	2025-10-30 19:46:57.720257	20
2887	386	f	\N	2025-10-30 19:46:57.720257	20
2888	387	f	\N	2025-10-30 19:46:57.720257	20
2889	388	f	\N	2025-10-30 19:46:57.720257	20
2890	389	f	\N	2025-10-30 19:46:57.720257	20
2891	390	f	\N	2025-10-30 19:46:57.720257	20
2892	391	f	\N	2025-10-30 19:46:57.720257	20
2893	392	f	\N	2025-10-30 19:46:57.720257	20
2894	393	f	\N	2025-10-30 19:46:57.720257	20
2895	394	f	\N	2025-10-30 19:46:57.720257	20
2896	395	f	\N	2025-10-30 19:46:57.720257	20
2897	396	f	\N	2025-10-30 19:46:57.720257	20
2898	397	f	\N	2025-10-30 19:46:57.720257	20
2899	398	f	\N	2025-10-30 19:46:57.720257	20
2900	399	f	\N	2025-10-30 19:46:57.720257	20
2901	400	f	\N	2025-10-30 19:46:57.720257	20
2902	401	f	\N	2025-10-30 19:46:57.720257	20
2903	402	f	\N	2025-10-30 19:46:57.720257	20
2904	403	f	\N	2025-10-30 19:46:57.720257	20
2905	404	f	\N	2025-10-30 19:46:57.720257	20
2906	405	f	\N	2025-10-30 19:46:57.720257	20
2907	406	f	\N	2025-10-30 19:46:57.720257	20
2908	407	f	\N	2025-10-30 19:46:57.720257	20
2909	408	f	\N	2025-10-30 19:46:57.720257	20
2910	409	f	\N	2025-10-30 19:46:57.720257	20
2911	410	f	\N	2025-10-30 19:46:57.720257	20
2912	411	f	\N	2025-10-30 19:46:57.720257	20
2913	412	f	\N	2025-10-30 19:46:57.720257	20
2914	413	f	\N	2025-10-30 19:46:57.720257	20
2915	414	f	\N	2025-10-30 19:46:57.720257	20
2916	415	f	\N	2025-10-30 19:46:57.720257	20
2917	416	f	\N	2025-10-30 19:46:57.720257	20
2918	417	f	\N	2025-10-30 19:46:57.720257	20
2919	418	f	\N	2025-10-30 19:46:57.720257	20
2920	419	f	\N	2025-10-30 19:46:57.720257	20
2921	420	f	\N	2025-10-30 19:46:57.720257	20
2922	421	f	\N	2025-10-30 19:46:57.720257	20
2923	422	f	\N	2025-10-30 19:46:57.720257	20
2924	423	f	\N	2025-10-30 19:46:57.720257	20
2925	424	f	\N	2025-10-30 19:46:57.720257	20
2926	425	f	\N	2025-10-30 19:46:57.720257	20
2927	426	f	\N	2025-10-30 19:46:57.720257	20
2928	427	f	\N	2025-10-30 19:46:57.720257	20
2929	428	f	\N	2025-10-30 19:46:57.720257	20
2930	429	f	\N	2025-10-30 19:46:57.720257	20
2931	430	f	\N	2025-10-30 19:46:57.720257	20
2932	431	f	\N	2025-10-30 19:46:57.720257	20
2933	432	f	\N	2025-10-30 19:46:57.720257	20
2934	433	f	\N	2025-10-30 19:46:57.720257	20
2935	434	f	\N	2025-10-30 19:46:57.720257	20
2936	435	f	\N	2025-10-30 19:46:57.720257	20
2937	436	f	\N	2025-10-30 19:46:57.720257	20
2938	437	f	\N	2025-10-30 19:46:57.720257	20
2939	438	f	\N	2025-10-30 19:46:57.720257	20
2940	439	f	\N	2025-10-30 19:46:57.720257	20
2941	440	f	\N	2025-10-30 19:46:57.720257	20
2942	441	f	\N	2025-10-30 19:46:57.720257	20
2943	442	f	\N	2025-10-30 19:46:57.720257	20
2944	443	f	\N	2025-10-30 19:46:57.720257	20
2945	444	f	\N	2025-10-30 19:46:57.720257	20
2946	445	f	\N	2025-10-30 19:46:57.720257	20
2947	446	f	\N	2025-10-30 19:46:57.720257	20
2948	447	f	\N	2025-10-30 19:46:57.720257	20
2949	448	f	\N	2025-10-30 19:46:57.720257	20
2950	449	f	\N	2025-10-30 19:46:57.720257	20
2951	450	f	\N	2025-10-30 19:46:57.720257	20
2952	451	f	\N	2025-10-30 19:46:57.720257	20
2953	452	f	\N	2025-10-30 19:46:57.720257	20
2954	453	f	\N	2025-10-30 19:46:57.720257	20
2955	454	f	\N	2025-10-30 19:46:57.720257	20
2956	455	f	\N	2025-10-30 19:46:57.720257	20
2957	456	f	\N	2025-10-30 19:46:57.720257	20
2958	457	f	\N	2025-10-30 19:46:57.720257	20
2959	458	f	\N	2025-10-30 19:46:57.720257	20
2960	459	f	\N	2025-10-30 19:46:57.720257	20
2961	460	f	\N	2025-10-30 19:46:57.720257	20
2962	461	f	\N	2025-10-30 19:46:57.720257	20
2963	462	f	\N	2025-10-30 19:46:57.720257	20
2964	463	f	\N	2025-10-30 19:46:57.720257	20
2965	464	f	\N	2025-10-30 19:46:57.720257	20
2966	465	f	\N	2025-10-30 19:46:57.720257	20
2967	466	f	\N	2025-10-30 19:46:57.720257	20
2968	467	f	\N	2025-10-30 19:46:57.720257	20
2969	468	f	\N	2025-10-30 19:46:57.720257	20
2970	469	f	\N	2025-10-30 19:46:57.720257	20
2971	470	f	\N	2025-10-30 19:46:57.720257	20
2972	471	f	\N	2025-10-30 19:46:57.720257	20
2973	472	f	\N	2025-10-30 19:46:57.720257	20
2974	473	f	\N	2025-10-30 19:46:57.720257	20
2975	474	f	\N	2025-10-30 19:46:57.720257	20
2976	475	f	\N	2025-10-30 19:46:57.720257	20
2977	476	f	\N	2025-10-30 19:46:57.720257	20
2978	477	f	\N	2025-10-30 19:46:57.720257	20
2979	478	f	\N	2025-10-30 19:46:57.720257	20
2980	479	f	\N	2025-10-30 19:46:57.720257	20
2981	480	f	\N	2025-10-30 19:46:57.720257	20
2982	481	f	\N	2025-10-30 19:46:57.720257	20
2983	482	f	\N	2025-10-30 19:46:57.720257	20
2984	483	f	\N	2025-10-30 19:46:57.720257	20
2985	484	f	\N	2025-10-30 19:46:57.720257	20
2986	485	f	\N	2025-10-30 19:46:57.720257	20
2987	486	f	\N	2025-10-30 19:46:57.720257	20
2988	487	f	\N	2025-10-30 19:46:57.720257	20
2989	488	f	\N	2025-10-30 19:46:57.720257	20
2990	489	f	\N	2025-10-30 19:46:57.720257	20
2991	490	f	\N	2025-10-30 19:46:57.720257	20
2992	491	f	\N	2025-10-30 19:46:57.720257	20
2993	492	f	\N	2025-10-30 19:46:57.720257	20
2994	493	f	\N	2025-10-30 19:46:57.720257	20
2995	494	f	\N	2025-10-30 19:46:57.720257	20
2996	495	f	\N	2025-10-30 19:46:57.720257	20
2997	496	f	\N	2025-10-30 19:46:57.720257	20
2998	497	f	\N	2025-10-30 19:46:57.720257	20
2999	498	f	\N	2025-10-30 19:46:57.720257	20
3000	499	f	\N	2025-10-30 19:46:57.720257	20
3001	500	f	\N	2025-10-30 19:46:57.720257	20
15502	1	f	\N	2026-01-12 08:14:17.864053	49
4502	1	f	\N	2025-11-12 00:11:19.884853	24
3009	8	f	\N	2025-11-01 15:04:54.245676	21
3010	9	f	\N	2025-11-01 15:04:54.245676	21
3012	11	f	\N	2025-11-01 15:04:54.245676	21
3013	12	f	\N	2025-11-01 15:04:54.245676	21
3014	13	f	\N	2025-11-01 15:04:54.245676	21
3015	14	f	\N	2025-11-01 15:04:54.245676	21
3016	15	f	\N	2025-11-01 15:04:54.245676	21
3004	3	t	57	2025-11-01 15:04:54.245676	21
3018	17	f	\N	2025-11-01 15:04:54.245676	21
3020	19	f	\N	2025-11-01 15:04:54.245676	21
3022	21	f	\N	2025-11-01 15:04:54.245676	21
3023	22	f	\N	2025-11-01 15:04:54.245676	21
3024	23	f	\N	2025-11-01 15:04:54.245676	21
3027	26	f	\N	2025-11-01 15:04:54.245676	21
3028	27	f	\N	2025-11-01 15:04:54.245676	21
3029	28	f	\N	2025-11-01 15:04:54.245676	21
3030	29	f	\N	2025-11-01 15:04:54.245676	21
3031	30	f	\N	2025-11-01 15:04:54.245676	21
3032	31	f	\N	2025-11-01 15:04:54.245676	21
3033	32	f	\N	2025-11-01 15:04:54.245676	21
3034	33	f	\N	2025-11-01 15:04:54.245676	21
3035	34	f	\N	2025-11-01 15:04:54.245676	21
3036	35	f	\N	2025-11-01 15:04:54.245676	21
3037	36	f	\N	2025-11-01 15:04:54.245676	21
3038	37	f	\N	2025-11-01 15:04:54.245676	21
3039	38	f	\N	2025-11-01 15:04:54.245676	21
3040	39	f	\N	2025-11-01 15:04:54.245676	21
3041	40	f	\N	2025-11-01 15:04:54.245676	21
3042	41	f	\N	2025-11-01 15:04:54.245676	21
3043	42	f	\N	2025-11-01 15:04:54.245676	21
3044	43	f	\N	2025-11-01 15:04:54.245676	21
3045	44	f	\N	2025-11-01 15:04:54.245676	21
3046	45	f	\N	2025-11-01 15:04:54.245676	21
3047	46	f	\N	2025-11-01 15:04:54.245676	21
3048	47	f	\N	2025-11-01 15:04:54.245676	21
3049	48	f	\N	2025-11-01 15:04:54.245676	21
3050	49	f	\N	2025-11-01 15:04:54.245676	21
3051	50	f	\N	2025-11-01 15:04:54.245676	21
3052	51	f	\N	2025-11-01 15:04:54.245676	21
3053	52	f	\N	2025-11-01 15:04:54.245676	21
3054	53	f	\N	2025-11-01 15:04:54.245676	21
3055	54	f	\N	2025-11-01 15:04:54.245676	21
3056	55	f	\N	2025-11-01 15:04:54.245676	21
3057	56	f	\N	2025-11-01 15:04:54.245676	21
3058	57	f	\N	2025-11-01 15:04:54.245676	21
3059	58	f	\N	2025-11-01 15:04:54.245676	21
3060	59	f	\N	2025-11-01 15:04:54.245676	21
3061	60	f	\N	2025-11-01 15:04:54.245676	21
3062	61	f	\N	2025-11-01 15:04:54.245676	21
3063	62	f	\N	2025-11-01 15:04:54.245676	21
3064	63	f	\N	2025-11-01 15:04:54.245676	21
3065	64	f	\N	2025-11-01 15:04:54.245676	21
3066	65	f	\N	2025-11-01 15:04:54.245676	21
3067	66	f	\N	2025-11-01 15:04:54.245676	21
3068	67	f	\N	2025-11-01 15:04:54.245676	21
3069	68	f	\N	2025-11-01 15:04:54.245676	21
3070	69	f	\N	2025-11-01 15:04:54.245676	21
3071	70	f	\N	2025-11-01 15:04:54.245676	21
3072	71	f	\N	2025-11-01 15:04:54.245676	21
3073	72	f	\N	2025-11-01 15:04:54.245676	21
3074	73	f	\N	2025-11-01 15:04:54.245676	21
3075	74	f	\N	2025-11-01 15:04:54.245676	21
3076	75	f	\N	2025-11-01 15:04:54.245676	21
3077	76	f	\N	2025-11-01 15:04:54.245676	21
3078	77	f	\N	2025-11-01 15:04:54.245676	21
3079	78	f	\N	2025-11-01 15:04:54.245676	21
3080	79	f	\N	2025-11-01 15:04:54.245676	21
3081	80	f	\N	2025-11-01 15:04:54.245676	21
3082	81	f	\N	2025-11-01 15:04:54.245676	21
3083	82	f	\N	2025-11-01 15:04:54.245676	21
3084	83	f	\N	2025-11-01 15:04:54.245676	21
3085	84	f	\N	2025-11-01 15:04:54.245676	21
3086	85	f	\N	2025-11-01 15:04:54.245676	21
3087	86	f	\N	2025-11-01 15:04:54.245676	21
3088	87	f	\N	2025-11-01 15:04:54.245676	21
3089	88	f	\N	2025-11-01 15:04:54.245676	21
3019	18	t	48	2025-11-01 15:04:54.245676	21
3002	1	t	49	2025-11-01 15:04:54.245676	21
3025	24	t	57	2025-11-01 15:04:54.245676	21
3005	4	t	58	2025-11-01 15:04:54.245676	21
3008	7	f	\N	2025-11-01 15:04:54.245676	21
3007	6	f	\N	2025-11-01 15:04:54.245676	21
3021	20	f	\N	2025-11-01 15:04:54.245676	21
3011	10	f	\N	2025-11-01 15:04:54.245676	21
3026	25	f	\N	2025-11-01 15:04:54.245676	21
3090	89	f	\N	2025-11-01 15:04:54.245676	21
3091	90	f	\N	2025-11-01 15:04:54.245676	21
3092	91	f	\N	2025-11-01 15:04:54.245676	21
3093	92	f	\N	2025-11-01 15:04:54.245676	21
3094	93	f	\N	2025-11-01 15:04:54.245676	21
3095	94	f	\N	2025-11-01 15:04:54.245676	21
3096	95	f	\N	2025-11-01 15:04:54.245676	21
3097	96	f	\N	2025-11-01 15:04:54.245676	21
3098	97	f	\N	2025-11-01 15:04:54.245676	21
3099	98	f	\N	2025-11-01 15:04:54.245676	21
3100	99	f	\N	2025-11-01 15:04:54.245676	21
3101	100	f	\N	2025-11-01 15:04:54.245676	21
3102	101	f	\N	2025-11-01 15:04:54.245676	21
3103	102	f	\N	2025-11-01 15:04:54.245676	21
3104	103	f	\N	2025-11-01 15:04:54.245676	21
3105	104	f	\N	2025-11-01 15:04:54.245676	21
3106	105	f	\N	2025-11-01 15:04:54.245676	21
3107	106	f	\N	2025-11-01 15:04:54.245676	21
3108	107	f	\N	2025-11-01 15:04:54.245676	21
3109	108	f	\N	2025-11-01 15:04:54.245676	21
3110	109	f	\N	2025-11-01 15:04:54.245676	21
3111	110	f	\N	2025-11-01 15:04:54.245676	21
3112	111	f	\N	2025-11-01 15:04:54.245676	21
3113	112	f	\N	2025-11-01 15:04:54.245676	21
3114	113	f	\N	2025-11-01 15:04:54.245676	21
3115	114	f	\N	2025-11-01 15:04:54.245676	21
3116	115	f	\N	2025-11-01 15:04:54.245676	21
3117	116	f	\N	2025-11-01 15:04:54.245676	21
3118	117	f	\N	2025-11-01 15:04:54.245676	21
3119	118	f	\N	2025-11-01 15:04:54.245676	21
3120	119	f	\N	2025-11-01 15:04:54.245676	21
3121	120	f	\N	2025-11-01 15:04:54.245676	21
3122	121	f	\N	2025-11-01 15:04:54.245676	21
3123	122	f	\N	2025-11-01 15:04:54.245676	21
3124	123	f	\N	2025-11-01 15:04:54.245676	21
3125	124	f	\N	2025-11-01 15:04:54.245676	21
3126	125	f	\N	2025-11-01 15:04:54.245676	21
3127	126	f	\N	2025-11-01 15:04:54.245676	21
3128	127	f	\N	2025-11-01 15:04:54.245676	21
3129	128	f	\N	2025-11-01 15:04:54.245676	21
3130	129	f	\N	2025-11-01 15:04:54.245676	21
3131	130	f	\N	2025-11-01 15:04:54.245676	21
3132	131	f	\N	2025-11-01 15:04:54.245676	21
3133	132	f	\N	2025-11-01 15:04:54.245676	21
3134	133	f	\N	2025-11-01 15:04:54.245676	21
3135	134	f	\N	2025-11-01 15:04:54.245676	21
3136	135	f	\N	2025-11-01 15:04:54.245676	21
3137	136	f	\N	2025-11-01 15:04:54.245676	21
3138	137	f	\N	2025-11-01 15:04:54.245676	21
3139	138	f	\N	2025-11-01 15:04:54.245676	21
3140	139	f	\N	2025-11-01 15:04:54.245676	21
3141	140	f	\N	2025-11-01 15:04:54.245676	21
3142	141	f	\N	2025-11-01 15:04:54.245676	21
3143	142	f	\N	2025-11-01 15:04:54.245676	21
3144	143	f	\N	2025-11-01 15:04:54.245676	21
3145	144	f	\N	2025-11-01 15:04:54.245676	21
3146	145	f	\N	2025-11-01 15:04:54.245676	21
3147	146	f	\N	2025-11-01 15:04:54.245676	21
3148	147	f	\N	2025-11-01 15:04:54.245676	21
3149	148	f	\N	2025-11-01 15:04:54.245676	21
3150	149	f	\N	2025-11-01 15:04:54.245676	21
3151	150	f	\N	2025-11-01 15:04:54.245676	21
3152	151	f	\N	2025-11-01 15:04:54.245676	21
3153	152	f	\N	2025-11-01 15:04:54.245676	21
3154	153	f	\N	2025-11-01 15:04:54.245676	21
3155	154	f	\N	2025-11-01 15:04:54.245676	21
3156	155	f	\N	2025-11-01 15:04:54.245676	21
3157	156	f	\N	2025-11-01 15:04:54.245676	21
3158	157	f	\N	2025-11-01 15:04:54.245676	21
3159	158	f	\N	2025-11-01 15:04:54.245676	21
3160	159	f	\N	2025-11-01 15:04:54.245676	21
3161	160	f	\N	2025-11-01 15:04:54.245676	21
3162	161	f	\N	2025-11-01 15:04:54.245676	21
3163	162	f	\N	2025-11-01 15:04:54.245676	21
3164	163	f	\N	2025-11-01 15:04:54.245676	21
3165	164	f	\N	2025-11-01 15:04:54.245676	21
3166	165	f	\N	2025-11-01 15:04:54.245676	21
3167	166	f	\N	2025-11-01 15:04:54.245676	21
3168	167	f	\N	2025-11-01 15:04:54.245676	21
3169	168	f	\N	2025-11-01 15:04:54.245676	21
3170	169	f	\N	2025-11-01 15:04:54.245676	21
3171	170	f	\N	2025-11-01 15:04:54.245676	21
3172	171	f	\N	2025-11-01 15:04:54.245676	21
3173	172	f	\N	2025-11-01 15:04:54.245676	21
3174	173	f	\N	2025-11-01 15:04:54.245676	21
3175	174	f	\N	2025-11-01 15:04:54.245676	21
3176	175	f	\N	2025-11-01 15:04:54.245676	21
3177	176	f	\N	2025-11-01 15:04:54.245676	21
3178	177	f	\N	2025-11-01 15:04:54.245676	21
3179	178	f	\N	2025-11-01 15:04:54.245676	21
3180	179	f	\N	2025-11-01 15:04:54.245676	21
3181	180	f	\N	2025-11-01 15:04:54.245676	21
3182	181	f	\N	2025-11-01 15:04:54.245676	21
3183	182	f	\N	2025-11-01 15:04:54.245676	21
3184	183	f	\N	2025-11-01 15:04:54.245676	21
3185	184	f	\N	2025-11-01 15:04:54.245676	21
3186	185	f	\N	2025-11-01 15:04:54.245676	21
3187	186	f	\N	2025-11-01 15:04:54.245676	21
3188	187	f	\N	2025-11-01 15:04:54.245676	21
3189	188	f	\N	2025-11-01 15:04:54.245676	21
3190	189	f	\N	2025-11-01 15:04:54.245676	21
3191	190	f	\N	2025-11-01 15:04:54.245676	21
3192	191	f	\N	2025-11-01 15:04:54.245676	21
3193	192	f	\N	2025-11-01 15:04:54.245676	21
3194	193	f	\N	2025-11-01 15:04:54.245676	21
3195	194	f	\N	2025-11-01 15:04:54.245676	21
3196	195	f	\N	2025-11-01 15:04:54.245676	21
3197	196	f	\N	2025-11-01 15:04:54.245676	21
3198	197	f	\N	2025-11-01 15:04:54.245676	21
3199	198	f	\N	2025-11-01 15:04:54.245676	21
3200	199	f	\N	2025-11-01 15:04:54.245676	21
3201	200	f	\N	2025-11-01 15:04:54.245676	21
3202	201	f	\N	2025-11-01 15:04:54.245676	21
3203	202	f	\N	2025-11-01 15:04:54.245676	21
3204	203	f	\N	2025-11-01 15:04:54.245676	21
3205	204	f	\N	2025-11-01 15:04:54.245676	21
3206	205	f	\N	2025-11-01 15:04:54.245676	21
3207	206	f	\N	2025-11-01 15:04:54.245676	21
3208	207	f	\N	2025-11-01 15:04:54.245676	21
3209	208	f	\N	2025-11-01 15:04:54.245676	21
3210	209	f	\N	2025-11-01 15:04:54.245676	21
3211	210	f	\N	2025-11-01 15:04:54.245676	21
3212	211	f	\N	2025-11-01 15:04:54.245676	21
3213	212	f	\N	2025-11-01 15:04:54.245676	21
3214	213	f	\N	2025-11-01 15:04:54.245676	21
3215	214	f	\N	2025-11-01 15:04:54.245676	21
3216	215	f	\N	2025-11-01 15:04:54.245676	21
3217	216	f	\N	2025-11-01 15:04:54.245676	21
3218	217	f	\N	2025-11-01 15:04:54.245676	21
3219	218	f	\N	2025-11-01 15:04:54.245676	21
3220	219	f	\N	2025-11-01 15:04:54.245676	21
3221	220	f	\N	2025-11-01 15:04:54.245676	21
3222	221	f	\N	2025-11-01 15:04:54.245676	21
3223	222	f	\N	2025-11-01 15:04:54.245676	21
3224	223	f	\N	2025-11-01 15:04:54.245676	21
3225	224	f	\N	2025-11-01 15:04:54.245676	21
3226	225	f	\N	2025-11-01 15:04:54.245676	21
3227	226	f	\N	2025-11-01 15:04:54.245676	21
3228	227	f	\N	2025-11-01 15:04:54.245676	21
3229	228	f	\N	2025-11-01 15:04:54.245676	21
3230	229	f	\N	2025-11-01 15:04:54.245676	21
3231	230	f	\N	2025-11-01 15:04:54.245676	21
3232	231	f	\N	2025-11-01 15:04:54.245676	21
3233	232	f	\N	2025-11-01 15:04:54.245676	21
3234	233	f	\N	2025-11-01 15:04:54.245676	21
3235	234	f	\N	2025-11-01 15:04:54.245676	21
3236	235	f	\N	2025-11-01 15:04:54.245676	21
3237	236	f	\N	2025-11-01 15:04:54.245676	21
3238	237	f	\N	2025-11-01 15:04:54.245676	21
3239	238	f	\N	2025-11-01 15:04:54.245676	21
3240	239	f	\N	2025-11-01 15:04:54.245676	21
3241	240	f	\N	2025-11-01 15:04:54.245676	21
3242	241	f	\N	2025-11-01 15:04:54.245676	21
3243	242	f	\N	2025-11-01 15:04:54.245676	21
3244	243	f	\N	2025-11-01 15:04:54.245676	21
3245	244	f	\N	2025-11-01 15:04:54.245676	21
3246	245	f	\N	2025-11-01 15:04:54.245676	21
3247	246	f	\N	2025-11-01 15:04:54.245676	21
3248	247	f	\N	2025-11-01 15:04:54.245676	21
3249	248	f	\N	2025-11-01 15:04:54.245676	21
3250	249	f	\N	2025-11-01 15:04:54.245676	21
3251	250	f	\N	2025-11-01 15:04:54.245676	21
3252	251	f	\N	2025-11-01 15:04:54.245676	21
3253	252	f	\N	2025-11-01 15:04:54.245676	21
3254	253	f	\N	2025-11-01 15:04:54.245676	21
3255	254	f	\N	2025-11-01 15:04:54.245676	21
3256	255	f	\N	2025-11-01 15:04:54.245676	21
3257	256	f	\N	2025-11-01 15:04:54.245676	21
3258	257	f	\N	2025-11-01 15:04:54.245676	21
3259	258	f	\N	2025-11-01 15:04:54.245676	21
3260	259	f	\N	2025-11-01 15:04:54.245676	21
3261	260	f	\N	2025-11-01 15:04:54.245676	21
3262	261	f	\N	2025-11-01 15:04:54.245676	21
3263	262	f	\N	2025-11-01 15:04:54.245676	21
3264	263	f	\N	2025-11-01 15:04:54.245676	21
3265	264	f	\N	2025-11-01 15:04:54.245676	21
3266	265	f	\N	2025-11-01 15:04:54.245676	21
3267	266	f	\N	2025-11-01 15:04:54.245676	21
3268	267	f	\N	2025-11-01 15:04:54.245676	21
3269	268	f	\N	2025-11-01 15:04:54.245676	21
3270	269	f	\N	2025-11-01 15:04:54.245676	21
3271	270	f	\N	2025-11-01 15:04:54.245676	21
3272	271	f	\N	2025-11-01 15:04:54.245676	21
3273	272	f	\N	2025-11-01 15:04:54.245676	21
3274	273	f	\N	2025-11-01 15:04:54.245676	21
3275	274	f	\N	2025-11-01 15:04:54.245676	21
3276	275	f	\N	2025-11-01 15:04:54.245676	21
3277	276	f	\N	2025-11-01 15:04:54.245676	21
3278	277	f	\N	2025-11-01 15:04:54.245676	21
3279	278	f	\N	2025-11-01 15:04:54.245676	21
3280	279	f	\N	2025-11-01 15:04:54.245676	21
3281	280	f	\N	2025-11-01 15:04:54.245676	21
3282	281	f	\N	2025-11-01 15:04:54.245676	21
3283	282	f	\N	2025-11-01 15:04:54.245676	21
3284	283	f	\N	2025-11-01 15:04:54.245676	21
3285	284	f	\N	2025-11-01 15:04:54.245676	21
3286	285	f	\N	2025-11-01 15:04:54.245676	21
3287	286	f	\N	2025-11-01 15:04:54.245676	21
3288	287	f	\N	2025-11-01 15:04:54.245676	21
3289	288	f	\N	2025-11-01 15:04:54.245676	21
3290	289	f	\N	2025-11-01 15:04:54.245676	21
3291	290	f	\N	2025-11-01 15:04:54.245676	21
3292	291	f	\N	2025-11-01 15:04:54.245676	21
3293	292	f	\N	2025-11-01 15:04:54.245676	21
3294	293	f	\N	2025-11-01 15:04:54.245676	21
3295	294	f	\N	2025-11-01 15:04:54.245676	21
3296	295	f	\N	2025-11-01 15:04:54.245676	21
3297	296	f	\N	2025-11-01 15:04:54.245676	21
3298	297	f	\N	2025-11-01 15:04:54.245676	21
3299	298	f	\N	2025-11-01 15:04:54.245676	21
3300	299	f	\N	2025-11-01 15:04:54.245676	21
3301	300	f	\N	2025-11-01 15:04:54.245676	21
3302	301	f	\N	2025-11-01 15:04:54.245676	21
3303	302	f	\N	2025-11-01 15:04:54.245676	21
3304	303	f	\N	2025-11-01 15:04:54.245676	21
3305	304	f	\N	2025-11-01 15:04:54.245676	21
3306	305	f	\N	2025-11-01 15:04:54.245676	21
3307	306	f	\N	2025-11-01 15:04:54.245676	21
3308	307	f	\N	2025-11-01 15:04:54.245676	21
3309	308	f	\N	2025-11-01 15:04:54.245676	21
3310	309	f	\N	2025-11-01 15:04:54.245676	21
3311	310	f	\N	2025-11-01 15:04:54.245676	21
3312	311	f	\N	2025-11-01 15:04:54.245676	21
3313	312	f	\N	2025-11-01 15:04:54.245676	21
3314	313	f	\N	2025-11-01 15:04:54.245676	21
3315	314	f	\N	2025-11-01 15:04:54.245676	21
3316	315	f	\N	2025-11-01 15:04:54.245676	21
3317	316	f	\N	2025-11-01 15:04:54.245676	21
3318	317	f	\N	2025-11-01 15:04:54.245676	21
3319	318	f	\N	2025-11-01 15:04:54.245676	21
3320	319	f	\N	2025-11-01 15:04:54.245676	21
3321	320	f	\N	2025-11-01 15:04:54.245676	21
3322	321	f	\N	2025-11-01 15:04:54.245676	21
3323	322	f	\N	2025-11-01 15:04:54.245676	21
3324	323	f	\N	2025-11-01 15:04:54.245676	21
3325	324	f	\N	2025-11-01 15:04:54.245676	21
3326	325	f	\N	2025-11-01 15:04:54.245676	21
3327	326	f	\N	2025-11-01 15:04:54.245676	21
3328	327	f	\N	2025-11-01 15:04:54.245676	21
3329	328	f	\N	2025-11-01 15:04:54.245676	21
3330	329	f	\N	2025-11-01 15:04:54.245676	21
3331	330	f	\N	2025-11-01 15:04:54.245676	21
3332	331	f	\N	2025-11-01 15:04:54.245676	21
3333	332	f	\N	2025-11-01 15:04:54.245676	21
3334	333	f	\N	2025-11-01 15:04:54.245676	21
3335	334	f	\N	2025-11-01 15:04:54.245676	21
3336	335	f	\N	2025-11-01 15:04:54.245676	21
3337	336	f	\N	2025-11-01 15:04:54.245676	21
3338	337	f	\N	2025-11-01 15:04:54.245676	21
3339	338	f	\N	2025-11-01 15:04:54.245676	21
3340	339	f	\N	2025-11-01 15:04:54.245676	21
3341	340	f	\N	2025-11-01 15:04:54.245676	21
3342	341	f	\N	2025-11-01 15:04:54.245676	21
3343	342	f	\N	2025-11-01 15:04:54.245676	21
3344	343	f	\N	2025-11-01 15:04:54.245676	21
3345	344	f	\N	2025-11-01 15:04:54.245676	21
3346	345	f	\N	2025-11-01 15:04:54.245676	21
3347	346	f	\N	2025-11-01 15:04:54.245676	21
3348	347	f	\N	2025-11-01 15:04:54.245676	21
3349	348	f	\N	2025-11-01 15:04:54.245676	21
3350	349	f	\N	2025-11-01 15:04:54.245676	21
3351	350	f	\N	2025-11-01 15:04:54.245676	21
3352	351	f	\N	2025-11-01 15:04:54.245676	21
3353	352	f	\N	2025-11-01 15:04:54.245676	21
3354	353	f	\N	2025-11-01 15:04:54.245676	21
3355	354	f	\N	2025-11-01 15:04:54.245676	21
3356	355	f	\N	2025-11-01 15:04:54.245676	21
3357	356	f	\N	2025-11-01 15:04:54.245676	21
3358	357	f	\N	2025-11-01 15:04:54.245676	21
3359	358	f	\N	2025-11-01 15:04:54.245676	21
3360	359	f	\N	2025-11-01 15:04:54.245676	21
3361	360	f	\N	2025-11-01 15:04:54.245676	21
3362	361	f	\N	2025-11-01 15:04:54.245676	21
3363	362	f	\N	2025-11-01 15:04:54.245676	21
3364	363	f	\N	2025-11-01 15:04:54.245676	21
3365	364	f	\N	2025-11-01 15:04:54.245676	21
3366	365	f	\N	2025-11-01 15:04:54.245676	21
3367	366	f	\N	2025-11-01 15:04:54.245676	21
3368	367	f	\N	2025-11-01 15:04:54.245676	21
3369	368	f	\N	2025-11-01 15:04:54.245676	21
3370	369	f	\N	2025-11-01 15:04:54.245676	21
3371	370	f	\N	2025-11-01 15:04:54.245676	21
3372	371	f	\N	2025-11-01 15:04:54.245676	21
3373	372	f	\N	2025-11-01 15:04:54.245676	21
3374	373	f	\N	2025-11-01 15:04:54.245676	21
3375	374	f	\N	2025-11-01 15:04:54.245676	21
3376	375	f	\N	2025-11-01 15:04:54.245676	21
3377	376	f	\N	2025-11-01 15:04:54.245676	21
3378	377	f	\N	2025-11-01 15:04:54.245676	21
3379	378	f	\N	2025-11-01 15:04:54.245676	21
3380	379	f	\N	2025-11-01 15:04:54.245676	21
3381	380	f	\N	2025-11-01 15:04:54.245676	21
3382	381	f	\N	2025-11-01 15:04:54.245676	21
3383	382	f	\N	2025-11-01 15:04:54.245676	21
3384	383	f	\N	2025-11-01 15:04:54.245676	21
3385	384	f	\N	2025-11-01 15:04:54.245676	21
3386	385	f	\N	2025-11-01 15:04:54.245676	21
3387	386	f	\N	2025-11-01 15:04:54.245676	21
3388	387	f	\N	2025-11-01 15:04:54.245676	21
3389	388	f	\N	2025-11-01 15:04:54.245676	21
3390	389	f	\N	2025-11-01 15:04:54.245676	21
3391	390	f	\N	2025-11-01 15:04:54.245676	21
3392	391	f	\N	2025-11-01 15:04:54.245676	21
3393	392	f	\N	2025-11-01 15:04:54.245676	21
3394	393	f	\N	2025-11-01 15:04:54.245676	21
3395	394	f	\N	2025-11-01 15:04:54.245676	21
3396	395	f	\N	2025-11-01 15:04:54.245676	21
3397	396	f	\N	2025-11-01 15:04:54.245676	21
3398	397	f	\N	2025-11-01 15:04:54.245676	21
3399	398	f	\N	2025-11-01 15:04:54.245676	21
3400	399	f	\N	2025-11-01 15:04:54.245676	21
3401	400	f	\N	2025-11-01 15:04:54.245676	21
3402	401	f	\N	2025-11-01 15:04:54.245676	21
3403	402	f	\N	2025-11-01 15:04:54.245676	21
3404	403	f	\N	2025-11-01 15:04:54.245676	21
3405	404	f	\N	2025-11-01 15:04:54.245676	21
3406	405	f	\N	2025-11-01 15:04:54.245676	21
3407	406	f	\N	2025-11-01 15:04:54.245676	21
3408	407	f	\N	2025-11-01 15:04:54.245676	21
3409	408	f	\N	2025-11-01 15:04:54.245676	21
3410	409	f	\N	2025-11-01 15:04:54.245676	21
3411	410	f	\N	2025-11-01 15:04:54.245676	21
3412	411	f	\N	2025-11-01 15:04:54.245676	21
3413	412	f	\N	2025-11-01 15:04:54.245676	21
3414	413	f	\N	2025-11-01 15:04:54.245676	21
3415	414	f	\N	2025-11-01 15:04:54.245676	21
3416	415	f	\N	2025-11-01 15:04:54.245676	21
3417	416	f	\N	2025-11-01 15:04:54.245676	21
3418	417	f	\N	2025-11-01 15:04:54.245676	21
3419	418	f	\N	2025-11-01 15:04:54.245676	21
3420	419	f	\N	2025-11-01 15:04:54.245676	21
3421	420	f	\N	2025-11-01 15:04:54.245676	21
3422	421	f	\N	2025-11-01 15:04:54.245676	21
3423	422	f	\N	2025-11-01 15:04:54.245676	21
3424	423	f	\N	2025-11-01 15:04:54.245676	21
3425	424	f	\N	2025-11-01 15:04:54.245676	21
3426	425	f	\N	2025-11-01 15:04:54.245676	21
3427	426	f	\N	2025-11-01 15:04:54.245676	21
3428	427	f	\N	2025-11-01 15:04:54.245676	21
3429	428	f	\N	2025-11-01 15:04:54.245676	21
3430	429	f	\N	2025-11-01 15:04:54.245676	21
3431	430	f	\N	2025-11-01 15:04:54.245676	21
3432	431	f	\N	2025-11-01 15:04:54.245676	21
3433	432	f	\N	2025-11-01 15:04:54.245676	21
3434	433	f	\N	2025-11-01 15:04:54.245676	21
3435	434	f	\N	2025-11-01 15:04:54.245676	21
3436	435	f	\N	2025-11-01 15:04:54.245676	21
3437	436	f	\N	2025-11-01 15:04:54.245676	21
3438	437	f	\N	2025-11-01 15:04:54.245676	21
3439	438	f	\N	2025-11-01 15:04:54.245676	21
3440	439	f	\N	2025-11-01 15:04:54.245676	21
3441	440	f	\N	2025-11-01 15:04:54.245676	21
3442	441	f	\N	2025-11-01 15:04:54.245676	21
3443	442	f	\N	2025-11-01 15:04:54.245676	21
3444	443	f	\N	2025-11-01 15:04:54.245676	21
3445	444	f	\N	2025-11-01 15:04:54.245676	21
3446	445	f	\N	2025-11-01 15:04:54.245676	21
3447	446	f	\N	2025-11-01 15:04:54.245676	21
3448	447	f	\N	2025-11-01 15:04:54.245676	21
3449	448	f	\N	2025-11-01 15:04:54.245676	21
3450	449	f	\N	2025-11-01 15:04:54.245676	21
3451	450	f	\N	2025-11-01 15:04:54.245676	21
3452	451	f	\N	2025-11-01 15:04:54.245676	21
3453	452	f	\N	2025-11-01 15:04:54.245676	21
3454	453	f	\N	2025-11-01 15:04:54.245676	21
3455	454	f	\N	2025-11-01 15:04:54.245676	21
3456	455	f	\N	2025-11-01 15:04:54.245676	21
3457	456	f	\N	2025-11-01 15:04:54.245676	21
3458	457	f	\N	2025-11-01 15:04:54.245676	21
3459	458	f	\N	2025-11-01 15:04:54.245676	21
3460	459	f	\N	2025-11-01 15:04:54.245676	21
3461	460	f	\N	2025-11-01 15:04:54.245676	21
3462	461	f	\N	2025-11-01 15:04:54.245676	21
3463	462	f	\N	2025-11-01 15:04:54.245676	21
3464	463	f	\N	2025-11-01 15:04:54.245676	21
3465	464	f	\N	2025-11-01 15:04:54.245676	21
3466	465	f	\N	2025-11-01 15:04:54.245676	21
3467	466	f	\N	2025-11-01 15:04:54.245676	21
3468	467	f	\N	2025-11-01 15:04:54.245676	21
3469	468	f	\N	2025-11-01 15:04:54.245676	21
3470	469	f	\N	2025-11-01 15:04:54.245676	21
3471	470	f	\N	2025-11-01 15:04:54.245676	21
3472	471	f	\N	2025-11-01 15:04:54.245676	21
3473	472	f	\N	2025-11-01 15:04:54.245676	21
3474	473	f	\N	2025-11-01 15:04:54.245676	21
3475	474	f	\N	2025-11-01 15:04:54.245676	21
3476	475	f	\N	2025-11-01 15:04:54.245676	21
3477	476	f	\N	2025-11-01 15:04:54.245676	21
3478	477	f	\N	2025-11-01 15:04:54.245676	21
3479	478	f	\N	2025-11-01 15:04:54.245676	21
3480	479	f	\N	2025-11-01 15:04:54.245676	21
3481	480	f	\N	2025-11-01 15:04:54.245676	21
3482	481	f	\N	2025-11-01 15:04:54.245676	21
3483	482	f	\N	2025-11-01 15:04:54.245676	21
3484	483	f	\N	2025-11-01 15:04:54.245676	21
3485	484	f	\N	2025-11-01 15:04:54.245676	21
3486	485	f	\N	2025-11-01 15:04:54.245676	21
3487	486	f	\N	2025-11-01 15:04:54.245676	21
3488	487	f	\N	2025-11-01 15:04:54.245676	21
3489	488	f	\N	2025-11-01 15:04:54.245676	21
3490	489	f	\N	2025-11-01 15:04:54.245676	21
3491	490	f	\N	2025-11-01 15:04:54.245676	21
3492	491	f	\N	2025-11-01 15:04:54.245676	21
3493	492	f	\N	2025-11-01 15:04:54.245676	21
3494	493	f	\N	2025-11-01 15:04:54.245676	21
3495	494	f	\N	2025-11-01 15:04:54.245676	21
3496	495	f	\N	2025-11-01 15:04:54.245676	21
3497	496	f	\N	2025-11-01 15:04:54.245676	21
3498	497	f	\N	2025-11-01 15:04:54.245676	21
3499	498	f	\N	2025-11-01 15:04:54.245676	21
3500	499	f	\N	2025-11-01 15:04:54.245676	21
3501	500	f	\N	2025-11-01 15:04:54.245676	21
3502	1	f	\N	2025-11-02 01:09:25.644549	22
3503	2	f	\N	2025-11-02 01:09:25.644549	22
3504	3	f	\N	2025-11-02 01:09:25.644549	22
3505	4	f	\N	2025-11-02 01:09:25.644549	22
3506	5	f	\N	2025-11-02 01:09:25.644549	22
3507	6	f	\N	2025-11-02 01:09:25.644549	22
3508	7	f	\N	2025-11-02 01:09:25.644549	22
3509	8	f	\N	2025-11-02 01:09:25.644549	22
3510	9	f	\N	2025-11-02 01:09:25.644549	22
3511	10	f	\N	2025-11-02 01:09:25.644549	22
3512	11	f	\N	2025-11-02 01:09:25.644549	22
3513	12	f	\N	2025-11-02 01:09:25.644549	22
3514	13	f	\N	2025-11-02 01:09:25.644549	22
3515	14	f	\N	2025-11-02 01:09:25.644549	22
3516	15	f	\N	2025-11-02 01:09:25.644549	22
3517	16	f	\N	2025-11-02 01:09:25.644549	22
3518	17	f	\N	2025-11-02 01:09:25.644549	22
3519	18	f	\N	2025-11-02 01:09:25.644549	22
3520	19	f	\N	2025-11-02 01:09:25.644549	22
3521	20	f	\N	2025-11-02 01:09:25.644549	22
3522	21	f	\N	2025-11-02 01:09:25.644549	22
3523	22	f	\N	2025-11-02 01:09:25.644549	22
3524	23	f	\N	2025-11-02 01:09:25.644549	22
3525	24	f	\N	2025-11-02 01:09:25.644549	22
3526	25	f	\N	2025-11-02 01:09:25.644549	22
3527	26	f	\N	2025-11-02 01:09:25.644549	22
3528	27	f	\N	2025-11-02 01:09:25.644549	22
3529	28	f	\N	2025-11-02 01:09:25.644549	22
3530	29	f	\N	2025-11-02 01:09:25.644549	22
3531	30	f	\N	2025-11-02 01:09:25.644549	22
3532	31	f	\N	2025-11-02 01:09:25.644549	22
3533	32	f	\N	2025-11-02 01:09:25.644549	22
3534	33	f	\N	2025-11-02 01:09:25.644549	22
3535	34	f	\N	2025-11-02 01:09:25.644549	22
3536	35	f	\N	2025-11-02 01:09:25.644549	22
3537	36	f	\N	2025-11-02 01:09:25.644549	22
3538	37	f	\N	2025-11-02 01:09:25.644549	22
3539	38	f	\N	2025-11-02 01:09:25.644549	22
3540	39	f	\N	2025-11-02 01:09:25.644549	22
3541	40	f	\N	2025-11-02 01:09:25.644549	22
3542	41	f	\N	2025-11-02 01:09:25.644549	22
3543	42	f	\N	2025-11-02 01:09:25.644549	22
3544	43	f	\N	2025-11-02 01:09:25.644549	22
3545	44	f	\N	2025-11-02 01:09:25.644549	22
3546	45	f	\N	2025-11-02 01:09:25.644549	22
3547	46	f	\N	2025-11-02 01:09:25.644549	22
3548	47	f	\N	2025-11-02 01:09:25.644549	22
3549	48	f	\N	2025-11-02 01:09:25.644549	22
3550	49	f	\N	2025-11-02 01:09:25.644549	22
3551	50	f	\N	2025-11-02 01:09:25.644549	22
3552	51	f	\N	2025-11-02 01:09:25.644549	22
3553	52	f	\N	2025-11-02 01:09:25.644549	22
3554	53	f	\N	2025-11-02 01:09:25.644549	22
3555	54	f	\N	2025-11-02 01:09:25.644549	22
3556	55	f	\N	2025-11-02 01:09:25.644549	22
3557	56	f	\N	2025-11-02 01:09:25.644549	22
3558	57	f	\N	2025-11-02 01:09:25.644549	22
3559	58	f	\N	2025-11-02 01:09:25.644549	22
3560	59	f	\N	2025-11-02 01:09:25.644549	22
3561	60	f	\N	2025-11-02 01:09:25.644549	22
3562	61	f	\N	2025-11-02 01:09:25.644549	22
3563	62	f	\N	2025-11-02 01:09:25.644549	22
3564	63	f	\N	2025-11-02 01:09:25.644549	22
3565	64	f	\N	2025-11-02 01:09:25.644549	22
3566	65	f	\N	2025-11-02 01:09:25.644549	22
3567	66	f	\N	2025-11-02 01:09:25.644549	22
3568	67	f	\N	2025-11-02 01:09:25.644549	22
3569	68	f	\N	2025-11-02 01:09:25.644549	22
3570	69	f	\N	2025-11-02 01:09:25.644549	22
3571	70	f	\N	2025-11-02 01:09:25.644549	22
3572	71	f	\N	2025-11-02 01:09:25.644549	22
3573	72	f	\N	2025-11-02 01:09:25.644549	22
3574	73	f	\N	2025-11-02 01:09:25.644549	22
3575	74	f	\N	2025-11-02 01:09:25.644549	22
3576	75	f	\N	2025-11-02 01:09:25.644549	22
3577	76	f	\N	2025-11-02 01:09:25.644549	22
3578	77	f	\N	2025-11-02 01:09:25.644549	22
3579	78	f	\N	2025-11-02 01:09:25.644549	22
3580	79	f	\N	2025-11-02 01:09:25.644549	22
3581	80	f	\N	2025-11-02 01:09:25.644549	22
3582	81	f	\N	2025-11-02 01:09:25.644549	22
3583	82	f	\N	2025-11-02 01:09:25.644549	22
3584	83	f	\N	2025-11-02 01:09:25.644549	22
3585	84	f	\N	2025-11-02 01:09:25.644549	22
3586	85	f	\N	2025-11-02 01:09:25.644549	22
3587	86	f	\N	2025-11-02 01:09:25.644549	22
3588	87	f	\N	2025-11-02 01:09:25.644549	22
3589	88	f	\N	2025-11-02 01:09:25.644549	22
3590	89	f	\N	2025-11-02 01:09:25.644549	22
3591	90	f	\N	2025-11-02 01:09:25.644549	22
3592	91	f	\N	2025-11-02 01:09:25.644549	22
3593	92	f	\N	2025-11-02 01:09:25.644549	22
3594	93	f	\N	2025-11-02 01:09:25.644549	22
3595	94	f	\N	2025-11-02 01:09:25.644549	22
3596	95	f	\N	2025-11-02 01:09:25.644549	22
3597	96	f	\N	2025-11-02 01:09:25.644549	22
3598	97	f	\N	2025-11-02 01:09:25.644549	22
3599	98	f	\N	2025-11-02 01:09:25.644549	22
3600	99	f	\N	2025-11-02 01:09:25.644549	22
3601	100	f	\N	2025-11-02 01:09:25.644549	22
3602	101	f	\N	2025-11-02 01:09:25.644549	22
3603	102	f	\N	2025-11-02 01:09:25.644549	22
3604	103	f	\N	2025-11-02 01:09:25.644549	22
3605	104	f	\N	2025-11-02 01:09:25.644549	22
3606	105	f	\N	2025-11-02 01:09:25.644549	22
3607	106	f	\N	2025-11-02 01:09:25.644549	22
3608	107	f	\N	2025-11-02 01:09:25.644549	22
3609	108	f	\N	2025-11-02 01:09:25.644549	22
3610	109	f	\N	2025-11-02 01:09:25.644549	22
3611	110	f	\N	2025-11-02 01:09:25.644549	22
3612	111	f	\N	2025-11-02 01:09:25.644549	22
3613	112	f	\N	2025-11-02 01:09:25.644549	22
3614	113	f	\N	2025-11-02 01:09:25.644549	22
3615	114	f	\N	2025-11-02 01:09:25.644549	22
3616	115	f	\N	2025-11-02 01:09:25.644549	22
3617	116	f	\N	2025-11-02 01:09:25.644549	22
3618	117	f	\N	2025-11-02 01:09:25.644549	22
3619	118	f	\N	2025-11-02 01:09:25.644549	22
3620	119	f	\N	2025-11-02 01:09:25.644549	22
3621	120	f	\N	2025-11-02 01:09:25.644549	22
3622	121	f	\N	2025-11-02 01:09:25.644549	22
3623	122	f	\N	2025-11-02 01:09:25.644549	22
3624	123	f	\N	2025-11-02 01:09:25.644549	22
3625	124	f	\N	2025-11-02 01:09:25.644549	22
3626	125	f	\N	2025-11-02 01:09:25.644549	22
3627	126	f	\N	2025-11-02 01:09:25.644549	22
3628	127	f	\N	2025-11-02 01:09:25.644549	22
3629	128	f	\N	2025-11-02 01:09:25.644549	22
3630	129	f	\N	2025-11-02 01:09:25.644549	22
3631	130	f	\N	2025-11-02 01:09:25.644549	22
3632	131	f	\N	2025-11-02 01:09:25.644549	22
3633	132	f	\N	2025-11-02 01:09:25.644549	22
3634	133	f	\N	2025-11-02 01:09:25.644549	22
3635	134	f	\N	2025-11-02 01:09:25.644549	22
3636	135	f	\N	2025-11-02 01:09:25.644549	22
3637	136	f	\N	2025-11-02 01:09:25.644549	22
3638	137	f	\N	2025-11-02 01:09:25.644549	22
3639	138	f	\N	2025-11-02 01:09:25.644549	22
3640	139	f	\N	2025-11-02 01:09:25.644549	22
3641	140	f	\N	2025-11-02 01:09:25.644549	22
3642	141	f	\N	2025-11-02 01:09:25.644549	22
3643	142	f	\N	2025-11-02 01:09:25.644549	22
3644	143	f	\N	2025-11-02 01:09:25.644549	22
3645	144	f	\N	2025-11-02 01:09:25.644549	22
3646	145	f	\N	2025-11-02 01:09:25.644549	22
3647	146	f	\N	2025-11-02 01:09:25.644549	22
3648	147	f	\N	2025-11-02 01:09:25.644549	22
3649	148	f	\N	2025-11-02 01:09:25.644549	22
3650	149	f	\N	2025-11-02 01:09:25.644549	22
3651	150	f	\N	2025-11-02 01:09:25.644549	22
3652	151	f	\N	2025-11-02 01:09:25.644549	22
3653	152	f	\N	2025-11-02 01:09:25.644549	22
3654	153	f	\N	2025-11-02 01:09:25.644549	22
3655	154	f	\N	2025-11-02 01:09:25.644549	22
3656	155	f	\N	2025-11-02 01:09:25.644549	22
3657	156	f	\N	2025-11-02 01:09:25.644549	22
3658	157	f	\N	2025-11-02 01:09:25.644549	22
3659	158	f	\N	2025-11-02 01:09:25.644549	22
3660	159	f	\N	2025-11-02 01:09:25.644549	22
3661	160	f	\N	2025-11-02 01:09:25.644549	22
3662	161	f	\N	2025-11-02 01:09:25.644549	22
3663	162	f	\N	2025-11-02 01:09:25.644549	22
3664	163	f	\N	2025-11-02 01:09:25.644549	22
3665	164	f	\N	2025-11-02 01:09:25.644549	22
3666	165	f	\N	2025-11-02 01:09:25.644549	22
3667	166	f	\N	2025-11-02 01:09:25.644549	22
3668	167	f	\N	2025-11-02 01:09:25.644549	22
3669	168	f	\N	2025-11-02 01:09:25.644549	22
3670	169	f	\N	2025-11-02 01:09:25.644549	22
3671	170	f	\N	2025-11-02 01:09:25.644549	22
3672	171	f	\N	2025-11-02 01:09:25.644549	22
3673	172	f	\N	2025-11-02 01:09:25.644549	22
3674	173	f	\N	2025-11-02 01:09:25.644549	22
3675	174	f	\N	2025-11-02 01:09:25.644549	22
3676	175	f	\N	2025-11-02 01:09:25.644549	22
3677	176	f	\N	2025-11-02 01:09:25.644549	22
3678	177	f	\N	2025-11-02 01:09:25.644549	22
3679	178	f	\N	2025-11-02 01:09:25.644549	22
3680	179	f	\N	2025-11-02 01:09:25.644549	22
3681	180	f	\N	2025-11-02 01:09:25.644549	22
3682	181	f	\N	2025-11-02 01:09:25.644549	22
3683	182	f	\N	2025-11-02 01:09:25.644549	22
3684	183	f	\N	2025-11-02 01:09:25.644549	22
3685	184	f	\N	2025-11-02 01:09:25.644549	22
3686	185	f	\N	2025-11-02 01:09:25.644549	22
3687	186	f	\N	2025-11-02 01:09:25.644549	22
3688	187	f	\N	2025-11-02 01:09:25.644549	22
3689	188	f	\N	2025-11-02 01:09:25.644549	22
3690	189	f	\N	2025-11-02 01:09:25.644549	22
3691	190	f	\N	2025-11-02 01:09:25.644549	22
3692	191	f	\N	2025-11-02 01:09:25.644549	22
3693	192	f	\N	2025-11-02 01:09:25.644549	22
3694	193	f	\N	2025-11-02 01:09:25.644549	22
3695	194	f	\N	2025-11-02 01:09:25.644549	22
3696	195	f	\N	2025-11-02 01:09:25.644549	22
3697	196	f	\N	2025-11-02 01:09:25.644549	22
3698	197	f	\N	2025-11-02 01:09:25.644549	22
3699	198	f	\N	2025-11-02 01:09:25.644549	22
3700	199	f	\N	2025-11-02 01:09:25.644549	22
3701	200	f	\N	2025-11-02 01:09:25.644549	22
3702	201	f	\N	2025-11-02 01:09:25.644549	22
3703	202	f	\N	2025-11-02 01:09:25.644549	22
3704	203	f	\N	2025-11-02 01:09:25.644549	22
3705	204	f	\N	2025-11-02 01:09:25.644549	22
3706	205	f	\N	2025-11-02 01:09:25.644549	22
3707	206	f	\N	2025-11-02 01:09:25.644549	22
3708	207	f	\N	2025-11-02 01:09:25.644549	22
3709	208	f	\N	2025-11-02 01:09:25.644549	22
3710	209	f	\N	2025-11-02 01:09:25.644549	22
3711	210	f	\N	2025-11-02 01:09:25.644549	22
3712	211	f	\N	2025-11-02 01:09:25.644549	22
3713	212	f	\N	2025-11-02 01:09:25.644549	22
3714	213	f	\N	2025-11-02 01:09:25.644549	22
3715	214	f	\N	2025-11-02 01:09:25.644549	22
3716	215	f	\N	2025-11-02 01:09:25.644549	22
3717	216	f	\N	2025-11-02 01:09:25.644549	22
3718	217	f	\N	2025-11-02 01:09:25.644549	22
3719	218	f	\N	2025-11-02 01:09:25.644549	22
3720	219	f	\N	2025-11-02 01:09:25.644549	22
3721	220	f	\N	2025-11-02 01:09:25.644549	22
3722	221	f	\N	2025-11-02 01:09:25.644549	22
3723	222	f	\N	2025-11-02 01:09:25.644549	22
3724	223	f	\N	2025-11-02 01:09:25.644549	22
3725	224	f	\N	2025-11-02 01:09:25.644549	22
3726	225	f	\N	2025-11-02 01:09:25.644549	22
3727	226	f	\N	2025-11-02 01:09:25.644549	22
3728	227	f	\N	2025-11-02 01:09:25.644549	22
3729	228	f	\N	2025-11-02 01:09:25.644549	22
3730	229	f	\N	2025-11-02 01:09:25.644549	22
3731	230	f	\N	2025-11-02 01:09:25.644549	22
3732	231	f	\N	2025-11-02 01:09:25.644549	22
3733	232	f	\N	2025-11-02 01:09:25.644549	22
3734	233	f	\N	2025-11-02 01:09:25.644549	22
3735	234	f	\N	2025-11-02 01:09:25.644549	22
3736	235	f	\N	2025-11-02 01:09:25.644549	22
3737	236	f	\N	2025-11-02 01:09:25.644549	22
3738	237	f	\N	2025-11-02 01:09:25.644549	22
3739	238	f	\N	2025-11-02 01:09:25.644549	22
3740	239	f	\N	2025-11-02 01:09:25.644549	22
3741	240	f	\N	2025-11-02 01:09:25.644549	22
3742	241	f	\N	2025-11-02 01:09:25.644549	22
3743	242	f	\N	2025-11-02 01:09:25.644549	22
3744	243	f	\N	2025-11-02 01:09:25.644549	22
3745	244	f	\N	2025-11-02 01:09:25.644549	22
3746	245	f	\N	2025-11-02 01:09:25.644549	22
3747	246	f	\N	2025-11-02 01:09:25.644549	22
3748	247	f	\N	2025-11-02 01:09:25.644549	22
3749	248	f	\N	2025-11-02 01:09:25.644549	22
3750	249	f	\N	2025-11-02 01:09:25.644549	22
3751	250	f	\N	2025-11-02 01:09:25.644549	22
3752	251	f	\N	2025-11-02 01:09:25.644549	22
3753	252	f	\N	2025-11-02 01:09:25.644549	22
3754	253	f	\N	2025-11-02 01:09:25.644549	22
3755	254	f	\N	2025-11-02 01:09:25.644549	22
3756	255	f	\N	2025-11-02 01:09:25.644549	22
3757	256	f	\N	2025-11-02 01:09:25.644549	22
3758	257	f	\N	2025-11-02 01:09:25.644549	22
3759	258	f	\N	2025-11-02 01:09:25.644549	22
3760	259	f	\N	2025-11-02 01:09:25.644549	22
3761	260	f	\N	2025-11-02 01:09:25.644549	22
3762	261	f	\N	2025-11-02 01:09:25.644549	22
3763	262	f	\N	2025-11-02 01:09:25.644549	22
3764	263	f	\N	2025-11-02 01:09:25.644549	22
3765	264	f	\N	2025-11-02 01:09:25.644549	22
3766	265	f	\N	2025-11-02 01:09:25.644549	22
3767	266	f	\N	2025-11-02 01:09:25.644549	22
3768	267	f	\N	2025-11-02 01:09:25.644549	22
3769	268	f	\N	2025-11-02 01:09:25.644549	22
3770	269	f	\N	2025-11-02 01:09:25.644549	22
3771	270	f	\N	2025-11-02 01:09:25.644549	22
3772	271	f	\N	2025-11-02 01:09:25.644549	22
3773	272	f	\N	2025-11-02 01:09:25.644549	22
3774	273	f	\N	2025-11-02 01:09:25.644549	22
3775	274	f	\N	2025-11-02 01:09:25.644549	22
3776	275	f	\N	2025-11-02 01:09:25.644549	22
3777	276	f	\N	2025-11-02 01:09:25.644549	22
3778	277	f	\N	2025-11-02 01:09:25.644549	22
3779	278	f	\N	2025-11-02 01:09:25.644549	22
3780	279	f	\N	2025-11-02 01:09:25.644549	22
3781	280	f	\N	2025-11-02 01:09:25.644549	22
3782	281	f	\N	2025-11-02 01:09:25.644549	22
3783	282	f	\N	2025-11-02 01:09:25.644549	22
3784	283	f	\N	2025-11-02 01:09:25.644549	22
3785	284	f	\N	2025-11-02 01:09:25.644549	22
3786	285	f	\N	2025-11-02 01:09:25.644549	22
3787	286	f	\N	2025-11-02 01:09:25.644549	22
3788	287	f	\N	2025-11-02 01:09:25.644549	22
3789	288	f	\N	2025-11-02 01:09:25.644549	22
3790	289	f	\N	2025-11-02 01:09:25.644549	22
3791	290	f	\N	2025-11-02 01:09:25.644549	22
3792	291	f	\N	2025-11-02 01:09:25.644549	22
3793	292	f	\N	2025-11-02 01:09:25.644549	22
3794	293	f	\N	2025-11-02 01:09:25.644549	22
3795	294	f	\N	2025-11-02 01:09:25.644549	22
3796	295	f	\N	2025-11-02 01:09:25.644549	22
3797	296	f	\N	2025-11-02 01:09:25.644549	22
3798	297	f	\N	2025-11-02 01:09:25.644549	22
3799	298	f	\N	2025-11-02 01:09:25.644549	22
3800	299	f	\N	2025-11-02 01:09:25.644549	22
3801	300	f	\N	2025-11-02 01:09:25.644549	22
3802	301	f	\N	2025-11-02 01:09:25.644549	22
3803	302	f	\N	2025-11-02 01:09:25.644549	22
3804	303	f	\N	2025-11-02 01:09:25.644549	22
3805	304	f	\N	2025-11-02 01:09:25.644549	22
3806	305	f	\N	2025-11-02 01:09:25.644549	22
3807	306	f	\N	2025-11-02 01:09:25.644549	22
3808	307	f	\N	2025-11-02 01:09:25.644549	22
3809	308	f	\N	2025-11-02 01:09:25.644549	22
3810	309	f	\N	2025-11-02 01:09:25.644549	22
3811	310	f	\N	2025-11-02 01:09:25.644549	22
3812	311	f	\N	2025-11-02 01:09:25.644549	22
3813	312	f	\N	2025-11-02 01:09:25.644549	22
3814	313	f	\N	2025-11-02 01:09:25.644549	22
3815	314	f	\N	2025-11-02 01:09:25.644549	22
3816	315	f	\N	2025-11-02 01:09:25.644549	22
3817	316	f	\N	2025-11-02 01:09:25.644549	22
3818	317	f	\N	2025-11-02 01:09:25.644549	22
3819	318	f	\N	2025-11-02 01:09:25.644549	22
3820	319	f	\N	2025-11-02 01:09:25.644549	22
3821	320	f	\N	2025-11-02 01:09:25.644549	22
3822	321	f	\N	2025-11-02 01:09:25.644549	22
3823	322	f	\N	2025-11-02 01:09:25.644549	22
3824	323	f	\N	2025-11-02 01:09:25.644549	22
3825	324	f	\N	2025-11-02 01:09:25.644549	22
3826	325	f	\N	2025-11-02 01:09:25.644549	22
3827	326	f	\N	2025-11-02 01:09:25.644549	22
3828	327	f	\N	2025-11-02 01:09:25.644549	22
3829	328	f	\N	2025-11-02 01:09:25.644549	22
3830	329	f	\N	2025-11-02 01:09:25.644549	22
3831	330	f	\N	2025-11-02 01:09:25.644549	22
3832	331	f	\N	2025-11-02 01:09:25.644549	22
3833	332	f	\N	2025-11-02 01:09:25.644549	22
3834	333	f	\N	2025-11-02 01:09:25.644549	22
3835	334	f	\N	2025-11-02 01:09:25.644549	22
3836	335	f	\N	2025-11-02 01:09:25.644549	22
3837	336	f	\N	2025-11-02 01:09:25.644549	22
3838	337	f	\N	2025-11-02 01:09:25.644549	22
3839	338	f	\N	2025-11-02 01:09:25.644549	22
3840	339	f	\N	2025-11-02 01:09:25.644549	22
3841	340	f	\N	2025-11-02 01:09:25.644549	22
3842	341	f	\N	2025-11-02 01:09:25.644549	22
3843	342	f	\N	2025-11-02 01:09:25.644549	22
3844	343	f	\N	2025-11-02 01:09:25.644549	22
3845	344	f	\N	2025-11-02 01:09:25.644549	22
3846	345	f	\N	2025-11-02 01:09:25.644549	22
3847	346	f	\N	2025-11-02 01:09:25.644549	22
3848	347	f	\N	2025-11-02 01:09:25.644549	22
3849	348	f	\N	2025-11-02 01:09:25.644549	22
3850	349	f	\N	2025-11-02 01:09:25.644549	22
3851	350	f	\N	2025-11-02 01:09:25.644549	22
3852	351	f	\N	2025-11-02 01:09:25.644549	22
3853	352	f	\N	2025-11-02 01:09:25.644549	22
3854	353	f	\N	2025-11-02 01:09:25.644549	22
3855	354	f	\N	2025-11-02 01:09:25.644549	22
3856	355	f	\N	2025-11-02 01:09:25.644549	22
3857	356	f	\N	2025-11-02 01:09:25.644549	22
3858	357	f	\N	2025-11-02 01:09:25.644549	22
3859	358	f	\N	2025-11-02 01:09:25.644549	22
3860	359	f	\N	2025-11-02 01:09:25.644549	22
3861	360	f	\N	2025-11-02 01:09:25.644549	22
3862	361	f	\N	2025-11-02 01:09:25.644549	22
3863	362	f	\N	2025-11-02 01:09:25.644549	22
3864	363	f	\N	2025-11-02 01:09:25.644549	22
3865	364	f	\N	2025-11-02 01:09:25.644549	22
3866	365	f	\N	2025-11-02 01:09:25.644549	22
3867	366	f	\N	2025-11-02 01:09:25.644549	22
3868	367	f	\N	2025-11-02 01:09:25.644549	22
3869	368	f	\N	2025-11-02 01:09:25.644549	22
3870	369	f	\N	2025-11-02 01:09:25.644549	22
3871	370	f	\N	2025-11-02 01:09:25.644549	22
3872	371	f	\N	2025-11-02 01:09:25.644549	22
3873	372	f	\N	2025-11-02 01:09:25.644549	22
3874	373	f	\N	2025-11-02 01:09:25.644549	22
3875	374	f	\N	2025-11-02 01:09:25.644549	22
3876	375	f	\N	2025-11-02 01:09:25.644549	22
3877	376	f	\N	2025-11-02 01:09:25.644549	22
3878	377	f	\N	2025-11-02 01:09:25.644549	22
3879	378	f	\N	2025-11-02 01:09:25.644549	22
3880	379	f	\N	2025-11-02 01:09:25.644549	22
3881	380	f	\N	2025-11-02 01:09:25.644549	22
3882	381	f	\N	2025-11-02 01:09:25.644549	22
3883	382	f	\N	2025-11-02 01:09:25.644549	22
3884	383	f	\N	2025-11-02 01:09:25.644549	22
3885	384	f	\N	2025-11-02 01:09:25.644549	22
3886	385	f	\N	2025-11-02 01:09:25.644549	22
3887	386	f	\N	2025-11-02 01:09:25.644549	22
3888	387	f	\N	2025-11-02 01:09:25.644549	22
3889	388	f	\N	2025-11-02 01:09:25.644549	22
3890	389	f	\N	2025-11-02 01:09:25.644549	22
3891	390	f	\N	2025-11-02 01:09:25.644549	22
3892	391	f	\N	2025-11-02 01:09:25.644549	22
3893	392	f	\N	2025-11-02 01:09:25.644549	22
3894	393	f	\N	2025-11-02 01:09:25.644549	22
3895	394	f	\N	2025-11-02 01:09:25.644549	22
3896	395	f	\N	2025-11-02 01:09:25.644549	22
3897	396	f	\N	2025-11-02 01:09:25.644549	22
3898	397	f	\N	2025-11-02 01:09:25.644549	22
3899	398	f	\N	2025-11-02 01:09:25.644549	22
3900	399	f	\N	2025-11-02 01:09:25.644549	22
3901	400	f	\N	2025-11-02 01:09:25.644549	22
3902	401	f	\N	2025-11-02 01:09:25.644549	22
3903	402	f	\N	2025-11-02 01:09:25.644549	22
3904	403	f	\N	2025-11-02 01:09:25.644549	22
3905	404	f	\N	2025-11-02 01:09:25.644549	22
3906	405	f	\N	2025-11-02 01:09:25.644549	22
3907	406	f	\N	2025-11-02 01:09:25.644549	22
3908	407	f	\N	2025-11-02 01:09:25.644549	22
3909	408	f	\N	2025-11-02 01:09:25.644549	22
3910	409	f	\N	2025-11-02 01:09:25.644549	22
3911	410	f	\N	2025-11-02 01:09:25.644549	22
3912	411	f	\N	2025-11-02 01:09:25.644549	22
3913	412	f	\N	2025-11-02 01:09:25.644549	22
3914	413	f	\N	2025-11-02 01:09:25.644549	22
3915	414	f	\N	2025-11-02 01:09:25.644549	22
3916	415	f	\N	2025-11-02 01:09:25.644549	22
3917	416	f	\N	2025-11-02 01:09:25.644549	22
3918	417	f	\N	2025-11-02 01:09:25.644549	22
3919	418	f	\N	2025-11-02 01:09:25.644549	22
3920	419	f	\N	2025-11-02 01:09:25.644549	22
3921	420	f	\N	2025-11-02 01:09:25.644549	22
3922	421	f	\N	2025-11-02 01:09:25.644549	22
3923	422	f	\N	2025-11-02 01:09:25.644549	22
3924	423	f	\N	2025-11-02 01:09:25.644549	22
3925	424	f	\N	2025-11-02 01:09:25.644549	22
3926	425	f	\N	2025-11-02 01:09:25.644549	22
3927	426	f	\N	2025-11-02 01:09:25.644549	22
3928	427	f	\N	2025-11-02 01:09:25.644549	22
3929	428	f	\N	2025-11-02 01:09:25.644549	22
3930	429	f	\N	2025-11-02 01:09:25.644549	22
3931	430	f	\N	2025-11-02 01:09:25.644549	22
3932	431	f	\N	2025-11-02 01:09:25.644549	22
3933	432	f	\N	2025-11-02 01:09:25.644549	22
3934	433	f	\N	2025-11-02 01:09:25.644549	22
3935	434	f	\N	2025-11-02 01:09:25.644549	22
3936	435	f	\N	2025-11-02 01:09:25.644549	22
3937	436	f	\N	2025-11-02 01:09:25.644549	22
3938	437	f	\N	2025-11-02 01:09:25.644549	22
3939	438	f	\N	2025-11-02 01:09:25.644549	22
3940	439	f	\N	2025-11-02 01:09:25.644549	22
3941	440	f	\N	2025-11-02 01:09:25.644549	22
3942	441	f	\N	2025-11-02 01:09:25.644549	22
3943	442	f	\N	2025-11-02 01:09:25.644549	22
3944	443	f	\N	2025-11-02 01:09:25.644549	22
3945	444	f	\N	2025-11-02 01:09:25.644549	22
3946	445	f	\N	2025-11-02 01:09:25.644549	22
3947	446	f	\N	2025-11-02 01:09:25.644549	22
3948	447	f	\N	2025-11-02 01:09:25.644549	22
3949	448	f	\N	2025-11-02 01:09:25.644549	22
3950	449	f	\N	2025-11-02 01:09:25.644549	22
3951	450	f	\N	2025-11-02 01:09:25.644549	22
3952	451	f	\N	2025-11-02 01:09:25.644549	22
3953	452	f	\N	2025-11-02 01:09:25.644549	22
3954	453	f	\N	2025-11-02 01:09:25.644549	22
3955	454	f	\N	2025-11-02 01:09:25.644549	22
3956	455	f	\N	2025-11-02 01:09:25.644549	22
3957	456	f	\N	2025-11-02 01:09:25.644549	22
3958	457	f	\N	2025-11-02 01:09:25.644549	22
3959	458	f	\N	2025-11-02 01:09:25.644549	22
3960	459	f	\N	2025-11-02 01:09:25.644549	22
3961	460	f	\N	2025-11-02 01:09:25.644549	22
3962	461	f	\N	2025-11-02 01:09:25.644549	22
3963	462	f	\N	2025-11-02 01:09:25.644549	22
3964	463	f	\N	2025-11-02 01:09:25.644549	22
3965	464	f	\N	2025-11-02 01:09:25.644549	22
3966	465	f	\N	2025-11-02 01:09:25.644549	22
3967	466	f	\N	2025-11-02 01:09:25.644549	22
3968	467	f	\N	2025-11-02 01:09:25.644549	22
3969	468	f	\N	2025-11-02 01:09:25.644549	22
3970	469	f	\N	2025-11-02 01:09:25.644549	22
3971	470	f	\N	2025-11-02 01:09:25.644549	22
3972	471	f	\N	2025-11-02 01:09:25.644549	22
3973	472	f	\N	2025-11-02 01:09:25.644549	22
3974	473	f	\N	2025-11-02 01:09:25.644549	22
3975	474	f	\N	2025-11-02 01:09:25.644549	22
3976	475	f	\N	2025-11-02 01:09:25.644549	22
3977	476	f	\N	2025-11-02 01:09:25.644549	22
3978	477	f	\N	2025-11-02 01:09:25.644549	22
3979	478	f	\N	2025-11-02 01:09:25.644549	22
3980	479	f	\N	2025-11-02 01:09:25.644549	22
3981	480	f	\N	2025-11-02 01:09:25.644549	22
3982	481	f	\N	2025-11-02 01:09:25.644549	22
3983	482	f	\N	2025-11-02 01:09:25.644549	22
3984	483	f	\N	2025-11-02 01:09:25.644549	22
3985	484	f	\N	2025-11-02 01:09:25.644549	22
3986	485	f	\N	2025-11-02 01:09:25.644549	22
3987	486	f	\N	2025-11-02 01:09:25.644549	22
3988	487	f	\N	2025-11-02 01:09:25.644549	22
3989	488	f	\N	2025-11-02 01:09:25.644549	22
3990	489	f	\N	2025-11-02 01:09:25.644549	22
3991	490	f	\N	2025-11-02 01:09:25.644549	22
3992	491	f	\N	2025-11-02 01:09:25.644549	22
3993	492	f	\N	2025-11-02 01:09:25.644549	22
3994	493	f	\N	2025-11-02 01:09:25.644549	22
3995	494	f	\N	2025-11-02 01:09:25.644549	22
3996	495	f	\N	2025-11-02 01:09:25.644549	22
3997	496	f	\N	2025-11-02 01:09:25.644549	22
3998	497	f	\N	2025-11-02 01:09:25.644549	22
3999	498	f	\N	2025-11-02 01:09:25.644549	22
4000	499	f	\N	2025-11-02 01:09:25.644549	22
4001	500	f	\N	2025-11-02 01:09:25.644549	22
3017	16	t	49	2025-11-01 15:04:54.245676	21
3006	5	t	47	2025-11-01 15:04:54.245676	21
4503	2	f	\N	2025-11-12 00:11:19.884853	24
4504	3	f	\N	2025-11-12 00:11:19.884853	24
4505	4	f	\N	2025-11-12 00:11:19.884853	24
4506	5	f	\N	2025-11-12 00:11:19.884853	24
4507	6	f	\N	2025-11-12 00:11:19.884853	24
4508	7	f	\N	2025-11-12 00:11:19.884853	24
4509	8	f	\N	2025-11-12 00:11:19.884853	24
4510	9	f	\N	2025-11-12 00:11:19.884853	24
4511	10	f	\N	2025-11-12 00:11:19.884853	24
4512	11	f	\N	2025-11-12 00:11:19.884853	24
4513	12	f	\N	2025-11-12 00:11:19.884853	24
4514	13	f	\N	2025-11-12 00:11:19.884853	24
4515	14	f	\N	2025-11-12 00:11:19.884853	24
4516	15	f	\N	2025-11-12 00:11:19.884853	24
4517	16	f	\N	2025-11-12 00:11:19.884853	24
4518	17	f	\N	2025-11-12 00:11:19.884853	24
4519	18	f	\N	2025-11-12 00:11:19.884853	24
4520	19	f	\N	2025-11-12 00:11:19.884853	24
4521	20	f	\N	2025-11-12 00:11:19.884853	24
4522	21	f	\N	2025-11-12 00:11:19.884853	24
4523	22	f	\N	2025-11-12 00:11:19.884853	24
4524	23	f	\N	2025-11-12 00:11:19.884853	24
4525	24	f	\N	2025-11-12 00:11:19.884853	24
4526	25	f	\N	2025-11-12 00:11:19.884853	24
4527	26	f	\N	2025-11-12 00:11:19.884853	24
4528	27	f	\N	2025-11-12 00:11:19.884853	24
4529	28	f	\N	2025-11-12 00:11:19.884853	24
4530	29	f	\N	2025-11-12 00:11:19.884853	24
4531	30	f	\N	2025-11-12 00:11:19.884853	24
4532	31	f	\N	2025-11-12 00:11:19.884853	24
4533	32	f	\N	2025-11-12 00:11:19.884853	24
4534	33	f	\N	2025-11-12 00:11:19.884853	24
4535	34	f	\N	2025-11-12 00:11:19.884853	24
4536	35	f	\N	2025-11-12 00:11:19.884853	24
4537	36	f	\N	2025-11-12 00:11:19.884853	24
4538	37	f	\N	2025-11-12 00:11:19.884853	24
4539	38	f	\N	2025-11-12 00:11:19.884853	24
4540	39	f	\N	2025-11-12 00:11:19.884853	24
4541	40	f	\N	2025-11-12 00:11:19.884853	24
4542	41	f	\N	2025-11-12 00:11:19.884853	24
4543	42	f	\N	2025-11-12 00:11:19.884853	24
4544	43	f	\N	2025-11-12 00:11:19.884853	24
4545	44	f	\N	2025-11-12 00:11:19.884853	24
4546	45	f	\N	2025-11-12 00:11:19.884853	24
4547	46	f	\N	2025-11-12 00:11:19.884853	24
4548	47	f	\N	2025-11-12 00:11:19.884853	24
4549	48	f	\N	2025-11-12 00:11:19.884853	24
4550	49	f	\N	2025-11-12 00:11:19.884853	24
4551	50	f	\N	2025-11-12 00:11:19.884853	24
4552	51	f	\N	2025-11-12 00:11:19.884853	24
4553	52	f	\N	2025-11-12 00:11:19.884853	24
4554	53	f	\N	2025-11-12 00:11:19.884853	24
4555	54	f	\N	2025-11-12 00:11:19.884853	24
4556	55	f	\N	2025-11-12 00:11:19.884853	24
4557	56	f	\N	2025-11-12 00:11:19.884853	24
4558	57	f	\N	2025-11-12 00:11:19.884853	24
4559	58	f	\N	2025-11-12 00:11:19.884853	24
4560	59	f	\N	2025-11-12 00:11:19.884853	24
4561	60	f	\N	2025-11-12 00:11:19.884853	24
4562	61	f	\N	2025-11-12 00:11:19.884853	24
4563	62	f	\N	2025-11-12 00:11:19.884853	24
4564	63	f	\N	2025-11-12 00:11:19.884853	24
4565	64	f	\N	2025-11-12 00:11:19.884853	24
4566	65	f	\N	2025-11-12 00:11:19.884853	24
4567	66	f	\N	2025-11-12 00:11:19.884853	24
4568	67	f	\N	2025-11-12 00:11:19.884853	24
4569	68	f	\N	2025-11-12 00:11:19.884853	24
4570	69	f	\N	2025-11-12 00:11:19.884853	24
4571	70	f	\N	2025-11-12 00:11:19.884853	24
4572	71	f	\N	2025-11-12 00:11:19.884853	24
4573	72	f	\N	2025-11-12 00:11:19.884853	24
4574	73	f	\N	2025-11-12 00:11:19.884853	24
4575	74	f	\N	2025-11-12 00:11:19.884853	24
4576	75	f	\N	2025-11-12 00:11:19.884853	24
4577	76	f	\N	2025-11-12 00:11:19.884853	24
4578	77	f	\N	2025-11-12 00:11:19.884853	24
4579	78	f	\N	2025-11-12 00:11:19.884853	24
4580	79	f	\N	2025-11-12 00:11:19.884853	24
4581	80	f	\N	2025-11-12 00:11:19.884853	24
4582	81	f	\N	2025-11-12 00:11:19.884853	24
4583	82	f	\N	2025-11-12 00:11:19.884853	24
4584	83	f	\N	2025-11-12 00:11:19.884853	24
4585	84	f	\N	2025-11-12 00:11:19.884853	24
4586	85	f	\N	2025-11-12 00:11:19.884853	24
4587	86	f	\N	2025-11-12 00:11:19.884853	24
4588	87	f	\N	2025-11-12 00:11:19.884853	24
4589	88	f	\N	2025-11-12 00:11:19.884853	24
4590	89	f	\N	2025-11-12 00:11:19.884853	24
4591	90	f	\N	2025-11-12 00:11:19.884853	24
4592	91	f	\N	2025-11-12 00:11:19.884853	24
4593	92	f	\N	2025-11-12 00:11:19.884853	24
4594	93	f	\N	2025-11-12 00:11:19.884853	24
4595	94	f	\N	2025-11-12 00:11:19.884853	24
4596	95	f	\N	2025-11-12 00:11:19.884853	24
4597	96	f	\N	2025-11-12 00:11:19.884853	24
4598	97	f	\N	2025-11-12 00:11:19.884853	24
4599	98	f	\N	2025-11-12 00:11:19.884853	24
4600	99	f	\N	2025-11-12 00:11:19.884853	24
4601	100	f	\N	2025-11-12 00:11:19.884853	24
4602	101	f	\N	2025-11-12 00:11:19.884853	24
4603	102	f	\N	2025-11-12 00:11:19.884853	24
4604	103	f	\N	2025-11-12 00:11:19.884853	24
4605	104	f	\N	2025-11-12 00:11:19.884853	24
4606	105	f	\N	2025-11-12 00:11:19.884853	24
4607	106	f	\N	2025-11-12 00:11:19.884853	24
4608	107	f	\N	2025-11-12 00:11:19.884853	24
4609	108	f	\N	2025-11-12 00:11:19.884853	24
4610	109	f	\N	2025-11-12 00:11:19.884853	24
4611	110	f	\N	2025-11-12 00:11:19.884853	24
4612	111	f	\N	2025-11-12 00:11:19.884853	24
4613	112	f	\N	2025-11-12 00:11:19.884853	24
4614	113	f	\N	2025-11-12 00:11:19.884853	24
4615	114	f	\N	2025-11-12 00:11:19.884853	24
4616	115	f	\N	2025-11-12 00:11:19.884853	24
4617	116	f	\N	2025-11-12 00:11:19.884853	24
4618	117	f	\N	2025-11-12 00:11:19.884853	24
4619	118	f	\N	2025-11-12 00:11:19.884853	24
4620	119	f	\N	2025-11-12 00:11:19.884853	24
4621	120	f	\N	2025-11-12 00:11:19.884853	24
4622	121	f	\N	2025-11-12 00:11:19.884853	24
4623	122	f	\N	2025-11-12 00:11:19.884853	24
4624	123	f	\N	2025-11-12 00:11:19.884853	24
4625	124	f	\N	2025-11-12 00:11:19.884853	24
4626	125	f	\N	2025-11-12 00:11:19.884853	24
4627	126	f	\N	2025-11-12 00:11:19.884853	24
4628	127	f	\N	2025-11-12 00:11:19.884853	24
4629	128	f	\N	2025-11-12 00:11:19.884853	24
4630	129	f	\N	2025-11-12 00:11:19.884853	24
4631	130	f	\N	2025-11-12 00:11:19.884853	24
4632	131	f	\N	2025-11-12 00:11:19.884853	24
4633	132	f	\N	2025-11-12 00:11:19.884853	24
4634	133	f	\N	2025-11-12 00:11:19.884853	24
4635	134	f	\N	2025-11-12 00:11:19.884853	24
4636	135	f	\N	2025-11-12 00:11:19.884853	24
4637	136	f	\N	2025-11-12 00:11:19.884853	24
4638	137	f	\N	2025-11-12 00:11:19.884853	24
4639	138	f	\N	2025-11-12 00:11:19.884853	24
4640	139	f	\N	2025-11-12 00:11:19.884853	24
4641	140	f	\N	2025-11-12 00:11:19.884853	24
4642	141	f	\N	2025-11-12 00:11:19.884853	24
4643	142	f	\N	2025-11-12 00:11:19.884853	24
4644	143	f	\N	2025-11-12 00:11:19.884853	24
4645	144	f	\N	2025-11-12 00:11:19.884853	24
4646	145	f	\N	2025-11-12 00:11:19.884853	24
4647	146	f	\N	2025-11-12 00:11:19.884853	24
4648	147	f	\N	2025-11-12 00:11:19.884853	24
4649	148	f	\N	2025-11-12 00:11:19.884853	24
4650	149	f	\N	2025-11-12 00:11:19.884853	24
4651	150	f	\N	2025-11-12 00:11:19.884853	24
4652	151	f	\N	2025-11-12 00:11:19.884853	24
4653	152	f	\N	2025-11-12 00:11:19.884853	24
4654	153	f	\N	2025-11-12 00:11:19.884853	24
4655	154	f	\N	2025-11-12 00:11:19.884853	24
4656	155	f	\N	2025-11-12 00:11:19.884853	24
4657	156	f	\N	2025-11-12 00:11:19.884853	24
4658	157	f	\N	2025-11-12 00:11:19.884853	24
4659	158	f	\N	2025-11-12 00:11:19.884853	24
4660	159	f	\N	2025-11-12 00:11:19.884853	24
4661	160	f	\N	2025-11-12 00:11:19.884853	24
4662	161	f	\N	2025-11-12 00:11:19.884853	24
4663	162	f	\N	2025-11-12 00:11:19.884853	24
4664	163	f	\N	2025-11-12 00:11:19.884853	24
4665	164	f	\N	2025-11-12 00:11:19.884853	24
4666	165	f	\N	2025-11-12 00:11:19.884853	24
4667	166	f	\N	2025-11-12 00:11:19.884853	24
4668	167	f	\N	2025-11-12 00:11:19.884853	24
4669	168	f	\N	2025-11-12 00:11:19.884853	24
4670	169	f	\N	2025-11-12 00:11:19.884853	24
4671	170	f	\N	2025-11-12 00:11:19.884853	24
4672	171	f	\N	2025-11-12 00:11:19.884853	24
4673	172	f	\N	2025-11-12 00:11:19.884853	24
4674	173	f	\N	2025-11-12 00:11:19.884853	24
4675	174	f	\N	2025-11-12 00:11:19.884853	24
4676	175	f	\N	2025-11-12 00:11:19.884853	24
4677	176	f	\N	2025-11-12 00:11:19.884853	24
4678	177	f	\N	2025-11-12 00:11:19.884853	24
4679	178	f	\N	2025-11-12 00:11:19.884853	24
4680	179	f	\N	2025-11-12 00:11:19.884853	24
4681	180	f	\N	2025-11-12 00:11:19.884853	24
4682	181	f	\N	2025-11-12 00:11:19.884853	24
4683	182	f	\N	2025-11-12 00:11:19.884853	24
4684	183	f	\N	2025-11-12 00:11:19.884853	24
4685	184	f	\N	2025-11-12 00:11:19.884853	24
4686	185	f	\N	2025-11-12 00:11:19.884853	24
4687	186	f	\N	2025-11-12 00:11:19.884853	24
4688	187	f	\N	2025-11-12 00:11:19.884853	24
4689	188	f	\N	2025-11-12 00:11:19.884853	24
4690	189	f	\N	2025-11-12 00:11:19.884853	24
4691	190	f	\N	2025-11-12 00:11:19.884853	24
4692	191	f	\N	2025-11-12 00:11:19.884853	24
4693	192	f	\N	2025-11-12 00:11:19.884853	24
4694	193	f	\N	2025-11-12 00:11:19.884853	24
4695	194	f	\N	2025-11-12 00:11:19.884853	24
4696	195	f	\N	2025-11-12 00:11:19.884853	24
4697	196	f	\N	2025-11-12 00:11:19.884853	24
4698	197	f	\N	2025-11-12 00:11:19.884853	24
4699	198	f	\N	2025-11-12 00:11:19.884853	24
4700	199	f	\N	2025-11-12 00:11:19.884853	24
4701	200	f	\N	2025-11-12 00:11:19.884853	24
4702	201	f	\N	2025-11-12 00:11:19.884853	24
4703	202	f	\N	2025-11-12 00:11:19.884853	24
4704	203	f	\N	2025-11-12 00:11:19.884853	24
4705	204	f	\N	2025-11-12 00:11:19.884853	24
4706	205	f	\N	2025-11-12 00:11:19.884853	24
4707	206	f	\N	2025-11-12 00:11:19.884853	24
4708	207	f	\N	2025-11-12 00:11:19.884853	24
4709	208	f	\N	2025-11-12 00:11:19.884853	24
4710	209	f	\N	2025-11-12 00:11:19.884853	24
4711	210	f	\N	2025-11-12 00:11:19.884853	24
4712	211	f	\N	2025-11-12 00:11:19.884853	24
4713	212	f	\N	2025-11-12 00:11:19.884853	24
4714	213	f	\N	2025-11-12 00:11:19.884853	24
4715	214	f	\N	2025-11-12 00:11:19.884853	24
4716	215	f	\N	2025-11-12 00:11:19.884853	24
4717	216	f	\N	2025-11-12 00:11:19.884853	24
4718	217	f	\N	2025-11-12 00:11:19.884853	24
4719	218	f	\N	2025-11-12 00:11:19.884853	24
4720	219	f	\N	2025-11-12 00:11:19.884853	24
4721	220	f	\N	2025-11-12 00:11:19.884853	24
4722	221	f	\N	2025-11-12 00:11:19.884853	24
4723	222	f	\N	2025-11-12 00:11:19.884853	24
4724	223	f	\N	2025-11-12 00:11:19.884853	24
4725	224	f	\N	2025-11-12 00:11:19.884853	24
4726	225	f	\N	2025-11-12 00:11:19.884853	24
4727	226	f	\N	2025-11-12 00:11:19.884853	24
4728	227	f	\N	2025-11-12 00:11:19.884853	24
4729	228	f	\N	2025-11-12 00:11:19.884853	24
4730	229	f	\N	2025-11-12 00:11:19.884853	24
4731	230	f	\N	2025-11-12 00:11:19.884853	24
4732	231	f	\N	2025-11-12 00:11:19.884853	24
4733	232	f	\N	2025-11-12 00:11:19.884853	24
4734	233	f	\N	2025-11-12 00:11:19.884853	24
4735	234	f	\N	2025-11-12 00:11:19.884853	24
4736	235	f	\N	2025-11-12 00:11:19.884853	24
4737	236	f	\N	2025-11-12 00:11:19.884853	24
4738	237	f	\N	2025-11-12 00:11:19.884853	24
4739	238	f	\N	2025-11-12 00:11:19.884853	24
4740	239	f	\N	2025-11-12 00:11:19.884853	24
4741	240	f	\N	2025-11-12 00:11:19.884853	24
4742	241	f	\N	2025-11-12 00:11:19.884853	24
4743	242	f	\N	2025-11-12 00:11:19.884853	24
4744	243	f	\N	2025-11-12 00:11:19.884853	24
4745	244	f	\N	2025-11-12 00:11:19.884853	24
4746	245	f	\N	2025-11-12 00:11:19.884853	24
4747	246	f	\N	2025-11-12 00:11:19.884853	24
4748	247	f	\N	2025-11-12 00:11:19.884853	24
4749	248	f	\N	2025-11-12 00:11:19.884853	24
4750	249	f	\N	2025-11-12 00:11:19.884853	24
4751	250	f	\N	2025-11-12 00:11:19.884853	24
4752	251	f	\N	2025-11-12 00:11:19.884853	24
4753	252	f	\N	2025-11-12 00:11:19.884853	24
4754	253	f	\N	2025-11-12 00:11:19.884853	24
4755	254	f	\N	2025-11-12 00:11:19.884853	24
4756	255	f	\N	2025-11-12 00:11:19.884853	24
4757	256	f	\N	2025-11-12 00:11:19.884853	24
4758	257	f	\N	2025-11-12 00:11:19.884853	24
4759	258	f	\N	2025-11-12 00:11:19.884853	24
4760	259	f	\N	2025-11-12 00:11:19.884853	24
4761	260	f	\N	2025-11-12 00:11:19.884853	24
4762	261	f	\N	2025-11-12 00:11:19.884853	24
4763	262	f	\N	2025-11-12 00:11:19.884853	24
4764	263	f	\N	2025-11-12 00:11:19.884853	24
4765	264	f	\N	2025-11-12 00:11:19.884853	24
4766	265	f	\N	2025-11-12 00:11:19.884853	24
4767	266	f	\N	2025-11-12 00:11:19.884853	24
4768	267	f	\N	2025-11-12 00:11:19.884853	24
4769	268	f	\N	2025-11-12 00:11:19.884853	24
4770	269	f	\N	2025-11-12 00:11:19.884853	24
4771	270	f	\N	2025-11-12 00:11:19.884853	24
4772	271	f	\N	2025-11-12 00:11:19.884853	24
4773	272	f	\N	2025-11-12 00:11:19.884853	24
4774	273	f	\N	2025-11-12 00:11:19.884853	24
4775	274	f	\N	2025-11-12 00:11:19.884853	24
4776	275	f	\N	2025-11-12 00:11:19.884853	24
4777	276	f	\N	2025-11-12 00:11:19.884853	24
4778	277	f	\N	2025-11-12 00:11:19.884853	24
4779	278	f	\N	2025-11-12 00:11:19.884853	24
4780	279	f	\N	2025-11-12 00:11:19.884853	24
4781	280	f	\N	2025-11-12 00:11:19.884853	24
4782	281	f	\N	2025-11-12 00:11:19.884853	24
4783	282	f	\N	2025-11-12 00:11:19.884853	24
4784	283	f	\N	2025-11-12 00:11:19.884853	24
4785	284	f	\N	2025-11-12 00:11:19.884853	24
4786	285	f	\N	2025-11-12 00:11:19.884853	24
4787	286	f	\N	2025-11-12 00:11:19.884853	24
4788	287	f	\N	2025-11-12 00:11:19.884853	24
4789	288	f	\N	2025-11-12 00:11:19.884853	24
4790	289	f	\N	2025-11-12 00:11:19.884853	24
4791	290	f	\N	2025-11-12 00:11:19.884853	24
4792	291	f	\N	2025-11-12 00:11:19.884853	24
4793	292	f	\N	2025-11-12 00:11:19.884853	24
4794	293	f	\N	2025-11-12 00:11:19.884853	24
4795	294	f	\N	2025-11-12 00:11:19.884853	24
4796	295	f	\N	2025-11-12 00:11:19.884853	24
4797	296	f	\N	2025-11-12 00:11:19.884853	24
4798	297	f	\N	2025-11-12 00:11:19.884853	24
4799	298	f	\N	2025-11-12 00:11:19.884853	24
4800	299	f	\N	2025-11-12 00:11:19.884853	24
4801	300	f	\N	2025-11-12 00:11:19.884853	24
4802	301	f	\N	2025-11-12 00:11:19.884853	24
4803	302	f	\N	2025-11-12 00:11:19.884853	24
4804	303	f	\N	2025-11-12 00:11:19.884853	24
4805	304	f	\N	2025-11-12 00:11:19.884853	24
4806	305	f	\N	2025-11-12 00:11:19.884853	24
4807	306	f	\N	2025-11-12 00:11:19.884853	24
4808	307	f	\N	2025-11-12 00:11:19.884853	24
4809	308	f	\N	2025-11-12 00:11:19.884853	24
4810	309	f	\N	2025-11-12 00:11:19.884853	24
4811	310	f	\N	2025-11-12 00:11:19.884853	24
4812	311	f	\N	2025-11-12 00:11:19.884853	24
4813	312	f	\N	2025-11-12 00:11:19.884853	24
4814	313	f	\N	2025-11-12 00:11:19.884853	24
4815	314	f	\N	2025-11-12 00:11:19.884853	24
4816	315	f	\N	2025-11-12 00:11:19.884853	24
4817	316	f	\N	2025-11-12 00:11:19.884853	24
4818	317	f	\N	2025-11-12 00:11:19.884853	24
4819	318	f	\N	2025-11-12 00:11:19.884853	24
4820	319	f	\N	2025-11-12 00:11:19.884853	24
4821	320	f	\N	2025-11-12 00:11:19.884853	24
4822	321	f	\N	2025-11-12 00:11:19.884853	24
4823	322	f	\N	2025-11-12 00:11:19.884853	24
4824	323	f	\N	2025-11-12 00:11:19.884853	24
4825	324	f	\N	2025-11-12 00:11:19.884853	24
4826	325	f	\N	2025-11-12 00:11:19.884853	24
4827	326	f	\N	2025-11-12 00:11:19.884853	24
4828	327	f	\N	2025-11-12 00:11:19.884853	24
4829	328	f	\N	2025-11-12 00:11:19.884853	24
4830	329	f	\N	2025-11-12 00:11:19.884853	24
4831	330	f	\N	2025-11-12 00:11:19.884853	24
4832	331	f	\N	2025-11-12 00:11:19.884853	24
4833	332	f	\N	2025-11-12 00:11:19.884853	24
4834	333	f	\N	2025-11-12 00:11:19.884853	24
4835	334	f	\N	2025-11-12 00:11:19.884853	24
4836	335	f	\N	2025-11-12 00:11:19.884853	24
4837	336	f	\N	2025-11-12 00:11:19.884853	24
4838	337	f	\N	2025-11-12 00:11:19.884853	24
4839	338	f	\N	2025-11-12 00:11:19.884853	24
4840	339	f	\N	2025-11-12 00:11:19.884853	24
4841	340	f	\N	2025-11-12 00:11:19.884853	24
4842	341	f	\N	2025-11-12 00:11:19.884853	24
4843	342	f	\N	2025-11-12 00:11:19.884853	24
4844	343	f	\N	2025-11-12 00:11:19.884853	24
4845	344	f	\N	2025-11-12 00:11:19.884853	24
4846	345	f	\N	2025-11-12 00:11:19.884853	24
4847	346	f	\N	2025-11-12 00:11:19.884853	24
4848	347	f	\N	2025-11-12 00:11:19.884853	24
4849	348	f	\N	2025-11-12 00:11:19.884853	24
4850	349	f	\N	2025-11-12 00:11:19.884853	24
4851	350	f	\N	2025-11-12 00:11:19.884853	24
4852	351	f	\N	2025-11-12 00:11:19.884853	24
4853	352	f	\N	2025-11-12 00:11:19.884853	24
4854	353	f	\N	2025-11-12 00:11:19.884853	24
4855	354	f	\N	2025-11-12 00:11:19.884853	24
4856	355	f	\N	2025-11-12 00:11:19.884853	24
4857	356	f	\N	2025-11-12 00:11:19.884853	24
4858	357	f	\N	2025-11-12 00:11:19.884853	24
4859	358	f	\N	2025-11-12 00:11:19.884853	24
4860	359	f	\N	2025-11-12 00:11:19.884853	24
4861	360	f	\N	2025-11-12 00:11:19.884853	24
4862	361	f	\N	2025-11-12 00:11:19.884853	24
4863	362	f	\N	2025-11-12 00:11:19.884853	24
4864	363	f	\N	2025-11-12 00:11:19.884853	24
4865	364	f	\N	2025-11-12 00:11:19.884853	24
4866	365	f	\N	2025-11-12 00:11:19.884853	24
4867	366	f	\N	2025-11-12 00:11:19.884853	24
4868	367	f	\N	2025-11-12 00:11:19.884853	24
4869	368	f	\N	2025-11-12 00:11:19.884853	24
4870	369	f	\N	2025-11-12 00:11:19.884853	24
4871	370	f	\N	2025-11-12 00:11:19.884853	24
4872	371	f	\N	2025-11-12 00:11:19.884853	24
4873	372	f	\N	2025-11-12 00:11:19.884853	24
4874	373	f	\N	2025-11-12 00:11:19.884853	24
4875	374	f	\N	2025-11-12 00:11:19.884853	24
4876	375	f	\N	2025-11-12 00:11:19.884853	24
4877	376	f	\N	2025-11-12 00:11:19.884853	24
4878	377	f	\N	2025-11-12 00:11:19.884853	24
4879	378	f	\N	2025-11-12 00:11:19.884853	24
4880	379	f	\N	2025-11-12 00:11:19.884853	24
4881	380	f	\N	2025-11-12 00:11:19.884853	24
4882	381	f	\N	2025-11-12 00:11:19.884853	24
4883	382	f	\N	2025-11-12 00:11:19.884853	24
4884	383	f	\N	2025-11-12 00:11:19.884853	24
4885	384	f	\N	2025-11-12 00:11:19.884853	24
4886	385	f	\N	2025-11-12 00:11:19.884853	24
4887	386	f	\N	2025-11-12 00:11:19.884853	24
4888	387	f	\N	2025-11-12 00:11:19.884853	24
4889	388	f	\N	2025-11-12 00:11:19.884853	24
4890	389	f	\N	2025-11-12 00:11:19.884853	24
4891	390	f	\N	2025-11-12 00:11:19.884853	24
4892	391	f	\N	2025-11-12 00:11:19.884853	24
4893	392	f	\N	2025-11-12 00:11:19.884853	24
4894	393	f	\N	2025-11-12 00:11:19.884853	24
4895	394	f	\N	2025-11-12 00:11:19.884853	24
4896	395	f	\N	2025-11-12 00:11:19.884853	24
4897	396	f	\N	2025-11-12 00:11:19.884853	24
4898	397	f	\N	2025-11-12 00:11:19.884853	24
4899	398	f	\N	2025-11-12 00:11:19.884853	24
4900	399	f	\N	2025-11-12 00:11:19.884853	24
4901	400	f	\N	2025-11-12 00:11:19.884853	24
4902	401	f	\N	2025-11-12 00:11:19.884853	24
4903	402	f	\N	2025-11-12 00:11:19.884853	24
4904	403	f	\N	2025-11-12 00:11:19.884853	24
4905	404	f	\N	2025-11-12 00:11:19.884853	24
4906	405	f	\N	2025-11-12 00:11:19.884853	24
4907	406	f	\N	2025-11-12 00:11:19.884853	24
4908	407	f	\N	2025-11-12 00:11:19.884853	24
4909	408	f	\N	2025-11-12 00:11:19.884853	24
4910	409	f	\N	2025-11-12 00:11:19.884853	24
4911	410	f	\N	2025-11-12 00:11:19.884853	24
4912	411	f	\N	2025-11-12 00:11:19.884853	24
4913	412	f	\N	2025-11-12 00:11:19.884853	24
4914	413	f	\N	2025-11-12 00:11:19.884853	24
4915	414	f	\N	2025-11-12 00:11:19.884853	24
4916	415	f	\N	2025-11-12 00:11:19.884853	24
4917	416	f	\N	2025-11-12 00:11:19.884853	24
4918	417	f	\N	2025-11-12 00:11:19.884853	24
4919	418	f	\N	2025-11-12 00:11:19.884853	24
4920	419	f	\N	2025-11-12 00:11:19.884853	24
4921	420	f	\N	2025-11-12 00:11:19.884853	24
4922	421	f	\N	2025-11-12 00:11:19.884853	24
4923	422	f	\N	2025-11-12 00:11:19.884853	24
4924	423	f	\N	2025-11-12 00:11:19.884853	24
4925	424	f	\N	2025-11-12 00:11:19.884853	24
4926	425	f	\N	2025-11-12 00:11:19.884853	24
4927	426	f	\N	2025-11-12 00:11:19.884853	24
4928	427	f	\N	2025-11-12 00:11:19.884853	24
4929	428	f	\N	2025-11-12 00:11:19.884853	24
4930	429	f	\N	2025-11-12 00:11:19.884853	24
4931	430	f	\N	2025-11-12 00:11:19.884853	24
4932	431	f	\N	2025-11-12 00:11:19.884853	24
4933	432	f	\N	2025-11-12 00:11:19.884853	24
4934	433	f	\N	2025-11-12 00:11:19.884853	24
4935	434	f	\N	2025-11-12 00:11:19.884853	24
4936	435	f	\N	2025-11-12 00:11:19.884853	24
4937	436	f	\N	2025-11-12 00:11:19.884853	24
4938	437	f	\N	2025-11-12 00:11:19.884853	24
4939	438	f	\N	2025-11-12 00:11:19.884853	24
4940	439	f	\N	2025-11-12 00:11:19.884853	24
4941	440	f	\N	2025-11-12 00:11:19.884853	24
4942	441	f	\N	2025-11-12 00:11:19.884853	24
4943	442	f	\N	2025-11-12 00:11:19.884853	24
4944	443	f	\N	2025-11-12 00:11:19.884853	24
4945	444	f	\N	2025-11-12 00:11:19.884853	24
4946	445	f	\N	2025-11-12 00:11:19.884853	24
4947	446	f	\N	2025-11-12 00:11:19.884853	24
4948	447	f	\N	2025-11-12 00:11:19.884853	24
4949	448	f	\N	2025-11-12 00:11:19.884853	24
4950	449	f	\N	2025-11-12 00:11:19.884853	24
4951	450	f	\N	2025-11-12 00:11:19.884853	24
4952	451	f	\N	2025-11-12 00:11:19.884853	24
4953	452	f	\N	2025-11-12 00:11:19.884853	24
4954	453	f	\N	2025-11-12 00:11:19.884853	24
4955	454	f	\N	2025-11-12 00:11:19.884853	24
4956	455	f	\N	2025-11-12 00:11:19.884853	24
4957	456	f	\N	2025-11-12 00:11:19.884853	24
4958	457	f	\N	2025-11-12 00:11:19.884853	24
4959	458	f	\N	2025-11-12 00:11:19.884853	24
4960	459	f	\N	2025-11-12 00:11:19.884853	24
4961	460	f	\N	2025-11-12 00:11:19.884853	24
4962	461	f	\N	2025-11-12 00:11:19.884853	24
4963	462	f	\N	2025-11-12 00:11:19.884853	24
4964	463	f	\N	2025-11-12 00:11:19.884853	24
4965	464	f	\N	2025-11-12 00:11:19.884853	24
4966	465	f	\N	2025-11-12 00:11:19.884853	24
4967	466	f	\N	2025-11-12 00:11:19.884853	24
4968	467	f	\N	2025-11-12 00:11:19.884853	24
4969	468	f	\N	2025-11-12 00:11:19.884853	24
4970	469	f	\N	2025-11-12 00:11:19.884853	24
4971	470	f	\N	2025-11-12 00:11:19.884853	24
4972	471	f	\N	2025-11-12 00:11:19.884853	24
4973	472	f	\N	2025-11-12 00:11:19.884853	24
4974	473	f	\N	2025-11-12 00:11:19.884853	24
4975	474	f	\N	2025-11-12 00:11:19.884853	24
4976	475	f	\N	2025-11-12 00:11:19.884853	24
4977	476	f	\N	2025-11-12 00:11:19.884853	24
4978	477	f	\N	2025-11-12 00:11:19.884853	24
4979	478	f	\N	2025-11-12 00:11:19.884853	24
4980	479	f	\N	2025-11-12 00:11:19.884853	24
4981	480	f	\N	2025-11-12 00:11:19.884853	24
4982	481	f	\N	2025-11-12 00:11:19.884853	24
4983	482	f	\N	2025-11-12 00:11:19.884853	24
4984	483	f	\N	2025-11-12 00:11:19.884853	24
4985	484	f	\N	2025-11-12 00:11:19.884853	24
4986	485	f	\N	2025-11-12 00:11:19.884853	24
4987	486	f	\N	2025-11-12 00:11:19.884853	24
4988	487	f	\N	2025-11-12 00:11:19.884853	24
4989	488	f	\N	2025-11-12 00:11:19.884853	24
4990	489	f	\N	2025-11-12 00:11:19.884853	24
4991	490	f	\N	2025-11-12 00:11:19.884853	24
4992	491	f	\N	2025-11-12 00:11:19.884853	24
4993	492	f	\N	2025-11-12 00:11:19.884853	24
4994	493	f	\N	2025-11-12 00:11:19.884853	24
4995	494	f	\N	2025-11-12 00:11:19.884853	24
4996	495	f	\N	2025-11-12 00:11:19.884853	24
4997	496	f	\N	2025-11-12 00:11:19.884853	24
4998	497	f	\N	2025-11-12 00:11:19.884853	24
4999	498	f	\N	2025-11-12 00:11:19.884853	24
5000	499	f	\N	2025-11-12 00:11:19.884853	24
5001	500	f	\N	2025-11-12 00:11:19.884853	24
5002	1	f	\N	2025-11-19 13:05:30.587167	25
5003	2	f	\N	2025-11-19 13:05:30.587167	25
5004	3	f	\N	2025-11-19 13:05:30.587167	25
5005	4	f	\N	2025-11-19 13:05:30.587167	25
5006	5	f	\N	2025-11-19 13:05:30.587167	25
5007	6	f	\N	2025-11-19 13:05:30.587167	25
5008	7	f	\N	2025-11-19 13:05:30.587167	25
5009	8	f	\N	2025-11-19 13:05:30.587167	25
5010	9	f	\N	2025-11-19 13:05:30.587167	25
5011	10	f	\N	2025-11-19 13:05:30.587167	25
5012	11	f	\N	2025-11-19 13:05:30.587167	25
5013	12	f	\N	2025-11-19 13:05:30.587167	25
5014	13	f	\N	2025-11-19 13:05:30.587167	25
5015	14	f	\N	2025-11-19 13:05:30.587167	25
5016	15	f	\N	2025-11-19 13:05:30.587167	25
5017	16	f	\N	2025-11-19 13:05:30.587167	25
5018	17	f	\N	2025-11-19 13:05:30.587167	25
5019	18	f	\N	2025-11-19 13:05:30.587167	25
5020	19	f	\N	2025-11-19 13:05:30.587167	25
5021	20	f	\N	2025-11-19 13:05:30.587167	25
5022	21	f	\N	2025-11-19 13:05:30.587167	25
5023	22	f	\N	2025-11-19 13:05:30.587167	25
5024	23	f	\N	2025-11-19 13:05:30.587167	25
5025	24	f	\N	2025-11-19 13:05:30.587167	25
5026	25	f	\N	2025-11-19 13:05:30.587167	25
5027	26	f	\N	2025-11-19 13:05:30.587167	25
5028	27	f	\N	2025-11-19 13:05:30.587167	25
5029	28	f	\N	2025-11-19 13:05:30.587167	25
5030	29	f	\N	2025-11-19 13:05:30.587167	25
5031	30	f	\N	2025-11-19 13:05:30.587167	25
5032	31	f	\N	2025-11-19 13:05:30.587167	25
5033	32	f	\N	2025-11-19 13:05:30.587167	25
5034	33	f	\N	2025-11-19 13:05:30.587167	25
5035	34	f	\N	2025-11-19 13:05:30.587167	25
5036	35	f	\N	2025-11-19 13:05:30.587167	25
5037	36	f	\N	2025-11-19 13:05:30.587167	25
5038	37	f	\N	2025-11-19 13:05:30.587167	25
5039	38	f	\N	2025-11-19 13:05:30.587167	25
5040	39	f	\N	2025-11-19 13:05:30.587167	25
5041	40	f	\N	2025-11-19 13:05:30.587167	25
5042	41	f	\N	2025-11-19 13:05:30.587167	25
5043	42	f	\N	2025-11-19 13:05:30.587167	25
5044	43	f	\N	2025-11-19 13:05:30.587167	25
5045	44	f	\N	2025-11-19 13:05:30.587167	25
5046	45	f	\N	2025-11-19 13:05:30.587167	25
5047	46	f	\N	2025-11-19 13:05:30.587167	25
5048	47	f	\N	2025-11-19 13:05:30.587167	25
5049	48	f	\N	2025-11-19 13:05:30.587167	25
5050	49	f	\N	2025-11-19 13:05:30.587167	25
5051	50	f	\N	2025-11-19 13:05:30.587167	25
5052	51	f	\N	2025-11-19 13:05:30.587167	25
5053	52	f	\N	2025-11-19 13:05:30.587167	25
5054	53	f	\N	2025-11-19 13:05:30.587167	25
5055	54	f	\N	2025-11-19 13:05:30.587167	25
5056	55	f	\N	2025-11-19 13:05:30.587167	25
5057	56	f	\N	2025-11-19 13:05:30.587167	25
5058	57	f	\N	2025-11-19 13:05:30.587167	25
5059	58	f	\N	2025-11-19 13:05:30.587167	25
5060	59	f	\N	2025-11-19 13:05:30.587167	25
5061	60	f	\N	2025-11-19 13:05:30.587167	25
5062	61	f	\N	2025-11-19 13:05:30.587167	25
5063	62	f	\N	2025-11-19 13:05:30.587167	25
5064	63	f	\N	2025-11-19 13:05:30.587167	25
5065	64	f	\N	2025-11-19 13:05:30.587167	25
5066	65	f	\N	2025-11-19 13:05:30.587167	25
5067	66	f	\N	2025-11-19 13:05:30.587167	25
5068	67	f	\N	2025-11-19 13:05:30.587167	25
5069	68	f	\N	2025-11-19 13:05:30.587167	25
5070	69	f	\N	2025-11-19 13:05:30.587167	25
5071	70	f	\N	2025-11-19 13:05:30.587167	25
5072	71	f	\N	2025-11-19 13:05:30.587167	25
5073	72	f	\N	2025-11-19 13:05:30.587167	25
5074	73	f	\N	2025-11-19 13:05:30.587167	25
5075	74	f	\N	2025-11-19 13:05:30.587167	25
5076	75	f	\N	2025-11-19 13:05:30.587167	25
5077	76	f	\N	2025-11-19 13:05:30.587167	25
5078	77	f	\N	2025-11-19 13:05:30.587167	25
5079	78	f	\N	2025-11-19 13:05:30.587167	25
5080	79	f	\N	2025-11-19 13:05:30.587167	25
5081	80	f	\N	2025-11-19 13:05:30.587167	25
5082	81	f	\N	2025-11-19 13:05:30.587167	25
5083	82	f	\N	2025-11-19 13:05:30.587167	25
5084	83	f	\N	2025-11-19 13:05:30.587167	25
5085	84	f	\N	2025-11-19 13:05:30.587167	25
5086	85	f	\N	2025-11-19 13:05:30.587167	25
5087	86	f	\N	2025-11-19 13:05:30.587167	25
5088	87	f	\N	2025-11-19 13:05:30.587167	25
5089	88	f	\N	2025-11-19 13:05:30.587167	25
5090	89	f	\N	2025-11-19 13:05:30.587167	25
5091	90	f	\N	2025-11-19 13:05:30.587167	25
5092	91	f	\N	2025-11-19 13:05:30.587167	25
5093	92	f	\N	2025-11-19 13:05:30.587167	25
5094	93	f	\N	2025-11-19 13:05:30.587167	25
5095	94	f	\N	2025-11-19 13:05:30.587167	25
5096	95	f	\N	2025-11-19 13:05:30.587167	25
5097	96	f	\N	2025-11-19 13:05:30.587167	25
5098	97	f	\N	2025-11-19 13:05:30.587167	25
5099	98	f	\N	2025-11-19 13:05:30.587167	25
5100	99	f	\N	2025-11-19 13:05:30.587167	25
5101	100	f	\N	2025-11-19 13:05:30.587167	25
5102	101	f	\N	2025-11-19 13:05:30.587167	25
5103	102	f	\N	2025-11-19 13:05:30.587167	25
5104	103	f	\N	2025-11-19 13:05:30.587167	25
5105	104	f	\N	2025-11-19 13:05:30.587167	25
5106	105	f	\N	2025-11-19 13:05:30.587167	25
5107	106	f	\N	2025-11-19 13:05:30.587167	25
5108	107	f	\N	2025-11-19 13:05:30.587167	25
5109	108	f	\N	2025-11-19 13:05:30.587167	25
5110	109	f	\N	2025-11-19 13:05:30.587167	25
5111	110	f	\N	2025-11-19 13:05:30.587167	25
5112	111	f	\N	2025-11-19 13:05:30.587167	25
5113	112	f	\N	2025-11-19 13:05:30.587167	25
5114	113	f	\N	2025-11-19 13:05:30.587167	25
5115	114	f	\N	2025-11-19 13:05:30.587167	25
5116	115	f	\N	2025-11-19 13:05:30.587167	25
5117	116	f	\N	2025-11-19 13:05:30.587167	25
5118	117	f	\N	2025-11-19 13:05:30.587167	25
5119	118	f	\N	2025-11-19 13:05:30.587167	25
5120	119	f	\N	2025-11-19 13:05:30.587167	25
5121	120	f	\N	2025-11-19 13:05:30.587167	25
5122	121	f	\N	2025-11-19 13:05:30.587167	25
5123	122	f	\N	2025-11-19 13:05:30.587167	25
5124	123	f	\N	2025-11-19 13:05:30.587167	25
5125	124	f	\N	2025-11-19 13:05:30.587167	25
5126	125	f	\N	2025-11-19 13:05:30.587167	25
5127	126	f	\N	2025-11-19 13:05:30.587167	25
5128	127	f	\N	2025-11-19 13:05:30.587167	25
5129	128	f	\N	2025-11-19 13:05:30.587167	25
5130	129	f	\N	2025-11-19 13:05:30.587167	25
5131	130	f	\N	2025-11-19 13:05:30.587167	25
5132	131	f	\N	2025-11-19 13:05:30.587167	25
5133	132	f	\N	2025-11-19 13:05:30.587167	25
5134	133	f	\N	2025-11-19 13:05:30.587167	25
5135	134	f	\N	2025-11-19 13:05:30.587167	25
5136	135	f	\N	2025-11-19 13:05:30.587167	25
5137	136	f	\N	2025-11-19 13:05:30.587167	25
5138	137	f	\N	2025-11-19 13:05:30.587167	25
5139	138	f	\N	2025-11-19 13:05:30.587167	25
5140	139	f	\N	2025-11-19 13:05:30.587167	25
5141	140	f	\N	2025-11-19 13:05:30.587167	25
5142	141	f	\N	2025-11-19 13:05:30.587167	25
5143	142	f	\N	2025-11-19 13:05:30.587167	25
5144	143	f	\N	2025-11-19 13:05:30.587167	25
5145	144	f	\N	2025-11-19 13:05:30.587167	25
5146	145	f	\N	2025-11-19 13:05:30.587167	25
5147	146	f	\N	2025-11-19 13:05:30.587167	25
5148	147	f	\N	2025-11-19 13:05:30.587167	25
5149	148	f	\N	2025-11-19 13:05:30.587167	25
5150	149	f	\N	2025-11-19 13:05:30.587167	25
5151	150	f	\N	2025-11-19 13:05:30.587167	25
5152	151	f	\N	2025-11-19 13:05:30.587167	25
5153	152	f	\N	2025-11-19 13:05:30.587167	25
5154	153	f	\N	2025-11-19 13:05:30.587167	25
5155	154	f	\N	2025-11-19 13:05:30.587167	25
5156	155	f	\N	2025-11-19 13:05:30.587167	25
5157	156	f	\N	2025-11-19 13:05:30.587167	25
5158	157	f	\N	2025-11-19 13:05:30.587167	25
5159	158	f	\N	2025-11-19 13:05:30.587167	25
5160	159	f	\N	2025-11-19 13:05:30.587167	25
5161	160	f	\N	2025-11-19 13:05:30.587167	25
5162	161	f	\N	2025-11-19 13:05:30.587167	25
5163	162	f	\N	2025-11-19 13:05:30.587167	25
5164	163	f	\N	2025-11-19 13:05:30.587167	25
5165	164	f	\N	2025-11-19 13:05:30.587167	25
5166	165	f	\N	2025-11-19 13:05:30.587167	25
5167	166	f	\N	2025-11-19 13:05:30.587167	25
5168	167	f	\N	2025-11-19 13:05:30.587167	25
5169	168	f	\N	2025-11-19 13:05:30.587167	25
5170	169	f	\N	2025-11-19 13:05:30.587167	25
5171	170	f	\N	2025-11-19 13:05:30.587167	25
5172	171	f	\N	2025-11-19 13:05:30.587167	25
5173	172	f	\N	2025-11-19 13:05:30.587167	25
5174	173	f	\N	2025-11-19 13:05:30.587167	25
5175	174	f	\N	2025-11-19 13:05:30.587167	25
5176	175	f	\N	2025-11-19 13:05:30.587167	25
5177	176	f	\N	2025-11-19 13:05:30.587167	25
5178	177	f	\N	2025-11-19 13:05:30.587167	25
5179	178	f	\N	2025-11-19 13:05:30.587167	25
5180	179	f	\N	2025-11-19 13:05:30.587167	25
5181	180	f	\N	2025-11-19 13:05:30.587167	25
5182	181	f	\N	2025-11-19 13:05:30.587167	25
5183	182	f	\N	2025-11-19 13:05:30.587167	25
5184	183	f	\N	2025-11-19 13:05:30.587167	25
5185	184	f	\N	2025-11-19 13:05:30.587167	25
5186	185	f	\N	2025-11-19 13:05:30.587167	25
5187	186	f	\N	2025-11-19 13:05:30.587167	25
5188	187	f	\N	2025-11-19 13:05:30.587167	25
5189	188	f	\N	2025-11-19 13:05:30.587167	25
5190	189	f	\N	2025-11-19 13:05:30.587167	25
5191	190	f	\N	2025-11-19 13:05:30.587167	25
5192	191	f	\N	2025-11-19 13:05:30.587167	25
5193	192	f	\N	2025-11-19 13:05:30.587167	25
5194	193	f	\N	2025-11-19 13:05:30.587167	25
5195	194	f	\N	2025-11-19 13:05:30.587167	25
5196	195	f	\N	2025-11-19 13:05:30.587167	25
5197	196	f	\N	2025-11-19 13:05:30.587167	25
5198	197	f	\N	2025-11-19 13:05:30.587167	25
5199	198	f	\N	2025-11-19 13:05:30.587167	25
5200	199	f	\N	2025-11-19 13:05:30.587167	25
5201	200	f	\N	2025-11-19 13:05:30.587167	25
5202	201	f	\N	2025-11-19 13:05:30.587167	25
5203	202	f	\N	2025-11-19 13:05:30.587167	25
5204	203	f	\N	2025-11-19 13:05:30.587167	25
5205	204	f	\N	2025-11-19 13:05:30.587167	25
5206	205	f	\N	2025-11-19 13:05:30.587167	25
5207	206	f	\N	2025-11-19 13:05:30.587167	25
5208	207	f	\N	2025-11-19 13:05:30.587167	25
5209	208	f	\N	2025-11-19 13:05:30.587167	25
5210	209	f	\N	2025-11-19 13:05:30.587167	25
5211	210	f	\N	2025-11-19 13:05:30.587167	25
5212	211	f	\N	2025-11-19 13:05:30.587167	25
5213	212	f	\N	2025-11-19 13:05:30.587167	25
5214	213	f	\N	2025-11-19 13:05:30.587167	25
5215	214	f	\N	2025-11-19 13:05:30.587167	25
5216	215	f	\N	2025-11-19 13:05:30.587167	25
5217	216	f	\N	2025-11-19 13:05:30.587167	25
5218	217	f	\N	2025-11-19 13:05:30.587167	25
5219	218	f	\N	2025-11-19 13:05:30.587167	25
5220	219	f	\N	2025-11-19 13:05:30.587167	25
5221	220	f	\N	2025-11-19 13:05:30.587167	25
5222	221	f	\N	2025-11-19 13:05:30.587167	25
5223	222	f	\N	2025-11-19 13:05:30.587167	25
5224	223	f	\N	2025-11-19 13:05:30.587167	25
5225	224	f	\N	2025-11-19 13:05:30.587167	25
5226	225	f	\N	2025-11-19 13:05:30.587167	25
5227	226	f	\N	2025-11-19 13:05:30.587167	25
5228	227	f	\N	2025-11-19 13:05:30.587167	25
5229	228	f	\N	2025-11-19 13:05:30.587167	25
5230	229	f	\N	2025-11-19 13:05:30.587167	25
5231	230	f	\N	2025-11-19 13:05:30.587167	25
5232	231	f	\N	2025-11-19 13:05:30.587167	25
5233	232	f	\N	2025-11-19 13:05:30.587167	25
5234	233	f	\N	2025-11-19 13:05:30.587167	25
5235	234	f	\N	2025-11-19 13:05:30.587167	25
5236	235	f	\N	2025-11-19 13:05:30.587167	25
5237	236	f	\N	2025-11-19 13:05:30.587167	25
5238	237	f	\N	2025-11-19 13:05:30.587167	25
5239	238	f	\N	2025-11-19 13:05:30.587167	25
5240	239	f	\N	2025-11-19 13:05:30.587167	25
5241	240	f	\N	2025-11-19 13:05:30.587167	25
5242	241	f	\N	2025-11-19 13:05:30.587167	25
5243	242	f	\N	2025-11-19 13:05:30.587167	25
5244	243	f	\N	2025-11-19 13:05:30.587167	25
5245	244	f	\N	2025-11-19 13:05:30.587167	25
5246	245	f	\N	2025-11-19 13:05:30.587167	25
5247	246	f	\N	2025-11-19 13:05:30.587167	25
5248	247	f	\N	2025-11-19 13:05:30.587167	25
5249	248	f	\N	2025-11-19 13:05:30.587167	25
5250	249	f	\N	2025-11-19 13:05:30.587167	25
5251	250	f	\N	2025-11-19 13:05:30.587167	25
5252	251	f	\N	2025-11-19 13:05:30.587167	25
5253	252	f	\N	2025-11-19 13:05:30.587167	25
5254	253	f	\N	2025-11-19 13:05:30.587167	25
5255	254	f	\N	2025-11-19 13:05:30.587167	25
5256	255	f	\N	2025-11-19 13:05:30.587167	25
5257	256	f	\N	2025-11-19 13:05:30.587167	25
5258	257	f	\N	2025-11-19 13:05:30.587167	25
5259	258	f	\N	2025-11-19 13:05:30.587167	25
5260	259	f	\N	2025-11-19 13:05:30.587167	25
5261	260	f	\N	2025-11-19 13:05:30.587167	25
5262	261	f	\N	2025-11-19 13:05:30.587167	25
5263	262	f	\N	2025-11-19 13:05:30.587167	25
5264	263	f	\N	2025-11-19 13:05:30.587167	25
5265	264	f	\N	2025-11-19 13:05:30.587167	25
5266	265	f	\N	2025-11-19 13:05:30.587167	25
5267	266	f	\N	2025-11-19 13:05:30.587167	25
5268	267	f	\N	2025-11-19 13:05:30.587167	25
5269	268	f	\N	2025-11-19 13:05:30.587167	25
5270	269	f	\N	2025-11-19 13:05:30.587167	25
5271	270	f	\N	2025-11-19 13:05:30.587167	25
5272	271	f	\N	2025-11-19 13:05:30.587167	25
5273	272	f	\N	2025-11-19 13:05:30.587167	25
5274	273	f	\N	2025-11-19 13:05:30.587167	25
5275	274	f	\N	2025-11-19 13:05:30.587167	25
5276	275	f	\N	2025-11-19 13:05:30.587167	25
5277	276	f	\N	2025-11-19 13:05:30.587167	25
5278	277	f	\N	2025-11-19 13:05:30.587167	25
5279	278	f	\N	2025-11-19 13:05:30.587167	25
5280	279	f	\N	2025-11-19 13:05:30.587167	25
5281	280	f	\N	2025-11-19 13:05:30.587167	25
5282	281	f	\N	2025-11-19 13:05:30.587167	25
5283	282	f	\N	2025-11-19 13:05:30.587167	25
5284	283	f	\N	2025-11-19 13:05:30.587167	25
5285	284	f	\N	2025-11-19 13:05:30.587167	25
5286	285	f	\N	2025-11-19 13:05:30.587167	25
5287	286	f	\N	2025-11-19 13:05:30.587167	25
5288	287	f	\N	2025-11-19 13:05:30.587167	25
5289	288	f	\N	2025-11-19 13:05:30.587167	25
5290	289	f	\N	2025-11-19 13:05:30.587167	25
5291	290	f	\N	2025-11-19 13:05:30.587167	25
5292	291	f	\N	2025-11-19 13:05:30.587167	25
5293	292	f	\N	2025-11-19 13:05:30.587167	25
5294	293	f	\N	2025-11-19 13:05:30.587167	25
5295	294	f	\N	2025-11-19 13:05:30.587167	25
5296	295	f	\N	2025-11-19 13:05:30.587167	25
5297	296	f	\N	2025-11-19 13:05:30.587167	25
5298	297	f	\N	2025-11-19 13:05:30.587167	25
5299	298	f	\N	2025-11-19 13:05:30.587167	25
5300	299	f	\N	2025-11-19 13:05:30.587167	25
5301	300	f	\N	2025-11-19 13:05:30.587167	25
5302	301	f	\N	2025-11-19 13:05:30.587167	25
5303	302	f	\N	2025-11-19 13:05:30.587167	25
5304	303	f	\N	2025-11-19 13:05:30.587167	25
5305	304	f	\N	2025-11-19 13:05:30.587167	25
5306	305	f	\N	2025-11-19 13:05:30.587167	25
5307	306	f	\N	2025-11-19 13:05:30.587167	25
5308	307	f	\N	2025-11-19 13:05:30.587167	25
5309	308	f	\N	2025-11-19 13:05:30.587167	25
5310	309	f	\N	2025-11-19 13:05:30.587167	25
5311	310	f	\N	2025-11-19 13:05:30.587167	25
5312	311	f	\N	2025-11-19 13:05:30.587167	25
5313	312	f	\N	2025-11-19 13:05:30.587167	25
5314	313	f	\N	2025-11-19 13:05:30.587167	25
5315	314	f	\N	2025-11-19 13:05:30.587167	25
5316	315	f	\N	2025-11-19 13:05:30.587167	25
5317	316	f	\N	2025-11-19 13:05:30.587167	25
5318	317	f	\N	2025-11-19 13:05:30.587167	25
5319	318	f	\N	2025-11-19 13:05:30.587167	25
5320	319	f	\N	2025-11-19 13:05:30.587167	25
5321	320	f	\N	2025-11-19 13:05:30.587167	25
5322	321	f	\N	2025-11-19 13:05:30.587167	25
5323	322	f	\N	2025-11-19 13:05:30.587167	25
5324	323	f	\N	2025-11-19 13:05:30.587167	25
5325	324	f	\N	2025-11-19 13:05:30.587167	25
5326	325	f	\N	2025-11-19 13:05:30.587167	25
5327	326	f	\N	2025-11-19 13:05:30.587167	25
5328	327	f	\N	2025-11-19 13:05:30.587167	25
5329	328	f	\N	2025-11-19 13:05:30.587167	25
5330	329	f	\N	2025-11-19 13:05:30.587167	25
5331	330	f	\N	2025-11-19 13:05:30.587167	25
5332	331	f	\N	2025-11-19 13:05:30.587167	25
5333	332	f	\N	2025-11-19 13:05:30.587167	25
5334	333	f	\N	2025-11-19 13:05:30.587167	25
5335	334	f	\N	2025-11-19 13:05:30.587167	25
5336	335	f	\N	2025-11-19 13:05:30.587167	25
5337	336	f	\N	2025-11-19 13:05:30.587167	25
5338	337	f	\N	2025-11-19 13:05:30.587167	25
5339	338	f	\N	2025-11-19 13:05:30.587167	25
5340	339	f	\N	2025-11-19 13:05:30.587167	25
5341	340	f	\N	2025-11-19 13:05:30.587167	25
5342	341	f	\N	2025-11-19 13:05:30.587167	25
5343	342	f	\N	2025-11-19 13:05:30.587167	25
5344	343	f	\N	2025-11-19 13:05:30.587167	25
5345	344	f	\N	2025-11-19 13:05:30.587167	25
5346	345	f	\N	2025-11-19 13:05:30.587167	25
5347	346	f	\N	2025-11-19 13:05:30.587167	25
5348	347	f	\N	2025-11-19 13:05:30.587167	25
5349	348	f	\N	2025-11-19 13:05:30.587167	25
5350	349	f	\N	2025-11-19 13:05:30.587167	25
5351	350	f	\N	2025-11-19 13:05:30.587167	25
5352	351	f	\N	2025-11-19 13:05:30.587167	25
5353	352	f	\N	2025-11-19 13:05:30.587167	25
5354	353	f	\N	2025-11-19 13:05:30.587167	25
5355	354	f	\N	2025-11-19 13:05:30.587167	25
5356	355	f	\N	2025-11-19 13:05:30.587167	25
5357	356	f	\N	2025-11-19 13:05:30.587167	25
5358	357	f	\N	2025-11-19 13:05:30.587167	25
5359	358	f	\N	2025-11-19 13:05:30.587167	25
5360	359	f	\N	2025-11-19 13:05:30.587167	25
5361	360	f	\N	2025-11-19 13:05:30.587167	25
5362	361	f	\N	2025-11-19 13:05:30.587167	25
5363	362	f	\N	2025-11-19 13:05:30.587167	25
5364	363	f	\N	2025-11-19 13:05:30.587167	25
5365	364	f	\N	2025-11-19 13:05:30.587167	25
5366	365	f	\N	2025-11-19 13:05:30.587167	25
5367	366	f	\N	2025-11-19 13:05:30.587167	25
5368	367	f	\N	2025-11-19 13:05:30.587167	25
5369	368	f	\N	2025-11-19 13:05:30.587167	25
5370	369	f	\N	2025-11-19 13:05:30.587167	25
5371	370	f	\N	2025-11-19 13:05:30.587167	25
5372	371	f	\N	2025-11-19 13:05:30.587167	25
5373	372	f	\N	2025-11-19 13:05:30.587167	25
5374	373	f	\N	2025-11-19 13:05:30.587167	25
5375	374	f	\N	2025-11-19 13:05:30.587167	25
5376	375	f	\N	2025-11-19 13:05:30.587167	25
5377	376	f	\N	2025-11-19 13:05:30.587167	25
5378	377	f	\N	2025-11-19 13:05:30.587167	25
5379	378	f	\N	2025-11-19 13:05:30.587167	25
5380	379	f	\N	2025-11-19 13:05:30.587167	25
5381	380	f	\N	2025-11-19 13:05:30.587167	25
5382	381	f	\N	2025-11-19 13:05:30.587167	25
5383	382	f	\N	2025-11-19 13:05:30.587167	25
5384	383	f	\N	2025-11-19 13:05:30.587167	25
5385	384	f	\N	2025-11-19 13:05:30.587167	25
5386	385	f	\N	2025-11-19 13:05:30.587167	25
5387	386	f	\N	2025-11-19 13:05:30.587167	25
5388	387	f	\N	2025-11-19 13:05:30.587167	25
5389	388	f	\N	2025-11-19 13:05:30.587167	25
5390	389	f	\N	2025-11-19 13:05:30.587167	25
5391	390	f	\N	2025-11-19 13:05:30.587167	25
5392	391	f	\N	2025-11-19 13:05:30.587167	25
5393	392	f	\N	2025-11-19 13:05:30.587167	25
5394	393	f	\N	2025-11-19 13:05:30.587167	25
5395	394	f	\N	2025-11-19 13:05:30.587167	25
5396	395	f	\N	2025-11-19 13:05:30.587167	25
5397	396	f	\N	2025-11-19 13:05:30.587167	25
5398	397	f	\N	2025-11-19 13:05:30.587167	25
5399	398	f	\N	2025-11-19 13:05:30.587167	25
5400	399	f	\N	2025-11-19 13:05:30.587167	25
5401	400	f	\N	2025-11-19 13:05:30.587167	25
5402	401	f	\N	2025-11-19 13:05:30.587167	25
5403	402	f	\N	2025-11-19 13:05:30.587167	25
5404	403	f	\N	2025-11-19 13:05:30.587167	25
5405	404	f	\N	2025-11-19 13:05:30.587167	25
5406	405	f	\N	2025-11-19 13:05:30.587167	25
5407	406	f	\N	2025-11-19 13:05:30.587167	25
5408	407	f	\N	2025-11-19 13:05:30.587167	25
5409	408	f	\N	2025-11-19 13:05:30.587167	25
5410	409	f	\N	2025-11-19 13:05:30.587167	25
5411	410	f	\N	2025-11-19 13:05:30.587167	25
5412	411	f	\N	2025-11-19 13:05:30.587167	25
5413	412	f	\N	2025-11-19 13:05:30.587167	25
5414	413	f	\N	2025-11-19 13:05:30.587167	25
5415	414	f	\N	2025-11-19 13:05:30.587167	25
5416	415	f	\N	2025-11-19 13:05:30.587167	25
5417	416	f	\N	2025-11-19 13:05:30.587167	25
5418	417	f	\N	2025-11-19 13:05:30.587167	25
5419	418	f	\N	2025-11-19 13:05:30.587167	25
5420	419	f	\N	2025-11-19 13:05:30.587167	25
5421	420	f	\N	2025-11-19 13:05:30.587167	25
5422	421	f	\N	2025-11-19 13:05:30.587167	25
5423	422	f	\N	2025-11-19 13:05:30.587167	25
5424	423	f	\N	2025-11-19 13:05:30.587167	25
5425	424	f	\N	2025-11-19 13:05:30.587167	25
5426	425	f	\N	2025-11-19 13:05:30.587167	25
5427	426	f	\N	2025-11-19 13:05:30.587167	25
5428	427	f	\N	2025-11-19 13:05:30.587167	25
5429	428	f	\N	2025-11-19 13:05:30.587167	25
5430	429	f	\N	2025-11-19 13:05:30.587167	25
5431	430	f	\N	2025-11-19 13:05:30.587167	25
5432	431	f	\N	2025-11-19 13:05:30.587167	25
5433	432	f	\N	2025-11-19 13:05:30.587167	25
5434	433	f	\N	2025-11-19 13:05:30.587167	25
5435	434	f	\N	2025-11-19 13:05:30.587167	25
5436	435	f	\N	2025-11-19 13:05:30.587167	25
5437	436	f	\N	2025-11-19 13:05:30.587167	25
5438	437	f	\N	2025-11-19 13:05:30.587167	25
5439	438	f	\N	2025-11-19 13:05:30.587167	25
5440	439	f	\N	2025-11-19 13:05:30.587167	25
5441	440	f	\N	2025-11-19 13:05:30.587167	25
5442	441	f	\N	2025-11-19 13:05:30.587167	25
5443	442	f	\N	2025-11-19 13:05:30.587167	25
5444	443	f	\N	2025-11-19 13:05:30.587167	25
5445	444	f	\N	2025-11-19 13:05:30.587167	25
5446	445	f	\N	2025-11-19 13:05:30.587167	25
5447	446	f	\N	2025-11-19 13:05:30.587167	25
5448	447	f	\N	2025-11-19 13:05:30.587167	25
5449	448	f	\N	2025-11-19 13:05:30.587167	25
5450	449	f	\N	2025-11-19 13:05:30.587167	25
5451	450	f	\N	2025-11-19 13:05:30.587167	25
5452	451	f	\N	2025-11-19 13:05:30.587167	25
5453	452	f	\N	2025-11-19 13:05:30.587167	25
5454	453	f	\N	2025-11-19 13:05:30.587167	25
5455	454	f	\N	2025-11-19 13:05:30.587167	25
5456	455	f	\N	2025-11-19 13:05:30.587167	25
5457	456	f	\N	2025-11-19 13:05:30.587167	25
5458	457	f	\N	2025-11-19 13:05:30.587167	25
5459	458	f	\N	2025-11-19 13:05:30.587167	25
5460	459	f	\N	2025-11-19 13:05:30.587167	25
5461	460	f	\N	2025-11-19 13:05:30.587167	25
5462	461	f	\N	2025-11-19 13:05:30.587167	25
5463	462	f	\N	2025-11-19 13:05:30.587167	25
5464	463	f	\N	2025-11-19 13:05:30.587167	25
5465	464	f	\N	2025-11-19 13:05:30.587167	25
5466	465	f	\N	2025-11-19 13:05:30.587167	25
5467	466	f	\N	2025-11-19 13:05:30.587167	25
5468	467	f	\N	2025-11-19 13:05:30.587167	25
5469	468	f	\N	2025-11-19 13:05:30.587167	25
5470	469	f	\N	2025-11-19 13:05:30.587167	25
5471	470	f	\N	2025-11-19 13:05:30.587167	25
5472	471	f	\N	2025-11-19 13:05:30.587167	25
5473	472	f	\N	2025-11-19 13:05:30.587167	25
5474	473	f	\N	2025-11-19 13:05:30.587167	25
5475	474	f	\N	2025-11-19 13:05:30.587167	25
5476	475	f	\N	2025-11-19 13:05:30.587167	25
5477	476	f	\N	2025-11-19 13:05:30.587167	25
5478	477	f	\N	2025-11-19 13:05:30.587167	25
5479	478	f	\N	2025-11-19 13:05:30.587167	25
5480	479	f	\N	2025-11-19 13:05:30.587167	25
5481	480	f	\N	2025-11-19 13:05:30.587167	25
5482	481	f	\N	2025-11-19 13:05:30.587167	25
5483	482	f	\N	2025-11-19 13:05:30.587167	25
5484	483	f	\N	2025-11-19 13:05:30.587167	25
5485	484	f	\N	2025-11-19 13:05:30.587167	25
5486	485	f	\N	2025-11-19 13:05:30.587167	25
5487	486	f	\N	2025-11-19 13:05:30.587167	25
5488	487	f	\N	2025-11-19 13:05:30.587167	25
5489	488	f	\N	2025-11-19 13:05:30.587167	25
5490	489	f	\N	2025-11-19 13:05:30.587167	25
5491	490	f	\N	2025-11-19 13:05:30.587167	25
5492	491	f	\N	2025-11-19 13:05:30.587167	25
5493	492	f	\N	2025-11-19 13:05:30.587167	25
5494	493	f	\N	2025-11-19 13:05:30.587167	25
5495	494	f	\N	2025-11-19 13:05:30.587167	25
5496	495	f	\N	2025-11-19 13:05:30.587167	25
5497	496	f	\N	2025-11-19 13:05:30.587167	25
5498	497	f	\N	2025-11-19 13:05:30.587167	25
5499	498	f	\N	2025-11-19 13:05:30.587167	25
5500	499	f	\N	2025-11-19 13:05:30.587167	25
5501	500	f	\N	2025-11-19 13:05:30.587167	25
3003	2	t	57	2025-11-01 15:04:54.245676	21
5502	1	f	\N	2025-12-03 01:51:55.041511	26
5503	2	f	\N	2025-12-03 01:51:55.041511	26
5504	3	f	\N	2025-12-03 01:51:55.041511	26
5505	4	f	\N	2025-12-03 01:51:55.041511	26
5506	5	f	\N	2025-12-03 01:51:55.041511	26
5508	7	f	\N	2025-12-03 01:51:55.041511	26
5509	8	f	\N	2025-12-03 01:51:55.041511	26
5510	9	f	\N	2025-12-03 01:51:55.041511	26
5513	12	f	\N	2025-12-03 01:51:55.041511	26
5514	13	f	\N	2025-12-03 01:51:55.041511	26
5515	14	f	\N	2025-12-03 01:51:55.041511	26
5516	15	f	\N	2025-12-03 01:51:55.041511	26
5518	17	f	\N	2025-12-03 01:51:55.041511	26
5519	18	f	\N	2025-12-03 01:51:55.041511	26
5520	19	f	\N	2025-12-03 01:51:55.041511	26
5522	21	f	\N	2025-12-03 01:51:55.041511	26
5523	22	f	\N	2025-12-03 01:51:55.041511	26
5524	23	f	\N	2025-12-03 01:51:55.041511	26
5525	24	f	\N	2025-12-03 01:51:55.041511	26
5526	25	f	\N	2025-12-03 01:51:55.041511	26
5527	26	f	\N	2025-12-03 01:51:55.041511	26
5528	27	f	\N	2025-12-03 01:51:55.041511	26
5529	28	f	\N	2025-12-03 01:51:55.041511	26
5530	29	f	\N	2025-12-03 01:51:55.041511	26
5531	30	f	\N	2025-12-03 01:51:55.041511	26
5532	31	f	\N	2025-12-03 01:51:55.041511	26
5533	32	f	\N	2025-12-03 01:51:55.041511	26
5534	33	f	\N	2025-12-03 01:51:55.041511	26
5535	34	f	\N	2025-12-03 01:51:55.041511	26
5536	35	f	\N	2025-12-03 01:51:55.041511	26
5537	36	f	\N	2025-12-03 01:51:55.041511	26
5538	37	f	\N	2025-12-03 01:51:55.041511	26
5539	38	f	\N	2025-12-03 01:51:55.041511	26
5540	39	f	\N	2025-12-03 01:51:55.041511	26
5541	40	f	\N	2025-12-03 01:51:55.041511	26
5542	41	f	\N	2025-12-03 01:51:55.041511	26
5543	42	f	\N	2025-12-03 01:51:55.041511	26
5544	43	f	\N	2025-12-03 01:51:55.041511	26
5545	44	f	\N	2025-12-03 01:51:55.041511	26
5546	45	f	\N	2025-12-03 01:51:55.041511	26
5547	46	f	\N	2025-12-03 01:51:55.041511	26
5548	47	f	\N	2025-12-03 01:51:55.041511	26
5549	48	f	\N	2025-12-03 01:51:55.041511	26
5550	49	f	\N	2025-12-03 01:51:55.041511	26
5551	50	f	\N	2025-12-03 01:51:55.041511	26
5552	51	f	\N	2025-12-03 01:51:55.041511	26
5553	52	f	\N	2025-12-03 01:51:55.041511	26
5554	53	f	\N	2025-12-03 01:51:55.041511	26
5555	54	f	\N	2025-12-03 01:51:55.041511	26
5556	55	f	\N	2025-12-03 01:51:55.041511	26
5557	56	f	\N	2025-12-03 01:51:55.041511	26
5558	57	f	\N	2025-12-03 01:51:55.041511	26
5559	58	f	\N	2025-12-03 01:51:55.041511	26
5560	59	f	\N	2025-12-03 01:51:55.041511	26
5561	60	f	\N	2025-12-03 01:51:55.041511	26
5562	61	f	\N	2025-12-03 01:51:55.041511	26
5563	62	f	\N	2025-12-03 01:51:55.041511	26
5564	63	f	\N	2025-12-03 01:51:55.041511	26
5565	64	f	\N	2025-12-03 01:51:55.041511	26
5566	65	f	\N	2025-12-03 01:51:55.041511	26
5567	66	f	\N	2025-12-03 01:51:55.041511	26
5568	67	f	\N	2025-12-03 01:51:55.041511	26
5569	68	f	\N	2025-12-03 01:51:55.041511	26
5570	69	f	\N	2025-12-03 01:51:55.041511	26
5571	70	f	\N	2025-12-03 01:51:55.041511	26
5572	71	f	\N	2025-12-03 01:51:55.041511	26
5573	72	f	\N	2025-12-03 01:51:55.041511	26
5574	73	f	\N	2025-12-03 01:51:55.041511	26
5575	74	f	\N	2025-12-03 01:51:55.041511	26
5576	75	f	\N	2025-12-03 01:51:55.041511	26
5577	76	f	\N	2025-12-03 01:51:55.041511	26
5578	77	f	\N	2025-12-03 01:51:55.041511	26
5579	78	f	\N	2025-12-03 01:51:55.041511	26
5580	79	f	\N	2025-12-03 01:51:55.041511	26
5581	80	f	\N	2025-12-03 01:51:55.041511	26
5582	81	f	\N	2025-12-03 01:51:55.041511	26
5583	82	f	\N	2025-12-03 01:51:55.041511	26
5584	83	f	\N	2025-12-03 01:51:55.041511	26
5585	84	f	\N	2025-12-03 01:51:55.041511	26
5586	85	f	\N	2025-12-03 01:51:55.041511	26
5587	86	f	\N	2025-12-03 01:51:55.041511	26
5588	87	f	\N	2025-12-03 01:51:55.041511	26
5589	88	f	\N	2025-12-03 01:51:55.041511	26
5590	89	f	\N	2025-12-03 01:51:55.041511	26
5591	90	f	\N	2025-12-03 01:51:55.041511	26
5592	91	f	\N	2025-12-03 01:51:55.041511	26
5593	92	f	\N	2025-12-03 01:51:55.041511	26
5594	93	f	\N	2025-12-03 01:51:55.041511	26
5595	94	f	\N	2025-12-03 01:51:55.041511	26
5596	95	f	\N	2025-12-03 01:51:55.041511	26
5597	96	f	\N	2025-12-03 01:51:55.041511	26
5598	97	f	\N	2025-12-03 01:51:55.041511	26
5599	98	f	\N	2025-12-03 01:51:55.041511	26
5600	99	f	\N	2025-12-03 01:51:55.041511	26
5601	100	f	\N	2025-12-03 01:51:55.041511	26
5602	101	f	\N	2025-12-03 01:51:55.041511	26
5603	102	f	\N	2025-12-03 01:51:55.041511	26
5604	103	f	\N	2025-12-03 01:51:55.041511	26
5605	104	f	\N	2025-12-03 01:51:55.041511	26
5606	105	f	\N	2025-12-03 01:51:55.041511	26
5607	106	f	\N	2025-12-03 01:51:55.041511	26
5608	107	f	\N	2025-12-03 01:51:55.041511	26
5609	108	f	\N	2025-12-03 01:51:55.041511	26
5610	109	f	\N	2025-12-03 01:51:55.041511	26
5611	110	f	\N	2025-12-03 01:51:55.041511	26
5612	111	f	\N	2025-12-03 01:51:55.041511	26
5613	112	f	\N	2025-12-03 01:51:55.041511	26
5614	113	f	\N	2025-12-03 01:51:55.041511	26
5615	114	f	\N	2025-12-03 01:51:55.041511	26
5616	115	f	\N	2025-12-03 01:51:55.041511	26
5617	116	f	\N	2025-12-03 01:51:55.041511	26
5618	117	f	\N	2025-12-03 01:51:55.041511	26
5619	118	f	\N	2025-12-03 01:51:55.041511	26
5620	119	f	\N	2025-12-03 01:51:55.041511	26
5621	120	f	\N	2025-12-03 01:51:55.041511	26
5622	121	f	\N	2025-12-03 01:51:55.041511	26
5623	122	f	\N	2025-12-03 01:51:55.041511	26
5624	123	f	\N	2025-12-03 01:51:55.041511	26
5625	124	f	\N	2025-12-03 01:51:55.041511	26
5626	125	f	\N	2025-12-03 01:51:55.041511	26
5627	126	f	\N	2025-12-03 01:51:55.041511	26
5507	6	t	171	2025-12-03 01:51:55.041511	26
5521	20	f	\N	2025-12-03 01:51:55.041511	26
5628	127	f	\N	2025-12-03 01:51:55.041511	26
5629	128	f	\N	2025-12-03 01:51:55.041511	26
5630	129	f	\N	2025-12-03 01:51:55.041511	26
5631	130	f	\N	2025-12-03 01:51:55.041511	26
5632	131	f	\N	2025-12-03 01:51:55.041511	26
5633	132	f	\N	2025-12-03 01:51:55.041511	26
5634	133	f	\N	2025-12-03 01:51:55.041511	26
5635	134	f	\N	2025-12-03 01:51:55.041511	26
5636	135	f	\N	2025-12-03 01:51:55.041511	26
5637	136	f	\N	2025-12-03 01:51:55.041511	26
5638	137	f	\N	2025-12-03 01:51:55.041511	26
5639	138	f	\N	2025-12-03 01:51:55.041511	26
5640	139	f	\N	2025-12-03 01:51:55.041511	26
5641	140	f	\N	2025-12-03 01:51:55.041511	26
5642	141	f	\N	2025-12-03 01:51:55.041511	26
5643	142	f	\N	2025-12-03 01:51:55.041511	26
5644	143	f	\N	2025-12-03 01:51:55.041511	26
5645	144	f	\N	2025-12-03 01:51:55.041511	26
5646	145	f	\N	2025-12-03 01:51:55.041511	26
5647	146	f	\N	2025-12-03 01:51:55.041511	26
5648	147	f	\N	2025-12-03 01:51:55.041511	26
5649	148	f	\N	2025-12-03 01:51:55.041511	26
5650	149	f	\N	2025-12-03 01:51:55.041511	26
5651	150	f	\N	2025-12-03 01:51:55.041511	26
5652	151	f	\N	2025-12-03 01:51:55.041511	26
5653	152	f	\N	2025-12-03 01:51:55.041511	26
5654	153	f	\N	2025-12-03 01:51:55.041511	26
5655	154	f	\N	2025-12-03 01:51:55.041511	26
5656	155	f	\N	2025-12-03 01:51:55.041511	26
5657	156	f	\N	2025-12-03 01:51:55.041511	26
5658	157	f	\N	2025-12-03 01:51:55.041511	26
5659	158	f	\N	2025-12-03 01:51:55.041511	26
5660	159	f	\N	2025-12-03 01:51:55.041511	26
5661	160	f	\N	2025-12-03 01:51:55.041511	26
5662	161	f	\N	2025-12-03 01:51:55.041511	26
5663	162	f	\N	2025-12-03 01:51:55.041511	26
5664	163	f	\N	2025-12-03 01:51:55.041511	26
5665	164	f	\N	2025-12-03 01:51:55.041511	26
5666	165	f	\N	2025-12-03 01:51:55.041511	26
5667	166	f	\N	2025-12-03 01:51:55.041511	26
5668	167	f	\N	2025-12-03 01:51:55.041511	26
5669	168	f	\N	2025-12-03 01:51:55.041511	26
5670	169	f	\N	2025-12-03 01:51:55.041511	26
5671	170	f	\N	2025-12-03 01:51:55.041511	26
5672	171	f	\N	2025-12-03 01:51:55.041511	26
5673	172	f	\N	2025-12-03 01:51:55.041511	26
5674	173	f	\N	2025-12-03 01:51:55.041511	26
5675	174	f	\N	2025-12-03 01:51:55.041511	26
5676	175	f	\N	2025-12-03 01:51:55.041511	26
5677	176	f	\N	2025-12-03 01:51:55.041511	26
5678	177	f	\N	2025-12-03 01:51:55.041511	26
5679	178	f	\N	2025-12-03 01:51:55.041511	26
5680	179	f	\N	2025-12-03 01:51:55.041511	26
5681	180	f	\N	2025-12-03 01:51:55.041511	26
5682	181	f	\N	2025-12-03 01:51:55.041511	26
5683	182	f	\N	2025-12-03 01:51:55.041511	26
5684	183	f	\N	2025-12-03 01:51:55.041511	26
5685	184	f	\N	2025-12-03 01:51:55.041511	26
5686	185	f	\N	2025-12-03 01:51:55.041511	26
5687	186	f	\N	2025-12-03 01:51:55.041511	26
5688	187	f	\N	2025-12-03 01:51:55.041511	26
5689	188	f	\N	2025-12-03 01:51:55.041511	26
5690	189	f	\N	2025-12-03 01:51:55.041511	26
5691	190	f	\N	2025-12-03 01:51:55.041511	26
5692	191	f	\N	2025-12-03 01:51:55.041511	26
5693	192	f	\N	2025-12-03 01:51:55.041511	26
5694	193	f	\N	2025-12-03 01:51:55.041511	26
5695	194	f	\N	2025-12-03 01:51:55.041511	26
5696	195	f	\N	2025-12-03 01:51:55.041511	26
5697	196	f	\N	2025-12-03 01:51:55.041511	26
5698	197	f	\N	2025-12-03 01:51:55.041511	26
5699	198	f	\N	2025-12-03 01:51:55.041511	26
5700	199	f	\N	2025-12-03 01:51:55.041511	26
5701	200	f	\N	2025-12-03 01:51:55.041511	26
5702	201	f	\N	2025-12-03 01:51:55.041511	26
5703	202	f	\N	2025-12-03 01:51:55.041511	26
5704	203	f	\N	2025-12-03 01:51:55.041511	26
5705	204	f	\N	2025-12-03 01:51:55.041511	26
5706	205	f	\N	2025-12-03 01:51:55.041511	26
5707	206	f	\N	2025-12-03 01:51:55.041511	26
5708	207	f	\N	2025-12-03 01:51:55.041511	26
5709	208	f	\N	2025-12-03 01:51:55.041511	26
5710	209	f	\N	2025-12-03 01:51:55.041511	26
5711	210	f	\N	2025-12-03 01:51:55.041511	26
5712	211	f	\N	2025-12-03 01:51:55.041511	26
5713	212	f	\N	2025-12-03 01:51:55.041511	26
5714	213	f	\N	2025-12-03 01:51:55.041511	26
5715	214	f	\N	2025-12-03 01:51:55.041511	26
5716	215	f	\N	2025-12-03 01:51:55.041511	26
5717	216	f	\N	2025-12-03 01:51:55.041511	26
5718	217	f	\N	2025-12-03 01:51:55.041511	26
5719	218	f	\N	2025-12-03 01:51:55.041511	26
5720	219	f	\N	2025-12-03 01:51:55.041511	26
5721	220	f	\N	2025-12-03 01:51:55.041511	26
5722	221	f	\N	2025-12-03 01:51:55.041511	26
5723	222	f	\N	2025-12-03 01:51:55.041511	26
5724	223	f	\N	2025-12-03 01:51:55.041511	26
5725	224	f	\N	2025-12-03 01:51:55.041511	26
5726	225	f	\N	2025-12-03 01:51:55.041511	26
5727	226	f	\N	2025-12-03 01:51:55.041511	26
5728	227	f	\N	2025-12-03 01:51:55.041511	26
5729	228	f	\N	2025-12-03 01:51:55.041511	26
5730	229	f	\N	2025-12-03 01:51:55.041511	26
5731	230	f	\N	2025-12-03 01:51:55.041511	26
5732	231	f	\N	2025-12-03 01:51:55.041511	26
5733	232	f	\N	2025-12-03 01:51:55.041511	26
5734	233	f	\N	2025-12-03 01:51:55.041511	26
5735	234	f	\N	2025-12-03 01:51:55.041511	26
5736	235	f	\N	2025-12-03 01:51:55.041511	26
5737	236	f	\N	2025-12-03 01:51:55.041511	26
5738	237	f	\N	2025-12-03 01:51:55.041511	26
5739	238	f	\N	2025-12-03 01:51:55.041511	26
5740	239	f	\N	2025-12-03 01:51:55.041511	26
5741	240	f	\N	2025-12-03 01:51:55.041511	26
5742	241	f	\N	2025-12-03 01:51:55.041511	26
5743	242	f	\N	2025-12-03 01:51:55.041511	26
5744	243	f	\N	2025-12-03 01:51:55.041511	26
5745	244	f	\N	2025-12-03 01:51:55.041511	26
5746	245	f	\N	2025-12-03 01:51:55.041511	26
5747	246	f	\N	2025-12-03 01:51:55.041511	26
5748	247	f	\N	2025-12-03 01:51:55.041511	26
5749	248	f	\N	2025-12-03 01:51:55.041511	26
5750	249	f	\N	2025-12-03 01:51:55.041511	26
5751	250	f	\N	2025-12-03 01:51:55.041511	26
5752	251	f	\N	2025-12-03 01:51:55.041511	26
5753	252	f	\N	2025-12-03 01:51:55.041511	26
5754	253	f	\N	2025-12-03 01:51:55.041511	26
5755	254	f	\N	2025-12-03 01:51:55.041511	26
5756	255	f	\N	2025-12-03 01:51:55.041511	26
5757	256	f	\N	2025-12-03 01:51:55.041511	26
5758	257	f	\N	2025-12-03 01:51:55.041511	26
5759	258	f	\N	2025-12-03 01:51:55.041511	26
5760	259	f	\N	2025-12-03 01:51:55.041511	26
5761	260	f	\N	2025-12-03 01:51:55.041511	26
5762	261	f	\N	2025-12-03 01:51:55.041511	26
5763	262	f	\N	2025-12-03 01:51:55.041511	26
5764	263	f	\N	2025-12-03 01:51:55.041511	26
5765	264	f	\N	2025-12-03 01:51:55.041511	26
5766	265	f	\N	2025-12-03 01:51:55.041511	26
5767	266	f	\N	2025-12-03 01:51:55.041511	26
5768	267	f	\N	2025-12-03 01:51:55.041511	26
5769	268	f	\N	2025-12-03 01:51:55.041511	26
5770	269	f	\N	2025-12-03 01:51:55.041511	26
5771	270	f	\N	2025-12-03 01:51:55.041511	26
5772	271	f	\N	2025-12-03 01:51:55.041511	26
5773	272	f	\N	2025-12-03 01:51:55.041511	26
5774	273	f	\N	2025-12-03 01:51:55.041511	26
5775	274	f	\N	2025-12-03 01:51:55.041511	26
5776	275	f	\N	2025-12-03 01:51:55.041511	26
5777	276	f	\N	2025-12-03 01:51:55.041511	26
5778	277	f	\N	2025-12-03 01:51:55.041511	26
5779	278	f	\N	2025-12-03 01:51:55.041511	26
5780	279	f	\N	2025-12-03 01:51:55.041511	26
5781	280	f	\N	2025-12-03 01:51:55.041511	26
5782	281	f	\N	2025-12-03 01:51:55.041511	26
5783	282	f	\N	2025-12-03 01:51:55.041511	26
5784	283	f	\N	2025-12-03 01:51:55.041511	26
5785	284	f	\N	2025-12-03 01:51:55.041511	26
5786	285	f	\N	2025-12-03 01:51:55.041511	26
5787	286	f	\N	2025-12-03 01:51:55.041511	26
5788	287	f	\N	2025-12-03 01:51:55.041511	26
5789	288	f	\N	2025-12-03 01:51:55.041511	26
5790	289	f	\N	2025-12-03 01:51:55.041511	26
5791	290	f	\N	2025-12-03 01:51:55.041511	26
5792	291	f	\N	2025-12-03 01:51:55.041511	26
5793	292	f	\N	2025-12-03 01:51:55.041511	26
5794	293	f	\N	2025-12-03 01:51:55.041511	26
5795	294	f	\N	2025-12-03 01:51:55.041511	26
5796	295	f	\N	2025-12-03 01:51:55.041511	26
5797	296	f	\N	2025-12-03 01:51:55.041511	26
5798	297	f	\N	2025-12-03 01:51:55.041511	26
5799	298	f	\N	2025-12-03 01:51:55.041511	26
5800	299	f	\N	2025-12-03 01:51:55.041511	26
5801	300	f	\N	2025-12-03 01:51:55.041511	26
5802	301	f	\N	2025-12-03 01:51:55.041511	26
5803	302	f	\N	2025-12-03 01:51:55.041511	26
5804	303	f	\N	2025-12-03 01:51:55.041511	26
5805	304	f	\N	2025-12-03 01:51:55.041511	26
5806	305	f	\N	2025-12-03 01:51:55.041511	26
5807	306	f	\N	2025-12-03 01:51:55.041511	26
5808	307	f	\N	2025-12-03 01:51:55.041511	26
5809	308	f	\N	2025-12-03 01:51:55.041511	26
5810	309	f	\N	2025-12-03 01:51:55.041511	26
5811	310	f	\N	2025-12-03 01:51:55.041511	26
5812	311	f	\N	2025-12-03 01:51:55.041511	26
5813	312	f	\N	2025-12-03 01:51:55.041511	26
5814	313	f	\N	2025-12-03 01:51:55.041511	26
5815	314	f	\N	2025-12-03 01:51:55.041511	26
5816	315	f	\N	2025-12-03 01:51:55.041511	26
5817	316	f	\N	2025-12-03 01:51:55.041511	26
5818	317	f	\N	2025-12-03 01:51:55.041511	26
5819	318	f	\N	2025-12-03 01:51:55.041511	26
5820	319	f	\N	2025-12-03 01:51:55.041511	26
5821	320	f	\N	2025-12-03 01:51:55.041511	26
5822	321	f	\N	2025-12-03 01:51:55.041511	26
5823	322	f	\N	2025-12-03 01:51:55.041511	26
5824	323	f	\N	2025-12-03 01:51:55.041511	26
5825	324	f	\N	2025-12-03 01:51:55.041511	26
5826	325	f	\N	2025-12-03 01:51:55.041511	26
5827	326	f	\N	2025-12-03 01:51:55.041511	26
5828	327	f	\N	2025-12-03 01:51:55.041511	26
5829	328	f	\N	2025-12-03 01:51:55.041511	26
5830	329	f	\N	2025-12-03 01:51:55.041511	26
5831	330	f	\N	2025-12-03 01:51:55.041511	26
5832	331	f	\N	2025-12-03 01:51:55.041511	26
5833	332	f	\N	2025-12-03 01:51:55.041511	26
5834	333	f	\N	2025-12-03 01:51:55.041511	26
5835	334	f	\N	2025-12-03 01:51:55.041511	26
5836	335	f	\N	2025-12-03 01:51:55.041511	26
5837	336	f	\N	2025-12-03 01:51:55.041511	26
5838	337	f	\N	2025-12-03 01:51:55.041511	26
5839	338	f	\N	2025-12-03 01:51:55.041511	26
5840	339	f	\N	2025-12-03 01:51:55.041511	26
5841	340	f	\N	2025-12-03 01:51:55.041511	26
5842	341	f	\N	2025-12-03 01:51:55.041511	26
5843	342	f	\N	2025-12-03 01:51:55.041511	26
5844	343	f	\N	2025-12-03 01:51:55.041511	26
5845	344	f	\N	2025-12-03 01:51:55.041511	26
5846	345	f	\N	2025-12-03 01:51:55.041511	26
5847	346	f	\N	2025-12-03 01:51:55.041511	26
5848	347	f	\N	2025-12-03 01:51:55.041511	26
5849	348	f	\N	2025-12-03 01:51:55.041511	26
5850	349	f	\N	2025-12-03 01:51:55.041511	26
5851	350	f	\N	2025-12-03 01:51:55.041511	26
5852	351	f	\N	2025-12-03 01:51:55.041511	26
5853	352	f	\N	2025-12-03 01:51:55.041511	26
5854	353	f	\N	2025-12-03 01:51:55.041511	26
5855	354	f	\N	2025-12-03 01:51:55.041511	26
5856	355	f	\N	2025-12-03 01:51:55.041511	26
5857	356	f	\N	2025-12-03 01:51:55.041511	26
5858	357	f	\N	2025-12-03 01:51:55.041511	26
5859	358	f	\N	2025-12-03 01:51:55.041511	26
5860	359	f	\N	2025-12-03 01:51:55.041511	26
5861	360	f	\N	2025-12-03 01:51:55.041511	26
5862	361	f	\N	2025-12-03 01:51:55.041511	26
5863	362	f	\N	2025-12-03 01:51:55.041511	26
5864	363	f	\N	2025-12-03 01:51:55.041511	26
5865	364	f	\N	2025-12-03 01:51:55.041511	26
5866	365	f	\N	2025-12-03 01:51:55.041511	26
5867	366	f	\N	2025-12-03 01:51:55.041511	26
5868	367	f	\N	2025-12-03 01:51:55.041511	26
5869	368	f	\N	2025-12-03 01:51:55.041511	26
5870	369	f	\N	2025-12-03 01:51:55.041511	26
5871	370	f	\N	2025-12-03 01:51:55.041511	26
5872	371	f	\N	2025-12-03 01:51:55.041511	26
5873	372	f	\N	2025-12-03 01:51:55.041511	26
5874	373	f	\N	2025-12-03 01:51:55.041511	26
5875	374	f	\N	2025-12-03 01:51:55.041511	26
5876	375	f	\N	2025-12-03 01:51:55.041511	26
5877	376	f	\N	2025-12-03 01:51:55.041511	26
5878	377	f	\N	2025-12-03 01:51:55.041511	26
5879	378	f	\N	2025-12-03 01:51:55.041511	26
5880	379	f	\N	2025-12-03 01:51:55.041511	26
5881	380	f	\N	2025-12-03 01:51:55.041511	26
5882	381	f	\N	2025-12-03 01:51:55.041511	26
5883	382	f	\N	2025-12-03 01:51:55.041511	26
5884	383	f	\N	2025-12-03 01:51:55.041511	26
5885	384	f	\N	2025-12-03 01:51:55.041511	26
5886	385	f	\N	2025-12-03 01:51:55.041511	26
5887	386	f	\N	2025-12-03 01:51:55.041511	26
5888	387	f	\N	2025-12-03 01:51:55.041511	26
5889	388	f	\N	2025-12-03 01:51:55.041511	26
5890	389	f	\N	2025-12-03 01:51:55.041511	26
5891	390	f	\N	2025-12-03 01:51:55.041511	26
5892	391	f	\N	2025-12-03 01:51:55.041511	26
5893	392	f	\N	2025-12-03 01:51:55.041511	26
5894	393	f	\N	2025-12-03 01:51:55.041511	26
5895	394	f	\N	2025-12-03 01:51:55.041511	26
5896	395	f	\N	2025-12-03 01:51:55.041511	26
5897	396	f	\N	2025-12-03 01:51:55.041511	26
5898	397	f	\N	2025-12-03 01:51:55.041511	26
5899	398	f	\N	2025-12-03 01:51:55.041511	26
5900	399	f	\N	2025-12-03 01:51:55.041511	26
5901	400	f	\N	2025-12-03 01:51:55.041511	26
5902	401	f	\N	2025-12-03 01:51:55.041511	26
5903	402	f	\N	2025-12-03 01:51:55.041511	26
5904	403	f	\N	2025-12-03 01:51:55.041511	26
5905	404	f	\N	2025-12-03 01:51:55.041511	26
5906	405	f	\N	2025-12-03 01:51:55.041511	26
5907	406	f	\N	2025-12-03 01:51:55.041511	26
5908	407	f	\N	2025-12-03 01:51:55.041511	26
5909	408	f	\N	2025-12-03 01:51:55.041511	26
5910	409	f	\N	2025-12-03 01:51:55.041511	26
5911	410	f	\N	2025-12-03 01:51:55.041511	26
5912	411	f	\N	2025-12-03 01:51:55.041511	26
5913	412	f	\N	2025-12-03 01:51:55.041511	26
5914	413	f	\N	2025-12-03 01:51:55.041511	26
5915	414	f	\N	2025-12-03 01:51:55.041511	26
5916	415	f	\N	2025-12-03 01:51:55.041511	26
5917	416	f	\N	2025-12-03 01:51:55.041511	26
5918	417	f	\N	2025-12-03 01:51:55.041511	26
5919	418	f	\N	2025-12-03 01:51:55.041511	26
5920	419	f	\N	2025-12-03 01:51:55.041511	26
5921	420	f	\N	2025-12-03 01:51:55.041511	26
5922	421	f	\N	2025-12-03 01:51:55.041511	26
5923	422	f	\N	2025-12-03 01:51:55.041511	26
5924	423	f	\N	2025-12-03 01:51:55.041511	26
5925	424	f	\N	2025-12-03 01:51:55.041511	26
5926	425	f	\N	2025-12-03 01:51:55.041511	26
5927	426	f	\N	2025-12-03 01:51:55.041511	26
5928	427	f	\N	2025-12-03 01:51:55.041511	26
5929	428	f	\N	2025-12-03 01:51:55.041511	26
5930	429	f	\N	2025-12-03 01:51:55.041511	26
5931	430	f	\N	2025-12-03 01:51:55.041511	26
5932	431	f	\N	2025-12-03 01:51:55.041511	26
5933	432	f	\N	2025-12-03 01:51:55.041511	26
5934	433	f	\N	2025-12-03 01:51:55.041511	26
5935	434	f	\N	2025-12-03 01:51:55.041511	26
5936	435	f	\N	2025-12-03 01:51:55.041511	26
5937	436	f	\N	2025-12-03 01:51:55.041511	26
5938	437	f	\N	2025-12-03 01:51:55.041511	26
5939	438	f	\N	2025-12-03 01:51:55.041511	26
5940	439	f	\N	2025-12-03 01:51:55.041511	26
5941	440	f	\N	2025-12-03 01:51:55.041511	26
5942	441	f	\N	2025-12-03 01:51:55.041511	26
5943	442	f	\N	2025-12-03 01:51:55.041511	26
5944	443	f	\N	2025-12-03 01:51:55.041511	26
5945	444	f	\N	2025-12-03 01:51:55.041511	26
5946	445	f	\N	2025-12-03 01:51:55.041511	26
5947	446	f	\N	2025-12-03 01:51:55.041511	26
5948	447	f	\N	2025-12-03 01:51:55.041511	26
5949	448	f	\N	2025-12-03 01:51:55.041511	26
5950	449	f	\N	2025-12-03 01:51:55.041511	26
5951	450	f	\N	2025-12-03 01:51:55.041511	26
5952	451	f	\N	2025-12-03 01:51:55.041511	26
5953	452	f	\N	2025-12-03 01:51:55.041511	26
5954	453	f	\N	2025-12-03 01:51:55.041511	26
5955	454	f	\N	2025-12-03 01:51:55.041511	26
5956	455	f	\N	2025-12-03 01:51:55.041511	26
5957	456	f	\N	2025-12-03 01:51:55.041511	26
5958	457	f	\N	2025-12-03 01:51:55.041511	26
5959	458	f	\N	2025-12-03 01:51:55.041511	26
5960	459	f	\N	2025-12-03 01:51:55.041511	26
5961	460	f	\N	2025-12-03 01:51:55.041511	26
5962	461	f	\N	2025-12-03 01:51:55.041511	26
5963	462	f	\N	2025-12-03 01:51:55.041511	26
5964	463	f	\N	2025-12-03 01:51:55.041511	26
5965	464	f	\N	2025-12-03 01:51:55.041511	26
5966	465	f	\N	2025-12-03 01:51:55.041511	26
5967	466	f	\N	2025-12-03 01:51:55.041511	26
5968	467	f	\N	2025-12-03 01:51:55.041511	26
5969	468	f	\N	2025-12-03 01:51:55.041511	26
5970	469	f	\N	2025-12-03 01:51:55.041511	26
5971	470	f	\N	2025-12-03 01:51:55.041511	26
5972	471	f	\N	2025-12-03 01:51:55.041511	26
5973	472	f	\N	2025-12-03 01:51:55.041511	26
5974	473	f	\N	2025-12-03 01:51:55.041511	26
5975	474	f	\N	2025-12-03 01:51:55.041511	26
5976	475	f	\N	2025-12-03 01:51:55.041511	26
5977	476	f	\N	2025-12-03 01:51:55.041511	26
5978	477	f	\N	2025-12-03 01:51:55.041511	26
5979	478	f	\N	2025-12-03 01:51:55.041511	26
5980	479	f	\N	2025-12-03 01:51:55.041511	26
5981	480	f	\N	2025-12-03 01:51:55.041511	26
5982	481	f	\N	2025-12-03 01:51:55.041511	26
5983	482	f	\N	2025-12-03 01:51:55.041511	26
5984	483	f	\N	2025-12-03 01:51:55.041511	26
5985	484	f	\N	2025-12-03 01:51:55.041511	26
5986	485	f	\N	2025-12-03 01:51:55.041511	26
5987	486	f	\N	2025-12-03 01:51:55.041511	26
5988	487	f	\N	2025-12-03 01:51:55.041511	26
5989	488	f	\N	2025-12-03 01:51:55.041511	26
5990	489	f	\N	2025-12-03 01:51:55.041511	26
5991	490	f	\N	2025-12-03 01:51:55.041511	26
5992	491	f	\N	2025-12-03 01:51:55.041511	26
5993	492	f	\N	2025-12-03 01:51:55.041511	26
5994	493	f	\N	2025-12-03 01:51:55.041511	26
5995	494	f	\N	2025-12-03 01:51:55.041511	26
5996	495	f	\N	2025-12-03 01:51:55.041511	26
5997	496	f	\N	2025-12-03 01:51:55.041511	26
5998	497	f	\N	2025-12-03 01:51:55.041511	26
5999	498	f	\N	2025-12-03 01:51:55.041511	26
6000	499	f	\N	2025-12-03 01:51:55.041511	26
6001	500	f	\N	2025-12-03 01:51:55.041511	26
6002	1	f	\N	2025-12-11 13:56:47.758777	27
6003	2	f	\N	2025-12-11 13:56:47.758777	27
6004	3	f	\N	2025-12-11 13:56:47.758777	27
6005	4	f	\N	2025-12-11 13:56:47.758777	27
6006	5	f	\N	2025-12-11 13:56:47.758777	27
15503	2	f	\N	2026-01-12 08:14:17.864053	49
6011	10	t	155	2025-12-11 13:56:47.758777	27
6020	19	f	\N	2025-12-11 13:56:47.758777	27
6022	21	f	\N	2025-12-11 13:56:47.758777	27
6023	22	f	\N	2025-12-11 13:56:47.758777	27
6025	24	f	\N	2025-12-11 13:56:47.758777	27
6027	26	f	\N	2025-12-11 13:56:47.758777	27
6028	27	f	\N	2025-12-11 13:56:47.758777	27
6029	28	f	\N	2025-12-11 13:56:47.758777	27
6030	29	f	\N	2025-12-11 13:56:47.758777	27
6031	30	f	\N	2025-12-11 13:56:47.758777	27
6032	31	f	\N	2025-12-11 13:56:47.758777	27
6033	32	f	\N	2025-12-11 13:56:47.758777	27
6034	33	f	\N	2025-12-11 13:56:47.758777	27
6035	34	f	\N	2025-12-11 13:56:47.758777	27
6018	17	t	164	2025-12-11 13:56:47.758777	27
6024	23	t	84	2025-12-11 13:56:47.758777	27
6014	13	t	76	2025-12-11 13:56:47.758777	27
6026	25	t	193	2025-12-11 13:56:47.758777	27
6009	8	t	156	2025-12-11 13:56:47.758777	27
6008	7	t	150	2025-12-11 13:56:47.758777	27
6021	20	t	85	2025-12-11 13:56:47.758777	27
6007	6	t	151	2025-12-11 13:56:47.758777	27
6010	9	t	83	2025-12-11 13:56:47.758777	27
6013	12	t	84	2025-12-11 13:56:47.758777	27
6016	15	t	77	2025-12-11 13:56:47.758777	27
6019	18	t	192	2025-12-11 13:56:47.758777	27
6036	35	f	\N	2025-12-11 13:56:47.758777	27
6037	36	f	\N	2025-12-11 13:56:47.758777	27
6038	37	f	\N	2025-12-11 13:56:47.758777	27
6039	38	f	\N	2025-12-11 13:56:47.758777	27
6040	39	f	\N	2025-12-11 13:56:47.758777	27
6041	40	f	\N	2025-12-11 13:56:47.758777	27
6042	41	f	\N	2025-12-11 13:56:47.758777	27
6043	42	f	\N	2025-12-11 13:56:47.758777	27
6044	43	f	\N	2025-12-11 13:56:47.758777	27
6045	44	f	\N	2025-12-11 13:56:47.758777	27
6046	45	f	\N	2025-12-11 13:56:47.758777	27
6047	46	f	\N	2025-12-11 13:56:47.758777	27
6048	47	f	\N	2025-12-11 13:56:47.758777	27
6049	48	f	\N	2025-12-11 13:56:47.758777	27
6050	49	f	\N	2025-12-11 13:56:47.758777	27
6051	50	f	\N	2025-12-11 13:56:47.758777	27
6052	51	f	\N	2025-12-11 13:56:47.758777	27
6053	52	f	\N	2025-12-11 13:56:47.758777	27
6054	53	f	\N	2025-12-11 13:56:47.758777	27
6055	54	f	\N	2025-12-11 13:56:47.758777	27
6056	55	f	\N	2025-12-11 13:56:47.758777	27
6057	56	f	\N	2025-12-11 13:56:47.758777	27
6058	57	f	\N	2025-12-11 13:56:47.758777	27
6059	58	f	\N	2025-12-11 13:56:47.758777	27
6060	59	f	\N	2025-12-11 13:56:47.758777	27
6061	60	f	\N	2025-12-11 13:56:47.758777	27
6062	61	f	\N	2025-12-11 13:56:47.758777	27
6063	62	f	\N	2025-12-11 13:56:47.758777	27
6064	63	f	\N	2025-12-11 13:56:47.758777	27
6065	64	f	\N	2025-12-11 13:56:47.758777	27
6066	65	f	\N	2025-12-11 13:56:47.758777	27
6067	66	f	\N	2025-12-11 13:56:47.758777	27
6068	67	f	\N	2025-12-11 13:56:47.758777	27
6069	68	f	\N	2025-12-11 13:56:47.758777	27
6070	69	f	\N	2025-12-11 13:56:47.758777	27
6071	70	f	\N	2025-12-11 13:56:47.758777	27
6072	71	f	\N	2025-12-11 13:56:47.758777	27
6073	72	f	\N	2025-12-11 13:56:47.758777	27
6074	73	f	\N	2025-12-11 13:56:47.758777	27
6075	74	f	\N	2025-12-11 13:56:47.758777	27
6076	75	f	\N	2025-12-11 13:56:47.758777	27
6077	76	f	\N	2025-12-11 13:56:47.758777	27
6078	77	f	\N	2025-12-11 13:56:47.758777	27
6079	78	f	\N	2025-12-11 13:56:47.758777	27
6080	79	f	\N	2025-12-11 13:56:47.758777	27
6081	80	f	\N	2025-12-11 13:56:47.758777	27
6082	81	f	\N	2025-12-11 13:56:47.758777	27
6083	82	f	\N	2025-12-11 13:56:47.758777	27
6084	83	f	\N	2025-12-11 13:56:47.758777	27
6085	84	f	\N	2025-12-11 13:56:47.758777	27
6086	85	f	\N	2025-12-11 13:56:47.758777	27
6087	86	f	\N	2025-12-11 13:56:47.758777	27
6088	87	f	\N	2025-12-11 13:56:47.758777	27
6089	88	f	\N	2025-12-11 13:56:47.758777	27
6090	89	f	\N	2025-12-11 13:56:47.758777	27
6091	90	f	\N	2025-12-11 13:56:47.758777	27
6092	91	f	\N	2025-12-11 13:56:47.758777	27
6093	92	f	\N	2025-12-11 13:56:47.758777	27
6094	93	f	\N	2025-12-11 13:56:47.758777	27
6095	94	f	\N	2025-12-11 13:56:47.758777	27
6096	95	f	\N	2025-12-11 13:56:47.758777	27
6097	96	f	\N	2025-12-11 13:56:47.758777	27
6098	97	f	\N	2025-12-11 13:56:47.758777	27
6099	98	f	\N	2025-12-11 13:56:47.758777	27
6100	99	f	\N	2025-12-11 13:56:47.758777	27
6101	100	f	\N	2025-12-11 13:56:47.758777	27
6102	101	f	\N	2025-12-11 13:56:47.758777	27
6103	102	f	\N	2025-12-11 13:56:47.758777	27
6104	103	f	\N	2025-12-11 13:56:47.758777	27
6105	104	f	\N	2025-12-11 13:56:47.758777	27
6106	105	f	\N	2025-12-11 13:56:47.758777	27
6107	106	f	\N	2025-12-11 13:56:47.758777	27
6108	107	f	\N	2025-12-11 13:56:47.758777	27
6109	108	f	\N	2025-12-11 13:56:47.758777	27
6110	109	f	\N	2025-12-11 13:56:47.758777	27
6111	110	f	\N	2025-12-11 13:56:47.758777	27
6112	111	f	\N	2025-12-11 13:56:47.758777	27
6113	112	f	\N	2025-12-11 13:56:47.758777	27
6114	113	f	\N	2025-12-11 13:56:47.758777	27
6115	114	f	\N	2025-12-11 13:56:47.758777	27
6116	115	f	\N	2025-12-11 13:56:47.758777	27
6117	116	f	\N	2025-12-11 13:56:47.758777	27
6118	117	f	\N	2025-12-11 13:56:47.758777	27
6119	118	f	\N	2025-12-11 13:56:47.758777	27
6120	119	f	\N	2025-12-11 13:56:47.758777	27
6121	120	f	\N	2025-12-11 13:56:47.758777	27
6122	121	f	\N	2025-12-11 13:56:47.758777	27
6123	122	f	\N	2025-12-11 13:56:47.758777	27
6124	123	f	\N	2025-12-11 13:56:47.758777	27
6125	124	f	\N	2025-12-11 13:56:47.758777	27
6126	125	f	\N	2025-12-11 13:56:47.758777	27
6127	126	f	\N	2025-12-11 13:56:47.758777	27
6128	127	f	\N	2025-12-11 13:56:47.758777	27
6129	128	f	\N	2025-12-11 13:56:47.758777	27
6130	129	f	\N	2025-12-11 13:56:47.758777	27
6131	130	f	\N	2025-12-11 13:56:47.758777	27
6132	131	f	\N	2025-12-11 13:56:47.758777	27
6133	132	f	\N	2025-12-11 13:56:47.758777	27
6134	133	f	\N	2025-12-11 13:56:47.758777	27
6135	134	f	\N	2025-12-11 13:56:47.758777	27
6136	135	f	\N	2025-12-11 13:56:47.758777	27
6137	136	f	\N	2025-12-11 13:56:47.758777	27
6138	137	f	\N	2025-12-11 13:56:47.758777	27
6139	138	f	\N	2025-12-11 13:56:47.758777	27
6140	139	f	\N	2025-12-11 13:56:47.758777	27
6141	140	f	\N	2025-12-11 13:56:47.758777	27
6142	141	f	\N	2025-12-11 13:56:47.758777	27
6143	142	f	\N	2025-12-11 13:56:47.758777	27
6144	143	f	\N	2025-12-11 13:56:47.758777	27
6145	144	f	\N	2025-12-11 13:56:47.758777	27
6146	145	f	\N	2025-12-11 13:56:47.758777	27
6147	146	f	\N	2025-12-11 13:56:47.758777	27
6148	147	f	\N	2025-12-11 13:56:47.758777	27
6149	148	f	\N	2025-12-11 13:56:47.758777	27
6150	149	f	\N	2025-12-11 13:56:47.758777	27
6151	150	f	\N	2025-12-11 13:56:47.758777	27
6152	151	f	\N	2025-12-11 13:56:47.758777	27
6153	152	f	\N	2025-12-11 13:56:47.758777	27
6154	153	f	\N	2025-12-11 13:56:47.758777	27
6155	154	f	\N	2025-12-11 13:56:47.758777	27
6156	155	f	\N	2025-12-11 13:56:47.758777	27
6157	156	f	\N	2025-12-11 13:56:47.758777	27
6158	157	f	\N	2025-12-11 13:56:47.758777	27
6159	158	f	\N	2025-12-11 13:56:47.758777	27
6160	159	f	\N	2025-12-11 13:56:47.758777	27
6161	160	f	\N	2025-12-11 13:56:47.758777	27
6162	161	f	\N	2025-12-11 13:56:47.758777	27
6163	162	f	\N	2025-12-11 13:56:47.758777	27
6164	163	f	\N	2025-12-11 13:56:47.758777	27
6165	164	f	\N	2025-12-11 13:56:47.758777	27
6166	165	f	\N	2025-12-11 13:56:47.758777	27
6167	166	f	\N	2025-12-11 13:56:47.758777	27
6168	167	f	\N	2025-12-11 13:56:47.758777	27
6169	168	f	\N	2025-12-11 13:56:47.758777	27
6170	169	f	\N	2025-12-11 13:56:47.758777	27
6171	170	f	\N	2025-12-11 13:56:47.758777	27
6172	171	f	\N	2025-12-11 13:56:47.758777	27
6173	172	f	\N	2025-12-11 13:56:47.758777	27
6174	173	f	\N	2025-12-11 13:56:47.758777	27
6175	174	f	\N	2025-12-11 13:56:47.758777	27
6176	175	f	\N	2025-12-11 13:56:47.758777	27
6177	176	f	\N	2025-12-11 13:56:47.758777	27
6178	177	f	\N	2025-12-11 13:56:47.758777	27
6179	178	f	\N	2025-12-11 13:56:47.758777	27
6180	179	f	\N	2025-12-11 13:56:47.758777	27
6181	180	f	\N	2025-12-11 13:56:47.758777	27
6182	181	f	\N	2025-12-11 13:56:47.758777	27
6183	182	f	\N	2025-12-11 13:56:47.758777	27
6184	183	f	\N	2025-12-11 13:56:47.758777	27
6185	184	f	\N	2025-12-11 13:56:47.758777	27
6186	185	f	\N	2025-12-11 13:56:47.758777	27
6187	186	f	\N	2025-12-11 13:56:47.758777	27
6188	187	f	\N	2025-12-11 13:56:47.758777	27
6189	188	f	\N	2025-12-11 13:56:47.758777	27
6190	189	f	\N	2025-12-11 13:56:47.758777	27
6191	190	f	\N	2025-12-11 13:56:47.758777	27
6192	191	f	\N	2025-12-11 13:56:47.758777	27
6193	192	f	\N	2025-12-11 13:56:47.758777	27
6194	193	f	\N	2025-12-11 13:56:47.758777	27
6195	194	f	\N	2025-12-11 13:56:47.758777	27
6196	195	f	\N	2025-12-11 13:56:47.758777	27
6197	196	f	\N	2025-12-11 13:56:47.758777	27
6198	197	f	\N	2025-12-11 13:56:47.758777	27
6199	198	f	\N	2025-12-11 13:56:47.758777	27
6200	199	f	\N	2025-12-11 13:56:47.758777	27
6201	200	f	\N	2025-12-11 13:56:47.758777	27
6202	201	f	\N	2025-12-11 13:56:47.758777	27
6203	202	f	\N	2025-12-11 13:56:47.758777	27
6204	203	f	\N	2025-12-11 13:56:47.758777	27
6205	204	f	\N	2025-12-11 13:56:47.758777	27
6206	205	f	\N	2025-12-11 13:56:47.758777	27
6207	206	f	\N	2025-12-11 13:56:47.758777	27
6208	207	f	\N	2025-12-11 13:56:47.758777	27
6209	208	f	\N	2025-12-11 13:56:47.758777	27
6210	209	f	\N	2025-12-11 13:56:47.758777	27
6211	210	f	\N	2025-12-11 13:56:47.758777	27
6212	211	f	\N	2025-12-11 13:56:47.758777	27
6213	212	f	\N	2025-12-11 13:56:47.758777	27
6214	213	f	\N	2025-12-11 13:56:47.758777	27
6215	214	f	\N	2025-12-11 13:56:47.758777	27
6216	215	f	\N	2025-12-11 13:56:47.758777	27
6217	216	f	\N	2025-12-11 13:56:47.758777	27
6218	217	f	\N	2025-12-11 13:56:47.758777	27
6219	218	f	\N	2025-12-11 13:56:47.758777	27
6220	219	f	\N	2025-12-11 13:56:47.758777	27
6221	220	f	\N	2025-12-11 13:56:47.758777	27
6222	221	f	\N	2025-12-11 13:56:47.758777	27
6223	222	f	\N	2025-12-11 13:56:47.758777	27
6224	223	f	\N	2025-12-11 13:56:47.758777	27
6225	224	f	\N	2025-12-11 13:56:47.758777	27
6226	225	f	\N	2025-12-11 13:56:47.758777	27
6227	226	f	\N	2025-12-11 13:56:47.758777	27
6228	227	f	\N	2025-12-11 13:56:47.758777	27
6229	228	f	\N	2025-12-11 13:56:47.758777	27
6230	229	f	\N	2025-12-11 13:56:47.758777	27
6231	230	f	\N	2025-12-11 13:56:47.758777	27
6232	231	f	\N	2025-12-11 13:56:47.758777	27
6233	232	f	\N	2025-12-11 13:56:47.758777	27
6234	233	f	\N	2025-12-11 13:56:47.758777	27
6235	234	f	\N	2025-12-11 13:56:47.758777	27
6236	235	f	\N	2025-12-11 13:56:47.758777	27
6237	236	f	\N	2025-12-11 13:56:47.758777	27
6238	237	f	\N	2025-12-11 13:56:47.758777	27
6239	238	f	\N	2025-12-11 13:56:47.758777	27
6240	239	f	\N	2025-12-11 13:56:47.758777	27
6241	240	f	\N	2025-12-11 13:56:47.758777	27
6242	241	f	\N	2025-12-11 13:56:47.758777	27
6243	242	f	\N	2025-12-11 13:56:47.758777	27
6244	243	f	\N	2025-12-11 13:56:47.758777	27
6245	244	f	\N	2025-12-11 13:56:47.758777	27
6246	245	f	\N	2025-12-11 13:56:47.758777	27
6247	246	f	\N	2025-12-11 13:56:47.758777	27
6248	247	f	\N	2025-12-11 13:56:47.758777	27
6249	248	f	\N	2025-12-11 13:56:47.758777	27
6250	249	f	\N	2025-12-11 13:56:47.758777	27
6251	250	f	\N	2025-12-11 13:56:47.758777	27
6252	251	f	\N	2025-12-11 13:56:47.758777	27
6253	252	f	\N	2025-12-11 13:56:47.758777	27
6254	253	f	\N	2025-12-11 13:56:47.758777	27
6255	254	f	\N	2025-12-11 13:56:47.758777	27
6256	255	f	\N	2025-12-11 13:56:47.758777	27
6257	256	f	\N	2025-12-11 13:56:47.758777	27
6258	257	f	\N	2025-12-11 13:56:47.758777	27
6259	258	f	\N	2025-12-11 13:56:47.758777	27
6260	259	f	\N	2025-12-11 13:56:47.758777	27
6261	260	f	\N	2025-12-11 13:56:47.758777	27
6262	261	f	\N	2025-12-11 13:56:47.758777	27
6263	262	f	\N	2025-12-11 13:56:47.758777	27
6264	263	f	\N	2025-12-11 13:56:47.758777	27
6265	264	f	\N	2025-12-11 13:56:47.758777	27
6266	265	f	\N	2025-12-11 13:56:47.758777	27
6267	266	f	\N	2025-12-11 13:56:47.758777	27
6268	267	f	\N	2025-12-11 13:56:47.758777	27
6269	268	f	\N	2025-12-11 13:56:47.758777	27
6270	269	f	\N	2025-12-11 13:56:47.758777	27
6271	270	f	\N	2025-12-11 13:56:47.758777	27
6272	271	f	\N	2025-12-11 13:56:47.758777	27
6273	272	f	\N	2025-12-11 13:56:47.758777	27
6274	273	f	\N	2025-12-11 13:56:47.758777	27
6275	274	f	\N	2025-12-11 13:56:47.758777	27
6276	275	f	\N	2025-12-11 13:56:47.758777	27
6277	276	f	\N	2025-12-11 13:56:47.758777	27
6278	277	f	\N	2025-12-11 13:56:47.758777	27
6279	278	f	\N	2025-12-11 13:56:47.758777	27
6280	279	f	\N	2025-12-11 13:56:47.758777	27
6281	280	f	\N	2025-12-11 13:56:47.758777	27
6282	281	f	\N	2025-12-11 13:56:47.758777	27
6283	282	f	\N	2025-12-11 13:56:47.758777	27
6284	283	f	\N	2025-12-11 13:56:47.758777	27
6285	284	f	\N	2025-12-11 13:56:47.758777	27
6286	285	f	\N	2025-12-11 13:56:47.758777	27
6287	286	f	\N	2025-12-11 13:56:47.758777	27
6288	287	f	\N	2025-12-11 13:56:47.758777	27
6289	288	f	\N	2025-12-11 13:56:47.758777	27
6290	289	f	\N	2025-12-11 13:56:47.758777	27
6291	290	f	\N	2025-12-11 13:56:47.758777	27
6292	291	f	\N	2025-12-11 13:56:47.758777	27
6293	292	f	\N	2025-12-11 13:56:47.758777	27
6294	293	f	\N	2025-12-11 13:56:47.758777	27
6295	294	f	\N	2025-12-11 13:56:47.758777	27
6296	295	f	\N	2025-12-11 13:56:47.758777	27
6297	296	f	\N	2025-12-11 13:56:47.758777	27
6298	297	f	\N	2025-12-11 13:56:47.758777	27
6299	298	f	\N	2025-12-11 13:56:47.758777	27
6300	299	f	\N	2025-12-11 13:56:47.758777	27
6301	300	f	\N	2025-12-11 13:56:47.758777	27
6302	301	f	\N	2025-12-11 13:56:47.758777	27
6303	302	f	\N	2025-12-11 13:56:47.758777	27
6304	303	f	\N	2025-12-11 13:56:47.758777	27
6305	304	f	\N	2025-12-11 13:56:47.758777	27
6306	305	f	\N	2025-12-11 13:56:47.758777	27
6307	306	f	\N	2025-12-11 13:56:47.758777	27
6308	307	f	\N	2025-12-11 13:56:47.758777	27
6309	308	f	\N	2025-12-11 13:56:47.758777	27
6310	309	f	\N	2025-12-11 13:56:47.758777	27
6311	310	f	\N	2025-12-11 13:56:47.758777	27
6312	311	f	\N	2025-12-11 13:56:47.758777	27
6313	312	f	\N	2025-12-11 13:56:47.758777	27
6314	313	f	\N	2025-12-11 13:56:47.758777	27
6315	314	f	\N	2025-12-11 13:56:47.758777	27
6316	315	f	\N	2025-12-11 13:56:47.758777	27
6317	316	f	\N	2025-12-11 13:56:47.758777	27
6318	317	f	\N	2025-12-11 13:56:47.758777	27
6319	318	f	\N	2025-12-11 13:56:47.758777	27
6320	319	f	\N	2025-12-11 13:56:47.758777	27
6321	320	f	\N	2025-12-11 13:56:47.758777	27
6322	321	f	\N	2025-12-11 13:56:47.758777	27
6323	322	f	\N	2025-12-11 13:56:47.758777	27
6324	323	f	\N	2025-12-11 13:56:47.758777	27
6325	324	f	\N	2025-12-11 13:56:47.758777	27
6326	325	f	\N	2025-12-11 13:56:47.758777	27
6327	326	f	\N	2025-12-11 13:56:47.758777	27
6328	327	f	\N	2025-12-11 13:56:47.758777	27
6329	328	f	\N	2025-12-11 13:56:47.758777	27
6330	329	f	\N	2025-12-11 13:56:47.758777	27
6331	330	f	\N	2025-12-11 13:56:47.758777	27
6332	331	f	\N	2025-12-11 13:56:47.758777	27
6333	332	f	\N	2025-12-11 13:56:47.758777	27
6334	333	f	\N	2025-12-11 13:56:47.758777	27
6335	334	f	\N	2025-12-11 13:56:47.758777	27
6336	335	f	\N	2025-12-11 13:56:47.758777	27
6337	336	f	\N	2025-12-11 13:56:47.758777	27
6338	337	f	\N	2025-12-11 13:56:47.758777	27
6339	338	f	\N	2025-12-11 13:56:47.758777	27
6340	339	f	\N	2025-12-11 13:56:47.758777	27
6341	340	f	\N	2025-12-11 13:56:47.758777	27
6342	341	f	\N	2025-12-11 13:56:47.758777	27
6343	342	f	\N	2025-12-11 13:56:47.758777	27
6344	343	f	\N	2025-12-11 13:56:47.758777	27
6345	344	f	\N	2025-12-11 13:56:47.758777	27
6346	345	f	\N	2025-12-11 13:56:47.758777	27
6347	346	f	\N	2025-12-11 13:56:47.758777	27
6348	347	f	\N	2025-12-11 13:56:47.758777	27
6349	348	f	\N	2025-12-11 13:56:47.758777	27
6350	349	f	\N	2025-12-11 13:56:47.758777	27
6351	350	f	\N	2025-12-11 13:56:47.758777	27
6352	351	f	\N	2025-12-11 13:56:47.758777	27
6353	352	f	\N	2025-12-11 13:56:47.758777	27
6354	353	f	\N	2025-12-11 13:56:47.758777	27
6355	354	f	\N	2025-12-11 13:56:47.758777	27
6356	355	f	\N	2025-12-11 13:56:47.758777	27
6357	356	f	\N	2025-12-11 13:56:47.758777	27
6358	357	f	\N	2025-12-11 13:56:47.758777	27
6359	358	f	\N	2025-12-11 13:56:47.758777	27
6360	359	f	\N	2025-12-11 13:56:47.758777	27
6361	360	f	\N	2025-12-11 13:56:47.758777	27
6362	361	f	\N	2025-12-11 13:56:47.758777	27
6363	362	f	\N	2025-12-11 13:56:47.758777	27
6364	363	f	\N	2025-12-11 13:56:47.758777	27
6365	364	f	\N	2025-12-11 13:56:47.758777	27
6366	365	f	\N	2025-12-11 13:56:47.758777	27
6367	366	f	\N	2025-12-11 13:56:47.758777	27
6368	367	f	\N	2025-12-11 13:56:47.758777	27
6369	368	f	\N	2025-12-11 13:56:47.758777	27
6370	369	f	\N	2025-12-11 13:56:47.758777	27
6371	370	f	\N	2025-12-11 13:56:47.758777	27
6372	371	f	\N	2025-12-11 13:56:47.758777	27
6373	372	f	\N	2025-12-11 13:56:47.758777	27
6374	373	f	\N	2025-12-11 13:56:47.758777	27
6375	374	f	\N	2025-12-11 13:56:47.758777	27
6376	375	f	\N	2025-12-11 13:56:47.758777	27
6377	376	f	\N	2025-12-11 13:56:47.758777	27
6378	377	f	\N	2025-12-11 13:56:47.758777	27
6379	378	f	\N	2025-12-11 13:56:47.758777	27
6380	379	f	\N	2025-12-11 13:56:47.758777	27
6381	380	f	\N	2025-12-11 13:56:47.758777	27
6382	381	f	\N	2025-12-11 13:56:47.758777	27
6383	382	f	\N	2025-12-11 13:56:47.758777	27
6384	383	f	\N	2025-12-11 13:56:47.758777	27
6385	384	f	\N	2025-12-11 13:56:47.758777	27
6386	385	f	\N	2025-12-11 13:56:47.758777	27
6387	386	f	\N	2025-12-11 13:56:47.758777	27
6388	387	f	\N	2025-12-11 13:56:47.758777	27
6389	388	f	\N	2025-12-11 13:56:47.758777	27
6390	389	f	\N	2025-12-11 13:56:47.758777	27
6391	390	f	\N	2025-12-11 13:56:47.758777	27
6392	391	f	\N	2025-12-11 13:56:47.758777	27
6393	392	f	\N	2025-12-11 13:56:47.758777	27
6394	393	f	\N	2025-12-11 13:56:47.758777	27
6395	394	f	\N	2025-12-11 13:56:47.758777	27
6396	395	f	\N	2025-12-11 13:56:47.758777	27
6397	396	f	\N	2025-12-11 13:56:47.758777	27
6398	397	f	\N	2025-12-11 13:56:47.758777	27
6399	398	f	\N	2025-12-11 13:56:47.758777	27
6400	399	f	\N	2025-12-11 13:56:47.758777	27
6401	400	f	\N	2025-12-11 13:56:47.758777	27
6402	401	f	\N	2025-12-11 13:56:47.758777	27
6403	402	f	\N	2025-12-11 13:56:47.758777	27
6404	403	f	\N	2025-12-11 13:56:47.758777	27
6405	404	f	\N	2025-12-11 13:56:47.758777	27
6406	405	f	\N	2025-12-11 13:56:47.758777	27
6407	406	f	\N	2025-12-11 13:56:47.758777	27
6408	407	f	\N	2025-12-11 13:56:47.758777	27
6409	408	f	\N	2025-12-11 13:56:47.758777	27
6410	409	f	\N	2025-12-11 13:56:47.758777	27
6411	410	f	\N	2025-12-11 13:56:47.758777	27
6412	411	f	\N	2025-12-11 13:56:47.758777	27
6413	412	f	\N	2025-12-11 13:56:47.758777	27
6414	413	f	\N	2025-12-11 13:56:47.758777	27
6415	414	f	\N	2025-12-11 13:56:47.758777	27
6416	415	f	\N	2025-12-11 13:56:47.758777	27
6417	416	f	\N	2025-12-11 13:56:47.758777	27
6418	417	f	\N	2025-12-11 13:56:47.758777	27
6419	418	f	\N	2025-12-11 13:56:47.758777	27
6420	419	f	\N	2025-12-11 13:56:47.758777	27
6421	420	f	\N	2025-12-11 13:56:47.758777	27
6422	421	f	\N	2025-12-11 13:56:47.758777	27
6423	422	f	\N	2025-12-11 13:56:47.758777	27
6424	423	f	\N	2025-12-11 13:56:47.758777	27
6425	424	f	\N	2025-12-11 13:56:47.758777	27
6426	425	f	\N	2025-12-11 13:56:47.758777	27
6427	426	f	\N	2025-12-11 13:56:47.758777	27
6428	427	f	\N	2025-12-11 13:56:47.758777	27
6429	428	f	\N	2025-12-11 13:56:47.758777	27
6430	429	f	\N	2025-12-11 13:56:47.758777	27
6431	430	f	\N	2025-12-11 13:56:47.758777	27
6432	431	f	\N	2025-12-11 13:56:47.758777	27
6433	432	f	\N	2025-12-11 13:56:47.758777	27
6434	433	f	\N	2025-12-11 13:56:47.758777	27
6435	434	f	\N	2025-12-11 13:56:47.758777	27
6436	435	f	\N	2025-12-11 13:56:47.758777	27
6437	436	f	\N	2025-12-11 13:56:47.758777	27
6438	437	f	\N	2025-12-11 13:56:47.758777	27
6439	438	f	\N	2025-12-11 13:56:47.758777	27
6440	439	f	\N	2025-12-11 13:56:47.758777	27
6441	440	f	\N	2025-12-11 13:56:47.758777	27
6442	441	f	\N	2025-12-11 13:56:47.758777	27
6443	442	f	\N	2025-12-11 13:56:47.758777	27
6444	443	f	\N	2025-12-11 13:56:47.758777	27
6445	444	f	\N	2025-12-11 13:56:47.758777	27
6446	445	f	\N	2025-12-11 13:56:47.758777	27
6447	446	f	\N	2025-12-11 13:56:47.758777	27
6448	447	f	\N	2025-12-11 13:56:47.758777	27
6449	448	f	\N	2025-12-11 13:56:47.758777	27
6450	449	f	\N	2025-12-11 13:56:47.758777	27
6451	450	f	\N	2025-12-11 13:56:47.758777	27
6452	451	f	\N	2025-12-11 13:56:47.758777	27
6453	452	f	\N	2025-12-11 13:56:47.758777	27
6454	453	f	\N	2025-12-11 13:56:47.758777	27
6455	454	f	\N	2025-12-11 13:56:47.758777	27
6456	455	f	\N	2025-12-11 13:56:47.758777	27
6457	456	f	\N	2025-12-11 13:56:47.758777	27
6458	457	f	\N	2025-12-11 13:56:47.758777	27
6459	458	f	\N	2025-12-11 13:56:47.758777	27
6460	459	f	\N	2025-12-11 13:56:47.758777	27
6461	460	f	\N	2025-12-11 13:56:47.758777	27
6462	461	f	\N	2025-12-11 13:56:47.758777	27
6463	462	f	\N	2025-12-11 13:56:47.758777	27
6464	463	f	\N	2025-12-11 13:56:47.758777	27
6465	464	f	\N	2025-12-11 13:56:47.758777	27
6466	465	f	\N	2025-12-11 13:56:47.758777	27
6467	466	f	\N	2025-12-11 13:56:47.758777	27
6468	467	f	\N	2025-12-11 13:56:47.758777	27
6469	468	f	\N	2025-12-11 13:56:47.758777	27
6470	469	f	\N	2025-12-11 13:56:47.758777	27
6471	470	f	\N	2025-12-11 13:56:47.758777	27
6472	471	f	\N	2025-12-11 13:56:47.758777	27
6473	472	f	\N	2025-12-11 13:56:47.758777	27
6474	473	f	\N	2025-12-11 13:56:47.758777	27
6475	474	f	\N	2025-12-11 13:56:47.758777	27
6476	475	f	\N	2025-12-11 13:56:47.758777	27
6477	476	f	\N	2025-12-11 13:56:47.758777	27
6478	477	f	\N	2025-12-11 13:56:47.758777	27
6479	478	f	\N	2025-12-11 13:56:47.758777	27
6480	479	f	\N	2025-12-11 13:56:47.758777	27
6481	480	f	\N	2025-12-11 13:56:47.758777	27
6482	481	f	\N	2025-12-11 13:56:47.758777	27
6483	482	f	\N	2025-12-11 13:56:47.758777	27
6484	483	f	\N	2025-12-11 13:56:47.758777	27
6485	484	f	\N	2025-12-11 13:56:47.758777	27
6486	485	f	\N	2025-12-11 13:56:47.758777	27
6487	486	f	\N	2025-12-11 13:56:47.758777	27
6488	487	f	\N	2025-12-11 13:56:47.758777	27
6489	488	f	\N	2025-12-11 13:56:47.758777	27
6490	489	f	\N	2025-12-11 13:56:47.758777	27
6491	490	f	\N	2025-12-11 13:56:47.758777	27
6492	491	f	\N	2025-12-11 13:56:47.758777	27
6493	492	f	\N	2025-12-11 13:56:47.758777	27
6494	493	f	\N	2025-12-11 13:56:47.758777	27
6495	494	f	\N	2025-12-11 13:56:47.758777	27
6496	495	f	\N	2025-12-11 13:56:47.758777	27
6497	496	f	\N	2025-12-11 13:56:47.758777	27
6498	497	f	\N	2025-12-11 13:56:47.758777	27
6499	498	f	\N	2025-12-11 13:56:47.758777	27
6500	499	f	\N	2025-12-11 13:56:47.758777	27
6501	500	f	\N	2025-12-11 13:56:47.758777	27
6502	1	f	\N	2025-12-11 21:34:50.992226	28
6503	2	f	\N	2025-12-11 21:34:50.992226	28
6504	3	f	\N	2025-12-11 21:34:50.992226	28
6505	4	f	\N	2025-12-11 21:34:50.992226	28
6506	5	f	\N	2025-12-11 21:34:50.992226	28
6507	6	f	\N	2025-12-11 21:34:50.992226	28
6508	7	f	\N	2025-12-11 21:34:50.992226	28
6509	8	f	\N	2025-12-11 21:34:50.992226	28
6510	9	f	\N	2025-12-11 21:34:50.992226	28
6512	11	f	\N	2025-12-11 21:34:50.992226	28
6513	12	f	\N	2025-12-11 21:34:50.992226	28
6514	13	f	\N	2025-12-11 21:34:50.992226	28
6515	14	f	\N	2025-12-11 21:34:50.992226	28
6516	15	f	\N	2025-12-11 21:34:50.992226	28
6517	16	f	\N	2025-12-11 21:34:50.992226	28
6518	17	f	\N	2025-12-11 21:34:50.992226	28
6519	18	f	\N	2025-12-11 21:34:50.992226	28
6520	19	f	\N	2025-12-11 21:34:50.992226	28
6521	20	f	\N	2025-12-11 21:34:50.992226	28
6522	21	f	\N	2025-12-11 21:34:50.992226	28
6523	22	f	\N	2025-12-11 21:34:50.992226	28
6524	23	f	\N	2025-12-11 21:34:50.992226	28
6525	24	f	\N	2025-12-11 21:34:50.992226	28
6526	25	f	\N	2025-12-11 21:34:50.992226	28
6527	26	f	\N	2025-12-11 21:34:50.992226	28
6528	27	f	\N	2025-12-11 21:34:50.992226	28
6529	28	f	\N	2025-12-11 21:34:50.992226	28
6530	29	f	\N	2025-12-11 21:34:50.992226	28
6531	30	f	\N	2025-12-11 21:34:50.992226	28
6532	31	f	\N	2025-12-11 21:34:50.992226	28
6533	32	f	\N	2025-12-11 21:34:50.992226	28
6534	33	f	\N	2025-12-11 21:34:50.992226	28
6535	34	f	\N	2025-12-11 21:34:50.992226	28
6536	35	f	\N	2025-12-11 21:34:50.992226	28
6537	36	f	\N	2025-12-11 21:34:50.992226	28
6538	37	f	\N	2025-12-11 21:34:50.992226	28
6539	38	f	\N	2025-12-11 21:34:50.992226	28
6540	39	f	\N	2025-12-11 21:34:50.992226	28
6541	40	f	\N	2025-12-11 21:34:50.992226	28
6542	41	f	\N	2025-12-11 21:34:50.992226	28
6543	42	f	\N	2025-12-11 21:34:50.992226	28
6544	43	f	\N	2025-12-11 21:34:50.992226	28
6545	44	f	\N	2025-12-11 21:34:50.992226	28
6546	45	f	\N	2025-12-11 21:34:50.992226	28
6547	46	f	\N	2025-12-11 21:34:50.992226	28
6548	47	f	\N	2025-12-11 21:34:50.992226	28
6549	48	f	\N	2025-12-11 21:34:50.992226	28
6550	49	f	\N	2025-12-11 21:34:50.992226	28
6551	50	f	\N	2025-12-11 21:34:50.992226	28
6552	51	f	\N	2025-12-11 21:34:50.992226	28
6553	52	f	\N	2025-12-11 21:34:50.992226	28
6554	53	f	\N	2025-12-11 21:34:50.992226	28
6555	54	f	\N	2025-12-11 21:34:50.992226	28
6556	55	f	\N	2025-12-11 21:34:50.992226	28
6557	56	f	\N	2025-12-11 21:34:50.992226	28
6558	57	f	\N	2025-12-11 21:34:50.992226	28
6559	58	f	\N	2025-12-11 21:34:50.992226	28
6560	59	f	\N	2025-12-11 21:34:50.992226	28
6561	60	f	\N	2025-12-11 21:34:50.992226	28
6562	61	f	\N	2025-12-11 21:34:50.992226	28
6563	62	f	\N	2025-12-11 21:34:50.992226	28
6564	63	f	\N	2025-12-11 21:34:50.992226	28
6565	64	f	\N	2025-12-11 21:34:50.992226	28
6566	65	f	\N	2025-12-11 21:34:50.992226	28
6567	66	f	\N	2025-12-11 21:34:50.992226	28
6568	67	f	\N	2025-12-11 21:34:50.992226	28
6569	68	f	\N	2025-12-11 21:34:50.992226	28
6570	69	f	\N	2025-12-11 21:34:50.992226	28
6571	70	f	\N	2025-12-11 21:34:50.992226	28
6572	71	f	\N	2025-12-11 21:34:50.992226	28
6573	72	f	\N	2025-12-11 21:34:50.992226	28
6574	73	f	\N	2025-12-11 21:34:50.992226	28
6575	74	f	\N	2025-12-11 21:34:50.992226	28
6576	75	f	\N	2025-12-11 21:34:50.992226	28
6577	76	f	\N	2025-12-11 21:34:50.992226	28
6578	77	f	\N	2025-12-11 21:34:50.992226	28
6579	78	f	\N	2025-12-11 21:34:50.992226	28
6580	79	f	\N	2025-12-11 21:34:50.992226	28
6581	80	f	\N	2025-12-11 21:34:50.992226	28
6582	81	f	\N	2025-12-11 21:34:50.992226	28
6583	82	f	\N	2025-12-11 21:34:50.992226	28
6584	83	f	\N	2025-12-11 21:34:50.992226	28
6585	84	f	\N	2025-12-11 21:34:50.992226	28
6586	85	f	\N	2025-12-11 21:34:50.992226	28
6587	86	f	\N	2025-12-11 21:34:50.992226	28
6588	87	f	\N	2025-12-11 21:34:50.992226	28
6589	88	f	\N	2025-12-11 21:34:50.992226	28
6590	89	f	\N	2025-12-11 21:34:50.992226	28
6591	90	f	\N	2025-12-11 21:34:50.992226	28
6592	91	f	\N	2025-12-11 21:34:50.992226	28
6593	92	f	\N	2025-12-11 21:34:50.992226	28
6594	93	f	\N	2025-12-11 21:34:50.992226	28
6595	94	f	\N	2025-12-11 21:34:50.992226	28
6596	95	f	\N	2025-12-11 21:34:50.992226	28
6597	96	f	\N	2025-12-11 21:34:50.992226	28
6598	97	f	\N	2025-12-11 21:34:50.992226	28
6599	98	f	\N	2025-12-11 21:34:50.992226	28
6600	99	f	\N	2025-12-11 21:34:50.992226	28
6601	100	f	\N	2025-12-11 21:34:50.992226	28
6602	101	f	\N	2025-12-11 21:34:50.992226	28
6603	102	f	\N	2025-12-11 21:34:50.992226	28
6604	103	f	\N	2025-12-11 21:34:50.992226	28
6605	104	f	\N	2025-12-11 21:34:50.992226	28
6606	105	f	\N	2025-12-11 21:34:50.992226	28
6607	106	f	\N	2025-12-11 21:34:50.992226	28
6608	107	f	\N	2025-12-11 21:34:50.992226	28
6609	108	f	\N	2025-12-11 21:34:50.992226	28
6610	109	f	\N	2025-12-11 21:34:50.992226	28
6611	110	f	\N	2025-12-11 21:34:50.992226	28
6612	111	f	\N	2025-12-11 21:34:50.992226	28
6613	112	f	\N	2025-12-11 21:34:50.992226	28
6614	113	f	\N	2025-12-11 21:34:50.992226	28
6615	114	f	\N	2025-12-11 21:34:50.992226	28
6616	115	f	\N	2025-12-11 21:34:50.992226	28
6617	116	f	\N	2025-12-11 21:34:50.992226	28
6618	117	f	\N	2025-12-11 21:34:50.992226	28
6619	118	f	\N	2025-12-11 21:34:50.992226	28
6620	119	f	\N	2025-12-11 21:34:50.992226	28
6621	120	f	\N	2025-12-11 21:34:50.992226	28
6622	121	f	\N	2025-12-11 21:34:50.992226	28
6623	122	f	\N	2025-12-11 21:34:50.992226	28
6624	123	f	\N	2025-12-11 21:34:50.992226	28
6625	124	f	\N	2025-12-11 21:34:50.992226	28
6626	125	f	\N	2025-12-11 21:34:50.992226	28
6627	126	f	\N	2025-12-11 21:34:50.992226	28
6628	127	f	\N	2025-12-11 21:34:50.992226	28
6629	128	f	\N	2025-12-11 21:34:50.992226	28
6630	129	f	\N	2025-12-11 21:34:50.992226	28
6631	130	f	\N	2025-12-11 21:34:50.992226	28
6632	131	f	\N	2025-12-11 21:34:50.992226	28
6633	132	f	\N	2025-12-11 21:34:50.992226	28
6634	133	f	\N	2025-12-11 21:34:50.992226	28
6635	134	f	\N	2025-12-11 21:34:50.992226	28
6636	135	f	\N	2025-12-11 21:34:50.992226	28
6637	136	f	\N	2025-12-11 21:34:50.992226	28
6638	137	f	\N	2025-12-11 21:34:50.992226	28
6639	138	f	\N	2025-12-11 21:34:50.992226	28
6640	139	f	\N	2025-12-11 21:34:50.992226	28
6641	140	f	\N	2025-12-11 21:34:50.992226	28
6642	141	f	\N	2025-12-11 21:34:50.992226	28
6643	142	f	\N	2025-12-11 21:34:50.992226	28
6644	143	f	\N	2025-12-11 21:34:50.992226	28
6645	144	f	\N	2025-12-11 21:34:50.992226	28
6646	145	f	\N	2025-12-11 21:34:50.992226	28
6647	146	f	\N	2025-12-11 21:34:50.992226	28
6648	147	f	\N	2025-12-11 21:34:50.992226	28
6649	148	f	\N	2025-12-11 21:34:50.992226	28
6650	149	f	\N	2025-12-11 21:34:50.992226	28
6651	150	f	\N	2025-12-11 21:34:50.992226	28
6652	151	f	\N	2025-12-11 21:34:50.992226	28
6653	152	f	\N	2025-12-11 21:34:50.992226	28
6654	153	f	\N	2025-12-11 21:34:50.992226	28
6655	154	f	\N	2025-12-11 21:34:50.992226	28
6656	155	f	\N	2025-12-11 21:34:50.992226	28
6657	156	f	\N	2025-12-11 21:34:50.992226	28
6658	157	f	\N	2025-12-11 21:34:50.992226	28
6659	158	f	\N	2025-12-11 21:34:50.992226	28
6660	159	f	\N	2025-12-11 21:34:50.992226	28
6661	160	f	\N	2025-12-11 21:34:50.992226	28
6662	161	f	\N	2025-12-11 21:34:50.992226	28
6663	162	f	\N	2025-12-11 21:34:50.992226	28
6664	163	f	\N	2025-12-11 21:34:50.992226	28
6665	164	f	\N	2025-12-11 21:34:50.992226	28
6666	165	f	\N	2025-12-11 21:34:50.992226	28
6667	166	f	\N	2025-12-11 21:34:50.992226	28
6668	167	f	\N	2025-12-11 21:34:50.992226	28
6669	168	f	\N	2025-12-11 21:34:50.992226	28
6670	169	f	\N	2025-12-11 21:34:50.992226	28
6671	170	f	\N	2025-12-11 21:34:50.992226	28
6672	171	f	\N	2025-12-11 21:34:50.992226	28
6673	172	f	\N	2025-12-11 21:34:50.992226	28
6674	173	f	\N	2025-12-11 21:34:50.992226	28
6675	174	f	\N	2025-12-11 21:34:50.992226	28
6676	175	f	\N	2025-12-11 21:34:50.992226	28
6677	176	f	\N	2025-12-11 21:34:50.992226	28
6678	177	f	\N	2025-12-11 21:34:50.992226	28
6679	178	f	\N	2025-12-11 21:34:50.992226	28
6680	179	f	\N	2025-12-11 21:34:50.992226	28
6681	180	f	\N	2025-12-11 21:34:50.992226	28
6682	181	f	\N	2025-12-11 21:34:50.992226	28
6683	182	f	\N	2025-12-11 21:34:50.992226	28
6684	183	f	\N	2025-12-11 21:34:50.992226	28
6685	184	f	\N	2025-12-11 21:34:50.992226	28
6686	185	f	\N	2025-12-11 21:34:50.992226	28
6687	186	f	\N	2025-12-11 21:34:50.992226	28
6688	187	f	\N	2025-12-11 21:34:50.992226	28
6689	188	f	\N	2025-12-11 21:34:50.992226	28
6690	189	f	\N	2025-12-11 21:34:50.992226	28
6691	190	f	\N	2025-12-11 21:34:50.992226	28
6692	191	f	\N	2025-12-11 21:34:50.992226	28
6693	192	f	\N	2025-12-11 21:34:50.992226	28
6694	193	f	\N	2025-12-11 21:34:50.992226	28
6695	194	f	\N	2025-12-11 21:34:50.992226	28
6696	195	f	\N	2025-12-11 21:34:50.992226	28
6697	196	f	\N	2025-12-11 21:34:50.992226	28
6698	197	f	\N	2025-12-11 21:34:50.992226	28
6699	198	f	\N	2025-12-11 21:34:50.992226	28
6700	199	f	\N	2025-12-11 21:34:50.992226	28
6701	200	f	\N	2025-12-11 21:34:50.992226	28
6702	201	f	\N	2025-12-11 21:34:50.992226	28
6703	202	f	\N	2025-12-11 21:34:50.992226	28
6704	203	f	\N	2025-12-11 21:34:50.992226	28
6705	204	f	\N	2025-12-11 21:34:50.992226	28
6706	205	f	\N	2025-12-11 21:34:50.992226	28
6707	206	f	\N	2025-12-11 21:34:50.992226	28
6708	207	f	\N	2025-12-11 21:34:50.992226	28
6709	208	f	\N	2025-12-11 21:34:50.992226	28
6710	209	f	\N	2025-12-11 21:34:50.992226	28
6711	210	f	\N	2025-12-11 21:34:50.992226	28
6712	211	f	\N	2025-12-11 21:34:50.992226	28
6713	212	f	\N	2025-12-11 21:34:50.992226	28
6714	213	f	\N	2025-12-11 21:34:50.992226	28
6715	214	f	\N	2025-12-11 21:34:50.992226	28
6716	215	f	\N	2025-12-11 21:34:50.992226	28
6717	216	f	\N	2025-12-11 21:34:50.992226	28
6718	217	f	\N	2025-12-11 21:34:50.992226	28
6719	218	f	\N	2025-12-11 21:34:50.992226	28
6720	219	f	\N	2025-12-11 21:34:50.992226	28
6721	220	f	\N	2025-12-11 21:34:50.992226	28
6722	221	f	\N	2025-12-11 21:34:50.992226	28
6723	222	f	\N	2025-12-11 21:34:50.992226	28
6724	223	f	\N	2025-12-11 21:34:50.992226	28
6725	224	f	\N	2025-12-11 21:34:50.992226	28
6726	225	f	\N	2025-12-11 21:34:50.992226	28
6727	226	f	\N	2025-12-11 21:34:50.992226	28
6728	227	f	\N	2025-12-11 21:34:50.992226	28
6729	228	f	\N	2025-12-11 21:34:50.992226	28
6730	229	f	\N	2025-12-11 21:34:50.992226	28
6731	230	f	\N	2025-12-11 21:34:50.992226	28
6732	231	f	\N	2025-12-11 21:34:50.992226	28
6733	232	f	\N	2025-12-11 21:34:50.992226	28
6734	233	f	\N	2025-12-11 21:34:50.992226	28
6735	234	f	\N	2025-12-11 21:34:50.992226	28
6736	235	f	\N	2025-12-11 21:34:50.992226	28
6737	236	f	\N	2025-12-11 21:34:50.992226	28
6738	237	f	\N	2025-12-11 21:34:50.992226	28
6739	238	f	\N	2025-12-11 21:34:50.992226	28
6740	239	f	\N	2025-12-11 21:34:50.992226	28
6741	240	f	\N	2025-12-11 21:34:50.992226	28
6742	241	f	\N	2025-12-11 21:34:50.992226	28
6743	242	f	\N	2025-12-11 21:34:50.992226	28
6744	243	f	\N	2025-12-11 21:34:50.992226	28
6745	244	f	\N	2025-12-11 21:34:50.992226	28
6746	245	f	\N	2025-12-11 21:34:50.992226	28
6747	246	f	\N	2025-12-11 21:34:50.992226	28
6748	247	f	\N	2025-12-11 21:34:50.992226	28
6749	248	f	\N	2025-12-11 21:34:50.992226	28
6750	249	f	\N	2025-12-11 21:34:50.992226	28
6751	250	f	\N	2025-12-11 21:34:50.992226	28
6752	251	f	\N	2025-12-11 21:34:50.992226	28
6753	252	f	\N	2025-12-11 21:34:50.992226	28
6754	253	f	\N	2025-12-11 21:34:50.992226	28
6755	254	f	\N	2025-12-11 21:34:50.992226	28
6756	255	f	\N	2025-12-11 21:34:50.992226	28
6757	256	f	\N	2025-12-11 21:34:50.992226	28
6758	257	f	\N	2025-12-11 21:34:50.992226	28
6759	258	f	\N	2025-12-11 21:34:50.992226	28
6760	259	f	\N	2025-12-11 21:34:50.992226	28
6761	260	f	\N	2025-12-11 21:34:50.992226	28
6762	261	f	\N	2025-12-11 21:34:50.992226	28
6763	262	f	\N	2025-12-11 21:34:50.992226	28
6764	263	f	\N	2025-12-11 21:34:50.992226	28
6765	264	f	\N	2025-12-11 21:34:50.992226	28
6766	265	f	\N	2025-12-11 21:34:50.992226	28
6767	266	f	\N	2025-12-11 21:34:50.992226	28
6768	267	f	\N	2025-12-11 21:34:50.992226	28
6769	268	f	\N	2025-12-11 21:34:50.992226	28
6770	269	f	\N	2025-12-11 21:34:50.992226	28
6771	270	f	\N	2025-12-11 21:34:50.992226	28
6772	271	f	\N	2025-12-11 21:34:50.992226	28
6773	272	f	\N	2025-12-11 21:34:50.992226	28
6774	273	f	\N	2025-12-11 21:34:50.992226	28
6775	274	f	\N	2025-12-11 21:34:50.992226	28
6776	275	f	\N	2025-12-11 21:34:50.992226	28
6777	276	f	\N	2025-12-11 21:34:50.992226	28
6778	277	f	\N	2025-12-11 21:34:50.992226	28
6779	278	f	\N	2025-12-11 21:34:50.992226	28
6780	279	f	\N	2025-12-11 21:34:50.992226	28
6781	280	f	\N	2025-12-11 21:34:50.992226	28
6782	281	f	\N	2025-12-11 21:34:50.992226	28
6783	282	f	\N	2025-12-11 21:34:50.992226	28
6784	283	f	\N	2025-12-11 21:34:50.992226	28
6785	284	f	\N	2025-12-11 21:34:50.992226	28
6786	285	f	\N	2025-12-11 21:34:50.992226	28
6787	286	f	\N	2025-12-11 21:34:50.992226	28
6788	287	f	\N	2025-12-11 21:34:50.992226	28
6789	288	f	\N	2025-12-11 21:34:50.992226	28
6790	289	f	\N	2025-12-11 21:34:50.992226	28
6791	290	f	\N	2025-12-11 21:34:50.992226	28
6792	291	f	\N	2025-12-11 21:34:50.992226	28
6793	292	f	\N	2025-12-11 21:34:50.992226	28
6794	293	f	\N	2025-12-11 21:34:50.992226	28
6795	294	f	\N	2025-12-11 21:34:50.992226	28
6796	295	f	\N	2025-12-11 21:34:50.992226	28
6797	296	f	\N	2025-12-11 21:34:50.992226	28
6798	297	f	\N	2025-12-11 21:34:50.992226	28
6799	298	f	\N	2025-12-11 21:34:50.992226	28
6800	299	f	\N	2025-12-11 21:34:50.992226	28
6801	300	f	\N	2025-12-11 21:34:50.992226	28
6802	301	f	\N	2025-12-11 21:34:50.992226	28
6803	302	f	\N	2025-12-11 21:34:50.992226	28
6804	303	f	\N	2025-12-11 21:34:50.992226	28
6805	304	f	\N	2025-12-11 21:34:50.992226	28
6806	305	f	\N	2025-12-11 21:34:50.992226	28
6807	306	f	\N	2025-12-11 21:34:50.992226	28
6808	307	f	\N	2025-12-11 21:34:50.992226	28
6809	308	f	\N	2025-12-11 21:34:50.992226	28
6810	309	f	\N	2025-12-11 21:34:50.992226	28
6811	310	f	\N	2025-12-11 21:34:50.992226	28
6812	311	f	\N	2025-12-11 21:34:50.992226	28
6813	312	f	\N	2025-12-11 21:34:50.992226	28
6814	313	f	\N	2025-12-11 21:34:50.992226	28
6815	314	f	\N	2025-12-11 21:34:50.992226	28
6816	315	f	\N	2025-12-11 21:34:50.992226	28
6817	316	f	\N	2025-12-11 21:34:50.992226	28
6818	317	f	\N	2025-12-11 21:34:50.992226	28
6819	318	f	\N	2025-12-11 21:34:50.992226	28
6820	319	f	\N	2025-12-11 21:34:50.992226	28
6821	320	f	\N	2025-12-11 21:34:50.992226	28
6822	321	f	\N	2025-12-11 21:34:50.992226	28
6823	322	f	\N	2025-12-11 21:34:50.992226	28
6824	323	f	\N	2025-12-11 21:34:50.992226	28
6825	324	f	\N	2025-12-11 21:34:50.992226	28
6826	325	f	\N	2025-12-11 21:34:50.992226	28
6827	326	f	\N	2025-12-11 21:34:50.992226	28
6828	327	f	\N	2025-12-11 21:34:50.992226	28
6829	328	f	\N	2025-12-11 21:34:50.992226	28
6830	329	f	\N	2025-12-11 21:34:50.992226	28
6831	330	f	\N	2025-12-11 21:34:50.992226	28
6832	331	f	\N	2025-12-11 21:34:50.992226	28
6833	332	f	\N	2025-12-11 21:34:50.992226	28
6834	333	f	\N	2025-12-11 21:34:50.992226	28
6835	334	f	\N	2025-12-11 21:34:50.992226	28
6836	335	f	\N	2025-12-11 21:34:50.992226	28
6837	336	f	\N	2025-12-11 21:34:50.992226	28
6838	337	f	\N	2025-12-11 21:34:50.992226	28
6839	338	f	\N	2025-12-11 21:34:50.992226	28
6840	339	f	\N	2025-12-11 21:34:50.992226	28
6841	340	f	\N	2025-12-11 21:34:50.992226	28
6842	341	f	\N	2025-12-11 21:34:50.992226	28
6843	342	f	\N	2025-12-11 21:34:50.992226	28
6844	343	f	\N	2025-12-11 21:34:50.992226	28
6845	344	f	\N	2025-12-11 21:34:50.992226	28
6846	345	f	\N	2025-12-11 21:34:50.992226	28
6847	346	f	\N	2025-12-11 21:34:50.992226	28
6848	347	f	\N	2025-12-11 21:34:50.992226	28
6849	348	f	\N	2025-12-11 21:34:50.992226	28
6850	349	f	\N	2025-12-11 21:34:50.992226	28
6851	350	f	\N	2025-12-11 21:34:50.992226	28
6852	351	f	\N	2025-12-11 21:34:50.992226	28
6853	352	f	\N	2025-12-11 21:34:50.992226	28
6854	353	f	\N	2025-12-11 21:34:50.992226	28
6855	354	f	\N	2025-12-11 21:34:50.992226	28
6856	355	f	\N	2025-12-11 21:34:50.992226	28
6857	356	f	\N	2025-12-11 21:34:50.992226	28
6858	357	f	\N	2025-12-11 21:34:50.992226	28
6859	358	f	\N	2025-12-11 21:34:50.992226	28
6860	359	f	\N	2025-12-11 21:34:50.992226	28
6861	360	f	\N	2025-12-11 21:34:50.992226	28
6862	361	f	\N	2025-12-11 21:34:50.992226	28
6863	362	f	\N	2025-12-11 21:34:50.992226	28
6864	363	f	\N	2025-12-11 21:34:50.992226	28
6865	364	f	\N	2025-12-11 21:34:50.992226	28
6866	365	f	\N	2025-12-11 21:34:50.992226	28
6867	366	f	\N	2025-12-11 21:34:50.992226	28
6868	367	f	\N	2025-12-11 21:34:50.992226	28
6869	368	f	\N	2025-12-11 21:34:50.992226	28
6870	369	f	\N	2025-12-11 21:34:50.992226	28
6871	370	f	\N	2025-12-11 21:34:50.992226	28
6872	371	f	\N	2025-12-11 21:34:50.992226	28
6873	372	f	\N	2025-12-11 21:34:50.992226	28
6874	373	f	\N	2025-12-11 21:34:50.992226	28
6875	374	f	\N	2025-12-11 21:34:50.992226	28
6876	375	f	\N	2025-12-11 21:34:50.992226	28
6877	376	f	\N	2025-12-11 21:34:50.992226	28
6878	377	f	\N	2025-12-11 21:34:50.992226	28
6879	378	f	\N	2025-12-11 21:34:50.992226	28
6880	379	f	\N	2025-12-11 21:34:50.992226	28
6881	380	f	\N	2025-12-11 21:34:50.992226	28
6882	381	f	\N	2025-12-11 21:34:50.992226	28
6883	382	f	\N	2025-12-11 21:34:50.992226	28
6884	383	f	\N	2025-12-11 21:34:50.992226	28
6885	384	f	\N	2025-12-11 21:34:50.992226	28
6886	385	f	\N	2025-12-11 21:34:50.992226	28
6887	386	f	\N	2025-12-11 21:34:50.992226	28
6888	387	f	\N	2025-12-11 21:34:50.992226	28
6889	388	f	\N	2025-12-11 21:34:50.992226	28
6890	389	f	\N	2025-12-11 21:34:50.992226	28
6891	390	f	\N	2025-12-11 21:34:50.992226	28
6892	391	f	\N	2025-12-11 21:34:50.992226	28
6893	392	f	\N	2025-12-11 21:34:50.992226	28
6894	393	f	\N	2025-12-11 21:34:50.992226	28
6895	394	f	\N	2025-12-11 21:34:50.992226	28
6896	395	f	\N	2025-12-11 21:34:50.992226	28
6897	396	f	\N	2025-12-11 21:34:50.992226	28
6898	397	f	\N	2025-12-11 21:34:50.992226	28
6899	398	f	\N	2025-12-11 21:34:50.992226	28
6900	399	f	\N	2025-12-11 21:34:50.992226	28
6901	400	f	\N	2025-12-11 21:34:50.992226	28
6902	401	f	\N	2025-12-11 21:34:50.992226	28
6903	402	f	\N	2025-12-11 21:34:50.992226	28
6904	403	f	\N	2025-12-11 21:34:50.992226	28
6905	404	f	\N	2025-12-11 21:34:50.992226	28
6906	405	f	\N	2025-12-11 21:34:50.992226	28
6907	406	f	\N	2025-12-11 21:34:50.992226	28
6908	407	f	\N	2025-12-11 21:34:50.992226	28
6909	408	f	\N	2025-12-11 21:34:50.992226	28
6910	409	f	\N	2025-12-11 21:34:50.992226	28
6911	410	f	\N	2025-12-11 21:34:50.992226	28
6912	411	f	\N	2025-12-11 21:34:50.992226	28
6913	412	f	\N	2025-12-11 21:34:50.992226	28
6914	413	f	\N	2025-12-11 21:34:50.992226	28
6915	414	f	\N	2025-12-11 21:34:50.992226	28
6916	415	f	\N	2025-12-11 21:34:50.992226	28
6917	416	f	\N	2025-12-11 21:34:50.992226	28
6918	417	f	\N	2025-12-11 21:34:50.992226	28
6919	418	f	\N	2025-12-11 21:34:50.992226	28
6920	419	f	\N	2025-12-11 21:34:50.992226	28
6921	420	f	\N	2025-12-11 21:34:50.992226	28
6922	421	f	\N	2025-12-11 21:34:50.992226	28
6923	422	f	\N	2025-12-11 21:34:50.992226	28
6924	423	f	\N	2025-12-11 21:34:50.992226	28
6925	424	f	\N	2025-12-11 21:34:50.992226	28
6926	425	f	\N	2025-12-11 21:34:50.992226	28
6927	426	f	\N	2025-12-11 21:34:50.992226	28
6928	427	f	\N	2025-12-11 21:34:50.992226	28
6929	428	f	\N	2025-12-11 21:34:50.992226	28
6930	429	f	\N	2025-12-11 21:34:50.992226	28
6931	430	f	\N	2025-12-11 21:34:50.992226	28
6932	431	f	\N	2025-12-11 21:34:50.992226	28
6933	432	f	\N	2025-12-11 21:34:50.992226	28
6934	433	f	\N	2025-12-11 21:34:50.992226	28
6935	434	f	\N	2025-12-11 21:34:50.992226	28
6936	435	f	\N	2025-12-11 21:34:50.992226	28
6937	436	f	\N	2025-12-11 21:34:50.992226	28
6938	437	f	\N	2025-12-11 21:34:50.992226	28
6939	438	f	\N	2025-12-11 21:34:50.992226	28
6940	439	f	\N	2025-12-11 21:34:50.992226	28
6941	440	f	\N	2025-12-11 21:34:50.992226	28
6942	441	f	\N	2025-12-11 21:34:50.992226	28
6943	442	f	\N	2025-12-11 21:34:50.992226	28
6944	443	f	\N	2025-12-11 21:34:50.992226	28
6945	444	f	\N	2025-12-11 21:34:50.992226	28
6946	445	f	\N	2025-12-11 21:34:50.992226	28
6947	446	f	\N	2025-12-11 21:34:50.992226	28
6948	447	f	\N	2025-12-11 21:34:50.992226	28
6949	448	f	\N	2025-12-11 21:34:50.992226	28
6950	449	f	\N	2025-12-11 21:34:50.992226	28
6951	450	f	\N	2025-12-11 21:34:50.992226	28
6952	451	f	\N	2025-12-11 21:34:50.992226	28
6953	452	f	\N	2025-12-11 21:34:50.992226	28
6954	453	f	\N	2025-12-11 21:34:50.992226	28
6955	454	f	\N	2025-12-11 21:34:50.992226	28
6956	455	f	\N	2025-12-11 21:34:50.992226	28
6957	456	f	\N	2025-12-11 21:34:50.992226	28
6958	457	f	\N	2025-12-11 21:34:50.992226	28
6959	458	f	\N	2025-12-11 21:34:50.992226	28
6960	459	f	\N	2025-12-11 21:34:50.992226	28
6961	460	f	\N	2025-12-11 21:34:50.992226	28
6962	461	f	\N	2025-12-11 21:34:50.992226	28
6963	462	f	\N	2025-12-11 21:34:50.992226	28
6964	463	f	\N	2025-12-11 21:34:50.992226	28
6965	464	f	\N	2025-12-11 21:34:50.992226	28
6966	465	f	\N	2025-12-11 21:34:50.992226	28
6967	466	f	\N	2025-12-11 21:34:50.992226	28
6968	467	f	\N	2025-12-11 21:34:50.992226	28
6969	468	f	\N	2025-12-11 21:34:50.992226	28
6970	469	f	\N	2025-12-11 21:34:50.992226	28
6971	470	f	\N	2025-12-11 21:34:50.992226	28
6972	471	f	\N	2025-12-11 21:34:50.992226	28
6973	472	f	\N	2025-12-11 21:34:50.992226	28
6974	473	f	\N	2025-12-11 21:34:50.992226	28
6975	474	f	\N	2025-12-11 21:34:50.992226	28
6976	475	f	\N	2025-12-11 21:34:50.992226	28
6977	476	f	\N	2025-12-11 21:34:50.992226	28
6978	477	f	\N	2025-12-11 21:34:50.992226	28
6979	478	f	\N	2025-12-11 21:34:50.992226	28
6980	479	f	\N	2025-12-11 21:34:50.992226	28
6981	480	f	\N	2025-12-11 21:34:50.992226	28
6982	481	f	\N	2025-12-11 21:34:50.992226	28
6983	482	f	\N	2025-12-11 21:34:50.992226	28
6984	483	f	\N	2025-12-11 21:34:50.992226	28
6985	484	f	\N	2025-12-11 21:34:50.992226	28
6986	485	f	\N	2025-12-11 21:34:50.992226	28
6987	486	f	\N	2025-12-11 21:34:50.992226	28
6988	487	f	\N	2025-12-11 21:34:50.992226	28
6989	488	f	\N	2025-12-11 21:34:50.992226	28
6990	489	f	\N	2025-12-11 21:34:50.992226	28
6991	490	f	\N	2025-12-11 21:34:50.992226	28
6992	491	f	\N	2025-12-11 21:34:50.992226	28
6993	492	f	\N	2025-12-11 21:34:50.992226	28
6994	493	f	\N	2025-12-11 21:34:50.992226	28
6995	494	f	\N	2025-12-11 21:34:50.992226	28
6996	495	f	\N	2025-12-11 21:34:50.992226	28
6997	496	f	\N	2025-12-11 21:34:50.992226	28
6998	497	f	\N	2025-12-11 21:34:50.992226	28
6999	498	f	\N	2025-12-11 21:34:50.992226	28
7000	499	f	\N	2025-12-11 21:34:50.992226	28
7001	500	f	\N	2025-12-11 21:34:50.992226	28
6511	10	f	\N	2025-12-11 21:34:50.992226	28
15504	3	f	\N	2026-01-12 08:14:17.864053	49
15505	4	f	\N	2026-01-12 08:14:17.864053	49
15506	5	f	\N	2026-01-12 08:14:17.864053	49
15507	6	f	\N	2026-01-12 08:14:17.864053	49
6017	16	t	167	2025-12-11 13:56:47.758777	27
15508	7	f	\N	2026-01-12 08:14:17.864053	49
15509	8	f	\N	2026-01-12 08:14:17.864053	49
15510	9	f	\N	2026-01-12 08:14:17.864053	49
15511	10	f	\N	2026-01-12 08:14:17.864053	49
15512	11	f	\N	2026-01-12 08:14:17.864053	49
15513	12	f	\N	2026-01-12 08:14:17.864053	49
15514	13	f	\N	2026-01-12 08:14:17.864053	49
15515	14	f	\N	2026-01-12 08:14:17.864053	49
15516	15	f	\N	2026-01-12 08:14:17.864053	49
15517	16	f	\N	2026-01-12 08:14:17.864053	49
15518	17	f	\N	2026-01-12 08:14:17.864053	49
15519	18	f	\N	2026-01-12 08:14:17.864053	49
15520	19	f	\N	2026-01-12 08:14:17.864053	49
15521	20	f	\N	2026-01-12 08:14:17.864053	49
15522	21	f	\N	2026-01-12 08:14:17.864053	49
15523	22	f	\N	2026-01-12 08:14:17.864053	49
15524	23	f	\N	2026-01-12 08:14:17.864053	49
15525	24	f	\N	2026-01-12 08:14:17.864053	49
15526	25	f	\N	2026-01-12 08:14:17.864053	49
15527	26	f	\N	2026-01-12 08:14:17.864053	49
15528	27	f	\N	2026-01-12 08:14:17.864053	49
15529	28	f	\N	2026-01-12 08:14:17.864053	49
15530	29	f	\N	2026-01-12 08:14:17.864053	49
15531	30	f	\N	2026-01-12 08:14:17.864053	49
15532	31	f	\N	2026-01-12 08:14:17.864053	49
15533	32	f	\N	2026-01-12 08:14:17.864053	49
15534	33	f	\N	2026-01-12 08:14:17.864053	49
15535	34	f	\N	2026-01-12 08:14:17.864053	49
15536	35	f	\N	2026-01-12 08:14:17.864053	49
15537	36	f	\N	2026-01-12 08:14:17.864053	49
15538	37	f	\N	2026-01-12 08:14:17.864053	49
15539	38	f	\N	2026-01-12 08:14:17.864053	49
15540	39	f	\N	2026-01-12 08:14:17.864053	49
15541	40	f	\N	2026-01-12 08:14:17.864053	49
15542	41	f	\N	2026-01-12 08:14:17.864053	49
15543	42	f	\N	2026-01-12 08:14:17.864053	49
15544	43	f	\N	2026-01-12 08:14:17.864053	49
15545	44	f	\N	2026-01-12 08:14:17.864053	49
15546	45	f	\N	2026-01-12 08:14:17.864053	49
15547	46	f	\N	2026-01-12 08:14:17.864053	49
15548	47	f	\N	2026-01-12 08:14:17.864053	49
15549	48	f	\N	2026-01-12 08:14:17.864053	49
15550	49	f	\N	2026-01-12 08:14:17.864053	49
15551	50	f	\N	2026-01-12 08:14:17.864053	49
15552	51	f	\N	2026-01-12 08:14:17.864053	49
15553	52	f	\N	2026-01-12 08:14:17.864053	49
15554	53	f	\N	2026-01-12 08:14:17.864053	49
15555	54	f	\N	2026-01-12 08:14:17.864053	49
15556	55	f	\N	2026-01-12 08:14:17.864053	49
15557	56	f	\N	2026-01-12 08:14:17.864053	49
15558	57	f	\N	2026-01-12 08:14:17.864053	49
15559	58	f	\N	2026-01-12 08:14:17.864053	49
15560	59	f	\N	2026-01-12 08:14:17.864053	49
15561	60	f	\N	2026-01-12 08:14:17.864053	49
15562	61	f	\N	2026-01-12 08:14:17.864053	49
15563	62	f	\N	2026-01-12 08:14:17.864053	49
15564	63	f	\N	2026-01-12 08:14:17.864053	49
15565	64	f	\N	2026-01-12 08:14:17.864053	49
15566	65	f	\N	2026-01-12 08:14:17.864053	49
15567	66	f	\N	2026-01-12 08:14:17.864053	49
15568	67	f	\N	2026-01-12 08:14:17.864053	49
15569	68	f	\N	2026-01-12 08:14:17.864053	49
15570	69	f	\N	2026-01-12 08:14:17.864053	49
15571	70	f	\N	2026-01-12 08:14:17.864053	49
15572	71	f	\N	2026-01-12 08:14:17.864053	49
15573	72	f	\N	2026-01-12 08:14:17.864053	49
15574	73	f	\N	2026-01-12 08:14:17.864053	49
15575	74	f	\N	2026-01-12 08:14:17.864053	49
15576	75	f	\N	2026-01-12 08:14:17.864053	49
15577	76	f	\N	2026-01-12 08:14:17.864053	49
15578	77	f	\N	2026-01-12 08:14:17.864053	49
15579	78	f	\N	2026-01-12 08:14:17.864053	49
15580	79	f	\N	2026-01-12 08:14:17.864053	49
15581	80	f	\N	2026-01-12 08:14:17.864053	49
15582	81	f	\N	2026-01-12 08:14:17.864053	49
15583	82	f	\N	2026-01-12 08:14:17.864053	49
15584	83	f	\N	2026-01-12 08:14:17.864053	49
15585	84	f	\N	2026-01-12 08:14:17.864053	49
15586	85	f	\N	2026-01-12 08:14:17.864053	49
15587	86	f	\N	2026-01-12 08:14:17.864053	49
15588	87	f	\N	2026-01-12 08:14:17.864053	49
15589	88	f	\N	2026-01-12 08:14:17.864053	49
15590	89	f	\N	2026-01-12 08:14:17.864053	49
15591	90	f	\N	2026-01-12 08:14:17.864053	49
15592	91	f	\N	2026-01-12 08:14:17.864053	49
15593	92	f	\N	2026-01-12 08:14:17.864053	49
15594	93	f	\N	2026-01-12 08:14:17.864053	49
15595	94	f	\N	2026-01-12 08:14:17.864053	49
15596	95	f	\N	2026-01-12 08:14:17.864053	49
15597	96	f	\N	2026-01-12 08:14:17.864053	49
15598	97	f	\N	2026-01-12 08:14:17.864053	49
15599	98	f	\N	2026-01-12 08:14:17.864053	49
15600	99	f	\N	2026-01-12 08:14:17.864053	49
15601	100	f	\N	2026-01-12 08:14:17.864053	49
15602	101	f	\N	2026-01-12 08:14:17.864053	49
15603	102	f	\N	2026-01-12 08:14:17.864053	49
15604	103	f	\N	2026-01-12 08:14:17.864053	49
15605	104	f	\N	2026-01-12 08:14:17.864053	49
15606	105	f	\N	2026-01-12 08:14:17.864053	49
15607	106	f	\N	2026-01-12 08:14:17.864053	49
15608	107	f	\N	2026-01-12 08:14:17.864053	49
15609	108	f	\N	2026-01-12 08:14:17.864053	49
15610	109	f	\N	2026-01-12 08:14:17.864053	49
15611	110	f	\N	2026-01-12 08:14:17.864053	49
15612	111	f	\N	2026-01-12 08:14:17.864053	49
15613	112	f	\N	2026-01-12 08:14:17.864053	49
15614	113	f	\N	2026-01-12 08:14:17.864053	49
15615	114	f	\N	2026-01-12 08:14:17.864053	49
15616	115	f	\N	2026-01-12 08:14:17.864053	49
15617	116	f	\N	2026-01-12 08:14:17.864053	49
15618	117	f	\N	2026-01-12 08:14:17.864053	49
15619	118	f	\N	2026-01-12 08:14:17.864053	49
15620	119	f	\N	2026-01-12 08:14:17.864053	49
15621	120	f	\N	2026-01-12 08:14:17.864053	49
15622	121	f	\N	2026-01-12 08:14:17.864053	49
15623	122	f	\N	2026-01-12 08:14:17.864053	49
15624	123	f	\N	2026-01-12 08:14:17.864053	49
15625	124	f	\N	2026-01-12 08:14:17.864053	49
15626	125	f	\N	2026-01-12 08:14:17.864053	49
15627	126	f	\N	2026-01-12 08:14:17.864053	49
15628	127	f	\N	2026-01-12 08:14:17.864053	49
15629	128	f	\N	2026-01-12 08:14:17.864053	49
15630	129	f	\N	2026-01-12 08:14:17.864053	49
15631	130	f	\N	2026-01-12 08:14:17.864053	49
15632	131	f	\N	2026-01-12 08:14:17.864053	49
15633	132	f	\N	2026-01-12 08:14:17.864053	49
15634	133	f	\N	2026-01-12 08:14:17.864053	49
15635	134	f	\N	2026-01-12 08:14:17.864053	49
15636	135	f	\N	2026-01-12 08:14:17.864053	49
15637	136	f	\N	2026-01-12 08:14:17.864053	49
15638	137	f	\N	2026-01-12 08:14:17.864053	49
15639	138	f	\N	2026-01-12 08:14:17.864053	49
15640	139	f	\N	2026-01-12 08:14:17.864053	49
15641	140	f	\N	2026-01-12 08:14:17.864053	49
15642	141	f	\N	2026-01-12 08:14:17.864053	49
15643	142	f	\N	2026-01-12 08:14:17.864053	49
15644	143	f	\N	2026-01-12 08:14:17.864053	49
15645	144	f	\N	2026-01-12 08:14:17.864053	49
15646	145	f	\N	2026-01-12 08:14:17.864053	49
15647	146	f	\N	2026-01-12 08:14:17.864053	49
15648	147	f	\N	2026-01-12 08:14:17.864053	49
15649	148	f	\N	2026-01-12 08:14:17.864053	49
15650	149	f	\N	2026-01-12 08:14:17.864053	49
15651	150	f	\N	2026-01-12 08:14:17.864053	49
15652	151	f	\N	2026-01-12 08:14:17.864053	49
15653	152	f	\N	2026-01-12 08:14:17.864053	49
15654	153	f	\N	2026-01-12 08:14:17.864053	49
15655	154	f	\N	2026-01-12 08:14:17.864053	49
15656	155	f	\N	2026-01-12 08:14:17.864053	49
15657	156	f	\N	2026-01-12 08:14:17.864053	49
15658	157	f	\N	2026-01-12 08:14:17.864053	49
15659	158	f	\N	2026-01-12 08:14:17.864053	49
15660	159	f	\N	2026-01-12 08:14:17.864053	49
15661	160	f	\N	2026-01-12 08:14:17.864053	49
15662	161	f	\N	2026-01-12 08:14:17.864053	49
15663	162	f	\N	2026-01-12 08:14:17.864053	49
15664	163	f	\N	2026-01-12 08:14:17.864053	49
15665	164	f	\N	2026-01-12 08:14:17.864053	49
15666	165	f	\N	2026-01-12 08:14:17.864053	49
15667	166	f	\N	2026-01-12 08:14:17.864053	49
15668	167	f	\N	2026-01-12 08:14:17.864053	49
15669	168	f	\N	2026-01-12 08:14:17.864053	49
15670	169	f	\N	2026-01-12 08:14:17.864053	49
15671	170	f	\N	2026-01-12 08:14:17.864053	49
15672	171	f	\N	2026-01-12 08:14:17.864053	49
15673	172	f	\N	2026-01-12 08:14:17.864053	49
15674	173	f	\N	2026-01-12 08:14:17.864053	49
15675	174	f	\N	2026-01-12 08:14:17.864053	49
15676	175	f	\N	2026-01-12 08:14:17.864053	49
15677	176	f	\N	2026-01-12 08:14:17.864053	49
15678	177	f	\N	2026-01-12 08:14:17.864053	49
15679	178	f	\N	2026-01-12 08:14:17.864053	49
15680	179	f	\N	2026-01-12 08:14:17.864053	49
15681	180	f	\N	2026-01-12 08:14:17.864053	49
15682	181	f	\N	2026-01-12 08:14:17.864053	49
15683	182	f	\N	2026-01-12 08:14:17.864053	49
15684	183	f	\N	2026-01-12 08:14:17.864053	49
15685	184	f	\N	2026-01-12 08:14:17.864053	49
15686	185	f	\N	2026-01-12 08:14:17.864053	49
15687	186	f	\N	2026-01-12 08:14:17.864053	49
15688	187	f	\N	2026-01-12 08:14:17.864053	49
15689	188	f	\N	2026-01-12 08:14:17.864053	49
15690	189	f	\N	2026-01-12 08:14:17.864053	49
15691	190	f	\N	2026-01-12 08:14:17.864053	49
15692	191	f	\N	2026-01-12 08:14:17.864053	49
15693	192	f	\N	2026-01-12 08:14:17.864053	49
15694	193	f	\N	2026-01-12 08:14:17.864053	49
15695	194	f	\N	2026-01-12 08:14:17.864053	49
15696	195	f	\N	2026-01-12 08:14:17.864053	49
15697	196	f	\N	2026-01-12 08:14:17.864053	49
15698	197	f	\N	2026-01-12 08:14:17.864053	49
15699	198	f	\N	2026-01-12 08:14:17.864053	49
15700	199	f	\N	2026-01-12 08:14:17.864053	49
15701	200	f	\N	2026-01-12 08:14:17.864053	49
15702	201	f	\N	2026-01-12 08:14:17.864053	49
15703	202	f	\N	2026-01-12 08:14:17.864053	49
15704	203	f	\N	2026-01-12 08:14:17.864053	49
15705	204	f	\N	2026-01-12 08:14:17.864053	49
15706	205	f	\N	2026-01-12 08:14:17.864053	49
15707	206	f	\N	2026-01-12 08:14:17.864053	49
15708	207	f	\N	2026-01-12 08:14:17.864053	49
15709	208	f	\N	2026-01-12 08:14:17.864053	49
15710	209	f	\N	2026-01-12 08:14:17.864053	49
15711	210	f	\N	2026-01-12 08:14:17.864053	49
15712	211	f	\N	2026-01-12 08:14:17.864053	49
15713	212	f	\N	2026-01-12 08:14:17.864053	49
15714	213	f	\N	2026-01-12 08:14:17.864053	49
15715	214	f	\N	2026-01-12 08:14:17.864053	49
15716	215	f	\N	2026-01-12 08:14:17.864053	49
15717	216	f	\N	2026-01-12 08:14:17.864053	49
15718	217	f	\N	2026-01-12 08:14:17.864053	49
15719	218	f	\N	2026-01-12 08:14:17.864053	49
15720	219	f	\N	2026-01-12 08:14:17.864053	49
15721	220	f	\N	2026-01-12 08:14:17.864053	49
15722	221	f	\N	2026-01-12 08:14:17.864053	49
15723	222	f	\N	2026-01-12 08:14:17.864053	49
15724	223	f	\N	2026-01-12 08:14:17.864053	49
15725	224	f	\N	2026-01-12 08:14:17.864053	49
15726	225	f	\N	2026-01-12 08:14:17.864053	49
15727	226	f	\N	2026-01-12 08:14:17.864053	49
15728	227	f	\N	2026-01-12 08:14:17.864053	49
15729	228	f	\N	2026-01-12 08:14:17.864053	49
15730	229	f	\N	2026-01-12 08:14:17.864053	49
15731	230	f	\N	2026-01-12 08:14:17.864053	49
15732	231	f	\N	2026-01-12 08:14:17.864053	49
15733	232	f	\N	2026-01-12 08:14:17.864053	49
15734	233	f	\N	2026-01-12 08:14:17.864053	49
15735	234	f	\N	2026-01-12 08:14:17.864053	49
15736	235	f	\N	2026-01-12 08:14:17.864053	49
15737	236	f	\N	2026-01-12 08:14:17.864053	49
15738	237	f	\N	2026-01-12 08:14:17.864053	49
15739	238	f	\N	2026-01-12 08:14:17.864053	49
15740	239	f	\N	2026-01-12 08:14:17.864053	49
15741	240	f	\N	2026-01-12 08:14:17.864053	49
15742	241	f	\N	2026-01-12 08:14:17.864053	49
15743	242	f	\N	2026-01-12 08:14:17.864053	49
15744	243	f	\N	2026-01-12 08:14:17.864053	49
15745	244	f	\N	2026-01-12 08:14:17.864053	49
15746	245	f	\N	2026-01-12 08:14:17.864053	49
15747	246	f	\N	2026-01-12 08:14:17.864053	49
15748	247	f	\N	2026-01-12 08:14:17.864053	49
15749	248	f	\N	2026-01-12 08:14:17.864053	49
15750	249	f	\N	2026-01-12 08:14:17.864053	49
15751	250	f	\N	2026-01-12 08:14:17.864053	49
15752	251	f	\N	2026-01-12 08:14:17.864053	49
15753	252	f	\N	2026-01-12 08:14:17.864053	49
15754	253	f	\N	2026-01-12 08:14:17.864053	49
15755	254	f	\N	2026-01-12 08:14:17.864053	49
15756	255	f	\N	2026-01-12 08:14:17.864053	49
15757	256	f	\N	2026-01-12 08:14:17.864053	49
15758	257	f	\N	2026-01-12 08:14:17.864053	49
15759	258	f	\N	2026-01-12 08:14:17.864053	49
15760	259	f	\N	2026-01-12 08:14:17.864053	49
15761	260	f	\N	2026-01-12 08:14:17.864053	49
15762	261	f	\N	2026-01-12 08:14:17.864053	49
15763	262	f	\N	2026-01-12 08:14:17.864053	49
15764	263	f	\N	2026-01-12 08:14:17.864053	49
15765	264	f	\N	2026-01-12 08:14:17.864053	49
15766	265	f	\N	2026-01-12 08:14:17.864053	49
15767	266	f	\N	2026-01-12 08:14:17.864053	49
15768	267	f	\N	2026-01-12 08:14:17.864053	49
15769	268	f	\N	2026-01-12 08:14:17.864053	49
15770	269	f	\N	2026-01-12 08:14:17.864053	49
15771	270	f	\N	2026-01-12 08:14:17.864053	49
15772	271	f	\N	2026-01-12 08:14:17.864053	49
15773	272	f	\N	2026-01-12 08:14:17.864053	49
15774	273	f	\N	2026-01-12 08:14:17.864053	49
15775	274	f	\N	2026-01-12 08:14:17.864053	49
15776	275	f	\N	2026-01-12 08:14:17.864053	49
15777	276	f	\N	2026-01-12 08:14:17.864053	49
15778	277	f	\N	2026-01-12 08:14:17.864053	49
15779	278	f	\N	2026-01-12 08:14:17.864053	49
15780	279	f	\N	2026-01-12 08:14:17.864053	49
15781	280	f	\N	2026-01-12 08:14:17.864053	49
15782	281	f	\N	2026-01-12 08:14:17.864053	49
15783	282	f	\N	2026-01-12 08:14:17.864053	49
15784	283	f	\N	2026-01-12 08:14:17.864053	49
15785	284	f	\N	2026-01-12 08:14:17.864053	49
15786	285	f	\N	2026-01-12 08:14:17.864053	49
15787	286	f	\N	2026-01-12 08:14:17.864053	49
15788	287	f	\N	2026-01-12 08:14:17.864053	49
15789	288	f	\N	2026-01-12 08:14:17.864053	49
15790	289	f	\N	2026-01-12 08:14:17.864053	49
15791	290	f	\N	2026-01-12 08:14:17.864053	49
15792	291	f	\N	2026-01-12 08:14:17.864053	49
15793	292	f	\N	2026-01-12 08:14:17.864053	49
15794	293	f	\N	2026-01-12 08:14:17.864053	49
15795	294	f	\N	2026-01-12 08:14:17.864053	49
15796	295	f	\N	2026-01-12 08:14:17.864053	49
15797	296	f	\N	2026-01-12 08:14:17.864053	49
15798	297	f	\N	2026-01-12 08:14:17.864053	49
15799	298	f	\N	2026-01-12 08:14:17.864053	49
15800	299	f	\N	2026-01-12 08:14:17.864053	49
15801	300	f	\N	2026-01-12 08:14:17.864053	49
15802	301	f	\N	2026-01-12 08:14:17.864053	49
15803	302	f	\N	2026-01-12 08:14:17.864053	49
15804	303	f	\N	2026-01-12 08:14:17.864053	49
15805	304	f	\N	2026-01-12 08:14:17.864053	49
15806	305	f	\N	2026-01-12 08:14:17.864053	49
15807	306	f	\N	2026-01-12 08:14:17.864053	49
15808	307	f	\N	2026-01-12 08:14:17.864053	49
15809	308	f	\N	2026-01-12 08:14:17.864053	49
15810	309	f	\N	2026-01-12 08:14:17.864053	49
15811	310	f	\N	2026-01-12 08:14:17.864053	49
15812	311	f	\N	2026-01-12 08:14:17.864053	49
15813	312	f	\N	2026-01-12 08:14:17.864053	49
15814	313	f	\N	2026-01-12 08:14:17.864053	49
15815	314	f	\N	2026-01-12 08:14:17.864053	49
15816	315	f	\N	2026-01-12 08:14:17.864053	49
15817	316	f	\N	2026-01-12 08:14:17.864053	49
15818	317	f	\N	2026-01-12 08:14:17.864053	49
15819	318	f	\N	2026-01-12 08:14:17.864053	49
15820	319	f	\N	2026-01-12 08:14:17.864053	49
15821	320	f	\N	2026-01-12 08:14:17.864053	49
15822	321	f	\N	2026-01-12 08:14:17.864053	49
15823	322	f	\N	2026-01-12 08:14:17.864053	49
15824	323	f	\N	2026-01-12 08:14:17.864053	49
15825	324	f	\N	2026-01-12 08:14:17.864053	49
15826	325	f	\N	2026-01-12 08:14:17.864053	49
15827	326	f	\N	2026-01-12 08:14:17.864053	49
15828	327	f	\N	2026-01-12 08:14:17.864053	49
15829	328	f	\N	2026-01-12 08:14:17.864053	49
15830	329	f	\N	2026-01-12 08:14:17.864053	49
15831	330	f	\N	2026-01-12 08:14:17.864053	49
15832	331	f	\N	2026-01-12 08:14:17.864053	49
15833	332	f	\N	2026-01-12 08:14:17.864053	49
15834	333	f	\N	2026-01-12 08:14:17.864053	49
15835	334	f	\N	2026-01-12 08:14:17.864053	49
15836	335	f	\N	2026-01-12 08:14:17.864053	49
15837	336	f	\N	2026-01-12 08:14:17.864053	49
15838	337	f	\N	2026-01-12 08:14:17.864053	49
15839	338	f	\N	2026-01-12 08:14:17.864053	49
15840	339	f	\N	2026-01-12 08:14:17.864053	49
15841	340	f	\N	2026-01-12 08:14:17.864053	49
15842	341	f	\N	2026-01-12 08:14:17.864053	49
15843	342	f	\N	2026-01-12 08:14:17.864053	49
15844	343	f	\N	2026-01-12 08:14:17.864053	49
15845	344	f	\N	2026-01-12 08:14:17.864053	49
15846	345	f	\N	2026-01-12 08:14:17.864053	49
15847	346	f	\N	2026-01-12 08:14:17.864053	49
15848	347	f	\N	2026-01-12 08:14:17.864053	49
15849	348	f	\N	2026-01-12 08:14:17.864053	49
15850	349	f	\N	2026-01-12 08:14:17.864053	49
15851	350	f	\N	2026-01-12 08:14:17.864053	49
15852	351	f	\N	2026-01-12 08:14:17.864053	49
15853	352	f	\N	2026-01-12 08:14:17.864053	49
15854	353	f	\N	2026-01-12 08:14:17.864053	49
15855	354	f	\N	2026-01-12 08:14:17.864053	49
15856	355	f	\N	2026-01-12 08:14:17.864053	49
15857	356	f	\N	2026-01-12 08:14:17.864053	49
15858	357	f	\N	2026-01-12 08:14:17.864053	49
15859	358	f	\N	2026-01-12 08:14:17.864053	49
15860	359	f	\N	2026-01-12 08:14:17.864053	49
15861	360	f	\N	2026-01-12 08:14:17.864053	49
15862	361	f	\N	2026-01-12 08:14:17.864053	49
15863	362	f	\N	2026-01-12 08:14:17.864053	49
15864	363	f	\N	2026-01-12 08:14:17.864053	49
15865	364	f	\N	2026-01-12 08:14:17.864053	49
15866	365	f	\N	2026-01-12 08:14:17.864053	49
15867	366	f	\N	2026-01-12 08:14:17.864053	49
15868	367	f	\N	2026-01-12 08:14:17.864053	49
15869	368	f	\N	2026-01-12 08:14:17.864053	49
15870	369	f	\N	2026-01-12 08:14:17.864053	49
15871	370	f	\N	2026-01-12 08:14:17.864053	49
15872	371	f	\N	2026-01-12 08:14:17.864053	49
15873	372	f	\N	2026-01-12 08:14:17.864053	49
15874	373	f	\N	2026-01-12 08:14:17.864053	49
15875	374	f	\N	2026-01-12 08:14:17.864053	49
15876	375	f	\N	2026-01-12 08:14:17.864053	49
15877	376	f	\N	2026-01-12 08:14:17.864053	49
15878	377	f	\N	2026-01-12 08:14:17.864053	49
15879	378	f	\N	2026-01-12 08:14:17.864053	49
15880	379	f	\N	2026-01-12 08:14:17.864053	49
15881	380	f	\N	2026-01-12 08:14:17.864053	49
15882	381	f	\N	2026-01-12 08:14:17.864053	49
15883	382	f	\N	2026-01-12 08:14:17.864053	49
15884	383	f	\N	2026-01-12 08:14:17.864053	49
15885	384	f	\N	2026-01-12 08:14:17.864053	49
15886	385	f	\N	2026-01-12 08:14:17.864053	49
15887	386	f	\N	2026-01-12 08:14:17.864053	49
15888	387	f	\N	2026-01-12 08:14:17.864053	49
15889	388	f	\N	2026-01-12 08:14:17.864053	49
15890	389	f	\N	2026-01-12 08:14:17.864053	49
15891	390	f	\N	2026-01-12 08:14:17.864053	49
15892	391	f	\N	2026-01-12 08:14:17.864053	49
15893	392	f	\N	2026-01-12 08:14:17.864053	49
15894	393	f	\N	2026-01-12 08:14:17.864053	49
15895	394	f	\N	2026-01-12 08:14:17.864053	49
15896	395	f	\N	2026-01-12 08:14:17.864053	49
15897	396	f	\N	2026-01-12 08:14:17.864053	49
15898	397	f	\N	2026-01-12 08:14:17.864053	49
15899	398	f	\N	2026-01-12 08:14:17.864053	49
15900	399	f	\N	2026-01-12 08:14:17.864053	49
15901	400	f	\N	2026-01-12 08:14:17.864053	49
15902	401	f	\N	2026-01-12 08:14:17.864053	49
15903	402	f	\N	2026-01-12 08:14:17.864053	49
15904	403	f	\N	2026-01-12 08:14:17.864053	49
15905	404	f	\N	2026-01-12 08:14:17.864053	49
15906	405	f	\N	2026-01-12 08:14:17.864053	49
15907	406	f	\N	2026-01-12 08:14:17.864053	49
15908	407	f	\N	2026-01-12 08:14:17.864053	49
15909	408	f	\N	2026-01-12 08:14:17.864053	49
15910	409	f	\N	2026-01-12 08:14:17.864053	49
15911	410	f	\N	2026-01-12 08:14:17.864053	49
15912	411	f	\N	2026-01-12 08:14:17.864053	49
15913	412	f	\N	2026-01-12 08:14:17.864053	49
15914	413	f	\N	2026-01-12 08:14:17.864053	49
15915	414	f	\N	2026-01-12 08:14:17.864053	49
15916	415	f	\N	2026-01-12 08:14:17.864053	49
15917	416	f	\N	2026-01-12 08:14:17.864053	49
15918	417	f	\N	2026-01-12 08:14:17.864053	49
15919	418	f	\N	2026-01-12 08:14:17.864053	49
15920	419	f	\N	2026-01-12 08:14:17.864053	49
15921	420	f	\N	2026-01-12 08:14:17.864053	49
15922	421	f	\N	2026-01-12 08:14:17.864053	49
15923	422	f	\N	2026-01-12 08:14:17.864053	49
15924	423	f	\N	2026-01-12 08:14:17.864053	49
15925	424	f	\N	2026-01-12 08:14:17.864053	49
15926	425	f	\N	2026-01-12 08:14:17.864053	49
15927	426	f	\N	2026-01-12 08:14:17.864053	49
15928	427	f	\N	2026-01-12 08:14:17.864053	49
15929	428	f	\N	2026-01-12 08:14:17.864053	49
15930	429	f	\N	2026-01-12 08:14:17.864053	49
15931	430	f	\N	2026-01-12 08:14:17.864053	49
15932	431	f	\N	2026-01-12 08:14:17.864053	49
15933	432	f	\N	2026-01-12 08:14:17.864053	49
15934	433	f	\N	2026-01-12 08:14:17.864053	49
15935	434	f	\N	2026-01-12 08:14:17.864053	49
15936	435	f	\N	2026-01-12 08:14:17.864053	49
15937	436	f	\N	2026-01-12 08:14:17.864053	49
15938	437	f	\N	2026-01-12 08:14:17.864053	49
15939	438	f	\N	2026-01-12 08:14:17.864053	49
15940	439	f	\N	2026-01-12 08:14:17.864053	49
15941	440	f	\N	2026-01-12 08:14:17.864053	49
15942	441	f	\N	2026-01-12 08:14:17.864053	49
15943	442	f	\N	2026-01-12 08:14:17.864053	49
15944	443	f	\N	2026-01-12 08:14:17.864053	49
15945	444	f	\N	2026-01-12 08:14:17.864053	49
15946	445	f	\N	2026-01-12 08:14:17.864053	49
15947	446	f	\N	2026-01-12 08:14:17.864053	49
15948	447	f	\N	2026-01-12 08:14:17.864053	49
15949	448	f	\N	2026-01-12 08:14:17.864053	49
15950	449	f	\N	2026-01-12 08:14:17.864053	49
15951	450	f	\N	2026-01-12 08:14:17.864053	49
15952	451	f	\N	2026-01-12 08:14:17.864053	49
15953	452	f	\N	2026-01-12 08:14:17.864053	49
15954	453	f	\N	2026-01-12 08:14:17.864053	49
15955	454	f	\N	2026-01-12 08:14:17.864053	49
15956	455	f	\N	2026-01-12 08:14:17.864053	49
15957	456	f	\N	2026-01-12 08:14:17.864053	49
15958	457	f	\N	2026-01-12 08:14:17.864053	49
15959	458	f	\N	2026-01-12 08:14:17.864053	49
15960	459	f	\N	2026-01-12 08:14:17.864053	49
15961	460	f	\N	2026-01-12 08:14:17.864053	49
15962	461	f	\N	2026-01-12 08:14:17.864053	49
15963	462	f	\N	2026-01-12 08:14:17.864053	49
15964	463	f	\N	2026-01-12 08:14:17.864053	49
15965	464	f	\N	2026-01-12 08:14:17.864053	49
15966	465	f	\N	2026-01-12 08:14:17.864053	49
15967	466	f	\N	2026-01-12 08:14:17.864053	49
15968	467	f	\N	2026-01-12 08:14:17.864053	49
15969	468	f	\N	2026-01-12 08:14:17.864053	49
15970	469	f	\N	2026-01-12 08:14:17.864053	49
15971	470	f	\N	2026-01-12 08:14:17.864053	49
15972	471	f	\N	2026-01-12 08:14:17.864053	49
15973	472	f	\N	2026-01-12 08:14:17.864053	49
15974	473	f	\N	2026-01-12 08:14:17.864053	49
15975	474	f	\N	2026-01-12 08:14:17.864053	49
15976	475	f	\N	2026-01-12 08:14:17.864053	49
15977	476	f	\N	2026-01-12 08:14:17.864053	49
15978	477	f	\N	2026-01-12 08:14:17.864053	49
15979	478	f	\N	2026-01-12 08:14:17.864053	49
15980	479	f	\N	2026-01-12 08:14:17.864053	49
15981	480	f	\N	2026-01-12 08:14:17.864053	49
15982	481	f	\N	2026-01-12 08:14:17.864053	49
15983	482	f	\N	2026-01-12 08:14:17.864053	49
15984	483	f	\N	2026-01-12 08:14:17.864053	49
15985	484	f	\N	2026-01-12 08:14:17.864053	49
15986	485	f	\N	2026-01-12 08:14:17.864053	49
15987	486	f	\N	2026-01-12 08:14:17.864053	49
15988	487	f	\N	2026-01-12 08:14:17.864053	49
15989	488	f	\N	2026-01-12 08:14:17.864053	49
15990	489	f	\N	2026-01-12 08:14:17.864053	49
15991	490	f	\N	2026-01-12 08:14:17.864053	49
15992	491	f	\N	2026-01-12 08:14:17.864053	49
15993	492	f	\N	2026-01-12 08:14:17.864053	49
15994	493	f	\N	2026-01-12 08:14:17.864053	49
15995	494	f	\N	2026-01-12 08:14:17.864053	49
15996	495	f	\N	2026-01-12 08:14:17.864053	49
15997	496	f	\N	2026-01-12 08:14:17.864053	49
15998	497	f	\N	2026-01-12 08:14:17.864053	49
15999	498	f	\N	2026-01-12 08:14:17.864053	49
16000	499	f	\N	2026-01-12 08:14:17.864053	49
16001	500	f	\N	2026-01-12 08:14:17.864053	49
13502	1	f	\N	2026-01-11 19:43:30.930244	42
13503	2	f	\N	2026-01-11 19:43:30.930244	42
13504	3	f	\N	2026-01-11 19:43:30.930244	42
13505	4	f	\N	2026-01-11 19:43:30.930244	42
13506	5	f	\N	2026-01-11 19:43:30.930244	42
13507	6	f	\N	2026-01-11 19:43:30.930244	42
13508	7	f	\N	2026-01-11 19:43:30.930244	42
13509	8	f	\N	2026-01-11 19:43:30.930244	42
13510	9	f	\N	2026-01-11 19:43:30.930244	42
13511	10	f	\N	2026-01-11 19:43:30.930244	42
13512	11	f	\N	2026-01-11 19:43:30.930244	42
13513	12	f	\N	2026-01-11 19:43:30.930244	42
13514	13	f	\N	2026-01-11 19:43:30.930244	42
13515	14	f	\N	2026-01-11 19:43:30.930244	42
13516	15	f	\N	2026-01-11 19:43:30.930244	42
13517	16	f	\N	2026-01-11 19:43:30.930244	42
13518	17	f	\N	2026-01-11 19:43:30.930244	42
13519	18	f	\N	2026-01-11 19:43:30.930244	42
13520	19	f	\N	2026-01-11 19:43:30.930244	42
13521	20	f	\N	2026-01-11 19:43:30.930244	42
13522	21	f	\N	2026-01-11 19:43:30.930244	42
13523	22	f	\N	2026-01-11 19:43:30.930244	42
13524	23	f	\N	2026-01-11 19:43:30.930244	42
13525	24	f	\N	2026-01-11 19:43:30.930244	42
13526	25	f	\N	2026-01-11 19:43:30.930244	42
13527	26	f	\N	2026-01-11 19:43:30.930244	42
13528	27	f	\N	2026-01-11 19:43:30.930244	42
13529	28	f	\N	2026-01-11 19:43:30.930244	42
13530	29	f	\N	2026-01-11 19:43:30.930244	42
13531	30	f	\N	2026-01-11 19:43:30.930244	42
13532	31	f	\N	2026-01-11 19:43:30.930244	42
13533	32	f	\N	2026-01-11 19:43:30.930244	42
13534	33	f	\N	2026-01-11 19:43:30.930244	42
13535	34	f	\N	2026-01-11 19:43:30.930244	42
13536	35	f	\N	2026-01-11 19:43:30.930244	42
13537	36	f	\N	2026-01-11 19:43:30.930244	42
13538	37	f	\N	2026-01-11 19:43:30.930244	42
13539	38	f	\N	2026-01-11 19:43:30.930244	42
13540	39	f	\N	2026-01-11 19:43:30.930244	42
13541	40	f	\N	2026-01-11 19:43:30.930244	42
13542	41	f	\N	2026-01-11 19:43:30.930244	42
13543	42	f	\N	2026-01-11 19:43:30.930244	42
13544	43	f	\N	2026-01-11 19:43:30.930244	42
13545	44	f	\N	2026-01-11 19:43:30.930244	42
13546	45	f	\N	2026-01-11 19:43:30.930244	42
13547	46	f	\N	2026-01-11 19:43:30.930244	42
13548	47	f	\N	2026-01-11 19:43:30.930244	42
13549	48	f	\N	2026-01-11 19:43:30.930244	42
13550	49	f	\N	2026-01-11 19:43:30.930244	42
13551	50	f	\N	2026-01-11 19:43:30.930244	42
13552	51	f	\N	2026-01-11 19:43:30.930244	42
13553	52	f	\N	2026-01-11 19:43:30.930244	42
13554	53	f	\N	2026-01-11 19:43:30.930244	42
13555	54	f	\N	2026-01-11 19:43:30.930244	42
13556	55	f	\N	2026-01-11 19:43:30.930244	42
13557	56	f	\N	2026-01-11 19:43:30.930244	42
13558	57	f	\N	2026-01-11 19:43:30.930244	42
13559	58	f	\N	2026-01-11 19:43:30.930244	42
13560	59	f	\N	2026-01-11 19:43:30.930244	42
13561	60	f	\N	2026-01-11 19:43:30.930244	42
13562	61	f	\N	2026-01-11 19:43:30.930244	42
13563	62	f	\N	2026-01-11 19:43:30.930244	42
13564	63	f	\N	2026-01-11 19:43:30.930244	42
13565	64	f	\N	2026-01-11 19:43:30.930244	42
13566	65	f	\N	2026-01-11 19:43:30.930244	42
13567	66	f	\N	2026-01-11 19:43:30.930244	42
13568	67	f	\N	2026-01-11 19:43:30.930244	42
13569	68	f	\N	2026-01-11 19:43:30.930244	42
13570	69	f	\N	2026-01-11 19:43:30.930244	42
13571	70	f	\N	2026-01-11 19:43:30.930244	42
13572	71	f	\N	2026-01-11 19:43:30.930244	42
13573	72	f	\N	2026-01-11 19:43:30.930244	42
13574	73	f	\N	2026-01-11 19:43:30.930244	42
13575	74	f	\N	2026-01-11 19:43:30.930244	42
13576	75	f	\N	2026-01-11 19:43:30.930244	42
13577	76	f	\N	2026-01-11 19:43:30.930244	42
13578	77	f	\N	2026-01-11 19:43:30.930244	42
13579	78	f	\N	2026-01-11 19:43:30.930244	42
13580	79	f	\N	2026-01-11 19:43:30.930244	42
13581	80	f	\N	2026-01-11 19:43:30.930244	42
13582	81	f	\N	2026-01-11 19:43:30.930244	42
13583	82	f	\N	2026-01-11 19:43:30.930244	42
13584	83	f	\N	2026-01-11 19:43:30.930244	42
13585	84	f	\N	2026-01-11 19:43:30.930244	42
13586	85	f	\N	2026-01-11 19:43:30.930244	42
13587	86	f	\N	2026-01-11 19:43:30.930244	42
13588	87	f	\N	2026-01-11 19:43:30.930244	42
13589	88	f	\N	2026-01-11 19:43:30.930244	42
13590	89	f	\N	2026-01-11 19:43:30.930244	42
13591	90	f	\N	2026-01-11 19:43:30.930244	42
13592	91	f	\N	2026-01-11 19:43:30.930244	42
13593	92	f	\N	2026-01-11 19:43:30.930244	42
13594	93	f	\N	2026-01-11 19:43:30.930244	42
13595	94	f	\N	2026-01-11 19:43:30.930244	42
13596	95	f	\N	2026-01-11 19:43:30.930244	42
13597	96	f	\N	2026-01-11 19:43:30.930244	42
13598	97	f	\N	2026-01-11 19:43:30.930244	42
13599	98	f	\N	2026-01-11 19:43:30.930244	42
13600	99	f	\N	2026-01-11 19:43:30.930244	42
13601	100	f	\N	2026-01-11 19:43:30.930244	42
13602	101	f	\N	2026-01-11 19:43:30.930244	42
13603	102	f	\N	2026-01-11 19:43:30.930244	42
13604	103	f	\N	2026-01-11 19:43:30.930244	42
13605	104	f	\N	2026-01-11 19:43:30.930244	42
13606	105	f	\N	2026-01-11 19:43:30.930244	42
13607	106	f	\N	2026-01-11 19:43:30.930244	42
13608	107	f	\N	2026-01-11 19:43:30.930244	42
13609	108	f	\N	2026-01-11 19:43:30.930244	42
13610	109	f	\N	2026-01-11 19:43:30.930244	42
13611	110	f	\N	2026-01-11 19:43:30.930244	42
13612	111	f	\N	2026-01-11 19:43:30.930244	42
13613	112	f	\N	2026-01-11 19:43:30.930244	42
13614	113	f	\N	2026-01-11 19:43:30.930244	42
13615	114	f	\N	2026-01-11 19:43:30.930244	42
13616	115	f	\N	2026-01-11 19:43:30.930244	42
13617	116	f	\N	2026-01-11 19:43:30.930244	42
13618	117	f	\N	2026-01-11 19:43:30.930244	42
13619	118	f	\N	2026-01-11 19:43:30.930244	42
13620	119	f	\N	2026-01-11 19:43:30.930244	42
13621	120	f	\N	2026-01-11 19:43:30.930244	42
13622	121	f	\N	2026-01-11 19:43:30.930244	42
13623	122	f	\N	2026-01-11 19:43:30.930244	42
13624	123	f	\N	2026-01-11 19:43:30.930244	42
13625	124	f	\N	2026-01-11 19:43:30.930244	42
13626	125	f	\N	2026-01-11 19:43:30.930244	42
13627	126	f	\N	2026-01-11 19:43:30.930244	42
13628	127	f	\N	2026-01-11 19:43:30.930244	42
13629	128	f	\N	2026-01-11 19:43:30.930244	42
13630	129	f	\N	2026-01-11 19:43:30.930244	42
13631	130	f	\N	2026-01-11 19:43:30.930244	42
13632	131	f	\N	2026-01-11 19:43:30.930244	42
13633	132	f	\N	2026-01-11 19:43:30.930244	42
13634	133	f	\N	2026-01-11 19:43:30.930244	42
13635	134	f	\N	2026-01-11 19:43:30.930244	42
13636	135	f	\N	2026-01-11 19:43:30.930244	42
13637	136	f	\N	2026-01-11 19:43:30.930244	42
13638	137	f	\N	2026-01-11 19:43:30.930244	42
13639	138	f	\N	2026-01-11 19:43:30.930244	42
13640	139	f	\N	2026-01-11 19:43:30.930244	42
13641	140	f	\N	2026-01-11 19:43:30.930244	42
13642	141	f	\N	2026-01-11 19:43:30.930244	42
13643	142	f	\N	2026-01-11 19:43:30.930244	42
13644	143	f	\N	2026-01-11 19:43:30.930244	42
13645	144	f	\N	2026-01-11 19:43:30.930244	42
13646	145	f	\N	2026-01-11 19:43:30.930244	42
13647	146	f	\N	2026-01-11 19:43:30.930244	42
13648	147	f	\N	2026-01-11 19:43:30.930244	42
13649	148	f	\N	2026-01-11 19:43:30.930244	42
13650	149	f	\N	2026-01-11 19:43:30.930244	42
13651	150	f	\N	2026-01-11 19:43:30.930244	42
13652	151	f	\N	2026-01-11 19:43:30.930244	42
13653	152	f	\N	2026-01-11 19:43:30.930244	42
13654	153	f	\N	2026-01-11 19:43:30.930244	42
13655	154	f	\N	2026-01-11 19:43:30.930244	42
13656	155	f	\N	2026-01-11 19:43:30.930244	42
13657	156	f	\N	2026-01-11 19:43:30.930244	42
13658	157	f	\N	2026-01-11 19:43:30.930244	42
13659	158	f	\N	2026-01-11 19:43:30.930244	42
13660	159	f	\N	2026-01-11 19:43:30.930244	42
13661	160	f	\N	2026-01-11 19:43:30.930244	42
13662	161	f	\N	2026-01-11 19:43:30.930244	42
13663	162	f	\N	2026-01-11 19:43:30.930244	42
13664	163	f	\N	2026-01-11 19:43:30.930244	42
13665	164	f	\N	2026-01-11 19:43:30.930244	42
13666	165	f	\N	2026-01-11 19:43:30.930244	42
13667	166	f	\N	2026-01-11 19:43:30.930244	42
13668	167	f	\N	2026-01-11 19:43:30.930244	42
13669	168	f	\N	2026-01-11 19:43:30.930244	42
13670	169	f	\N	2026-01-11 19:43:30.930244	42
13671	170	f	\N	2026-01-11 19:43:30.930244	42
13672	171	f	\N	2026-01-11 19:43:30.930244	42
13673	172	f	\N	2026-01-11 19:43:30.930244	42
13674	173	f	\N	2026-01-11 19:43:30.930244	42
13675	174	f	\N	2026-01-11 19:43:30.930244	42
13676	175	f	\N	2026-01-11 19:43:30.930244	42
13677	176	f	\N	2026-01-11 19:43:30.930244	42
13678	177	f	\N	2026-01-11 19:43:30.930244	42
13679	178	f	\N	2026-01-11 19:43:30.930244	42
13680	179	f	\N	2026-01-11 19:43:30.930244	42
13681	180	f	\N	2026-01-11 19:43:30.930244	42
13682	181	f	\N	2026-01-11 19:43:30.930244	42
13683	182	f	\N	2026-01-11 19:43:30.930244	42
13684	183	f	\N	2026-01-11 19:43:30.930244	42
13685	184	f	\N	2026-01-11 19:43:30.930244	42
13686	185	f	\N	2026-01-11 19:43:30.930244	42
13687	186	f	\N	2026-01-11 19:43:30.930244	42
13688	187	f	\N	2026-01-11 19:43:30.930244	42
13689	188	f	\N	2026-01-11 19:43:30.930244	42
13690	189	f	\N	2026-01-11 19:43:30.930244	42
13691	190	f	\N	2026-01-11 19:43:30.930244	42
13692	191	f	\N	2026-01-11 19:43:30.930244	42
13693	192	f	\N	2026-01-11 19:43:30.930244	42
13694	193	f	\N	2026-01-11 19:43:30.930244	42
13695	194	f	\N	2026-01-11 19:43:30.930244	42
13696	195	f	\N	2026-01-11 19:43:30.930244	42
13697	196	f	\N	2026-01-11 19:43:30.930244	42
13698	197	f	\N	2026-01-11 19:43:30.930244	42
13699	198	f	\N	2026-01-11 19:43:30.930244	42
13700	199	f	\N	2026-01-11 19:43:30.930244	42
13701	200	f	\N	2026-01-11 19:43:30.930244	42
13702	201	f	\N	2026-01-11 19:43:30.930244	42
13703	202	f	\N	2026-01-11 19:43:30.930244	42
13704	203	f	\N	2026-01-11 19:43:30.930244	42
13705	204	f	\N	2026-01-11 19:43:30.930244	42
13706	205	f	\N	2026-01-11 19:43:30.930244	42
13707	206	f	\N	2026-01-11 19:43:30.930244	42
13708	207	f	\N	2026-01-11 19:43:30.930244	42
13709	208	f	\N	2026-01-11 19:43:30.930244	42
13710	209	f	\N	2026-01-11 19:43:30.930244	42
13711	210	f	\N	2026-01-11 19:43:30.930244	42
13712	211	f	\N	2026-01-11 19:43:30.930244	42
13713	212	f	\N	2026-01-11 19:43:30.930244	42
13714	213	f	\N	2026-01-11 19:43:30.930244	42
13715	214	f	\N	2026-01-11 19:43:30.930244	42
13716	215	f	\N	2026-01-11 19:43:30.930244	42
13717	216	f	\N	2026-01-11 19:43:30.930244	42
13718	217	f	\N	2026-01-11 19:43:30.930244	42
13719	218	f	\N	2026-01-11 19:43:30.930244	42
13720	219	f	\N	2026-01-11 19:43:30.930244	42
13721	220	f	\N	2026-01-11 19:43:30.930244	42
13722	221	f	\N	2026-01-11 19:43:30.930244	42
13723	222	f	\N	2026-01-11 19:43:30.930244	42
13724	223	f	\N	2026-01-11 19:43:30.930244	42
13725	224	f	\N	2026-01-11 19:43:30.930244	42
13726	225	f	\N	2026-01-11 19:43:30.930244	42
13727	226	f	\N	2026-01-11 19:43:30.930244	42
13728	227	f	\N	2026-01-11 19:43:30.930244	42
13729	228	f	\N	2026-01-11 19:43:30.930244	42
13730	229	f	\N	2026-01-11 19:43:30.930244	42
13731	230	f	\N	2026-01-11 19:43:30.930244	42
13732	231	f	\N	2026-01-11 19:43:30.930244	42
13733	232	f	\N	2026-01-11 19:43:30.930244	42
13734	233	f	\N	2026-01-11 19:43:30.930244	42
13735	234	f	\N	2026-01-11 19:43:30.930244	42
13736	235	f	\N	2026-01-11 19:43:30.930244	42
13737	236	f	\N	2026-01-11 19:43:30.930244	42
13738	237	f	\N	2026-01-11 19:43:30.930244	42
13739	238	f	\N	2026-01-11 19:43:30.930244	42
13740	239	f	\N	2026-01-11 19:43:30.930244	42
13741	240	f	\N	2026-01-11 19:43:30.930244	42
13742	241	f	\N	2026-01-11 19:43:30.930244	42
13743	242	f	\N	2026-01-11 19:43:30.930244	42
13744	243	f	\N	2026-01-11 19:43:30.930244	42
13745	244	f	\N	2026-01-11 19:43:30.930244	42
13746	245	f	\N	2026-01-11 19:43:30.930244	42
13747	246	f	\N	2026-01-11 19:43:30.930244	42
13748	247	f	\N	2026-01-11 19:43:30.930244	42
13749	248	f	\N	2026-01-11 19:43:30.930244	42
13750	249	f	\N	2026-01-11 19:43:30.930244	42
13751	250	f	\N	2026-01-11 19:43:30.930244	42
13752	251	f	\N	2026-01-11 19:43:30.930244	42
13753	252	f	\N	2026-01-11 19:43:30.930244	42
13754	253	f	\N	2026-01-11 19:43:30.930244	42
13755	254	f	\N	2026-01-11 19:43:30.930244	42
13756	255	f	\N	2026-01-11 19:43:30.930244	42
13757	256	f	\N	2026-01-11 19:43:30.930244	42
13758	257	f	\N	2026-01-11 19:43:30.930244	42
13759	258	f	\N	2026-01-11 19:43:30.930244	42
13760	259	f	\N	2026-01-11 19:43:30.930244	42
13761	260	f	\N	2026-01-11 19:43:30.930244	42
13762	261	f	\N	2026-01-11 19:43:30.930244	42
13763	262	f	\N	2026-01-11 19:43:30.930244	42
13764	263	f	\N	2026-01-11 19:43:30.930244	42
13765	264	f	\N	2026-01-11 19:43:30.930244	42
13766	265	f	\N	2026-01-11 19:43:30.930244	42
13767	266	f	\N	2026-01-11 19:43:30.930244	42
13768	267	f	\N	2026-01-11 19:43:30.930244	42
13769	268	f	\N	2026-01-11 19:43:30.930244	42
13770	269	f	\N	2026-01-11 19:43:30.930244	42
13771	270	f	\N	2026-01-11 19:43:30.930244	42
13772	271	f	\N	2026-01-11 19:43:30.930244	42
13773	272	f	\N	2026-01-11 19:43:30.930244	42
13774	273	f	\N	2026-01-11 19:43:30.930244	42
13775	274	f	\N	2026-01-11 19:43:30.930244	42
13776	275	f	\N	2026-01-11 19:43:30.930244	42
13777	276	f	\N	2026-01-11 19:43:30.930244	42
13778	277	f	\N	2026-01-11 19:43:30.930244	42
13779	278	f	\N	2026-01-11 19:43:30.930244	42
13780	279	f	\N	2026-01-11 19:43:30.930244	42
13781	280	f	\N	2026-01-11 19:43:30.930244	42
13782	281	f	\N	2026-01-11 19:43:30.930244	42
13783	282	f	\N	2026-01-11 19:43:30.930244	42
13784	283	f	\N	2026-01-11 19:43:30.930244	42
13785	284	f	\N	2026-01-11 19:43:30.930244	42
13786	285	f	\N	2026-01-11 19:43:30.930244	42
13787	286	f	\N	2026-01-11 19:43:30.930244	42
13788	287	f	\N	2026-01-11 19:43:30.930244	42
13789	288	f	\N	2026-01-11 19:43:30.930244	42
13790	289	f	\N	2026-01-11 19:43:30.930244	42
13791	290	f	\N	2026-01-11 19:43:30.930244	42
13792	291	f	\N	2026-01-11 19:43:30.930244	42
13793	292	f	\N	2026-01-11 19:43:30.930244	42
13794	293	f	\N	2026-01-11 19:43:30.930244	42
13795	294	f	\N	2026-01-11 19:43:30.930244	42
13796	295	f	\N	2026-01-11 19:43:30.930244	42
13797	296	f	\N	2026-01-11 19:43:30.930244	42
13798	297	f	\N	2026-01-11 19:43:30.930244	42
13799	298	f	\N	2026-01-11 19:43:30.930244	42
13800	299	f	\N	2026-01-11 19:43:30.930244	42
13801	300	f	\N	2026-01-11 19:43:30.930244	42
13802	301	f	\N	2026-01-11 19:43:30.930244	42
13803	302	f	\N	2026-01-11 19:43:30.930244	42
13804	303	f	\N	2026-01-11 19:43:30.930244	42
13805	304	f	\N	2026-01-11 19:43:30.930244	42
13806	305	f	\N	2026-01-11 19:43:30.930244	42
13807	306	f	\N	2026-01-11 19:43:30.930244	42
13808	307	f	\N	2026-01-11 19:43:30.930244	42
13809	308	f	\N	2026-01-11 19:43:30.930244	42
13810	309	f	\N	2026-01-11 19:43:30.930244	42
13811	310	f	\N	2026-01-11 19:43:30.930244	42
13812	311	f	\N	2026-01-11 19:43:30.930244	42
13813	312	f	\N	2026-01-11 19:43:30.930244	42
13814	313	f	\N	2026-01-11 19:43:30.930244	42
13815	314	f	\N	2026-01-11 19:43:30.930244	42
13816	315	f	\N	2026-01-11 19:43:30.930244	42
13817	316	f	\N	2026-01-11 19:43:30.930244	42
13818	317	f	\N	2026-01-11 19:43:30.930244	42
13819	318	f	\N	2026-01-11 19:43:30.930244	42
13820	319	f	\N	2026-01-11 19:43:30.930244	42
13821	320	f	\N	2026-01-11 19:43:30.930244	42
13822	321	f	\N	2026-01-11 19:43:30.930244	42
13823	322	f	\N	2026-01-11 19:43:30.930244	42
13824	323	f	\N	2026-01-11 19:43:30.930244	42
13825	324	f	\N	2026-01-11 19:43:30.930244	42
13826	325	f	\N	2026-01-11 19:43:30.930244	42
13827	326	f	\N	2026-01-11 19:43:30.930244	42
13828	327	f	\N	2026-01-11 19:43:30.930244	42
13829	328	f	\N	2026-01-11 19:43:30.930244	42
13830	329	f	\N	2026-01-11 19:43:30.930244	42
13831	330	f	\N	2026-01-11 19:43:30.930244	42
13832	331	f	\N	2026-01-11 19:43:30.930244	42
13833	332	f	\N	2026-01-11 19:43:30.930244	42
13834	333	f	\N	2026-01-11 19:43:30.930244	42
13835	334	f	\N	2026-01-11 19:43:30.930244	42
13836	335	f	\N	2026-01-11 19:43:30.930244	42
13837	336	f	\N	2026-01-11 19:43:30.930244	42
13838	337	f	\N	2026-01-11 19:43:30.930244	42
13839	338	f	\N	2026-01-11 19:43:30.930244	42
13840	339	f	\N	2026-01-11 19:43:30.930244	42
13841	340	f	\N	2026-01-11 19:43:30.930244	42
13842	341	f	\N	2026-01-11 19:43:30.930244	42
13843	342	f	\N	2026-01-11 19:43:30.930244	42
13844	343	f	\N	2026-01-11 19:43:30.930244	42
13845	344	f	\N	2026-01-11 19:43:30.930244	42
13846	345	f	\N	2026-01-11 19:43:30.930244	42
13847	346	f	\N	2026-01-11 19:43:30.930244	42
13848	347	f	\N	2026-01-11 19:43:30.930244	42
13849	348	f	\N	2026-01-11 19:43:30.930244	42
13850	349	f	\N	2026-01-11 19:43:30.930244	42
13851	350	f	\N	2026-01-11 19:43:30.930244	42
13852	351	f	\N	2026-01-11 19:43:30.930244	42
13853	352	f	\N	2026-01-11 19:43:30.930244	42
13854	353	f	\N	2026-01-11 19:43:30.930244	42
13855	354	f	\N	2026-01-11 19:43:30.930244	42
13856	355	f	\N	2026-01-11 19:43:30.930244	42
13857	356	f	\N	2026-01-11 19:43:30.930244	42
13858	357	f	\N	2026-01-11 19:43:30.930244	42
13859	358	f	\N	2026-01-11 19:43:30.930244	42
13860	359	f	\N	2026-01-11 19:43:30.930244	42
13861	360	f	\N	2026-01-11 19:43:30.930244	42
13862	361	f	\N	2026-01-11 19:43:30.930244	42
13863	362	f	\N	2026-01-11 19:43:30.930244	42
13864	363	f	\N	2026-01-11 19:43:30.930244	42
13865	364	f	\N	2026-01-11 19:43:30.930244	42
13866	365	f	\N	2026-01-11 19:43:30.930244	42
13867	366	f	\N	2026-01-11 19:43:30.930244	42
13868	367	f	\N	2026-01-11 19:43:30.930244	42
13869	368	f	\N	2026-01-11 19:43:30.930244	42
13870	369	f	\N	2026-01-11 19:43:30.930244	42
13871	370	f	\N	2026-01-11 19:43:30.930244	42
13872	371	f	\N	2026-01-11 19:43:30.930244	42
13873	372	f	\N	2026-01-11 19:43:30.930244	42
13874	373	f	\N	2026-01-11 19:43:30.930244	42
13875	374	f	\N	2026-01-11 19:43:30.930244	42
13876	375	f	\N	2026-01-11 19:43:30.930244	42
13877	376	f	\N	2026-01-11 19:43:30.930244	42
13878	377	f	\N	2026-01-11 19:43:30.930244	42
13879	378	f	\N	2026-01-11 19:43:30.930244	42
13880	379	f	\N	2026-01-11 19:43:30.930244	42
13881	380	f	\N	2026-01-11 19:43:30.930244	42
13882	381	f	\N	2026-01-11 19:43:30.930244	42
13883	382	f	\N	2026-01-11 19:43:30.930244	42
13884	383	f	\N	2026-01-11 19:43:30.930244	42
13885	384	f	\N	2026-01-11 19:43:30.930244	42
13886	385	f	\N	2026-01-11 19:43:30.930244	42
13887	386	f	\N	2026-01-11 19:43:30.930244	42
13888	387	f	\N	2026-01-11 19:43:30.930244	42
13889	388	f	\N	2026-01-11 19:43:30.930244	42
13890	389	f	\N	2026-01-11 19:43:30.930244	42
13891	390	f	\N	2026-01-11 19:43:30.930244	42
13892	391	f	\N	2026-01-11 19:43:30.930244	42
13893	392	f	\N	2026-01-11 19:43:30.930244	42
13894	393	f	\N	2026-01-11 19:43:30.930244	42
13895	394	f	\N	2026-01-11 19:43:30.930244	42
13896	395	f	\N	2026-01-11 19:43:30.930244	42
13897	396	f	\N	2026-01-11 19:43:30.930244	42
13898	397	f	\N	2026-01-11 19:43:30.930244	42
13899	398	f	\N	2026-01-11 19:43:30.930244	42
13900	399	f	\N	2026-01-11 19:43:30.930244	42
13901	400	f	\N	2026-01-11 19:43:30.930244	42
13902	401	f	\N	2026-01-11 19:43:30.930244	42
13903	402	f	\N	2026-01-11 19:43:30.930244	42
13904	403	f	\N	2026-01-11 19:43:30.930244	42
13905	404	f	\N	2026-01-11 19:43:30.930244	42
13906	405	f	\N	2026-01-11 19:43:30.930244	42
13907	406	f	\N	2026-01-11 19:43:30.930244	42
13908	407	f	\N	2026-01-11 19:43:30.930244	42
13909	408	f	\N	2026-01-11 19:43:30.930244	42
13910	409	f	\N	2026-01-11 19:43:30.930244	42
13911	410	f	\N	2026-01-11 19:43:30.930244	42
13912	411	f	\N	2026-01-11 19:43:30.930244	42
13913	412	f	\N	2026-01-11 19:43:30.930244	42
13914	413	f	\N	2026-01-11 19:43:30.930244	42
13915	414	f	\N	2026-01-11 19:43:30.930244	42
13916	415	f	\N	2026-01-11 19:43:30.930244	42
13917	416	f	\N	2026-01-11 19:43:30.930244	42
13918	417	f	\N	2026-01-11 19:43:30.930244	42
13919	418	f	\N	2026-01-11 19:43:30.930244	42
13920	419	f	\N	2026-01-11 19:43:30.930244	42
13921	420	f	\N	2026-01-11 19:43:30.930244	42
13922	421	f	\N	2026-01-11 19:43:30.930244	42
13923	422	f	\N	2026-01-11 19:43:30.930244	42
13924	423	f	\N	2026-01-11 19:43:30.930244	42
13925	424	f	\N	2026-01-11 19:43:30.930244	42
13926	425	f	\N	2026-01-11 19:43:30.930244	42
13927	426	f	\N	2026-01-11 19:43:30.930244	42
13928	427	f	\N	2026-01-11 19:43:30.930244	42
13929	428	f	\N	2026-01-11 19:43:30.930244	42
13930	429	f	\N	2026-01-11 19:43:30.930244	42
13931	430	f	\N	2026-01-11 19:43:30.930244	42
13932	431	f	\N	2026-01-11 19:43:30.930244	42
13933	432	f	\N	2026-01-11 19:43:30.930244	42
13934	433	f	\N	2026-01-11 19:43:30.930244	42
13935	434	f	\N	2026-01-11 19:43:30.930244	42
13936	435	f	\N	2026-01-11 19:43:30.930244	42
13937	436	f	\N	2026-01-11 19:43:30.930244	42
13938	437	f	\N	2026-01-11 19:43:30.930244	42
13939	438	f	\N	2026-01-11 19:43:30.930244	42
13940	439	f	\N	2026-01-11 19:43:30.930244	42
13941	440	f	\N	2026-01-11 19:43:30.930244	42
13942	441	f	\N	2026-01-11 19:43:30.930244	42
13943	442	f	\N	2026-01-11 19:43:30.930244	42
13944	443	f	\N	2026-01-11 19:43:30.930244	42
13945	444	f	\N	2026-01-11 19:43:30.930244	42
13946	445	f	\N	2026-01-11 19:43:30.930244	42
13947	446	f	\N	2026-01-11 19:43:30.930244	42
13948	447	f	\N	2026-01-11 19:43:30.930244	42
13949	448	f	\N	2026-01-11 19:43:30.930244	42
13950	449	f	\N	2026-01-11 19:43:30.930244	42
13951	450	f	\N	2026-01-11 19:43:30.930244	42
13952	451	f	\N	2026-01-11 19:43:30.930244	42
13953	452	f	\N	2026-01-11 19:43:30.930244	42
13954	453	f	\N	2026-01-11 19:43:30.930244	42
13955	454	f	\N	2026-01-11 19:43:30.930244	42
13956	455	f	\N	2026-01-11 19:43:30.930244	42
13957	456	f	\N	2026-01-11 19:43:30.930244	42
13958	457	f	\N	2026-01-11 19:43:30.930244	42
13959	458	f	\N	2026-01-11 19:43:30.930244	42
13960	459	f	\N	2026-01-11 19:43:30.930244	42
13961	460	f	\N	2026-01-11 19:43:30.930244	42
13962	461	f	\N	2026-01-11 19:43:30.930244	42
13963	462	f	\N	2026-01-11 19:43:30.930244	42
13964	463	f	\N	2026-01-11 19:43:30.930244	42
13965	464	f	\N	2026-01-11 19:43:30.930244	42
13966	465	f	\N	2026-01-11 19:43:30.930244	42
13967	466	f	\N	2026-01-11 19:43:30.930244	42
13968	467	f	\N	2026-01-11 19:43:30.930244	42
13969	468	f	\N	2026-01-11 19:43:30.930244	42
13970	469	f	\N	2026-01-11 19:43:30.930244	42
13971	470	f	\N	2026-01-11 19:43:30.930244	42
13972	471	f	\N	2026-01-11 19:43:30.930244	42
13973	472	f	\N	2026-01-11 19:43:30.930244	42
13974	473	f	\N	2026-01-11 19:43:30.930244	42
13975	474	f	\N	2026-01-11 19:43:30.930244	42
13976	475	f	\N	2026-01-11 19:43:30.930244	42
13977	476	f	\N	2026-01-11 19:43:30.930244	42
13978	477	f	\N	2026-01-11 19:43:30.930244	42
13979	478	f	\N	2026-01-11 19:43:30.930244	42
13980	479	f	\N	2026-01-11 19:43:30.930244	42
13981	480	f	\N	2026-01-11 19:43:30.930244	42
13982	481	f	\N	2026-01-11 19:43:30.930244	42
13983	482	f	\N	2026-01-11 19:43:30.930244	42
13984	483	f	\N	2026-01-11 19:43:30.930244	42
13985	484	f	\N	2026-01-11 19:43:30.930244	42
13986	485	f	\N	2026-01-11 19:43:30.930244	42
13987	486	f	\N	2026-01-11 19:43:30.930244	42
13988	487	f	\N	2026-01-11 19:43:30.930244	42
13989	488	f	\N	2026-01-11 19:43:30.930244	42
13990	489	f	\N	2026-01-11 19:43:30.930244	42
13991	490	f	\N	2026-01-11 19:43:30.930244	42
13992	491	f	\N	2026-01-11 19:43:30.930244	42
13993	492	f	\N	2026-01-11 19:43:30.930244	42
13994	493	f	\N	2026-01-11 19:43:30.930244	42
13995	494	f	\N	2026-01-11 19:43:30.930244	42
13996	495	f	\N	2026-01-11 19:43:30.930244	42
13997	496	f	\N	2026-01-11 19:43:30.930244	42
13998	497	f	\N	2026-01-11 19:43:30.930244	42
13999	498	f	\N	2026-01-11 19:43:30.930244	42
14000	499	f	\N	2026-01-11 19:43:30.930244	42
14001	500	f	\N	2026-01-11 19:43:30.930244	42
14002	1	f	\N	2026-01-11 20:34:46.917108	45
14003	2	f	\N	2026-01-11 20:34:46.917108	45
14004	3	f	\N	2026-01-11 20:34:46.917108	45
14005	4	f	\N	2026-01-11 20:34:46.917108	45
14006	5	f	\N	2026-01-11 20:34:46.917108	45
14007	6	f	\N	2026-01-11 20:34:46.917108	45
14008	7	f	\N	2026-01-11 20:34:46.917108	45
14009	8	f	\N	2026-01-11 20:34:46.917108	45
14010	9	f	\N	2026-01-11 20:34:46.917108	45
14011	10	f	\N	2026-01-11 20:34:46.917108	45
14012	11	f	\N	2026-01-11 20:34:46.917108	45
14013	12	f	\N	2026-01-11 20:34:46.917108	45
14014	13	f	\N	2026-01-11 20:34:46.917108	45
14015	14	f	\N	2026-01-11 20:34:46.917108	45
14016	15	f	\N	2026-01-11 20:34:46.917108	45
14017	16	f	\N	2026-01-11 20:34:46.917108	45
14018	17	f	\N	2026-01-11 20:34:46.917108	45
14019	18	f	\N	2026-01-11 20:34:46.917108	45
14020	19	f	\N	2026-01-11 20:34:46.917108	45
14021	20	f	\N	2026-01-11 20:34:46.917108	45
14022	21	f	\N	2026-01-11 20:34:46.917108	45
14023	22	f	\N	2026-01-11 20:34:46.917108	45
14024	23	f	\N	2026-01-11 20:34:46.917108	45
14025	24	f	\N	2026-01-11 20:34:46.917108	45
14026	25	f	\N	2026-01-11 20:34:46.917108	45
14027	26	f	\N	2026-01-11 20:34:46.917108	45
14028	27	f	\N	2026-01-11 20:34:46.917108	45
14029	28	f	\N	2026-01-11 20:34:46.917108	45
14030	29	f	\N	2026-01-11 20:34:46.917108	45
14031	30	f	\N	2026-01-11 20:34:46.917108	45
14032	31	f	\N	2026-01-11 20:34:46.917108	45
14033	32	f	\N	2026-01-11 20:34:46.917108	45
14034	33	f	\N	2026-01-11 20:34:46.917108	45
14035	34	f	\N	2026-01-11 20:34:46.917108	45
14036	35	f	\N	2026-01-11 20:34:46.917108	45
14037	36	f	\N	2026-01-11 20:34:46.917108	45
14038	37	f	\N	2026-01-11 20:34:46.917108	45
14039	38	f	\N	2026-01-11 20:34:46.917108	45
14040	39	f	\N	2026-01-11 20:34:46.917108	45
14041	40	f	\N	2026-01-11 20:34:46.917108	45
14042	41	f	\N	2026-01-11 20:34:46.917108	45
14043	42	f	\N	2026-01-11 20:34:46.917108	45
14044	43	f	\N	2026-01-11 20:34:46.917108	45
14045	44	f	\N	2026-01-11 20:34:46.917108	45
14046	45	f	\N	2026-01-11 20:34:46.917108	45
14047	46	f	\N	2026-01-11 20:34:46.917108	45
14048	47	f	\N	2026-01-11 20:34:46.917108	45
14049	48	f	\N	2026-01-11 20:34:46.917108	45
14050	49	f	\N	2026-01-11 20:34:46.917108	45
14051	50	f	\N	2026-01-11 20:34:46.917108	45
14052	51	f	\N	2026-01-11 20:34:46.917108	45
14053	52	f	\N	2026-01-11 20:34:46.917108	45
14054	53	f	\N	2026-01-11 20:34:46.917108	45
14055	54	f	\N	2026-01-11 20:34:46.917108	45
14056	55	f	\N	2026-01-11 20:34:46.917108	45
14057	56	f	\N	2026-01-11 20:34:46.917108	45
14058	57	f	\N	2026-01-11 20:34:46.917108	45
14059	58	f	\N	2026-01-11 20:34:46.917108	45
14060	59	f	\N	2026-01-11 20:34:46.917108	45
14061	60	f	\N	2026-01-11 20:34:46.917108	45
14062	61	f	\N	2026-01-11 20:34:46.917108	45
14063	62	f	\N	2026-01-11 20:34:46.917108	45
14064	63	f	\N	2026-01-11 20:34:46.917108	45
14065	64	f	\N	2026-01-11 20:34:46.917108	45
14066	65	f	\N	2026-01-11 20:34:46.917108	45
14067	66	f	\N	2026-01-11 20:34:46.917108	45
14068	67	f	\N	2026-01-11 20:34:46.917108	45
14069	68	f	\N	2026-01-11 20:34:46.917108	45
14070	69	f	\N	2026-01-11 20:34:46.917108	45
14071	70	f	\N	2026-01-11 20:34:46.917108	45
14072	71	f	\N	2026-01-11 20:34:46.917108	45
14073	72	f	\N	2026-01-11 20:34:46.917108	45
14074	73	f	\N	2026-01-11 20:34:46.917108	45
14075	74	f	\N	2026-01-11 20:34:46.917108	45
14076	75	f	\N	2026-01-11 20:34:46.917108	45
14077	76	f	\N	2026-01-11 20:34:46.917108	45
14078	77	f	\N	2026-01-11 20:34:46.917108	45
14079	78	f	\N	2026-01-11 20:34:46.917108	45
14080	79	f	\N	2026-01-11 20:34:46.917108	45
14081	80	f	\N	2026-01-11 20:34:46.917108	45
14082	81	f	\N	2026-01-11 20:34:46.917108	45
14083	82	f	\N	2026-01-11 20:34:46.917108	45
14084	83	f	\N	2026-01-11 20:34:46.917108	45
14085	84	f	\N	2026-01-11 20:34:46.917108	45
14086	85	f	\N	2026-01-11 20:34:46.917108	45
14087	86	f	\N	2026-01-11 20:34:46.917108	45
14088	87	f	\N	2026-01-11 20:34:46.917108	45
14089	88	f	\N	2026-01-11 20:34:46.917108	45
14090	89	f	\N	2026-01-11 20:34:46.917108	45
14091	90	f	\N	2026-01-11 20:34:46.917108	45
14092	91	f	\N	2026-01-11 20:34:46.917108	45
14093	92	f	\N	2026-01-11 20:34:46.917108	45
14094	93	f	\N	2026-01-11 20:34:46.917108	45
14095	94	f	\N	2026-01-11 20:34:46.917108	45
14096	95	f	\N	2026-01-11 20:34:46.917108	45
14097	96	f	\N	2026-01-11 20:34:46.917108	45
14098	97	f	\N	2026-01-11 20:34:46.917108	45
14099	98	f	\N	2026-01-11 20:34:46.917108	45
14100	99	f	\N	2026-01-11 20:34:46.917108	45
14101	100	f	\N	2026-01-11 20:34:46.917108	45
14102	101	f	\N	2026-01-11 20:34:46.917108	45
14103	102	f	\N	2026-01-11 20:34:46.917108	45
14104	103	f	\N	2026-01-11 20:34:46.917108	45
14105	104	f	\N	2026-01-11 20:34:46.917108	45
14106	105	f	\N	2026-01-11 20:34:46.917108	45
14107	106	f	\N	2026-01-11 20:34:46.917108	45
14108	107	f	\N	2026-01-11 20:34:46.917108	45
14109	108	f	\N	2026-01-11 20:34:46.917108	45
14110	109	f	\N	2026-01-11 20:34:46.917108	45
14111	110	f	\N	2026-01-11 20:34:46.917108	45
14112	111	f	\N	2026-01-11 20:34:46.917108	45
14113	112	f	\N	2026-01-11 20:34:46.917108	45
14114	113	f	\N	2026-01-11 20:34:46.917108	45
14115	114	f	\N	2026-01-11 20:34:46.917108	45
14116	115	f	\N	2026-01-11 20:34:46.917108	45
14117	116	f	\N	2026-01-11 20:34:46.917108	45
14118	117	f	\N	2026-01-11 20:34:46.917108	45
14119	118	f	\N	2026-01-11 20:34:46.917108	45
14120	119	f	\N	2026-01-11 20:34:46.917108	45
14121	120	f	\N	2026-01-11 20:34:46.917108	45
14122	121	f	\N	2026-01-11 20:34:46.917108	45
14123	122	f	\N	2026-01-11 20:34:46.917108	45
14124	123	f	\N	2026-01-11 20:34:46.917108	45
14125	124	f	\N	2026-01-11 20:34:46.917108	45
14126	125	f	\N	2026-01-11 20:34:46.917108	45
14127	126	f	\N	2026-01-11 20:34:46.917108	45
14128	127	f	\N	2026-01-11 20:34:46.917108	45
14129	128	f	\N	2026-01-11 20:34:46.917108	45
14130	129	f	\N	2026-01-11 20:34:46.917108	45
14131	130	f	\N	2026-01-11 20:34:46.917108	45
14132	131	f	\N	2026-01-11 20:34:46.917108	45
14133	132	f	\N	2026-01-11 20:34:46.917108	45
14134	133	f	\N	2026-01-11 20:34:46.917108	45
14135	134	f	\N	2026-01-11 20:34:46.917108	45
14136	135	f	\N	2026-01-11 20:34:46.917108	45
14137	136	f	\N	2026-01-11 20:34:46.917108	45
14138	137	f	\N	2026-01-11 20:34:46.917108	45
14139	138	f	\N	2026-01-11 20:34:46.917108	45
14140	139	f	\N	2026-01-11 20:34:46.917108	45
14141	140	f	\N	2026-01-11 20:34:46.917108	45
14142	141	f	\N	2026-01-11 20:34:46.917108	45
14143	142	f	\N	2026-01-11 20:34:46.917108	45
14144	143	f	\N	2026-01-11 20:34:46.917108	45
14145	144	f	\N	2026-01-11 20:34:46.917108	45
14146	145	f	\N	2026-01-11 20:34:46.917108	45
14147	146	f	\N	2026-01-11 20:34:46.917108	45
14148	147	f	\N	2026-01-11 20:34:46.917108	45
14149	148	f	\N	2026-01-11 20:34:46.917108	45
14150	149	f	\N	2026-01-11 20:34:46.917108	45
14151	150	f	\N	2026-01-11 20:34:46.917108	45
14152	151	f	\N	2026-01-11 20:34:46.917108	45
14153	152	f	\N	2026-01-11 20:34:46.917108	45
14154	153	f	\N	2026-01-11 20:34:46.917108	45
14155	154	f	\N	2026-01-11 20:34:46.917108	45
14156	155	f	\N	2026-01-11 20:34:46.917108	45
14157	156	f	\N	2026-01-11 20:34:46.917108	45
14158	157	f	\N	2026-01-11 20:34:46.917108	45
14159	158	f	\N	2026-01-11 20:34:46.917108	45
14160	159	f	\N	2026-01-11 20:34:46.917108	45
14161	160	f	\N	2026-01-11 20:34:46.917108	45
14162	161	f	\N	2026-01-11 20:34:46.917108	45
14163	162	f	\N	2026-01-11 20:34:46.917108	45
14164	163	f	\N	2026-01-11 20:34:46.917108	45
14165	164	f	\N	2026-01-11 20:34:46.917108	45
14166	165	f	\N	2026-01-11 20:34:46.917108	45
14167	166	f	\N	2026-01-11 20:34:46.917108	45
14168	167	f	\N	2026-01-11 20:34:46.917108	45
14169	168	f	\N	2026-01-11 20:34:46.917108	45
14170	169	f	\N	2026-01-11 20:34:46.917108	45
14171	170	f	\N	2026-01-11 20:34:46.917108	45
14172	171	f	\N	2026-01-11 20:34:46.917108	45
14173	172	f	\N	2026-01-11 20:34:46.917108	45
14174	173	f	\N	2026-01-11 20:34:46.917108	45
14175	174	f	\N	2026-01-11 20:34:46.917108	45
14176	175	f	\N	2026-01-11 20:34:46.917108	45
14177	176	f	\N	2026-01-11 20:34:46.917108	45
14178	177	f	\N	2026-01-11 20:34:46.917108	45
14179	178	f	\N	2026-01-11 20:34:46.917108	45
14180	179	f	\N	2026-01-11 20:34:46.917108	45
14181	180	f	\N	2026-01-11 20:34:46.917108	45
14182	181	f	\N	2026-01-11 20:34:46.917108	45
14183	182	f	\N	2026-01-11 20:34:46.917108	45
14184	183	f	\N	2026-01-11 20:34:46.917108	45
14185	184	f	\N	2026-01-11 20:34:46.917108	45
14186	185	f	\N	2026-01-11 20:34:46.917108	45
14187	186	f	\N	2026-01-11 20:34:46.917108	45
14188	187	f	\N	2026-01-11 20:34:46.917108	45
14189	188	f	\N	2026-01-11 20:34:46.917108	45
14190	189	f	\N	2026-01-11 20:34:46.917108	45
14191	190	f	\N	2026-01-11 20:34:46.917108	45
14192	191	f	\N	2026-01-11 20:34:46.917108	45
14193	192	f	\N	2026-01-11 20:34:46.917108	45
14194	193	f	\N	2026-01-11 20:34:46.917108	45
14195	194	f	\N	2026-01-11 20:34:46.917108	45
14196	195	f	\N	2026-01-11 20:34:46.917108	45
14197	196	f	\N	2026-01-11 20:34:46.917108	45
14198	197	f	\N	2026-01-11 20:34:46.917108	45
14199	198	f	\N	2026-01-11 20:34:46.917108	45
14200	199	f	\N	2026-01-11 20:34:46.917108	45
14201	200	f	\N	2026-01-11 20:34:46.917108	45
14202	201	f	\N	2026-01-11 20:34:46.917108	45
14203	202	f	\N	2026-01-11 20:34:46.917108	45
14204	203	f	\N	2026-01-11 20:34:46.917108	45
14205	204	f	\N	2026-01-11 20:34:46.917108	45
14206	205	f	\N	2026-01-11 20:34:46.917108	45
14207	206	f	\N	2026-01-11 20:34:46.917108	45
14208	207	f	\N	2026-01-11 20:34:46.917108	45
14209	208	f	\N	2026-01-11 20:34:46.917108	45
14210	209	f	\N	2026-01-11 20:34:46.917108	45
14211	210	f	\N	2026-01-11 20:34:46.917108	45
14212	211	f	\N	2026-01-11 20:34:46.917108	45
14213	212	f	\N	2026-01-11 20:34:46.917108	45
14214	213	f	\N	2026-01-11 20:34:46.917108	45
14215	214	f	\N	2026-01-11 20:34:46.917108	45
14216	215	f	\N	2026-01-11 20:34:46.917108	45
14217	216	f	\N	2026-01-11 20:34:46.917108	45
14218	217	f	\N	2026-01-11 20:34:46.917108	45
14219	218	f	\N	2026-01-11 20:34:46.917108	45
14220	219	f	\N	2026-01-11 20:34:46.917108	45
14221	220	f	\N	2026-01-11 20:34:46.917108	45
14222	221	f	\N	2026-01-11 20:34:46.917108	45
14223	222	f	\N	2026-01-11 20:34:46.917108	45
14224	223	f	\N	2026-01-11 20:34:46.917108	45
14225	224	f	\N	2026-01-11 20:34:46.917108	45
14226	225	f	\N	2026-01-11 20:34:46.917108	45
14227	226	f	\N	2026-01-11 20:34:46.917108	45
14228	227	f	\N	2026-01-11 20:34:46.917108	45
14229	228	f	\N	2026-01-11 20:34:46.917108	45
14230	229	f	\N	2026-01-11 20:34:46.917108	45
14231	230	f	\N	2026-01-11 20:34:46.917108	45
14232	231	f	\N	2026-01-11 20:34:46.917108	45
14233	232	f	\N	2026-01-11 20:34:46.917108	45
14234	233	f	\N	2026-01-11 20:34:46.917108	45
14235	234	f	\N	2026-01-11 20:34:46.917108	45
14236	235	f	\N	2026-01-11 20:34:46.917108	45
14237	236	f	\N	2026-01-11 20:34:46.917108	45
14238	237	f	\N	2026-01-11 20:34:46.917108	45
14239	238	f	\N	2026-01-11 20:34:46.917108	45
14240	239	f	\N	2026-01-11 20:34:46.917108	45
14241	240	f	\N	2026-01-11 20:34:46.917108	45
14242	241	f	\N	2026-01-11 20:34:46.917108	45
14243	242	f	\N	2026-01-11 20:34:46.917108	45
14244	243	f	\N	2026-01-11 20:34:46.917108	45
14245	244	f	\N	2026-01-11 20:34:46.917108	45
14246	245	f	\N	2026-01-11 20:34:46.917108	45
14247	246	f	\N	2026-01-11 20:34:46.917108	45
14248	247	f	\N	2026-01-11 20:34:46.917108	45
14249	248	f	\N	2026-01-11 20:34:46.917108	45
14250	249	f	\N	2026-01-11 20:34:46.917108	45
14251	250	f	\N	2026-01-11 20:34:46.917108	45
14252	251	f	\N	2026-01-11 20:34:46.917108	45
14253	252	f	\N	2026-01-11 20:34:46.917108	45
14254	253	f	\N	2026-01-11 20:34:46.917108	45
14255	254	f	\N	2026-01-11 20:34:46.917108	45
14256	255	f	\N	2026-01-11 20:34:46.917108	45
14257	256	f	\N	2026-01-11 20:34:46.917108	45
14258	257	f	\N	2026-01-11 20:34:46.917108	45
14259	258	f	\N	2026-01-11 20:34:46.917108	45
14260	259	f	\N	2026-01-11 20:34:46.917108	45
14261	260	f	\N	2026-01-11 20:34:46.917108	45
14262	261	f	\N	2026-01-11 20:34:46.917108	45
14263	262	f	\N	2026-01-11 20:34:46.917108	45
14264	263	f	\N	2026-01-11 20:34:46.917108	45
14265	264	f	\N	2026-01-11 20:34:46.917108	45
14266	265	f	\N	2026-01-11 20:34:46.917108	45
14267	266	f	\N	2026-01-11 20:34:46.917108	45
14268	267	f	\N	2026-01-11 20:34:46.917108	45
14269	268	f	\N	2026-01-11 20:34:46.917108	45
14270	269	f	\N	2026-01-11 20:34:46.917108	45
14271	270	f	\N	2026-01-11 20:34:46.917108	45
14272	271	f	\N	2026-01-11 20:34:46.917108	45
14273	272	f	\N	2026-01-11 20:34:46.917108	45
14274	273	f	\N	2026-01-11 20:34:46.917108	45
14275	274	f	\N	2026-01-11 20:34:46.917108	45
14276	275	f	\N	2026-01-11 20:34:46.917108	45
14277	276	f	\N	2026-01-11 20:34:46.917108	45
14278	277	f	\N	2026-01-11 20:34:46.917108	45
14279	278	f	\N	2026-01-11 20:34:46.917108	45
14280	279	f	\N	2026-01-11 20:34:46.917108	45
14281	280	f	\N	2026-01-11 20:34:46.917108	45
14282	281	f	\N	2026-01-11 20:34:46.917108	45
14283	282	f	\N	2026-01-11 20:34:46.917108	45
14284	283	f	\N	2026-01-11 20:34:46.917108	45
14285	284	f	\N	2026-01-11 20:34:46.917108	45
14286	285	f	\N	2026-01-11 20:34:46.917108	45
14287	286	f	\N	2026-01-11 20:34:46.917108	45
14288	287	f	\N	2026-01-11 20:34:46.917108	45
14289	288	f	\N	2026-01-11 20:34:46.917108	45
14290	289	f	\N	2026-01-11 20:34:46.917108	45
14291	290	f	\N	2026-01-11 20:34:46.917108	45
14292	291	f	\N	2026-01-11 20:34:46.917108	45
14293	292	f	\N	2026-01-11 20:34:46.917108	45
14294	293	f	\N	2026-01-11 20:34:46.917108	45
14295	294	f	\N	2026-01-11 20:34:46.917108	45
14296	295	f	\N	2026-01-11 20:34:46.917108	45
14297	296	f	\N	2026-01-11 20:34:46.917108	45
14298	297	f	\N	2026-01-11 20:34:46.917108	45
14299	298	f	\N	2026-01-11 20:34:46.917108	45
14300	299	f	\N	2026-01-11 20:34:46.917108	45
14301	300	f	\N	2026-01-11 20:34:46.917108	45
14302	301	f	\N	2026-01-11 20:34:46.917108	45
14303	302	f	\N	2026-01-11 20:34:46.917108	45
14304	303	f	\N	2026-01-11 20:34:46.917108	45
14305	304	f	\N	2026-01-11 20:34:46.917108	45
14306	305	f	\N	2026-01-11 20:34:46.917108	45
14307	306	f	\N	2026-01-11 20:34:46.917108	45
14308	307	f	\N	2026-01-11 20:34:46.917108	45
14309	308	f	\N	2026-01-11 20:34:46.917108	45
14310	309	f	\N	2026-01-11 20:34:46.917108	45
14311	310	f	\N	2026-01-11 20:34:46.917108	45
14312	311	f	\N	2026-01-11 20:34:46.917108	45
14313	312	f	\N	2026-01-11 20:34:46.917108	45
14314	313	f	\N	2026-01-11 20:34:46.917108	45
14315	314	f	\N	2026-01-11 20:34:46.917108	45
14316	315	f	\N	2026-01-11 20:34:46.917108	45
14317	316	f	\N	2026-01-11 20:34:46.917108	45
14318	317	f	\N	2026-01-11 20:34:46.917108	45
14319	318	f	\N	2026-01-11 20:34:46.917108	45
14320	319	f	\N	2026-01-11 20:34:46.917108	45
14321	320	f	\N	2026-01-11 20:34:46.917108	45
14322	321	f	\N	2026-01-11 20:34:46.917108	45
14323	322	f	\N	2026-01-11 20:34:46.917108	45
14324	323	f	\N	2026-01-11 20:34:46.917108	45
14325	324	f	\N	2026-01-11 20:34:46.917108	45
14326	325	f	\N	2026-01-11 20:34:46.917108	45
14327	326	f	\N	2026-01-11 20:34:46.917108	45
14328	327	f	\N	2026-01-11 20:34:46.917108	45
14329	328	f	\N	2026-01-11 20:34:46.917108	45
14330	329	f	\N	2026-01-11 20:34:46.917108	45
14331	330	f	\N	2026-01-11 20:34:46.917108	45
14332	331	f	\N	2026-01-11 20:34:46.917108	45
14333	332	f	\N	2026-01-11 20:34:46.917108	45
14334	333	f	\N	2026-01-11 20:34:46.917108	45
14335	334	f	\N	2026-01-11 20:34:46.917108	45
14336	335	f	\N	2026-01-11 20:34:46.917108	45
14337	336	f	\N	2026-01-11 20:34:46.917108	45
14338	337	f	\N	2026-01-11 20:34:46.917108	45
14339	338	f	\N	2026-01-11 20:34:46.917108	45
14340	339	f	\N	2026-01-11 20:34:46.917108	45
14341	340	f	\N	2026-01-11 20:34:46.917108	45
14342	341	f	\N	2026-01-11 20:34:46.917108	45
14343	342	f	\N	2026-01-11 20:34:46.917108	45
14344	343	f	\N	2026-01-11 20:34:46.917108	45
14345	344	f	\N	2026-01-11 20:34:46.917108	45
14346	345	f	\N	2026-01-11 20:34:46.917108	45
14347	346	f	\N	2026-01-11 20:34:46.917108	45
14348	347	f	\N	2026-01-11 20:34:46.917108	45
14349	348	f	\N	2026-01-11 20:34:46.917108	45
14350	349	f	\N	2026-01-11 20:34:46.917108	45
14351	350	f	\N	2026-01-11 20:34:46.917108	45
14352	351	f	\N	2026-01-11 20:34:46.917108	45
14353	352	f	\N	2026-01-11 20:34:46.917108	45
14354	353	f	\N	2026-01-11 20:34:46.917108	45
14355	354	f	\N	2026-01-11 20:34:46.917108	45
14356	355	f	\N	2026-01-11 20:34:46.917108	45
14357	356	f	\N	2026-01-11 20:34:46.917108	45
14358	357	f	\N	2026-01-11 20:34:46.917108	45
14359	358	f	\N	2026-01-11 20:34:46.917108	45
14360	359	f	\N	2026-01-11 20:34:46.917108	45
14361	360	f	\N	2026-01-11 20:34:46.917108	45
14362	361	f	\N	2026-01-11 20:34:46.917108	45
14363	362	f	\N	2026-01-11 20:34:46.917108	45
14364	363	f	\N	2026-01-11 20:34:46.917108	45
14365	364	f	\N	2026-01-11 20:34:46.917108	45
14366	365	f	\N	2026-01-11 20:34:46.917108	45
14367	366	f	\N	2026-01-11 20:34:46.917108	45
14368	367	f	\N	2026-01-11 20:34:46.917108	45
14369	368	f	\N	2026-01-11 20:34:46.917108	45
14370	369	f	\N	2026-01-11 20:34:46.917108	45
14371	370	f	\N	2026-01-11 20:34:46.917108	45
14372	371	f	\N	2026-01-11 20:34:46.917108	45
14373	372	f	\N	2026-01-11 20:34:46.917108	45
14374	373	f	\N	2026-01-11 20:34:46.917108	45
14375	374	f	\N	2026-01-11 20:34:46.917108	45
14376	375	f	\N	2026-01-11 20:34:46.917108	45
14377	376	f	\N	2026-01-11 20:34:46.917108	45
14378	377	f	\N	2026-01-11 20:34:46.917108	45
14379	378	f	\N	2026-01-11 20:34:46.917108	45
14380	379	f	\N	2026-01-11 20:34:46.917108	45
14381	380	f	\N	2026-01-11 20:34:46.917108	45
14382	381	f	\N	2026-01-11 20:34:46.917108	45
14383	382	f	\N	2026-01-11 20:34:46.917108	45
14384	383	f	\N	2026-01-11 20:34:46.917108	45
14385	384	f	\N	2026-01-11 20:34:46.917108	45
14386	385	f	\N	2026-01-11 20:34:46.917108	45
14387	386	f	\N	2026-01-11 20:34:46.917108	45
14388	387	f	\N	2026-01-11 20:34:46.917108	45
14389	388	f	\N	2026-01-11 20:34:46.917108	45
14390	389	f	\N	2026-01-11 20:34:46.917108	45
14391	390	f	\N	2026-01-11 20:34:46.917108	45
14392	391	f	\N	2026-01-11 20:34:46.917108	45
14393	392	f	\N	2026-01-11 20:34:46.917108	45
14394	393	f	\N	2026-01-11 20:34:46.917108	45
14395	394	f	\N	2026-01-11 20:34:46.917108	45
14396	395	f	\N	2026-01-11 20:34:46.917108	45
14397	396	f	\N	2026-01-11 20:34:46.917108	45
14398	397	f	\N	2026-01-11 20:34:46.917108	45
14399	398	f	\N	2026-01-11 20:34:46.917108	45
14400	399	f	\N	2026-01-11 20:34:46.917108	45
14401	400	f	\N	2026-01-11 20:34:46.917108	45
14402	401	f	\N	2026-01-11 20:34:46.917108	45
14403	402	f	\N	2026-01-11 20:34:46.917108	45
14404	403	f	\N	2026-01-11 20:34:46.917108	45
14405	404	f	\N	2026-01-11 20:34:46.917108	45
14406	405	f	\N	2026-01-11 20:34:46.917108	45
14407	406	f	\N	2026-01-11 20:34:46.917108	45
14408	407	f	\N	2026-01-11 20:34:46.917108	45
14409	408	f	\N	2026-01-11 20:34:46.917108	45
14410	409	f	\N	2026-01-11 20:34:46.917108	45
14411	410	f	\N	2026-01-11 20:34:46.917108	45
14412	411	f	\N	2026-01-11 20:34:46.917108	45
14413	412	f	\N	2026-01-11 20:34:46.917108	45
14414	413	f	\N	2026-01-11 20:34:46.917108	45
14415	414	f	\N	2026-01-11 20:34:46.917108	45
14416	415	f	\N	2026-01-11 20:34:46.917108	45
14417	416	f	\N	2026-01-11 20:34:46.917108	45
14418	417	f	\N	2026-01-11 20:34:46.917108	45
14419	418	f	\N	2026-01-11 20:34:46.917108	45
14420	419	f	\N	2026-01-11 20:34:46.917108	45
14421	420	f	\N	2026-01-11 20:34:46.917108	45
14422	421	f	\N	2026-01-11 20:34:46.917108	45
14423	422	f	\N	2026-01-11 20:34:46.917108	45
14424	423	f	\N	2026-01-11 20:34:46.917108	45
14425	424	f	\N	2026-01-11 20:34:46.917108	45
14426	425	f	\N	2026-01-11 20:34:46.917108	45
14427	426	f	\N	2026-01-11 20:34:46.917108	45
14428	427	f	\N	2026-01-11 20:34:46.917108	45
14429	428	f	\N	2026-01-11 20:34:46.917108	45
14430	429	f	\N	2026-01-11 20:34:46.917108	45
14431	430	f	\N	2026-01-11 20:34:46.917108	45
14432	431	f	\N	2026-01-11 20:34:46.917108	45
14433	432	f	\N	2026-01-11 20:34:46.917108	45
14434	433	f	\N	2026-01-11 20:34:46.917108	45
14435	434	f	\N	2026-01-11 20:34:46.917108	45
14436	435	f	\N	2026-01-11 20:34:46.917108	45
14437	436	f	\N	2026-01-11 20:34:46.917108	45
14438	437	f	\N	2026-01-11 20:34:46.917108	45
14439	438	f	\N	2026-01-11 20:34:46.917108	45
14440	439	f	\N	2026-01-11 20:34:46.917108	45
14441	440	f	\N	2026-01-11 20:34:46.917108	45
14442	441	f	\N	2026-01-11 20:34:46.917108	45
14443	442	f	\N	2026-01-11 20:34:46.917108	45
14444	443	f	\N	2026-01-11 20:34:46.917108	45
14445	444	f	\N	2026-01-11 20:34:46.917108	45
14446	445	f	\N	2026-01-11 20:34:46.917108	45
14447	446	f	\N	2026-01-11 20:34:46.917108	45
14448	447	f	\N	2026-01-11 20:34:46.917108	45
14449	448	f	\N	2026-01-11 20:34:46.917108	45
14450	449	f	\N	2026-01-11 20:34:46.917108	45
14451	450	f	\N	2026-01-11 20:34:46.917108	45
14452	451	f	\N	2026-01-11 20:34:46.917108	45
14453	452	f	\N	2026-01-11 20:34:46.917108	45
14454	453	f	\N	2026-01-11 20:34:46.917108	45
14455	454	f	\N	2026-01-11 20:34:46.917108	45
14456	455	f	\N	2026-01-11 20:34:46.917108	45
14457	456	f	\N	2026-01-11 20:34:46.917108	45
14458	457	f	\N	2026-01-11 20:34:46.917108	45
14459	458	f	\N	2026-01-11 20:34:46.917108	45
14460	459	f	\N	2026-01-11 20:34:46.917108	45
14461	460	f	\N	2026-01-11 20:34:46.917108	45
14462	461	f	\N	2026-01-11 20:34:46.917108	45
14463	462	f	\N	2026-01-11 20:34:46.917108	45
14464	463	f	\N	2026-01-11 20:34:46.917108	45
14465	464	f	\N	2026-01-11 20:34:46.917108	45
14466	465	f	\N	2026-01-11 20:34:46.917108	45
14467	466	f	\N	2026-01-11 20:34:46.917108	45
14468	467	f	\N	2026-01-11 20:34:46.917108	45
14469	468	f	\N	2026-01-11 20:34:46.917108	45
14470	469	f	\N	2026-01-11 20:34:46.917108	45
14471	470	f	\N	2026-01-11 20:34:46.917108	45
14472	471	f	\N	2026-01-11 20:34:46.917108	45
14473	472	f	\N	2026-01-11 20:34:46.917108	45
14474	473	f	\N	2026-01-11 20:34:46.917108	45
14475	474	f	\N	2026-01-11 20:34:46.917108	45
14476	475	f	\N	2026-01-11 20:34:46.917108	45
14477	476	f	\N	2026-01-11 20:34:46.917108	45
14478	477	f	\N	2026-01-11 20:34:46.917108	45
14479	478	f	\N	2026-01-11 20:34:46.917108	45
14480	479	f	\N	2026-01-11 20:34:46.917108	45
14481	480	f	\N	2026-01-11 20:34:46.917108	45
14482	481	f	\N	2026-01-11 20:34:46.917108	45
14483	482	f	\N	2026-01-11 20:34:46.917108	45
14484	483	f	\N	2026-01-11 20:34:46.917108	45
14485	484	f	\N	2026-01-11 20:34:46.917108	45
14486	485	f	\N	2026-01-11 20:34:46.917108	45
14487	486	f	\N	2026-01-11 20:34:46.917108	45
14488	487	f	\N	2026-01-11 20:34:46.917108	45
14489	488	f	\N	2026-01-11 20:34:46.917108	45
14490	489	f	\N	2026-01-11 20:34:46.917108	45
14491	490	f	\N	2026-01-11 20:34:46.917108	45
14492	491	f	\N	2026-01-11 20:34:46.917108	45
14493	492	f	\N	2026-01-11 20:34:46.917108	45
14494	493	f	\N	2026-01-11 20:34:46.917108	45
14495	494	f	\N	2026-01-11 20:34:46.917108	45
14496	495	f	\N	2026-01-11 20:34:46.917108	45
14497	496	f	\N	2026-01-11 20:34:46.917108	45
14498	497	f	\N	2026-01-11 20:34:46.917108	45
14499	498	f	\N	2026-01-11 20:34:46.917108	45
14500	499	f	\N	2026-01-11 20:34:46.917108	45
14501	500	f	\N	2026-01-11 20:34:46.917108	45
14502	1	f	\N	2026-01-12 04:21:24.045237	46
14503	2	f	\N	2026-01-12 04:21:24.045237	46
14504	3	f	\N	2026-01-12 04:21:24.045237	46
14505	4	f	\N	2026-01-12 04:21:24.045237	46
14506	5	f	\N	2026-01-12 04:21:24.045237	46
14507	6	f	\N	2026-01-12 04:21:24.045237	46
14508	7	f	\N	2026-01-12 04:21:24.045237	46
14509	8	f	\N	2026-01-12 04:21:24.045237	46
14510	9	f	\N	2026-01-12 04:21:24.045237	46
14511	10	f	\N	2026-01-12 04:21:24.045237	46
14512	11	f	\N	2026-01-12 04:21:24.045237	46
14513	12	f	\N	2026-01-12 04:21:24.045237	46
14514	13	f	\N	2026-01-12 04:21:24.045237	46
14515	14	f	\N	2026-01-12 04:21:24.045237	46
14516	15	f	\N	2026-01-12 04:21:24.045237	46
14517	16	f	\N	2026-01-12 04:21:24.045237	46
14518	17	f	\N	2026-01-12 04:21:24.045237	46
14519	18	f	\N	2026-01-12 04:21:24.045237	46
14520	19	f	\N	2026-01-12 04:21:24.045237	46
14521	20	f	\N	2026-01-12 04:21:24.045237	46
14522	21	f	\N	2026-01-12 04:21:24.045237	46
14523	22	f	\N	2026-01-12 04:21:24.045237	46
14524	23	f	\N	2026-01-12 04:21:24.045237	46
14525	24	f	\N	2026-01-12 04:21:24.045237	46
14526	25	f	\N	2026-01-12 04:21:24.045237	46
14527	26	f	\N	2026-01-12 04:21:24.045237	46
14528	27	f	\N	2026-01-12 04:21:24.045237	46
14529	28	f	\N	2026-01-12 04:21:24.045237	46
14530	29	f	\N	2026-01-12 04:21:24.045237	46
14531	30	f	\N	2026-01-12 04:21:24.045237	46
14532	31	f	\N	2026-01-12 04:21:24.045237	46
14533	32	f	\N	2026-01-12 04:21:24.045237	46
14534	33	f	\N	2026-01-12 04:21:24.045237	46
14535	34	f	\N	2026-01-12 04:21:24.045237	46
14536	35	f	\N	2026-01-12 04:21:24.045237	46
14537	36	f	\N	2026-01-12 04:21:24.045237	46
14538	37	f	\N	2026-01-12 04:21:24.045237	46
14539	38	f	\N	2026-01-12 04:21:24.045237	46
14540	39	f	\N	2026-01-12 04:21:24.045237	46
14541	40	f	\N	2026-01-12 04:21:24.045237	46
14542	41	f	\N	2026-01-12 04:21:24.045237	46
14543	42	f	\N	2026-01-12 04:21:24.045237	46
14544	43	f	\N	2026-01-12 04:21:24.045237	46
14545	44	f	\N	2026-01-12 04:21:24.045237	46
14546	45	f	\N	2026-01-12 04:21:24.045237	46
14547	46	f	\N	2026-01-12 04:21:24.045237	46
14548	47	f	\N	2026-01-12 04:21:24.045237	46
14549	48	f	\N	2026-01-12 04:21:24.045237	46
14550	49	f	\N	2026-01-12 04:21:24.045237	46
14551	50	f	\N	2026-01-12 04:21:24.045237	46
14552	51	f	\N	2026-01-12 04:21:24.045237	46
14553	52	f	\N	2026-01-12 04:21:24.045237	46
14554	53	f	\N	2026-01-12 04:21:24.045237	46
14555	54	f	\N	2026-01-12 04:21:24.045237	46
14556	55	f	\N	2026-01-12 04:21:24.045237	46
14557	56	f	\N	2026-01-12 04:21:24.045237	46
14558	57	f	\N	2026-01-12 04:21:24.045237	46
14559	58	f	\N	2026-01-12 04:21:24.045237	46
14560	59	f	\N	2026-01-12 04:21:24.045237	46
14561	60	f	\N	2026-01-12 04:21:24.045237	46
14562	61	f	\N	2026-01-12 04:21:24.045237	46
14563	62	f	\N	2026-01-12 04:21:24.045237	46
14564	63	f	\N	2026-01-12 04:21:24.045237	46
14565	64	f	\N	2026-01-12 04:21:24.045237	46
14566	65	f	\N	2026-01-12 04:21:24.045237	46
14567	66	f	\N	2026-01-12 04:21:24.045237	46
14568	67	f	\N	2026-01-12 04:21:24.045237	46
14569	68	f	\N	2026-01-12 04:21:24.045237	46
14570	69	f	\N	2026-01-12 04:21:24.045237	46
14571	70	f	\N	2026-01-12 04:21:24.045237	46
14572	71	f	\N	2026-01-12 04:21:24.045237	46
14573	72	f	\N	2026-01-12 04:21:24.045237	46
14574	73	f	\N	2026-01-12 04:21:24.045237	46
14575	74	f	\N	2026-01-12 04:21:24.045237	46
14576	75	f	\N	2026-01-12 04:21:24.045237	46
14577	76	f	\N	2026-01-12 04:21:24.045237	46
14578	77	f	\N	2026-01-12 04:21:24.045237	46
14579	78	f	\N	2026-01-12 04:21:24.045237	46
14580	79	f	\N	2026-01-12 04:21:24.045237	46
14581	80	f	\N	2026-01-12 04:21:24.045237	46
14582	81	f	\N	2026-01-12 04:21:24.045237	46
14583	82	f	\N	2026-01-12 04:21:24.045237	46
14584	83	f	\N	2026-01-12 04:21:24.045237	46
14585	84	f	\N	2026-01-12 04:21:24.045237	46
14586	85	f	\N	2026-01-12 04:21:24.045237	46
14587	86	f	\N	2026-01-12 04:21:24.045237	46
14588	87	f	\N	2026-01-12 04:21:24.045237	46
14589	88	f	\N	2026-01-12 04:21:24.045237	46
14590	89	f	\N	2026-01-12 04:21:24.045237	46
14591	90	f	\N	2026-01-12 04:21:24.045237	46
14592	91	f	\N	2026-01-12 04:21:24.045237	46
14593	92	f	\N	2026-01-12 04:21:24.045237	46
14594	93	f	\N	2026-01-12 04:21:24.045237	46
14595	94	f	\N	2026-01-12 04:21:24.045237	46
14596	95	f	\N	2026-01-12 04:21:24.045237	46
14597	96	f	\N	2026-01-12 04:21:24.045237	46
14598	97	f	\N	2026-01-12 04:21:24.045237	46
14599	98	f	\N	2026-01-12 04:21:24.045237	46
14600	99	f	\N	2026-01-12 04:21:24.045237	46
14601	100	f	\N	2026-01-12 04:21:24.045237	46
14602	101	f	\N	2026-01-12 04:21:24.045237	46
14603	102	f	\N	2026-01-12 04:21:24.045237	46
14604	103	f	\N	2026-01-12 04:21:24.045237	46
14605	104	f	\N	2026-01-12 04:21:24.045237	46
14606	105	f	\N	2026-01-12 04:21:24.045237	46
14607	106	f	\N	2026-01-12 04:21:24.045237	46
14608	107	f	\N	2026-01-12 04:21:24.045237	46
14609	108	f	\N	2026-01-12 04:21:24.045237	46
14610	109	f	\N	2026-01-12 04:21:24.045237	46
14611	110	f	\N	2026-01-12 04:21:24.045237	46
14612	111	f	\N	2026-01-12 04:21:24.045237	46
14613	112	f	\N	2026-01-12 04:21:24.045237	46
14614	113	f	\N	2026-01-12 04:21:24.045237	46
14615	114	f	\N	2026-01-12 04:21:24.045237	46
14616	115	f	\N	2026-01-12 04:21:24.045237	46
14617	116	f	\N	2026-01-12 04:21:24.045237	46
14618	117	f	\N	2026-01-12 04:21:24.045237	46
14619	118	f	\N	2026-01-12 04:21:24.045237	46
14620	119	f	\N	2026-01-12 04:21:24.045237	46
14621	120	f	\N	2026-01-12 04:21:24.045237	46
14622	121	f	\N	2026-01-12 04:21:24.045237	46
14623	122	f	\N	2026-01-12 04:21:24.045237	46
14624	123	f	\N	2026-01-12 04:21:24.045237	46
14625	124	f	\N	2026-01-12 04:21:24.045237	46
14626	125	f	\N	2026-01-12 04:21:24.045237	46
14627	126	f	\N	2026-01-12 04:21:24.045237	46
14628	127	f	\N	2026-01-12 04:21:24.045237	46
14629	128	f	\N	2026-01-12 04:21:24.045237	46
14630	129	f	\N	2026-01-12 04:21:24.045237	46
14631	130	f	\N	2026-01-12 04:21:24.045237	46
14632	131	f	\N	2026-01-12 04:21:24.045237	46
14633	132	f	\N	2026-01-12 04:21:24.045237	46
14634	133	f	\N	2026-01-12 04:21:24.045237	46
14635	134	f	\N	2026-01-12 04:21:24.045237	46
14636	135	f	\N	2026-01-12 04:21:24.045237	46
14637	136	f	\N	2026-01-12 04:21:24.045237	46
14638	137	f	\N	2026-01-12 04:21:24.045237	46
14639	138	f	\N	2026-01-12 04:21:24.045237	46
14640	139	f	\N	2026-01-12 04:21:24.045237	46
14641	140	f	\N	2026-01-12 04:21:24.045237	46
14642	141	f	\N	2026-01-12 04:21:24.045237	46
14643	142	f	\N	2026-01-12 04:21:24.045237	46
14644	143	f	\N	2026-01-12 04:21:24.045237	46
14645	144	f	\N	2026-01-12 04:21:24.045237	46
14646	145	f	\N	2026-01-12 04:21:24.045237	46
14647	146	f	\N	2026-01-12 04:21:24.045237	46
14648	147	f	\N	2026-01-12 04:21:24.045237	46
14649	148	f	\N	2026-01-12 04:21:24.045237	46
14650	149	f	\N	2026-01-12 04:21:24.045237	46
14651	150	f	\N	2026-01-12 04:21:24.045237	46
14652	151	f	\N	2026-01-12 04:21:24.045237	46
14653	152	f	\N	2026-01-12 04:21:24.045237	46
14654	153	f	\N	2026-01-12 04:21:24.045237	46
14655	154	f	\N	2026-01-12 04:21:24.045237	46
14656	155	f	\N	2026-01-12 04:21:24.045237	46
14657	156	f	\N	2026-01-12 04:21:24.045237	46
14658	157	f	\N	2026-01-12 04:21:24.045237	46
14659	158	f	\N	2026-01-12 04:21:24.045237	46
14660	159	f	\N	2026-01-12 04:21:24.045237	46
14661	160	f	\N	2026-01-12 04:21:24.045237	46
14662	161	f	\N	2026-01-12 04:21:24.045237	46
14663	162	f	\N	2026-01-12 04:21:24.045237	46
14664	163	f	\N	2026-01-12 04:21:24.045237	46
14665	164	f	\N	2026-01-12 04:21:24.045237	46
14666	165	f	\N	2026-01-12 04:21:24.045237	46
14667	166	f	\N	2026-01-12 04:21:24.045237	46
14668	167	f	\N	2026-01-12 04:21:24.045237	46
14669	168	f	\N	2026-01-12 04:21:24.045237	46
14670	169	f	\N	2026-01-12 04:21:24.045237	46
14671	170	f	\N	2026-01-12 04:21:24.045237	46
14672	171	f	\N	2026-01-12 04:21:24.045237	46
14673	172	f	\N	2026-01-12 04:21:24.045237	46
14674	173	f	\N	2026-01-12 04:21:24.045237	46
14675	174	f	\N	2026-01-12 04:21:24.045237	46
14676	175	f	\N	2026-01-12 04:21:24.045237	46
14677	176	f	\N	2026-01-12 04:21:24.045237	46
14678	177	f	\N	2026-01-12 04:21:24.045237	46
14679	178	f	\N	2026-01-12 04:21:24.045237	46
14680	179	f	\N	2026-01-12 04:21:24.045237	46
14681	180	f	\N	2026-01-12 04:21:24.045237	46
14682	181	f	\N	2026-01-12 04:21:24.045237	46
14683	182	f	\N	2026-01-12 04:21:24.045237	46
14684	183	f	\N	2026-01-12 04:21:24.045237	46
14685	184	f	\N	2026-01-12 04:21:24.045237	46
14686	185	f	\N	2026-01-12 04:21:24.045237	46
14687	186	f	\N	2026-01-12 04:21:24.045237	46
14688	187	f	\N	2026-01-12 04:21:24.045237	46
14689	188	f	\N	2026-01-12 04:21:24.045237	46
14690	189	f	\N	2026-01-12 04:21:24.045237	46
14691	190	f	\N	2026-01-12 04:21:24.045237	46
14692	191	f	\N	2026-01-12 04:21:24.045237	46
14693	192	f	\N	2026-01-12 04:21:24.045237	46
14694	193	f	\N	2026-01-12 04:21:24.045237	46
14695	194	f	\N	2026-01-12 04:21:24.045237	46
14696	195	f	\N	2026-01-12 04:21:24.045237	46
14697	196	f	\N	2026-01-12 04:21:24.045237	46
14698	197	f	\N	2026-01-12 04:21:24.045237	46
14699	198	f	\N	2026-01-12 04:21:24.045237	46
14700	199	f	\N	2026-01-12 04:21:24.045237	46
14701	200	f	\N	2026-01-12 04:21:24.045237	46
14702	201	f	\N	2026-01-12 04:21:24.045237	46
14703	202	f	\N	2026-01-12 04:21:24.045237	46
14704	203	f	\N	2026-01-12 04:21:24.045237	46
14705	204	f	\N	2026-01-12 04:21:24.045237	46
14706	205	f	\N	2026-01-12 04:21:24.045237	46
14707	206	f	\N	2026-01-12 04:21:24.045237	46
14708	207	f	\N	2026-01-12 04:21:24.045237	46
14709	208	f	\N	2026-01-12 04:21:24.045237	46
14710	209	f	\N	2026-01-12 04:21:24.045237	46
14711	210	f	\N	2026-01-12 04:21:24.045237	46
14712	211	f	\N	2026-01-12 04:21:24.045237	46
14713	212	f	\N	2026-01-12 04:21:24.045237	46
14714	213	f	\N	2026-01-12 04:21:24.045237	46
14715	214	f	\N	2026-01-12 04:21:24.045237	46
14716	215	f	\N	2026-01-12 04:21:24.045237	46
14717	216	f	\N	2026-01-12 04:21:24.045237	46
14718	217	f	\N	2026-01-12 04:21:24.045237	46
14719	218	f	\N	2026-01-12 04:21:24.045237	46
14720	219	f	\N	2026-01-12 04:21:24.045237	46
14721	220	f	\N	2026-01-12 04:21:24.045237	46
14722	221	f	\N	2026-01-12 04:21:24.045237	46
14723	222	f	\N	2026-01-12 04:21:24.045237	46
14724	223	f	\N	2026-01-12 04:21:24.045237	46
14725	224	f	\N	2026-01-12 04:21:24.045237	46
14726	225	f	\N	2026-01-12 04:21:24.045237	46
14727	226	f	\N	2026-01-12 04:21:24.045237	46
14728	227	f	\N	2026-01-12 04:21:24.045237	46
14729	228	f	\N	2026-01-12 04:21:24.045237	46
14730	229	f	\N	2026-01-12 04:21:24.045237	46
14731	230	f	\N	2026-01-12 04:21:24.045237	46
14732	231	f	\N	2026-01-12 04:21:24.045237	46
14733	232	f	\N	2026-01-12 04:21:24.045237	46
14734	233	f	\N	2026-01-12 04:21:24.045237	46
14735	234	f	\N	2026-01-12 04:21:24.045237	46
14736	235	f	\N	2026-01-12 04:21:24.045237	46
14737	236	f	\N	2026-01-12 04:21:24.045237	46
14738	237	f	\N	2026-01-12 04:21:24.045237	46
14739	238	f	\N	2026-01-12 04:21:24.045237	46
14740	239	f	\N	2026-01-12 04:21:24.045237	46
14741	240	f	\N	2026-01-12 04:21:24.045237	46
14742	241	f	\N	2026-01-12 04:21:24.045237	46
14743	242	f	\N	2026-01-12 04:21:24.045237	46
14744	243	f	\N	2026-01-12 04:21:24.045237	46
14745	244	f	\N	2026-01-12 04:21:24.045237	46
14746	245	f	\N	2026-01-12 04:21:24.045237	46
14747	246	f	\N	2026-01-12 04:21:24.045237	46
14748	247	f	\N	2026-01-12 04:21:24.045237	46
14749	248	f	\N	2026-01-12 04:21:24.045237	46
14750	249	f	\N	2026-01-12 04:21:24.045237	46
14751	250	f	\N	2026-01-12 04:21:24.045237	46
14752	251	f	\N	2026-01-12 04:21:24.045237	46
14753	252	f	\N	2026-01-12 04:21:24.045237	46
14754	253	f	\N	2026-01-12 04:21:24.045237	46
14755	254	f	\N	2026-01-12 04:21:24.045237	46
14756	255	f	\N	2026-01-12 04:21:24.045237	46
14757	256	f	\N	2026-01-12 04:21:24.045237	46
14758	257	f	\N	2026-01-12 04:21:24.045237	46
14759	258	f	\N	2026-01-12 04:21:24.045237	46
14760	259	f	\N	2026-01-12 04:21:24.045237	46
14761	260	f	\N	2026-01-12 04:21:24.045237	46
14762	261	f	\N	2026-01-12 04:21:24.045237	46
14763	262	f	\N	2026-01-12 04:21:24.045237	46
14764	263	f	\N	2026-01-12 04:21:24.045237	46
14765	264	f	\N	2026-01-12 04:21:24.045237	46
14766	265	f	\N	2026-01-12 04:21:24.045237	46
14767	266	f	\N	2026-01-12 04:21:24.045237	46
14768	267	f	\N	2026-01-12 04:21:24.045237	46
14769	268	f	\N	2026-01-12 04:21:24.045237	46
14770	269	f	\N	2026-01-12 04:21:24.045237	46
14771	270	f	\N	2026-01-12 04:21:24.045237	46
14772	271	f	\N	2026-01-12 04:21:24.045237	46
14773	272	f	\N	2026-01-12 04:21:24.045237	46
14774	273	f	\N	2026-01-12 04:21:24.045237	46
14775	274	f	\N	2026-01-12 04:21:24.045237	46
14776	275	f	\N	2026-01-12 04:21:24.045237	46
14777	276	f	\N	2026-01-12 04:21:24.045237	46
14778	277	f	\N	2026-01-12 04:21:24.045237	46
14779	278	f	\N	2026-01-12 04:21:24.045237	46
14780	279	f	\N	2026-01-12 04:21:24.045237	46
14781	280	f	\N	2026-01-12 04:21:24.045237	46
14782	281	f	\N	2026-01-12 04:21:24.045237	46
14783	282	f	\N	2026-01-12 04:21:24.045237	46
14784	283	f	\N	2026-01-12 04:21:24.045237	46
14785	284	f	\N	2026-01-12 04:21:24.045237	46
14786	285	f	\N	2026-01-12 04:21:24.045237	46
14787	286	f	\N	2026-01-12 04:21:24.045237	46
14788	287	f	\N	2026-01-12 04:21:24.045237	46
14789	288	f	\N	2026-01-12 04:21:24.045237	46
14790	289	f	\N	2026-01-12 04:21:24.045237	46
14791	290	f	\N	2026-01-12 04:21:24.045237	46
14792	291	f	\N	2026-01-12 04:21:24.045237	46
14793	292	f	\N	2026-01-12 04:21:24.045237	46
14794	293	f	\N	2026-01-12 04:21:24.045237	46
14795	294	f	\N	2026-01-12 04:21:24.045237	46
14796	295	f	\N	2026-01-12 04:21:24.045237	46
14797	296	f	\N	2026-01-12 04:21:24.045237	46
14798	297	f	\N	2026-01-12 04:21:24.045237	46
14799	298	f	\N	2026-01-12 04:21:24.045237	46
14800	299	f	\N	2026-01-12 04:21:24.045237	46
14801	300	f	\N	2026-01-12 04:21:24.045237	46
14802	301	f	\N	2026-01-12 04:21:24.045237	46
14803	302	f	\N	2026-01-12 04:21:24.045237	46
14804	303	f	\N	2026-01-12 04:21:24.045237	46
14805	304	f	\N	2026-01-12 04:21:24.045237	46
14806	305	f	\N	2026-01-12 04:21:24.045237	46
14807	306	f	\N	2026-01-12 04:21:24.045237	46
14808	307	f	\N	2026-01-12 04:21:24.045237	46
14809	308	f	\N	2026-01-12 04:21:24.045237	46
14810	309	f	\N	2026-01-12 04:21:24.045237	46
14811	310	f	\N	2026-01-12 04:21:24.045237	46
14812	311	f	\N	2026-01-12 04:21:24.045237	46
14813	312	f	\N	2026-01-12 04:21:24.045237	46
14814	313	f	\N	2026-01-12 04:21:24.045237	46
14815	314	f	\N	2026-01-12 04:21:24.045237	46
14816	315	f	\N	2026-01-12 04:21:24.045237	46
14817	316	f	\N	2026-01-12 04:21:24.045237	46
14818	317	f	\N	2026-01-12 04:21:24.045237	46
14819	318	f	\N	2026-01-12 04:21:24.045237	46
14820	319	f	\N	2026-01-12 04:21:24.045237	46
14821	320	f	\N	2026-01-12 04:21:24.045237	46
14822	321	f	\N	2026-01-12 04:21:24.045237	46
14823	322	f	\N	2026-01-12 04:21:24.045237	46
14824	323	f	\N	2026-01-12 04:21:24.045237	46
14825	324	f	\N	2026-01-12 04:21:24.045237	46
14826	325	f	\N	2026-01-12 04:21:24.045237	46
14827	326	f	\N	2026-01-12 04:21:24.045237	46
14828	327	f	\N	2026-01-12 04:21:24.045237	46
14829	328	f	\N	2026-01-12 04:21:24.045237	46
14830	329	f	\N	2026-01-12 04:21:24.045237	46
14831	330	f	\N	2026-01-12 04:21:24.045237	46
14832	331	f	\N	2026-01-12 04:21:24.045237	46
14833	332	f	\N	2026-01-12 04:21:24.045237	46
14834	333	f	\N	2026-01-12 04:21:24.045237	46
14835	334	f	\N	2026-01-12 04:21:24.045237	46
14836	335	f	\N	2026-01-12 04:21:24.045237	46
14837	336	f	\N	2026-01-12 04:21:24.045237	46
14838	337	f	\N	2026-01-12 04:21:24.045237	46
14839	338	f	\N	2026-01-12 04:21:24.045237	46
14840	339	f	\N	2026-01-12 04:21:24.045237	46
14841	340	f	\N	2026-01-12 04:21:24.045237	46
14842	341	f	\N	2026-01-12 04:21:24.045237	46
14843	342	f	\N	2026-01-12 04:21:24.045237	46
14844	343	f	\N	2026-01-12 04:21:24.045237	46
14845	344	f	\N	2026-01-12 04:21:24.045237	46
14846	345	f	\N	2026-01-12 04:21:24.045237	46
14847	346	f	\N	2026-01-12 04:21:24.045237	46
14848	347	f	\N	2026-01-12 04:21:24.045237	46
14849	348	f	\N	2026-01-12 04:21:24.045237	46
14850	349	f	\N	2026-01-12 04:21:24.045237	46
14851	350	f	\N	2026-01-12 04:21:24.045237	46
14852	351	f	\N	2026-01-12 04:21:24.045237	46
14853	352	f	\N	2026-01-12 04:21:24.045237	46
14854	353	f	\N	2026-01-12 04:21:24.045237	46
14855	354	f	\N	2026-01-12 04:21:24.045237	46
14856	355	f	\N	2026-01-12 04:21:24.045237	46
14857	356	f	\N	2026-01-12 04:21:24.045237	46
14858	357	f	\N	2026-01-12 04:21:24.045237	46
14859	358	f	\N	2026-01-12 04:21:24.045237	46
14860	359	f	\N	2026-01-12 04:21:24.045237	46
14861	360	f	\N	2026-01-12 04:21:24.045237	46
14862	361	f	\N	2026-01-12 04:21:24.045237	46
14863	362	f	\N	2026-01-12 04:21:24.045237	46
14864	363	f	\N	2026-01-12 04:21:24.045237	46
14865	364	f	\N	2026-01-12 04:21:24.045237	46
14866	365	f	\N	2026-01-12 04:21:24.045237	46
14867	366	f	\N	2026-01-12 04:21:24.045237	46
14868	367	f	\N	2026-01-12 04:21:24.045237	46
14869	368	f	\N	2026-01-12 04:21:24.045237	46
14870	369	f	\N	2026-01-12 04:21:24.045237	46
14871	370	f	\N	2026-01-12 04:21:24.045237	46
14872	371	f	\N	2026-01-12 04:21:24.045237	46
14873	372	f	\N	2026-01-12 04:21:24.045237	46
14874	373	f	\N	2026-01-12 04:21:24.045237	46
14875	374	f	\N	2026-01-12 04:21:24.045237	46
14876	375	f	\N	2026-01-12 04:21:24.045237	46
14877	376	f	\N	2026-01-12 04:21:24.045237	46
14878	377	f	\N	2026-01-12 04:21:24.045237	46
14879	378	f	\N	2026-01-12 04:21:24.045237	46
14880	379	f	\N	2026-01-12 04:21:24.045237	46
14881	380	f	\N	2026-01-12 04:21:24.045237	46
14882	381	f	\N	2026-01-12 04:21:24.045237	46
14883	382	f	\N	2026-01-12 04:21:24.045237	46
14884	383	f	\N	2026-01-12 04:21:24.045237	46
14885	384	f	\N	2026-01-12 04:21:24.045237	46
14886	385	f	\N	2026-01-12 04:21:24.045237	46
14887	386	f	\N	2026-01-12 04:21:24.045237	46
14888	387	f	\N	2026-01-12 04:21:24.045237	46
14889	388	f	\N	2026-01-12 04:21:24.045237	46
14890	389	f	\N	2026-01-12 04:21:24.045237	46
14891	390	f	\N	2026-01-12 04:21:24.045237	46
14892	391	f	\N	2026-01-12 04:21:24.045237	46
14893	392	f	\N	2026-01-12 04:21:24.045237	46
14894	393	f	\N	2026-01-12 04:21:24.045237	46
14895	394	f	\N	2026-01-12 04:21:24.045237	46
14896	395	f	\N	2026-01-12 04:21:24.045237	46
14897	396	f	\N	2026-01-12 04:21:24.045237	46
14898	397	f	\N	2026-01-12 04:21:24.045237	46
14899	398	f	\N	2026-01-12 04:21:24.045237	46
14900	399	f	\N	2026-01-12 04:21:24.045237	46
14901	400	f	\N	2026-01-12 04:21:24.045237	46
14902	401	f	\N	2026-01-12 04:21:24.045237	46
14903	402	f	\N	2026-01-12 04:21:24.045237	46
14904	403	f	\N	2026-01-12 04:21:24.045237	46
14905	404	f	\N	2026-01-12 04:21:24.045237	46
14906	405	f	\N	2026-01-12 04:21:24.045237	46
14907	406	f	\N	2026-01-12 04:21:24.045237	46
14908	407	f	\N	2026-01-12 04:21:24.045237	46
14909	408	f	\N	2026-01-12 04:21:24.045237	46
14910	409	f	\N	2026-01-12 04:21:24.045237	46
14911	410	f	\N	2026-01-12 04:21:24.045237	46
14912	411	f	\N	2026-01-12 04:21:24.045237	46
14913	412	f	\N	2026-01-12 04:21:24.045237	46
14914	413	f	\N	2026-01-12 04:21:24.045237	46
14915	414	f	\N	2026-01-12 04:21:24.045237	46
14916	415	f	\N	2026-01-12 04:21:24.045237	46
14917	416	f	\N	2026-01-12 04:21:24.045237	46
14918	417	f	\N	2026-01-12 04:21:24.045237	46
14919	418	f	\N	2026-01-12 04:21:24.045237	46
14920	419	f	\N	2026-01-12 04:21:24.045237	46
14921	420	f	\N	2026-01-12 04:21:24.045237	46
14922	421	f	\N	2026-01-12 04:21:24.045237	46
14923	422	f	\N	2026-01-12 04:21:24.045237	46
14924	423	f	\N	2026-01-12 04:21:24.045237	46
14925	424	f	\N	2026-01-12 04:21:24.045237	46
14926	425	f	\N	2026-01-12 04:21:24.045237	46
14927	426	f	\N	2026-01-12 04:21:24.045237	46
14928	427	f	\N	2026-01-12 04:21:24.045237	46
14929	428	f	\N	2026-01-12 04:21:24.045237	46
14930	429	f	\N	2026-01-12 04:21:24.045237	46
14931	430	f	\N	2026-01-12 04:21:24.045237	46
14932	431	f	\N	2026-01-12 04:21:24.045237	46
14933	432	f	\N	2026-01-12 04:21:24.045237	46
14934	433	f	\N	2026-01-12 04:21:24.045237	46
14935	434	f	\N	2026-01-12 04:21:24.045237	46
14936	435	f	\N	2026-01-12 04:21:24.045237	46
14937	436	f	\N	2026-01-12 04:21:24.045237	46
14938	437	f	\N	2026-01-12 04:21:24.045237	46
14939	438	f	\N	2026-01-12 04:21:24.045237	46
14940	439	f	\N	2026-01-12 04:21:24.045237	46
14941	440	f	\N	2026-01-12 04:21:24.045237	46
14942	441	f	\N	2026-01-12 04:21:24.045237	46
14943	442	f	\N	2026-01-12 04:21:24.045237	46
14944	443	f	\N	2026-01-12 04:21:24.045237	46
14945	444	f	\N	2026-01-12 04:21:24.045237	46
14946	445	f	\N	2026-01-12 04:21:24.045237	46
14947	446	f	\N	2026-01-12 04:21:24.045237	46
14948	447	f	\N	2026-01-12 04:21:24.045237	46
14949	448	f	\N	2026-01-12 04:21:24.045237	46
14950	449	f	\N	2026-01-12 04:21:24.045237	46
14951	450	f	\N	2026-01-12 04:21:24.045237	46
14952	451	f	\N	2026-01-12 04:21:24.045237	46
14953	452	f	\N	2026-01-12 04:21:24.045237	46
14954	453	f	\N	2026-01-12 04:21:24.045237	46
14955	454	f	\N	2026-01-12 04:21:24.045237	46
14956	455	f	\N	2026-01-12 04:21:24.045237	46
14957	456	f	\N	2026-01-12 04:21:24.045237	46
14958	457	f	\N	2026-01-12 04:21:24.045237	46
14959	458	f	\N	2026-01-12 04:21:24.045237	46
14960	459	f	\N	2026-01-12 04:21:24.045237	46
14961	460	f	\N	2026-01-12 04:21:24.045237	46
14962	461	f	\N	2026-01-12 04:21:24.045237	46
14963	462	f	\N	2026-01-12 04:21:24.045237	46
14964	463	f	\N	2026-01-12 04:21:24.045237	46
14965	464	f	\N	2026-01-12 04:21:24.045237	46
14966	465	f	\N	2026-01-12 04:21:24.045237	46
14967	466	f	\N	2026-01-12 04:21:24.045237	46
14968	467	f	\N	2026-01-12 04:21:24.045237	46
14969	468	f	\N	2026-01-12 04:21:24.045237	46
14970	469	f	\N	2026-01-12 04:21:24.045237	46
14971	470	f	\N	2026-01-12 04:21:24.045237	46
14972	471	f	\N	2026-01-12 04:21:24.045237	46
14973	472	f	\N	2026-01-12 04:21:24.045237	46
14974	473	f	\N	2026-01-12 04:21:24.045237	46
14975	474	f	\N	2026-01-12 04:21:24.045237	46
14976	475	f	\N	2026-01-12 04:21:24.045237	46
14977	476	f	\N	2026-01-12 04:21:24.045237	46
14978	477	f	\N	2026-01-12 04:21:24.045237	46
14979	478	f	\N	2026-01-12 04:21:24.045237	46
14980	479	f	\N	2026-01-12 04:21:24.045237	46
14981	480	f	\N	2026-01-12 04:21:24.045237	46
14982	481	f	\N	2026-01-12 04:21:24.045237	46
14983	482	f	\N	2026-01-12 04:21:24.045237	46
14984	483	f	\N	2026-01-12 04:21:24.045237	46
14985	484	f	\N	2026-01-12 04:21:24.045237	46
14986	485	f	\N	2026-01-12 04:21:24.045237	46
14987	486	f	\N	2026-01-12 04:21:24.045237	46
14988	487	f	\N	2026-01-12 04:21:24.045237	46
14989	488	f	\N	2026-01-12 04:21:24.045237	46
14990	489	f	\N	2026-01-12 04:21:24.045237	46
14991	490	f	\N	2026-01-12 04:21:24.045237	46
14992	491	f	\N	2026-01-12 04:21:24.045237	46
14993	492	f	\N	2026-01-12 04:21:24.045237	46
14994	493	f	\N	2026-01-12 04:21:24.045237	46
14995	494	f	\N	2026-01-12 04:21:24.045237	46
14996	495	f	\N	2026-01-12 04:21:24.045237	46
14997	496	f	\N	2026-01-12 04:21:24.045237	46
14998	497	f	\N	2026-01-12 04:21:24.045237	46
14999	498	f	\N	2026-01-12 04:21:24.045237	46
15000	499	f	\N	2026-01-12 04:21:24.045237	46
15001	500	f	\N	2026-01-12 04:21:24.045237	46
15002	1	f	\N	2026-01-12 04:36:15.023449	47
15003	2	f	\N	2026-01-12 04:36:15.023449	47
15004	3	f	\N	2026-01-12 04:36:15.023449	47
15005	4	f	\N	2026-01-12 04:36:15.023449	47
15006	5	f	\N	2026-01-12 04:36:15.023449	47
15007	6	f	\N	2026-01-12 04:36:15.023449	47
15008	7	f	\N	2026-01-12 04:36:15.023449	47
15009	8	f	\N	2026-01-12 04:36:15.023449	47
15010	9	f	\N	2026-01-12 04:36:15.023449	47
15011	10	f	\N	2026-01-12 04:36:15.023449	47
15012	11	f	\N	2026-01-12 04:36:15.023449	47
15013	12	f	\N	2026-01-12 04:36:15.023449	47
15014	13	f	\N	2026-01-12 04:36:15.023449	47
15015	14	f	\N	2026-01-12 04:36:15.023449	47
15016	15	f	\N	2026-01-12 04:36:15.023449	47
15017	16	f	\N	2026-01-12 04:36:15.023449	47
15018	17	f	\N	2026-01-12 04:36:15.023449	47
15019	18	f	\N	2026-01-12 04:36:15.023449	47
15020	19	f	\N	2026-01-12 04:36:15.023449	47
15021	20	f	\N	2026-01-12 04:36:15.023449	47
15022	21	f	\N	2026-01-12 04:36:15.023449	47
15023	22	f	\N	2026-01-12 04:36:15.023449	47
15024	23	f	\N	2026-01-12 04:36:15.023449	47
15025	24	f	\N	2026-01-12 04:36:15.023449	47
15026	25	f	\N	2026-01-12 04:36:15.023449	47
15027	26	f	\N	2026-01-12 04:36:15.023449	47
15028	27	f	\N	2026-01-12 04:36:15.023449	47
15029	28	f	\N	2026-01-12 04:36:15.023449	47
15030	29	f	\N	2026-01-12 04:36:15.023449	47
15031	30	f	\N	2026-01-12 04:36:15.023449	47
15032	31	f	\N	2026-01-12 04:36:15.023449	47
15033	32	f	\N	2026-01-12 04:36:15.023449	47
15034	33	f	\N	2026-01-12 04:36:15.023449	47
15035	34	f	\N	2026-01-12 04:36:15.023449	47
15036	35	f	\N	2026-01-12 04:36:15.023449	47
15037	36	f	\N	2026-01-12 04:36:15.023449	47
15038	37	f	\N	2026-01-12 04:36:15.023449	47
15039	38	f	\N	2026-01-12 04:36:15.023449	47
15040	39	f	\N	2026-01-12 04:36:15.023449	47
15041	40	f	\N	2026-01-12 04:36:15.023449	47
15042	41	f	\N	2026-01-12 04:36:15.023449	47
15043	42	f	\N	2026-01-12 04:36:15.023449	47
15044	43	f	\N	2026-01-12 04:36:15.023449	47
15045	44	f	\N	2026-01-12 04:36:15.023449	47
15046	45	f	\N	2026-01-12 04:36:15.023449	47
15047	46	f	\N	2026-01-12 04:36:15.023449	47
15048	47	f	\N	2026-01-12 04:36:15.023449	47
15049	48	f	\N	2026-01-12 04:36:15.023449	47
15050	49	f	\N	2026-01-12 04:36:15.023449	47
15051	50	f	\N	2026-01-12 04:36:15.023449	47
15052	51	f	\N	2026-01-12 04:36:15.023449	47
15053	52	f	\N	2026-01-12 04:36:15.023449	47
15054	53	f	\N	2026-01-12 04:36:15.023449	47
15055	54	f	\N	2026-01-12 04:36:15.023449	47
15056	55	f	\N	2026-01-12 04:36:15.023449	47
15057	56	f	\N	2026-01-12 04:36:15.023449	47
15058	57	f	\N	2026-01-12 04:36:15.023449	47
15059	58	f	\N	2026-01-12 04:36:15.023449	47
15060	59	f	\N	2026-01-12 04:36:15.023449	47
15061	60	f	\N	2026-01-12 04:36:15.023449	47
15062	61	f	\N	2026-01-12 04:36:15.023449	47
15063	62	f	\N	2026-01-12 04:36:15.023449	47
15064	63	f	\N	2026-01-12 04:36:15.023449	47
15065	64	f	\N	2026-01-12 04:36:15.023449	47
15066	65	f	\N	2026-01-12 04:36:15.023449	47
15067	66	f	\N	2026-01-12 04:36:15.023449	47
15068	67	f	\N	2026-01-12 04:36:15.023449	47
15069	68	f	\N	2026-01-12 04:36:15.023449	47
15070	69	f	\N	2026-01-12 04:36:15.023449	47
15071	70	f	\N	2026-01-12 04:36:15.023449	47
15072	71	f	\N	2026-01-12 04:36:15.023449	47
15073	72	f	\N	2026-01-12 04:36:15.023449	47
15074	73	f	\N	2026-01-12 04:36:15.023449	47
15075	74	f	\N	2026-01-12 04:36:15.023449	47
15076	75	f	\N	2026-01-12 04:36:15.023449	47
15077	76	f	\N	2026-01-12 04:36:15.023449	47
15078	77	f	\N	2026-01-12 04:36:15.023449	47
15079	78	f	\N	2026-01-12 04:36:15.023449	47
15080	79	f	\N	2026-01-12 04:36:15.023449	47
15081	80	f	\N	2026-01-12 04:36:15.023449	47
15082	81	f	\N	2026-01-12 04:36:15.023449	47
15083	82	f	\N	2026-01-12 04:36:15.023449	47
15084	83	f	\N	2026-01-12 04:36:15.023449	47
15085	84	f	\N	2026-01-12 04:36:15.023449	47
15086	85	f	\N	2026-01-12 04:36:15.023449	47
15087	86	f	\N	2026-01-12 04:36:15.023449	47
15088	87	f	\N	2026-01-12 04:36:15.023449	47
15089	88	f	\N	2026-01-12 04:36:15.023449	47
15090	89	f	\N	2026-01-12 04:36:15.023449	47
15091	90	f	\N	2026-01-12 04:36:15.023449	47
15092	91	f	\N	2026-01-12 04:36:15.023449	47
15093	92	f	\N	2026-01-12 04:36:15.023449	47
15094	93	f	\N	2026-01-12 04:36:15.023449	47
15095	94	f	\N	2026-01-12 04:36:15.023449	47
15096	95	f	\N	2026-01-12 04:36:15.023449	47
15097	96	f	\N	2026-01-12 04:36:15.023449	47
15098	97	f	\N	2026-01-12 04:36:15.023449	47
15099	98	f	\N	2026-01-12 04:36:15.023449	47
15100	99	f	\N	2026-01-12 04:36:15.023449	47
15101	100	f	\N	2026-01-12 04:36:15.023449	47
15102	101	f	\N	2026-01-12 04:36:15.023449	47
15103	102	f	\N	2026-01-12 04:36:15.023449	47
15104	103	f	\N	2026-01-12 04:36:15.023449	47
15105	104	f	\N	2026-01-12 04:36:15.023449	47
15106	105	f	\N	2026-01-12 04:36:15.023449	47
15107	106	f	\N	2026-01-12 04:36:15.023449	47
15108	107	f	\N	2026-01-12 04:36:15.023449	47
15109	108	f	\N	2026-01-12 04:36:15.023449	47
15110	109	f	\N	2026-01-12 04:36:15.023449	47
15111	110	f	\N	2026-01-12 04:36:15.023449	47
15112	111	f	\N	2026-01-12 04:36:15.023449	47
15113	112	f	\N	2026-01-12 04:36:15.023449	47
15114	113	f	\N	2026-01-12 04:36:15.023449	47
15115	114	f	\N	2026-01-12 04:36:15.023449	47
15116	115	f	\N	2026-01-12 04:36:15.023449	47
15117	116	f	\N	2026-01-12 04:36:15.023449	47
15118	117	f	\N	2026-01-12 04:36:15.023449	47
15119	118	f	\N	2026-01-12 04:36:15.023449	47
15120	119	f	\N	2026-01-12 04:36:15.023449	47
15121	120	f	\N	2026-01-12 04:36:15.023449	47
15122	121	f	\N	2026-01-12 04:36:15.023449	47
15123	122	f	\N	2026-01-12 04:36:15.023449	47
15124	123	f	\N	2026-01-12 04:36:15.023449	47
15125	124	f	\N	2026-01-12 04:36:15.023449	47
15126	125	f	\N	2026-01-12 04:36:15.023449	47
15127	126	f	\N	2026-01-12 04:36:15.023449	47
15128	127	f	\N	2026-01-12 04:36:15.023449	47
15129	128	f	\N	2026-01-12 04:36:15.023449	47
15130	129	f	\N	2026-01-12 04:36:15.023449	47
15131	130	f	\N	2026-01-12 04:36:15.023449	47
15132	131	f	\N	2026-01-12 04:36:15.023449	47
15133	132	f	\N	2026-01-12 04:36:15.023449	47
15134	133	f	\N	2026-01-12 04:36:15.023449	47
15135	134	f	\N	2026-01-12 04:36:15.023449	47
15136	135	f	\N	2026-01-12 04:36:15.023449	47
15137	136	f	\N	2026-01-12 04:36:15.023449	47
15138	137	f	\N	2026-01-12 04:36:15.023449	47
15139	138	f	\N	2026-01-12 04:36:15.023449	47
15140	139	f	\N	2026-01-12 04:36:15.023449	47
15141	140	f	\N	2026-01-12 04:36:15.023449	47
15142	141	f	\N	2026-01-12 04:36:15.023449	47
15143	142	f	\N	2026-01-12 04:36:15.023449	47
15144	143	f	\N	2026-01-12 04:36:15.023449	47
15145	144	f	\N	2026-01-12 04:36:15.023449	47
15146	145	f	\N	2026-01-12 04:36:15.023449	47
15147	146	f	\N	2026-01-12 04:36:15.023449	47
15148	147	f	\N	2026-01-12 04:36:15.023449	47
15149	148	f	\N	2026-01-12 04:36:15.023449	47
15150	149	f	\N	2026-01-12 04:36:15.023449	47
15151	150	f	\N	2026-01-12 04:36:15.023449	47
15152	151	f	\N	2026-01-12 04:36:15.023449	47
15153	152	f	\N	2026-01-12 04:36:15.023449	47
15154	153	f	\N	2026-01-12 04:36:15.023449	47
15155	154	f	\N	2026-01-12 04:36:15.023449	47
15156	155	f	\N	2026-01-12 04:36:15.023449	47
15157	156	f	\N	2026-01-12 04:36:15.023449	47
15158	157	f	\N	2026-01-12 04:36:15.023449	47
15159	158	f	\N	2026-01-12 04:36:15.023449	47
15160	159	f	\N	2026-01-12 04:36:15.023449	47
15161	160	f	\N	2026-01-12 04:36:15.023449	47
15162	161	f	\N	2026-01-12 04:36:15.023449	47
15163	162	f	\N	2026-01-12 04:36:15.023449	47
15164	163	f	\N	2026-01-12 04:36:15.023449	47
15165	164	f	\N	2026-01-12 04:36:15.023449	47
15166	165	f	\N	2026-01-12 04:36:15.023449	47
15167	166	f	\N	2026-01-12 04:36:15.023449	47
15168	167	f	\N	2026-01-12 04:36:15.023449	47
15169	168	f	\N	2026-01-12 04:36:15.023449	47
15170	169	f	\N	2026-01-12 04:36:15.023449	47
15171	170	f	\N	2026-01-12 04:36:15.023449	47
15172	171	f	\N	2026-01-12 04:36:15.023449	47
15173	172	f	\N	2026-01-12 04:36:15.023449	47
15174	173	f	\N	2026-01-12 04:36:15.023449	47
15175	174	f	\N	2026-01-12 04:36:15.023449	47
15176	175	f	\N	2026-01-12 04:36:15.023449	47
15177	176	f	\N	2026-01-12 04:36:15.023449	47
15178	177	f	\N	2026-01-12 04:36:15.023449	47
15179	178	f	\N	2026-01-12 04:36:15.023449	47
15180	179	f	\N	2026-01-12 04:36:15.023449	47
15181	180	f	\N	2026-01-12 04:36:15.023449	47
15182	181	f	\N	2026-01-12 04:36:15.023449	47
15183	182	f	\N	2026-01-12 04:36:15.023449	47
15184	183	f	\N	2026-01-12 04:36:15.023449	47
15185	184	f	\N	2026-01-12 04:36:15.023449	47
15186	185	f	\N	2026-01-12 04:36:15.023449	47
15187	186	f	\N	2026-01-12 04:36:15.023449	47
15188	187	f	\N	2026-01-12 04:36:15.023449	47
15189	188	f	\N	2026-01-12 04:36:15.023449	47
15190	189	f	\N	2026-01-12 04:36:15.023449	47
15191	190	f	\N	2026-01-12 04:36:15.023449	47
15192	191	f	\N	2026-01-12 04:36:15.023449	47
15193	192	f	\N	2026-01-12 04:36:15.023449	47
15194	193	f	\N	2026-01-12 04:36:15.023449	47
15195	194	f	\N	2026-01-12 04:36:15.023449	47
15196	195	f	\N	2026-01-12 04:36:15.023449	47
15197	196	f	\N	2026-01-12 04:36:15.023449	47
15198	197	f	\N	2026-01-12 04:36:15.023449	47
15199	198	f	\N	2026-01-12 04:36:15.023449	47
15200	199	f	\N	2026-01-12 04:36:15.023449	47
15201	200	f	\N	2026-01-12 04:36:15.023449	47
15202	201	f	\N	2026-01-12 04:36:15.023449	47
15203	202	f	\N	2026-01-12 04:36:15.023449	47
15204	203	f	\N	2026-01-12 04:36:15.023449	47
15205	204	f	\N	2026-01-12 04:36:15.023449	47
15206	205	f	\N	2026-01-12 04:36:15.023449	47
15207	206	f	\N	2026-01-12 04:36:15.023449	47
15208	207	f	\N	2026-01-12 04:36:15.023449	47
15209	208	f	\N	2026-01-12 04:36:15.023449	47
15210	209	f	\N	2026-01-12 04:36:15.023449	47
15211	210	f	\N	2026-01-12 04:36:15.023449	47
15212	211	f	\N	2026-01-12 04:36:15.023449	47
15213	212	f	\N	2026-01-12 04:36:15.023449	47
15214	213	f	\N	2026-01-12 04:36:15.023449	47
15215	214	f	\N	2026-01-12 04:36:15.023449	47
15216	215	f	\N	2026-01-12 04:36:15.023449	47
15217	216	f	\N	2026-01-12 04:36:15.023449	47
15218	217	f	\N	2026-01-12 04:36:15.023449	47
15219	218	f	\N	2026-01-12 04:36:15.023449	47
15220	219	f	\N	2026-01-12 04:36:15.023449	47
15221	220	f	\N	2026-01-12 04:36:15.023449	47
15222	221	f	\N	2026-01-12 04:36:15.023449	47
15223	222	f	\N	2026-01-12 04:36:15.023449	47
15224	223	f	\N	2026-01-12 04:36:15.023449	47
15225	224	f	\N	2026-01-12 04:36:15.023449	47
15226	225	f	\N	2026-01-12 04:36:15.023449	47
15227	226	f	\N	2026-01-12 04:36:15.023449	47
15228	227	f	\N	2026-01-12 04:36:15.023449	47
15229	228	f	\N	2026-01-12 04:36:15.023449	47
15230	229	f	\N	2026-01-12 04:36:15.023449	47
15231	230	f	\N	2026-01-12 04:36:15.023449	47
15232	231	f	\N	2026-01-12 04:36:15.023449	47
15233	232	f	\N	2026-01-12 04:36:15.023449	47
15234	233	f	\N	2026-01-12 04:36:15.023449	47
15235	234	f	\N	2026-01-12 04:36:15.023449	47
15236	235	f	\N	2026-01-12 04:36:15.023449	47
15237	236	f	\N	2026-01-12 04:36:15.023449	47
15238	237	f	\N	2026-01-12 04:36:15.023449	47
15239	238	f	\N	2026-01-12 04:36:15.023449	47
15240	239	f	\N	2026-01-12 04:36:15.023449	47
15241	240	f	\N	2026-01-12 04:36:15.023449	47
15242	241	f	\N	2026-01-12 04:36:15.023449	47
15243	242	f	\N	2026-01-12 04:36:15.023449	47
15244	243	f	\N	2026-01-12 04:36:15.023449	47
15245	244	f	\N	2026-01-12 04:36:15.023449	47
15246	245	f	\N	2026-01-12 04:36:15.023449	47
15247	246	f	\N	2026-01-12 04:36:15.023449	47
15248	247	f	\N	2026-01-12 04:36:15.023449	47
15249	248	f	\N	2026-01-12 04:36:15.023449	47
15250	249	f	\N	2026-01-12 04:36:15.023449	47
15251	250	f	\N	2026-01-12 04:36:15.023449	47
15252	251	f	\N	2026-01-12 04:36:15.023449	47
15253	252	f	\N	2026-01-12 04:36:15.023449	47
15254	253	f	\N	2026-01-12 04:36:15.023449	47
15255	254	f	\N	2026-01-12 04:36:15.023449	47
15256	255	f	\N	2026-01-12 04:36:15.023449	47
15257	256	f	\N	2026-01-12 04:36:15.023449	47
15258	257	f	\N	2026-01-12 04:36:15.023449	47
15259	258	f	\N	2026-01-12 04:36:15.023449	47
15260	259	f	\N	2026-01-12 04:36:15.023449	47
15261	260	f	\N	2026-01-12 04:36:15.023449	47
15262	261	f	\N	2026-01-12 04:36:15.023449	47
15263	262	f	\N	2026-01-12 04:36:15.023449	47
15264	263	f	\N	2026-01-12 04:36:15.023449	47
15265	264	f	\N	2026-01-12 04:36:15.023449	47
15266	265	f	\N	2026-01-12 04:36:15.023449	47
15267	266	f	\N	2026-01-12 04:36:15.023449	47
15268	267	f	\N	2026-01-12 04:36:15.023449	47
15269	268	f	\N	2026-01-12 04:36:15.023449	47
15270	269	f	\N	2026-01-12 04:36:15.023449	47
15271	270	f	\N	2026-01-12 04:36:15.023449	47
15272	271	f	\N	2026-01-12 04:36:15.023449	47
15273	272	f	\N	2026-01-12 04:36:15.023449	47
15274	273	f	\N	2026-01-12 04:36:15.023449	47
15275	274	f	\N	2026-01-12 04:36:15.023449	47
15276	275	f	\N	2026-01-12 04:36:15.023449	47
15277	276	f	\N	2026-01-12 04:36:15.023449	47
15278	277	f	\N	2026-01-12 04:36:15.023449	47
15279	278	f	\N	2026-01-12 04:36:15.023449	47
15280	279	f	\N	2026-01-12 04:36:15.023449	47
15281	280	f	\N	2026-01-12 04:36:15.023449	47
15282	281	f	\N	2026-01-12 04:36:15.023449	47
15283	282	f	\N	2026-01-12 04:36:15.023449	47
15284	283	f	\N	2026-01-12 04:36:15.023449	47
15285	284	f	\N	2026-01-12 04:36:15.023449	47
15286	285	f	\N	2026-01-12 04:36:15.023449	47
15287	286	f	\N	2026-01-12 04:36:15.023449	47
15288	287	f	\N	2026-01-12 04:36:15.023449	47
15289	288	f	\N	2026-01-12 04:36:15.023449	47
15290	289	f	\N	2026-01-12 04:36:15.023449	47
15291	290	f	\N	2026-01-12 04:36:15.023449	47
15292	291	f	\N	2026-01-12 04:36:15.023449	47
15293	292	f	\N	2026-01-12 04:36:15.023449	47
15294	293	f	\N	2026-01-12 04:36:15.023449	47
15295	294	f	\N	2026-01-12 04:36:15.023449	47
15296	295	f	\N	2026-01-12 04:36:15.023449	47
15297	296	f	\N	2026-01-12 04:36:15.023449	47
15298	297	f	\N	2026-01-12 04:36:15.023449	47
15299	298	f	\N	2026-01-12 04:36:15.023449	47
15300	299	f	\N	2026-01-12 04:36:15.023449	47
15301	300	f	\N	2026-01-12 04:36:15.023449	47
15302	301	f	\N	2026-01-12 04:36:15.023449	47
15303	302	f	\N	2026-01-12 04:36:15.023449	47
15304	303	f	\N	2026-01-12 04:36:15.023449	47
15305	304	f	\N	2026-01-12 04:36:15.023449	47
15306	305	f	\N	2026-01-12 04:36:15.023449	47
15307	306	f	\N	2026-01-12 04:36:15.023449	47
15308	307	f	\N	2026-01-12 04:36:15.023449	47
15309	308	f	\N	2026-01-12 04:36:15.023449	47
15310	309	f	\N	2026-01-12 04:36:15.023449	47
15311	310	f	\N	2026-01-12 04:36:15.023449	47
15312	311	f	\N	2026-01-12 04:36:15.023449	47
15313	312	f	\N	2026-01-12 04:36:15.023449	47
15314	313	f	\N	2026-01-12 04:36:15.023449	47
15315	314	f	\N	2026-01-12 04:36:15.023449	47
15316	315	f	\N	2026-01-12 04:36:15.023449	47
15317	316	f	\N	2026-01-12 04:36:15.023449	47
15318	317	f	\N	2026-01-12 04:36:15.023449	47
15319	318	f	\N	2026-01-12 04:36:15.023449	47
15320	319	f	\N	2026-01-12 04:36:15.023449	47
15321	320	f	\N	2026-01-12 04:36:15.023449	47
15322	321	f	\N	2026-01-12 04:36:15.023449	47
15323	322	f	\N	2026-01-12 04:36:15.023449	47
15324	323	f	\N	2026-01-12 04:36:15.023449	47
15325	324	f	\N	2026-01-12 04:36:15.023449	47
15326	325	f	\N	2026-01-12 04:36:15.023449	47
15327	326	f	\N	2026-01-12 04:36:15.023449	47
15328	327	f	\N	2026-01-12 04:36:15.023449	47
15329	328	f	\N	2026-01-12 04:36:15.023449	47
15330	329	f	\N	2026-01-12 04:36:15.023449	47
15331	330	f	\N	2026-01-12 04:36:15.023449	47
15332	331	f	\N	2026-01-12 04:36:15.023449	47
15333	332	f	\N	2026-01-12 04:36:15.023449	47
15334	333	f	\N	2026-01-12 04:36:15.023449	47
15335	334	f	\N	2026-01-12 04:36:15.023449	47
15336	335	f	\N	2026-01-12 04:36:15.023449	47
15337	336	f	\N	2026-01-12 04:36:15.023449	47
15338	337	f	\N	2026-01-12 04:36:15.023449	47
15339	338	f	\N	2026-01-12 04:36:15.023449	47
15340	339	f	\N	2026-01-12 04:36:15.023449	47
15341	340	f	\N	2026-01-12 04:36:15.023449	47
15342	341	f	\N	2026-01-12 04:36:15.023449	47
15343	342	f	\N	2026-01-12 04:36:15.023449	47
15344	343	f	\N	2026-01-12 04:36:15.023449	47
15345	344	f	\N	2026-01-12 04:36:15.023449	47
15346	345	f	\N	2026-01-12 04:36:15.023449	47
15347	346	f	\N	2026-01-12 04:36:15.023449	47
15348	347	f	\N	2026-01-12 04:36:15.023449	47
15349	348	f	\N	2026-01-12 04:36:15.023449	47
15350	349	f	\N	2026-01-12 04:36:15.023449	47
15351	350	f	\N	2026-01-12 04:36:15.023449	47
15352	351	f	\N	2026-01-12 04:36:15.023449	47
15353	352	f	\N	2026-01-12 04:36:15.023449	47
15354	353	f	\N	2026-01-12 04:36:15.023449	47
15355	354	f	\N	2026-01-12 04:36:15.023449	47
15356	355	f	\N	2026-01-12 04:36:15.023449	47
15357	356	f	\N	2026-01-12 04:36:15.023449	47
15358	357	f	\N	2026-01-12 04:36:15.023449	47
15359	358	f	\N	2026-01-12 04:36:15.023449	47
15360	359	f	\N	2026-01-12 04:36:15.023449	47
15361	360	f	\N	2026-01-12 04:36:15.023449	47
15362	361	f	\N	2026-01-12 04:36:15.023449	47
15363	362	f	\N	2026-01-12 04:36:15.023449	47
15364	363	f	\N	2026-01-12 04:36:15.023449	47
15365	364	f	\N	2026-01-12 04:36:15.023449	47
15366	365	f	\N	2026-01-12 04:36:15.023449	47
15367	366	f	\N	2026-01-12 04:36:15.023449	47
15368	367	f	\N	2026-01-12 04:36:15.023449	47
15369	368	f	\N	2026-01-12 04:36:15.023449	47
15370	369	f	\N	2026-01-12 04:36:15.023449	47
15371	370	f	\N	2026-01-12 04:36:15.023449	47
15372	371	f	\N	2026-01-12 04:36:15.023449	47
15373	372	f	\N	2026-01-12 04:36:15.023449	47
15374	373	f	\N	2026-01-12 04:36:15.023449	47
15375	374	f	\N	2026-01-12 04:36:15.023449	47
15376	375	f	\N	2026-01-12 04:36:15.023449	47
15377	376	f	\N	2026-01-12 04:36:15.023449	47
15378	377	f	\N	2026-01-12 04:36:15.023449	47
15379	378	f	\N	2026-01-12 04:36:15.023449	47
15380	379	f	\N	2026-01-12 04:36:15.023449	47
15381	380	f	\N	2026-01-12 04:36:15.023449	47
15382	381	f	\N	2026-01-12 04:36:15.023449	47
15383	382	f	\N	2026-01-12 04:36:15.023449	47
15384	383	f	\N	2026-01-12 04:36:15.023449	47
15385	384	f	\N	2026-01-12 04:36:15.023449	47
15386	385	f	\N	2026-01-12 04:36:15.023449	47
15387	386	f	\N	2026-01-12 04:36:15.023449	47
15388	387	f	\N	2026-01-12 04:36:15.023449	47
15389	388	f	\N	2026-01-12 04:36:15.023449	47
15390	389	f	\N	2026-01-12 04:36:15.023449	47
15391	390	f	\N	2026-01-12 04:36:15.023449	47
15392	391	f	\N	2026-01-12 04:36:15.023449	47
15393	392	f	\N	2026-01-12 04:36:15.023449	47
15394	393	f	\N	2026-01-12 04:36:15.023449	47
15395	394	f	\N	2026-01-12 04:36:15.023449	47
15396	395	f	\N	2026-01-12 04:36:15.023449	47
15397	396	f	\N	2026-01-12 04:36:15.023449	47
15398	397	f	\N	2026-01-12 04:36:15.023449	47
15399	398	f	\N	2026-01-12 04:36:15.023449	47
15400	399	f	\N	2026-01-12 04:36:15.023449	47
15401	400	f	\N	2026-01-12 04:36:15.023449	47
15402	401	f	\N	2026-01-12 04:36:15.023449	47
15403	402	f	\N	2026-01-12 04:36:15.023449	47
15404	403	f	\N	2026-01-12 04:36:15.023449	47
15405	404	f	\N	2026-01-12 04:36:15.023449	47
15406	405	f	\N	2026-01-12 04:36:15.023449	47
15407	406	f	\N	2026-01-12 04:36:15.023449	47
15408	407	f	\N	2026-01-12 04:36:15.023449	47
15409	408	f	\N	2026-01-12 04:36:15.023449	47
15410	409	f	\N	2026-01-12 04:36:15.023449	47
15411	410	f	\N	2026-01-12 04:36:15.023449	47
15412	411	f	\N	2026-01-12 04:36:15.023449	47
15413	412	f	\N	2026-01-12 04:36:15.023449	47
15414	413	f	\N	2026-01-12 04:36:15.023449	47
15415	414	f	\N	2026-01-12 04:36:15.023449	47
15416	415	f	\N	2026-01-12 04:36:15.023449	47
15417	416	f	\N	2026-01-12 04:36:15.023449	47
15418	417	f	\N	2026-01-12 04:36:15.023449	47
15419	418	f	\N	2026-01-12 04:36:15.023449	47
15420	419	f	\N	2026-01-12 04:36:15.023449	47
15421	420	f	\N	2026-01-12 04:36:15.023449	47
15422	421	f	\N	2026-01-12 04:36:15.023449	47
15423	422	f	\N	2026-01-12 04:36:15.023449	47
15424	423	f	\N	2026-01-12 04:36:15.023449	47
15425	424	f	\N	2026-01-12 04:36:15.023449	47
15426	425	f	\N	2026-01-12 04:36:15.023449	47
15427	426	f	\N	2026-01-12 04:36:15.023449	47
15428	427	f	\N	2026-01-12 04:36:15.023449	47
15429	428	f	\N	2026-01-12 04:36:15.023449	47
15430	429	f	\N	2026-01-12 04:36:15.023449	47
15431	430	f	\N	2026-01-12 04:36:15.023449	47
15432	431	f	\N	2026-01-12 04:36:15.023449	47
15433	432	f	\N	2026-01-12 04:36:15.023449	47
15434	433	f	\N	2026-01-12 04:36:15.023449	47
15435	434	f	\N	2026-01-12 04:36:15.023449	47
15436	435	f	\N	2026-01-12 04:36:15.023449	47
15437	436	f	\N	2026-01-12 04:36:15.023449	47
15438	437	f	\N	2026-01-12 04:36:15.023449	47
15439	438	f	\N	2026-01-12 04:36:15.023449	47
15440	439	f	\N	2026-01-12 04:36:15.023449	47
15441	440	f	\N	2026-01-12 04:36:15.023449	47
15442	441	f	\N	2026-01-12 04:36:15.023449	47
15443	442	f	\N	2026-01-12 04:36:15.023449	47
15444	443	f	\N	2026-01-12 04:36:15.023449	47
15445	444	f	\N	2026-01-12 04:36:15.023449	47
15446	445	f	\N	2026-01-12 04:36:15.023449	47
15447	446	f	\N	2026-01-12 04:36:15.023449	47
15448	447	f	\N	2026-01-12 04:36:15.023449	47
15449	448	f	\N	2026-01-12 04:36:15.023449	47
15450	449	f	\N	2026-01-12 04:36:15.023449	47
15451	450	f	\N	2026-01-12 04:36:15.023449	47
15452	451	f	\N	2026-01-12 04:36:15.023449	47
15453	452	f	\N	2026-01-12 04:36:15.023449	47
15454	453	f	\N	2026-01-12 04:36:15.023449	47
15455	454	f	\N	2026-01-12 04:36:15.023449	47
15456	455	f	\N	2026-01-12 04:36:15.023449	47
15457	456	f	\N	2026-01-12 04:36:15.023449	47
15458	457	f	\N	2026-01-12 04:36:15.023449	47
15459	458	f	\N	2026-01-12 04:36:15.023449	47
15460	459	f	\N	2026-01-12 04:36:15.023449	47
15461	460	f	\N	2026-01-12 04:36:15.023449	47
15462	461	f	\N	2026-01-12 04:36:15.023449	47
15463	462	f	\N	2026-01-12 04:36:15.023449	47
15464	463	f	\N	2026-01-12 04:36:15.023449	47
15465	464	f	\N	2026-01-12 04:36:15.023449	47
15466	465	f	\N	2026-01-12 04:36:15.023449	47
15467	466	f	\N	2026-01-12 04:36:15.023449	47
15468	467	f	\N	2026-01-12 04:36:15.023449	47
15469	468	f	\N	2026-01-12 04:36:15.023449	47
15470	469	f	\N	2026-01-12 04:36:15.023449	47
15471	470	f	\N	2026-01-12 04:36:15.023449	47
15472	471	f	\N	2026-01-12 04:36:15.023449	47
15473	472	f	\N	2026-01-12 04:36:15.023449	47
15474	473	f	\N	2026-01-12 04:36:15.023449	47
15475	474	f	\N	2026-01-12 04:36:15.023449	47
15476	475	f	\N	2026-01-12 04:36:15.023449	47
15477	476	f	\N	2026-01-12 04:36:15.023449	47
15478	477	f	\N	2026-01-12 04:36:15.023449	47
15479	478	f	\N	2026-01-12 04:36:15.023449	47
15480	479	f	\N	2026-01-12 04:36:15.023449	47
15481	480	f	\N	2026-01-12 04:36:15.023449	47
15482	481	f	\N	2026-01-12 04:36:15.023449	47
15483	482	f	\N	2026-01-12 04:36:15.023449	47
15484	483	f	\N	2026-01-12 04:36:15.023449	47
15485	484	f	\N	2026-01-12 04:36:15.023449	47
15486	485	f	\N	2026-01-12 04:36:15.023449	47
15487	486	f	\N	2026-01-12 04:36:15.023449	47
15488	487	f	\N	2026-01-12 04:36:15.023449	47
15489	488	f	\N	2026-01-12 04:36:15.023449	47
15490	489	f	\N	2026-01-12 04:36:15.023449	47
15491	490	f	\N	2026-01-12 04:36:15.023449	47
15492	491	f	\N	2026-01-12 04:36:15.023449	47
15493	492	f	\N	2026-01-12 04:36:15.023449	47
15494	493	f	\N	2026-01-12 04:36:15.023449	47
15495	494	f	\N	2026-01-12 04:36:15.023449	47
15496	495	f	\N	2026-01-12 04:36:15.023449	47
15497	496	f	\N	2026-01-12 04:36:15.023449	47
15498	497	f	\N	2026-01-12 04:36:15.023449	47
15499	498	f	\N	2026-01-12 04:36:15.023449	47
15500	499	f	\N	2026-01-12 04:36:15.023449	47
15501	500	f	\N	2026-01-12 04:36:15.023449	47
16002	1	f	\N	2026-01-12 14:22:57.746676	50
16003	2	f	\N	2026-01-12 14:22:57.746676	50
16004	3	f	\N	2026-01-12 14:22:57.746676	50
16005	4	f	\N	2026-01-12 14:22:57.746676	50
16006	5	f	\N	2026-01-12 14:22:57.746676	50
16007	6	f	\N	2026-01-12 14:22:57.746676	50
16008	7	f	\N	2026-01-12 14:22:57.746676	50
16009	8	f	\N	2026-01-12 14:22:57.746676	50
16010	9	f	\N	2026-01-12 14:22:57.746676	50
16011	10	f	\N	2026-01-12 14:22:57.746676	50
16012	11	f	\N	2026-01-12 14:22:57.746676	50
16013	12	f	\N	2026-01-12 14:22:57.746676	50
16014	13	f	\N	2026-01-12 14:22:57.746676	50
16015	14	f	\N	2026-01-12 14:22:57.746676	50
16016	15	f	\N	2026-01-12 14:22:57.746676	50
16017	16	f	\N	2026-01-12 14:22:57.746676	50
16018	17	f	\N	2026-01-12 14:22:57.746676	50
16019	18	f	\N	2026-01-12 14:22:57.746676	50
16020	19	f	\N	2026-01-12 14:22:57.746676	50
16021	20	f	\N	2026-01-12 14:22:57.746676	50
16022	21	f	\N	2026-01-12 14:22:57.746676	50
16023	22	f	\N	2026-01-12 14:22:57.746676	50
16024	23	f	\N	2026-01-12 14:22:57.746676	50
16025	24	f	\N	2026-01-12 14:22:57.746676	50
16026	25	f	\N	2026-01-12 14:22:57.746676	50
16027	26	f	\N	2026-01-12 14:22:57.746676	50
16028	27	f	\N	2026-01-12 14:22:57.746676	50
16029	28	f	\N	2026-01-12 14:22:57.746676	50
16030	29	f	\N	2026-01-12 14:22:57.746676	50
16031	30	f	\N	2026-01-12 14:22:57.746676	50
16032	31	f	\N	2026-01-12 14:22:57.746676	50
16033	32	f	\N	2026-01-12 14:22:57.746676	50
16034	33	f	\N	2026-01-12 14:22:57.746676	50
16035	34	f	\N	2026-01-12 14:22:57.746676	50
16036	35	f	\N	2026-01-12 14:22:57.746676	50
16037	36	f	\N	2026-01-12 14:22:57.746676	50
16038	37	f	\N	2026-01-12 14:22:57.746676	50
16039	38	f	\N	2026-01-12 14:22:57.746676	50
16040	39	f	\N	2026-01-12 14:22:57.746676	50
16041	40	f	\N	2026-01-12 14:22:57.746676	50
16042	41	f	\N	2026-01-12 14:22:57.746676	50
16043	42	f	\N	2026-01-12 14:22:57.746676	50
16044	43	f	\N	2026-01-12 14:22:57.746676	50
16045	44	f	\N	2026-01-12 14:22:57.746676	50
16046	45	f	\N	2026-01-12 14:22:57.746676	50
16047	46	f	\N	2026-01-12 14:22:57.746676	50
16048	47	f	\N	2026-01-12 14:22:57.746676	50
16049	48	f	\N	2026-01-12 14:22:57.746676	50
16050	49	f	\N	2026-01-12 14:22:57.746676	50
16051	50	f	\N	2026-01-12 14:22:57.746676	50
16052	51	f	\N	2026-01-12 14:22:57.746676	50
16053	52	f	\N	2026-01-12 14:22:57.746676	50
16054	53	f	\N	2026-01-12 14:22:57.746676	50
16055	54	f	\N	2026-01-12 14:22:57.746676	50
16056	55	f	\N	2026-01-12 14:22:57.746676	50
16057	56	f	\N	2026-01-12 14:22:57.746676	50
16058	57	f	\N	2026-01-12 14:22:57.746676	50
16059	58	f	\N	2026-01-12 14:22:57.746676	50
16060	59	f	\N	2026-01-12 14:22:57.746676	50
16061	60	f	\N	2026-01-12 14:22:57.746676	50
16062	61	f	\N	2026-01-12 14:22:57.746676	50
16063	62	f	\N	2026-01-12 14:22:57.746676	50
16064	63	f	\N	2026-01-12 14:22:57.746676	50
16065	64	f	\N	2026-01-12 14:22:57.746676	50
16066	65	f	\N	2026-01-12 14:22:57.746676	50
16067	66	f	\N	2026-01-12 14:22:57.746676	50
16068	67	f	\N	2026-01-12 14:22:57.746676	50
16069	68	f	\N	2026-01-12 14:22:57.746676	50
16070	69	f	\N	2026-01-12 14:22:57.746676	50
16071	70	f	\N	2026-01-12 14:22:57.746676	50
16072	71	f	\N	2026-01-12 14:22:57.746676	50
16073	72	f	\N	2026-01-12 14:22:57.746676	50
16074	73	f	\N	2026-01-12 14:22:57.746676	50
16075	74	f	\N	2026-01-12 14:22:57.746676	50
16076	75	f	\N	2026-01-12 14:22:57.746676	50
16077	76	f	\N	2026-01-12 14:22:57.746676	50
16078	77	f	\N	2026-01-12 14:22:57.746676	50
16079	78	f	\N	2026-01-12 14:22:57.746676	50
16080	79	f	\N	2026-01-12 14:22:57.746676	50
16081	80	f	\N	2026-01-12 14:22:57.746676	50
16082	81	f	\N	2026-01-12 14:22:57.746676	50
16083	82	f	\N	2026-01-12 14:22:57.746676	50
16084	83	f	\N	2026-01-12 14:22:57.746676	50
16085	84	f	\N	2026-01-12 14:22:57.746676	50
16086	85	f	\N	2026-01-12 14:22:57.746676	50
16087	86	f	\N	2026-01-12 14:22:57.746676	50
16088	87	f	\N	2026-01-12 14:22:57.746676	50
16089	88	f	\N	2026-01-12 14:22:57.746676	50
16090	89	f	\N	2026-01-12 14:22:57.746676	50
16091	90	f	\N	2026-01-12 14:22:57.746676	50
16092	91	f	\N	2026-01-12 14:22:57.746676	50
16093	92	f	\N	2026-01-12 14:22:57.746676	50
16094	93	f	\N	2026-01-12 14:22:57.746676	50
16095	94	f	\N	2026-01-12 14:22:57.746676	50
16096	95	f	\N	2026-01-12 14:22:57.746676	50
16097	96	f	\N	2026-01-12 14:22:57.746676	50
16098	97	f	\N	2026-01-12 14:22:57.746676	50
16099	98	f	\N	2026-01-12 14:22:57.746676	50
16100	99	f	\N	2026-01-12 14:22:57.746676	50
16101	100	f	\N	2026-01-12 14:22:57.746676	50
16102	101	f	\N	2026-01-12 14:22:57.746676	50
16103	102	f	\N	2026-01-12 14:22:57.746676	50
16104	103	f	\N	2026-01-12 14:22:57.746676	50
16105	104	f	\N	2026-01-12 14:22:57.746676	50
16106	105	f	\N	2026-01-12 14:22:57.746676	50
16107	106	f	\N	2026-01-12 14:22:57.746676	50
16108	107	f	\N	2026-01-12 14:22:57.746676	50
16109	108	f	\N	2026-01-12 14:22:57.746676	50
16110	109	f	\N	2026-01-12 14:22:57.746676	50
16111	110	f	\N	2026-01-12 14:22:57.746676	50
16112	111	f	\N	2026-01-12 14:22:57.746676	50
16113	112	f	\N	2026-01-12 14:22:57.746676	50
16114	113	f	\N	2026-01-12 14:22:57.746676	50
16115	114	f	\N	2026-01-12 14:22:57.746676	50
16116	115	f	\N	2026-01-12 14:22:57.746676	50
16117	116	f	\N	2026-01-12 14:22:57.746676	50
16118	117	f	\N	2026-01-12 14:22:57.746676	50
16119	118	f	\N	2026-01-12 14:22:57.746676	50
16120	119	f	\N	2026-01-12 14:22:57.746676	50
16121	120	f	\N	2026-01-12 14:22:57.746676	50
16122	121	f	\N	2026-01-12 14:22:57.746676	50
16123	122	f	\N	2026-01-12 14:22:57.746676	50
16124	123	f	\N	2026-01-12 14:22:57.746676	50
16125	124	f	\N	2026-01-12 14:22:57.746676	50
16126	125	f	\N	2026-01-12 14:22:57.746676	50
16127	126	f	\N	2026-01-12 14:22:57.746676	50
16128	127	f	\N	2026-01-12 14:22:57.746676	50
16129	128	f	\N	2026-01-12 14:22:57.746676	50
16130	129	f	\N	2026-01-12 14:22:57.746676	50
16131	130	f	\N	2026-01-12 14:22:57.746676	50
16132	131	f	\N	2026-01-12 14:22:57.746676	50
16133	132	f	\N	2026-01-12 14:22:57.746676	50
16134	133	f	\N	2026-01-12 14:22:57.746676	50
16135	134	f	\N	2026-01-12 14:22:57.746676	50
16136	135	f	\N	2026-01-12 14:22:57.746676	50
16137	136	f	\N	2026-01-12 14:22:57.746676	50
16138	137	f	\N	2026-01-12 14:22:57.746676	50
16139	138	f	\N	2026-01-12 14:22:57.746676	50
16140	139	f	\N	2026-01-12 14:22:57.746676	50
16141	140	f	\N	2026-01-12 14:22:57.746676	50
16142	141	f	\N	2026-01-12 14:22:57.746676	50
16143	142	f	\N	2026-01-12 14:22:57.746676	50
16144	143	f	\N	2026-01-12 14:22:57.746676	50
16145	144	f	\N	2026-01-12 14:22:57.746676	50
16146	145	f	\N	2026-01-12 14:22:57.746676	50
16147	146	f	\N	2026-01-12 14:22:57.746676	50
16148	147	f	\N	2026-01-12 14:22:57.746676	50
16149	148	f	\N	2026-01-12 14:22:57.746676	50
16150	149	f	\N	2026-01-12 14:22:57.746676	50
16151	150	f	\N	2026-01-12 14:22:57.746676	50
16152	151	f	\N	2026-01-12 14:22:57.746676	50
16153	152	f	\N	2026-01-12 14:22:57.746676	50
16154	153	f	\N	2026-01-12 14:22:57.746676	50
16155	154	f	\N	2026-01-12 14:22:57.746676	50
16156	155	f	\N	2026-01-12 14:22:57.746676	50
16157	156	f	\N	2026-01-12 14:22:57.746676	50
16158	157	f	\N	2026-01-12 14:22:57.746676	50
16159	158	f	\N	2026-01-12 14:22:57.746676	50
16160	159	f	\N	2026-01-12 14:22:57.746676	50
16161	160	f	\N	2026-01-12 14:22:57.746676	50
16162	161	f	\N	2026-01-12 14:22:57.746676	50
16163	162	f	\N	2026-01-12 14:22:57.746676	50
16164	163	f	\N	2026-01-12 14:22:57.746676	50
16165	164	f	\N	2026-01-12 14:22:57.746676	50
16166	165	f	\N	2026-01-12 14:22:57.746676	50
16167	166	f	\N	2026-01-12 14:22:57.746676	50
16168	167	f	\N	2026-01-12 14:22:57.746676	50
16169	168	f	\N	2026-01-12 14:22:57.746676	50
16170	169	f	\N	2026-01-12 14:22:57.746676	50
16171	170	f	\N	2026-01-12 14:22:57.746676	50
16172	171	f	\N	2026-01-12 14:22:57.746676	50
16173	172	f	\N	2026-01-12 14:22:57.746676	50
16174	173	f	\N	2026-01-12 14:22:57.746676	50
16175	174	f	\N	2026-01-12 14:22:57.746676	50
16176	175	f	\N	2026-01-12 14:22:57.746676	50
16177	176	f	\N	2026-01-12 14:22:57.746676	50
16178	177	f	\N	2026-01-12 14:22:57.746676	50
16179	178	f	\N	2026-01-12 14:22:57.746676	50
16180	179	f	\N	2026-01-12 14:22:57.746676	50
16181	180	f	\N	2026-01-12 14:22:57.746676	50
16182	181	f	\N	2026-01-12 14:22:57.746676	50
16183	182	f	\N	2026-01-12 14:22:57.746676	50
16184	183	f	\N	2026-01-12 14:22:57.746676	50
16185	184	f	\N	2026-01-12 14:22:57.746676	50
16186	185	f	\N	2026-01-12 14:22:57.746676	50
16187	186	f	\N	2026-01-12 14:22:57.746676	50
16188	187	f	\N	2026-01-12 14:22:57.746676	50
16189	188	f	\N	2026-01-12 14:22:57.746676	50
16190	189	f	\N	2026-01-12 14:22:57.746676	50
16191	190	f	\N	2026-01-12 14:22:57.746676	50
16192	191	f	\N	2026-01-12 14:22:57.746676	50
16193	192	f	\N	2026-01-12 14:22:57.746676	50
16194	193	f	\N	2026-01-12 14:22:57.746676	50
16195	194	f	\N	2026-01-12 14:22:57.746676	50
16196	195	f	\N	2026-01-12 14:22:57.746676	50
16197	196	f	\N	2026-01-12 14:22:57.746676	50
16198	197	f	\N	2026-01-12 14:22:57.746676	50
16199	198	f	\N	2026-01-12 14:22:57.746676	50
16200	199	f	\N	2026-01-12 14:22:57.746676	50
16201	200	f	\N	2026-01-12 14:22:57.746676	50
16202	201	f	\N	2026-01-12 14:22:57.746676	50
16203	202	f	\N	2026-01-12 14:22:57.746676	50
16204	203	f	\N	2026-01-12 14:22:57.746676	50
16205	204	f	\N	2026-01-12 14:22:57.746676	50
16206	205	f	\N	2026-01-12 14:22:57.746676	50
16207	206	f	\N	2026-01-12 14:22:57.746676	50
16208	207	f	\N	2026-01-12 14:22:57.746676	50
16209	208	f	\N	2026-01-12 14:22:57.746676	50
16210	209	f	\N	2026-01-12 14:22:57.746676	50
16211	210	f	\N	2026-01-12 14:22:57.746676	50
16212	211	f	\N	2026-01-12 14:22:57.746676	50
16213	212	f	\N	2026-01-12 14:22:57.746676	50
16214	213	f	\N	2026-01-12 14:22:57.746676	50
16215	214	f	\N	2026-01-12 14:22:57.746676	50
16216	215	f	\N	2026-01-12 14:22:57.746676	50
16217	216	f	\N	2026-01-12 14:22:57.746676	50
16218	217	f	\N	2026-01-12 14:22:57.746676	50
16219	218	f	\N	2026-01-12 14:22:57.746676	50
16220	219	f	\N	2026-01-12 14:22:57.746676	50
16221	220	f	\N	2026-01-12 14:22:57.746676	50
16222	221	f	\N	2026-01-12 14:22:57.746676	50
16223	222	f	\N	2026-01-12 14:22:57.746676	50
16224	223	f	\N	2026-01-12 14:22:57.746676	50
16225	224	f	\N	2026-01-12 14:22:57.746676	50
16226	225	f	\N	2026-01-12 14:22:57.746676	50
16227	226	f	\N	2026-01-12 14:22:57.746676	50
16228	227	f	\N	2026-01-12 14:22:57.746676	50
16229	228	f	\N	2026-01-12 14:22:57.746676	50
16230	229	f	\N	2026-01-12 14:22:57.746676	50
16231	230	f	\N	2026-01-12 14:22:57.746676	50
16232	231	f	\N	2026-01-12 14:22:57.746676	50
16233	232	f	\N	2026-01-12 14:22:57.746676	50
16234	233	f	\N	2026-01-12 14:22:57.746676	50
16235	234	f	\N	2026-01-12 14:22:57.746676	50
16236	235	f	\N	2026-01-12 14:22:57.746676	50
16237	236	f	\N	2026-01-12 14:22:57.746676	50
16238	237	f	\N	2026-01-12 14:22:57.746676	50
16239	238	f	\N	2026-01-12 14:22:57.746676	50
16240	239	f	\N	2026-01-12 14:22:57.746676	50
16241	240	f	\N	2026-01-12 14:22:57.746676	50
16242	241	f	\N	2026-01-12 14:22:57.746676	50
16243	242	f	\N	2026-01-12 14:22:57.746676	50
16244	243	f	\N	2026-01-12 14:22:57.746676	50
16245	244	f	\N	2026-01-12 14:22:57.746676	50
16246	245	f	\N	2026-01-12 14:22:57.746676	50
16247	246	f	\N	2026-01-12 14:22:57.746676	50
16248	247	f	\N	2026-01-12 14:22:57.746676	50
16249	248	f	\N	2026-01-12 14:22:57.746676	50
16250	249	f	\N	2026-01-12 14:22:57.746676	50
16251	250	f	\N	2026-01-12 14:22:57.746676	50
16252	251	f	\N	2026-01-12 14:22:57.746676	50
16253	252	f	\N	2026-01-12 14:22:57.746676	50
16254	253	f	\N	2026-01-12 14:22:57.746676	50
16255	254	f	\N	2026-01-12 14:22:57.746676	50
16256	255	f	\N	2026-01-12 14:22:57.746676	50
16257	256	f	\N	2026-01-12 14:22:57.746676	50
16258	257	f	\N	2026-01-12 14:22:57.746676	50
16259	258	f	\N	2026-01-12 14:22:57.746676	50
16260	259	f	\N	2026-01-12 14:22:57.746676	50
16261	260	f	\N	2026-01-12 14:22:57.746676	50
16262	261	f	\N	2026-01-12 14:22:57.746676	50
16263	262	f	\N	2026-01-12 14:22:57.746676	50
16264	263	f	\N	2026-01-12 14:22:57.746676	50
16265	264	f	\N	2026-01-12 14:22:57.746676	50
16266	265	f	\N	2026-01-12 14:22:57.746676	50
16267	266	f	\N	2026-01-12 14:22:57.746676	50
16268	267	f	\N	2026-01-12 14:22:57.746676	50
16269	268	f	\N	2026-01-12 14:22:57.746676	50
16270	269	f	\N	2026-01-12 14:22:57.746676	50
16271	270	f	\N	2026-01-12 14:22:57.746676	50
16272	271	f	\N	2026-01-12 14:22:57.746676	50
16273	272	f	\N	2026-01-12 14:22:57.746676	50
16274	273	f	\N	2026-01-12 14:22:57.746676	50
16275	274	f	\N	2026-01-12 14:22:57.746676	50
16276	275	f	\N	2026-01-12 14:22:57.746676	50
16277	276	f	\N	2026-01-12 14:22:57.746676	50
16278	277	f	\N	2026-01-12 14:22:57.746676	50
16279	278	f	\N	2026-01-12 14:22:57.746676	50
16280	279	f	\N	2026-01-12 14:22:57.746676	50
16281	280	f	\N	2026-01-12 14:22:57.746676	50
16282	281	f	\N	2026-01-12 14:22:57.746676	50
16283	282	f	\N	2026-01-12 14:22:57.746676	50
16284	283	f	\N	2026-01-12 14:22:57.746676	50
16285	284	f	\N	2026-01-12 14:22:57.746676	50
16286	285	f	\N	2026-01-12 14:22:57.746676	50
16287	286	f	\N	2026-01-12 14:22:57.746676	50
16288	287	f	\N	2026-01-12 14:22:57.746676	50
16289	288	f	\N	2026-01-12 14:22:57.746676	50
16290	289	f	\N	2026-01-12 14:22:57.746676	50
16291	290	f	\N	2026-01-12 14:22:57.746676	50
16292	291	f	\N	2026-01-12 14:22:57.746676	50
16293	292	f	\N	2026-01-12 14:22:57.746676	50
16294	293	f	\N	2026-01-12 14:22:57.746676	50
16295	294	f	\N	2026-01-12 14:22:57.746676	50
16296	295	f	\N	2026-01-12 14:22:57.746676	50
16297	296	f	\N	2026-01-12 14:22:57.746676	50
16298	297	f	\N	2026-01-12 14:22:57.746676	50
16299	298	f	\N	2026-01-12 14:22:57.746676	50
16300	299	f	\N	2026-01-12 14:22:57.746676	50
16301	300	f	\N	2026-01-12 14:22:57.746676	50
16302	301	f	\N	2026-01-12 14:22:57.746676	50
16303	302	f	\N	2026-01-12 14:22:57.746676	50
16304	303	f	\N	2026-01-12 14:22:57.746676	50
16305	304	f	\N	2026-01-12 14:22:57.746676	50
16306	305	f	\N	2026-01-12 14:22:57.746676	50
16307	306	f	\N	2026-01-12 14:22:57.746676	50
16308	307	f	\N	2026-01-12 14:22:57.746676	50
16309	308	f	\N	2026-01-12 14:22:57.746676	50
16310	309	f	\N	2026-01-12 14:22:57.746676	50
16311	310	f	\N	2026-01-12 14:22:57.746676	50
16312	311	f	\N	2026-01-12 14:22:57.746676	50
16313	312	f	\N	2026-01-12 14:22:57.746676	50
16314	313	f	\N	2026-01-12 14:22:57.746676	50
16315	314	f	\N	2026-01-12 14:22:57.746676	50
16316	315	f	\N	2026-01-12 14:22:57.746676	50
16317	316	f	\N	2026-01-12 14:22:57.746676	50
16318	317	f	\N	2026-01-12 14:22:57.746676	50
16319	318	f	\N	2026-01-12 14:22:57.746676	50
16320	319	f	\N	2026-01-12 14:22:57.746676	50
16321	320	f	\N	2026-01-12 14:22:57.746676	50
16322	321	f	\N	2026-01-12 14:22:57.746676	50
16323	322	f	\N	2026-01-12 14:22:57.746676	50
16324	323	f	\N	2026-01-12 14:22:57.746676	50
16325	324	f	\N	2026-01-12 14:22:57.746676	50
16326	325	f	\N	2026-01-12 14:22:57.746676	50
16327	326	f	\N	2026-01-12 14:22:57.746676	50
16328	327	f	\N	2026-01-12 14:22:57.746676	50
16329	328	f	\N	2026-01-12 14:22:57.746676	50
16330	329	f	\N	2026-01-12 14:22:57.746676	50
16331	330	f	\N	2026-01-12 14:22:57.746676	50
16332	331	f	\N	2026-01-12 14:22:57.746676	50
16333	332	f	\N	2026-01-12 14:22:57.746676	50
16334	333	f	\N	2026-01-12 14:22:57.746676	50
16335	334	f	\N	2026-01-12 14:22:57.746676	50
16336	335	f	\N	2026-01-12 14:22:57.746676	50
16337	336	f	\N	2026-01-12 14:22:57.746676	50
16338	337	f	\N	2026-01-12 14:22:57.746676	50
16339	338	f	\N	2026-01-12 14:22:57.746676	50
16340	339	f	\N	2026-01-12 14:22:57.746676	50
16341	340	f	\N	2026-01-12 14:22:57.746676	50
16342	341	f	\N	2026-01-12 14:22:57.746676	50
16343	342	f	\N	2026-01-12 14:22:57.746676	50
16344	343	f	\N	2026-01-12 14:22:57.746676	50
16345	344	f	\N	2026-01-12 14:22:57.746676	50
16346	345	f	\N	2026-01-12 14:22:57.746676	50
16347	346	f	\N	2026-01-12 14:22:57.746676	50
16348	347	f	\N	2026-01-12 14:22:57.746676	50
16349	348	f	\N	2026-01-12 14:22:57.746676	50
16350	349	f	\N	2026-01-12 14:22:57.746676	50
16351	350	f	\N	2026-01-12 14:22:57.746676	50
16352	351	f	\N	2026-01-12 14:22:57.746676	50
16353	352	f	\N	2026-01-12 14:22:57.746676	50
16354	353	f	\N	2026-01-12 14:22:57.746676	50
16355	354	f	\N	2026-01-12 14:22:57.746676	50
16356	355	f	\N	2026-01-12 14:22:57.746676	50
16357	356	f	\N	2026-01-12 14:22:57.746676	50
16358	357	f	\N	2026-01-12 14:22:57.746676	50
16359	358	f	\N	2026-01-12 14:22:57.746676	50
16360	359	f	\N	2026-01-12 14:22:57.746676	50
16361	360	f	\N	2026-01-12 14:22:57.746676	50
16362	361	f	\N	2026-01-12 14:22:57.746676	50
16363	362	f	\N	2026-01-12 14:22:57.746676	50
16364	363	f	\N	2026-01-12 14:22:57.746676	50
16365	364	f	\N	2026-01-12 14:22:57.746676	50
16366	365	f	\N	2026-01-12 14:22:57.746676	50
16367	366	f	\N	2026-01-12 14:22:57.746676	50
16368	367	f	\N	2026-01-12 14:22:57.746676	50
16369	368	f	\N	2026-01-12 14:22:57.746676	50
16370	369	f	\N	2026-01-12 14:22:57.746676	50
16371	370	f	\N	2026-01-12 14:22:57.746676	50
16372	371	f	\N	2026-01-12 14:22:57.746676	50
16373	372	f	\N	2026-01-12 14:22:57.746676	50
16374	373	f	\N	2026-01-12 14:22:57.746676	50
16375	374	f	\N	2026-01-12 14:22:57.746676	50
16376	375	f	\N	2026-01-12 14:22:57.746676	50
16377	376	f	\N	2026-01-12 14:22:57.746676	50
16378	377	f	\N	2026-01-12 14:22:57.746676	50
16379	378	f	\N	2026-01-12 14:22:57.746676	50
16380	379	f	\N	2026-01-12 14:22:57.746676	50
16381	380	f	\N	2026-01-12 14:22:57.746676	50
16382	381	f	\N	2026-01-12 14:22:57.746676	50
16383	382	f	\N	2026-01-12 14:22:57.746676	50
16384	383	f	\N	2026-01-12 14:22:57.746676	50
16385	384	f	\N	2026-01-12 14:22:57.746676	50
16386	385	f	\N	2026-01-12 14:22:57.746676	50
16387	386	f	\N	2026-01-12 14:22:57.746676	50
16388	387	f	\N	2026-01-12 14:22:57.746676	50
16389	388	f	\N	2026-01-12 14:22:57.746676	50
16390	389	f	\N	2026-01-12 14:22:57.746676	50
16391	390	f	\N	2026-01-12 14:22:57.746676	50
16392	391	f	\N	2026-01-12 14:22:57.746676	50
16393	392	f	\N	2026-01-12 14:22:57.746676	50
16394	393	f	\N	2026-01-12 14:22:57.746676	50
16395	394	f	\N	2026-01-12 14:22:57.746676	50
16396	395	f	\N	2026-01-12 14:22:57.746676	50
16397	396	f	\N	2026-01-12 14:22:57.746676	50
16398	397	f	\N	2026-01-12 14:22:57.746676	50
16399	398	f	\N	2026-01-12 14:22:57.746676	50
16400	399	f	\N	2026-01-12 14:22:57.746676	50
16401	400	f	\N	2026-01-12 14:22:57.746676	50
16402	401	f	\N	2026-01-12 14:22:57.746676	50
16403	402	f	\N	2026-01-12 14:22:57.746676	50
16404	403	f	\N	2026-01-12 14:22:57.746676	50
16405	404	f	\N	2026-01-12 14:22:57.746676	50
16406	405	f	\N	2026-01-12 14:22:57.746676	50
16407	406	f	\N	2026-01-12 14:22:57.746676	50
16408	407	f	\N	2026-01-12 14:22:57.746676	50
16409	408	f	\N	2026-01-12 14:22:57.746676	50
16410	409	f	\N	2026-01-12 14:22:57.746676	50
16411	410	f	\N	2026-01-12 14:22:57.746676	50
16412	411	f	\N	2026-01-12 14:22:57.746676	50
16413	412	f	\N	2026-01-12 14:22:57.746676	50
16414	413	f	\N	2026-01-12 14:22:57.746676	50
16415	414	f	\N	2026-01-12 14:22:57.746676	50
16416	415	f	\N	2026-01-12 14:22:57.746676	50
16417	416	f	\N	2026-01-12 14:22:57.746676	50
16418	417	f	\N	2026-01-12 14:22:57.746676	50
16419	418	f	\N	2026-01-12 14:22:57.746676	50
16420	419	f	\N	2026-01-12 14:22:57.746676	50
16421	420	f	\N	2026-01-12 14:22:57.746676	50
16422	421	f	\N	2026-01-12 14:22:57.746676	50
16423	422	f	\N	2026-01-12 14:22:57.746676	50
16424	423	f	\N	2026-01-12 14:22:57.746676	50
16425	424	f	\N	2026-01-12 14:22:57.746676	50
16426	425	f	\N	2026-01-12 14:22:57.746676	50
16427	426	f	\N	2026-01-12 14:22:57.746676	50
16428	427	f	\N	2026-01-12 14:22:57.746676	50
16429	428	f	\N	2026-01-12 14:22:57.746676	50
16430	429	f	\N	2026-01-12 14:22:57.746676	50
16431	430	f	\N	2026-01-12 14:22:57.746676	50
16432	431	f	\N	2026-01-12 14:22:57.746676	50
16433	432	f	\N	2026-01-12 14:22:57.746676	50
16434	433	f	\N	2026-01-12 14:22:57.746676	50
16435	434	f	\N	2026-01-12 14:22:57.746676	50
16436	435	f	\N	2026-01-12 14:22:57.746676	50
16437	436	f	\N	2026-01-12 14:22:57.746676	50
16438	437	f	\N	2026-01-12 14:22:57.746676	50
16439	438	f	\N	2026-01-12 14:22:57.746676	50
16440	439	f	\N	2026-01-12 14:22:57.746676	50
16441	440	f	\N	2026-01-12 14:22:57.746676	50
16442	441	f	\N	2026-01-12 14:22:57.746676	50
16443	442	f	\N	2026-01-12 14:22:57.746676	50
16444	443	f	\N	2026-01-12 14:22:57.746676	50
16445	444	f	\N	2026-01-12 14:22:57.746676	50
16446	445	f	\N	2026-01-12 14:22:57.746676	50
16447	446	f	\N	2026-01-12 14:22:57.746676	50
16448	447	f	\N	2026-01-12 14:22:57.746676	50
16449	448	f	\N	2026-01-12 14:22:57.746676	50
16450	449	f	\N	2026-01-12 14:22:57.746676	50
16451	450	f	\N	2026-01-12 14:22:57.746676	50
16452	451	f	\N	2026-01-12 14:22:57.746676	50
16453	452	f	\N	2026-01-12 14:22:57.746676	50
16454	453	f	\N	2026-01-12 14:22:57.746676	50
16455	454	f	\N	2026-01-12 14:22:57.746676	50
16456	455	f	\N	2026-01-12 14:22:57.746676	50
16457	456	f	\N	2026-01-12 14:22:57.746676	50
16458	457	f	\N	2026-01-12 14:22:57.746676	50
16459	458	f	\N	2026-01-12 14:22:57.746676	50
16460	459	f	\N	2026-01-12 14:22:57.746676	50
16461	460	f	\N	2026-01-12 14:22:57.746676	50
16462	461	f	\N	2026-01-12 14:22:57.746676	50
16463	462	f	\N	2026-01-12 14:22:57.746676	50
16464	463	f	\N	2026-01-12 14:22:57.746676	50
16465	464	f	\N	2026-01-12 14:22:57.746676	50
16466	465	f	\N	2026-01-12 14:22:57.746676	50
16467	466	f	\N	2026-01-12 14:22:57.746676	50
16468	467	f	\N	2026-01-12 14:22:57.746676	50
16469	468	f	\N	2026-01-12 14:22:57.746676	50
16470	469	f	\N	2026-01-12 14:22:57.746676	50
16471	470	f	\N	2026-01-12 14:22:57.746676	50
16472	471	f	\N	2026-01-12 14:22:57.746676	50
16473	472	f	\N	2026-01-12 14:22:57.746676	50
16474	473	f	\N	2026-01-12 14:22:57.746676	50
16475	474	f	\N	2026-01-12 14:22:57.746676	50
16476	475	f	\N	2026-01-12 14:22:57.746676	50
16477	476	f	\N	2026-01-12 14:22:57.746676	50
16478	477	f	\N	2026-01-12 14:22:57.746676	50
16479	478	f	\N	2026-01-12 14:22:57.746676	50
16480	479	f	\N	2026-01-12 14:22:57.746676	50
16481	480	f	\N	2026-01-12 14:22:57.746676	50
16482	481	f	\N	2026-01-12 14:22:57.746676	50
16483	482	f	\N	2026-01-12 14:22:57.746676	50
16484	483	f	\N	2026-01-12 14:22:57.746676	50
16485	484	f	\N	2026-01-12 14:22:57.746676	50
16486	485	f	\N	2026-01-12 14:22:57.746676	50
16487	486	f	\N	2026-01-12 14:22:57.746676	50
16488	487	f	\N	2026-01-12 14:22:57.746676	50
16489	488	f	\N	2026-01-12 14:22:57.746676	50
16490	489	f	\N	2026-01-12 14:22:57.746676	50
16491	490	f	\N	2026-01-12 14:22:57.746676	50
16492	491	f	\N	2026-01-12 14:22:57.746676	50
16493	492	f	\N	2026-01-12 14:22:57.746676	50
16494	493	f	\N	2026-01-12 14:22:57.746676	50
16495	494	f	\N	2026-01-12 14:22:57.746676	50
16496	495	f	\N	2026-01-12 14:22:57.746676	50
16497	496	f	\N	2026-01-12 14:22:57.746676	50
16498	497	f	\N	2026-01-12 14:22:57.746676	50
16499	498	f	\N	2026-01-12 14:22:57.746676	50
16500	499	f	\N	2026-01-12 14:22:57.746676	50
16501	500	f	\N	2026-01-12 14:22:57.746676	50
6012	11	t	154	2025-12-11 13:56:47.758777	27
6015	14	t	190	2025-12-11 13:56:47.758777	27
5511	10	t	172	2025-12-03 01:51:55.041511	26
16502	1	f	\N	2026-01-18 16:46:37.281698	51
16503	2	f	\N	2026-01-18 16:46:37.281698	51
16504	3	f	\N	2026-01-18 16:46:37.281698	51
16505	4	f	\N	2026-01-18 16:46:37.281698	51
16506	5	f	\N	2026-01-18 16:46:37.281698	51
16507	6	f	\N	2026-01-18 16:46:37.281698	51
16508	7	f	\N	2026-01-18 16:46:37.281698	51
16509	8	f	\N	2026-01-18 16:46:37.281698	51
16510	9	f	\N	2026-01-18 16:46:37.281698	51
16511	10	f	\N	2026-01-18 16:46:37.281698	51
16512	11	f	\N	2026-01-18 16:46:37.281698	51
16513	12	f	\N	2026-01-18 16:46:37.281698	51
16514	13	f	\N	2026-01-18 16:46:37.281698	51
16515	14	f	\N	2026-01-18 16:46:37.281698	51
16516	15	f	\N	2026-01-18 16:46:37.281698	51
16517	16	f	\N	2026-01-18 16:46:37.281698	51
16518	17	f	\N	2026-01-18 16:46:37.281698	51
16519	18	f	\N	2026-01-18 16:46:37.281698	51
16520	19	f	\N	2026-01-18 16:46:37.281698	51
16521	20	f	\N	2026-01-18 16:46:37.281698	51
16522	21	f	\N	2026-01-18 16:46:37.281698	51
16523	22	f	\N	2026-01-18 16:46:37.281698	51
16524	23	f	\N	2026-01-18 16:46:37.281698	51
16525	24	f	\N	2026-01-18 16:46:37.281698	51
16526	25	f	\N	2026-01-18 16:46:37.281698	51
16527	26	f	\N	2026-01-18 16:46:37.281698	51
16528	27	f	\N	2026-01-18 16:46:37.281698	51
16529	28	f	\N	2026-01-18 16:46:37.281698	51
16530	29	f	\N	2026-01-18 16:46:37.281698	51
16531	30	f	\N	2026-01-18 16:46:37.281698	51
16532	31	f	\N	2026-01-18 16:46:37.281698	51
16533	32	f	\N	2026-01-18 16:46:37.281698	51
16534	33	f	\N	2026-01-18 16:46:37.281698	51
16535	34	f	\N	2026-01-18 16:46:37.281698	51
16536	35	f	\N	2026-01-18 16:46:37.281698	51
16537	36	f	\N	2026-01-18 16:46:37.281698	51
16538	37	f	\N	2026-01-18 16:46:37.281698	51
16539	38	f	\N	2026-01-18 16:46:37.281698	51
16540	39	f	\N	2026-01-18 16:46:37.281698	51
16541	40	f	\N	2026-01-18 16:46:37.281698	51
16542	41	f	\N	2026-01-18 16:46:37.281698	51
16543	42	f	\N	2026-01-18 16:46:37.281698	51
16544	43	f	\N	2026-01-18 16:46:37.281698	51
16545	44	f	\N	2026-01-18 16:46:37.281698	51
16546	45	f	\N	2026-01-18 16:46:37.281698	51
16547	46	f	\N	2026-01-18 16:46:37.281698	51
16548	47	f	\N	2026-01-18 16:46:37.281698	51
16549	48	f	\N	2026-01-18 16:46:37.281698	51
16550	49	f	\N	2026-01-18 16:46:37.281698	51
16551	50	f	\N	2026-01-18 16:46:37.281698	51
16552	51	f	\N	2026-01-18 16:46:37.281698	51
16553	52	f	\N	2026-01-18 16:46:37.281698	51
16554	53	f	\N	2026-01-18 16:46:37.281698	51
16555	54	f	\N	2026-01-18 16:46:37.281698	51
16556	55	f	\N	2026-01-18 16:46:37.281698	51
16557	56	f	\N	2026-01-18 16:46:37.281698	51
16558	57	f	\N	2026-01-18 16:46:37.281698	51
16559	58	f	\N	2026-01-18 16:46:37.281698	51
16560	59	f	\N	2026-01-18 16:46:37.281698	51
16561	60	f	\N	2026-01-18 16:46:37.281698	51
16562	61	f	\N	2026-01-18 16:46:37.281698	51
16563	62	f	\N	2026-01-18 16:46:37.281698	51
16564	63	f	\N	2026-01-18 16:46:37.281698	51
16565	64	f	\N	2026-01-18 16:46:37.281698	51
16566	65	f	\N	2026-01-18 16:46:37.281698	51
16567	66	f	\N	2026-01-18 16:46:37.281698	51
16568	67	f	\N	2026-01-18 16:46:37.281698	51
16569	68	f	\N	2026-01-18 16:46:37.281698	51
16570	69	f	\N	2026-01-18 16:46:37.281698	51
16571	70	f	\N	2026-01-18 16:46:37.281698	51
16572	71	f	\N	2026-01-18 16:46:37.281698	51
16573	72	f	\N	2026-01-18 16:46:37.281698	51
16574	73	f	\N	2026-01-18 16:46:37.281698	51
16575	74	f	\N	2026-01-18 16:46:37.281698	51
16576	75	f	\N	2026-01-18 16:46:37.281698	51
16577	76	f	\N	2026-01-18 16:46:37.281698	51
16578	77	f	\N	2026-01-18 16:46:37.281698	51
16579	78	f	\N	2026-01-18 16:46:37.281698	51
16580	79	f	\N	2026-01-18 16:46:37.281698	51
16581	80	f	\N	2026-01-18 16:46:37.281698	51
16582	81	f	\N	2026-01-18 16:46:37.281698	51
16583	82	f	\N	2026-01-18 16:46:37.281698	51
16584	83	f	\N	2026-01-18 16:46:37.281698	51
16585	84	f	\N	2026-01-18 16:46:37.281698	51
16586	85	f	\N	2026-01-18 16:46:37.281698	51
16587	86	f	\N	2026-01-18 16:46:37.281698	51
16588	87	f	\N	2026-01-18 16:46:37.281698	51
16589	88	f	\N	2026-01-18 16:46:37.281698	51
16590	89	f	\N	2026-01-18 16:46:37.281698	51
16591	90	f	\N	2026-01-18 16:46:37.281698	51
16592	91	f	\N	2026-01-18 16:46:37.281698	51
16593	92	f	\N	2026-01-18 16:46:37.281698	51
16594	93	f	\N	2026-01-18 16:46:37.281698	51
16595	94	f	\N	2026-01-18 16:46:37.281698	51
16596	95	f	\N	2026-01-18 16:46:37.281698	51
16597	96	f	\N	2026-01-18 16:46:37.281698	51
16598	97	f	\N	2026-01-18 16:46:37.281698	51
16599	98	f	\N	2026-01-18 16:46:37.281698	51
16600	99	f	\N	2026-01-18 16:46:37.281698	51
16601	100	f	\N	2026-01-18 16:46:37.281698	51
16602	101	f	\N	2026-01-18 16:46:37.281698	51
16603	102	f	\N	2026-01-18 16:46:37.281698	51
16604	103	f	\N	2026-01-18 16:46:37.281698	51
16605	104	f	\N	2026-01-18 16:46:37.281698	51
16606	105	f	\N	2026-01-18 16:46:37.281698	51
16607	106	f	\N	2026-01-18 16:46:37.281698	51
16608	107	f	\N	2026-01-18 16:46:37.281698	51
16609	108	f	\N	2026-01-18 16:46:37.281698	51
16610	109	f	\N	2026-01-18 16:46:37.281698	51
16611	110	f	\N	2026-01-18 16:46:37.281698	51
16612	111	f	\N	2026-01-18 16:46:37.281698	51
16613	112	f	\N	2026-01-18 16:46:37.281698	51
16614	113	f	\N	2026-01-18 16:46:37.281698	51
16615	114	f	\N	2026-01-18 16:46:37.281698	51
16616	115	f	\N	2026-01-18 16:46:37.281698	51
16617	116	f	\N	2026-01-18 16:46:37.281698	51
16618	117	f	\N	2026-01-18 16:46:37.281698	51
16619	118	f	\N	2026-01-18 16:46:37.281698	51
16620	119	f	\N	2026-01-18 16:46:37.281698	51
16621	120	f	\N	2026-01-18 16:46:37.281698	51
16622	121	f	\N	2026-01-18 16:46:37.281698	51
16623	122	f	\N	2026-01-18 16:46:37.281698	51
16624	123	f	\N	2026-01-18 16:46:37.281698	51
16625	124	f	\N	2026-01-18 16:46:37.281698	51
16626	125	f	\N	2026-01-18 16:46:37.281698	51
16627	126	f	\N	2026-01-18 16:46:37.281698	51
16628	127	f	\N	2026-01-18 16:46:37.281698	51
16629	128	f	\N	2026-01-18 16:46:37.281698	51
16630	129	f	\N	2026-01-18 16:46:37.281698	51
16631	130	f	\N	2026-01-18 16:46:37.281698	51
16632	131	f	\N	2026-01-18 16:46:37.281698	51
16633	132	f	\N	2026-01-18 16:46:37.281698	51
16634	133	f	\N	2026-01-18 16:46:37.281698	51
16635	134	f	\N	2026-01-18 16:46:37.281698	51
16636	135	f	\N	2026-01-18 16:46:37.281698	51
16637	136	f	\N	2026-01-18 16:46:37.281698	51
16638	137	f	\N	2026-01-18 16:46:37.281698	51
16639	138	f	\N	2026-01-18 16:46:37.281698	51
16640	139	f	\N	2026-01-18 16:46:37.281698	51
16641	140	f	\N	2026-01-18 16:46:37.281698	51
16642	141	f	\N	2026-01-18 16:46:37.281698	51
16643	142	f	\N	2026-01-18 16:46:37.281698	51
16644	143	f	\N	2026-01-18 16:46:37.281698	51
16645	144	f	\N	2026-01-18 16:46:37.281698	51
16646	145	f	\N	2026-01-18 16:46:37.281698	51
16647	146	f	\N	2026-01-18 16:46:37.281698	51
16648	147	f	\N	2026-01-18 16:46:37.281698	51
16649	148	f	\N	2026-01-18 16:46:37.281698	51
16650	149	f	\N	2026-01-18 16:46:37.281698	51
16651	150	f	\N	2026-01-18 16:46:37.281698	51
16652	151	f	\N	2026-01-18 16:46:37.281698	51
16653	152	f	\N	2026-01-18 16:46:37.281698	51
16654	153	f	\N	2026-01-18 16:46:37.281698	51
16655	154	f	\N	2026-01-18 16:46:37.281698	51
16656	155	f	\N	2026-01-18 16:46:37.281698	51
16657	156	f	\N	2026-01-18 16:46:37.281698	51
16658	157	f	\N	2026-01-18 16:46:37.281698	51
16659	158	f	\N	2026-01-18 16:46:37.281698	51
16660	159	f	\N	2026-01-18 16:46:37.281698	51
16661	160	f	\N	2026-01-18 16:46:37.281698	51
16662	161	f	\N	2026-01-18 16:46:37.281698	51
16663	162	f	\N	2026-01-18 16:46:37.281698	51
16664	163	f	\N	2026-01-18 16:46:37.281698	51
16665	164	f	\N	2026-01-18 16:46:37.281698	51
16666	165	f	\N	2026-01-18 16:46:37.281698	51
16667	166	f	\N	2026-01-18 16:46:37.281698	51
16668	167	f	\N	2026-01-18 16:46:37.281698	51
16669	168	f	\N	2026-01-18 16:46:37.281698	51
16670	169	f	\N	2026-01-18 16:46:37.281698	51
16671	170	f	\N	2026-01-18 16:46:37.281698	51
16672	171	f	\N	2026-01-18 16:46:37.281698	51
16673	172	f	\N	2026-01-18 16:46:37.281698	51
16674	173	f	\N	2026-01-18 16:46:37.281698	51
16675	174	f	\N	2026-01-18 16:46:37.281698	51
16676	175	f	\N	2026-01-18 16:46:37.281698	51
16677	176	f	\N	2026-01-18 16:46:37.281698	51
16678	177	f	\N	2026-01-18 16:46:37.281698	51
16679	178	f	\N	2026-01-18 16:46:37.281698	51
16680	179	f	\N	2026-01-18 16:46:37.281698	51
16681	180	f	\N	2026-01-18 16:46:37.281698	51
16682	181	f	\N	2026-01-18 16:46:37.281698	51
16683	182	f	\N	2026-01-18 16:46:37.281698	51
16684	183	f	\N	2026-01-18 16:46:37.281698	51
16685	184	f	\N	2026-01-18 16:46:37.281698	51
16686	185	f	\N	2026-01-18 16:46:37.281698	51
16687	186	f	\N	2026-01-18 16:46:37.281698	51
16688	187	f	\N	2026-01-18 16:46:37.281698	51
16689	188	f	\N	2026-01-18 16:46:37.281698	51
16690	189	f	\N	2026-01-18 16:46:37.281698	51
16691	190	f	\N	2026-01-18 16:46:37.281698	51
16692	191	f	\N	2026-01-18 16:46:37.281698	51
16693	192	f	\N	2026-01-18 16:46:37.281698	51
16694	193	f	\N	2026-01-18 16:46:37.281698	51
16695	194	f	\N	2026-01-18 16:46:37.281698	51
16696	195	f	\N	2026-01-18 16:46:37.281698	51
16697	196	f	\N	2026-01-18 16:46:37.281698	51
16698	197	f	\N	2026-01-18 16:46:37.281698	51
16699	198	f	\N	2026-01-18 16:46:37.281698	51
16700	199	f	\N	2026-01-18 16:46:37.281698	51
16701	200	f	\N	2026-01-18 16:46:37.281698	51
16702	201	f	\N	2026-01-18 16:46:37.281698	51
16703	202	f	\N	2026-01-18 16:46:37.281698	51
16704	203	f	\N	2026-01-18 16:46:37.281698	51
16705	204	f	\N	2026-01-18 16:46:37.281698	51
16706	205	f	\N	2026-01-18 16:46:37.281698	51
16707	206	f	\N	2026-01-18 16:46:37.281698	51
16708	207	f	\N	2026-01-18 16:46:37.281698	51
16709	208	f	\N	2026-01-18 16:46:37.281698	51
16710	209	f	\N	2026-01-18 16:46:37.281698	51
16711	210	f	\N	2026-01-18 16:46:37.281698	51
16712	211	f	\N	2026-01-18 16:46:37.281698	51
16713	212	f	\N	2026-01-18 16:46:37.281698	51
16714	213	f	\N	2026-01-18 16:46:37.281698	51
16715	214	f	\N	2026-01-18 16:46:37.281698	51
16716	215	f	\N	2026-01-18 16:46:37.281698	51
16717	216	f	\N	2026-01-18 16:46:37.281698	51
16718	217	f	\N	2026-01-18 16:46:37.281698	51
16719	218	f	\N	2026-01-18 16:46:37.281698	51
16720	219	f	\N	2026-01-18 16:46:37.281698	51
16721	220	f	\N	2026-01-18 16:46:37.281698	51
16722	221	f	\N	2026-01-18 16:46:37.281698	51
16723	222	f	\N	2026-01-18 16:46:37.281698	51
16724	223	f	\N	2026-01-18 16:46:37.281698	51
16725	224	f	\N	2026-01-18 16:46:37.281698	51
16726	225	f	\N	2026-01-18 16:46:37.281698	51
16727	226	f	\N	2026-01-18 16:46:37.281698	51
16728	227	f	\N	2026-01-18 16:46:37.281698	51
16729	228	f	\N	2026-01-18 16:46:37.281698	51
16730	229	f	\N	2026-01-18 16:46:37.281698	51
16731	230	f	\N	2026-01-18 16:46:37.281698	51
16732	231	f	\N	2026-01-18 16:46:37.281698	51
16733	232	f	\N	2026-01-18 16:46:37.281698	51
16734	233	f	\N	2026-01-18 16:46:37.281698	51
16735	234	f	\N	2026-01-18 16:46:37.281698	51
16736	235	f	\N	2026-01-18 16:46:37.281698	51
16737	236	f	\N	2026-01-18 16:46:37.281698	51
16738	237	f	\N	2026-01-18 16:46:37.281698	51
16739	238	f	\N	2026-01-18 16:46:37.281698	51
16740	239	f	\N	2026-01-18 16:46:37.281698	51
16741	240	f	\N	2026-01-18 16:46:37.281698	51
16742	241	f	\N	2026-01-18 16:46:37.281698	51
16743	242	f	\N	2026-01-18 16:46:37.281698	51
16744	243	f	\N	2026-01-18 16:46:37.281698	51
16745	244	f	\N	2026-01-18 16:46:37.281698	51
16746	245	f	\N	2026-01-18 16:46:37.281698	51
16747	246	f	\N	2026-01-18 16:46:37.281698	51
16748	247	f	\N	2026-01-18 16:46:37.281698	51
16749	248	f	\N	2026-01-18 16:46:37.281698	51
16750	249	f	\N	2026-01-18 16:46:37.281698	51
16751	250	f	\N	2026-01-18 16:46:37.281698	51
16752	251	f	\N	2026-01-18 16:46:37.281698	51
16753	252	f	\N	2026-01-18 16:46:37.281698	51
16754	253	f	\N	2026-01-18 16:46:37.281698	51
16755	254	f	\N	2026-01-18 16:46:37.281698	51
16756	255	f	\N	2026-01-18 16:46:37.281698	51
16757	256	f	\N	2026-01-18 16:46:37.281698	51
16758	257	f	\N	2026-01-18 16:46:37.281698	51
16759	258	f	\N	2026-01-18 16:46:37.281698	51
16760	259	f	\N	2026-01-18 16:46:37.281698	51
16761	260	f	\N	2026-01-18 16:46:37.281698	51
16762	261	f	\N	2026-01-18 16:46:37.281698	51
16763	262	f	\N	2026-01-18 16:46:37.281698	51
16764	263	f	\N	2026-01-18 16:46:37.281698	51
16765	264	f	\N	2026-01-18 16:46:37.281698	51
16766	265	f	\N	2026-01-18 16:46:37.281698	51
16767	266	f	\N	2026-01-18 16:46:37.281698	51
16768	267	f	\N	2026-01-18 16:46:37.281698	51
16769	268	f	\N	2026-01-18 16:46:37.281698	51
16770	269	f	\N	2026-01-18 16:46:37.281698	51
16771	270	f	\N	2026-01-18 16:46:37.281698	51
16772	271	f	\N	2026-01-18 16:46:37.281698	51
16773	272	f	\N	2026-01-18 16:46:37.281698	51
16774	273	f	\N	2026-01-18 16:46:37.281698	51
16775	274	f	\N	2026-01-18 16:46:37.281698	51
16776	275	f	\N	2026-01-18 16:46:37.281698	51
16777	276	f	\N	2026-01-18 16:46:37.281698	51
16778	277	f	\N	2026-01-18 16:46:37.281698	51
16779	278	f	\N	2026-01-18 16:46:37.281698	51
16780	279	f	\N	2026-01-18 16:46:37.281698	51
16781	280	f	\N	2026-01-18 16:46:37.281698	51
16782	281	f	\N	2026-01-18 16:46:37.281698	51
16783	282	f	\N	2026-01-18 16:46:37.281698	51
16784	283	f	\N	2026-01-18 16:46:37.281698	51
16785	284	f	\N	2026-01-18 16:46:37.281698	51
16786	285	f	\N	2026-01-18 16:46:37.281698	51
16787	286	f	\N	2026-01-18 16:46:37.281698	51
16788	287	f	\N	2026-01-18 16:46:37.281698	51
16789	288	f	\N	2026-01-18 16:46:37.281698	51
16790	289	f	\N	2026-01-18 16:46:37.281698	51
16791	290	f	\N	2026-01-18 16:46:37.281698	51
16792	291	f	\N	2026-01-18 16:46:37.281698	51
16793	292	f	\N	2026-01-18 16:46:37.281698	51
16794	293	f	\N	2026-01-18 16:46:37.281698	51
16795	294	f	\N	2026-01-18 16:46:37.281698	51
16796	295	f	\N	2026-01-18 16:46:37.281698	51
16797	296	f	\N	2026-01-18 16:46:37.281698	51
16798	297	f	\N	2026-01-18 16:46:37.281698	51
16799	298	f	\N	2026-01-18 16:46:37.281698	51
16800	299	f	\N	2026-01-18 16:46:37.281698	51
16801	300	f	\N	2026-01-18 16:46:37.281698	51
16802	301	f	\N	2026-01-18 16:46:37.281698	51
16803	302	f	\N	2026-01-18 16:46:37.281698	51
16804	303	f	\N	2026-01-18 16:46:37.281698	51
16805	304	f	\N	2026-01-18 16:46:37.281698	51
16806	305	f	\N	2026-01-18 16:46:37.281698	51
16807	306	f	\N	2026-01-18 16:46:37.281698	51
16808	307	f	\N	2026-01-18 16:46:37.281698	51
16809	308	f	\N	2026-01-18 16:46:37.281698	51
16810	309	f	\N	2026-01-18 16:46:37.281698	51
16811	310	f	\N	2026-01-18 16:46:37.281698	51
16812	311	f	\N	2026-01-18 16:46:37.281698	51
16813	312	f	\N	2026-01-18 16:46:37.281698	51
16814	313	f	\N	2026-01-18 16:46:37.281698	51
16815	314	f	\N	2026-01-18 16:46:37.281698	51
16816	315	f	\N	2026-01-18 16:46:37.281698	51
16817	316	f	\N	2026-01-18 16:46:37.281698	51
16818	317	f	\N	2026-01-18 16:46:37.281698	51
16819	318	f	\N	2026-01-18 16:46:37.281698	51
16820	319	f	\N	2026-01-18 16:46:37.281698	51
16821	320	f	\N	2026-01-18 16:46:37.281698	51
16822	321	f	\N	2026-01-18 16:46:37.281698	51
16823	322	f	\N	2026-01-18 16:46:37.281698	51
16824	323	f	\N	2026-01-18 16:46:37.281698	51
16825	324	f	\N	2026-01-18 16:46:37.281698	51
16826	325	f	\N	2026-01-18 16:46:37.281698	51
16827	326	f	\N	2026-01-18 16:46:37.281698	51
16828	327	f	\N	2026-01-18 16:46:37.281698	51
16829	328	f	\N	2026-01-18 16:46:37.281698	51
16830	329	f	\N	2026-01-18 16:46:37.281698	51
16831	330	f	\N	2026-01-18 16:46:37.281698	51
16832	331	f	\N	2026-01-18 16:46:37.281698	51
16833	332	f	\N	2026-01-18 16:46:37.281698	51
16834	333	f	\N	2026-01-18 16:46:37.281698	51
16835	334	f	\N	2026-01-18 16:46:37.281698	51
16836	335	f	\N	2026-01-18 16:46:37.281698	51
16837	336	f	\N	2026-01-18 16:46:37.281698	51
16838	337	f	\N	2026-01-18 16:46:37.281698	51
16839	338	f	\N	2026-01-18 16:46:37.281698	51
16840	339	f	\N	2026-01-18 16:46:37.281698	51
16841	340	f	\N	2026-01-18 16:46:37.281698	51
16842	341	f	\N	2026-01-18 16:46:37.281698	51
16843	342	f	\N	2026-01-18 16:46:37.281698	51
16844	343	f	\N	2026-01-18 16:46:37.281698	51
16845	344	f	\N	2026-01-18 16:46:37.281698	51
16846	345	f	\N	2026-01-18 16:46:37.281698	51
16847	346	f	\N	2026-01-18 16:46:37.281698	51
16848	347	f	\N	2026-01-18 16:46:37.281698	51
16849	348	f	\N	2026-01-18 16:46:37.281698	51
16850	349	f	\N	2026-01-18 16:46:37.281698	51
16851	350	f	\N	2026-01-18 16:46:37.281698	51
16852	351	f	\N	2026-01-18 16:46:37.281698	51
16853	352	f	\N	2026-01-18 16:46:37.281698	51
16854	353	f	\N	2026-01-18 16:46:37.281698	51
16855	354	f	\N	2026-01-18 16:46:37.281698	51
16856	355	f	\N	2026-01-18 16:46:37.281698	51
16857	356	f	\N	2026-01-18 16:46:37.281698	51
16858	357	f	\N	2026-01-18 16:46:37.281698	51
16859	358	f	\N	2026-01-18 16:46:37.281698	51
16860	359	f	\N	2026-01-18 16:46:37.281698	51
16861	360	f	\N	2026-01-18 16:46:37.281698	51
16862	361	f	\N	2026-01-18 16:46:37.281698	51
16863	362	f	\N	2026-01-18 16:46:37.281698	51
16864	363	f	\N	2026-01-18 16:46:37.281698	51
16865	364	f	\N	2026-01-18 16:46:37.281698	51
16866	365	f	\N	2026-01-18 16:46:37.281698	51
16867	366	f	\N	2026-01-18 16:46:37.281698	51
16868	367	f	\N	2026-01-18 16:46:37.281698	51
16869	368	f	\N	2026-01-18 16:46:37.281698	51
16870	369	f	\N	2026-01-18 16:46:37.281698	51
16871	370	f	\N	2026-01-18 16:46:37.281698	51
16872	371	f	\N	2026-01-18 16:46:37.281698	51
16873	372	f	\N	2026-01-18 16:46:37.281698	51
16874	373	f	\N	2026-01-18 16:46:37.281698	51
16875	374	f	\N	2026-01-18 16:46:37.281698	51
16876	375	f	\N	2026-01-18 16:46:37.281698	51
16877	376	f	\N	2026-01-18 16:46:37.281698	51
16878	377	f	\N	2026-01-18 16:46:37.281698	51
16879	378	f	\N	2026-01-18 16:46:37.281698	51
16880	379	f	\N	2026-01-18 16:46:37.281698	51
16881	380	f	\N	2026-01-18 16:46:37.281698	51
16882	381	f	\N	2026-01-18 16:46:37.281698	51
16883	382	f	\N	2026-01-18 16:46:37.281698	51
16884	383	f	\N	2026-01-18 16:46:37.281698	51
16885	384	f	\N	2026-01-18 16:46:37.281698	51
16886	385	f	\N	2026-01-18 16:46:37.281698	51
16887	386	f	\N	2026-01-18 16:46:37.281698	51
16888	387	f	\N	2026-01-18 16:46:37.281698	51
16889	388	f	\N	2026-01-18 16:46:37.281698	51
16890	389	f	\N	2026-01-18 16:46:37.281698	51
16891	390	f	\N	2026-01-18 16:46:37.281698	51
16892	391	f	\N	2026-01-18 16:46:37.281698	51
16893	392	f	\N	2026-01-18 16:46:37.281698	51
16894	393	f	\N	2026-01-18 16:46:37.281698	51
16895	394	f	\N	2026-01-18 16:46:37.281698	51
16896	395	f	\N	2026-01-18 16:46:37.281698	51
16897	396	f	\N	2026-01-18 16:46:37.281698	51
16898	397	f	\N	2026-01-18 16:46:37.281698	51
16899	398	f	\N	2026-01-18 16:46:37.281698	51
16900	399	f	\N	2026-01-18 16:46:37.281698	51
16901	400	f	\N	2026-01-18 16:46:37.281698	51
16902	401	f	\N	2026-01-18 16:46:37.281698	51
16903	402	f	\N	2026-01-18 16:46:37.281698	51
16904	403	f	\N	2026-01-18 16:46:37.281698	51
16905	404	f	\N	2026-01-18 16:46:37.281698	51
16906	405	f	\N	2026-01-18 16:46:37.281698	51
16907	406	f	\N	2026-01-18 16:46:37.281698	51
16908	407	f	\N	2026-01-18 16:46:37.281698	51
16909	408	f	\N	2026-01-18 16:46:37.281698	51
16910	409	f	\N	2026-01-18 16:46:37.281698	51
16911	410	f	\N	2026-01-18 16:46:37.281698	51
16912	411	f	\N	2026-01-18 16:46:37.281698	51
16913	412	f	\N	2026-01-18 16:46:37.281698	51
16914	413	f	\N	2026-01-18 16:46:37.281698	51
16915	414	f	\N	2026-01-18 16:46:37.281698	51
16916	415	f	\N	2026-01-18 16:46:37.281698	51
16917	416	f	\N	2026-01-18 16:46:37.281698	51
16918	417	f	\N	2026-01-18 16:46:37.281698	51
16919	418	f	\N	2026-01-18 16:46:37.281698	51
16920	419	f	\N	2026-01-18 16:46:37.281698	51
16921	420	f	\N	2026-01-18 16:46:37.281698	51
16922	421	f	\N	2026-01-18 16:46:37.281698	51
16923	422	f	\N	2026-01-18 16:46:37.281698	51
16924	423	f	\N	2026-01-18 16:46:37.281698	51
16925	424	f	\N	2026-01-18 16:46:37.281698	51
16926	425	f	\N	2026-01-18 16:46:37.281698	51
16927	426	f	\N	2026-01-18 16:46:37.281698	51
16928	427	f	\N	2026-01-18 16:46:37.281698	51
16929	428	f	\N	2026-01-18 16:46:37.281698	51
16930	429	f	\N	2026-01-18 16:46:37.281698	51
16931	430	f	\N	2026-01-18 16:46:37.281698	51
16932	431	f	\N	2026-01-18 16:46:37.281698	51
16933	432	f	\N	2026-01-18 16:46:37.281698	51
16934	433	f	\N	2026-01-18 16:46:37.281698	51
16935	434	f	\N	2026-01-18 16:46:37.281698	51
16936	435	f	\N	2026-01-18 16:46:37.281698	51
16937	436	f	\N	2026-01-18 16:46:37.281698	51
16938	437	f	\N	2026-01-18 16:46:37.281698	51
16939	438	f	\N	2026-01-18 16:46:37.281698	51
16940	439	f	\N	2026-01-18 16:46:37.281698	51
16941	440	f	\N	2026-01-18 16:46:37.281698	51
16942	441	f	\N	2026-01-18 16:46:37.281698	51
16943	442	f	\N	2026-01-18 16:46:37.281698	51
16944	443	f	\N	2026-01-18 16:46:37.281698	51
16945	444	f	\N	2026-01-18 16:46:37.281698	51
16946	445	f	\N	2026-01-18 16:46:37.281698	51
16947	446	f	\N	2026-01-18 16:46:37.281698	51
16948	447	f	\N	2026-01-18 16:46:37.281698	51
16949	448	f	\N	2026-01-18 16:46:37.281698	51
16950	449	f	\N	2026-01-18 16:46:37.281698	51
16951	450	f	\N	2026-01-18 16:46:37.281698	51
16952	451	f	\N	2026-01-18 16:46:37.281698	51
16953	452	f	\N	2026-01-18 16:46:37.281698	51
16954	453	f	\N	2026-01-18 16:46:37.281698	51
16955	454	f	\N	2026-01-18 16:46:37.281698	51
16956	455	f	\N	2026-01-18 16:46:37.281698	51
16957	456	f	\N	2026-01-18 16:46:37.281698	51
16958	457	f	\N	2026-01-18 16:46:37.281698	51
16959	458	f	\N	2026-01-18 16:46:37.281698	51
16960	459	f	\N	2026-01-18 16:46:37.281698	51
16961	460	f	\N	2026-01-18 16:46:37.281698	51
16962	461	f	\N	2026-01-18 16:46:37.281698	51
16963	462	f	\N	2026-01-18 16:46:37.281698	51
16964	463	f	\N	2026-01-18 16:46:37.281698	51
16965	464	f	\N	2026-01-18 16:46:37.281698	51
16966	465	f	\N	2026-01-18 16:46:37.281698	51
16967	466	f	\N	2026-01-18 16:46:37.281698	51
16968	467	f	\N	2026-01-18 16:46:37.281698	51
16969	468	f	\N	2026-01-18 16:46:37.281698	51
16970	469	f	\N	2026-01-18 16:46:37.281698	51
16971	470	f	\N	2026-01-18 16:46:37.281698	51
16972	471	f	\N	2026-01-18 16:46:37.281698	51
16973	472	f	\N	2026-01-18 16:46:37.281698	51
16974	473	f	\N	2026-01-18 16:46:37.281698	51
16975	474	f	\N	2026-01-18 16:46:37.281698	51
16976	475	f	\N	2026-01-18 16:46:37.281698	51
16977	476	f	\N	2026-01-18 16:46:37.281698	51
16978	477	f	\N	2026-01-18 16:46:37.281698	51
16979	478	f	\N	2026-01-18 16:46:37.281698	51
16980	479	f	\N	2026-01-18 16:46:37.281698	51
16981	480	f	\N	2026-01-18 16:46:37.281698	51
16982	481	f	\N	2026-01-18 16:46:37.281698	51
16983	482	f	\N	2026-01-18 16:46:37.281698	51
16984	483	f	\N	2026-01-18 16:46:37.281698	51
16985	484	f	\N	2026-01-18 16:46:37.281698	51
16986	485	f	\N	2026-01-18 16:46:37.281698	51
16987	486	f	\N	2026-01-18 16:46:37.281698	51
16988	487	f	\N	2026-01-18 16:46:37.281698	51
16989	488	f	\N	2026-01-18 16:46:37.281698	51
16990	489	f	\N	2026-01-18 16:46:37.281698	51
16991	490	f	\N	2026-01-18 16:46:37.281698	51
16992	491	f	\N	2026-01-18 16:46:37.281698	51
16993	492	f	\N	2026-01-18 16:46:37.281698	51
16994	493	f	\N	2026-01-18 16:46:37.281698	51
16995	494	f	\N	2026-01-18 16:46:37.281698	51
16996	495	f	\N	2026-01-18 16:46:37.281698	51
16997	496	f	\N	2026-01-18 16:46:37.281698	51
16998	497	f	\N	2026-01-18 16:46:37.281698	51
16999	498	f	\N	2026-01-18 16:46:37.281698	51
17000	499	f	\N	2026-01-18 16:46:37.281698	51
17001	500	f	\N	2026-01-18 16:46:37.281698	51
5517	16	f	\N	2025-12-03 01:51:55.041511	26
5512	11	f	\N	2025-12-03 01:51:55.041511	26
\.


--
-- Data for Name: tag_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tag_configurations (organization_id, tag_type, start_sequence, current_sequence, printer_name) FROM stdin;
\.


--
-- Data for Name: ticket_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_feedback (id, ticket_id, customer_id, rating, comments, created_at) FROM stdin;
\.


--
-- Data for Name: ticket_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_items (id, ticket_id, clothing_type_id, quantity, starch_level, crease, item_total, plant_price, margin, organization_id, alterations, item_instructions, additional_charge, alteration_behavior, instruction_charge, custom_name, starch_charge, clothing_size, size_charge) FROM stdin;
37	43	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
38	43	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
39	43	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
40	44	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
41	44	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
42	44	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
43	45	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
44	45	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
45	45	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
46	46	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
47	46	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
48	46	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
49	47	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
50	47	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
51	47	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
54	49	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
55	53	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
56	53	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
57	53	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
64	55	23	1	high	true	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
65	55	23	1	high	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
66	55	22	1	medium	false	1200.00	1000.00	200.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
67	55	22	1	none	false	1200.00	1000.00	200.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
72	57	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
73	57	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
74	57	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
75	57	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
76	57	21	1	none	false	1500.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
52	48	20	2	none	false	2400.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
53	48	21	2	none	false	3000.00	1200.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
83	60	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
84	60	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
1	7	3	1	no_starch	no_crease	12.01	8.00	4.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
2	8	2	1	light	no_crease	6.01	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
3	9	3	1	no_starch	no_crease	12.01	8.00	4.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
4	10	3	1	no_starch	no_crease	12.05	8.00	4.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
5	11	2	2	no_starch	no_crease	12.02	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
6	12	2	2	light	no_crease	12.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
7	13	2	2	light	no_crease	12.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
8	14	2	1	no_starch	no_crease	6.02	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
9	15	2	1	light	crease	6.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
10	16	5	18	light	crease	72.00	2.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
11	17	2	1	no_starch	no_crease	6.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
12	18	2	1	light	no_crease	6.01	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
13	19	1	4	medium	crease	20.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
14	20	2	2	no_starch	no_crease	12.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
15	21	2	2	no_starch	no_crease	12.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
16	22	1	3	medium	yes	15.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
17	22	2	1	none	no	6.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
18	28	1	3	medium	no	15.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
19	28	2	4	medium	yes	24.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
20	29	1	4	light	crease	20.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
21	30	1	4	light	crease	20.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
22	31	1	6	no_starch	crease	30.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
85	60	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
89	62	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
90	62	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
91	62	21	1	none	false	2000.00	1700.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
94	64	24	1	none	false	13011.00	12900.00	111.00	21	torn collar	\N	0.00	none	0.00	\N	0.00	standard	0.00
95	64	20	1	none	false	1200.00	1000.00	200.00	21	free	\N	0.00	none	0.00	\N	0.00	standard	0.00
100	67	24	1	none	false	13011.00	12900.00	111.00	21	fuck	you	0.00	none	0.00	\N	0.00	standard	0.00
101	67	21	1	none	false	2000.00	1700.00	300.00	21	Yes	No	0.00	none	0.00	\N	0.00	standard	0.00
104	70	24	1	none	false	113011.00	12900.00	111.00	21	\N	\N	100000.00	none	0.00	\N	0.00	standard	0.00
105	70	20	1	none	false	101200.00	1000.00	200.00	21	\N	\N	100000.00	none	0.00	\N	0.00	standard	0.00
108	73	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
109	73	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
112	75	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
113	75	21	1	none	false	2000.00	1700.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
116	77	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
117	77	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
120	80	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
121	80	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
122	81	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
123	81	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
125	83	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
127	85	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
129	87	20	1	none	false	1200.00	1000.00	200.00	21	Replace Zipper	Stain: Front	0.00	none	0.00	\N	0.00	standard	0.00
130	87	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
131	87	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
132	88	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
133	89	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
134	90	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
135	90	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
138	92	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
139	92	21	1	none	false	2000.00	1700.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
140	93	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
141	93	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
144	95	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
145	95	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
146	95	21	1	none	false	2000.00	1700.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
58	54	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
59	54	22	1	none	false	1200.00	1000.00	200.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
60	54	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
61	54	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
62	54	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
63	54	23	1	none	false	1500.00	1200.00	300.00	22	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
68	56	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
69	56	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
70	56	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
71	56	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
77	58	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
78	58	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
79	58	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
80	59	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
81	59	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
82	59	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
86	61	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
87	61	21	1	none	false	2000.00	1700.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
88	61	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
92	63	24	1	none	false	13011.00	12900.00	111.00	21	sew button	\N	0.00	none	0.00	\N	0.00	standard	0.00
93	63	20	1	none	false	1200.00	1000.00	200.00	21	collar	\N	0.00	none	0.00	\N	0.00	standard	0.00
96	65	24	1	none	false	13011.00	12900.00	111.00	21	\N	Palm oil at the top	0.00	none	0.00	\N	0.00	standard	0.00
97	65	20	1	none	false	1200.00	1000.00	200.00	21	\N	Wash thouroughly	0.00	none	0.00	\N	0.00	standard	0.00
98	66	24	1	none	false	13011.00	12900.00	111.00	21	two buttons mising	wash with soda	0.00	none	0.00	\N	0.00	standard	0.00
99	66	20	1	none	false	1200.00	1000.00	200.00	21	not altered	wash with sunlight	0.00	none	0.00	\N	0.00	standard	0.00
102	69	24	1	none	false	13211.00	12900.00	111.00	21	Lengthen Sleeves	\N	200.00	none	0.00	\N	0.00	standard	0.00
103	69	21	1	none	false	2100.00	1700.00	300.00	21	Patch Repair	\N	100.00	none	0.00	\N	0.00	standard	0.00
106	72	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
107	72	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
110	74	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
111	74	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
114	76	30	1	none	false	1500.00	1200.00	300.00	26	Patch Repair	Press Only	0.00	none	0.00	\N	0.00	standard	0.00
115	76	29	1	none	false	1200.00	1000.00	200.00	26	Hem Skirt/Dress	Press Only	0.00	none	0.00	\N	0.00	standard	0.00
118	78	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
119	78	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
124	82	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
126	84	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
128	86	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
136	91	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
137	91	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
142	94	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
143	94	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
147	96	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
148	96	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
149	96	21	1	none	false	2000.00	1700.00	300.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
150	97	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
151	98	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
152	99	35	1	none	false	1500.00	1200.00	300.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
153	99	34	1	none	false	1200.00	1000.00	200.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
154	100	35	1	none	false	1500.00	1200.00	300.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
155	100	34	1	none	false	1200.00	1000.00	200.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
156	101	35	1	none	false	1500.00	1200.00	300.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
157	101	34	1	none	false	1200.00	1000.00	200.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
23	32	2	3	light	crease	18.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
24	33	1	10	light	crease	50.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
25	34	3	3	heavy	no_crease	36.00	8.00	4.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
26	34	2	3	light	crease	18.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
27	35	1	3	light	no_crease	15.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
28	36	1	4	medium	no_crease	20.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
29	37	1	6	light	crease	30.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
30	37	2	6	no_starch	no_crease	36.00	4.00	2.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
31	38	3	1	no_starch	no_crease	12.00	8.00	4.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
32	38	3	1	no_starch	no_crease	12.00	8.00	4.00	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
33	39	1	1	no_starch	no_crease	5.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
34	39	1	1	no_starch	no_crease	5.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
35	39	1	1	no_starch	no_crease	5.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
36	39	1	1	no_starch	no_crease	5.00	3.50	1.50	\N	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
158	102	35	1	none	false	1500.00	1200.00	300.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
159	102	34	1	none	false	1200.00	1000.00	200.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
160	102	35	1	none	false	1500.00	1200.00	300.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
161	102	34	1	none	false	1200.00	1000.00	200.00	28	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
162	103	20	1	none	false	101200.00	1000.00	200.00	21	\N	Stain: Collar	100000.00	none	0.00	\N	0.00	standard	0.00
163	103	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
164	104	24	1	none	false	14011.00	12900.00	111.00	21	\N	\N	1000.00	none	0.00	\N	0.00	standard	0.00
165	104	20	1	none	false	2200.00	1000.00	200.00	21	\N	\N	1000.00	none	0.00	\N	0.00	standard	0.00
166	105	24	1	none	false	14011.00	12900.00	111.00	21	\N	\N	1000.00	none	0.00	\N	0.00	standard	0.00
167	106	24	1	none	false	14011.00	12900.00	111.00	21	\N	\N	1000.00	none	0.00	\N	0.00	standard	0.00
168	106	20	1	none	false	6200.00	1000.00	200.00	21	\N	\N	5000.00	none	0.00	\N	0.00	standard	0.00
169	107	24	1	none	false	14011.00	12900.00	111.00	21	\N	\N	1000.00	none	0.00	\N	0.00	standard	0.00
170	107	20	1	none	false	6200.00	1000.00	200.00	21	\N	\N	5000.00	none	0.00	\N	0.00	standard	0.00
171	108	20	1	none	false	3200.00	1000.00	200.00	21	\N	\N	1000.00	none	1000.00	\N	0.00	standard	0.00
172	108	24	1	none	false	23011.00	12900.00	111.00	21	\N	\N	5000.00	none	5000.00	\N	0.00	standard	0.00
173	110	\N	1	none	false	1000.00	1000.00	0.00	21	\N	\N	0.00	none	0.00	vintage	0.00	standard	0.00
174	111	\N	1	none	false	1000.00	1000.00	0.00	21	\N	\N	0.00	none	0.00	vintage	0.00	standard	0.00
175	112	\N	1	none	false	1000.00	1000.00	0.00	21	\N	\N	0.00	none	0.00	vintage	0.00	standard	0.00
176	113	\N	1	none	false	1000.00	1000.00	0.00	21	\N	\N	0.00	none	0.00	vintage	0.00	standard	0.00
177	114	\N	1	none	false	1000.00	1000.00	0.00	21	\N	\N	0.00	none	0.00	vintage	0.00	standard	0.00
178	114	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
179	115	\N	1	none	false	1000.00	1000.00	0.00	21	\N	\N	0.00	none	0.00	Tie	0.00	standard	0.00
180	115	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
181	116	35	1	medium	true	1700.00	1200.00	300.00	28	\N	\N	0.00	none	0.00	\N	200.00	standard	0.00
182	117	20	1	low	false	1301.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	101.00	standard	0.00
183	117	24	1	medium	false	13211.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	200.00	standard	0.00
184	118	36	1	high	false	410.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	300.00	standard	0.00
185	118	31	1	low	false	10600.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	100.00	standard	0.00
186	118	\N	1	medium	false	400.00	200.00	0.00	11	\N	\N	0.00	none	0.00	Tie	200.00	standard	0.00
187	119	\N	4	low	false	1200.00	200.00	0.00	11	\N	\N	0.00	none	0.00	vintage	400.00	standard	0.00
188	119	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
189	120	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
190	120	36	1	none	true	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
191	121	36	1	none	false	115.00	100.00	10.00	11	\N	 (+$5)	5.00	none	0.00	\N	0.00	standard	0.00
192	122	36	1	none	false	130.00	100.00	10.00	11	\N	 (+$20)	20.00	none	0.00	\N	0.00	standard	0.00
193	123	36	1	medium	false	420.00	100.00	10.00	11	\N	 (+$64) (+$63) (+$62) (+$61) (+$60) (+$59) (+$58) (+$57) (+$56) (+$55) (+$54) (+$53) (+$52) (+$51) (+$50) (+$49) (+$48) (+$47) (+$46) (+$45) (+$44) (+$43) (+$42) (+$41) (+$40) (+$39) (+$38) (+$37) (+$36) (+$35) (+$34) (+$33) (+$32) (+$31) (+$30) (+$29) (+$28) (+$27) (+$26) (+$25) (+$24) (+$23) (+$22) (+$21) (+$20) (+$19) (+$18) (+$17) (+$16) (+$15) (+$14) (+$13) (+$12) (+$11) (+$10) (+$9) (+$8) (+$7) (+$6) (+$5) (+$4) (+$3) (+$2) (+$1) (+$10) (+$20) (+$30) (+$40) (+$50) (+$60) (+$70) (+$80) (+$90) (+$100) (+$110)	110.00	none	0.00	\N	200.00	standard	0.00
194	124	36	1	medium	false	330.00	100.00	10.00	11	\N	 (+$20)	20.00	none	0.00	\N	200.00	standard	0.00
195	125	36	1	medium	false	370.00	100.00	10.00	11	\N	 (+$10) (+$20) (+$30) (+$40) (+$50) (+$60)	60.00	none	0.00	\N	200.00	standard	0.00
196	126	36	1	medium	false	420.00	100.00	10.00	11	\N	 (+$110)	110.00	none	0.00	\N	200.00	standard	0.00
197	127	36	1	none	false	130.00	100.00	10.00	11	\N	 (+$20)	20.00	none	0.00	\N	0.00	standard	0.00
198	127	\N	1	medium	false	420.00	200.00	0.00	11	\N	 (+$20)	20.00	none	0.00	tie	200.00	standard	0.00
199	128	36	1	medium	false	330.00	100.00	10.00	11	\N	 (+$20)	20.00	none	0.00	\N	200.00	standard	0.00
200	129	36	1	high	false	410.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	300.00	standard	0.00
201	130	\N	1	medium	false	700.00	500.00	0.00	11	\N	\N	0.00	none	0.00	tie	200.00	standard	0.00
202	131	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
203	131	\N	1	medium	false	1200.00	1000.00	0.00	11	\N	\N	0.00	none	0.00	tie	200.00	standard	0.00
204	132	36	1	high	false	430.00	100.00	10.00	11	\N	 (+$20)	20.00	none	0.00	\N	300.00	standard	0.00
205	133	36	1	high	false	465.00	100.00	10.00	11	\N	 (+$20)	20.00	none	0.00	\N	300.00	standard	35.00
206	134	36	1	medium	false	340.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	200.00	standard	30.00
207	134	31	1	low	true	10630.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	100.00	standard	30.00
208	135	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
209	135	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
210	136	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
211	136	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
212	137	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
213	137	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
214	138	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
215	138	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
216	139	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
217	139	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
218	140	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
219	140	31	1	none	false	10500.00	10000.00	500.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
220	141	36	1	none	false	110.00	100.00	10.00	11	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
221	142	\N	1	none	false	1000.00	1000.00	0.00	11	\N	\N	0.00	none	0.00	scarf	0.00	standard	0.00
222	142	\N	1	none	false	1000.00	1000.00	0.00	11	\N	\N	0.00	none	0.00	tie	0.00	standard	0.00
223	143	\N	1	none	false	1000.00	1000.00	0.00	11	\N	\N	0.00	none	0.00	tie	0.00	standard	0.00
224	144	\N	1	none	false	2500.00	2000.00	500.00	11	\N	\N	0.00	none	0.00	tie	0.00	standard	0.00
225	145	\N	1	none	false	1500.00	1000.00	500.00	21	\N	\N	0.00	none	0.00	tie	0.00	standard	0.00
226	146	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
227	146	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
228	147	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
229	147	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
230	148	\N	2	none	false	1000.00	500.00	0.00	27			0.00	none	0.00	Blue Shirt	0.00	standard	0.00
231	148	\N	1	none	false	300.00	300.00	0.00	27			0.00	none	0.00	Black Pants	0.00	standard	0.00
232	149	\N	1	none	false	2000.00	2000.00	0.00	27			0.00	none	0.00	Suit	0.00	standard	0.00
233	150	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
234	150	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
235	151	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
236	151	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
237	152	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
238	152	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
239	153	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
240	153	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
241	154	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
242	155	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
243	156	29	1	none	false	1200.00	1000.00	200.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
244	156	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
245	157	20	1	none	false	1200.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
246	157	24	1	none	false	13011.00	12900.00	111.00	21	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
247	158	\N	1	medium	false	2432.00	2000.00	200.00	21	\N	 (+$2)	2.00	none	0.00	tie	200.00	standard	30.00
248	158	20	1	high	false	1535.00	1000.00	200.00	21	\N	\N	0.00	none	0.00	\N	300.00	standard	35.00
249	159	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
250	159	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
251	160	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
252	160	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
253	161	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
254	161	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
255	162	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
256	162	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
257	163	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
258	163	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
259	164	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
260	164	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
261	165	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
262	165	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
263	166	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
264	167	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
265	167	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
266	168	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
267	168	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
268	169	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
269	169	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
270	170	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
271	171	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
272	172	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
273	173	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
274	174	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
275	174	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
276	175	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
277	176	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
278	177	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
279	177	32	1	none	false	1200.00	1000.00	200.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
280	180	\N	2	none	false	1000.00	500.00	0.00	27			0.00	none	0.00	Blue Shirt	0.00	standard	0.00
281	181	\N	1	none	false	2000.00	2000.00	0.00	27			0.00	none	0.00	Suit	0.00	standard	0.00
282	182	\N	2	none	false	1000.00	500.00	0.00	27			0.00	none	0.00	Blue Shirt	0.00	standard	0.00
283	182	\N	1	none	false	2000.00	2000.00	0.00	27			0.00	none	0.00	Suit	0.00	standard	0.00
284	184	\N	2	none	false	1000.00	500.00	0.00	27			0.00	none	0.00	Blue Shirt	0.00	standard	0.00
285	184	\N	1	none	false	2000.00	2000.00	0.00	27			0.00	none	0.00	Suit	0.00	standard	0.00
286	187	\N	2	none	false	1000.00	500.00	0.00	27			0.00	none	0.00	Blue Shirt	0.00	standard	0.00
287	187	\N	1	none	false	2000.00	2000.00	0.00	27			0.00	none	0.00	Suit	0.00	standard	0.00
288	188	33	1	none	false	1500.00	1200.00	300.00	27	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
289	189	44	1	none	false	1500.00	1200.00	300.00	47	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
290	190	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
291	191	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
292	192	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
293	193	30	1	none	false	1500.00	1200.00	300.00	26	\N	\N	0.00	none	0.00	\N	0.00	standard	0.00
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_number, customer_id, total_amount, status, rack_number, special_instructions, pickup_date, created_at, paid_amount, is_void, updated_at, is_refunded, organization_id, transferred_to_org_id, transfer_status, transferred_at, transfer_rack_number) FROM stdin;
43	251102-001	25	3900.00	in_process	\N		2025-11-03 23:06:00	2025-11-02 00:06:54.110488	2000.01	f	2025-11-02 00:06:54.110488	f	21	\N	at_origin	\N	\N
44	251102-002	25	3900.00	in_process	\N		2025-11-03 23:06:00	2025-11-02 00:47:26.232387	2000.01	f	2025-11-02 00:47:26.232387	f	21	\N	at_origin	\N	\N
7	01-000101	1	12.01	picked_up	\N		2025-10-12 02:17:30.052795	2025-10-09 18:06:38.826512	5.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
45	251102-003	25	3900.00	in_process	\N		2025-11-03 23:06:00	2025-11-02 00:55:14.783048	2000.01	f	2025-11-02 00:55:14.783048	f	21	\N	at_origin	\N	\N
8	01-000102	11	6.01	picked_up	\N		2025-10-12 02:20:13.910155	2025-10-12 02:18:55.241912	2.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
9	01-000103	13	12.01	in_process	\N		\N	2025-10-13 18:48:13.542763	0.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
10	01-000104	1	12.05	in_process	\N		\N	2025-10-13 18:51:03.880475	6.53	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
11	01-000105	13	12.02	in_process	\N		\N	2025-10-13 18:58:21.557181	0.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
12	01-000106	11	12.00	in_process	\N		\N	2025-10-13 19:13:46.227274	8.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
13	01-000107	11	12.00	in_process	\N		\N	2025-10-13 19:13:46.358773	8.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
14	01-000108	1	6.02	in_process	\N		\N	2025-10-14 09:09:26.139263	3.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
15	01-000109	13	6.00	in_process	\N		\N	2025-10-14 09:18:36.441937	3.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
16	01-000110	11	72.00	in_process	\N		\N	2025-10-14 10:22:04.721572	44.37	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
17	01-000111	1	6.00	in_process	\N		\N	2025-10-14 10:41:41.435632	3.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
18	01-000112	13	6.01	in_process	\N		2025-10-16 12:04:00	2025-10-14 12:13:35.082807	3.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
19	251014-001	1	20.00	in_process	\N		\N	2025-10-14 13:45:04.038856	\N	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
20	251014-002	11	12.00	in_process	\N		\N	2025-10-14 14:04:38.045569	\N	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
21	251014-003	13	12.00	in_process	\N		\N	2025-10-14 14:24:57.746218	\N	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
22	251015-001	1	21.00	in_process	\N	Check for a small stain on the collar.	2025-10-20 17:00:00	2025-10-15 08:37:58.916354	10.5	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
46	251102-004	25	3900.00	in_process	\N		2025-11-03 23:06:00	2025-11-02 00:56:12.727441	2000.01	f	2025-11-02 00:56:12.727441	f	21	\N	at_origin	\N	\N
33	251015-007	1	50.00	picked_up	\N		2025-10-15 14:51:37.806751	2025-10-15 10:48:16.257148	20.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
32	251015-006	1	18.00	picked_up	\N		2025-10-15 14:58:30.484716	2025-10-15 10:42:09.857591	10.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
31	251015-005	1	30.00	picked_up	\N		2025-10-16 15:58:25.209186	2025-10-15 10:26:24.556673	10.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
30	251015-004	1	20.00	picked_up	\N		2025-10-16 18:23:18.049876	2025-10-15 10:00:41.069201	20.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
28	251015-002	1	39.00	picked_up	\N	Check for a small stain on the collar.	2025-10-16 19:17:19.207717	2025-10-15 08:49:27.318592	39.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
53	251102-001	28	4500.00	in_process	\N		2025-11-04 00:14:00	2025-11-02 01:24:58.148406	2000.0	f	2025-11-02 01:24:58.148406	f	22	\N	at_origin	\N	\N
54	251102-002	28	8700.00	in_process	\N		2025-11-04 00:28:00	2025-11-02 01:30:15.60662	5000.0	f	2025-11-02 01:30:15.60662	f	22	\N	at_origin	\N	\N
55	251102-003	28	5400.00	in_process	\N		2025-11-04 00:31:00	2025-11-02 01:32:00.478724	2000.0	f	2025-11-02 01:32:00.478724	f	22	\N	at_origin	\N	\N
29	251015-003	1	20.00	picked_up	\N		2025-10-16 19:43:55.495729	2025-10-15 09:43:58.898351	20.0	f	2025-10-27 13:38:44.557628	f	\N	\N	at_origin	\N	\N
39	251022-001	1	20.00	in_process	\N		2025-10-24 06:27:00	2025-10-22 06:28:20.349875	0.0	t	2025-10-27 14:39:08.88828	f	\N	\N	at_origin	\N	\N
38	251021-001	1	24.00	in_process	\N		2025-10-23 16:31:00	2025-10-21 16:31:28.97959	20.0	t	2025-10-27 15:39:28.707125	f	\N	\N	at_origin	\N	\N
37	251017-001	1	66.00	in_process	\N		2025-10-19 10:56:00	2025-10-17 10:56:55.511019	40.0	t	2025-10-27 17:54:27.631822	f	\N	\N	at_origin	\N	\N
35	251016-002	1	15.00	REFUNDED	\N		2025-10-16 19:42:48.710816	2025-10-16 18:21:42.491788	15.0	f	2025-10-27 13:38:44.557628	t	\N	\N	at_origin	\N	\N
34	251016-001	1	54.00	REFUNDED	\N		2025-10-16 19:37:59.589355	2025-10-16 17:29:29.291298	54.0	f	2025-10-27 13:38:44.557628	t	\N	\N	at_origin	\N	\N
36	251016-003	1	20.00	REFUNDED	13		2025-10-18 19:39:00	2025-10-16 19:40:10.879112	10.0	t	2025-10-27 20:38:30.867404	t	\N	\N	at_origin	\N	\N
47	251102-005	25	3900.00	picked_up	5		2025-11-03 20:47:04.468427	2025-11-02 00:56:42.459623	3900.00	f	2025-11-02 00:56:42.459623	f	21	\N	at_origin	\N	\N
49	251102-007	25	1200.00	picked_up	2		2025-11-03 20:58:27.908277	2025-11-02 01:05:16.968305	1200.0	f	2025-11-02 01:05:16.968305	f	21	\N	at_origin	\N	\N
56	251106-001	25	4800.00	in_process	\N		2025-11-08 12:37:00	2025-11-06 13:37:32.303618	2000.0	f	2025-11-06 13:37:32.303618	f	21	\N	at_origin	\N	\N
48	251102-006	24	5400.00	in_process	18	Hello	2025-11-03 23:56:00	2025-11-02 00:57:44.882285	1000.0	f	2025-11-02 00:57:44.882285	f	21	\N	at_origin	\N	\N
59	251111-002	25	39033.00	in_process	\N		2025-11-13 19:07:00	2025-11-11 20:07:49.573215	0.0	f	2025-11-11 20:07:49.573215	f	21	\N	at_origin	\N	\N
60	251111-003	25	39033.00	in_process	\N		2025-11-13 19:37:00	2025-11-11 20:37:50.14235	0.0	f	2025-11-11 20:37:50.14235	f	21	\N	at_origin	\N	\N
61	251114-001	25	16211.00	in_process	\N		2025-11-16 18:58:00	2025-11-14 20:11:25.678873	13000.0	f	2025-11-14 20:11:25.678873	f	21	\N	at_origin	\N	\N
62	251114-002	25	16211.00	in_process	\N		2025-11-16 20:36:00	2025-11-14 21:36:42.732245	0.0	f	2025-11-14 21:36:42.732245	f	21	\N	at_origin	\N	\N
57	251106-002	25	7500.00	ready_for_pickup	3		2025-11-08 13:04:00	2025-11-06 14:05:11.177195	1110.0	f	2025-11-06 14:05:11.177195	f	21	\N	at_origin	\N	\N
58	251111-001	25	39033.00	ready_for_pickup	4		2025-11-13 18:57:00	2025-11-11 20:07:32.246192	1000.0	f	2025-11-11 20:07:32.246192	f	21	\N	at_origin	\N	\N
63	251125-001	24	14211.00	in_process	\N		2025-11-27 11:29:00	2025-11-25 12:40:35.361109	0.0	f	2025-11-25 12:40:35.361109	f	21	\N	at_origin	\N	\N
69	251127-001	24	15311.00	picked_up	10		2025-11-28 19:02:03.7629	2025-11-27 03:20:40.621555	15311.00	f	2025-11-27 03:20:40.621555	f	21	\N	at_origin	\N	\N
64	251125-002	24	14211.00	picked_up	7		2025-11-25 15:53:45.053866	2025-11-25 14:39:30.842616	14211.0	f	2025-11-25 14:39:30.842616	f	21	\N	at_origin	\N	\N
65	251126-001	24	14211.00	in_process	\N		2025-11-28 08:04:00	2025-11-26 09:14:55.404082	0.0	f	2025-11-26 09:14:55.404082	f	21	\N	at_origin	\N	\N
66	251126-002	24	14211.00	picked_up	6		2025-11-26 10:24:59.316379	2025-11-26 09:15:52.407818	14211.0	f	2025-11-26 09:15:52.407818	f	21	\N	at_origin	\N	\N
72	251203-001	35	14211.00	in_process	\N		2025-12-05 05:58:00	2025-12-03 06:58:53.977932	0.0	f	2025-12-03 06:58:53.977932	f	21	\N	at_origin	\N	\N
67	251126-003	24	15011.00	picked_up	20		2025-11-26 10:28:09.209491	2025-11-26 09:26:54.221321	15011.0	f	2025-11-26 09:26:54.221321	f	21	\N	at_origin	\N	\N
73	251203-002	24	14211.00	in_process	\N		2025-12-05 06:33:00	2025-12-03 07:33:34.825833	0.0	f	2025-12-03 07:33:34.825833	f	21	\N	at_origin	\N	\N
70	251128-001	32	214211.00	picked_up	20		2025-11-28 18:57:47.880984	2025-11-28 17:55:13.708135	214211.00	f	2025-11-28 17:55:13.708135	f	21	\N	at_origin	\N	\N
74	251203-003	24	14211.00	in_process	\N		2025-12-05 06:45:00	2025-12-03 07:45:42.774377	0.0	f	2025-12-03 07:45:42.774377	f	21	\N	at_origin	\N	\N
82	251203-010	39	1500.00	received	\N		2025-12-05 15:48:00	2025-12-03 16:53:58.242025	0.0	f	2025-12-03 16:53:58.242025	f	26	\N	at_origin	\N	\N
75	251203-004	24	15011.00	picked_up	6		2025-12-04 19:06:09.62378	2025-12-03 08:08:06.113696	16954.92	f	2025-12-03 08:08:06.113696	f	21	\N	at_origin	\N	\N
87	251205-001	24	15411.00	received	\N		2025-12-07 14:01:00	2025-12-05 15:03:13.992027	0.0	f	2025-12-05 15:03:13.992027	f	21	\N	at_origin	\N	\N
86	251204-001	35	13011.00	picked_up	20		2025-12-04 19:58:32.166283	2025-12-04 18:57:28.261755	14695.92	f	2025-12-04 18:57:28.261755	f	21	\N	at_origin	\N	\N
88	251205-002	36	1200.00	received	\N		2025-12-07 14:16:00	2025-12-05 15:17:11.056507	0.0	f	2025-12-05 15:17:11.056507	f	21	\N	at_origin	\N	\N
89	251205-003	24	13011.00	received	\N		2025-12-07 17:27:00	2025-12-05 18:27:18.831438	0.0	f	2025-12-05 18:27:18.831438	f	21	\N	at_origin	\N	\N
90	251205-004	32	14211.00	received	\N		2025-12-07 17:30:00	2025-12-05 18:31:04.513538	0.0	f	2025-12-05 18:31:04.513538	f	21	\N	at_origin	\N	\N
76	251203-005	39	2700.00	ready	\N	DO not try that	2025-12-05 07:26:00	2025-12-03 08:27:21.106467	1000.0	f	2026-01-16 07:55:02.549539	f	26	27	completed	\N	13
81	251203-009	39	2700.00	transfer_requested	\N		2025-12-05 15:48:00	2025-12-03 16:48:20.383017	0.0	f	2026-01-20 14:59:02.259711	f	26	27	requested	\N	\N
78	251203-007	39	2700.00	transfer_requested	\N		2025-12-05 07:29:00	2025-12-03 08:30:38.943878	0.0	f	2026-01-20 14:59:02.259711	f	26	27	requested	\N	\N
83	251203-011	39	1500.00	ready	\N		2025-12-05 15:54:00	2025-12-03 16:56:16.144532	0.0	f	2026-01-20 15:14:11.452701	f	26	27	completed	\N	9
91	251205-005	24	14211.00	received	\N		2025-12-07 17:33:00	2025-12-05 18:33:30.988721	0.0	f	2025-12-05 18:33:30.988721	f	21	\N	at_origin	\N	\N
92	251205-006	24	15011.00	received	\N		2025-12-07 17:39:00	2025-12-05 18:39:47.306618	0.0	f	2025-12-05 18:39:47.306618	f	21	\N	at_origin	\N	\N
93	251208-001	24	14211.00	received	\N		2025-12-10 00:38:00	2025-12-08 01:39:09.153038	0.0	f	2025-12-08 01:39:09.153038	f	21	\N	at_origin	\N	\N
94	251208-002	24	14211.00	received	\N		2025-12-10 00:50:00	2025-12-08 01:50:46.269583	0.0	f	2025-12-08 01:50:46.269583	f	21	\N	at_origin	\N	\N
97	251210-001	42	10500.00	received	\N		2025-12-12 10:57:00	2025-12-10 11:58:32.777697	0.0	f	2025-12-10 11:58:32.777697	f	11	\N	at_origin	\N	\N
132	251219-013	47	430.00	received	\N		2025-12-21 16:46:00	2025-12-19 17:46:53.102135	0.0	f	2025-12-19 17:46:53.102135	f	11	\N	at_origin	\N	\N
133	251219-014	47	465.00	voided	\N		2025-12-21 16:48:00	2025-12-19 17:48:38.291607	0.0	t	2025-12-19 20:56:32.192172	f	11	\N	at_origin	\N	\N
134	251222-001	47	10970.00	received	\N		2025-12-24 07:52:00	2025-12-22 08:53:11.738096	0.0	f	2025-12-22 08:53:11.738096	f	11	\N	at_origin	\N	\N
135	251223-001	42	10610.00	received	\N		2025-12-25 06:53:00	2025-12-23 07:54:08.247991	5000.0	f	2025-12-23 07:54:08.247991	f	11	\N	at_origin	\N	\N
136	251223-002	47	10610.00	received	\N		2025-12-25 08:29:00	2025-12-23 09:29:51.438587	0.0	f	2025-12-23 09:29:51.438587	f	11	\N	at_origin	\N	\N
96	251208-004	24	16211.00	voided	\N		2025-12-10 18:31:00	2025-12-08 19:31:18.010546	0.0	t	2025-12-11 09:14:44.242476	f	21	\N	at_origin	\N	\N
137	251223-003	47	10610.00	received	\N		2025-12-25 08:29:00	2025-12-23 09:30:10.277717	5000.0	f	2025-12-23 09:30:10.277717	f	11	\N	at_origin	\N	\N
138	251223-004	47	10610.00	received	\N		2025-12-25 16:15:00	2025-12-23 17:15:47.448282	0.0	f	2025-12-23 17:15:47.448282	f	11	\N	at_origin	\N	\N
139	251223-005	42	10610.00	received	\N		2025-12-25 16:20:00	2025-12-23 17:20:37.341031	0.0	f	2025-12-23 17:20:37.341031	f	11	\N	at_origin	\N	\N
140	251223-006	47	10610.00	received	\N		2025-12-25 17:08:00	2025-12-23 18:09:01.654667	0.0	f	2025-12-23 18:09:01.654667	f	11	\N	at_origin	\N	\N
141	251223-007	47	110.00	received	\N		2025-12-25 17:21:00	2025-12-23 18:21:29.060517	0.0	f	2025-12-23 18:21:29.060517	f	11	\N	at_origin	\N	\N
142	251224-001	47	2000.00	received	\N		2025-12-25 22:27:00	2025-12-23 23:28:05.510133	0.0	f	2025-12-23 23:28:05.510133	f	11	\N	at_origin	\N	\N
143	251224-002	47	1000.00	received	\N		2025-12-25 22:28:00	2025-12-23 23:33:27.475122	0.0	f	2025-12-23 23:33:27.475122	f	11	\N	at_origin	\N	\N
144	251224-003	18	2500.00	received	\N		2025-12-25 22:33:00	2025-12-23 23:43:40.693085	0.0	f	2025-12-23 23:43:40.693085	f	11	\N	at_origin	\N	\N
145	251224-001	24	1500.00	received	\N		2025-12-25 22:51:00	2025-12-23 23:51:22.649071	0.0	f	2025-12-23 23:51:22.649071	f	21	\N	at_origin	\N	\N
95	251208-003	24	16211.00	refunded	\N		2025-12-10 18:29:00	2025-12-08 19:29:28.120294	0.0	f	2025-12-11 09:34:47.92824	t	21	\N	at_origin	\N	\N
98	251211-001	18	10500.00	received	\N		2025-12-13 11:09:00	2025-12-11 12:09:43.505234	0.0	f	2025-12-11 12:09:43.505234	f	11	\N	at_origin	\N	\N
146	251224-002	24	14211.00	picked_up	25		2025-12-24 22:02:12.026445	2025-12-24 21:01:33.190867	16051.32	f	2025-12-24 21:01:33.190867	f	21	\N	at_origin	\N	\N
147	251225-001	85	2700.00	picked_up	14		2025-12-25 00:24:04.739239	2025-12-24 23:23:17.879103	3049.65	f	2025-12-24 23:23:17.879103	f	27	\N	at_origin	\N	\N
99	251211-001	74	2700.00	picked_up	10		2025-12-11 22:46:15.238887	2025-12-11 21:39:30.453003	3049.65	f	2025-12-11 21:42:52.647853	f	28	\N	at_origin	\N	\N
100	251211-002	74	2700.00	received	\N		2025-12-13 20:53:00	2025-12-11 21:53:24.191404	0.0	f	2025-12-11 21:53:24.191404	f	28	\N	at_origin	\N	\N
101	251211-003	74	2700.00	received	\N		2025-12-13 20:59:00	2025-12-11 21:59:29.892724	0.0	f	2025-12-11 21:59:29.892724	f	28	\N	at_origin	\N	\N
102	251211-004	74	5400.00	received	\N		2025-12-13 21:16:00	2025-12-11 22:17:09.647672	0.0	f	2025-12-11 22:17:09.647672	f	28	\N	at_origin	\N	\N
103	251215-001	32	114211.00	received	\N		2025-12-17 06:49:00	2025-12-15 07:58:47.863039	0.0	f	2025-12-15 07:58:47.863039	f	21	\N	at_origin	\N	\N
104	251215-002	24	16211.00	received	\N		2025-12-17 10:55:00	2025-12-15 11:55:49.622212	0.0	f	2025-12-15 11:55:49.622212	f	21	\N	at_origin	\N	\N
105	251215-003	24	14011.00	received	\N		2025-12-17 11:53:00	2025-12-15 12:54:07.994976	0.0	f	2025-12-15 12:54:07.994976	f	21	\N	at_origin	\N	\N
106	251215-004	24	20211.00	received	\N		2025-12-17 15:34:00	2025-12-15 16:35:05.005114	0.0	f	2025-12-15 16:35:05.005114	f	21	\N	at_origin	\N	\N
107	251215-005	24	20211.00	received	\N		2025-12-17 15:34:00	2025-12-15 16:40:07.700793	0.0	f	2025-12-15 16:40:07.700793	f	21	\N	at_origin	\N	\N
108	251215-006	24	26211.00	received	\N		2025-12-17 15:53:00	2025-12-15 16:54:07.795925	0.0	f	2025-12-15 16:54:07.795925	f	21	\N	at_origin	\N	\N
110	251218-001	24	1000.00	received	\N		2025-12-20 07:45:00	2025-12-18 08:45:40.51662	0.0	f	2025-12-18 08:45:40.51662	f	21	\N	at_origin	\N	\N
111	251218-002	24	1000.00	received	\N		2025-12-20 08:06:00	2025-12-18 09:07:12.538873	0.0	f	2025-12-18 09:07:12.538873	f	21	\N	at_origin	\N	\N
112	251218-003	24	1000.00	received	\N		2025-12-20 08:11:00	2025-12-18 09:11:37.506093	0.0	f	2025-12-18 09:11:37.506093	f	21	\N	at_origin	\N	\N
113	251218-004	24	1000.00	received	\N		2025-12-20 08:11:00	2025-12-18 09:11:57.634493	0.0	f	2025-12-18 09:11:57.634493	f	21	\N	at_origin	\N	\N
114	251218-005	24	2200.00	received	\N		2025-12-20 08:15:00	2025-12-18 09:16:30.268534	0.0	f	2025-12-18 09:16:30.268534	f	21	\N	at_origin	\N	\N
115	251218-006	32	2200.00	received	\N		2025-12-20 13:29:00	2025-12-18 14:30:12.608486	0.0	f	2025-12-18 14:30:12.608486	f	21	\N	at_origin	\N	\N
116	251218-001	74	1700.00	received	\N		2025-12-20 14:57:00	2025-12-18 16:06:29.395653	0.0	f	2025-12-18 16:06:29.395653	f	28	\N	at_origin	\N	\N
117	251218-007	24	14512.00	received	\N		2025-12-20 16:48:00	2025-12-18 17:48:26.612989	0.0	f	2025-12-18 17:48:26.612989	f	21	\N	at_origin	\N	\N
118	251218-001	47	11410.00	received	\N		2025-12-20 18:58:00	2025-12-18 20:00:01.775177	0.0	f	2025-12-18 20:00:01.775177	f	11	\N	at_origin	\N	\N
119	251218-002	47	1310.00	received	\N		2025-12-20 19:00:00	2025-12-18 20:06:57.35668	0.0	f	2025-12-18 20:06:57.35668	f	11	\N	at_origin	\N	\N
120	251219-001	47	220.00	received	\N		2025-12-21 08:33:00	2025-12-19 09:47:26.576383	0.0	f	2025-12-19 09:47:26.576383	f	11	\N	at_origin	\N	\N
121	251219-002	42	115.00	received	\N		2025-12-21 09:21:00	2025-12-19 10:21:59.250535	0.0	f	2025-12-19 10:21:59.250535	f	11	\N	at_origin	\N	\N
122	251219-003	47	130.00	received	\N		2025-12-21 09:22:00	2025-12-19 10:22:39.501842	0.0	f	2025-12-19 10:22:39.501842	f	11	\N	at_origin	\N	\N
123	251219-004	18	420.00	received	\N		2025-12-21 09:28:00	2025-12-19 10:29:26.084732	0.0	f	2025-12-19 10:29:26.084732	f	11	\N	at_origin	\N	\N
124	251219-005	47	330.00	received	\N		2025-12-21 09:29:00	2025-12-19 10:30:09.942301	0.0	f	2025-12-19 10:30:09.942301	f	11	\N	at_origin	\N	\N
125	251219-006	42	370.00	received	\N		2025-12-21 14:30:00	2025-12-19 15:30:54.466947	0.0	f	2025-12-19 15:30:54.466947	f	11	\N	at_origin	\N	\N
126	251219-007	47	420.00	received	\N		2025-12-21 15:00:00	2025-12-19 16:00:33.842594	0.0	f	2025-12-19 16:00:33.842594	f	11	\N	at_origin	\N	\N
127	251219-008	47	550.00	received	\N		2025-12-21 16:01:00	2025-12-19 17:03:00.483646	0.0	f	2025-12-19 17:03:00.483646	f	11	\N	at_origin	\N	\N
128	251219-009	47	330.00	received	\N		2025-12-21 16:12:00	2025-12-19 17:12:53.307983	0.0	f	2025-12-19 17:12:53.307983	f	11	\N	at_origin	\N	\N
129	251219-010	47	410.00	received	\N		2025-12-21 16:18:00	2025-12-19 17:18:48.160562	0.0	f	2025-12-19 17:18:48.160562	f	11	\N	at_origin	\N	\N
130	251219-011	47	700.00	received	\N		2025-12-21 16:31:00	2025-12-19 17:31:42.441296	0.0	f	2025-12-19 17:31:42.441296	f	11	\N	at_origin	\N	\N
131	251219-012	47	1310.00	received	\N		2025-12-21 16:41:00	2025-12-19 17:42:32.597957	0.0	f	2025-12-19 17:42:32.597957	f	11	\N	at_origin	\N	\N
148	T-1001	5	1300.00	received	A1	Imported Ticket	2023-12-25 11:00:00	2023-12-20 11:00:00	1000.0	f	2025-12-25 00:31:20.59799	f	27	\N	at_origin	\N	\N
149	T-1002	8	2000.00	received	B5	Imported Ticket	2024-01-01 11:00:00	2025-12-25 00:31:20.686478	0.0	f	2025-12-25 00:31:20.59799	f	27	\N	at_origin	\N	\N
157	251231-001	24	14211.00	received	\N		2026-01-02 00:17:00	2025-12-31 01:18:08.07172	16051.324499999999	f	2025-12-31 01:18:08.073943	f	21	\N	at_origin	\N	\N
158	251231-002	24	3967.00	received	\N		2026-01-02 00:18:00	2025-12-31 01:21:27.050198	4480.7265	f	2025-12-31 01:21:27.050624	f	21	\N	at_origin	\N	\N
159	251231-001	83	2700.00	received	\N		2026-01-02 07:29:00	2025-12-31 08:30:11.429788	0.0	f	2025-12-31 08:30:11.433072	f	27	\N	at_origin	\N	\N
161	251231-003	83	2700.00	received	\N		2026-01-02 07:29:00	2025-12-31 08:36:01.023995	0.0	f	2025-12-31 08:36:01.05917	f	27	\N	at_origin	\N	\N
162	251231-004	83	2700.00	received	\N		2026-01-02 07:29:00	2025-12-31 08:36:56.679763	0.0	f	2025-12-31 08:36:56.722902	f	27	\N	at_origin	\N	\N
156	251230-007	39	2700.00	completed	\N		2026-01-01 12:02:00	2025-12-30 13:02:46.399591	0.0	f	2026-01-16 07:53:37.863733	f	26	27	completed	\N	8
150	251230-001	39	2700.00	completed	\N		2026-01-01 07:30:00	2025-12-30 08:31:12.28349	0.0	f	2026-01-16 07:54:17.565276	f	26	27	completed	\N	7
151	251230-002	39	2700.00	completed	\N		2026-01-01 07:44:00	2025-12-30 08:44:28.900755	0.0	f	2026-01-16 07:43:32.632322	f	26	27	completed	\N	6
163	251231-005	83	2700.00	received	\N		2026-01-02 07:29:00	2025-12-31 08:41:21.427615	0.0	f	2025-12-31 08:41:21.486881	f	27	\N	at_origin	\N	\N
165	251231-007	83	2700.00	received	\N		2026-01-02 07:29:00	2025-12-31 08:43:22.101359	0.0	f	2025-12-31 08:43:22.164994	f	27	\N	at_origin	\N	\N
166	251231-008	83	1500.00	received	\N		2026-01-02 07:56:00	2025-12-31 08:56:35.084881	0.0	f	2025-12-31 08:56:35.085958	f	27	\N	at_origin	\N	\N
168	251231-010	83	2700.00	received	\N		2026-01-02 08:18:00	2025-12-31 09:18:19.124907	0.0	f	2025-12-31 09:18:19.127012	f	27	\N	at_origin	\N	\N
175	251231-017	83	1500.00	picked_up	14		2025-12-31 11:22:55.687249	2025-12-31 09:58:59.674788	1694.25	f	2025-12-31 09:58:59.674714	f	27	\N	at_origin	\N	\N
174	251231-016	83	2700.00	picked_up	16		2025-12-31 11:26:34.5569	2025-12-31 09:56:42.856058	3049.65	f	2025-12-31 09:56:42.857679	f	27	\N	at_origin	\N	\N
173	251231-015	83	1500.00	picked_up	16		2025-12-31 11:30:06.760428	2025-12-31 09:54:19.910213	1694.25	f	2025-12-31 09:54:19.912771	f	27	\N	at_origin	\N	\N
80	251203-008	39	2700.00	transfer_requested	\N		2025-12-05 07:29:00	2025-12-03 08:49:53.423545	0.0	f	2026-01-20 14:59:02.259711	f	26	27	at_origin	\N	\N
153	251230-004	39	2700.00	processing	\N		2026-01-01 08:02:00	2025-12-30 09:02:37.473513	0.0	f	2026-01-14 13:39:42.671182	f	26	27	ready_at_plant	\N	\N
167	251231-009	83	2700.00	ready_for_pickup	16		2026-01-02 07:56:00	2025-12-31 09:16:43.692982	0.0	f	2025-12-31 09:16:43.695072	f	27	\N	at_origin	\N	\N
164	251231-006	83	2700.00	ready_for_pickup	17		2026-01-02 07:29:00	2025-12-31 08:41:30.795612	0.0	f	2025-12-31 08:41:30.795517	f	27	\N	at_origin	\N	\N
152	251230-003	39	2700.00	processing	\N		2026-01-01 07:48:00	2025-12-30 08:48:15.562494	0.0	f	2026-01-14 13:39:42.671182	f	26	27	ready_at_plant	\N	\N
177	251231-019	83	2700.00	received	\N		2026-01-02 10:53:00	2025-12-31 11:53:44.497396	0.0	f	2025-12-31 11:53:44.501261	f	27	\N	at_origin	\N	\N
176	251231-018	83	1200.00	picked_up	14		2025-12-31 12:54:10.249784	2025-12-31 11:17:49.78346	1355.4	f	2025-12-31 11:17:49.785578	f	27	\N	at_origin	\N	\N
169	251231-011	83	2700.00	picked_up	18		2025-12-31 12:58:14.309897	2025-12-31 09:20:55.592155	3049.65	f	2025-12-31 09:20:55.592691	f	27	\N	at_origin	\N	\N
160	251231-002	83	2700.00	picked_up	14		2025-12-31 13:06:16.741672	2025-12-31 08:33:54.873123	3049.65	f	2025-12-31 08:33:54.939984	f	27	\N	at_origin	\N	\N
180	T-1003	83	1000.00	received	A1	12/20/2023	2026-01-05 10:48:25.069	2026-01-05 10:48:25.394555	1000.0	f	2026-01-05 10:48:25.396965	f	27	\N	at_origin	\N	\N
181	T-1004	83	2000.00	received	B5	Imported via CSV	2026-01-05 10:48:25.069	2026-01-05 10:48:25.394555	0.0	f	2026-01-05 10:48:25.396965	f	27	\N	at_origin	\N	\N
182	T-1005	83	3000.00	picked_up	18	12/20/2023	2026-01-05 11:53:06.256127	2026-01-05 10:52:06.027001	3388.5	f	2026-01-05 10:52:06.069924	f	27	\N	at_origin	\N	\N
184	T-1006	83	3000.00	received	A1	12/20/2023	2026-01-05 10:54:17.587	2026-01-05 10:54:17.924688	1000.0	f	2026-01-05 10:54:17.925175	f	27	\N	at_origin	\N	\N
187	T-1007	85	3000.00	received	A1	12/20/2023	2026-01-05 11:15:17.269	2026-01-05 11:15:17.27709	1000.0	f	2026-01-05 11:15:17.276756	f	27	\N	at_origin	\N	\N
189	260112-001	87	1500.00	received	\N		2026-01-14 11:05:00	2026-01-12 12:05:54.276781	0.0	f	2026-01-12 12:05:54.279373	f	47	\N	at_origin	\N	\N
172	251231-014	83	1500.00	ready	15		2025-12-31 11:31:15.540504	2025-12-31 09:36:25.999146	1694.25	f	2026-01-16 08:03:04.984723	f	27	26	completed	\N	10
84	251203-012	39	1500.00	ready	11		2025-12-05 15:59:00	2025-12-03 16:59:55.95022	0.0	f	2026-01-19 00:30:57.51996	f	26	27	completed	\N	23
191	260120-001	39	1500.00	processing	\N		2026-01-22 07:24:00	2026-01-20 08:24:51.601675	0.0	f	2026-01-20 15:11:36.879869	f	26	27	at_plant	\N	\N
171	251231-013	83	1500.00	ready	15		2025-12-31 11:32:25.874745	2025-12-31 09:30:47.781671	1694.25	f	2026-01-16 03:49:05.561601	f	27	26	ready_at_branch	\N	6
77	251203-006	39	2700.00	completed	\N		2025-12-05 07:29:00	2025-12-03 08:29:44.900662	0.0	f	2026-01-16 07:33:30.68956	f	26	27	completed	\N	15
85	251203-013	39	1200.00	completed	\N		2025-12-05 16:01:00	2025-12-03 17:01:29.327733	0.0	f	2026-01-16 07:36:32.792266	f	26	27	completed	\N	20
155	251230-006	39	1200.00	completed	\N		2026-01-01 08:03:00	2025-12-30 09:04:14.352015	0.0	f	2026-01-16 07:43:30.140467	f	26	27	ready_at_plant	\N	10
154	251230-005	39	1500.00	completed	\N		2026-01-01 08:02:00	2025-12-30 09:03:40.537461	0.0	f	2026-01-16 07:43:35.705739	f	26	27	read_at_plant	\N	11
170	251231-012	83	1500.00	transfer_requested	\N		2026-01-02 08:28:00	2025-12-31 09:28:26.296041	0.0	f	2026-01-15 22:02:12.401123	f	27	26	ready_at_plant	\N	\N
192	260120-002	39	1500.00	ready	\N		2026-01-22 14:00:00	2026-01-20 15:00:12.015905	0.0	f	2026-01-20 15:14:04.530148	f	26	27	completed	\N	18
193	260120-003	39	1500.00	ready	\N		2026-01-22 14:00:00	2026-01-20 15:00:27.312073	0.0	f	2026-01-20 15:14:07.908215	f	26	27	completed	\N	25
188	260107-001	83	1500.00	transfer_requested	15		2026-01-07 11:34:29.238141	2026-01-07 10:24:52.260522	1694.25	f	2026-01-15 22:02:12.401123	f	27	26	ready_at_plant	\N	\N
190	260114-001	39	1500.00	picked_up	20		2026-01-20 03:03:41.774353	2026-01-14 14:10:46.825725	1694.25	f	2026-01-15 12:10:54.545799	f	26	27	ready_at_plant	\N	14
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, email, role, created_at) FROM stdin;
6	coueteous24	e0faaef9798c413427fe40b6fa258775967fb1a0543a8d00548a0aa5cb1aaf03	courteous28@yahoo.com	admin	2025-10-17 20:01:19.658758
7	courteousttttt	e0faaef9798c413427fe40b6fa258775967fb1a0543a8d00548a0aa5cb1aaf03	courteous33@yahoo.com	user	2025-10-23 19:40:14.140729
21	admin	1bcb60c6339294952e038214183809f64df17c72810fbd0f83d14c92b83c1ec3	admin@email.com	admin	2025-10-25 09:32:28.04427
2	courteous	1bcb60c6339294952e038214183809f64df17c72810fbd0f83d14c92b83c1ec3	courteous@yahoo.com	cashier	2025-10-11 23:07:18.603626
5	courtesous3	d1650cb817ea18d265ffd099d76e6f0cb33f6e9b5b50629233cef81add812252	courteous2@yahoo.com	store_owner	2025-10-17 09:39:39.309832
\.


--
-- Name: allusers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.allusers_id_seq', 90, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 157, true);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 1, true);


--
-- Name: clothing_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clothing_types_id_seq', 50, true);


--
-- Name: customer_coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_coupons_id_seq', 1, false);


--
-- Name: customer_payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_payment_methods_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 13, true);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_id_seq', 51, true);


--
-- Name: pickup_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pickup_requests_id_seq', 1, false);


--
-- Name: platform_admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.platform_admins_id_seq', 2, true);


--
-- Name: racks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.racks_id_seq', 17001, true);


--
-- Name: ticket_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_feedback_id_seq', 1, false);


--
-- Name: ticket_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_items_id_seq', 293, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 193, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 21, true);


--
-- Name: allusers allusers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allusers
    ADD CONSTRAINT allusers_email_key UNIQUE (email);


--
-- Name: allusers allusers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allusers
    ADD CONSTRAINT allusers_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branch_payment_methods branch_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_payment_methods
    ADD CONSTRAINT branch_payment_methods_pkey PRIMARY KEY (branch_id, payment_method);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: clothing_types clothing_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clothing_types
    ADD CONSTRAINT clothing_types_pkey PRIMARY KEY (id);


--
-- Name: customer_coupons customer_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_coupons
    ADD CONSTRAINT customer_coupons_pkey PRIMARY KEY (id);


--
-- Name: customer_payment_methods customer_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_payment_methods
    ADD CONSTRAINT customer_payment_methods_pkey PRIMARY KEY (id);


--
-- Name: customers customers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_key UNIQUE (phone);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: organization_settings organization_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT organization_settings_pkey PRIMARY KEY (organization_id);


--
-- Name: organizations organizations_connection_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_connection_code_key UNIQUE (connection_code);


--
-- Name: organizations organizations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_key UNIQUE (name);


--
-- Name: organizations organizations_owner_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_owner_email_key UNIQUE (owner_email);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: pickup_requests pickup_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_requests
    ADD CONSTRAINT pickup_requests_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_email_key UNIQUE (email);


--
-- Name: platform_admins platform_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_uuid_key UNIQUE (uuid);


--
-- Name: racks racks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.racks
    ADD CONSTRAINT racks_pkey PRIMARY KEY (id);


--
-- Name: racks racks_unique_per_org; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.racks
    ADD CONSTRAINT racks_unique_per_org UNIQUE (organization_id, number);


--
-- Name: tag_configurations tag_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag_configurations
    ADD CONSTRAINT tag_configurations_pkey PRIMARY KEY (organization_id);


--
-- Name: ticket_feedback ticket_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_feedback
    ADD CONSTRAINT ticket_feedback_pkey PRIMARY KEY (id);


--
-- Name: ticket_items ticket_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_items
    ADD CONSTRAINT ticket_items_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_org_id_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_org_id_ticket_number_key UNIQUE (organization_id, ticket_number);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets uq_ticket_number_org_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT uq_ticket_number_org_id UNIQUE (ticket_number, organization_id);


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
-- Name: idx_audit_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_org ON public.audit_logs USING btree (organization_id);


--
-- Name: idx_ticket_items_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_items_org_id ON public.ticket_items USING btree (organization_id);


--
-- Name: idx_tickets_transfer_rack; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_transfer_rack ON public.tickets USING btree (transfer_rack_number);


--
-- Name: idx_tickets_transfer_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_transfer_to ON public.tickets USING btree (transferred_to_org_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: allusers allusers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allusers
    ADD CONSTRAINT allusers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: branch_payment_methods branch_payment_methods_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_payment_methods
    ADD CONSTRAINT branch_payment_methods_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: customer_coupons customer_coupons_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_coupons
    ADD CONSTRAINT customer_coupons_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.allusers(id);


--
-- Name: customer_payment_methods customer_payment_methods_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_payment_methods
    ADD CONSTRAINT customer_payment_methods_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.allusers(id);


--
-- Name: racks fk_racks_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.racks
    ADD CONSTRAINT fk_racks_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: clothing_types fk_racks_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clothing_types
    ADD CONSTRAINT fk_racks_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ticket_items fk_ticket_items_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_items
    ADD CONSTRAINT fk_ticket_items_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: tickets fk_tickets_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_parent_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_parent_org_id_fkey FOREIGN KEY (parent_org_id) REFERENCES public.organizations(id);


--
-- Name: pickup_requests pickup_requests_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_requests
    ADD CONSTRAINT pickup_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.allusers(id);


--
-- Name: racks racks_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.racks
    ADD CONSTRAINT racks_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: ticket_feedback ticket_feedback_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_feedback
    ADD CONSTRAINT ticket_feedback_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.allusers(id);


--
-- Name: ticket_items ticket_items_clothing_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_items
    ADD CONSTRAINT ticket_items_clothing_type_id_fkey FOREIGN KEY (clothing_type_id) REFERENCES public.clothing_types(id);


--
-- Name: ticket_items ticket_items_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_items
    ADD CONSTRAINT ticket_items_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: tickets tickets_transferred_to_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_transferred_to_org_id_fkey FOREIGN KEY (transferred_to_org_id) REFERENCES public.organizations(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dlfSxUXzYvRGhYZrEoiM3ZQbTUbmBlmP5iwVqpRpqUhF3dcfOW67yY6f2Rffdnt

