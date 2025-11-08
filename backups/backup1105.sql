--
-- PostgreSQL database dump
--

\restrict SQGdVfA7ywHHPzHmOvjOfFvwZNH9kc7doEd7c7zF8lUgzPTBwTYiIv1JW1Invj9

-- Dumped from database version 13.22
-- Dumped by pg_dump version 13.22

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
-- Name: audit; Type: SCHEMA; Schema: -; Owner: finapp_user
--

CREATE SCHEMA audit;


ALTER SCHEMA audit OWNER TO finapp_user;

--
-- Name: finapp; Type: SCHEMA; Schema: -; Owner: finapp_user
--

CREATE SCHEMA finapp;


ALTER SCHEMA finapp OWNER TO finapp_user;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: caojun
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO caojun;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE finapp._prisma_migrations OWNER TO finapp_user;

--
-- Name: asset_prices; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.asset_prices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    asset_id uuid NOT NULL,
    price_date date NOT NULL,
    open_price numeric(20,8),
    high_price numeric(20,8),
    low_price numeric(20,8),
    close_price numeric(20,8) NOT NULL,
    volume bigint,
    adjusted_close numeric(20,8),
    currency character varying(3) NOT NULL,
    data_source character varying(50),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.asset_prices OWNER TO finapp_user;

--
-- Name: asset_types; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.asset_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.asset_types OWNER TO finapp_user;

--
-- Name: assets; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.assets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    symbol character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    asset_type_id uuid NOT NULL,
    market_id uuid,
    currency character varying(3) NOT NULL,
    isin character varying(12),
    cusip character varying(9),
    sector character varying(100),
    industry character varying(100),
    description text,
    metadata jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    risk_level character varying(20) DEFAULT 'MEDIUM'::character varying,
    lot_size integer DEFAULT 1,
    tick_size numeric(10,6) DEFAULT 0.01,
    listing_date date,
    delisting_date date,
    tags text[],
    created_by uuid,
    updated_by uuid,
    liquidity_tag uuid
);


ALTER TABLE finapp.assets OWNER TO finapp_user;

--
-- Name: audit_logs; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    table_name character varying(100) NOT NULL,
    record_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    ip_address inet,
    user_agent text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.audit_logs OWNER TO finapp_user;

--
-- Name: benchmark_prices; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.benchmark_prices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    benchmark_id uuid NOT NULL,
    price_date date NOT NULL,
    price numeric(20,8) NOT NULL,
    currency character varying(3) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.benchmark_prices OWNER TO finapp_user;

--
-- Name: benchmarks; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.benchmarks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(20) NOT NULL,
    description text,
    asset_class character varying(50),
    currency character varying(3) NOT NULL,
    data_source character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.benchmarks OWNER TO finapp_user;

--
-- Name: bond_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.bond_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    bond_type character varying(50) NOT NULL,
    credit_rating character varying(10),
    face_value numeric(20,2) NOT NULL,
    coupon_rate numeric(5,2) NOT NULL,
    coupon_frequency character varying(20),
    issue_date date NOT NULL,
    maturity_date date NOT NULL,
    years_to_maturity numeric(5,2),
    yield_to_maturity numeric(5,2),
    current_yield numeric(5,2),
    issuer character varying(200),
    issue_price numeric(20,2),
    issue_size numeric(20,2),
    callable boolean DEFAULT false,
    call_date date,
    call_price numeric(20,2),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.bond_details OWNER TO finapp_user;

--
-- Name: cash_flows; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.cash_flows (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    trading_account_id uuid,
    asset_id uuid,
    flow_type character varying(20) NOT NULL,
    amount numeric(20,8) NOT NULL,
    currency character varying(3) NOT NULL,
    flow_date date NOT NULL,
    description text,
    transaction_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    date timestamp(6) with time zone,
    category character varying(50)
);


ALTER TABLE finapp.cash_flows OWNER TO finapp_user;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.email_verification_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    verified_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.email_verification_tokens OWNER TO finapp_user;

--
-- Name: exchange_rates; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.exchange_rates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    from_currency character varying(3) NOT NULL,
    to_currency character varying(3) NOT NULL,
    rate_date date NOT NULL,
    rate numeric(20,8) NOT NULL,
    data_source character varying(50),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.exchange_rates OWNER TO finapp_user;

--
-- Name: fund_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.fund_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    fund_type character varying(50) NOT NULL,
    fund_category character varying(50),
    management_fee numeric(5,2),
    custodian_fee numeric(5,2),
    subscription_fee numeric(5,2),
    redemption_fee numeric(5,2),
    nav numeric(20,4),
    nav_date date,
    accumulated_nav numeric(20,4),
    fund_size numeric(20,2),
    inception_date date,
    fund_manager character varying(200),
    fund_company character varying(200),
    min_investment numeric(20,2),
    min_redemption numeric(20,2),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.fund_details OWNER TO finapp_user;

--
-- Name: futures_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.futures_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    futures_type character varying(50) NOT NULL,
    underlying_asset character varying(200),
    contract_month character varying(10) NOT NULL,
    contract_size numeric(20,4),
    tick_size numeric(20,8),
    tick_value numeric(20,2),
    trading_hours character varying(100),
    last_trading_date date,
    delivery_date date,
    delivery_method character varying(50),
    initial_margin numeric(20,2),
    maintenance_margin numeric(20,2),
    margin_rate numeric(5,2),
    position_limit integer,
    daily_price_limit numeric(5,2),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.futures_details OWNER TO finapp_user;

--
-- Name: liquidity_tags; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.liquidity_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    color character varying(7),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.liquidity_tags OWNER TO finapp_user;

--
-- Name: markets; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.markets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    country character varying(3) NOT NULL,
    currency character varying(3) NOT NULL,
    timezone character varying(50) NOT NULL,
    trading_hours jsonb,
    holidays jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.markets OWNER TO finapp_user;

--
-- Name: option_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.option_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    asset_id uuid NOT NULL,
    underlying_asset_id uuid,
    option_type character varying(10) NOT NULL,
    strike_price numeric(20,8) NOT NULL,
    expiration_date date NOT NULL,
    contract_size integer DEFAULT 100,
    exercise_style character varying(20) DEFAULT 'american'::character varying,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.option_details OWNER TO finapp_user;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    used_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.password_reset_tokens OWNER TO finapp_user;

--
-- Name: performance_metrics; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.performance_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    metric_type character varying(50) NOT NULL,
    period_type character varying(20) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    value numeric(20,8) NOT NULL,
    currency character varying(3),
    metadata jsonb,
    calculated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.performance_metrics OWNER TO finapp_user;

--
-- Name: permissions; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.permissions OWNER TO finapp_user;

--
-- Name: portfolio_snapshots; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.portfolio_snapshots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    total_value numeric(20,8) NOT NULL,
    cash_value numeric(20,8) DEFAULT 0 NOT NULL,
    invested_value numeric(20,8) DEFAULT 0 NOT NULL,
    unrealized_gain_loss numeric(20,8) DEFAULT 0 NOT NULL,
    realized_gain_loss numeric(20,8) DEFAULT 0 NOT NULL,
    currency character varying(3) NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.portfolio_snapshots OWNER TO finapp_user;

--
-- Name: portfolio_tags; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.portfolio_tags (
    id integer NOT NULL,
    portfolio_id uuid NOT NULL,
    tag_id integer NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.portfolio_tags OWNER TO finapp_user;

--
-- Name: portfolio_tags_id_seq; Type: SEQUENCE; Schema: finapp; Owner: finapp_user
--

CREATE SEQUENCE finapp.portfolio_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE finapp.portfolio_tags_id_seq OWNER TO finapp_user;

--
-- Name: portfolio_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: finapp; Owner: finapp_user
--

ALTER SEQUENCE finapp.portfolio_tags_id_seq OWNED BY finapp.portfolio_tags.id;


--
-- Name: portfolios; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.portfolios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    base_currency character varying(3) DEFAULT 'CNY'::character varying NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    sort_order integer DEFAULT 0
);


ALTER TABLE finapp.portfolios OWNER TO finapp_user;

--
-- Name: position_snapshots; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.position_snapshots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    position_id uuid NOT NULL,
    portfolio_snapshot_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    quantity numeric(20,8) NOT NULL,
    market_price numeric(20,8),
    market_value numeric(20,8),
    average_cost numeric(20,8) NOT NULL,
    total_cost numeric(20,8) NOT NULL,
    unrealized_gain_loss numeric(20,8),
    currency character varying(3) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.position_snapshots OWNER TO finapp_user;

--
-- Name: positions; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.positions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    trading_account_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    quantity numeric(20,8) DEFAULT 0 NOT NULL,
    average_cost numeric(20,8) DEFAULT 0 NOT NULL,
    total_cost numeric(20,8) DEFAULT 0 NOT NULL,
    currency character varying(3) NOT NULL,
    first_purchase_date date,
    last_transaction_date date,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.positions OWNER TO finapp_user;

--
-- Name: price_data_sources; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.price_data_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    provider character varying(50) NOT NULL,
    api_endpoint character varying(500),
    api_key_encrypted text,
    config jsonb DEFAULT '{}'::jsonb,
    rate_limit integer DEFAULT 60,
    timeout_seconds integer DEFAULT 30,
    is_active boolean DEFAULT true,
    last_sync_at timestamp(6) without time zone,
    last_sync_status character varying(20),
    last_error_message text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE finapp.price_data_sources OWNER TO finapp_user;

--
-- Name: price_sync_errors; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.price_sync_errors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    log_id uuid NOT NULL,
    asset_id uuid,
    asset_symbol character varying(50),
    error_type character varying(50),
    error_message text NOT NULL,
    error_details jsonb,
    occurred_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.price_sync_errors OWNER TO finapp_user;

--
-- Name: price_sync_logs; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.price_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid,
    data_source_id uuid,
    started_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(6) without time zone,
    status character varying(20) DEFAULT 'running'::character varying NOT NULL,
    total_assets integer DEFAULT 0,
    total_records integer DEFAULT 0,
    success_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    skipped_count integer DEFAULT 0,
    result_summary jsonb,
    error_message text
);


ALTER TABLE finapp.price_sync_logs OWNER TO finapp_user;

--
-- Name: price_sync_tasks; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.price_sync_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    data_source_id uuid NOT NULL,
    asset_type_id uuid,
    market_id uuid,
    asset_ids uuid[],
    schedule_type character varying(20) DEFAULT 'manual'::character varying NOT NULL,
    cron_expression character varying(100),
    interval_minutes integer,
    sync_days_back integer DEFAULT 1,
    overwrite_existing boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_run_at timestamp(6) without time zone,
    next_run_at timestamp(6) without time zone,
    last_run_status character varying(20),
    last_run_result jsonb,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE finapp.price_sync_tasks OWNER TO finapp_user;

--
-- Name: report_executions; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.report_executions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    report_id uuid NOT NULL,
    execution_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    started_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp(6) with time zone,
    file_path text,
    file_size bigint,
    error_message text,
    metadata jsonb
);


ALTER TABLE finapp.report_executions OWNER TO finapp_user;

--
-- Name: reports; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    portfolio_id uuid,
    name character varying(200) NOT NULL,
    description text,
    report_type character varying(50) NOT NULL,
    parameters jsonb NOT NULL,
    schedule jsonb,
    is_scheduled boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_generated_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.reports OWNER TO finapp_user;

--
-- Name: role_permissions; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.role_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.role_permissions OWNER TO finapp_user;

--
-- Name: roles; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.roles OWNER TO finapp_user;

--
-- Name: stock_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.stock_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    sector character varying(100),
    industry character varying(100),
    market_cap numeric(20,2),
    shares_outstanding bigint,
    pe_ratio numeric(10,2),
    pb_ratio numeric(10,2),
    dividend_yield numeric(5,2),
    company_website character varying(200),
    headquarters character varying(200),
    founded_year integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.stock_details OWNER TO finapp_user;

--
-- Name: stock_option_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.stock_option_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    underlying_stock_id uuid,
    underlying_stock_symbol character varying(50),
    underlying_stock_name character varying(200),
    option_type character varying(10) NOT NULL,
    strike_price numeric(20,8) NOT NULL,
    expiration_date date NOT NULL,
    contract_size integer DEFAULT 100,
    exercise_style character varying(20) DEFAULT 'AMERICAN'::character varying,
    settlement_type character varying(20) DEFAULT 'PHYSICAL'::character varying,
    multiplier numeric(10,4) DEFAULT 1.0,
    trading_unit character varying(20) DEFAULT '手'::character varying,
    min_price_change numeric(20,8),
    margin_requirement numeric(20,2),
    commission_rate numeric(5,4),
    delta numeric(10,6),
    gamma numeric(10,6),
    theta numeric(10,6),
    vega numeric(10,6),
    rho numeric(10,6),
    implied_volatility numeric(10,6),
    historical_volatility numeric(10,6),
    premium_currency character varying(10) DEFAULT 'CNY'::character varying,
    intrinsic_value numeric(20,8),
    time_value numeric(20,8),
    cost_divisor numeric(10,2) DEFAULT 3.5,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.stock_option_details OWNER TO finapp_user;

--
-- Name: tag_categories; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.tag_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#52c41a'::character varying,
    icon character varying(50),
    user_id uuid NOT NULL,
    parent_id integer,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.tag_categories OWNER TO finapp_user;

--
-- Name: tag_categories_id_seq; Type: SEQUENCE; Schema: finapp; Owner: finapp_user
--

CREATE SEQUENCE finapp.tag_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE finapp.tag_categories_id_seq OWNER TO finapp_user;

--
-- Name: tag_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: finapp; Owner: finapp_user
--

ALTER SEQUENCE finapp.tag_categories_id_seq OWNED BY finapp.tag_categories.id;


--
-- Name: tags; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.tags (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#1890ff'::character varying,
    icon character varying(50),
    user_id uuid NOT NULL,
    category_id integer,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.tags OWNER TO finapp_user;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: finapp; Owner: finapp_user
--

CREATE SEQUENCE finapp.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE finapp.tags_id_seq OWNER TO finapp_user;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: finapp; Owner: finapp_user
--

ALTER SEQUENCE finapp.tags_id_seq OWNED BY finapp.tags.id;


--
-- Name: trading_accounts; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.trading_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    account_type character varying(50) NOT NULL,
    broker_name character varying(100),
    account_number character varying(100),
    currency character varying(3) NOT NULL,
    initial_balance numeric(20,8) DEFAULT 0,
    current_balance numeric(20,8) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.trading_accounts OWNER TO finapp_user;

--
-- Name: transaction_tag_mappings; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.transaction_tag_mappings (
    transaction_id uuid NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.transaction_tag_mappings OWNER TO finapp_user;

--
-- Name: transactions; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    trading_account_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    transaction_type character varying(20) NOT NULL,
    quantity numeric(20,8) NOT NULL,
    price numeric(20,8),
    total_amount numeric(20,8) NOT NULL,
    fees numeric(20,8) DEFAULT 0,
    taxes numeric(20,8) DEFAULT 0,
    currency character varying(3) NOT NULL,
    exchange_rate numeric(20,8) DEFAULT 1,
    transaction_date date NOT NULL,
    settlement_date date,
    notes text,
    tags text[],
    liquidity_tag_id uuid,
    external_id character varying(100),
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid,
    side character varying(20),
    executed_at timestamp(6) with time zone,
    settled_at timestamp(6) with time zone,
    status character varying(20) DEFAULT 'EXECUTED'::character varying,
    liquidity_tag character varying(20)
);


ALTER TABLE finapp.transactions OWNER TO finapp_user;

--
-- Name: treasury_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.treasury_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    treasury_type character varying(50) NOT NULL,
    term_type character varying(20),
    face_value numeric(20,2) NOT NULL,
    coupon_rate numeric(5,2) NOT NULL,
    coupon_frequency character varying(20),
    issue_date date NOT NULL,
    maturity_date date NOT NULL,
    term_years integer,
    issue_price numeric(20,2),
    issue_number character varying(50),
    yield_to_maturity numeric(5,2),
    tradable boolean DEFAULT true,
    min_holding_period integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.treasury_details OWNER TO finapp_user;

--
-- Name: user_roles; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp(6) with time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE finapp.user_roles OWNER TO finapp_user;

--
-- Name: user_sessions; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    refresh_token_hash character varying(255),
    device_info jsonb,
    ip_address inet,
    user_agent text,
    is_active boolean DEFAULT true,
    expires_at timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    last_used_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.user_sessions OWNER TO finapp_user;

--
-- Name: users; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(50),
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    avatar_url text,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    language character varying(10) DEFAULT 'zh-CN'::character varying,
    currency_preference character varying(3) DEFAULT 'CNY'::character varying,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    email_verified_at timestamp(6) with time zone,
    last_login_at timestamp(6) with time zone,
    login_count integer DEFAULT 0,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.users OWNER TO finapp_user;

--
-- Name: wealth_product_details; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.wealth_product_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    product_type character varying(50) NOT NULL,
    risk_level character varying(20) NOT NULL,
    expected_return numeric(5,2),
    min_return numeric(5,2),
    max_return numeric(5,2),
    return_type character varying(20),
    issue_date date NOT NULL,
    start_date date NOT NULL,
    maturity_date date NOT NULL,
    lock_period integer,
    min_investment numeric(20,2),
    max_investment numeric(20,2),
    investment_increment numeric(20,2),
    issuer character varying(200),
    product_code character varying(50),
    early_redemption boolean DEFAULT false,
    redemption_fee numeric(5,2),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.wealth_product_details OWNER TO finapp_user;

--
-- Name: asset_prices; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.asset_prices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    asset_id uuid NOT NULL,
    price_date date NOT NULL,
    open_price numeric(20,8),
    high_price numeric(20,8),
    low_price numeric(20,8),
    close_price numeric(20,8) NOT NULL,
    volume bigint,
    adjusted_close numeric(20,8),
    currency character varying(3) NOT NULL,
    data_source character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.asset_prices OWNER TO caojun;

--
-- Name: asset_types; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.asset_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.asset_types OWNER TO caojun;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.assets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    symbol character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    asset_type_id uuid NOT NULL,
    market_id uuid,
    currency character varying(3) NOT NULL,
    isin character varying(12),
    cusip character varying(9),
    sector character varying(100),
    industry character varying(100),
    description text,
    metadata jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assets OWNER TO caojun;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    table_name character varying(100) NOT NULL,
    record_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO caojun;

--
-- Name: benchmark_prices; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.benchmark_prices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    benchmark_id uuid NOT NULL,
    price_date date NOT NULL,
    price numeric(20,8) NOT NULL,
    currency character varying(3) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.benchmark_prices OWNER TO caojun;

--
-- Name: benchmarks; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.benchmarks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(20) NOT NULL,
    description text,
    asset_class character varying(50),
    currency character varying(3) NOT NULL,
    data_source character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.benchmarks OWNER TO caojun;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_verification_tokens OWNER TO caojun;

--
-- Name: TABLE email_verification_tokens; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.email_verification_tokens IS '邮箱验证令牌表';


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.exchange_rates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    from_currency character varying(3) NOT NULL,
    to_currency character varying(3) NOT NULL,
    rate_date date NOT NULL,
    rate numeric(20,8) NOT NULL,
    data_source character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.exchange_rates OWNER TO caojun;

--
-- Name: liquidity_tags; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.liquidity_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    color character varying(7),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.liquidity_tags OWNER TO caojun;

--
-- Name: markets; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.markets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    country character varying(3) NOT NULL,
    currency character varying(3) NOT NULL,
    timezone character varying(50) NOT NULL,
    trading_hours jsonb,
    holidays jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.markets OWNER TO caojun;

--
-- Name: option_details; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.option_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    asset_id uuid NOT NULL,
    underlying_asset_id uuid,
    option_type character varying(10) NOT NULL,
    strike_price numeric(20,8) NOT NULL,
    expiration_date date NOT NULL,
    contract_size integer DEFAULT 100,
    exercise_style character varying(20) DEFAULT 'american'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT option_details_option_type_check CHECK (((option_type)::text = ANY ((ARRAY['call'::character varying, 'put'::character varying])::text[])))
);


ALTER TABLE public.option_details OWNER TO caojun;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO caojun;

--
-- Name: TABLE password_reset_tokens; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.password_reset_tokens IS '密码重置令牌表';


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO caojun;

--
-- Name: TABLE permissions; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.permissions IS '权限表';


--
-- Name: portfolios; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.portfolios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    base_currency character varying(3) DEFAULT 'CNY'::character varying NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.portfolios OWNER TO caojun;

--
-- Name: positions; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.positions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    trading_account_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    quantity numeric(20,8) DEFAULT 0 NOT NULL,
    average_cost numeric(20,8) DEFAULT 0 NOT NULL,
    total_cost numeric(20,8) DEFAULT 0 NOT NULL,
    currency character varying(3) NOT NULL,
    first_purchase_date date,
    last_transaction_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.positions OWNER TO caojun;

--
-- Name: report_executions; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.report_executions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    report_id uuid NOT NULL,
    execution_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone,
    file_path text,
    file_size bigint,
    error_message text,
    metadata jsonb
);


ALTER TABLE public.report_executions OWNER TO caojun;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    portfolio_id uuid,
    name character varying(200) NOT NULL,
    description text,
    report_type character varying(50) NOT NULL,
    parameters jsonb NOT NULL,
    schedule jsonb,
    is_scheduled boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_generated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reports OWNER TO caojun;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO caojun;

--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.role_permissions IS '角色权限关联表';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO caojun;

--
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.roles IS '角色表';


--
-- Name: trading_accounts; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.trading_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    account_type character varying(50) NOT NULL,
    broker_name character varying(100),
    account_number character varying(100),
    currency character varying(3) NOT NULL,
    initial_balance numeric(20,8) DEFAULT 0,
    current_balance numeric(20,8) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trading_accounts OWNER TO caojun;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    portfolio_id uuid NOT NULL,
    trading_account_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    transaction_type character varying(20) NOT NULL,
    quantity numeric(20,8) NOT NULL,
    price numeric(20,8),
    total_amount numeric(20,8) NOT NULL,
    fees numeric(20,8) DEFAULT 0,
    taxes numeric(20,8) DEFAULT 0,
    currency character varying(3) NOT NULL,
    exchange_rate numeric(20,8) DEFAULT 1,
    transaction_date date NOT NULL,
    settlement_date date,
    notes text,
    tags text[],
    liquidity_tag_id uuid,
    external_id character varying(100),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['buy'::character varying, 'sell'::character varying, 'dividend'::character varying, 'split'::character varying, 'merger'::character varying, 'spin_off'::character varying, 'deposit'::character varying, 'withdrawal'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO caojun;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.user_roles OWNER TO caojun;

--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.user_roles IS '用户角色关联表';


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    refresh_token_hash character varying(255),
    device_info jsonb,
    ip_address inet,
    user_agent text,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO caojun;

--
-- Name: TABLE user_sessions; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.user_sessions IS '用户会话表，用于JWT令牌管理';


--
-- Name: users; Type: TABLE; Schema: public; Owner: caojun
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(50),
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    avatar_url text,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    language character varying(10) DEFAULT 'zh-CN'::character varying,
    currency_preference character varying(3) DEFAULT 'CNY'::character varying,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    email_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,
    login_count integer DEFAULT 0,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO caojun;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: caojun
--

COMMENT ON TABLE public.users IS '用户基础信息表';


--
-- Name: portfolio_tags id; Type: DEFAULT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolio_tags ALTER COLUMN id SET DEFAULT nextval('finapp.portfolio_tags_id_seq'::regclass);


--
-- Name: tag_categories id; Type: DEFAULT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tag_categories ALTER COLUMN id SET DEFAULT nextval('finapp.tag_categories_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tags ALTER COLUMN id SET DEFAULT nextval('finapp.tags_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: asset_prices; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.asset_prices (id, asset_id, price_date, open_price, high_price, low_price, close_price, volume, adjusted_close, currency, data_source, created_at) FROM stdin;
ea802138-6443-4763-9ee1-12c499e62523	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-11-07	\N	\N	\N	13.20000000	\N	\N	CNY	test_data	2025-11-07 21:06:05.825332+08
2db2d128-b1ae-429b-b930-55c9797986a2	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-11-07	\N	\N	\N	175.43000000	\N	\N	USD	test_data	2025-11-07 21:06:05.825332+08
cbd66c85-ade5-4dd3-89d7-2370e587d8b7	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-11-07	\N	\N	\N	248.50000000	\N	\N	USD	test_data	2025-11-07 21:06:05.825332+08
608d490d-41e0-4a74-8b21-ae900678c7ca	e9919f45-1585-4645-8a62-036c08865605	2025-11-07	\N	\N	\N	4.35000000	\N	\N	CNY	test_data	2025-11-07 21:06:05.825332+08
\.


--
-- Data for Name: asset_types; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.asset_types (id, code, name, category, description, is_active, created_at) FROM stdin;
761e5638-cff8-4247-bfd7-00edcd57a51a	STOCK	股票	equity	普通股票	t	2025-11-07 21:05:53.355326+08
759fd931-caad-408b-9b46-938bc94b62ce	ETF	交易所交易基金	fund	在交易所交易的指数基金	t	2025-11-07 21:05:53.355326+08
53195789-6c3e-41b3-b30a-4d328126728c	MUTUAL_FUND	共同基金	fund	开放式基金	t	2025-11-07 21:05:53.355326+08
1317e563-bc85-418d-bd6b-bc49d6719ce5	BOND	债券	fixed_income	政府或企业债券	t	2025-11-07 21:05:53.355326+08
716c257e-388f-4cde-a5b6-373effe40d78	OPTION	期权	derivative	股票期权合约	t	2025-11-07 21:05:53.355326+08
810cc3b6-01c0-4cea-af47-b34563226fc9	FUTURE	期货	derivative	期货合约	t	2025-11-07 21:05:53.355326+08
9ed792c8-2fbb-4453-8380-5e957a651df3	CRYPTO	加密货币	crypto	数字货币	t	2025-11-07 21:05:53.355326+08
c7705c2b-9c24-449e-9015-a1ec8b826f6e	CASH	现金	cash	现金及现金等价物	t	2025-11-07 21:05:53.355326+08
ce4ebe16-471f-4d06-b37a-6b5bdf91b018	COMMODITY	商品	commodity	贵金属、原油等商品	t	2025-11-07 21:05:53.355326+08
916f709e-d2fe-4bbb-a0b5-f0e680c30c53	REIT	房地产投资信托	real_estate	房地产投资信托基金	t	2025-11-07 21:05:53.355326+08
a38b6c3d-61de-482d-8859-16e72f3107fd	FUND	基金	fund	\N	t	2025-11-07 21:06:31.056188+08
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.assets (id, symbol, name, asset_type_id, market_id, currency, isin, cusip, sector, industry, description, metadata, is_active, created_at, updated_at, risk_level, lot_size, tick_size, listing_date, delisting_date, tags, created_by, updated_by, liquidity_tag) FROM stdin;
2aa3f894-681b-4a75-9003-ab376a35df7e	000001	平安银行	761e5638-cff8-4247-bfd7-00edcd57a51a	d1f012ef-ff87-447e-9061-43b77382c43c	CNY	\N	\N	金融	银行	中国平安银行股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
a6efbeb9-3af7-4565-a0b0-8a222138ca7d	000002	万科A	761e5638-cff8-4247-bfd7-00edcd57a51a	d1f012ef-ff87-447e-9061-43b77382c43c	CNY	\N	\N	房地产	房地产开发	万科企业股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
a7569e62-8eec-4468-8798-d1e948ef4679	600036	招商银行	761e5638-cff8-4247-bfd7-00edcd57a51a	d1f012ef-ff87-447e-9061-43b77382c43c	CNY	\N	\N	金融	银行	招商银行股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
49589118-facc-4785-abf3-3d2d4d054f17	600519	贵州茅台	761e5638-cff8-4247-bfd7-00edcd57a51a	d1f012ef-ff87-447e-9061-43b77382c43c	CNY	\N	\N	消费	白酒	贵州茅台酒股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
9dd1720a-bd8f-4810-9648-b47b516d82cb	AAPL	Apple Inc.	761e5638-cff8-4247-bfd7-00edcd57a51a	b9e633ae-50b0-467d-bf96-351b9eab0a0c	USD	\N	\N	科技	消费电子	苹果公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
43fc85a9-db6d-4390-a6ef-7b4b5979fdda	MSFT	Microsoft Corporation	761e5638-cff8-4247-bfd7-00edcd57a51a	b9e633ae-50b0-467d-bf96-351b9eab0a0c	USD	\N	\N	科技	软件	微软公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
e18a110d-3daa-4d2f-9880-c3985dce8bbf	GOOGL	Alphabet Inc.	761e5638-cff8-4247-bfd7-00edcd57a51a	b9e633ae-50b0-467d-bf96-351b9eab0a0c	USD	\N	\N	科技	互联网	谷歌母公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	TSLA	Tesla, Inc.	761e5638-cff8-4247-bfd7-00edcd57a51a	b9e633ae-50b0-467d-bf96-351b9eab0a0c	USD	\N	\N	汽车	电动汽车	特斯拉公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
a4d3853b-0417-42c2-8d5d-dd32d3659e4a	0700	腾讯控股	761e5638-cff8-4247-bfd7-00edcd57a51a	b32e2b9c-e3d4-4e41-b7bb-81e9c35db53c	HKD	\N	\N	科技	互联网	腾讯控股有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
87827534-5cc9-4f7e-a066-348b52e4965f	0941	中国移动	761e5638-cff8-4247-bfd7-00edcd57a51a	b32e2b9c-e3d4-4e41-b7bb-81e9c35db53c	HKD	\N	\N	通信	电信运营	中国移动有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
e9919f45-1585-4645-8a62-036c08865605	510300	沪深300ETF	759fd931-caad-408b-9b46-938bc94b62ce	d1f012ef-ff87-447e-9061-43b77382c43c	CNY	\N	\N	ETF	指数基金	华泰柏瑞沪深300ETF	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
b267651d-83dc-495e-8623-0f4c7c27662c	SPY	SPDR S&P 500 ETF	759fd931-caad-408b-9b46-938bc94b62ce	b9e633ae-50b0-467d-bf96-351b9eab0a0c	USD	\N	\N	ETF	指数基金	标普500指数ETF	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.audit_logs (id, user_id, table_name, record_id, action, old_values, new_values, changed_fields, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: benchmark_prices; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.benchmark_prices (id, benchmark_id, price_date, price, currency, created_at) FROM stdin;
\.


--
-- Data for Name: benchmarks; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.benchmarks (id, name, symbol, description, asset_class, currency, data_source, is_active, created_at) FROM stdin;
3295fc27-ccb0-4149-9d63-349231982751	沪深300指数	CSI300	沪深300指数，反映A股市场整体表现	equity	CNY	\N	t	2025-11-07 21:05:53.359287+08
8cdf279f-6a15-4a37-ac94-aecf13e97156	上证指数	SHCOMP	上海证券交易所综合股价指数	equity	CNY	\N	t	2025-11-07 21:05:53.359287+08
37ace466-8b41-4ddb-b0a9-461d96b8eab3	深证成指	SZCOMP	深圳证券交易所成份股价指数	equity	CNY	\N	t	2025-11-07 21:05:53.359287+08
ffd11eda-614b-4cd2-9a2e-41754f2198f3	恒生指数	HSI	香港恒生指数	equity	HKD	\N	t	2025-11-07 21:05:53.359287+08
b37a6a3c-b8a8-46a8-960c-ecb0262fa91a	标普500指数	SPX	标准普尔500指数	equity	USD	\N	t	2025-11-07 21:05:53.359287+08
19548a7a-33cc-4374-a35f-3fd20ef93c8b	纳斯达克指数	IXIC	纳斯达克综合指数	equity	USD	\N	t	2025-11-07 21:05:53.359287+08
fd5ff7d6-8de9-4c98-9f30-41d57a1ba263	日经225指数	N225	日经225指数	equity	JPY	\N	t	2025-11-07 21:05:53.359287+08
8de063ae-fb49-42cf-b18c-9656b1a55a7f	富时100指数	UKX	英国富时100指数	equity	GBP	\N	t	2025-11-07 21:05:53.359287+08
6c8f4959-35d7-43b7-9580-3e0747147ea5	DAX指数	DAX	德国DAX指数	equity	EUR	\N	t	2025-11-07 21:05:53.359287+08
\.


--
-- Data for Name: bond_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.bond_details (id, asset_id, bond_type, credit_rating, face_value, coupon_rate, coupon_frequency, issue_date, maturity_date, years_to_maturity, yield_to_maturity, current_yield, issuer, issue_price, issue_size, callable, call_date, call_price, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cash_flows; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.cash_flows (id, portfolio_id, trading_account_id, asset_id, flow_type, amount, currency, flow_date, description, transaction_id, created_at, date, category) FROM stdin;
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.email_verification_tokens (id, user_id, token_hash, email, expires_at, verified_at, created_at) FROM stdin;
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.exchange_rates (id, from_currency, to_currency, rate_date, rate, data_source, created_at) FROM stdin;
d5213ef2-7ce2-4007-97fb-1bebc4c10c45	JPY	CNY	2025-11-07	0.04800000	manual	2025-11-07 21:05:53.360205+08
77af93c9-13d0-4e7b-b0d4-1e4ce3f0dfac	EUR	CNY	2025-11-07	7.80000000	manual	2025-11-07 21:05:53.360205+08
9d299ada-a482-4151-9c91-ab495868fdfb	GBP	CNY	2025-11-07	9.10000000	manual	2025-11-07 21:05:53.360205+08
1c9f401d-09ca-4639-8733-ec5b34814fe5	CNY	JPY	2025-11-07	20.83330000	manual	2025-11-07 21:05:53.360205+08
4bba753e-f396-4e6d-9a23-78db7729b642	CNY	EUR	2025-11-07	0.12820000	manual	2025-11-07 21:05:53.360205+08
4e7cfcc6-abdc-4bf1-a447-f1bd5006c29f	CNY	GBP	2025-11-07	0.10990000	manual	2025-11-07 21:05:53.360205+08
6151bd0d-9feb-4fdb-baf4-ecb9fd5e7f7e	USD	CNY	2025-11-07	7.25000000	manual	2025-11-07 21:05:53.360205+08
29f0c2e7-97b5-4c41-8edd-a43ccdc1387d	CNY	USD	2025-11-07	0.13790000	manual	2025-11-07 21:05:53.360205+08
d5ba3519-9b1d-431c-b8c7-fdd7fd3fe8c0	HKD	CNY	2025-11-07	0.92800000	manual	2025-11-07 21:05:53.360205+08
ff5d389a-6000-455b-b9bd-593be333ba09	CNY	HKD	2025-11-07	1.07760000	manual	2025-11-07 21:05:53.360205+08
28aa9ad7-dc89-4b47-99b3-75da25c7e751	USD	HKD	2025-11-07	7.80000000	manual	2025-11-07 21:05:53.462026+08
47c491d3-8202-4007-ac39-635389af8ca4	HKD	USD	2025-11-07	0.12820000	manual	2025-11-07 21:05:53.462026+08
\.


--
-- Data for Name: fund_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.fund_details (id, asset_id, fund_type, fund_category, management_fee, custodian_fee, subscription_fee, redemption_fee, nav, nav_date, accumulated_nav, fund_size, inception_date, fund_manager, fund_company, min_investment, min_redemption, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: futures_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.futures_details (id, asset_id, futures_type, underlying_asset, contract_month, contract_size, tick_size, tick_value, trading_hours, last_trading_date, delivery_date, delivery_method, initial_margin, maintenance_margin, margin_rate, position_limit, daily_price_limit, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: liquidity_tags; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.liquidity_tags (id, name, description, color, sort_order, is_active, created_at) FROM stdin;
cc893a70-ae7f-47ed-a81e-97486a3b4524	高流动性	大盘股、主要ETF等高流动性资产	#22c55e	1	t	2025-11-07 21:05:53.358078+08
c6ef56b5-8971-47b6-9f3b-c449ff5913d6	中等流动性	中盘股、部分基金等中等流动性资产	#f59e0b	2	t	2025-11-07 21:05:53.358078+08
7a3c492c-3aa4-494d-9cf2-4a46d17f183a	低流动性	小盘股、私募基金等低流动性资产	#ef4444	3	t	2025-11-07 21:05:53.358078+08
f882c8fd-4edb-4667-8ad0-0aa385d5de71	锁定期	有锁定期限制的资产	#8b5cf6	4	t	2025-11-07 21:05:53.358078+08
7003ccf0-d1c5-4fe0-a32a-7f5b4f35a48f	不可交易	暂停交易或退市的资产	#6b7280	5	t	2025-11-07 21:05:53.358078+08
\.


--
-- Data for Name: markets; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.markets (id, code, name, country, currency, timezone, trading_hours, holidays, is_active, created_at, updated_at) FROM stdin;
d1f012ef-ff87-447e-9061-43b77382c43c	SSE	上海证券交易所	CHN	CNY	Asia/Shanghai	{"open": "09:30", "close": "15:00", "lunch_break": {"end": "13:00", "start": "11:30"}}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
93b2ea2a-17ee-41c5-9603-e82aee44417f	SZSE	深圳证券交易所	CHN	CNY	Asia/Shanghai	{"open": "09:30", "close": "15:00", "lunch_break": {"end": "13:00", "start": "11:30"}}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
b32e2b9c-e3d4-4e41-b7bb-81e9c35db53c	HKEX	香港交易所	HKG	HKD	Asia/Hong_Kong	{"open": "09:30", "close": "16:00", "lunch_break": {"end": "13:00", "start": "12:00"}}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
bf6232a9-40e3-4788-98e8-f18ee0ec2fb6	NYSE	纽约证券交易所	USA	USD	America/New_York	{"open": "09:30", "close": "16:00"}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
b9e633ae-50b0-467d-bf96-351b9eab0a0c	NASDAQ	纳斯达克	USA	USD	America/New_York	{"open": "09:30", "close": "16:00"}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
93e69f74-5df6-47ef-9ac2-639072dcf1cf	TSE	东京证券交易所	JPN	JPY	Asia/Tokyo	{"open": "09:00", "close": "15:00", "lunch_break": {"end": "12:30", "start": "11:30"}}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
b4359415-0cbc-4786-97a9-2ffbf5df7188	LSE	伦敦证券交易所	GBR	GBP	Europe/London	{"open": "08:00", "close": "16:30"}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
06954cbd-28dd-444c-9137-85bf6a15ecf2	FWB	法兰克福证券交易所	DEU	EUR	Europe/Berlin	{"open": "09:00", "close": "17:30"}	\N	t	2025-11-07 21:05:53.356856+08	2025-11-07 21:05:53.356856+08
\.


--
-- Data for Name: option_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.option_details (id, asset_id, underlying_asset_id, option_type, strike_price, expiration_date, contract_size, exercise_style, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.performance_metrics (id, portfolio_id, metric_type, period_type, period_start, period_end, value, currency, metadata, calculated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.permissions (id, name, resource, action, description, created_at) FROM stdin;
35705400-574b-4ac4-967f-eea3283e32f8	users.create	users	create	创建用户	2025-11-07 21:05:53.350655+08
eef94c62-8cc3-466b-be67-d6c028dc9320	users.read	users	read	查看用户信息	2025-11-07 21:05:53.350655+08
e5d6ab45-d2b1-463c-a9c3-25acd95a3e20	users.update	users	update	更新用户信息	2025-11-07 21:05:53.350655+08
a8b2da5e-192e-47cf-ac4b-e2221e093c95	users.delete	users	delete	删除用户	2025-11-07 21:05:53.350655+08
85a02685-1689-4abb-9af8-9562db0179ea	portfolios.create	portfolios	create	创建投资组合	2025-11-07 21:05:53.350655+08
213c516c-2e81-4900-b880-390f3221c113	portfolios.read	portfolios	read	查看投资组合	2025-11-07 21:05:53.350655+08
71c5f73f-ec3e-4ffc-9b20-feecaec2f536	portfolios.update	portfolios	update	更新投资组合	2025-11-07 21:05:53.350655+08
c8ea0975-9405-42ce-ab2f-bd1a37de520e	portfolios.delete	portfolios	delete	删除投资组合	2025-11-07 21:05:53.350655+08
1692e1a7-a33d-4dc7-8306-5a25f482d82f	accounts.create	trading_accounts	create	创建交易账户	2025-11-07 21:05:53.350655+08
30d64c5a-fc49-45a3-9652-6747c08a924a	accounts.read	trading_accounts	read	查看交易账户	2025-11-07 21:05:53.350655+08
8485e1e9-2a9e-4704-a863-0e1e5c304950	accounts.update	trading_accounts	update	更新交易账户	2025-11-07 21:05:53.350655+08
b27540e1-0a3b-43ee-9464-e3ecb5b27321	accounts.delete	trading_accounts	delete	删除交易账户	2025-11-07 21:05:53.350655+08
9f757852-e630-498f-a5c5-353436a40ae4	transactions.create	transactions	create	创建交易记录	2025-11-07 21:05:53.350655+08
17a0a364-e115-471d-8392-e88879720791	transactions.read	transactions	read	查看交易记录	2025-11-07 21:05:53.350655+08
cb436f9a-7ef2-46bc-8341-e99372b79f7f	transactions.update	transactions	update	更新交易记录	2025-11-07 21:05:53.350655+08
4d2247d5-2882-4c7c-a300-8e4eaa294b80	transactions.delete	transactions	delete	删除交易记录	2025-11-07 21:05:53.350655+08
d9629cb0-d0eb-4c3b-aa0f-229f93b3e07e	transactions.import	transactions	import	批量导入交易记录	2025-11-07 21:05:53.350655+08
f48b62db-e078-4cfe-b4ac-8dde98283b3c	assets.create	assets	create	创建资产	2025-11-07 21:05:53.350655+08
f8ecee8e-eb8e-4127-92b8-bbb361dbeeff	assets.read	assets	read	查看资产信息	2025-11-07 21:05:53.350655+08
56c23162-5976-4ca4-964e-b1b36ae41e85	assets.update	assets	update	更新资产信息	2025-11-07 21:05:53.350655+08
0790f87a-cd62-4f05-82ff-042902b0a51b	assets.delete	assets	delete	删除资产	2025-11-07 21:05:53.350655+08
09aa0f57-e97a-4dc1-ab00-c3c3af8b1d11	reports.create	reports	create	创建报表	2025-11-07 21:05:53.350655+08
3eed05cc-1d64-4e07-9b97-b8ed103e59b0	reports.read	reports	read	查看报表	2025-11-07 21:05:53.350655+08
6cae6bd0-8d33-4cf5-8a0c-98eab2133ae1	reports.update	reports	update	更新报表	2025-11-07 21:05:53.350655+08
6eca62f8-ff89-4ab0-b45a-f47e056daa5c	reports.delete	reports	delete	删除报表	2025-11-07 21:05:53.350655+08
614e6f26-125d-482e-8480-7ad01bd5228f	reports.export	reports	export	导出报表	2025-11-07 21:05:53.350655+08
e4b3d8bc-3a48-4eb1-bb68-8ca02320f790	system.config	system	config	系统配置管理	2025-11-07 21:05:53.350655+08
f6c544aa-a006-4c5d-8524-813a6b083b8a	system.logs	system	logs	查看系统日志	2025-11-07 21:05:53.350655+08
990cff7f-bdf1-424c-b21a-d4d8f4ee0040	system.backup	system	backup	数据备份管理	2025-11-07 21:05:53.350655+08
\.


--
-- Data for Name: portfolio_snapshots; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.portfolio_snapshots (id, portfolio_id, snapshot_date, total_value, cash_value, invested_value, unrealized_gain_loss, realized_gain_loss, currency, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: portfolio_tags; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.portfolio_tags (id, portfolio_id, tag_id, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: portfolios; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.portfolios (id, user_id, name, description, base_currency, is_default, is_active, created_at, updated_at, sort_order) FROM stdin;
\.


--
-- Data for Name: position_snapshots; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.position_snapshots (id, position_id, portfolio_snapshot_id, snapshot_date, quantity, market_price, market_value, average_cost, total_cost, unrealized_gain_loss, currency, created_at) FROM stdin;
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.positions (id, portfolio_id, trading_account_id, asset_id, quantity, average_cost, total_cost, currency, first_purchase_date, last_transaction_date, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: price_data_sources; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.price_data_sources (id, name, provider, api_endpoint, api_key_encrypted, config, rate_limit, timeout_seconds, is_active, last_sync_at, last_sync_status, last_error_message, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: price_sync_errors; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.price_sync_errors (id, log_id, asset_id, asset_symbol, error_type, error_message, error_details, occurred_at) FROM stdin;
\.


--
-- Data for Name: price_sync_logs; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.price_sync_logs (id, task_id, data_source_id, started_at, completed_at, status, total_assets, total_records, success_count, failed_count, skipped_count, result_summary, error_message) FROM stdin;
\.


--
-- Data for Name: price_sync_tasks; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.price_sync_tasks (id, name, description, data_source_id, asset_type_id, market_id, asset_ids, schedule_type, cron_expression, interval_minutes, sync_days_back, overwrite_existing, is_active, last_run_at, next_run_at, last_run_status, last_run_result, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: report_executions; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.report_executions (id, report_id, execution_status, started_at, completed_at, file_path, file_size, error_message, metadata) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.reports (id, user_id, portfolio_id, name, description, report_type, parameters, schedule, is_scheduled, is_active, last_generated_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
a0762afb-a48d-4eb4-8afc-021747207990	eb08af9f-bb10-47f5-94b1-0812282a4917	35705400-574b-4ac4-967f-eea3283e32f8	2025-11-07 21:05:53.352135+08
faaa935f-9a29-4410-8f03-22db179f4c81	eb08af9f-bb10-47f5-94b1-0812282a4917	eef94c62-8cc3-466b-be67-d6c028dc9320	2025-11-07 21:05:53.352135+08
c063991d-29fa-4b8e-b318-054ae2f36313	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	eef94c62-8cc3-466b-be67-d6c028dc9320	2025-11-07 21:05:53.352135+08
23754427-426a-4e88-8c84-ac4f52941aa9	927f1425-7f82-4c3d-8701-289e2ccb820b	eef94c62-8cc3-466b-be67-d6c028dc9320	2025-11-07 21:05:53.352135+08
8cbc685b-a1aa-466e-b618-a9320f638e56	eb08af9f-bb10-47f5-94b1-0812282a4917	e5d6ab45-d2b1-463c-a9c3-25acd95a3e20	2025-11-07 21:05:53.352135+08
76193866-18b5-4c1a-8de1-618b0adf3b4a	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	e5d6ab45-d2b1-463c-a9c3-25acd95a3e20	2025-11-07 21:05:53.352135+08
dc73a69b-72ad-40ab-ad13-e0cbb60c544c	eb08af9f-bb10-47f5-94b1-0812282a4917	a8b2da5e-192e-47cf-ac4b-e2221e093c95	2025-11-07 21:05:53.352135+08
886039eb-3511-4197-b0b7-56bb3f84ab14	eb08af9f-bb10-47f5-94b1-0812282a4917	85a02685-1689-4abb-9af8-9562db0179ea	2025-11-07 21:05:53.352135+08
fdd308e4-9562-4cc6-ac23-2c32aac48c97	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	85a02685-1689-4abb-9af8-9562db0179ea	2025-11-07 21:05:53.352135+08
6c45de77-50c7-4b9f-8daa-17bc30ca39cc	eb08af9f-bb10-47f5-94b1-0812282a4917	213c516c-2e81-4900-b880-390f3221c113	2025-11-07 21:05:53.352135+08
7c006dc1-beda-4d97-8831-fd9f59bc6682	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	213c516c-2e81-4900-b880-390f3221c113	2025-11-07 21:05:53.352135+08
a80c56be-8c70-464b-9235-db3fc6c48768	927f1425-7f82-4c3d-8701-289e2ccb820b	213c516c-2e81-4900-b880-390f3221c113	2025-11-07 21:05:53.352135+08
85998344-ecc2-4d5c-aff8-7e5254318cf3	eb08af9f-bb10-47f5-94b1-0812282a4917	71c5f73f-ec3e-4ffc-9b20-feecaec2f536	2025-11-07 21:05:53.352135+08
19cfc15f-623a-4e76-8321-c7a15a57d3ea	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	71c5f73f-ec3e-4ffc-9b20-feecaec2f536	2025-11-07 21:05:53.352135+08
5fc13459-8909-46cf-aef4-cc6ad01586d9	eb08af9f-bb10-47f5-94b1-0812282a4917	c8ea0975-9405-42ce-ab2f-bd1a37de520e	2025-11-07 21:05:53.352135+08
c15b5272-e623-4417-8bdd-d34ee3f63191	eb08af9f-bb10-47f5-94b1-0812282a4917	1692e1a7-a33d-4dc7-8306-5a25f482d82f	2025-11-07 21:05:53.352135+08
ca5f4613-fcc9-4f62-9680-2c51c4ae0f9f	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	1692e1a7-a33d-4dc7-8306-5a25f482d82f	2025-11-07 21:05:53.352135+08
0c96e9da-0bd2-4f6e-882a-dbf5e6b044be	eb08af9f-bb10-47f5-94b1-0812282a4917	30d64c5a-fc49-45a3-9652-6747c08a924a	2025-11-07 21:05:53.352135+08
e4902116-cdbe-498e-9fad-8828db27a1a9	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	30d64c5a-fc49-45a3-9652-6747c08a924a	2025-11-07 21:05:53.352135+08
3b77f8b3-ee11-4fd6-a9e6-d36ed530628c	927f1425-7f82-4c3d-8701-289e2ccb820b	30d64c5a-fc49-45a3-9652-6747c08a924a	2025-11-07 21:05:53.352135+08
af95b3dc-a339-43b4-b4bf-6a9714980d4d	eb08af9f-bb10-47f5-94b1-0812282a4917	8485e1e9-2a9e-4704-a863-0e1e5c304950	2025-11-07 21:05:53.352135+08
85ca0786-3ed0-4e36-ad18-81e232276c0a	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	8485e1e9-2a9e-4704-a863-0e1e5c304950	2025-11-07 21:05:53.352135+08
789254f4-ee3a-43da-a5cf-f71a1a0d7148	eb08af9f-bb10-47f5-94b1-0812282a4917	b27540e1-0a3b-43ee-9464-e3ecb5b27321	2025-11-07 21:05:53.352135+08
ef116949-f9eb-4074-b6bf-a18b7b0531ee	eb08af9f-bb10-47f5-94b1-0812282a4917	9f757852-e630-498f-a5c5-353436a40ae4	2025-11-07 21:05:53.352135+08
3fe09bb1-c1c9-4609-ad13-54129869cabe	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	9f757852-e630-498f-a5c5-353436a40ae4	2025-11-07 21:05:53.352135+08
dbaa25de-844b-4127-a792-39e2c7cf8e17	eb08af9f-bb10-47f5-94b1-0812282a4917	17a0a364-e115-471d-8392-e88879720791	2025-11-07 21:05:53.352135+08
3e3023c0-4013-4def-976f-427b98946912	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	17a0a364-e115-471d-8392-e88879720791	2025-11-07 21:05:53.352135+08
c37682b9-bd81-44ee-8dea-119d7c9aa8cd	927f1425-7f82-4c3d-8701-289e2ccb820b	17a0a364-e115-471d-8392-e88879720791	2025-11-07 21:05:53.352135+08
4cbd8c34-6dd1-4a30-b1ba-d1c484c78921	eb08af9f-bb10-47f5-94b1-0812282a4917	cb436f9a-7ef2-46bc-8341-e99372b79f7f	2025-11-07 21:05:53.352135+08
81ed3ed4-859d-4b13-9a3e-45e4506e5240	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	cb436f9a-7ef2-46bc-8341-e99372b79f7f	2025-11-07 21:05:53.352135+08
a1842d2a-6b00-4d3f-9226-35e486a996b6	eb08af9f-bb10-47f5-94b1-0812282a4917	4d2247d5-2882-4c7c-a300-8e4eaa294b80	2025-11-07 21:05:53.352135+08
cf446850-9d50-42f7-93a9-d8ec1b82a3de	eb08af9f-bb10-47f5-94b1-0812282a4917	d9629cb0-d0eb-4c3b-aa0f-229f93b3e07e	2025-11-07 21:05:53.352135+08
1c18ec4c-2144-4453-94e6-b56c4bfcfeb5	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	d9629cb0-d0eb-4c3b-aa0f-229f93b3e07e	2025-11-07 21:05:53.352135+08
d5ad8d9c-591c-4446-87a9-17221bfa199c	eb08af9f-bb10-47f5-94b1-0812282a4917	f48b62db-e078-4cfe-b4ac-8dde98283b3c	2025-11-07 21:05:53.352135+08
62cc5d47-fc77-4432-833d-5d6d88498569	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	f48b62db-e078-4cfe-b4ac-8dde98283b3c	2025-11-07 21:05:53.352135+08
ac9a7d81-418c-490d-b0df-6222a912db53	eb08af9f-bb10-47f5-94b1-0812282a4917	f8ecee8e-eb8e-4127-92b8-bbb361dbeeff	2025-11-07 21:05:53.352135+08
4b289b8c-bd0e-4bb6-b37b-6850713696b2	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	f8ecee8e-eb8e-4127-92b8-bbb361dbeeff	2025-11-07 21:05:53.352135+08
d46d66f1-2675-4cf5-83a9-cbbe9c0f3b57	927f1425-7f82-4c3d-8701-289e2ccb820b	f8ecee8e-eb8e-4127-92b8-bbb361dbeeff	2025-11-07 21:05:53.352135+08
cb224bda-bef6-44ff-b5c1-526edec872a6	eb08af9f-bb10-47f5-94b1-0812282a4917	56c23162-5976-4ca4-964e-b1b36ae41e85	2025-11-07 21:05:53.352135+08
01806253-48f6-4eb5-be29-b9302c39846f	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	56c23162-5976-4ca4-964e-b1b36ae41e85	2025-11-07 21:05:53.352135+08
b9dfccbb-9dec-433f-ba22-d8043ca15186	eb08af9f-bb10-47f5-94b1-0812282a4917	0790f87a-cd62-4f05-82ff-042902b0a51b	2025-11-07 21:05:53.352135+08
6c9a8829-da08-4cda-acfa-5ae60556420e	eb08af9f-bb10-47f5-94b1-0812282a4917	09aa0f57-e97a-4dc1-ab00-c3c3af8b1d11	2025-11-07 21:05:53.352135+08
fd327680-1006-4090-971e-58c7ef4b7a10	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	09aa0f57-e97a-4dc1-ab00-c3c3af8b1d11	2025-11-07 21:05:53.352135+08
7b968e74-5cd0-4db7-a1ec-2c27117de43a	eb08af9f-bb10-47f5-94b1-0812282a4917	3eed05cc-1d64-4e07-9b97-b8ed103e59b0	2025-11-07 21:05:53.352135+08
7fda69a5-bcc1-4176-bc38-9b2553a07bd5	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	3eed05cc-1d64-4e07-9b97-b8ed103e59b0	2025-11-07 21:05:53.352135+08
7251ebed-7ab1-41e7-875a-4add9530210e	927f1425-7f82-4c3d-8701-289e2ccb820b	3eed05cc-1d64-4e07-9b97-b8ed103e59b0	2025-11-07 21:05:53.352135+08
9ae6bc0c-90e9-4d95-afc9-de28abc5c88e	eb08af9f-bb10-47f5-94b1-0812282a4917	6cae6bd0-8d33-4cf5-8a0c-98eab2133ae1	2025-11-07 21:05:53.352135+08
b109215a-15a4-4dc3-a767-13b926db2ac7	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	6cae6bd0-8d33-4cf5-8a0c-98eab2133ae1	2025-11-07 21:05:53.352135+08
21ec505c-7127-47c5-b70a-e76e8170b58b	eb08af9f-bb10-47f5-94b1-0812282a4917	6eca62f8-ff89-4ab0-b45a-f47e056daa5c	2025-11-07 21:05:53.352135+08
6a781f73-4d32-401c-9f95-22b59643ab0f	eb08af9f-bb10-47f5-94b1-0812282a4917	614e6f26-125d-482e-8480-7ad01bd5228f	2025-11-07 21:05:53.352135+08
304ce2d4-fd1e-4826-a92c-b13734918ce5	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	614e6f26-125d-482e-8480-7ad01bd5228f	2025-11-07 21:05:53.352135+08
798a6ee0-db04-48b6-9049-63d098a3e85d	eb08af9f-bb10-47f5-94b1-0812282a4917	e4b3d8bc-3a48-4eb1-bb68-8ca02320f790	2025-11-07 21:05:53.352135+08
b4afcc1c-c526-4e88-acd9-9d02961289f3	eb08af9f-bb10-47f5-94b1-0812282a4917	f6c544aa-a006-4c5d-8524-813a6b083b8a	2025-11-07 21:05:53.352135+08
7a0efb20-094e-45ab-9364-2a35dc052f77	eb08af9f-bb10-47f5-94b1-0812282a4917	990cff7f-bdf1-424c-b21a-d4d8f4ee0040	2025-11-07 21:05:53.352135+08
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.roles (id, name, description, is_active, created_at, updated_at) FROM stdin;
eb08af9f-bb10-47f5-94b1-0812282a4917	admin	系统管理员，拥有所有权限	t	2025-11-07 21:05:53.346865+08	2025-11-07 21:05:53.346865+08
38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	user	普通用户，拥有基本功能权限	t	2025-11-07 21:05:53.346865+08	2025-11-07 21:05:53.346865+08
927f1425-7f82-4c3d-8701-289e2ccb820b	viewer	只读用户，只能查看数据	t	2025-11-07 21:05:53.346865+08	2025-11-07 21:05:53.346865+08
\.


--
-- Data for Name: stock_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.stock_details (id, asset_id, sector, industry, market_cap, shares_outstanding, pe_ratio, pb_ratio, dividend_yield, company_website, headquarters, founded_year, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_option_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.stock_option_details (id, asset_id, underlying_stock_id, underlying_stock_symbol, underlying_stock_name, option_type, strike_price, expiration_date, contract_size, exercise_style, settlement_type, multiplier, trading_unit, min_price_change, margin_requirement, commission_rate, delta, gamma, theta, vega, rho, implied_volatility, historical_volatility, premium_currency, intrinsic_value, time_value, cost_divisor, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tag_categories; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.tag_categories (id, name, description, color, icon, user_id, parent_id, sort_order, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.tags (id, name, description, color, icon, user_id, category_id, is_system, is_active, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trading_accounts; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.trading_accounts (id, portfolio_id, name, account_type, broker_name, account_number, currency, initial_balance, current_balance, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transaction_tag_mappings; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.transaction_tag_mappings (transaction_id, tag_id, created_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, fees, taxes, currency, exchange_rate, transaction_date, settlement_date, notes, tags, liquidity_tag_id, external_id, metadata, created_at, updated_at, user_id, side, executed_at, settled_at, status, liquidity_tag) FROM stdin;
\.


--
-- Data for Name: treasury_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.treasury_details (id, asset_id, treasury_type, term_type, face_value, coupon_rate, coupon_frequency, issue_date, maturity_date, term_years, issue_price, issue_number, yield_to_maturity, tradable, min_holding_period, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) FROM stdin;
cb56861d-abc8-4745-b041-a325409cfe57	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	38c76c8b-b714-4eb3-9114-2baf7f5fb3bc	e04747dd-bbe9-4d24-adcf-1c088e3c3491	2025-11-07 21:20:18.95748+08	\N	t
039c1f2f-0f06-4331-a3b6-2443eca1ce96	e04747dd-bbe9-4d24-adcf-1c088e3c3491	eb08af9f-bb10-47f5-94b1-0812282a4917	e04747dd-bbe9-4d24-adcf-1c088e3c3491	2025-11-07 21:21:06.096613+08	\N	t
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.user_sessions (id, user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, is_active, expires_at, created_at, last_used_at) FROM stdin;
724cd83c-27ed-4c53-a025-5dba04b6cb9c	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$473iScTBipzF9PZzdR5TEO42h5KYO/7jeOvOwJAuIkZAx4/cdNSP.	\N	\N	\N	\N	t	2025-11-08 21:17:24+08	2025-11-07 21:17:24.964+08	2025-11-07 21:17:24.964+08
36014bca-ff1e-42a4-b79a-4bb9fd3f160b	e04747dd-bbe9-4d24-adcf-1c088e3c3491	$2b$10$HrsLtKPYJo9dDFJfud7vKuIrPFMN1ufMu9obK4IXRiSKY3aIFmJLq	\N	\N	\N	\N	t	2025-11-08 21:17:25+08	2025-11-07 21:17:25.393+08	2025-11-07 21:17:25.393+08
bc531fb9-2f42-4880-b6a0-32978f7d7534	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$d/5EhHhZqIv5iGJLe8GD1.BJEpTLnotGGkkoI4N/Ry3G29/93rI2.	\N	\N	\N	\N	t	2025-11-08 21:17:44+08	2025-11-07 21:17:44.897+08	2025-11-07 21:17:44.897+08
f4f7e96c-bf26-4c96-99e5-a3912855bd06	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$wtNGu6nNupnLbP6OgM4GG.nNPEZyzsKL2GlolHXgtj17wS.FBdyqG	\N	\N	\N	\N	t	2025-11-08 21:17:48+08	2025-11-07 21:17:48.248+08	2025-11-07 21:17:48.248+08
7961c023-4622-4351-aaad-daf64879536a	e04747dd-bbe9-4d24-adcf-1c088e3c3491	$2b$10$ZfpGXZ.nGMQQ2uYzrpr0beB.EjbzsskF.7ZKXYpJBfe0p8WHCPr3.	\N	\N	\N	\N	t	2025-11-08 21:19:41+08	2025-11-07 21:19:41.123+08	2025-11-07 21:19:41.123+08
1ba50a76-d4d4-43ce-bd91-e542995d6713	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$3nn.hYN6N6BdgDUebVaBeuGCHTmB1FdVea6uoYLUrVZ0NG03QM4FS	\N	\N	\N	\N	t	2025-11-08 21:21:33+08	2025-11-07 21:21:33.192+08	2025-11-07 21:21:33.192+08
092c433e-469e-4584-aa74-b0c271da432d	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$IIV3kCzZDGJ8tW3qVy4dSOdBrHQq4eG7.WaAEBcXxCH7rjPV5219.	\N	\N	\N	\N	t	2025-11-08 21:24:36+08	2025-11-07 21:24:36.284+08	2025-11-07 21:24:36.284+08
87955c7d-5d09-436f-89bc-30caaff64826	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$ssDZS2fJ4nDj.0EDxyCQwOtGEcBdsb0QvgyhoCQLGP.4oSqESGDgy	\N	\N	\N	\N	t	2025-11-08 21:25:53+08	2025-11-07 21:25:53.062+08	2025-11-07 21:25:53.062+08
44e22918-5143-43a1-b6e7-4261e0c0b4da	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$6ssOkAB8r7kReFUNnrg7m.XzA/z8cHYSTE9rXm7sW/w6gcBIxi/MO	\N	\N	\N	\N	t	2025-11-08 21:29:16+08	2025-11-07 21:29:16.086+08	2025-11-07 21:29:16.086+08
8f2c0067-b29d-4087-8db2-7a72d7b2f89a	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$28g5cF5.mTT7FCqsMP7Ife7l6rGo67AKrBAcJZWQCMOisUf0/h93a	\N	\N	\N	\N	t	2025-11-08 21:29:57+08	2025-11-07 21:29:57.443+08	2025-11-07 21:29:57.443+08
31703632-2c9e-4da2-9625-d6e7a0432dec	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$VINg0B/IgvBYesnGD3yGquN3VTe.yDsA8UyJb8BBfN89/7qE.8Gxi	\N	\N	\N	\N	t	2025-11-08 21:29:57+08	2025-11-07 21:29:57.547+08	2025-11-07 21:29:57.547+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.users (id, email, username, password_hash, first_name, last_name, phone, avatar_url, timezone, language, currency_preference, is_active, is_verified, email_verified_at, last_login_at, login_count, failed_login_attempts, locked_until, created_at, updated_at) FROM stdin;
e04747dd-bbe9-4d24-adcf-1c088e3c3491	admin@finapp.com	\N	$2b$12$KPg1vbozHHnAzbBRBkYdOOx3Q9kYBmg44XS4JZFDK1U9st..iQpcy	Admin	User	+86 10 8765 4321	\N	UTC	zh-CN	CNY	t	t	\N	2025-11-07 21:19:41.128+08	0	0	\N	2025-11-07 21:17:25.336+08	2025-11-07 21:19:41.128+08
a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	testapi@finapp.com	\N	$2b$12$CngaJ48leb94pf7hX/ku1euMpsLvtgcLF3q6WvYOhzTMUq5MeYs.u	Jason		+86 10 1234 5678	\N	Asia/Shanghai	zh-CN	CNY	t	t	\N	2025-11-07 21:29:57.447+08	0	0	\N	2025-11-07 21:17:24.904+08	2025-11-07 21:31:24.854+08
\.


--
-- Data for Name: wealth_product_details; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.wealth_product_details (id, asset_id, product_type, risk_level, expected_return, min_return, max_return, return_type, issue_date, start_date, maturity_date, lock_period, min_investment, max_investment, investment_increment, issuer, product_code, early_redemption, redemption_fee, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: asset_prices; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.asset_prices (id, asset_id, price_date, open_price, high_price, low_price, close_price, volume, adjusted_close, currency, data_source, created_at) FROM stdin;
\.


--
-- Data for Name: asset_types; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.asset_types (id, code, name, category, description, is_active, created_at) FROM stdin;
69bcd777-7604-4e76-9ce2-fabbadfbc440	STOCK	股票	equity	普通股票	t	2025-11-07 20:37:50.506681+08
0f9ab4f3-972e-43d6-9408-a484c9a1a041	ETF	交易所交易基金	fund	在交易所交易的指数基金	t	2025-11-07 20:37:50.506681+08
8616eafb-743d-458b-811a-fd4f45972fc3	MUTUAL_FUND	共同基金	fund	开放式基金	t	2025-11-07 20:37:50.506681+08
da6a3219-2479-4926-844d-5f60ebfe41aa	BOND	债券	fixed_income	政府或企业债券	t	2025-11-07 20:37:50.506681+08
80634d26-c443-4f06-8008-63aa32d79e2e	OPTION	期权	derivative	股票期权合约	t	2025-11-07 20:37:50.506681+08
872a1de0-a165-47d9-b06f-9fd8fd0a0d2a	FUTURE	期货	derivative	期货合约	t	2025-11-07 20:37:50.506681+08
923e9701-bf7b-49d3-9b61-eb7af43d602c	CRYPTO	加密货币	crypto	数字货币	t	2025-11-07 20:37:50.506681+08
c7a568c1-edbf-45dc-8566-add099f23906	CASH	现金	cash	现金及现金等价物	t	2025-11-07 20:37:50.506681+08
8afad30b-8184-41a5-b34b-b608225f4fbd	COMMODITY	商品	commodity	贵金属、原油等商品	t	2025-11-07 20:37:50.506681+08
3ff57144-fd98-4999-bb9b-03d4878223b5	REIT	房地产投资信托	real_estate	房地产投资信托基金	t	2025-11-07 20:37:50.506681+08
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.assets (id, symbol, name, asset_type_id, market_id, currency, isin, cusip, sector, industry, description, metadata, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.audit_logs (id, user_id, table_name, record_id, action, old_values, new_values, changed_fields, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: benchmark_prices; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.benchmark_prices (id, benchmark_id, price_date, price, currency, created_at) FROM stdin;
\.


--
-- Data for Name: benchmarks; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.benchmarks (id, name, symbol, description, asset_class, currency, data_source, is_active, created_at) FROM stdin;
10d6e355-01c0-4c1f-8bd8-aaa54446d4cd	沪深300指数	CSI300	沪深300指数，反映A股市场整体表现	equity	CNY	\N	t	2025-11-07 20:37:50.510462+08
2cc3c56a-87c5-4355-b572-17c5fa1a83a9	上证指数	SHCOMP	上海证券交易所综合股价指数	equity	CNY	\N	t	2025-11-07 20:37:50.510462+08
ae3cf127-5dd1-43c6-99bc-827ae1799509	深证成指	SZCOMP	深圳证券交易所成份股价指数	equity	CNY	\N	t	2025-11-07 20:37:50.510462+08
6a517bb3-67cd-44b1-b6c2-735703840de5	恒生指数	HSI	香港恒生指数	equity	HKD	\N	t	2025-11-07 20:37:50.510462+08
cc5c1be2-2754-4296-9c37-1a37758522ec	标普500指数	SPX	标准普尔500指数	equity	USD	\N	t	2025-11-07 20:37:50.510462+08
6659ec57-b45c-4d6f-9f85-791ddba0aca2	纳斯达克指数	IXIC	纳斯达克综合指数	equity	USD	\N	t	2025-11-07 20:37:50.510462+08
e0e808fb-f21d-4988-8f22-e41337868f2c	日经225指数	N225	日经225指数	equity	JPY	\N	t	2025-11-07 20:37:50.510462+08
d646987a-83a6-4f2f-873d-ee7906292bb1	富时100指数	UKX	英国富时100指数	equity	GBP	\N	t	2025-11-07 20:37:50.510462+08
0c0b3a4c-8c8f-4320-8421-af90f1b651ad	DAX指数	DAX	德国DAX指数	equity	EUR	\N	t	2025-11-07 20:37:50.510462+08
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.email_verification_tokens (id, user_id, token_hash, email, expires_at, verified_at, created_at) FROM stdin;
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.exchange_rates (id, from_currency, to_currency, rate_date, rate, data_source, created_at) FROM stdin;
c01cc66e-216b-4100-a24a-e595abbccb10	USD	CNY	2025-11-07	7.20000000	manual	2025-11-07 20:37:50.511495+08
2e5338a4-478d-4bf1-b7f8-ecfb27fdf6c5	HKD	CNY	2025-11-07	0.92000000	manual	2025-11-07 20:37:50.511495+08
ccba404d-5084-4d76-ab7b-4eb4a845ca28	JPY	CNY	2025-11-07	0.04800000	manual	2025-11-07 20:37:50.511495+08
8dd5ab6a-44f9-44ed-87de-585381784ddf	EUR	CNY	2025-11-07	7.80000000	manual	2025-11-07 20:37:50.511495+08
a1a0c810-b051-4da3-9fc4-8b0d675e25f2	GBP	CNY	2025-11-07	9.10000000	manual	2025-11-07 20:37:50.511495+08
3ee7ef26-e69e-45ff-a321-ad4f28d50485	CNY	USD	2025-11-07	0.13890000	manual	2025-11-07 20:37:50.511495+08
7d055819-8893-476c-aeda-18a4e89e4b16	CNY	HKD	2025-11-07	1.08700000	manual	2025-11-07 20:37:50.511495+08
85a56ad3-50ff-4dcb-93d3-1344121cbfd1	CNY	JPY	2025-11-07	20.83330000	manual	2025-11-07 20:37:50.511495+08
f96571bf-8f8c-480c-a4eb-65965fb0db82	CNY	EUR	2025-11-07	0.12820000	manual	2025-11-07 20:37:50.511495+08
899d3d8f-c3eb-4687-9d2e-5138b3dd506e	CNY	GBP	2025-11-07	0.10990000	manual	2025-11-07 20:37:50.511495+08
\.


--
-- Data for Name: liquidity_tags; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.liquidity_tags (id, name, description, color, sort_order, is_active, created_at) FROM stdin;
b6d9da25-d0ce-4bca-9253-d1d7ed63a70c	高流动性	大盘股、主要ETF等高流动性资产	#22c55e	1	t	2025-11-07 20:37:50.508391+08
23fc8fc7-fc39-4a3d-b994-ae8eccfbadca	中等流动性	中盘股、部分基金等中等流动性资产	#f59e0b	2	t	2025-11-07 20:37:50.508391+08
1cc2f5cc-7d93-4ccd-a261-4f259ff1d7d5	低流动性	小盘股、私募基金等低流动性资产	#ef4444	3	t	2025-11-07 20:37:50.508391+08
68a43122-aba5-4c91-a173-a44a08f73ab8	锁定期	有锁定期限制的资产	#8b5cf6	4	t	2025-11-07 20:37:50.508391+08
04cb9d00-1029-4e11-898b-44fd864c84c8	不可交易	暂停交易或退市的资产	#6b7280	5	t	2025-11-07 20:37:50.508391+08
\.


--
-- Data for Name: markets; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.markets (id, code, name, country, currency, timezone, trading_hours, holidays, is_active, created_at, updated_at) FROM stdin;
f999a5fb-414f-445e-9c50-462214781ed0	SSE	上海证券交易所	CHN	CNY	Asia/Shanghai	{"open": "09:30", "close": "15:00", "lunch_break": {"end": "13:00", "start": "11:30"}}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
96179b90-7208-4a4c-ad01-a6c5c4c345c1	SZSE	深圳证券交易所	CHN	CNY	Asia/Shanghai	{"open": "09:30", "close": "15:00", "lunch_break": {"end": "13:00", "start": "11:30"}}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
1bd28043-093d-4794-a4f6-38b961fc1614	HKEX	香港交易所	HKG	HKD	Asia/Hong_Kong	{"open": "09:30", "close": "16:00", "lunch_break": {"end": "13:00", "start": "12:00"}}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
1cefc02a-e99f-4e09-bad4-773c281d4bd6	NYSE	纽约证券交易所	USA	USD	America/New_York	{"open": "09:30", "close": "16:00"}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
c014db1e-0629-4e9d-b704-b73d8e3d4f0f	NASDAQ	纳斯达克	USA	USD	America/New_York	{"open": "09:30", "close": "16:00"}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
9187f350-df32-4ffd-baeb-7f64afb2cdb7	TSE	东京证券交易所	JPN	JPY	Asia/Tokyo	{"open": "09:00", "close": "15:00", "lunch_break": {"end": "12:30", "start": "11:30"}}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
e37cc414-b563-4d78-ab52-e4c5bc9c0108	LSE	伦敦证券交易所	GBR	GBP	Europe/London	{"open": "08:00", "close": "16:30"}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
0c2ae5d6-bd49-4d80-940b-704008bda5d5	FWB	法兰克福证券交易所	DEU	EUR	Europe/Berlin	{"open": "09:00", "close": "17:30"}	\N	t	2025-11-07 20:37:50.507585+08	2025-11-07 20:37:50.507585+08
\.


--
-- Data for Name: option_details; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.option_details (id, asset_id, underlying_asset_id, option_type, strike_price, expiration_date, contract_size, exercise_style, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.permissions (id, name, resource, action, description, created_at) FROM stdin;
cfea6186-62c8-4b3e-abfb-c81905aed9fc	users.create	users	create	创建用户	2025-11-07 20:37:50.501561+08
ea335b30-6c85-43e9-b9ff-711571342403	users.read	users	read	查看用户信息	2025-11-07 20:37:50.501561+08
d0459fcf-9155-4ef8-af0a-edd0d94b32ee	users.update	users	update	更新用户信息	2025-11-07 20:37:50.501561+08
f0bbb563-f1d6-4334-94c1-d00aa7962407	users.delete	users	delete	删除用户	2025-11-07 20:37:50.501561+08
d4b15ebc-7ae4-4a5e-ae16-34b249792989	portfolios.create	portfolios	create	创建投资组合	2025-11-07 20:37:50.501561+08
a22f3316-86f1-4d7b-912a-ffec9fff0d6c	portfolios.read	portfolios	read	查看投资组合	2025-11-07 20:37:50.501561+08
096d4047-bac5-4bf2-ae3a-d516c449b48e	portfolios.update	portfolios	update	更新投资组合	2025-11-07 20:37:50.501561+08
7d201d1f-96c1-4b69-a829-87e0e3845b2a	portfolios.delete	portfolios	delete	删除投资组合	2025-11-07 20:37:50.501561+08
0d6ec5f1-789b-45af-806e-47100da555f4	accounts.create	trading_accounts	create	创建交易账户	2025-11-07 20:37:50.501561+08
c624ee32-b553-4244-8a0c-2050465a9623	accounts.read	trading_accounts	read	查看交易账户	2025-11-07 20:37:50.501561+08
7341a05c-da3b-4739-9dfd-eaf819a014b6	accounts.update	trading_accounts	update	更新交易账户	2025-11-07 20:37:50.501561+08
32ae4e88-42e0-4594-98b9-2cee8fcf716e	accounts.delete	trading_accounts	delete	删除交易账户	2025-11-07 20:37:50.501561+08
15434351-d5f9-4cab-9dad-c183a4ef1575	transactions.create	transactions	create	创建交易记录	2025-11-07 20:37:50.501561+08
b9053248-fdfb-4734-8ba2-be991d59d52f	transactions.read	transactions	read	查看交易记录	2025-11-07 20:37:50.501561+08
f3ee0981-5c2a-4b0a-a826-3d70d112c1c1	transactions.update	transactions	update	更新交易记录	2025-11-07 20:37:50.501561+08
5ff1f467-b1bc-4e4c-a590-89c282096518	transactions.delete	transactions	delete	删除交易记录	2025-11-07 20:37:50.501561+08
aaac51da-aec2-4027-a78d-42d2f523f2d4	transactions.import	transactions	import	批量导入交易记录	2025-11-07 20:37:50.501561+08
b9ad6bef-ffb9-4c13-aa81-f16910f9ad3f	assets.create	assets	create	创建资产	2025-11-07 20:37:50.501561+08
72b8d6da-754b-4083-9cdf-2a251f8d6adb	assets.read	assets	read	查看资产信息	2025-11-07 20:37:50.501561+08
028ad711-52f7-4e19-bae1-b3b3977292db	assets.update	assets	update	更新资产信息	2025-11-07 20:37:50.501561+08
733a755a-781c-4f2b-848b-e48e28e9c504	assets.delete	assets	delete	删除资产	2025-11-07 20:37:50.501561+08
902a61ea-a904-4ea0-bff3-1ba041ed5be0	reports.create	reports	create	创建报表	2025-11-07 20:37:50.501561+08
aadbf74b-d91c-4b01-bf3a-45a9e7d803bf	reports.read	reports	read	查看报表	2025-11-07 20:37:50.501561+08
b6a43b66-a24d-4ff1-852f-6dd7130a427f	reports.update	reports	update	更新报表	2025-11-07 20:37:50.501561+08
6cfe96ff-09af-42ef-9fda-cfcf349eb518	reports.delete	reports	delete	删除报表	2025-11-07 20:37:50.501561+08
39584463-d9f5-449c-bba0-44d02580dcdb	reports.export	reports	export	导出报表	2025-11-07 20:37:50.501561+08
6381d308-4c2d-43a2-9662-15ced4e87c3e	system.config	system	config	系统配置管理	2025-11-07 20:37:50.501561+08
142f03b1-a24f-4346-9c9f-4fe5187ba829	system.logs	system	logs	查看系统日志	2025-11-07 20:37:50.501561+08
4902d6c6-845e-4247-a7e8-9eea1c512f8e	system.backup	system	backup	数据备份管理	2025-11-07 20:37:50.501561+08
\.


--
-- Data for Name: portfolios; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.portfolios (id, user_id, name, description, base_currency, is_default, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.positions (id, portfolio_id, trading_account_id, asset_id, quantity, average_cost, total_cost, currency, first_purchase_date, last_transaction_date, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: report_executions; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.report_executions (id, report_id, execution_status, started_at, completed_at, file_path, file_size, error_message, metadata) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.reports (id, user_id, portfolio_id, name, description, report_type, parameters, schedule, is_scheduled, is_active, last_generated_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
1c6228cf-f559-49bc-b92f-835dfaaf2145	1f1bf9e1-758f-4be9-8aed-93ce84986f44	cfea6186-62c8-4b3e-abfb-c81905aed9fc	2025-11-07 20:37:50.503104+08
2de9830c-2b90-459c-80eb-9ada2f260361	1f1bf9e1-758f-4be9-8aed-93ce84986f44	ea335b30-6c85-43e9-b9ff-711571342403	2025-11-07 20:37:50.503104+08
7fbb2227-f8f8-4a33-9c6e-a994d8fc7ad3	802fd45d-95dd-4548-a7d6-e09808832ae7	ea335b30-6c85-43e9-b9ff-711571342403	2025-11-07 20:37:50.503104+08
b6a967c5-70dd-492a-adb1-2344f00a2d73	660d9712-b07c-4519-8a84-9da637180dfd	ea335b30-6c85-43e9-b9ff-711571342403	2025-11-07 20:37:50.503104+08
28fd9e7c-785a-49d1-a129-894beaaec763	1f1bf9e1-758f-4be9-8aed-93ce84986f44	d0459fcf-9155-4ef8-af0a-edd0d94b32ee	2025-11-07 20:37:50.503104+08
86a48c0a-a06d-4d42-a16a-71020c3f9a39	802fd45d-95dd-4548-a7d6-e09808832ae7	d0459fcf-9155-4ef8-af0a-edd0d94b32ee	2025-11-07 20:37:50.503104+08
5777b665-a90e-45b4-b86d-2acad46f4a05	1f1bf9e1-758f-4be9-8aed-93ce84986f44	f0bbb563-f1d6-4334-94c1-d00aa7962407	2025-11-07 20:37:50.503104+08
bab7a8e5-0933-4b59-ac45-ec3be48867f3	1f1bf9e1-758f-4be9-8aed-93ce84986f44	d4b15ebc-7ae4-4a5e-ae16-34b249792989	2025-11-07 20:37:50.503104+08
7e18ac8b-eec5-45d3-9a76-e9436ba15568	802fd45d-95dd-4548-a7d6-e09808832ae7	d4b15ebc-7ae4-4a5e-ae16-34b249792989	2025-11-07 20:37:50.503104+08
1141dfeb-8ba7-4f47-b1d2-aa169840bb82	1f1bf9e1-758f-4be9-8aed-93ce84986f44	a22f3316-86f1-4d7b-912a-ffec9fff0d6c	2025-11-07 20:37:50.503104+08
08e7c34e-bfd2-4aea-9aee-19e543eeed3c	802fd45d-95dd-4548-a7d6-e09808832ae7	a22f3316-86f1-4d7b-912a-ffec9fff0d6c	2025-11-07 20:37:50.503104+08
3ebd9397-213f-46f4-a354-9b697ab648e4	660d9712-b07c-4519-8a84-9da637180dfd	a22f3316-86f1-4d7b-912a-ffec9fff0d6c	2025-11-07 20:37:50.503104+08
598061dd-dc89-4dc0-a6a3-d3539a3d112d	1f1bf9e1-758f-4be9-8aed-93ce84986f44	096d4047-bac5-4bf2-ae3a-d516c449b48e	2025-11-07 20:37:50.503104+08
9f1172af-5f5b-494a-9456-e8f3d20b9750	802fd45d-95dd-4548-a7d6-e09808832ae7	096d4047-bac5-4bf2-ae3a-d516c449b48e	2025-11-07 20:37:50.503104+08
3f33a2a6-cf29-4fa5-95db-3471883a6967	1f1bf9e1-758f-4be9-8aed-93ce84986f44	7d201d1f-96c1-4b69-a829-87e0e3845b2a	2025-11-07 20:37:50.503104+08
9926dd2f-1a81-46f3-82d5-2fa54c5aadb7	1f1bf9e1-758f-4be9-8aed-93ce84986f44	0d6ec5f1-789b-45af-806e-47100da555f4	2025-11-07 20:37:50.503104+08
050d4379-daf9-4b31-8942-be42c3df3de6	802fd45d-95dd-4548-a7d6-e09808832ae7	0d6ec5f1-789b-45af-806e-47100da555f4	2025-11-07 20:37:50.503104+08
e8a046ec-0bac-4db1-bb79-6c9e7d64f2c4	1f1bf9e1-758f-4be9-8aed-93ce84986f44	c624ee32-b553-4244-8a0c-2050465a9623	2025-11-07 20:37:50.503104+08
8b950b7b-0fcd-4546-984b-f11ec231e5e1	802fd45d-95dd-4548-a7d6-e09808832ae7	c624ee32-b553-4244-8a0c-2050465a9623	2025-11-07 20:37:50.503104+08
d073e28c-8f4c-4550-ab2d-976fb619f34a	660d9712-b07c-4519-8a84-9da637180dfd	c624ee32-b553-4244-8a0c-2050465a9623	2025-11-07 20:37:50.503104+08
5493d02b-ee58-401e-b5ca-6a96bb5caa0f	1f1bf9e1-758f-4be9-8aed-93ce84986f44	7341a05c-da3b-4739-9dfd-eaf819a014b6	2025-11-07 20:37:50.503104+08
06ee4715-aa05-44b8-b0cb-be110ea86411	802fd45d-95dd-4548-a7d6-e09808832ae7	7341a05c-da3b-4739-9dfd-eaf819a014b6	2025-11-07 20:37:50.503104+08
6ffe0421-e098-476b-9b1f-3e4dda86baf8	1f1bf9e1-758f-4be9-8aed-93ce84986f44	32ae4e88-42e0-4594-98b9-2cee8fcf716e	2025-11-07 20:37:50.503104+08
65e4da36-2341-451d-abae-836f157aed60	1f1bf9e1-758f-4be9-8aed-93ce84986f44	15434351-d5f9-4cab-9dad-c183a4ef1575	2025-11-07 20:37:50.503104+08
78fc81e0-c8b3-475a-8533-ddbe15706a25	802fd45d-95dd-4548-a7d6-e09808832ae7	15434351-d5f9-4cab-9dad-c183a4ef1575	2025-11-07 20:37:50.503104+08
dcd2c76b-c534-4a41-b7d3-08d573bf32f1	1f1bf9e1-758f-4be9-8aed-93ce84986f44	b9053248-fdfb-4734-8ba2-be991d59d52f	2025-11-07 20:37:50.503104+08
fb30803a-2eae-457c-8d04-b92892f7b7dc	802fd45d-95dd-4548-a7d6-e09808832ae7	b9053248-fdfb-4734-8ba2-be991d59d52f	2025-11-07 20:37:50.503104+08
cc36c127-38b9-415f-9743-67bcb46d4692	660d9712-b07c-4519-8a84-9da637180dfd	b9053248-fdfb-4734-8ba2-be991d59d52f	2025-11-07 20:37:50.503104+08
a70139b0-efd2-4bcd-a735-1cfa2d46d902	1f1bf9e1-758f-4be9-8aed-93ce84986f44	f3ee0981-5c2a-4b0a-a826-3d70d112c1c1	2025-11-07 20:37:50.503104+08
6f90d00e-f71e-48e5-841e-61585cf2a107	802fd45d-95dd-4548-a7d6-e09808832ae7	f3ee0981-5c2a-4b0a-a826-3d70d112c1c1	2025-11-07 20:37:50.503104+08
1a997484-c395-4459-a160-df01663d7036	1f1bf9e1-758f-4be9-8aed-93ce84986f44	5ff1f467-b1bc-4e4c-a590-89c282096518	2025-11-07 20:37:50.503104+08
a3456c00-14f3-4c27-a73c-76fefeaa3026	1f1bf9e1-758f-4be9-8aed-93ce84986f44	aaac51da-aec2-4027-a78d-42d2f523f2d4	2025-11-07 20:37:50.503104+08
97046e7a-a28f-4815-84b3-abcbc5c360f6	802fd45d-95dd-4548-a7d6-e09808832ae7	aaac51da-aec2-4027-a78d-42d2f523f2d4	2025-11-07 20:37:50.503104+08
baf99772-34cd-422d-94a6-0db3f4a16bcf	1f1bf9e1-758f-4be9-8aed-93ce84986f44	b9ad6bef-ffb9-4c13-aa81-f16910f9ad3f	2025-11-07 20:37:50.503104+08
0b393b69-c40c-4f83-b215-be1a7b62eb6e	802fd45d-95dd-4548-a7d6-e09808832ae7	b9ad6bef-ffb9-4c13-aa81-f16910f9ad3f	2025-11-07 20:37:50.503104+08
31b70301-fa05-4f8c-ac12-11107c951d89	1f1bf9e1-758f-4be9-8aed-93ce84986f44	72b8d6da-754b-4083-9cdf-2a251f8d6adb	2025-11-07 20:37:50.503104+08
d61922c9-b6a2-46a2-ab88-2e020d9902e8	802fd45d-95dd-4548-a7d6-e09808832ae7	72b8d6da-754b-4083-9cdf-2a251f8d6adb	2025-11-07 20:37:50.503104+08
c4ec9870-1ae1-43be-8b37-4908b9bb575f	660d9712-b07c-4519-8a84-9da637180dfd	72b8d6da-754b-4083-9cdf-2a251f8d6adb	2025-11-07 20:37:50.503104+08
cd03f8d9-9e7e-4a03-acc0-41b89b97a5ee	1f1bf9e1-758f-4be9-8aed-93ce84986f44	028ad711-52f7-4e19-bae1-b3b3977292db	2025-11-07 20:37:50.503104+08
3fd1bcfc-091a-46a7-8ffb-bb2cdaabd0d1	802fd45d-95dd-4548-a7d6-e09808832ae7	028ad711-52f7-4e19-bae1-b3b3977292db	2025-11-07 20:37:50.503104+08
acf2604b-e588-4691-9c8d-68b7bef01cb8	1f1bf9e1-758f-4be9-8aed-93ce84986f44	733a755a-781c-4f2b-848b-e48e28e9c504	2025-11-07 20:37:50.503104+08
86e7f89f-8d98-4277-a9c0-ac9431f2aa24	1f1bf9e1-758f-4be9-8aed-93ce84986f44	902a61ea-a904-4ea0-bff3-1ba041ed5be0	2025-11-07 20:37:50.503104+08
71a86e31-b9dd-467a-9215-f1486e936a5f	802fd45d-95dd-4548-a7d6-e09808832ae7	902a61ea-a904-4ea0-bff3-1ba041ed5be0	2025-11-07 20:37:50.503104+08
85881fe7-0fe7-4b1d-9985-169a397d09be	1f1bf9e1-758f-4be9-8aed-93ce84986f44	aadbf74b-d91c-4b01-bf3a-45a9e7d803bf	2025-11-07 20:37:50.503104+08
4f95f0c9-39ee-465c-9f2b-792ad33cd625	802fd45d-95dd-4548-a7d6-e09808832ae7	aadbf74b-d91c-4b01-bf3a-45a9e7d803bf	2025-11-07 20:37:50.503104+08
3cf859a3-ee33-49a7-ac92-86529558a762	660d9712-b07c-4519-8a84-9da637180dfd	aadbf74b-d91c-4b01-bf3a-45a9e7d803bf	2025-11-07 20:37:50.503104+08
226097d0-6b02-4647-bffc-4e5af64a7f88	1f1bf9e1-758f-4be9-8aed-93ce84986f44	b6a43b66-a24d-4ff1-852f-6dd7130a427f	2025-11-07 20:37:50.503104+08
f98cc7e6-30a0-4346-9f15-63b5cb122d23	802fd45d-95dd-4548-a7d6-e09808832ae7	b6a43b66-a24d-4ff1-852f-6dd7130a427f	2025-11-07 20:37:50.503104+08
e746fdaf-d111-472f-90fe-63c923067476	1f1bf9e1-758f-4be9-8aed-93ce84986f44	6cfe96ff-09af-42ef-9fda-cfcf349eb518	2025-11-07 20:37:50.503104+08
f1be91e8-e81e-4da5-b06a-2d8400e1937a	1f1bf9e1-758f-4be9-8aed-93ce84986f44	39584463-d9f5-449c-bba0-44d02580dcdb	2025-11-07 20:37:50.503104+08
48794cc7-7a28-461a-bc3b-d42a8806a6d6	802fd45d-95dd-4548-a7d6-e09808832ae7	39584463-d9f5-449c-bba0-44d02580dcdb	2025-11-07 20:37:50.503104+08
8398cd4b-4485-4e47-8e5f-f215724d9f57	1f1bf9e1-758f-4be9-8aed-93ce84986f44	6381d308-4c2d-43a2-9662-15ced4e87c3e	2025-11-07 20:37:50.503104+08
42cfff39-2bdb-49cf-bec3-5926b4b4e163	1f1bf9e1-758f-4be9-8aed-93ce84986f44	142f03b1-a24f-4346-9c9f-4fe5187ba829	2025-11-07 20:37:50.503104+08
f834d16a-4e94-441b-9438-6ae205b7a231	1f1bf9e1-758f-4be9-8aed-93ce84986f44	4902d6c6-845e-4247-a7e8-9eea1c512f8e	2025-11-07 20:37:50.503104+08
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.roles (id, name, description, is_active, created_at, updated_at) FROM stdin;
1f1bf9e1-758f-4be9-8aed-93ce84986f44	admin	系统管理员，拥有所有权限	t	2025-11-07 20:37:50.495427+08	2025-11-07 20:37:50.495427+08
802fd45d-95dd-4548-a7d6-e09808832ae7	user	普通用户，拥有基本功能权限	t	2025-11-07 20:37:50.495427+08	2025-11-07 20:37:50.495427+08
660d9712-b07c-4519-8a84-9da637180dfd	viewer	只读用户，只能查看数据	t	2025-11-07 20:37:50.495427+08	2025-11-07 20:37:50.495427+08
\.


--
-- Data for Name: trading_accounts; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.trading_accounts (id, portfolio_id, name, account_type, broker_name, account_number, currency, initial_balance, current_balance, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, fees, taxes, currency, exchange_rate, transaction_date, settlement_date, notes, tags, liquidity_tag_id, external_id, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.user_sessions (id, user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, is_active, expires_at, created_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: caojun
--

COPY public.users (id, email, username, password_hash, first_name, last_name, phone, avatar_url, timezone, language, currency_preference, is_active, is_verified, email_verified_at, last_login_at, login_count, failed_login_attempts, locked_until, created_at, updated_at) FROM stdin;
\.


--
-- Name: portfolio_tags_id_seq; Type: SEQUENCE SET; Schema: finapp; Owner: finapp_user
--

SELECT pg_catalog.setval('finapp.portfolio_tags_id_seq', 1, false);


--
-- Name: tag_categories_id_seq; Type: SEQUENCE SET; Schema: finapp; Owner: finapp_user
--

SELECT pg_catalog.setval('finapp.tag_categories_id_seq', 1, false);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: finapp; Owner: finapp_user
--

SELECT pg_catalog.setval('finapp.tags_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: asset_prices asset_prices_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.asset_prices
    ADD CONSTRAINT asset_prices_pkey PRIMARY KEY (id);


--
-- Name: asset_types asset_types_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.asset_types
    ADD CONSTRAINT asset_types_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: benchmark_prices benchmark_prices_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.benchmark_prices
    ADD CONSTRAINT benchmark_prices_pkey PRIMARY KEY (id);


--
-- Name: benchmarks benchmarks_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.benchmarks
    ADD CONSTRAINT benchmarks_pkey PRIMARY KEY (id);


--
-- Name: bond_details bond_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.bond_details
    ADD CONSTRAINT bond_details_pkey PRIMARY KEY (id);


--
-- Name: cash_flows cash_flows_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.cash_flows
    ADD CONSTRAINT cash_flows_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: fund_details fund_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.fund_details
    ADD CONSTRAINT fund_details_pkey PRIMARY KEY (id);


--
-- Name: futures_details futures_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.futures_details
    ADD CONSTRAINT futures_details_pkey PRIMARY KEY (id);


--
-- Name: liquidity_tags liquidity_tags_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.liquidity_tags
    ADD CONSTRAINT liquidity_tags_pkey PRIMARY KEY (id);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: option_details option_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.option_details
    ADD CONSTRAINT option_details_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: portfolio_snapshots portfolio_snapshots_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_pkey PRIMARY KEY (id);


--
-- Name: portfolio_tags portfolio_tags_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolio_tags
    ADD CONSTRAINT portfolio_tags_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: position_snapshots position_snapshots_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.position_snapshots
    ADD CONSTRAINT position_snapshots_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: price_data_sources price_data_sources_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_data_sources
    ADD CONSTRAINT price_data_sources_pkey PRIMARY KEY (id);


--
-- Name: price_sync_errors price_sync_errors_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_errors
    ADD CONSTRAINT price_sync_errors_pkey PRIMARY KEY (id);


--
-- Name: price_sync_logs price_sync_logs_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_logs
    ADD CONSTRAINT price_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: price_sync_tasks price_sync_tasks_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_tasks
    ADD CONSTRAINT price_sync_tasks_pkey PRIMARY KEY (id);


--
-- Name: report_executions report_executions_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.report_executions
    ADD CONSTRAINT report_executions_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: stock_details stock_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.stock_details
    ADD CONSTRAINT stock_details_pkey PRIMARY KEY (id);


--
-- Name: stock_option_details stock_option_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.stock_option_details
    ADD CONSTRAINT stock_option_details_pkey PRIMARY KEY (id);


--
-- Name: tag_categories tag_categories_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tag_categories
    ADD CONSTRAINT tag_categories_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: trading_accounts trading_accounts_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.trading_accounts
    ADD CONSTRAINT trading_accounts_pkey PRIMARY KEY (id);


--
-- Name: transaction_tag_mappings transaction_tag_mappings_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transaction_tag_mappings
    ADD CONSTRAINT transaction_tag_mappings_pkey PRIMARY KEY (transaction_id, tag_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: treasury_details treasury_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.treasury_details
    ADD CONSTRAINT treasury_details_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wealth_product_details wealth_product_details_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.wealth_product_details
    ADD CONSTRAINT wealth_product_details_pkey PRIMARY KEY (id);


--
-- Name: asset_prices asset_prices_asset_id_price_date_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.asset_prices
    ADD CONSTRAINT asset_prices_asset_id_price_date_key UNIQUE (asset_id, price_date);


--
-- Name: asset_prices asset_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.asset_prices
    ADD CONSTRAINT asset_prices_pkey PRIMARY KEY (id);


--
-- Name: asset_types asset_types_code_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.asset_types
    ADD CONSTRAINT asset_types_code_key UNIQUE (code);


--
-- Name: asset_types asset_types_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.asset_types
    ADD CONSTRAINT asset_types_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assets assets_symbol_market_id_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_symbol_market_id_key UNIQUE (symbol, market_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: benchmark_prices benchmark_prices_benchmark_id_price_date_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.benchmark_prices
    ADD CONSTRAINT benchmark_prices_benchmark_id_price_date_key UNIQUE (benchmark_id, price_date);


--
-- Name: benchmark_prices benchmark_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.benchmark_prices
    ADD CONSTRAINT benchmark_prices_pkey PRIMARY KEY (id);


--
-- Name: benchmarks benchmarks_name_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.benchmarks
    ADD CONSTRAINT benchmarks_name_key UNIQUE (name);


--
-- Name: benchmarks benchmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.benchmarks
    ADD CONSTRAINT benchmarks_pkey PRIMARY KEY (id);


--
-- Name: benchmarks benchmarks_symbol_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.benchmarks
    ADD CONSTRAINT benchmarks_symbol_key UNIQUE (symbol);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_from_currency_to_currency_rate_date_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_from_currency_to_currency_rate_date_key UNIQUE (from_currency, to_currency, rate_date);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: liquidity_tags liquidity_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.liquidity_tags
    ADD CONSTRAINT liquidity_tags_name_key UNIQUE (name);


--
-- Name: liquidity_tags liquidity_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.liquidity_tags
    ADD CONSTRAINT liquidity_tags_pkey PRIMARY KEY (id);


--
-- Name: markets markets_code_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_code_key UNIQUE (code);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: option_details option_details_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.option_details
    ADD CONSTRAINT option_details_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_user_id_name_key UNIQUE (user_id, name);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: positions positions_portfolio_id_trading_account_id_asset_id_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_portfolio_id_trading_account_id_asset_id_key UNIQUE (portfolio_id, trading_account_id, asset_id);


--
-- Name: report_executions report_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.report_executions
    ADD CONSTRAINT report_executions_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: trading_accounts trading_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.trading_accounts
    ADD CONSTRAINT trading_accounts_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: asset_prices_asset_id_price_date_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX asset_prices_asset_id_price_date_key ON finapp.asset_prices USING btree (asset_id, price_date);


--
-- Name: asset_types_code_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX asset_types_code_key ON finapp.asset_types USING btree (code);


--
-- Name: assets_symbol_market_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX assets_symbol_market_id_key ON finapp.assets USING btree (symbol, market_id);


--
-- Name: benchmark_prices_benchmark_id_price_date_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX benchmark_prices_benchmark_id_price_date_key ON finapp.benchmark_prices USING btree (benchmark_id, price_date);


--
-- Name: benchmarks_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX benchmarks_name_key ON finapp.benchmarks USING btree (name);


--
-- Name: benchmarks_symbol_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX benchmarks_symbol_key ON finapp.benchmarks USING btree (symbol);


--
-- Name: bond_details_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX bond_details_asset_id_key ON finapp.bond_details USING btree (asset_id);


--
-- Name: exchange_rates_from_currency_to_currency_rate_date_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX exchange_rates_from_currency_to_currency_rate_date_key ON finapp.exchange_rates USING btree (from_currency, to_currency, rate_date);


--
-- Name: fund_details_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX fund_details_asset_id_key ON finapp.fund_details USING btree (asset_id);


--
-- Name: futures_details_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX futures_details_asset_id_key ON finapp.futures_details USING btree (asset_id);


--
-- Name: idx_asset_prices_asset_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_prices_asset_date ON finapp.asset_prices USING btree (asset_id, price_date);


--
-- Name: idx_asset_prices_asset_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_prices_asset_id ON finapp.asset_prices USING btree (asset_id);


--
-- Name: idx_asset_prices_created_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_prices_created_at ON finapp.asset_prices USING btree (created_at);


--
-- Name: idx_asset_prices_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_prices_date ON finapp.asset_prices USING btree (price_date);


--
-- Name: idx_asset_prices_price_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_prices_price_date ON finapp.asset_prices USING btree (price_date);


--
-- Name: idx_asset_types_category; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_types_category ON finapp.asset_types USING btree (category);


--
-- Name: idx_asset_types_code; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_types_code ON finapp.asset_types USING btree (code);


--
-- Name: idx_asset_types_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_types_is_active ON finapp.asset_types USING btree (is_active);


--
-- Name: idx_assets_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_active ON finapp.assets USING btree (is_active);


--
-- Name: idx_assets_asset_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_asset_type ON finapp.assets USING btree (asset_type_id);


--
-- Name: idx_assets_asset_type_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_asset_type_id ON finapp.assets USING btree (asset_type_id);


--
-- Name: idx_assets_created_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_created_at ON finapp.assets USING btree (created_at);


--
-- Name: idx_assets_currency; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_currency ON finapp.assets USING btree (currency);


--
-- Name: idx_assets_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_is_active ON finapp.assets USING btree (is_active);


--
-- Name: idx_assets_market; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_market ON finapp.assets USING btree (market_id);


--
-- Name: idx_assets_market_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_market_id ON finapp.assets USING btree (market_id);


--
-- Name: idx_assets_sector; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_sector ON finapp.assets USING btree (sector);


--
-- Name: idx_assets_symbol; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_symbol ON finapp.assets USING btree (symbol);


--
-- Name: idx_assets_symbol_market; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_symbol_market ON finapp.assets USING btree (symbol, market_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_audit_logs_action ON finapp.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_audit_logs_created_at ON finapp.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_record_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_audit_logs_record_id ON finapp.audit_logs USING btree (record_id);


--
-- Name: idx_audit_logs_table_name; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_audit_logs_table_name ON finapp.audit_logs USING btree (table_name);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_audit_logs_user_id ON finapp.audit_logs USING btree (user_id);


--
-- Name: idx_benchmark_prices_benchmark_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_benchmark_prices_benchmark_date ON finapp.benchmark_prices USING btree (benchmark_id, price_date);


--
-- Name: idx_benchmark_prices_benchmark_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_benchmark_prices_benchmark_id ON finapp.benchmark_prices USING btree (benchmark_id);


--
-- Name: idx_benchmark_prices_price_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_benchmark_prices_price_date ON finapp.benchmark_prices USING btree (price_date);


--
-- Name: idx_benchmarks_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_benchmarks_is_active ON finapp.benchmarks USING btree (is_active);


--
-- Name: idx_benchmarks_symbol; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_benchmarks_symbol ON finapp.benchmarks USING btree (symbol);


--
-- Name: idx_bond_details_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_bond_details_asset ON finapp.bond_details USING btree (asset_id);


--
-- Name: idx_bond_details_maturity; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_bond_details_maturity ON finapp.bond_details USING btree (maturity_date);


--
-- Name: idx_bond_details_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_bond_details_type ON finapp.bond_details USING btree (bond_type);


--
-- Name: idx_cash_flows_asset_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_asset_id ON finapp.cash_flows USING btree (asset_id);


--
-- Name: idx_cash_flows_category; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_category ON finapp.cash_flows USING btree (category);


--
-- Name: idx_cash_flows_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_date ON finapp.cash_flows USING btree (date);


--
-- Name: idx_cash_flows_flow_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_flow_date ON finapp.cash_flows USING btree (flow_date);


--
-- Name: idx_cash_flows_flow_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_flow_type ON finapp.cash_flows USING btree (flow_type);


--
-- Name: idx_cash_flows_portfolio_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_portfolio_id ON finapp.cash_flows USING btree (portfolio_id);


--
-- Name: idx_cash_flows_trading_account_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_trading_account_id ON finapp.cash_flows USING btree (trading_account_id);


--
-- Name: idx_cash_flows_transaction_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_cash_flows_transaction_id ON finapp.cash_flows USING btree (transaction_id);


--
-- Name: idx_email_verification_tokens_expires_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_email_verification_tokens_expires_at ON finapp.email_verification_tokens USING btree (expires_at);


--
-- Name: idx_email_verification_tokens_token_hash; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_email_verification_tokens_token_hash ON finapp.email_verification_tokens USING btree (token_hash);


--
-- Name: idx_email_verification_tokens_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_email_verification_tokens_user_id ON finapp.email_verification_tokens USING btree (user_id);


--
-- Name: idx_exchange_rates_currencies; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_exchange_rates_currencies ON finapp.exchange_rates USING btree (from_currency, to_currency);


--
-- Name: idx_exchange_rates_currencies_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_exchange_rates_currencies_date ON finapp.exchange_rates USING btree (from_currency, to_currency, rate_date);


--
-- Name: idx_exchange_rates_rate_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_exchange_rates_rate_date ON finapp.exchange_rates USING btree (rate_date);


--
-- Name: idx_fund_details_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_fund_details_asset ON finapp.fund_details USING btree (asset_id);


--
-- Name: idx_fund_details_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_fund_details_type ON finapp.fund_details USING btree (fund_type);


--
-- Name: idx_futures_details_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_futures_details_asset ON finapp.futures_details USING btree (asset_id);


--
-- Name: idx_futures_details_month; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_futures_details_month ON finapp.futures_details USING btree (contract_month);


--
-- Name: idx_futures_details_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_futures_details_type ON finapp.futures_details USING btree (futures_type);


--
-- Name: idx_liquidity_tags_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_liquidity_tags_is_active ON finapp.liquidity_tags USING btree (is_active);


--
-- Name: idx_liquidity_tags_sort_order; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_liquidity_tags_sort_order ON finapp.liquidity_tags USING btree (sort_order);


--
-- Name: idx_markets_code; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_markets_code ON finapp.markets USING btree (code);


--
-- Name: idx_markets_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_markets_is_active ON finapp.markets USING btree (is_active);


--
-- Name: idx_option_details_asset_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_option_details_asset_id ON finapp.option_details USING btree (asset_id);


--
-- Name: idx_option_details_expiration_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_option_details_expiration_date ON finapp.option_details USING btree (expiration_date);


--
-- Name: idx_option_details_underlying_asset_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_option_details_underlying_asset_id ON finapp.option_details USING btree (underlying_asset_id);


--
-- Name: idx_password_reset_tokens_expires_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_password_reset_tokens_expires_at ON finapp.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_token_hash; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_password_reset_tokens_token_hash ON finapp.password_reset_tokens USING btree (token_hash);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_password_reset_tokens_user_id ON finapp.password_reset_tokens USING btree (user_id);


--
-- Name: idx_performance_metrics_metric_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_performance_metrics_metric_type ON finapp.performance_metrics USING btree (metric_type);


--
-- Name: idx_performance_metrics_period_dates; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_performance_metrics_period_dates ON finapp.performance_metrics USING btree (period_start, period_end);


--
-- Name: idx_performance_metrics_period_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_performance_metrics_period_type ON finapp.performance_metrics USING btree (period_type);


--
-- Name: idx_performance_metrics_portfolio_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_performance_metrics_portfolio_id ON finapp.performance_metrics USING btree (portfolio_id);


--
-- Name: idx_portfolio_snapshots_portfolio_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_portfolio_snapshots_portfolio_date ON finapp.portfolio_snapshots USING btree (portfolio_id, snapshot_date);


--
-- Name: idx_portfolio_snapshots_portfolio_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_portfolio_snapshots_portfolio_id ON finapp.portfolio_snapshots USING btree (portfolio_id);


--
-- Name: idx_portfolio_snapshots_snapshot_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_portfolio_snapshots_snapshot_date ON finapp.portfolio_snapshots USING btree (snapshot_date);


--
-- Name: idx_portfolios_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_portfolios_is_active ON finapp.portfolios USING btree (is_active);


--
-- Name: idx_portfolios_is_default; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_portfolios_is_default ON finapp.portfolios USING btree (is_default);


--
-- Name: idx_portfolios_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_portfolios_user_id ON finapp.portfolios USING btree (user_id);


--
-- Name: idx_portfolios_user_sort; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_portfolios_user_sort ON finapp.portfolios USING btree (user_id, sort_order);


--
-- Name: idx_position_snapshots_portfolio_snapshot_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_position_snapshots_portfolio_snapshot_id ON finapp.position_snapshots USING btree (portfolio_snapshot_id);


--
-- Name: idx_position_snapshots_position_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_position_snapshots_position_id ON finapp.position_snapshots USING btree (position_id);


--
-- Name: idx_position_snapshots_snapshot_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_position_snapshots_snapshot_date ON finapp.position_snapshots USING btree (snapshot_date);


--
-- Name: idx_positions_asset_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_positions_asset_id ON finapp.positions USING btree (asset_id);


--
-- Name: idx_positions_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_positions_is_active ON finapp.positions USING btree (is_active);


--
-- Name: idx_positions_portfolio_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_positions_portfolio_id ON finapp.positions USING btree (portfolio_id);


--
-- Name: idx_positions_trading_account_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_positions_trading_account_id ON finapp.positions USING btree (trading_account_id);


--
-- Name: idx_price_data_sources_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_data_sources_active ON finapp.price_data_sources USING btree (is_active);


--
-- Name: idx_price_data_sources_provider; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_data_sources_provider ON finapp.price_data_sources USING btree (provider);


--
-- Name: idx_price_sync_errors_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_errors_asset ON finapp.price_sync_errors USING btree (asset_id);


--
-- Name: idx_price_sync_errors_log; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_errors_log ON finapp.price_sync_errors USING btree (log_id);


--
-- Name: idx_price_sync_logs_started; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_logs_started ON finapp.price_sync_logs USING btree (started_at DESC);


--
-- Name: idx_price_sync_logs_status; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_logs_status ON finapp.price_sync_logs USING btree (status);


--
-- Name: idx_price_sync_logs_task; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_logs_task ON finapp.price_sync_logs USING btree (task_id);


--
-- Name: idx_price_sync_tasks_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_tasks_active ON finapp.price_sync_tasks USING btree (is_active);


--
-- Name: idx_price_sync_tasks_data_source; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_tasks_data_source ON finapp.price_sync_tasks USING btree (data_source_id);


--
-- Name: idx_price_sync_tasks_schedule; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_tasks_schedule ON finapp.price_sync_tasks USING btree (schedule_type, is_active);


--
-- Name: idx_report_executions_report_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_report_executions_report_id ON finapp.report_executions USING btree (report_id);


--
-- Name: idx_report_executions_started_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_report_executions_started_at ON finapp.report_executions USING btree (started_at);


--
-- Name: idx_report_executions_status; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_report_executions_status ON finapp.report_executions USING btree (execution_status);


--
-- Name: idx_reports_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_reports_is_active ON finapp.reports USING btree (is_active);


--
-- Name: idx_reports_is_scheduled; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_reports_is_scheduled ON finapp.reports USING btree (is_scheduled);


--
-- Name: idx_reports_portfolio_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_reports_portfolio_id ON finapp.reports USING btree (portfolio_id);


--
-- Name: idx_reports_report_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_reports_report_type ON finapp.reports USING btree (report_type);


--
-- Name: idx_reports_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_reports_user_id ON finapp.reports USING btree (user_id);


--
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_role_permissions_permission_id ON finapp.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_role_permissions_role_id ON finapp.role_permissions USING btree (role_id);


--
-- Name: idx_stock_details_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_details_asset ON finapp.stock_details USING btree (asset_id);


--
-- Name: idx_stock_details_industry; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_details_industry ON finapp.stock_details USING btree (industry);


--
-- Name: idx_stock_details_sector; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_details_sector ON finapp.stock_details USING btree (sector);


--
-- Name: idx_stock_option_details_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_option_details_asset ON finapp.stock_option_details USING btree (asset_id);


--
-- Name: idx_stock_option_details_expiration; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_option_details_expiration ON finapp.stock_option_details USING btree (expiration_date);


--
-- Name: idx_stock_option_details_strike; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_option_details_strike ON finapp.stock_option_details USING btree (strike_price);


--
-- Name: idx_stock_option_details_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_option_details_type ON finapp.stock_option_details USING btree (option_type);


--
-- Name: idx_stock_option_details_underlying; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_stock_option_details_underlying ON finapp.stock_option_details USING btree (underlying_stock_id);


--
-- Name: idx_trading_accounts_account_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_trading_accounts_account_type ON finapp.trading_accounts USING btree (account_type);


--
-- Name: idx_trading_accounts_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_trading_accounts_is_active ON finapp.trading_accounts USING btree (is_active);


--
-- Name: idx_trading_accounts_portfolio_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_trading_accounts_portfolio_id ON finapp.trading_accounts USING btree (portfolio_id);


--
-- Name: idx_transaction_tag_mappings_tag_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transaction_tag_mappings_tag_id ON finapp.transaction_tag_mappings USING btree (tag_id);


--
-- Name: idx_transaction_tag_mappings_transaction_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transaction_tag_mappings_transaction_id ON finapp.transaction_tag_mappings USING btree (transaction_id);


--
-- Name: idx_transactions_asset_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_asset_id ON finapp.transactions USING btree (asset_id);


--
-- Name: idx_transactions_executed_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_executed_at ON finapp.transactions USING btree (executed_at);


--
-- Name: idx_transactions_external_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_external_id ON finapp.transactions USING btree (external_id);


--
-- Name: idx_transactions_liquidity_tag; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_liquidity_tag ON finapp.transactions USING btree (liquidity_tag);


--
-- Name: idx_transactions_liquidity_tag_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_liquidity_tag_id ON finapp.transactions USING btree (liquidity_tag_id);


--
-- Name: idx_transactions_portfolio_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_portfolio_id ON finapp.transactions USING btree (portfolio_id);


--
-- Name: idx_transactions_side; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_side ON finapp.transactions USING btree (side);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_status ON finapp.transactions USING btree (status);


--
-- Name: idx_transactions_tags; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_tags ON finapp.transactions USING gin (tags);


--
-- Name: idx_transactions_total_amount; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_total_amount ON finapp.transactions USING btree (total_amount);


--
-- Name: idx_transactions_trading_account_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_trading_account_id ON finapp.transactions USING btree (trading_account_id);


--
-- Name: idx_transactions_transaction_date; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_transaction_date ON finapp.transactions USING btree (transaction_date);


--
-- Name: idx_transactions_transaction_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_transaction_type ON finapp.transactions USING btree (transaction_type);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_transactions_user_id ON finapp.transactions USING btree (user_id);


--
-- Name: idx_treasury_details_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_treasury_details_asset ON finapp.treasury_details USING btree (asset_id);


--
-- Name: idx_treasury_details_maturity; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_treasury_details_maturity ON finapp.treasury_details USING btree (maturity_date);


--
-- Name: idx_treasury_details_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_treasury_details_type ON finapp.treasury_details USING btree (treasury_type);


--
-- Name: idx_user_roles_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_user_roles_is_active ON finapp.user_roles USING btree (is_active);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_user_roles_role_id ON finapp.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_user_roles_user_id ON finapp.user_roles USING btree (user_id);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_user_sessions_expires_at ON finapp.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_user_sessions_is_active ON finapp.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_token_hash; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_user_sessions_token_hash ON finapp.user_sessions USING btree (token_hash);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_user_sessions_user_id ON finapp.user_sessions USING btree (user_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_users_created_at ON finapp.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_users_email ON finapp.users USING btree (email);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_users_is_active ON finapp.users USING btree (is_active);


--
-- Name: idx_users_last_login_at; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_users_last_login_at ON finapp.users USING btree (last_login_at);


--
-- Name: idx_users_username; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_users_username ON finapp.users USING btree (username);


--
-- Name: idx_wealth_details_asset; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_wealth_details_asset ON finapp.wealth_product_details USING btree (asset_id);


--
-- Name: idx_wealth_details_risk; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_wealth_details_risk ON finapp.wealth_product_details USING btree (risk_level);


--
-- Name: idx_wealth_details_type; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_wealth_details_type ON finapp.wealth_product_details USING btree (product_type);


--
-- Name: liquidity_tags_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX liquidity_tags_name_key ON finapp.liquidity_tags USING btree (name);


--
-- Name: markets_code_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX markets_code_key ON finapp.markets USING btree (code);


--
-- Name: performance_metrics_portfolio_id_metric_type_period_type_pe_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX performance_metrics_portfolio_id_metric_type_period_type_pe_key ON finapp.performance_metrics USING btree (portfolio_id, metric_type, period_type, period_start, period_end);


--
-- Name: permissions_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX permissions_name_key ON finapp.permissions USING btree (name);


--
-- Name: portfolio_snapshots_portfolio_id_snapshot_date_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX portfolio_snapshots_portfolio_id_snapshot_date_key ON finapp.portfolio_snapshots USING btree (portfolio_id, snapshot_date);


--
-- Name: portfolio_tags_portfolio_id_tag_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX portfolio_tags_portfolio_id_tag_id_key ON finapp.portfolio_tags USING btree (portfolio_id, tag_id);


--
-- Name: portfolios_user_id_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX portfolios_user_id_name_key ON finapp.portfolios USING btree (user_id, name);


--
-- Name: positions_portfolio_id_trading_account_id_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX positions_portfolio_id_trading_account_id_asset_id_key ON finapp.positions USING btree (portfolio_id, trading_account_id, asset_id);


--
-- Name: price_data_sources_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX price_data_sources_name_key ON finapp.price_data_sources USING btree (name);


--
-- Name: role_permissions_role_id_permission_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON finapp.role_permissions USING btree (role_id, permission_id);


--
-- Name: roles_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX roles_name_key ON finapp.roles USING btree (name);


--
-- Name: stock_details_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX stock_details_asset_id_key ON finapp.stock_details USING btree (asset_id);


--
-- Name: stock_option_details_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX stock_option_details_asset_id_key ON finapp.stock_option_details USING btree (asset_id);


--
-- Name: tag_categories_user_id_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX tag_categories_user_id_name_key ON finapp.tag_categories USING btree (user_id, name);


--
-- Name: tags_user_id_name_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX tags_user_id_name_key ON finapp.tags USING btree (user_id, name);


--
-- Name: treasury_details_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX treasury_details_asset_id_key ON finapp.treasury_details USING btree (asset_id);


--
-- Name: user_roles_user_id_role_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX user_roles_user_id_role_id_key ON finapp.user_roles USING btree (user_id, role_id);


--
-- Name: users_email_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX users_email_key ON finapp.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX users_username_key ON finapp.users USING btree (username);


--
-- Name: wealth_product_details_asset_id_key; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE UNIQUE INDEX wealth_product_details_asset_id_key ON finapp.wealth_product_details USING btree (asset_id);


--
-- Name: idx_assets_asset_type_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_assets_asset_type_id ON public.assets USING btree (asset_type_id);


--
-- Name: idx_assets_is_active; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_assets_is_active ON public.assets USING btree (is_active);


--
-- Name: idx_assets_market_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_assets_market_id ON public.assets USING btree (market_id);


--
-- Name: idx_assets_symbol; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_assets_symbol ON public.assets USING btree (symbol);


--
-- Name: idx_assets_symbol_market; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_assets_symbol_market ON public.assets USING btree (symbol, market_id);


--
-- Name: idx_email_verification_tokens_expires_at; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens USING btree (expires_at);


--
-- Name: idx_email_verification_tokens_token_hash; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_email_verification_tokens_token_hash ON public.email_verification_tokens USING btree (token_hash);


--
-- Name: idx_email_verification_tokens_user_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);


--
-- Name: idx_option_details_asset_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_option_details_asset_id ON public.option_details USING btree (asset_id);


--
-- Name: idx_password_reset_tokens_expires_at; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_token_hash; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_password_reset_tokens_token_hash ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_portfolios_is_active; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_portfolios_is_active ON public.portfolios USING btree (is_active);


--
-- Name: idx_portfolios_is_default; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_portfolios_is_default ON public.portfolios USING btree (is_default);


--
-- Name: idx_portfolios_user_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_portfolios_user_id ON public.portfolios USING btree (user_id);


--
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_trading_accounts_account_type; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_trading_accounts_account_type ON public.trading_accounts USING btree (account_type);


--
-- Name: idx_trading_accounts_is_active; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_trading_accounts_is_active ON public.trading_accounts USING btree (is_active);


--
-- Name: idx_trading_accounts_portfolio_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_trading_accounts_portfolio_id ON public.trading_accounts USING btree (portfolio_id);


--
-- Name: idx_user_roles_is_active; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_user_roles_is_active ON public.user_roles USING btree (is_active);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_is_active; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_user_sessions_is_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_token_hash; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions USING btree (token_hash);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_last_login_at; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_users_last_login_at ON public.users USING btree (last_login_at);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: caojun
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: caojun
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: caojun
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: asset_prices asset_prices_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.asset_prices
    ADD CONSTRAINT asset_prices_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: assets assets_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.assets
    ADD CONSTRAINT assets_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES finapp.asset_types(id);


--
-- Name: assets assets_market_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.assets
    ADD CONSTRAINT assets_market_id_fkey FOREIGN KEY (market_id) REFERENCES finapp.markets(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id);


--
-- Name: benchmark_prices benchmark_prices_benchmark_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.benchmark_prices
    ADD CONSTRAINT benchmark_prices_benchmark_id_fkey FOREIGN KEY (benchmark_id) REFERENCES finapp.benchmarks(id) ON DELETE CASCADE;


--
-- Name: bond_details bond_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.bond_details
    ADD CONSTRAINT bond_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: cash_flows cash_flows_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.cash_flows
    ADD CONSTRAINT cash_flows_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id);


--
-- Name: cash_flows cash_flows_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.cash_flows
    ADD CONSTRAINT cash_flows_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: cash_flows cash_flows_trading_account_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.cash_flows
    ADD CONSTRAINT cash_flows_trading_account_id_fkey FOREIGN KEY (trading_account_id) REFERENCES finapp.trading_accounts(id);


--
-- Name: cash_flows cash_flows_transaction_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.cash_flows
    ADD CONSTRAINT cash_flows_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES finapp.transactions(id);


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: assets fk_assets_liquidity_tag; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.assets
    ADD CONSTRAINT fk_assets_liquidity_tag FOREIGN KEY (liquidity_tag) REFERENCES finapp.liquidity_tags(id);


--
-- Name: fund_details fund_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.fund_details
    ADD CONSTRAINT fund_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: futures_details futures_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.futures_details
    ADD CONSTRAINT futures_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: option_details option_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.option_details
    ADD CONSTRAINT option_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: option_details option_details_underlying_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.option_details
    ADD CONSTRAINT option_details_underlying_asset_id_fkey FOREIGN KEY (underlying_asset_id) REFERENCES finapp.assets(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: performance_metrics performance_metrics_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.performance_metrics
    ADD CONSTRAINT performance_metrics_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: portfolio_snapshots portfolio_snapshots_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: portfolio_tags portfolio_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolio_tags
    ADD CONSTRAINT portfolio_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: portfolio_tags portfolio_tags_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolio_tags
    ADD CONSTRAINT portfolio_tags_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: portfolio_tags portfolio_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolio_tags
    ADD CONSTRAINT portfolio_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES finapp.tags(id) ON DELETE CASCADE;


--
-- Name: portfolios portfolios_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.portfolios
    ADD CONSTRAINT portfolios_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: position_snapshots position_snapshots_portfolio_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.position_snapshots
    ADD CONSTRAINT position_snapshots_portfolio_snapshot_id_fkey FOREIGN KEY (portfolio_snapshot_id) REFERENCES finapp.portfolio_snapshots(id) ON DELETE CASCADE;


--
-- Name: position_snapshots position_snapshots_position_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.position_snapshots
    ADD CONSTRAINT position_snapshots_position_id_fkey FOREIGN KEY (position_id) REFERENCES finapp.positions(id) ON DELETE CASCADE;


--
-- Name: positions positions_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.positions
    ADD CONSTRAINT positions_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id);


--
-- Name: positions positions_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.positions
    ADD CONSTRAINT positions_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: positions positions_trading_account_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.positions
    ADD CONSTRAINT positions_trading_account_id_fkey FOREIGN KEY (trading_account_id) REFERENCES finapp.trading_accounts(id) ON DELETE CASCADE;


--
-- Name: price_sync_errors price_sync_errors_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_errors
    ADD CONSTRAINT price_sync_errors_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE SET NULL;


--
-- Name: price_sync_errors price_sync_errors_log_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_errors
    ADD CONSTRAINT price_sync_errors_log_id_fkey FOREIGN KEY (log_id) REFERENCES finapp.price_sync_logs(id) ON DELETE CASCADE;


--
-- Name: price_sync_logs price_sync_logs_data_source_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_logs
    ADD CONSTRAINT price_sync_logs_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES finapp.price_data_sources(id) ON DELETE SET NULL;


--
-- Name: price_sync_logs price_sync_logs_task_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_logs
    ADD CONSTRAINT price_sync_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES finapp.price_sync_tasks(id) ON DELETE CASCADE;


--
-- Name: price_sync_tasks price_sync_tasks_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_tasks
    ADD CONSTRAINT price_sync_tasks_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES finapp.asset_types(id);


--
-- Name: price_sync_tasks price_sync_tasks_data_source_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_tasks
    ADD CONSTRAINT price_sync_tasks_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES finapp.price_data_sources(id) ON DELETE CASCADE;


--
-- Name: price_sync_tasks price_sync_tasks_market_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_tasks
    ADD CONSTRAINT price_sync_tasks_market_id_fkey FOREIGN KEY (market_id) REFERENCES finapp.markets(id);


--
-- Name: report_executions report_executions_report_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.report_executions
    ADD CONSTRAINT report_executions_report_id_fkey FOREIGN KEY (report_id) REFERENCES finapp.reports(id) ON DELETE CASCADE;


--
-- Name: reports reports_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.reports
    ADD CONSTRAINT reports_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES finapp.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES finapp.roles(id) ON DELETE CASCADE;


--
-- Name: stock_details stock_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.stock_details
    ADD CONSTRAINT stock_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: stock_option_details stock_option_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.stock_option_details
    ADD CONSTRAINT stock_option_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: stock_option_details stock_option_details_underlying_stock_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.stock_option_details
    ADD CONSTRAINT stock_option_details_underlying_stock_id_fkey FOREIGN KEY (underlying_stock_id) REFERENCES finapp.assets(id);


--
-- Name: tag_categories tag_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tag_categories
    ADD CONSTRAINT tag_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES finapp.tag_categories(id) ON DELETE SET NULL;


--
-- Name: tag_categories tag_categories_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tag_categories
    ADD CONSTRAINT tag_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: tags tags_category_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tags
    ADD CONSTRAINT tags_category_id_fkey FOREIGN KEY (category_id) REFERENCES finapp.tag_categories(id) ON DELETE SET NULL;


--
-- Name: tags tags_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.tags
    ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: trading_accounts trading_accounts_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.trading_accounts
    ADD CONSTRAINT trading_accounts_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: transaction_tag_mappings transaction_tag_mappings_tag_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transaction_tag_mappings
    ADD CONSTRAINT transaction_tag_mappings_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES finapp.tags(id) ON DELETE CASCADE;


--
-- Name: transaction_tag_mappings transaction_tag_mappings_transaction_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transaction_tag_mappings
    ADD CONSTRAINT transaction_tag_mappings_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES finapp.transactions(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transactions
    ADD CONSTRAINT transactions_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id);


--
-- Name: transactions transactions_liquidity_tag_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transactions
    ADD CONSTRAINT transactions_liquidity_tag_id_fkey FOREIGN KEY (liquidity_tag_id) REFERENCES finapp.liquidity_tags(id);


--
-- Name: transactions transactions_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transactions
    ADD CONSTRAINT transactions_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES finapp.portfolios(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_trading_account_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transactions
    ADD CONSTRAINT transactions_trading_account_id_fkey FOREIGN KEY (trading_account_id) REFERENCES finapp.trading_accounts(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: treasury_details treasury_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.treasury_details
    ADD CONSTRAINT treasury_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES finapp.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES finapp.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES finapp.users(id) ON DELETE CASCADE;


--
-- Name: wealth_product_details wealth_product_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.wealth_product_details
    ADD CONSTRAINT wealth_product_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE CASCADE;


--
-- Name: asset_prices asset_prices_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.asset_prices
    ADD CONSTRAINT asset_prices_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: assets assets_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.asset_types(id);


--
-- Name: assets assets_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: benchmark_prices benchmark_prices_benchmark_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.benchmark_prices
    ADD CONSTRAINT benchmark_prices_benchmark_id_fkey FOREIGN KEY (benchmark_id) REFERENCES public.benchmarks(id) ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: option_details option_details_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.option_details
    ADD CONSTRAINT option_details_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: option_details option_details_underlying_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.option_details
    ADD CONSTRAINT option_details_underlying_asset_id_fkey FOREIGN KEY (underlying_asset_id) REFERENCES public.assets(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: portfolios portfolios_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: positions positions_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: positions positions_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;


--
-- Name: positions positions_trading_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_trading_account_id_fkey FOREIGN KEY (trading_account_id) REFERENCES public.trading_accounts(id) ON DELETE CASCADE;


--
-- Name: report_executions report_executions_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.report_executions
    ADD CONSTRAINT report_executions_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: reports reports_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: trading_accounts trading_accounts_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.trading_accounts
    ADD CONSTRAINT trading_accounts_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: transactions transactions_liquidity_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_liquidity_tag_id_fkey FOREIGN KEY (liquidity_tag_id) REFERENCES public.liquidity_tags(id);


--
-- Name: transactions transactions_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_trading_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_trading_account_id_fkey FOREIGN KEY (trading_account_id) REFERENCES public.trading_accounts(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caojun
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict SQGdVfA7ywHHPzHmOvjOfFvwZNH9kc7doEd7c7zF8lUgzPTBwTYiIv1JW1Invj9

