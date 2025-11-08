--
-- PostgreSQL database dump
--

\restrict KUBZDHJIuP6O6EYuv2gWagakhWkqmVDsGTggvosSxk7EIQiqIje3COaEYZQzsEa

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
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    location_dimension character varying(20) DEFAULT 'market'::character varying
);


ALTER TABLE finapp.asset_types OWNER TO finapp_user;

--
-- Name: COLUMN asset_types.location_dimension; Type: COMMENT; Schema: finapp; Owner: finapp_user
--

COMMENT ON COLUMN finapp.asset_types.location_dimension IS 'Location dimension for asset type: market (交易市场), country (国家), or global (全球)';


--
-- Name: assets; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.assets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    symbol character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    asset_type_id uuid NOT NULL,
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
    liquidity_tag uuid,
    country_id uuid
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
-- Name: countries; Type: TABLE; Schema: finapp; Owner: finapp_user
--

CREATE TABLE finapp.countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(3) NOT NULL,
    name character varying(100) NOT NULL,
    currency character varying(3),
    timezone character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE finapp.countries OWNER TO finapp_user;

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
    updated_by uuid,
    country_id uuid
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
-- Name: v_data_source_market_coverage; Type: VIEW; Schema: finapp; Owner: finapp_user
--

CREATE VIEW finapp.v_data_source_market_coverage AS
 SELECT ds.id,
    ds.name,
    ds.provider,
    ds.is_active,
    jsonb_array_elements_text((ds.config -> 'supports_markets'::text)) AS market_code,
    m.name AS market_name,
    m.country,
    m.currency
   FROM ((finapp.price_data_sources ds
     LEFT JOIN LATERAL jsonb_array_elements_text((ds.config -> 'supports_markets'::text)) market_code(value) ON (true))
     LEFT JOIN finapp.markets m ON (((m.code)::text = market_code.value)))
  WHERE ((ds.config -> 'supports_markets'::text) IS NOT NULL)
  ORDER BY ds.name, (jsonb_array_elements_text((ds.config -> 'supports_markets'::text)));


ALTER TABLE finapp.v_data_source_market_coverage OWNER TO finapp_user;

--
-- Name: v_data_source_product_coverage; Type: VIEW; Schema: finapp; Owner: finapp_user
--

CREATE VIEW finapp.v_data_source_product_coverage AS
 SELECT ds.id,
    ds.name,
    ds.provider,
    ds.is_active,
    jsonb_array_elements_text((ds.config -> 'supports_products'::text)) AS product_type
   FROM finapp.price_data_sources ds
  WHERE ((ds.config -> 'supports_products'::text) IS NOT NULL)
  ORDER BY ds.name, (jsonb_array_elements_text((ds.config -> 'supports_products'::text)));


ALTER TABLE finapp.v_data_source_product_coverage OWNER TO finapp_user;

--
-- Name: v_data_source_comparison; Type: VIEW; Schema: finapp; Owner: finapp_user
--

CREATE VIEW finapp.v_data_source_comparison AS
 SELECT ds.name,
    ds.provider,
        CASE
            WHEN ds.is_active THEN '✅ 激活'::text
            ELSE '❌ 未激活'::text
        END AS status,
        CASE
            WHEN (ds.api_key_encrypted IS NOT NULL) THEN '已配置'::text
            ELSE '未配置'::text
        END AS api_key,
    ds.rate_limit AS rate_limit_per_minute,
    (ds.config ->> 'free_plan'::text) AS free_plan,
    (ds.config ->> 'requires_api_key'::text) AS requires_api_key,
    ( SELECT count(*) AS count
           FROM finapp.v_data_source_product_coverage
          WHERE (v_data_source_product_coverage.id = ds.id)) AS product_count,
    ( SELECT count(*) AS count
           FROM finapp.v_data_source_market_coverage
          WHERE (v_data_source_market_coverage.id = ds.id)) AS market_count,
    ds.last_sync_at,
    ds.last_sync_status
   FROM finapp.price_data_sources ds
  ORDER BY ds.is_active DESC, ds.name;


ALTER TABLE finapp.v_data_source_comparison OWNER TO finapp_user;

--
-- Name: v_data_source_config; Type: VIEW; Schema: finapp; Owner: finapp_user
--

CREATE VIEW finapp.v_data_source_config AS
 SELECT ds.id,
    ds.name,
    ds.provider,
    ds.is_active,
    ds.api_endpoint,
        CASE
            WHEN (ds.api_key_encrypted IS NOT NULL) THEN '已配置'::text
            ELSE '未配置'::text
        END AS api_key_status,
    ds.rate_limit,
    ds.timeout_seconds,
    (ds.config -> 'description'::text) AS description,
    (ds.config -> 'requires_api_key'::text) AS requires_api_key,
    (ds.config -> 'free_plan'::text) AS free_plan,
    (ds.config -> 'features'::text) AS features,
    ds.last_sync_at,
    ds.last_sync_status,
    COALESCE(ds.last_error_message, '无'::text) AS last_error_message,
    ds.created_at,
    ds.updated_at
   FROM finapp.price_data_sources ds
  ORDER BY ds.created_at DESC;


ALTER TABLE finapp.v_data_source_config OWNER TO finapp_user;

--
-- Name: v_market_source_count; Type: VIEW; Schema: finapp; Owner: finapp_user
--

CREATE VIEW finapp.v_market_source_count AS
 SELECT v_data_source_market_coverage.market_code,
    v_data_source_market_coverage.market_name,
    v_data_source_market_coverage.country,
    v_data_source_market_coverage.currency,
    count(DISTINCT v_data_source_market_coverage.id) AS source_count,
    string_agg(DISTINCT (v_data_source_market_coverage.name)::text, ', '::text ORDER BY (v_data_source_market_coverage.name)::text) AS source_names,
    (max(
        CASE
            WHEN v_data_source_market_coverage.is_active THEN 1
            ELSE 0
        END) > 0) AS has_active_source
   FROM finapp.v_data_source_market_coverage
  GROUP BY v_data_source_market_coverage.market_code, v_data_source_market_coverage.market_name, v_data_source_market_coverage.country, v_data_source_market_coverage.currency
  ORDER BY (count(DISTINCT v_data_source_market_coverage.id)) DESC, v_data_source_market_coverage.market_code;


ALTER TABLE finapp.v_market_source_count OWNER TO finapp_user;

--
-- Name: v_product_type_source_count; Type: VIEW; Schema: finapp; Owner: finapp_user
--

CREATE VIEW finapp.v_product_type_source_count AS
 SELECT COALESCE(pct.product_type, 'UNKNOWN'::text) AS product_type,
    count(DISTINCT pct.id) AS source_count,
    string_agg(DISTINCT (pct.name)::text, ', '::text ORDER BY (pct.name)::text) AS source_names,
    (max(
        CASE
            WHEN pct.is_active THEN 1
            ELSE 0
        END) > 0) AS has_active_source
   FROM finapp.v_data_source_product_coverage pct
  GROUP BY pct.product_type
  ORDER BY (count(DISTINCT pct.id)) DESC, COALESCE(pct.product_type, 'UNKNOWN'::text);


ALTER TABLE finapp.v_product_type_source_count OWNER TO finapp_user;

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
608d490d-41e0-4a74-8b21-ae900678c7ca	e9919f45-1585-4645-8a62-036c08865605	2025-11-07	\N	\N	\N	4.35000000	\N	\N	CNY	test_data	2025-11-07 21:06:05.825332+08
fd4623bd-0757-4e7d-8ac4-b67bb4bf91bd	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-07-30	3608.35400391	3636.16699219	3593.73388672	3615.71704102	637200	\N	CNY	api	2025-11-07 23:30:10.472394+08
a11e02f2-325f-442f-83f9-97bcadcd9567	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-07-31	3604.69604492	3606.37500000	3562.60693359	3573.20800781	654500	\N	CNY	api	2025-11-07 23:30:10.475614+08
54dc7cf4-c6ad-4880-834e-704c4d0ed774	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-01	3568.26098633	3581.74609375	3550.04296875	3559.95190430	509600	\N	CNY	api	2025-11-07 23:30:10.476438+08
42889538-2060-4d90-a7db-9fb1db93a939	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-04	3547.16308594	3583.30908203	3547.16308594	3583.30908203	458600	\N	CNY	api	2025-11-07 23:30:10.477117+08
19a34f68-1f8d-46d3-a298-296e0a76d07b	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-05	3588.80810547	3617.59790039	3586.96899414	3617.59790039	499800	\N	CNY	api	2025-11-07 23:30:10.477836+08
d9fe6507-6918-4968-b49d-173ca47e0207	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-06	3615.80810547	3634.31298828	3613.98999023	3633.99511719	512500	\N	CNY	api	2025-11-07 23:30:10.478216+08
f304e4a6-1a6e-4d2d-9406-d94a7504ff4e	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-07	3637.78100586	3645.11694336	3622.52197266	3639.66699219	535500	\N	CNY	api	2025-11-07 23:30:10.478681+08
55fa6b1c-0a29-4a26-9de4-4d9e6d2079b2	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-08	3634.85400391	3645.36694336	3625.45092773	3635.12792969	526400	\N	CNY	api	2025-11-07 23:30:10.478985+08
74d09b7b-b3fe-42ca-896e-d9f683c52747	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-11	3637.05297852	3656.85205078	3629.62695313	3647.54711914	551400	\N	CNY	api	2025-11-07 23:30:10.479383+08
10546181-4c60-4371-8bfb-12ed9f4030ff	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-12	3647.96191406	3669.03808594	3647.96191406	3665.91796875	536600	\N	CNY	api	2025-11-07 23:30:10.479923+08
08324c37-c14a-4686-b82b-d646474be630	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-13	3668.65795898	3688.62792969	3666.54711914	3683.46508789	613500	\N	CNY	api	2025-11-07 23:30:10.480546+08
590c47ec-3755-4f02-ba58-88fd64987446	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-14	3685.52197266	3704.77099609	3662.57006836	3666.44311523	647800	\N	CNY	api	2025-11-07 23:30:10.480957+08
ee6d59d6-0217-4740-95c5-fd389bde350a	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-15	3659.81494141	3702.25488281	3658.37597656	3696.77099609	678500	\N	CNY	api	2025-11-07 23:30:10.481347+08
f4b90e72-8321-4518-8890-cbf38e5687c6	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-18	3712.49511719	3745.93896484	3702.37988281	3728.02709961	776000	\N	CNY	api	2025-11-07 23:30:10.481704+08
d735382b-9de8-42af-bc06-95532e49f593	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-19	3728.48510742	3746.66894531	3718.14697266	3727.28808594	696100	\N	CNY	api	2025-11-07 23:30:10.482098+08
5ea45c85-7a4e-48c0-974a-e07f8f5622ae	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-20	3716.68505859	3767.42993164	3704.99096680	3766.20996094	679800	\N	CNY	api	2025-11-07 23:30:10.482497+08
41b57567-f80a-4002-9134-459441b0247e	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-21	3770.67602539	3787.98095703	3757.99194336	3771.09912109	691600	\N	CNY	api	2025-11-07 23:30:10.482909+08
6850636e-d169-40ba-a54f-7c1ad73c6dcd	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-22	3772.27709961	3825.75903320	3772.27709961	3825.75903320	698100	\N	CNY	api	2025-11-07 23:30:10.483154+08
33632ecf-7402-4c00-a01c-70e602baabf0	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-25	3848.16308594	3883.56201172	3839.97192383	3883.56201172	885500	\N	CNY	api	2025-11-07 23:30:10.483377+08
5de25558-bd53-417d-b490-461e55f65028	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-26	3871.47094727	3888.59790039	3859.75805664	3868.38208008	734600	\N	CNY	api	2025-11-07 23:30:10.483614+08
61c33c1a-3f5f-409d-8cc1-e30bdf274fd3	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-27	3869.61206055	3887.19799805	3800.35009766	3800.35009766	858600	\N	CNY	api	2025-11-07 23:30:10.483841+08
328b33bc-1dec-4603-a3df-ee7c67cbb2e2	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-28	3796.71093750	3845.08691406	3761.42211914	3843.59692383	788400	\N	CNY	api	2025-11-07 23:30:10.484076+08
e08513cd-6a5a-4887-93a7-8a983d127af2	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-08-29	3842.82299805	3867.60595703	3839.20605469	3857.92700195	739500	\N	CNY	api	2025-11-07 23:30:10.484297+08
88b5bad0-7ce1-422a-92c4-91e856ed4640	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-01	3869.74609375	3879.04492188	3853.65795898	3875.53100586	747700	\N	CNY	api	2025-11-07 23:30:10.484535+08
2807ab25-3603-4bf8-bf27-e5e8f49e9612	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-02	3877.08593750	3885.31396484	3828.67700195	3858.13305664	762600	\N	CNY	api	2025-11-07 23:30:10.484752+08
ca7ed518-956d-459d-8de2-d5cd89ce25e5	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-03	3865.28588867	3868.38793945	3794.88403320	3813.55688477	645700	\N	CNY	api	2025-11-07 23:30:10.484973+08
f2640c66-f686-4aef-bf1a-02a459fa30d0	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-04	3807.75708008	3808.39599609	3732.84008789	3765.87597656	710200	\N	CNY	api	2025-11-07 23:30:10.485191+08
582c1c88-7eda-4622-bf3a-99b53dee5c09	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-05	3761.87988281	3817.15893555	3745.30908203	3812.51391602	626200	\N	CNY	api	2025-11-07 23:30:10.485474+08
3c067c65-e503-4a4f-9ccb-9d493d5d68e2	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-08	3811.66894531	3833.14306641	3803.60302734	3826.84106445	660100	\N	CNY	api	2025-11-07 23:30:10.485828+08
c6627f7b-48d6-417a-a2c3-33251d4333d8	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-09	3816.65698242	3834.67089844	3791.72412109	3807.29199219	600200	\N	CNY	api	2025-11-07 23:30:10.486203+08
30de1b34-954d-4bb2-9256-dce51bcee85a	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-10	3806.58398438	3826.99609375	3794.05688477	3812.22094727	534500	\N	CNY	api	2025-11-07 23:30:10.486566+08
2640affe-fc86-4b79-b2d6-6553b17f597e	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-11	3806.05590820	3875.30908203	3796.43505859	3875.30908203	617000	\N	CNY	api	2025-11-07 23:30:10.487086+08
02246d29-8d4b-4b59-a8c4-c3e52f0a9848	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-12	3875.50708008	3892.73803711	3866.53906250	3870.59790039	700600	\N	CNY	api	2025-11-07 23:30:10.487455+08
35f98fcd-6249-437b-a2c5-71c65f1aa305	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-15	3876.09692383	3879.73706055	3855.97192383	3860.50390625	644800	\N	CNY	api	2025-11-07 23:30:10.487774+08
36bc8217-7ae1-4741-8615-6d7a4a6a79bb	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-16	3865.97998047	3876.68994141	3838.64794922	3861.86499023	673400	\N	CNY	api	2025-11-07 23:30:10.488105+08
dd8c7402-74d4-428a-b617-415a0232ec17	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-17	3854.07299805	3882.66894531	3848.94604492	3876.34106445	663400	\N	CNY	api	2025-11-07 23:30:10.488351+08
9c85476c-c36b-439b-ba94-4096ebff5e0d	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-18	3876.05908203	3899.95898438	3800.99511719	3831.65600586	876000	\N	CNY	api	2025-11-07 23:30:10.488754+08
6068b4c8-da53-452a-aa09-56a18ac9fd56	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-19	3830.44409180	3843.16992188	3811.90307617	3820.08911133	682300	\N	CNY	api	2025-11-07 23:30:10.48911+08
22fa9fbb-0def-4721-827e-2d1e2194b5a4	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-22	3822.01000977	3831.73999023	3806.20190430	3828.57592773	568300	\N	CNY	api	2025-11-07 23:30:10.489741+08
5f0ff303-b0f0-4fcf-98b7-2d39dac91107	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-23	3830.13793945	3838.60595703	3774.52807617	3821.83300781	701900	\N	CNY	api	2025-11-07 23:30:10.490082+08
bce090c0-8a03-4d89-bda8-2e6c277965a1	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-24	3804.48291016	3854.92309570	3804.32788086	3853.64208984	602100	\N	CNY	api	2025-11-07 23:30:10.490341+08
eddac0d0-3877-4601-a05c-145b336853e8	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-25	3852.43090820	3866.10595703	3840.45898438	3853.30200195	590000	\N	CNY	api	2025-11-07 23:30:10.49063+08
0a514755-61dc-4084-92b2-b927e3aa59b8	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-26	3839.85498047	3856.60595703	3828.10595703	3828.10595703	551300	\N	CNY	api	2025-11-07 23:30:10.491026+08
c4200664-5b88-4f64-85a7-4b46b4d9c9ed	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-29	3828.16601563	3881.00195313	3809.53491211	3862.53198242	608500	\N	CNY	api	2025-11-07 23:30:10.491438+08
f4480f4c-0e4f-476c-b715-3ae02610ec1d	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-09-30	3869.70507813	3887.57006836	3866.28100586	3882.77709961	569700	\N	CNY	api	2025-11-07 23:30:10.491719+08
b09d84b0-9e35-42d9-a84a-a0208e35914e	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-09	3898.30688477	3936.57592773	3885.74389648	3933.97192383	725200	\N	CNY	api	2025-11-07 23:30:10.491978+08
b0d75fef-d1d6-4590-b1fa-a6d3d8d3f363	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-10	3915.47509766	3933.00488281	3886.30493164	3897.02807617	718900	\N	CNY	api	2025-11-07 23:30:10.492252+08
84e90224-97b6-46d5-ac26-da98d75ab155	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-13	3800.10498047	3895.83007813	3800.10498047	3889.50195313	709500	\N	CNY	api	2025-11-07 23:30:10.492519+08
ec7231cb-9376-4ba2-95a0-b2e37ff1aefc	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-14	3910.78198242	3918.43603516	3851.12109375	3865.22900391	800800	\N	CNY	api	2025-11-07 23:30:10.492812+08
9316cd51-1665-49e0-a129-7136749be6d0	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-15	3867.53588867	3912.29101563	3857.66699219	3912.20898438	645000	\N	CNY	api	2025-11-07 23:30:10.493111+08
23092d30-d0fd-4cda-a920-38c47d6f7e0f	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-16	3900.68310547	3931.05004883	3899.16699219	3916.22802734	595500	\N	CNY	api	2025-11-07 23:30:10.493399+08
a63af8b0-640d-4174-b8eb-9f6fc5ba6b6a	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-17	3912.04003906	3921.06494141	3835.36499023	3839.75488281	617600	\N	CNY	api	2025-11-07 23:30:10.493895+08
de2d9150-f8ed-4bc0-b0c1-6cf5783eba94	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-20	3865.55200195	3877.72094727	3850.36694336	3863.89306641	549300	\N	CNY	api	2025-11-07 23:30:10.494181+08
5e13e077-3a07-43b9-ad04-5d7d3343b008	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-21	3870.74902344	3919.31811523	3868.14501953	3916.33203125	599400	\N	CNY	api	2025-11-07 23:30:10.49445+08
fe83daff-8443-4287-894a-e53186d83d09	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-22	3896.07299805	3918.59204102	3893.32495117	3913.75805664	543100	\N	CNY	api	2025-11-07 23:30:10.494724+08
5e3c823e-861b-4053-bd7e-882404c58df4	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-23	3904.15893555	3926.21704102	3877.52905273	3922.40991211	565200	\N	CNY	api	2025-11-07 23:30:10.494985+08
a042cd0f-bd99-4ebd-990f-aeadb000a6c2	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-24	3929.11499023	3950.31201172	3928.95996094	3950.31201172	567900	\N	CNY	api	2025-11-07 23:30:10.495247+08
a30d3056-3d8b-42eb-826c-12496e40fc93	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-27	3969.21997070	3999.06689453	3963.10205078	3996.94506836	637600	\N	CNY	api	2025-11-07 23:30:10.495497+08
2db2d128-b1ae-429b-b930-55c9797986a2	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-11-07	269.79998779	272.29000854	266.76998901	268.47000122	48203600	\N	USD	api	2025-11-07 21:06:05.825332+08
cbd66c85-ade5-4dd3-89d7-2370e587d8b7	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-11-07	437.92001343	439.35998535	421.88000488	429.51998901	103091100	\N	USD	api	2025-11-07 21:06:05.825332+08
21897591-c992-4932-b163-4b3a4631b61e	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-28	3986.89111328	4010.72802734	3976.83300781	3988.22412109	577400	\N	CNY	api	2025-11-07 23:30:10.495744+08
70bbcd88-0cdd-45b5-83f0-2c7e3325a45a	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-29	3990.26489258	4016.33105469	3986.94091797	4016.33105469	612900	\N	CNY	api	2025-11-07 23:30:10.496545+08
b1626410-41bb-40bf-8281-bd44cd81b0e4	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-30	4007.82104492	4025.70507813	3984.82788086	3986.90087891	668500	\N	CNY	api	2025-11-07 23:30:10.496781+08
a4fed9b4-7dce-4dd7-8a74-cac449901923	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-10-31	3985.06396484	3986.74291992	3951.73095703	3954.79003906	675600	\N	CNY	api	2025-11-07 23:30:10.497015+08
9d6d24df-3465-4448-8ce5-2c7b6c6c7868	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-11-03	3954.07788086	3977.30493164	3937.02099609	3976.52099609	641200	\N	CNY	api	2025-11-07 23:30:10.497249+08
c6464aed-40bb-45de-9c8f-2a7e12d5eb17	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-11-04	3973.45800781	3985.88208008	3938.52001953	3960.18603516	615500	\N	CNY	api	2025-11-07 23:30:10.497518+08
ea802138-6443-4763-9ee1-12c499e62523	2aa3f894-681b-4a75-9003-ab376a35df7e	2025-11-07	3994.31665039	4012.00537109	3993.69091797	3997.55566406	3816128552	\N	CNY	api	2025-11-07 21:06:05.825332+08
2cd2f46b-07c5-428f-8894-98ca086d06ea	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-07-30	3782.32006836	3811.43994141	3766.89990234	3789.93994141	636600	\N	CNY	api	2025-11-07 23:30:10.758498+08
24022865-606c-480c-8863-8a73fce2c558	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-07-31	3778.35009766	3780.12011719	3734.25000000	3745.38989258	654000	\N	CNY	api	2025-11-07 23:30:10.759773+08
fcb0c6b3-461d-497d-a01f-53c8cf21c7a5	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-01	3740.16992188	3754.35009766	3721.16992188	3731.54003906	509100	\N	CNY	api	2025-11-07 23:30:10.760423+08
8b344d30-cff3-43f1-9ac0-6bd6d7785dc5	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-04	3717.94995117	3755.92993164	3717.94995117	3755.92993164	458100	\N	CNY	api	2025-11-07 23:30:10.760789+08
c80832e8-425a-4e8c-8ffc-5a98854a0657	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-05	3761.70996094	3791.71997070	3759.72998047	3791.71997070	499200	\N	CNY	api	2025-11-07 23:30:10.76125+08
6d42597d-d0f6-4ad4-905b-2981e1701039	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-06	3789.83007813	3809.26000977	3787.96997070	3808.92993164	511900	\N	CNY	api	2025-11-07 23:30:10.761699+08
8c2f5cef-e305-40a7-876e-50b2745c8058	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-07	3812.90991211	3820.62011719	3796.93994141	3814.96997070	534900	\N	CNY	api	2025-11-07 23:30:10.762083+08
f58b2b84-3fb0-4ace-82c2-e8ea47362c40	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-08	3809.91992188	3820.96997070	3800.03002930	3810.29003906	525900	\N	CNY	api	2025-11-07 23:30:10.763285+08
4664d895-6415-435b-bdef-8b1769f6f5ab	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-11	3812.31005859	3833.12011719	3804.52001953	3823.35009766	550900	\N	CNY	api	2025-11-07 23:30:10.763727+08
7bcb4491-b21d-41c3-94e6-814eb18e11ea	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-12	3823.79003906	3845.94995117	3823.79003906	3842.65991211	535800	\N	CNY	api	2025-11-07 23:30:10.764103+08
f7ed5bd5-632d-4804-aa03-962deccc5124	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-13	3845.53002930	3866.52001953	3843.32006836	3861.10009766	612800	\N	CNY	api	2025-11-07 23:30:10.764473+08
30034e39-3a41-4b9f-9788-c2603ec1a8f8	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-14	3863.23999023	3883.48999023	3839.21997070	3843.34008789	647100	\N	CNY	api	2025-11-07 23:30:10.764831+08
90e761e4-2088-480c-99f4-f30062a41b98	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-15	3836.37011719	3880.86010742	3834.87988281	3875.09008789	677800	\N	CNY	api	2025-11-07 23:30:10.765176+08
6a2cb7ed-7f0f-4e78-9856-4a7d39e85ae0	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-18	3891.61010742	3926.47998047	3880.94995117	3907.75000000	774900	\N	CNY	api	2025-11-07 23:30:10.765533+08
79cac6d5-eae8-4452-b3f2-8b3e8fef6327	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-19	3908.22998047	3927.30004883	3897.39990234	3906.97998047	694900	\N	CNY	api	2025-11-07 23:30:10.765899+08
7190f6c9-20e0-49f6-8758-5ed8e7ef0c11	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-20	3895.85009766	3949.11010742	3883.59008789	3947.83007813	679000	\N	CNY	api	2025-11-07 23:30:10.766276+08
92ad8c03-de0d-4597-a191-3c19552ca14c	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-21	3952.48999023	3970.66992188	3939.23999023	3952.97998047	690600	\N	CNY	api	2025-11-07 23:30:10.766622+08
42b8b9a7-3856-4dd9-b666-bbcb39b17bc5	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-22	3954.23999023	4010.37011719	3954.23999023	4010.37011719	697100	\N	CNY	api	2025-11-07 23:30:10.766995+08
873b6f2d-bbe3-4974-8772-02ce8bf82093	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-25	4033.83007813	4070.91992188	4025.19995117	4070.91992188	884200	\N	CNY	api	2025-11-07 23:30:10.767339+08
4db84217-4c28-42ca-b3af-441f49d56082	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-26	4058.21997070	4076.21997070	4045.93994141	4055.12988281	732200	\N	CNY	api	2025-11-07 23:30:10.767696+08
d065eb68-ddad-4cf7-b625-1e591953f716	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-27	4056.37988281	4074.76000977	3983.72998047	3983.72998047	857400	\N	CNY	api	2025-11-07 23:30:10.768116+08
42b1acfd-4226-4907-b951-4eb719e0c0bf	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-28	3979.91992188	4030.61010742	3942.87988281	4029.05004883	787400	\N	CNY	api	2025-11-07 23:30:10.768368+08
c4a9d44a-d404-4f4a-9508-e98d58cace36	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-08-29	4028.23999023	4054.14990234	4024.37011719	4043.81005859	738500	\N	CNY	api	2025-11-07 23:30:10.768596+08
0cdc9c0b-8353-407e-939b-f1e7fe180250	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-01	4056.22998047	4065.95996094	4039.37011719	4062.30004883	746900	\N	CNY	api	2025-11-07 23:30:10.768809+08
8418593d-2c38-4bf6-92ea-9e21ecfda68d	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-02	4063.88989258	4072.62011719	4013.32006836	4044.22998047	761800	\N	CNY	api	2025-11-07 23:30:10.769025+08
9b29ebbd-3638-47c9-9fbb-a6bec1c2275b	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-03	4051.71997070	4054.95996094	3977.87988281	3997.46997070	644900	\N	CNY	api	2025-11-07 23:30:10.769411+08
46fdd6c8-d4b0-4e6f-ac54-bc7c9ea94b18	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-04	3991.37011719	3992.03002930	3912.85009766	3947.46997070	709600	\N	CNY	api	2025-11-07 23:30:10.769771+08
6c65ed46-6e72-46dd-b789-d2b58df08437	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-05	3943.30004883	4001.25000000	3925.87011719	3996.37011719	625500	\N	CNY	api	2025-11-07 23:30:10.770438+08
03f2866a-d461-4b9d-b3fb-90c2e0e700b9	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-08	3995.47998047	4018.07006836	3987.09008789	4011.42993164	659500	\N	CNY	api	2025-11-07 23:30:10.770809+08
265d5fb3-6827-43af-95c3-69bcacca8be2	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-09	4000.72998047	4019.63989258	3974.63989258	3990.95996094	599500	\N	CNY	api	2025-11-07 23:30:10.771386+08
ae5b1ea2-3b70-4fe2-8b5d-7e1cbe2c5697	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-10	3990.23999023	4011.65991211	3977.10009766	3996.16992188	534000	\N	CNY	api	2025-11-07 23:30:10.771779+08
8957b6fc-0aac-42c8-82b3-f99271bd7c82	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-11	3989.68994141	4062.33007813	3979.64990234	4062.33007813	616300	\N	CNY	api	2025-11-07 23:30:10.772202+08
028deb47-960e-4635-93ef-db944e9cdd63	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-12	4062.55004883	4080.66992188	4053.18994141	4057.45996094	700000	\N	CNY	api	2025-11-07 23:30:10.772591+08
eab7528d-2806-4000-8cbd-88708a80e3e7	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-15	4063.23999023	4067.08007813	4042.12988281	4046.89990234	644300	\N	CNY	api	2025-11-07 23:30:10.772956+08
96da59e7-bee5-480a-80ee-2062a9825172	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-16	4052.64990234	4063.90991211	4023.95996094	4048.26000977	673000	\N	CNY	api	2025-11-07 23:30:10.77333+08
3a8178d9-a624-42da-9de5-e99b1fe92dba	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-17	4040.04003906	4069.94995117	4034.59008789	4063.30004883	662900	\N	CNY	api	2025-11-07 23:30:10.773712+08
00a87c49-e0c5-4977-bb5d-69109d367f44	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-18	4063.00000000	4088.08007813	3984.36010742	4016.48999023	875200	\N	CNY	api	2025-11-07 23:30:10.774523+08
e395e276-6956-4b66-812f-9c88f87cd870	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-19	4015.21997070	4028.54003906	3995.76000977	4004.38989258	681700	\N	CNY	api	2025-11-07 23:30:10.77509+08
ce5efa6e-915f-4cd1-b91a-56a88658eb87	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-22	4006.35009766	4016.63989258	3989.85009766	4013.31005859	567800	\N	CNY	api	2025-11-07 23:30:10.775347+08
616627b8-eb91-40fa-9f29-5b0692ce47b6	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-23	4014.97998047	4023.88989258	3956.76000977	4006.33007813	701200	\N	CNY	api	2025-11-07 23:30:10.775582+08
a1415cc5-1367-430b-95dc-c198f21e93ec	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-24	3988.13989258	4041.01000977	3987.96997070	4039.67993164	601400	\N	CNY	api	2025-11-07 23:30:10.775834+08
8622bf4e-48c6-4b3a-b75a-bc6a25f63400	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-25	4038.38989258	4052.72998047	4025.82006836	4039.30004883	589500	\N	CNY	api	2025-11-07 23:30:10.776153+08
45368b33-831d-4a87-816f-700a44b9afad	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-26	4025.17993164	4042.79003906	4012.91992188	4012.91992188	550800	\N	CNY	api	2025-11-07 23:30:10.776456+08
fed1f76f-3dc3-4b32-b7b3-06310f26cf12	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-29	4012.98999023	4068.47998047	3993.48999023	4049.07006836	608000	\N	CNY	api	2025-11-07 23:30:10.776777+08
bb6f1f9a-2955-4f19-9115-6c636a32187b	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-09-30	4056.60009766	4075.33007813	4052.97998047	4070.29003906	569300	\N	CNY	api	2025-11-07 23:30:10.777086+08
da575a28-8dcf-440b-b08f-bc107717d523	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-09	4086.61010742	4126.79980469	4073.42993164	4124.06005859	724500	\N	CNY	api	2025-11-07 23:30:10.777411+08
e950945f-9120-4423-a203-88ee376e88c9	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-10	4104.64013672	4123.04003906	4074.00000000	4085.23999023	718300	\N	CNY	api	2025-11-07 23:30:10.777939+08
e55e848f-6d0c-4d65-b5ca-7e8eac2a9f09	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-13	3983.63989258	4084.06005859	3983.63989258	4077.42993164	708900	\N	CNY	api	2025-11-07 23:30:10.778567+08
643c6b77-fb01-42bf-8a8b-33b36142e758	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-14	4099.77978516	4107.77001953	4037.25000000	4052.06005859	800300	\N	CNY	api	2025-11-07 23:30:10.778782+08
5276d9c9-5226-4c17-adf6-0dedac0bcfcf	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-15	4054.45996094	4101.29003906	4044.10009766	4101.20996094	644500	\N	CNY	api	2025-11-07 23:30:10.778999+08
42c2ee59-0366-42f6-8e7e-d1e623ce88c0	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-16	4089.10009766	4121.00000000	4087.58007813	4105.50976563	595100	\N	CNY	api	2025-11-07 23:30:10.779334+08
3eca8dd0-7805-45d8-8a30-6b6bdf73dabd	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-17	4101.10009766	4110.50000000	4020.72998047	4025.32006836	617000	\N	CNY	api	2025-11-07 23:30:10.779594+08
116d914a-3337-4d4b-820d-c2be4de1c30b	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-20	4052.36010742	4065.10009766	4036.43994141	4050.62011719	548800	\N	CNY	api	2025-11-07 23:30:10.779883+08
2f479512-ba0c-4f34-9b4d-a7764401c47d	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-21	4057.80004883	4108.75000000	4055.06005859	4105.62011719	599100	\N	CNY	api	2025-11-07 23:30:10.780177+08
8c37f9d6-89ce-45d2-a03f-7c2cfc3f64e8	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-22	4084.35009766	4108.06005859	4081.48999023	4103.00976563	542600	\N	CNY	api	2025-11-07 23:30:10.780464+08
727f9ae6-c36c-4c25-ac51-afedaa611cba	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-23	4092.93994141	4116.10009766	4065.02001953	4112.10009766	564800	\N	CNY	api	2025-11-07 23:30:10.780813+08
b0364df3-da00-4333-814a-812dfadd5d4b	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-24	4119.12988281	4141.29980469	4118.95019531	4141.29980469	567500	\N	CNY	api	2025-11-07 23:30:10.781096+08
feb8b27a-1af8-42f2-b775-3f66ac1755e9	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-27	4161.27978516	4192.64013672	4154.81005859	4190.37011719	637000	\N	CNY	api	2025-11-07 23:30:10.781377+08
a73a7722-e16f-496d-a9f2-5157434162df	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-28	4179.83984375	4204.93017578	4169.35009766	4181.31982422	576900	\N	CNY	api	2025-11-07 23:30:10.781663+08
8de25e62-4004-4e22-a434-c28cb6ab636c	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-29	4183.47998047	4210.81982422	4180.02001953	4210.81982422	612600	\N	CNY	api	2025-11-07 23:30:10.781956+08
b511f970-0eb2-490a-aa43-bf7b3352aeb1	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-30	4201.89990234	4220.72021484	4177.81005859	4179.97998047	668000	\N	CNY	api	2025-11-07 23:30:10.782241+08
576ff6f4-769b-46bd-93b2-bfdcb8dd55da	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-10-31	4178.06982422	4179.83007813	4143.00976563	4146.24023438	675200	\N	CNY	api	2025-11-07 23:30:10.782526+08
3f80a743-5c1f-4a37-a223-eef85c509221	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-11-03	4145.50000000	4169.91015625	4127.62011719	4169.08007813	640900	\N	CNY	api	2025-11-07 23:30:10.782873+08
bf974c6b-9f33-455a-828e-846be7522f6f	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-11-04	4165.85986328	4178.95019531	4129.29980469	4152.02978516	615200	\N	CNY	api	2025-11-07 23:30:10.783119+08
592e25c9-42b5-4b5d-91ad-18fde417177a	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	2025-11-07	4187.87939453	4206.48242188	4187.23730469	4191.33056641	3756481352	\N	CNY	api	2025-11-07 23:30:10.783342+08
8d6e1725-34f6-4635-8189-3236012fc2a9	a7569e62-8eec-4468-8798-d1e948ef4679	2025-07-30	44.16999817	44.75000000	43.93000031	44.41999817	72546085	\N	CNY	api	2025-11-07 23:30:11.131917+08
5251fbcd-cbc0-456b-9625-e54a3d191303	a7569e62-8eec-4468-8798-d1e948ef4679	2025-07-31	44.40000153	44.56000137	43.84999847	44.47999954	73319517	\N	CNY	api	2025-11-07 23:30:11.132993+08
6f06566e-9802-4303-9eca-b83c854dc6bc	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-01	44.50000000	44.97000122	44.34999847	44.41999817	59462094	\N	CNY	api	2025-11-07 23:30:11.133506+08
56c8fabe-f606-4b57-9549-cd8a4ba6a1ee	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-04	44.31000137	44.97000122	44.31000137	44.90000153	49800832	\N	CNY	api	2025-11-07 23:30:11.134289+08
0dca032b-51d8-45b6-8566-a5d65578812b	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-05	44.77999878	45.40000153	44.63999939	45.25000000	55525830	\N	CNY	api	2025-11-07 23:30:11.134638+08
e2008974-cb26-4217-ab6f-c2d699536b39	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-06	45.29000092	45.72999954	45.11000061	45.11999893	43029640	\N	CNY	api	2025-11-07 23:30:11.13494+08
b64eb44d-d257-4ff6-9157-aa2cfe40e9d9	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-07	45.11999893	45.59999847	44.95999908	45.15000153	44064325	\N	CNY	api	2025-11-07 23:30:11.135279+08
e7694d0c-bc91-49a2-ade4-470641fd8a42	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-08	45.20000076	45.27999878	44.52999878	44.52999878	45642153	\N	CNY	api	2025-11-07 23:30:11.135617+08
0161550a-e702-49c8-823d-690a095ea5f1	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-11	44.52999878	44.63000107	44.09999847	44.09999847	53672371	\N	CNY	api	2025-11-07 23:30:11.135897+08
8bb8c34a-13d1-4e22-9a6e-4d5e492d0d65	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-12	44.13000107	44.47999954	44.00000000	44.00000000	56225243	\N	CNY	api	2025-11-07 23:30:11.136394+08
c41d0ddf-379d-4164-9d96-c59dc570ff8f	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-13	44.13999939	44.25000000	43.49000168	43.54000092	87673736	\N	CNY	api	2025-11-07 23:30:11.136755+08
e0cda84c-f914-41aa-8c18-8d3d41d0653c	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-14	43.54999924	43.93999863	43.50000000	43.77999878	67635168	\N	CNY	api	2025-11-07 23:30:11.137035+08
a8ef2cb0-ea73-41ed-b0a3-90f3337c8726	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-15	43.65999985	43.74000168	43.29999924	43.29999924	93295684	\N	CNY	api	2025-11-07 23:30:11.137338+08
34eed319-9e2d-4259-9605-3b717f662b93	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-18	43.09999847	43.66999817	42.88999939	43.50999832	92639738	\N	CNY	api	2025-11-07 23:30:11.137658+08
654f7425-7be6-4fc7-9bfa-3c1a845ec192	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-19	43.45000076	43.70000076	43.29000092	43.40000153	57411852	\N	CNY	api	2025-11-07 23:30:11.138063+08
ea714b4f-0210-4335-9567-1d4c9e41310e	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-20	43.29999924	43.63000107	43.15000153	43.45000076	54724013	\N	CNY	api	2025-11-07 23:30:11.138365+08
730ff840-5238-460c-954e-45901a92c324	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-21	43.50000000	43.59000015	43.22999954	43.47000122	57854002	\N	CNY	api	2025-11-07 23:30:11.138646+08
98edc79e-4658-4025-bd6b-6c14376729af	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-22	43.47000122	43.47999954	43.04000092	43.25999832	79449625	\N	CNY	api	2025-11-07 23:30:11.139083+08
358d25b3-e432-4b3c-9baa-9f6567b97e6e	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-25	43.31999969	43.86999893	43.11000061	43.86999893	90738990	\N	CNY	api	2025-11-07 23:30:11.139382+08
047f0568-a44d-442b-af50-f9f61ad80554	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-26	43.88999939	44.02000046	43.41999817	43.52000046	75572231	\N	CNY	api	2025-11-07 23:30:11.139707+08
62f00f42-9e6a-41fa-9671-6f7de754013e	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-27	43.50000000	43.65999985	43.00000000	43.00000000	75814078	\N	CNY	api	2025-11-07 23:30:11.140107+08
a9277b1a-6f3f-48f5-ab6a-8e0a2c469b28	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-28	43.02000046	43.29999924	42.59999847	42.97999954	82242557	\N	CNY	api	2025-11-07 23:30:11.140474+08
d1a17a98-2dbd-43b5-8546-f717a74ac703	a7569e62-8eec-4468-8798-d1e948ef4679	2025-08-29	42.97999954	43.99000168	42.88999939	42.88999939	136087899	\N	CNY	api	2025-11-07 23:30:11.140775+08
125632df-8ca3-48da-bc70-06c83e710e5e	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-01	42.61999893	42.63999939	41.88000107	41.97999954	127633329	\N	CNY	api	2025-11-07 23:30:11.141476+08
3b050872-626d-4112-92bc-3e859bf35afe	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-02	41.86000061	43.50000000	41.86000061	43.43999863	145214114	\N	CNY	api	2025-11-07 23:30:11.141896+08
98a1e437-06fa-4dcc-a249-a94da7e5fbb9	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-03	43.43999863	43.56999969	42.70000076	42.90000153	81840560	\N	CNY	api	2025-11-07 23:30:11.142291+08
deda183b-9ed7-4bc6-ae8c-58d67ee69ee8	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-04	42.81000137	43.31999969	42.13999939	43.04999924	93536328	\N	CNY	api	2025-11-07 23:30:11.14267+08
e3867585-28f8-4e89-b922-367f7ef971d0	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-05	43.00000000	43.02000046	42.52999878	42.75999832	57232838	\N	CNY	api	2025-11-07 23:30:11.143038+08
95266ec4-0e43-418e-ada9-fa01210ddb2b	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-08	42.70000076	43.09999847	42.36999893	42.43000031	85168162	\N	CNY	api	2025-11-07 23:30:11.14355+08
0182565c-e362-42f0-b978-9acd84ec5e84	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-09	42.41999817	42.88000107	42.40000153	42.83000183	58952653	\N	CNY	api	2025-11-07 23:30:11.143941+08
63c2ea2c-834a-480a-a3c8-ee84efe69f5d	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-10	42.79999924	43.15000153	42.56000137	43.00000000	47138694	\N	CNY	api	2025-11-07 23:30:11.144626+08
c74123b5-7a37-405a-a243-7e59beeb7d2e	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-11	43.13000107	43.33000183	42.77999878	43.29999924	65073072	\N	CNY	api	2025-11-07 23:30:11.145096+08
c4b3f85a-1cbc-4967-95bf-b8685a7b15e9	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-12	43.38000107	43.47000122	42.41999817	42.54000092	82314003	\N	CNY	api	2025-11-07 23:30:11.145462+08
c4e43b1f-89bf-4d2f-9a7c-11dc9ecea615	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-15	42.47999954	42.79000092	42.11000061	42.22000122	69949106	\N	CNY	api	2025-11-07 23:30:11.145829+08
e9369f56-4062-466f-a69e-4d94702597ca	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-16	42.31999969	42.43000031	41.65999985	41.75000000	85905078	\N	CNY	api	2025-11-07 23:30:11.146143+08
6e2156a1-aadb-4b7b-86d9-12f9d2685a0d	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-17	41.75999832	42.18999863	41.70000076	41.75999832	57236258	\N	CNY	api	2025-11-07 23:30:11.146442+08
c9353400-0a41-47a7-b4b2-65b59864b4f5	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-18	41.77999878	41.84000015	40.79999924	40.83000183	100352240	\N	CNY	api	2025-11-07 23:30:11.146731+08
8c0df1a6-67ac-44cb-9e6f-b1e69813ba4c	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-19	40.79999924	41.52999878	40.54999924	41.00000000	83656307	\N	CNY	api	2025-11-07 23:30:11.147019+08
7cd17d93-a3e9-4eee-9fc5-4e8f8cda752b	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-22	41.15000153	41.36999893	40.79999924	40.91999817	65611030	\N	CNY	api	2025-11-07 23:30:11.147369+08
aadc3b5a-c9de-450f-bbc0-36de46e4a53b	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-23	40.97999954	41.75000000	40.63000107	41.54999924	93885081	\N	CNY	api	2025-11-07 23:30:11.147677+08
748a22bc-e18a-4b95-a208-fd57f3157202	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-24	41.50000000	41.88999939	41.29000092	41.31999969	64389951	\N	CNY	api	2025-11-07 23:30:11.147976+08
9a3bf139-3543-4b95-a4f7-477f8af29b86	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-25	41.31999969	41.36000061	40.81000137	40.81999969	66694887	\N	CNY	api	2025-11-07 23:30:11.148273+08
5b3a026a-7f44-4b5a-a3e3-2e17f2e0c752	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-26	40.81000137	41.00000000	40.29999924	40.79999924	68276667	\N	CNY	api	2025-11-07 23:30:11.148589+08
13cfb1df-8060-4554-b7e5-e41003411bd9	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-29	40.77000046	41.29000092	40.36000061	40.68000031	83555055	\N	CNY	api	2025-11-07 23:30:11.148971+08
2927a5cb-4eef-4462-a40c-cbc1c50d8a0f	a7569e62-8eec-4468-8798-d1e948ef4679	2025-09-30	40.65000153	40.79000092	40.40999985	40.40999985	70002520	\N	CNY	api	2025-11-07 23:30:11.149467+08
908033bb-5267-4cb1-9cc6-c37ed5b9ae0c	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-09	40.20999908	40.43999863	39.81999969	40.33000183	97231953	\N	CNY	api	2025-11-07 23:30:11.149761+08
c5810372-2c8f-4ba2-aa83-abf188266e58	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-10	40.29999924	40.65000153	40.13000107	40.18000031	95504979	\N	CNY	api	2025-11-07 23:30:11.150056+08
2869395a-e325-432a-af24-76ee87021532	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-13	39.75999832	40.29999924	39.70000076	40.11000061	106593617	\N	CNY	api	2025-11-07 23:30:11.150356+08
86a5965d-bd27-4dc9-bcf3-5ed4d377563e	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-14	40.09000015	41.49000168	39.83000183	41.25999832	173382668	\N	CNY	api	2025-11-07 23:30:11.150638+08
0ba17f71-2bdd-4786-ace6-7477a2985081	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-15	41.25000000	41.56999969	41.00999832	41.50000000	106276702	\N	CNY	api	2025-11-07 23:30:11.150931+08
d096f1dc-bfa1-47c7-bbd2-8dabf76f3f2d	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-16	41.50000000	41.99000168	41.13000107	41.93000031	106248776	\N	CNY	api	2025-11-07 23:30:11.151164+08
960b102b-73cf-4e72-bb45-adae6982f72a	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-17	41.88000107	42.22000122	41.38000107	41.59000015	82982705	\N	CNY	api	2025-11-07 23:30:11.151388+08
68aac578-f90a-4631-bbd5-31ddb906d66d	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-20	41.61000061	41.79000092	41.09999847	41.41999817	64947729	\N	CNY	api	2025-11-07 23:30:11.151662+08
e6c6cfc3-3f9c-4957-9b87-37b48c0e2d9d	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-21	41.49000168	42.09999847	41.49000168	41.97999954	75993124	\N	CNY	api	2025-11-07 23:30:11.151947+08
8ef0a0a8-3f4b-4155-af2f-a2e522e7e308	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-22	41.97999954	42.20000076	41.72999954	41.95000076	55133364	\N	CNY	api	2025-11-07 23:30:11.152182+08
aa085a56-8014-4531-9c3b-127b26d415fd	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-23	41.95000076	42.49000168	41.77999878	42.24000168	71317373	\N	CNY	api	2025-11-07 23:30:11.152422+08
96a0f98d-50b6-4b70-8fa9-ef27f0b39059	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-24	42.34999847	42.45000076	41.84999847	41.95000076	69883194	\N	CNY	api	2025-11-07 23:30:11.152649+08
32d02d1e-8979-4171-9b40-d610abe98bd8	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-27	41.90000153	41.97000122	41.41999817	41.59000015	98894862	\N	CNY	api	2025-11-07 23:30:11.152905+08
29ed36ee-21e7-4204-80a2-89533aac8f18	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-28	41.61999893	41.72000122	41.22999954	41.59999847	70595074	\N	CNY	api	2025-11-07 23:30:11.153174+08
d90338f5-06a8-418f-907f-3fe80fd24049	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-29	41.52999878	41.52999878	40.68999863	40.77000046	91098760	\N	CNY	api	2025-11-07 23:30:11.153448+08
d94eced6-2bab-49da-82ff-fe01d4b7535a	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-30	40.79999924	41.36000061	40.72999954	41.20000076	113153844	\N	CNY	api	2025-11-07 23:30:11.153708+08
6c03c046-f9b4-46d9-9139-6bdc41b17e58	a7569e62-8eec-4468-8798-d1e948ef4679	2025-10-31	41.25999832	41.29999924	40.84000015	40.88999939	70260700	\N	CNY	api	2025-11-07 23:30:11.154018+08
e437e44b-69dd-41be-ba5a-afc1458e8991	a7569e62-8eec-4468-8798-d1e948ef4679	2025-11-03	41.13999939	41.97000122	41.06000137	41.79000092	92198068	\N	CNY	api	2025-11-07 23:30:11.154326+08
7148d4ea-fb3b-4472-b3cb-abe15c426423	a7569e62-8eec-4468-8798-d1e948ef4679	2025-11-04	41.84000015	43.11000061	41.81000137	43.00999832	134003592	\N	CNY	api	2025-11-07 23:30:11.154717+08
a00f0c42-6146-4abf-9547-d0dbb4c4a2c1	a7569e62-8eec-4468-8798-d1e948ef4679	2025-11-07	42.40000153	42.72000122	42.27999878	42.50999832	59319118	\N	CNY	api	2025-11-07 23:30:11.155242+08
ea775cef-3204-4c54-a9ac-7e610372cca1	49589118-facc-4785-abf3-3d2d4d054f17	2025-07-30	1444.00000000	1457.16003418	1437.00000000	1449.43994141	3186771	\N	CNY	api	2025-11-07 23:30:11.539482+08
4f6ebe67-b88e-43fd-a0f9-2e98ef6e2ab2	49589118-facc-4785-abf3-3d2d4d054f17	2025-07-31	1443.00000000	1444.86999512	1418.00000000	1421.67004395	5179751	\N	CNY	api	2025-11-07 23:30:11.540751+08
66c495f4-31b7-41d3-9fc6-029a84e385bc	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-01	1421.86999512	1425.95996094	1414.00000000	1417.00000000	2963559	\N	CNY	api	2025-11-07 23:30:11.541272+08
28e78794-b07e-4023-be0c-efc334954fd4	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-04	1415.00000000	1419.80004883	1414.00000000	1419.00000000	1868795	\N	CNY	api	2025-11-07 23:30:11.541945+08
ae286b61-af01-457b-a721-b62b370af9b6	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-05	1421.00000000	1429.93994141	1417.10998535	1427.73999023	2534227	\N	CNY	api	2025-11-07 23:30:11.542296+08
15747073-1c4d-4337-8f10-c53c6be42da6	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-06	1429.00000000	1429.00000000	1419.30004883	1423.88000488	2369928	\N	CNY	api	2025-11-07 23:30:11.542951+08
829af51a-4c97-477d-bbbe-7eed9b60f072	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-07	1423.88000488	1427.69995117	1420.06005859	1422.34997559	2800134	\N	CNY	api	2025-11-07 23:30:11.5436+08
5c8c5d98-5e3e-4fde-9b38-79e3de4d5c74	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-08	1423.05004883	1426.50000000	1418.00000000	1420.96997070	1865528	\N	CNY	api	2025-11-07 23:30:11.5442+08
6c691df9-944e-4ac4-9569-775a8cc6c762	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-11	1423.50000000	1451.98999023	1423.00000000	1445.00000000	4715907	\N	CNY	api	2025-11-07 23:30:11.544727+08
6a9fefc4-52f1-48dc-b50f-5b8e146b4fb2	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-12	1449.00000000	1465.06994629	1436.00000000	1437.04003906	4201923	\N	CNY	api	2025-11-07 23:30:11.545198+08
faba8751-47b1-4ac8-8494-0201207bf83d	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-13	1425.00000000	1433.68005371	1420.00000000	1420.05004883	6552754	\N	CNY	api	2025-11-07 23:30:11.545658+08
902aa81e-85ca-4dc6-a24d-d55a3dc29508	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-14	1420.93994141	1447.51000977	1420.93994141	1426.98999023	4812930	\N	CNY	api	2025-11-07 23:30:11.546107+08
b01bf9f0-cb0e-4144-8423-41fdd157d2fa	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-15	1426.01000977	1428.66003418	1420.21997070	1422.07995605	4758165	\N	CNY	api	2025-11-07 23:30:11.546801+08
9188aca9-123f-43a5-a918-6d2b2304cdc3	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-18	1426.98999023	1436.64001465	1423.09997559	1428.50000000	4737798	\N	CNY	api	2025-11-07 23:30:11.547174+08
7e16dbd2-c8e4-4e06-810d-7bfcfcc8c8f3	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-19	1433.50000000	1446.66003418	1432.00000000	1438.00000000	4637186	\N	CNY	api	2025-11-07 23:30:11.547535+08
b766291a-0dfd-4c9f-a141-44c2d7644d4a	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-20	1438.00000000	1452.80004883	1430.02001953	1450.00000000	4580466	\N	CNY	api	2025-11-07 23:30:11.548177+08
13fc75f3-4d90-4650-96e9-7f83d1d11769	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-21	1453.44995117	1454.98999023	1443.65002441	1448.25000000	3089057	\N	CNY	api	2025-11-07 23:30:11.548599+08
a3a21792-a7af-483c-9066-b87c604c8d59	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-22	1448.88000488	1464.00000000	1444.77001953	1463.94995117	4497058	\N	CNY	api	2025-11-07 23:30:11.548949+08
54005ae1-fb87-4f50-aefc-cf2dd1c66c11	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-25	1470.01000977	1496.00000000	1466.00000000	1490.32995605	6532455	\N	CNY	api	2025-11-07 23:30:11.549653+08
49334e0a-4330-4056-b9f5-1671e1127fe2	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-26	1490.31994629	1494.22998047	1480.01000977	1481.60998535	3960213	\N	CNY	api	2025-11-07 23:30:11.550122+08
8a1a5805-497c-463f-af59-11892133b6ee	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-27	1481.88000488	1484.93005371	1448.00000000	1448.00000000	5600609	\N	CNY	api	2025-11-07 23:30:11.550477+08
22b9a490-b875-4cbd-b3e9-531e9071211b	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-28	1447.96997070	1456.09997559	1438.77001953	1446.09997559	3928177	\N	CNY	api	2025-11-07 23:30:11.550904+08
293290d4-565a-49d9-916e-95bb943395d4	49589118-facc-4785-abf3-3d2d4d054f17	2025-08-29	1453.00000000	1482.57995605	1452.00000000	1480.00000000	6225648	\N	CNY	api	2025-11-07 23:30:11.551158+08
e9f1dc7f-ab9d-407d-a90b-f5da8dff61b5	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-01	1482.19995117	1488.00000000	1465.69995117	1476.09997559	4512338	\N	CNY	api	2025-11-07 23:30:11.551431+08
f5cc4490-d637-4b26-bd34-c9ceca75c908	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-02	1478.66003418	1509.00000000	1478.00000000	1491.30004883	5668837	\N	CNY	api	2025-11-07 23:30:11.551713+08
44a0e96a-e758-42c4-a590-cf7db09c53ed	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-03	1491.00000000	1503.50000000	1466.00000000	1480.55004883	4504503	\N	CNY	api	2025-11-07 23:30:11.552141+08
cca4af4f-dbc0-4608-9bab-648a4595aba6	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-04	1472.00000000	1479.30004883	1460.46997070	1472.66003418	4774676	\N	CNY	api	2025-11-07 23:30:11.552582+08
c46eb38b-8f80-4c59-a04a-7e6c0d3d0d99	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-05	1471.00000000	1486.96997070	1464.00000000	1483.00000000	3738848	\N	CNY	api	2025-11-07 23:30:11.553028+08
0b823c42-6d62-416b-adff-ecdcd1959269	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-08	1483.00000000	1506.43994141	1477.50000000	1501.22998047	5138298	\N	CNY	api	2025-11-07 23:30:11.553758+08
9dc44392-e097-4a3e-9762-e7c6732cb520	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-09	1505.00000000	1509.94995117	1493.42004395	1505.00000000	3574277	\N	CNY	api	2025-11-07 23:30:11.554547+08
5ed99987-9e2c-4e3a-88b5-3954170dbfd6	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-10	1506.66003418	1529.94995117	1496.00000000	1522.01000977	4966331	\N	CNY	api	2025-11-07 23:30:11.555151+08
9aeef414-2e2d-40c2-9529-ab8b18398bf9	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-11	1522.01000977	1526.02001953	1508.50000000	1523.50000000	3723896	\N	CNY	api	2025-11-07 23:30:11.555514+08
59d4e136-fe1b-4e36-b16f-e13ce7dfffa5	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-12	1526.00000000	1538.02001953	1510.53002930	1516.00000000	3372209	\N	CNY	api	2025-11-07 23:30:11.55585+08
7af22254-9853-4697-9fdf-18a305f94e89	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-15	1515.86999512	1517.47998047	1501.50000000	1515.09997559	2582703	\N	CNY	api	2025-11-07 23:30:11.556252+08
e0aa53fb-a8d4-4b70-8f3d-37eb5ceba9c4	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-16	1515.09997559	1520.98999023	1496.20996094	1499.97998047	3271789	\N	CNY	api	2025-11-07 23:30:11.556553+08
ae527b3d-3c10-4b89-8ef1-685efe675fc1	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-17	1499.98999023	1510.28002930	1490.01000977	1493.00000000	3033054	\N	CNY	api	2025-11-07 23:30:11.556872+08
cc491a14-0123-46e3-866c-7bff16c3eb50	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-18	1492.00000000	1497.80004883	1463.50000000	1467.95996094	4972125	\N	CNY	api	2025-11-07 23:30:11.557332+08
16cf5af1-4a29-4ce1-b6a5-bee8ed4f3405	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-19	1467.98999023	1475.50000000	1457.01000977	1467.96997070	3263662	\N	CNY	api	2025-11-07 23:30:11.557708+08
3285c468-e23f-44db-a2b8-ed43126b86e0	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-22	1465.08996582	1467.96997070	1450.01000977	1453.34997559	3494708	\N	CNY	api	2025-11-07 23:30:11.558053+08
5159316f-f2ba-4f63-9c6a-567fc611dcd6	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-23	1450.50000000	1457.50000000	1440.00000000	1447.42004395	3866300	\N	CNY	api	2025-11-07 23:30:11.558381+08
c98abd17-74c5-434e-af45-6e7ffc7dfe51	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-24	1434.06994629	1456.78002930	1434.06994629	1442.00000000	3074350	\N	CNY	api	2025-11-07 23:30:11.55909+08
d1d37950-5088-4bbb-a3f7-cd8639bcccd4	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-25	1442.82995605	1445.20996094	1436.00000000	1439.00000000	3386973	\N	CNY	api	2025-11-07 23:30:11.559441+08
b096ad68-e427-4efa-92d9-f1a29f391997	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-26	1441.18005371	1447.10998535	1428.01000977	1435.00000000	4512071	\N	CNY	api	2025-11-07 23:30:11.559685+08
61623095-de0c-49cd-8763-6b15f3dc3121	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-29	1439.38000488	1469.98999023	1435.00000000	1460.85998535	5368403	\N	CNY	api	2025-11-07 23:30:11.55993+08
665c865f-92f1-42c2-a51d-70d87b188310	49589118-facc-4785-abf3-3d2d4d054f17	2025-09-30	1460.00000000	1460.76000977	1440.00000000	1443.98999023	3936362	\N	CNY	api	2025-11-07 23:30:11.560171+08
97b2230b-7beb-40af-ae5f-90b8a349ac8c	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-09	1436.00000000	1439.38000488	1420.00000000	1436.78002930	5491812	\N	CNY	api	2025-11-07 23:30:11.560443+08
ba62e979-fe84-4570-a66f-32a0e1fa22f2	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-10	1437.59997559	1439.93994141	1427.50000000	1430.00000000	3600144	\N	CNY	api	2025-11-07 23:30:11.560682+08
5ebfbd71-708f-4ba9-9d07-910ee496b6c1	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-13	1415.69995117	1422.84997559	1415.11999512	1419.19995117	4606880	\N	CNY	api	2025-11-07 23:30:11.561022+08
b012c2e5-3549-4723-8a6b-d2ba3fc23c40	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-14	1429.98999023	1464.00000000	1429.98999023	1451.02001953	6667233	\N	CNY	api	2025-11-07 23:30:11.561302+08
c376b0d0-3c5b-4d9b-a8a6-3ce2f046d2a2	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-15	1450.97998047	1463.00000000	1445.07995605	1462.00000000	4278540	\N	CNY	api	2025-11-07 23:30:11.561783+08
74490583-3cb2-4052-a86a-30c21c48ea7a	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-16	1461.92004395	1484.94995117	1458.88000488	1484.91003418	4573015	\N	CNY	api	2025-11-07 23:30:11.562377+08
7e7b1180-f0f9-4993-9b37-34220a52ac0d	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-17	1483.09997559	1488.00000000	1454.03002930	1455.00000000	3808589	\N	CNY	api	2025-11-07 23:30:11.562916+08
8e209201-563a-4b16-89d4-8854d6703ca1	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-20	1455.00000000	1469.50000000	1454.88000488	1457.93005371	2594988	\N	CNY	api	2025-11-07 23:30:11.563206+08
a9ce30d1-0374-466a-864a-b66dc9226ec8	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-21	1459.00000000	1469.93994141	1455.50000000	1462.26000977	2544267	\N	CNY	api	2025-11-07 23:30:11.563542+08
256c13fb-079d-42bd-b510-e17424914722	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-22	1462.07995605	1465.72998047	1456.00000000	1458.69995117	1819492	\N	CNY	api	2025-11-07 23:30:11.563794+08
cc3f9075-5b93-4589-81aa-78167c8d3340	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-23	1455.00000000	1468.80004883	1447.19995117	1467.97998047	2932235	\N	CNY	api	2025-11-07 23:30:11.564081+08
3ea6d25c-fa94-4ff7-a400-04f48b42f93b	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-24	1467.94995117	1478.88000488	1449.33996582	1450.00000000	3822583	\N	CNY	api	2025-11-07 23:30:11.564472+08
32223e91-60f7-41fd-ac0e-32448b47788d	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-27	1440.00000000	1452.48999023	1435.98999023	1440.41003418	3710239	\N	CNY	api	2025-11-07 23:30:11.564727+08
73a9333d-f12c-4da9-acab-e2da11543a6a	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-28	1442.00000000	1451.19995117	1441.09997559	1445.00000000	2712433	\N	CNY	api	2025-11-07 23:30:11.564979+08
1e01c6e5-443c-4dde-a6e8-32fde2001bf3	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-29	1440.02001953	1446.55004883	1430.04003906	1431.90002441	3393711	\N	CNY	api	2025-11-07 23:30:11.565285+08
cfc7e587-c051-4059-9079-c3bfba3bf46c	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-30	1421.81005859	1436.63000488	1421.81005859	1426.73999023	4745610	\N	CNY	api	2025-11-07 23:30:11.565544+08
86479536-1688-4922-a78e-fefed2a89fe9	49589118-facc-4785-abf3-3d2d4d054f17	2025-10-31	1422.00000000	1435.97998047	1420.10998535	1430.01000977	3569377	\N	CNY	api	2025-11-07 23:30:11.565787+08
6dea62cf-c2c5-411e-8330-5390c32c2ffd	49589118-facc-4785-abf3-3d2d4d054f17	2025-11-03	1431.00000000	1448.00000000	1420.09997559	1435.00000000	3454766	\N	CNY	api	2025-11-07 23:30:11.566347+08
6896847f-0d72-4008-ba5d-43da49151cb3	49589118-facc-4785-abf3-3d2d4d054f17	2025-11-04	1435.09997559	1435.78002930	1423.78002930	1429.00000000	2656572	\N	CNY	api	2025-11-07 23:30:11.566642+08
99b14a89-0eab-44c4-b6ab-b0288a1b6978	49589118-facc-4785-abf3-3d2d4d054f17	2025-11-05	1425.89001465	1430.98999023	1420.01000977	1420.07995605	3447527	\N	CNY	api	2025-11-07 23:30:11.566902+08
67714fa0-fc69-4ebe-b2bf-3bd152c8708c	49589118-facc-4785-abf3-3d2d4d054f17	2025-11-07	1435.10998535	1439.78002930	1431.10998535	1433.32995605	1886139	\N	CNY	api	2025-11-07 23:30:11.567155+08
ace01caa-f50e-4508-880d-e586e7c5a168	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-07-31	208.49000549	209.83999634	207.16000366	207.57000732	80698400	\N	USD	api	2025-11-08 15:17:05.496161+08
cbabedf3-ac1c-47ac-8adc-a32421f9c231	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-01	210.86999512	213.58000183	201.50000000	202.38000488	104434500	\N	USD	api	2025-11-08 15:17:05.512498+08
508569c4-18d2-4a41-9cf6-60b7e77bd603	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-04	204.50999451	207.88000488	201.67999268	203.35000610	75109300	\N	USD	api	2025-11-08 15:17:05.513668+08
c18fdd52-e547-4d4c-8a83-f7e7d346cc87	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-05	203.39999390	205.33999634	202.16000366	202.91999817	44155100	\N	USD	api	2025-11-08 15:17:05.514622+08
c7b6fdf2-7c7a-465d-b8e7-a4ed18086d74	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-06	205.63000488	215.38000488	205.58999634	213.25000000	108483100	\N	USD	api	2025-11-08 15:17:05.51557+08
68ded52b-6f04-4a47-a942-ab636d97f3d3	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-07	218.88000488	220.85000610	216.58000183	220.02999878	90224800	\N	USD	api	2025-11-08 15:17:05.51645+08
5806e8af-c0d4-4de3-9fe1-5c6a9640be3b	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-08	220.83000183	231.00000000	219.25000000	229.35000610	113854000	\N	USD	api	2025-11-08 15:17:05.517603+08
a270df6d-b74e-46f9-839b-22e58b918098	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-11	227.91999817	229.55999756	224.75999451	227.17999268	61806100	\N	USD	api	2025-11-08 15:17:05.518423+08
c04e80d3-04b9-456d-9f0e-12431de2301f	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-12	228.00999451	230.80000305	227.07000732	229.64999390	55626200	\N	USD	api	2025-11-08 15:17:05.519113+08
a696d007-5bda-4e7c-85c1-3bc381e065b1	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-13	231.07000732	235.00000000	230.42999268	233.33000183	69878500	\N	USD	api	2025-11-08 15:17:05.520041+08
8724a552-5f2e-4675-a3db-ebf02af96202	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-14	234.05999756	235.11999512	230.85000610	232.77999878	51916300	\N	USD	api	2025-11-08 15:17:05.520654+08
a5f1db19-3dc2-4afe-bebd-9236f1e22a57	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-15	234.00000000	234.27999878	229.33999634	231.58999634	56038700	\N	USD	api	2025-11-08 15:17:05.52169+08
73f22f41-98c7-4995-a6a1-edfe4151f423	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-18	231.69999695	233.11999512	230.11000061	230.88999939	37476200	\N	USD	api	2025-11-08 15:17:05.522275+08
6e5ae8ea-3226-4428-8dc4-69f6f2c3c4cc	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-19	231.27999878	232.86999512	229.35000610	230.55999756	39402600	\N	USD	api	2025-11-08 15:17:05.522804+08
6f981561-d6f0-418c-b2ec-c45ad4a34f50	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-20	229.97999573	230.47000122	225.77000427	226.00999451	42263900	\N	USD	api	2025-11-08 15:17:05.523239+08
c7e651a3-9932-4b99-9cc8-9ec3e8927e7c	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-21	226.27000427	226.52000427	223.77999878	224.89999390	30621200	\N	USD	api	2025-11-08 15:17:05.523664+08
b13ab1ff-a8ef-40a2-a9f8-b7604681cd44	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-22	226.16999817	229.08999634	225.41000366	227.75999451	42477800	\N	USD	api	2025-11-08 15:17:05.524235+08
ab2ae564-8bcb-4133-a195-da7cf96e568b	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-25	226.47999573	229.30000305	226.22999573	227.16000366	30983100	\N	USD	api	2025-11-08 15:17:05.524889+08
073cada8-302e-4571-812a-ffd21c3e1e22	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-26	226.86999512	229.49000549	224.69000244	229.30999756	54575100	\N	USD	api	2025-11-08 15:17:05.525597+08
7f46f2c1-04e5-494e-8d27-0aff183b3655	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-27	228.61000061	230.89999390	228.25999451	230.49000549	31259500	\N	USD	api	2025-11-08 15:17:05.526269+08
1765c6d5-0519-4de1-b1a2-7a8d9d763061	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-28	230.82000732	233.41000366	229.33999634	232.55999756	38074700	\N	USD	api	2025-11-08 15:17:05.526686+08
bcfd0636-d53c-446f-aa89-9904c93a7692	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-08-29	232.50999451	233.38000488	231.36999512	232.13999939	39418400	\N	USD	api	2025-11-08 15:17:05.527086+08
1bee0916-4633-4cda-be9e-35fc4368b2a0	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-02	229.25000000	230.85000610	226.97000122	229.72000122	44075600	\N	USD	api	2025-11-08 15:17:05.527636+08
c9e4c464-ac6e-4562-9989-7a005b2ca70d	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-03	237.21000671	238.85000610	234.36000061	238.47000122	66427800	\N	USD	api	2025-11-08 15:17:05.528166+08
13931f05-d357-4035-aa6e-835e68bfe972	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-04	238.44999695	239.89999390	236.74000549	239.77999878	47549400	\N	USD	api	2025-11-08 15:17:05.528593+08
36211dcf-de7a-4363-9b46-ae2001583bf7	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-05	240.00000000	241.32000732	238.49000549	239.69000244	54870400	\N	USD	api	2025-11-08 15:17:05.528876+08
bd258a92-9d00-4bff-b188-463970900aba	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-08	239.30000305	240.14999390	236.33999634	237.88000488	48999500	\N	USD	api	2025-11-08 15:17:05.529227+08
0dd68ded-78b8-4f65-a1d4-c004f1d5bd72	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-09	237.00000000	238.77999878	233.36000061	234.35000610	66313900	\N	USD	api	2025-11-08 15:17:05.530969+08
773fa7b4-007e-4741-8ce2-59e52665b074	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-10	232.19000244	232.41999817	225.94999695	226.78999329	83440800	\N	USD	api	2025-11-08 15:17:05.531918+08
da3ee903-3bb0-4806-93d4-3d63dc46eb0c	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-11	226.88000488	230.44999695	226.64999390	230.02999878	50208600	\N	USD	api	2025-11-08 15:17:05.532428+08
97f922cb-aa75-4ca3-a67f-d0b96819b670	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-12	229.22000122	234.50999451	229.02000427	234.07000732	55824200	\N	USD	api	2025-11-08 15:17:05.533065+08
23c5c921-64a9-4e2c-a011-14abfe4a33cc	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-15	237.00000000	238.19000244	235.02999878	236.69999695	42699500	\N	USD	api	2025-11-08 15:17:05.53357+08
17331bc0-36c7-4106-9ba7-1aa6fc46e016	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-16	237.17999268	241.22000122	236.32000732	238.14999390	63421100	\N	USD	api	2025-11-08 15:17:05.534185+08
2d3e555c-40af-4da7-81ab-bc3251ed689e	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-17	238.97000122	240.10000610	237.72999573	238.99000549	46508000	\N	USD	api	2025-11-08 15:17:05.534758+08
c2c31d19-ea43-4ce3-919f-797185d4b5e1	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-18	239.97000122	241.19999695	236.64999390	237.88000488	44249600	\N	USD	api	2025-11-08 15:17:05.535255+08
ee1b9ff2-dec1-43d6-a6d9-1dbd16349113	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-19	241.22999573	246.30000305	240.21000671	245.50000000	163741300	\N	USD	api	2025-11-08 15:17:05.535708+08
e1f8cd62-6e18-4eaa-898d-52ba63adfd28	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-22	248.30000305	256.64001465	248.11999512	256.07998657	105517400	\N	USD	api	2025-11-08 15:17:05.536071+08
b14d2df8-1342-4c1f-bc3c-299ecac93668	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-23	255.88000488	257.33999634	253.58000183	254.42999268	60275200	\N	USD	api	2025-11-08 15:17:05.536495+08
5ac35fd9-149b-4bf7-a4b5-0a0b6366e9bc	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-24	255.22000122	255.74000549	251.03999329	252.30999756	42303700	\N	USD	api	2025-11-08 15:17:05.536983+08
a1ea8578-3d93-46db-b8fe-d1fc71cd778c	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-25	253.21000671	257.17001343	251.71000671	256.86999512	55202100	\N	USD	api	2025-11-08 15:17:05.537438+08
a9a172dd-f4f6-4c97-a3e0-c1c1dd8102e2	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-26	254.10000610	257.60000610	253.77999878	255.46000671	46076300	\N	USD	api	2025-11-08 15:17:05.537916+08
69cb1c6e-7db4-43a9-9a90-ac74a10e5605	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-29	254.55999756	255.00000000	253.00999451	254.42999268	40127700	\N	USD	api	2025-11-08 15:17:05.538295+08
cd6a5442-3e25-43eb-994d-875d2a5fa4f7	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-09-30	254.86000061	255.91999817	253.11000061	254.63000488	37704300	\N	USD	api	2025-11-08 15:17:05.538694+08
a2939429-92f9-40f3-966b-9d2a5550bce0	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-01	255.03999329	258.79000854	254.92999268	255.44999695	48713900	\N	USD	api	2025-11-08 15:17:05.539075+08
ec35f426-4dce-4439-b718-9a0b79ae4ce3	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-02	256.57998657	258.17999268	254.14999390	257.13000488	42630200	\N	USD	api	2025-11-08 15:17:05.539621+08
945ee5ad-25c6-4cef-8d13-d1323e2e3231	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-03	254.66999817	259.23999023	253.94999695	258.01998901	49155600	\N	USD	api	2025-11-08 15:17:05.539984+08
3438690c-094c-4530-b622-e02652271681	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-06	257.98999023	259.07000732	255.05000305	256.69000244	44664100	\N	USD	api	2025-11-08 15:17:05.54069+08
85fda8cd-cb7d-47f1-9a8d-6927a2b7200b	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-07	256.80999756	257.39999390	255.42999268	256.48001099	31955800	\N	USD	api	2025-11-08 15:17:05.541186+08
a99a07ad-695c-488c-bc3d-121f4bd08e13	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-08	256.51998901	258.51998901	256.10998535	258.05999756	36496900	\N	USD	api	2025-11-08 15:17:05.541926+08
58e856d9-6ab6-493f-9814-b85232d08bd0	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-09	257.80999756	258.00000000	253.13999939	254.03999329	38322000	\N	USD	api	2025-11-08 15:17:05.543764+08
32d732c6-3ab6-4886-b22f-e5d402e49b1f	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-10	254.94000244	256.38000488	244.00000000	245.27000427	61999100	\N	USD	api	2025-11-08 15:17:05.544767+08
83969812-a211-43ca-b971-e6084ea3b92e	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-13	249.38000488	249.69000244	245.55999756	247.66000366	38142900	\N	USD	api	2025-11-08 15:17:05.54523+08
075b15eb-4fe9-45d4-bf3f-c9d41888f2b9	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-14	246.60000610	248.85000610	244.69999695	247.77000427	35478000	\N	USD	api	2025-11-08 15:17:05.545507+08
4b8f312d-e74c-4934-9171-b08ccdcb6199	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-15	249.49000549	251.82000732	247.47000122	249.33999634	33893600	\N	USD	api	2025-11-08 15:17:05.545816+08
4200bc1c-000a-43b4-9156-137de852a5f2	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-16	248.25000000	249.03999329	245.13000488	247.44999695	39777000	\N	USD	api	2025-11-08 15:17:05.546219+08
fdcdc5f5-b1c8-4481-b1b8-64ec7b436f1f	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-17	248.02000427	253.38000488	247.27000427	252.28999329	49147000	\N	USD	api	2025-11-08 15:17:05.546696+08
412790f0-d98b-4e53-9c0c-747ece1de74e	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-20	255.88999939	264.38000488	255.63000488	262.23999023	90483000	\N	USD	api	2025-11-08 15:17:05.547173+08
817edef4-b998-4587-bc2a-b33864fb92e4	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-21	261.88000488	265.29000854	261.82998657	262.76998901	46695900	\N	USD	api	2025-11-08 15:17:05.547649+08
119e1ea1-dfea-47a0-ab18-af8cdd24bff4	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-22	262.64999390	262.85000610	255.42999268	258.45001221	45015300	\N	USD	api	2025-11-08 15:17:05.548123+08
fcfc3bd6-dcee-45e2-bedd-484eff17b1ac	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-23	259.94000244	260.61999512	258.01000977	259.57998657	32754900	\N	USD	api	2025-11-08 15:17:05.548667+08
ef25325a-695e-4723-9b5f-e042351f1472	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-24	261.19000244	264.13000488	259.17999268	262.82000732	38253700	\N	USD	api	2025-11-08 15:17:05.549093+08
9b34370a-2fd5-4815-a3d4-05c4f6c4a2f8	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-27	264.88000488	269.11999512	264.64999390	268.80999756	44888200	\N	USD	api	2025-11-08 15:17:05.549515+08
dfe02d9c-0c66-4130-acef-cb1511b73178	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-28	268.98999023	269.89001465	268.14999390	269.00000000	41534800	\N	USD	api	2025-11-08 15:17:05.550497+08
10d6d549-7617-4186-bc3e-c72d79e6dc87	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-29	269.27999878	271.41000366	267.10998535	269.70001221	51086700	\N	USD	api	2025-11-08 15:17:05.551044+08
ad79d7b7-3a53-498c-a227-e9f18dca4c6a	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-30	271.98999023	274.14001465	268.48001099	271.39999390	69886500	\N	USD	api	2025-11-08 15:17:05.551819+08
fe37a344-ab02-459f-a486-27e73cd0d631	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-10-31	276.98999023	277.32000732	269.16000366	270.36999512	86167100	\N	USD	api	2025-11-08 15:17:05.552581+08
74ad39b5-3a1d-4cf1-903a-22afb9175dbd	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-11-03	270.42001343	270.85000610	266.25000000	269.04998779	50194600	\N	USD	api	2025-11-08 15:17:05.552946+08
c452fe7f-b1ce-4e7f-aa93-530fea6fc42d	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-11-04	268.32998657	271.48999023	267.61999512	270.04000854	49274800	\N	USD	api	2025-11-08 15:17:05.553379+08
2f2dcea7-b3eb-481c-96f0-95d24721eedf	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-11-05	268.60998535	271.70001221	266.92999268	270.14001465	43683100	\N	USD	api	2025-11-08 15:17:05.553816+08
de8ba660-a8c4-4657-bb43-b81dae89b24f	9dd1720a-bd8f-4810-9648-b47b516d82cb	2025-11-06	267.89001465	273.39999390	267.89001465	269.76998901	51157400	\N	USD	api	2025-11-08 15:17:05.554143+08
6727f41d-902b-41e2-8250-e563b044821d	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-07-31	195.71000671	195.99000549	191.08999634	191.89999390	51329200	\N	USD	api	2025-11-08 15:17:05.765667+08
4ba43774-aa29-47b0-a920-69a62ab691b2	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-01	189.02999878	190.83000183	187.82000732	189.13000488	34832200	\N	USD	api	2025-11-08 15:17:05.767434+08
124aebe9-9ee1-467b-b474-492bf23a8df8	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-04	190.28999329	195.27000427	190.11999512	195.03999329	31547400	\N	USD	api	2025-11-08 15:17:05.76872+08
653837f9-b46b-4bfc-9d20-602ea92e0f5c	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-05	194.71000671	197.86000061	193.88999939	194.66999817	31602300	\N	USD	api	2025-11-08 15:17:05.769548+08
734df154-fd37-42a1-8fe2-00360dbcc359	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-06	194.50000000	196.63000488	193.66999817	196.08999634	21562900	\N	USD	api	2025-11-08 15:17:05.770259+08
f92911f4-4024-480c-904e-712530f6c38a	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-07	197.05999756	197.53999329	194.33000183	196.52000427	26321800	\N	USD	api	2025-11-08 15:17:05.770767+08
a91663da-902c-4bc1-bd62-8c09e76ba5d7	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-08	197.22000122	202.61000061	197.16999817	201.41999817	39161800	\N	USD	api	2025-11-08 15:17:05.771324+08
cdd7a101-e4db-4e42-9a7e-751182ed8d08	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-11	200.94000244	201.47999573	199.07000732	201.00000000	25832400	\N	USD	api	2025-11-08 15:17:05.771956+08
0652c647-d772-4b8a-89dc-1e24ea68600c	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-12	201.36999512	204.50000000	200.58999634	203.33999634	30397900	\N	USD	api	2025-11-08 15:17:05.772676+08
2810fcae-af76-4637-ac1e-09e4a242d4d7	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-13	204.13000488	204.52999878	197.50999451	201.96000671	28342900	\N	USD	api	2025-11-08 15:17:05.773278+08
01174f5b-9ef8-4845-9ca4-0a1688f2a5b4	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-14	201.50000000	204.44000244	201.22999573	202.94000244	25230400	\N	USD	api	2025-11-08 15:17:05.773823+08
aada027c-19a1-4eb4-a996-f0752875739c	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-15	203.85000610	206.44000244	201.27999878	203.89999390	34931400	\N	USD	api	2025-11-08 15:17:05.77443+08
67c3ee0b-e927-4101-b0d4-cf59977007f2	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-18	204.19999695	205.27000427	202.49000549	203.50000000	18526600	\N	USD	api	2025-11-08 15:17:05.774944+08
f4c2254e-9e7e-4fa7-a464-857a2577a405	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-19	203.02999878	203.44000244	199.96000671	201.57000732	24240200	\N	USD	api	2025-11-08 15:17:05.775547+08
e9b97dac-2a5d-4cf7-8123-50ba8e07c413	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-20	200.72999573	201.27999878	196.60000610	199.32000732	28955500	\N	USD	api	2025-11-08 15:17:05.776229+08
d961b077-0aca-4557-b110-ea06f812a583	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-21	199.75000000	202.47999573	199.42999268	199.75000000	19774600	\N	USD	api	2025-11-08 15:17:05.77677+08
985a37c7-43df-4590-be9f-e34e32601d43	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-22	202.72999573	208.53999329	201.30000305	206.08999634	42827000	\N	USD	api	2025-11-08 15:17:05.777334+08
ede14b8e-6d74-48b0-a23f-8d64f1493f5b	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-25	206.42999268	210.52000427	205.27999878	208.49000549	29928900	\N	USD	api	2025-11-08 15:17:05.777916+08
e6882463-99a9-42da-9166-e9f11d10f64a	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-26	207.50999451	207.85000610	205.69999695	207.13999939	28464100	\N	USD	api	2025-11-08 15:17:05.77854+08
dd415657-b09b-452a-a01a-d0dd0b453bcb	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-27	205.69999695	208.91000366	205.64999390	207.47999573	23022900	\N	USD	api	2025-11-08 15:17:05.779254+08
b31fe9fb-8eca-46db-aa7f-6b04b256f9ad	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-28	207.25000000	212.22000122	206.89999390	211.63999939	32339300	\N	USD	api	2025-11-08 15:17:05.780175+08
b1f42fd1-bd8c-4cc1-b641-b395895369e6	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-08-29	210.50999451	214.64999390	210.19999695	212.91000366	39728400	\N	USD	api	2025-11-08 15:17:05.780938+08
ced4cae7-b543-4a17-b767-58d69735ec4d	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-02	208.44000244	211.67999268	206.19999695	211.35000610	47523000	\N	USD	api	2025-11-08 15:17:05.781928+08
dfeb63b4-78af-43c1-969e-7cde900794e8	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-03	226.21000671	231.30999756	224.78999329	230.66000366	103336100	\N	USD	api	2025-11-08 15:17:05.782471+08
7235d7fe-3df3-4316-b7c3-c72e044645fb	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-04	229.64999390	232.36999512	226.11000061	232.30000305	51684200	\N	USD	api	2025-11-08 15:17:05.782888+08
6ae3a073-58eb-4652-9697-2c1e35c8c05f	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-05	232.19999695	235.75999451	231.89999390	235.00000000	46588900	\N	USD	api	2025-11-08 15:17:05.783304+08
b0fd723b-3942-4b9e-a8cd-fb156629e692	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-08	235.47000122	238.13000488	233.66999817	234.03999329	32474700	\N	USD	api	2025-11-08 15:17:05.783964+08
fa1b6a04-9848-4c25-b366-3fc7adde4f93	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-09	234.16999817	240.47000122	233.22999573	239.63000488	38061000	\N	USD	api	2025-11-08 15:17:05.784484+08
bcadf66f-17ab-4459-a796-a037a0b3fcb7	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-10	238.89999390	241.66000366	237.85000610	239.16999817	35141100	\N	USD	api	2025-11-08 15:17:05.784981+08
99c0c95a-787a-40be-a198-2a184a707f71	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-11	239.88000488	242.25000000	236.25000000	240.36999512	30599300	\N	USD	api	2025-11-08 15:17:05.78546+08
d3ade175-7cbd-40ad-8d07-caff9e6a8770	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-12	240.36999512	242.08000183	238.00000000	240.80000305	26771600	\N	USD	api	2025-11-08 15:17:05.785936+08
0c5802b1-0ee7-434e-9a4d-693ccc12c481	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-15	244.66000366	252.41000366	244.66000366	251.61000061	58383800	\N	USD	api	2025-11-08 15:17:05.786497+08
72229223-1f3b-4340-989f-739e8cb45777	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-16	252.08000183	253.03999329	249.47000122	251.16000366	34109700	\N	USD	api	2025-11-08 15:17:05.786967+08
d618d738-406d-4dff-b818-96275cf79e5b	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-17	251.22000122	251.60000610	246.27999878	249.52999878	34108000	\N	USD	api	2025-11-08 15:17:05.787457+08
ebac9fb8-77f3-493e-afa0-8aab9b986c6e	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-18	251.67999268	253.99000549	249.80000305	252.02999878	31239500	\N	USD	api	2025-11-08 15:17:05.787909+08
be98bd67-f5a6-46dc-8eb6-70ab7dc1ca31	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-19	253.25000000	256.00000000	251.80999756	254.72000122	55571400	\N	USD	api	2025-11-08 15:17:05.788252+08
9958c2b5-a67e-4039-a483-c1c68fbca662	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-22	254.42999268	255.77999878	250.30000305	252.52999878	32290500	\N	USD	api	2025-11-08 15:17:05.788671+08
6382c206-69b5-49b8-91d0-bd7754188639	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-23	253.03999329	254.36000061	250.47999573	251.66000366	26628000	\N	USD	api	2025-11-08 15:17:05.78924+08
56b6c9af-61a2-4162-8241-747d46e7ecfa	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-24	251.66000366	252.35000610	246.44000244	247.13999939	28201000	\N	USD	api	2025-11-08 15:17:05.789773+08
ace56d9d-260f-4457-841f-777d2d11e4b0	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-25	244.39999390	246.49000549	240.74000549	245.78999329	31020400	\N	USD	api	2025-11-08 15:17:05.790252+08
c92000ec-1870-4aff-ac00-e00758b747c2	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-26	247.07000732	249.41999817	245.97000122	246.53999329	18503200	\N	USD	api	2025-11-08 15:17:05.790729+08
a91342d6-6d11-4929-b7e7-ee00cfb9ec9c	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-29	247.85000610	251.14999390	242.77000427	244.05000305	32505800	\N	USD	api	2025-11-08 15:17:05.791197+08
fb441786-ef00-41e2-934e-fe289c5ee517	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-09-30	242.80999756	243.28999329	239.25000000	243.10000610	34724300	\N	USD	api	2025-11-08 15:17:05.791718+08
8baf05d9-5903-4c16-b34a-37331af3fcdf	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-01	240.75000000	246.30000305	238.61000061	244.89999390	31658200	\N	USD	api	2025-11-08 15:17:05.792702+08
eba4077a-3791-4dd4-9502-f868600eb467	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-02	245.14999390	246.80999756	242.30000305	245.69000244	25483300	\N	USD	api	2025-11-08 15:17:05.793314+08
1e6d832a-c833-4ddc-bf22-287dbd281430	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-03	244.49000549	246.30000305	241.66000366	245.35000610	30249600	\N	USD	api	2025-11-08 15:17:05.79384+08
575f2573-8027-4db3-8ee0-75ebeed880a6	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-06	244.77999878	251.32000732	244.58000183	250.42999268	28894700	\N	USD	api	2025-11-08 15:17:05.794647+08
2e534704-c3ad-417d-9693-9f0ec2f54630	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-07	248.27000427	250.44000244	245.52000427	245.75999451	23181300	\N	USD	api	2025-11-08 15:17:05.79528+08
ec86c605-2a9a-469e-ae8f-837c2d10e62d	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-08	244.96000671	246.00999451	243.82000732	244.61999512	21307100	\N	USD	api	2025-11-08 15:17:05.796042+08
6fcad347-b708-48eb-9928-4b03989bdf9a	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-09	244.47000122	244.75999451	239.14999390	241.52999878	27892100	\N	USD	api	2025-11-08 15:17:05.796589+08
cbbeac23-9b18-48f0-a18b-b1b69ee7a1d1	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-10	241.42999268	244.08999634	235.83999634	236.57000732	33180300	\N	USD	api	2025-11-08 15:17:05.797128+08
8e805b4f-7a2c-40f4-8de6-a8643381aea8	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-13	240.21000671	244.50000000	239.71000671	244.14999390	24995000	\N	USD	api	2025-11-08 15:17:05.797697+08
5410cbf0-5532-4dd2-a980-cd66beff2f27	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-14	241.22999573	247.11999512	240.50999451	245.44999695	22111600	\N	USD	api	2025-11-08 15:17:05.798197+08
54f2d7ea-5890-47f1-8871-5c12b846af25	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-15	247.25000000	252.11000061	245.99000549	251.02999878	27007700	\N	USD	api	2025-11-08 15:17:05.798731+08
75976dff-c260-4d65-8031-e088e3b482b4	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-16	251.77000427	256.95999146	250.10000610	251.46000671	27997200	\N	USD	api	2025-11-08 15:17:05.799273+08
08810610-e34b-4918-b45a-c43c93b37389	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-17	250.75999451	254.22000122	247.80999756	253.30000305	29671600	\N	USD	api	2025-11-08 15:17:05.799827+08
452d8b45-f49e-4186-a7c5-d0182127dfab	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-20	254.69000244	257.32998657	254.22999573	256.54998779	22350200	\N	USD	api	2025-11-08 15:17:05.800314+08
dfe43fee-c964-44cc-9ec9-0fd1b7441502	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-21	254.74000549	254.88000488	244.14999390	250.46000671	47312100	\N	USD	api	2025-11-08 15:17:05.800853+08
64d0bb5d-237d-46c0-aff1-f589def6c536	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-22	254.36999512	256.35998535	249.28999329	251.69000244	35029400	\N	USD	api	2025-11-08 15:17:05.801347+08
56596578-809a-4528-9523-9a7ce5111e5e	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-23	252.97999573	255.03999329	251.85000610	253.08000183	19901400	\N	USD	api	2025-11-08 15:17:05.801829+08
a469377e-61b7-4e2d-86d6-8b424d56a8d7	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-24	256.57998657	261.67999268	255.32000732	259.92001343	28655100	\N	USD	api	2025-11-08 15:17:05.8023+08
a5056406-5bc8-41d2-9715-3a138cf5c3ac	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-27	264.82000732	270.14001465	264.27999878	269.26998901	35235200	\N	USD	api	2025-11-08 15:17:05.802718+08
eb9d48ab-8bf5-4763-ab92-9b6b8ed05b9a	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-28	269.69000244	270.73001099	266.50000000	267.47000122	29738600	\N	USD	api	2025-11-08 15:17:05.80314+08
fc89d116-540e-4aeb-9cc3-57618a7c600c	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-29	267.75000000	275.33999634	267.67001343	274.57000732	43580300	\N	USD	api	2025-11-08 15:17:05.803722+08
61cc9f0b-7496-47e4-96e9-5acf00bc89f3	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-30	291.58999634	291.58999634	280.05999756	281.48001099	74876000	\N	USD	api	2025-11-08 15:17:05.804114+08
2f56d42f-0159-41b5-ae11-2623e0a4c88d	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-10-31	283.20999146	286.00000000	277.02999878	281.19000244	39267900	\N	USD	api	2025-11-08 15:17:05.804618+08
93aea98a-3b63-4ec2-bbe3-1f1074a29ef0	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-11-03	282.17999268	285.52999878	279.79998779	283.72000122	29786000	\N	USD	api	2025-11-08 15:17:05.805134+08
38c7f576-244b-4a42-bf12-a06ee1fb0950	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-11-04	276.75000000	281.26998901	276.26000977	277.54000854	30078400	\N	USD	api	2025-11-08 15:17:05.805492+08
9c8efd8e-4cd7-4577-8493-1120ae60840a	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-11-05	278.86999512	286.42001343	277.33999634	284.30999756	31010300	\N	USD	api	2025-11-08 15:17:05.805923+08
7c094285-b824-40aa-9e02-92eccd9a53d6	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-11-06	285.32998657	288.35000610	281.14001465	284.75000000	37173600	\N	USD	api	2025-11-08 15:17:05.806423+08
d0a56650-b852-4d94-ac75-516e55de258d	e18a110d-3daa-4d2f-9880-c3985dce8bbf	2025-11-07	283.20999146	283.77999878	275.19000244	278.82998657	34440600	\N	USD	api	2025-11-08 15:17:05.806918+08
08c080f9-6b97-4d87-8c63-be141ad75aea	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-07-31	555.22998047	555.45001221	531.90002441	533.50000000	51617300	\N	USD	api	2025-11-08 15:17:06.047949+08
eeb79256-4220-4c80-8978-ce35eeb84fb4	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-01	535.00000000	535.79998779	520.85998535	524.10998535	28977600	\N	USD	api	2025-11-08 15:17:06.049809+08
1d267b4f-c72e-4715-973b-d3db22ed9637	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-04	528.27001953	538.25000000	528.13000488	535.64001465	25349000	\N	USD	api	2025-11-08 15:17:06.050897+08
5b39640e-3b8c-4a61-98e9-0bcd42c4b79f	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-05	537.17999268	537.29998779	527.23999023	527.75000000	19171600	\N	USD	api	2025-11-08 15:17:06.051472+08
3614d534-8254-4298-a2ff-47847b75f260	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-06	530.90002441	531.70001221	524.03002930	524.94000244	21355700	\N	USD	api	2025-11-08 15:17:06.052073+08
a5d25954-7393-419e-a0f2-9981c01e0539	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-07	526.79998779	528.09002686	517.54998779	520.84002686	16079100	\N	USD	api	2025-11-08 15:17:06.053934+08
c53296f9-911a-43b6-98f5-889c8a391893	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-08	522.59997559	524.65997314	519.40997314	522.03997803	15531000	\N	USD	api	2025-11-08 15:17:06.05452+08
8ee73fe5-bcb4-4286-aa78-f314513594ea	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-11	522.29998779	527.59002686	519.71997070	521.77001953	20194400	\N	USD	api	2025-11-08 15:17:06.055054+08
954f418b-8744-457a-a892-d189bf3866c7	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-12	523.75000000	530.97998047	522.70001221	529.23999023	18667000	\N	USD	api	2025-11-08 15:17:06.055536+08
c1acd796-5048-421a-998c-1923c4c9c942	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-13	532.10998535	532.70001221	519.36999512	520.58001709	19619200	\N	USD	api	2025-11-08 15:17:06.056033+08
63adb338-76f0-403e-b397-cffaef64dc6b	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-14	522.55999756	525.95001221	520.14001465	522.47998047	20269100	\N	USD	api	2025-11-08 15:17:06.056491+08
666ed2d9-7b23-407f-bbf5-7e98f7eb020b	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-15	522.77001953	526.09997559	519.08001709	520.16998291	25213300	\N	USD	api	2025-11-08 15:17:06.05705+08
aaf53b74-09ca-4205-a600-7b1bec5b5b72	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-18	521.59002686	522.82000732	514.02001953	517.09997559	23760600	\N	USD	api	2025-11-08 15:17:06.057838+08
a7f341d7-bdf0-4036-95b6-c59714281afc	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-19	515.00000000	515.15997314	508.54998779	509.76998901	21481000	\N	USD	api	2025-11-08 15:17:06.058671+08
37f49e28-aa09-4c61-a9f2-ff0cc2e504ed	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-20	509.86999512	511.00000000	504.44000244	505.72000122	27723000	\N	USD	api	2025-11-08 15:17:06.059331+08
8dc048e8-0f73-4dab-b0cb-a2e15efb153a	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-21	503.69000244	507.63000488	502.72000122	504.23999023	18443300	\N	USD	api	2025-11-08 15:17:06.059904+08
e3c008af-22b6-40a2-b4c4-b652e6085703	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-22	504.25000000	510.73001099	502.41000366	507.23001099	24324200	\N	USD	api	2025-11-08 15:17:06.060429+08
09a4d1e2-c54a-499a-8560-b293633482eb	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-25	506.63000488	508.19000244	504.11999512	504.26000977	21638600	\N	USD	api	2025-11-08 15:17:06.060989+08
2e56da8d-addb-4479-b3de-fad729a7e70f	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-26	504.35998535	504.98001099	498.51000977	502.04000854	30835700	\N	USD	api	2025-11-08 15:17:06.06149+08
3d748c8f-a54d-4891-aeb6-adbf61481717	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-27	502.00000000	507.29000854	499.89999390	506.73999023	17277900	\N	USD	api	2025-11-08 15:17:06.062511+08
a06130aa-3cef-457a-8ab0-ba028bbbf2ef	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-28	507.08999634	511.08999634	505.50000000	509.64001465	18015600	\N	USD	api	2025-11-08 15:17:06.06351+08
c025e864-1c9e-4bbb-bc4b-153452a611d5	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-08-29	508.66000366	509.60000610	504.48999023	506.69000244	20961600	\N	USD	api	2025-11-08 15:17:06.064274+08
ff26a19a-fafe-431a-8f5c-738de7294031	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-02	500.47000122	506.00000000	496.80999756	505.11999512	18128000	\N	USD	api	2025-11-08 15:17:06.064816+08
2912d248-51e5-4447-abfe-64e24909a8ee	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-03	503.79000854	507.79000854	502.32000732	505.35000610	16345100	\N	USD	api	2025-11-08 15:17:06.065286+08
efeb03df-d1a4-4823-9454-61599520c71d	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-04	504.29998779	508.14999390	503.14999390	507.97000122	15509500	\N	USD	api	2025-11-08 15:17:06.065681+08
4c38ca16-f01e-480c-a9b3-196457ca51a1	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-05	509.07000732	511.97000122	492.36999512	495.00000000	31994800	\N	USD	api	2025-11-08 15:17:06.066085+08
1f5cc68f-ecba-433a-b654-be4e5ce30880	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-08	498.10998535	501.20001221	495.02999878	498.20001221	16771000	\N	USD	api	2025-11-08 15:17:06.066583+08
b182a052-1831-4bdb-a5a9-42cb37efce94	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-09	501.42999268	502.25000000	497.70001221	498.41000366	14410500	\N	USD	api	2025-11-08 15:17:06.067059+08
8a28b9ae-aae7-4f73-9cdd-0b0243bc480d	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-10	502.98001099	503.23001099	496.72000122	500.36999512	21611800	\N	USD	api	2025-11-08 15:17:06.067442+08
5fe6bc1d-dbae-4927-8c0e-0fd630f9c246	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-11	502.25000000	503.17001343	497.88000488	501.01000977	18881600	\N	USD	api	2025-11-08 15:17:06.067823+08
56f5699a-5b66-4ada-a7df-63b5912b6e86	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-12	506.64999390	512.54998779	503.85000610	509.89999390	23624900	\N	USD	api	2025-11-08 15:17:06.068178+08
8d393e7b-814c-4c29-9d63-c1974337aab4	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-15	508.79000854	515.46997070	507.00000000	515.35998535	17143800	\N	USD	api	2025-11-08 15:17:06.068553+08
b8c814ec-5a54-496b-82de-493890639e48	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-16	516.88000488	517.22998047	508.60000610	509.04000854	19711900	\N	USD	api	2025-11-08 15:17:06.068975+08
fb247a83-c759-4ba7-85dd-91994a163eef	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-17	510.61999512	511.29000854	505.92999268	510.01998901	15816600	\N	USD	api	2025-11-08 15:17:06.06934+08
95079b3b-4037-4457-bd03-e875013e67a1	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-18	511.48999023	513.07000732	507.66000366	508.45001221	18913700	\N	USD	api	2025-11-08 15:17:06.069716+08
9b9a5d50-d4bb-40a6-aec9-70a8a0ab3886	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-19	510.55999756	519.29998779	510.30999756	517.92999268	52474100	\N	USD	api	2025-11-08 15:17:06.07008+08
5a9b224c-4a5e-4f26-9936-7413a3632002	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-22	515.59002686	517.73999023	512.53997803	514.45001221	20009300	\N	USD	api	2025-11-08 15:17:06.070665+08
a4a1b3b3-c7ff-4cee-9f35-429aec793524	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-23	513.79998779	514.59002686	507.30999756	509.23001099	19799600	\N	USD	api	2025-11-08 15:17:06.071249+08
5fae0276-95ea-461b-9f25-e9b5e170fcd3	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-24	510.38000488	512.47998047	506.92001343	510.14999390	13533700	\N	USD	api	2025-11-08 15:17:06.071714+08
b9a03200-03c3-4d52-af21-45ddcd3d9378	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-25	508.29998779	510.01000977	505.04000854	507.02999878	15786500	\N	USD	api	2025-11-08 15:17:06.072421+08
4c5a3469-1561-457a-bdfb-b598877f7440	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-26	510.05999756	513.94000244	506.61999512	511.45999146	16213100	\N	USD	api	2025-11-08 15:17:06.072801+08
430e2e9c-9d04-44e9-8d50-def85d8d7261	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-29	511.50000000	516.84997559	508.88000488	514.59997559	17617800	\N	USD	api	2025-11-08 15:17:06.073283+08
4084183c-6b3d-4a99-9e6e-a40608419712	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-09-30	513.23999023	518.15997314	509.66000366	517.95001221	19728200	\N	USD	api	2025-11-08 15:17:06.073597+08
d95c7d20-382c-474d-bf53-e20edd61579e	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-01	514.79998779	520.51000977	511.69000244	519.71002197	22632300	\N	USD	api	2025-11-08 15:17:06.073903+08
722e3400-c779-4e8d-8a3e-933627930d44	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-02	517.64001465	521.59997559	510.67999268	515.73999023	21222900	\N	USD	api	2025-11-08 15:17:06.07432+08
8241b356-50da-44ee-aa44-d45c38452dd4	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-03	517.09997559	520.48999023	515.00000000	517.34997559	15112300	\N	USD	api	2025-11-08 15:17:06.07469+08
bddf0adf-5413-4bb8-9937-b31cdeced158	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-06	518.60998535	531.03002930	518.20001221	528.57000732	21388600	\N	USD	api	2025-11-08 15:17:06.075184+08
8dcbfd39-64e1-4d31-8578-d0f0313e68bc	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-07	528.28997803	529.79998779	521.44000244	523.97998047	14615200	\N	USD	api	2025-11-08 15:17:06.075564+08
e80d3ebe-eeb3-4dcc-8f33-12612757e274	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-08	523.28002930	526.95001221	523.09002686	524.84997559	13363400	\N	USD	api	2025-11-08 15:17:06.076025+08
a5098334-640c-46a0-ab0b-e91547da6e42	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-09	522.34002686	524.33001709	517.40002441	522.40002441	18343600	\N	USD	api	2025-11-08 15:17:06.07643+08
c4b21ad0-bad1-43c8-b8fb-9fbad69135bf	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-10	519.64001465	523.58001709	509.63000488	510.95999146	24133800	\N	USD	api	2025-11-08 15:17:06.076851+08
501730a2-c2f8-407a-8b1d-fae0702b885a	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-13	516.40997314	516.40997314	511.67999268	514.04998779	14284200	\N	USD	api	2025-11-08 15:17:06.077418+08
6f853044-0f2f-4eca-b19a-9218110fc8de	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-14	510.23001099	515.28002930	506.00000000	513.57000732	14684300	\N	USD	api	2025-11-08 15:17:06.077939+08
11d4024e-17c0-40df-bf50-ca5410eff0b5	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-15	514.96002197	517.19000244	510.00000000	513.42999268	14694700	\N	USD	api	2025-11-08 15:17:06.078441+08
97cef788-988f-4f7c-a838-dfab223bb25f	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-16	512.58001709	516.84997559	508.13000488	511.60998535	15559600	\N	USD	api	2025-11-08 15:17:06.079062+08
197655c2-4a50-40db-b623-aa69ff29c9bd	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-17	509.04000854	515.47998047	507.30999756	513.58001709	19867800	\N	USD	api	2025-11-08 15:17:06.079784+08
d642ce7c-fd8a-4372-a5cc-1454102b0245	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-20	514.60998535	518.70001221	513.42999268	516.78997803	14665600	\N	USD	api	2025-11-08 15:17:06.080223+08
8f98f70c-1f4a-4628-8423-a3a848c65f75	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-21	517.50000000	518.69000244	513.03997803	517.65997314	15586200	\N	USD	api	2025-11-08 15:17:06.080732+08
c6414894-ed46-4200-b38a-f981227f3b54	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-22	521.15002441	525.22998047	517.71002197	520.53997803	18962700	\N	USD	api	2025-11-08 15:17:06.081137+08
fa334da6-b081-4eeb-abc5-300e724eb085	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-23	522.46002197	523.95001221	518.60998535	520.55999756	14023500	\N	USD	api	2025-11-08 15:17:06.081518+08
ea0aeba1-d3a4-413f-9e3a-91bf69801510	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-24	522.78997803	525.34997559	520.71002197	523.60998535	15532400	\N	USD	api	2025-11-08 15:17:06.082219+08
91da6e24-32e8-4caf-939c-2f9241c58a1c	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-27	531.78002930	534.58001709	529.01000977	531.52001953	18734700	\N	USD	api	2025-11-08 15:17:06.082579+08
89e15467-cbb2-4af6-abcc-8b5ad0ec6f35	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-28	550.00000000	553.71997070	540.77001953	542.07000732	29986700	\N	USD	api	2025-11-08 15:17:06.082916+08
8ba3a7f8-904f-4cb2-b75f-f289ceacfc6d	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-29	544.94000244	546.27001953	536.72998047	541.54998779	36023000	\N	USD	api	2025-11-08 15:17:06.083287+08
b73fb713-2eeb-4a44-8a7f-04f6471ea079	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-30	530.47998047	534.96997070	522.11999512	525.76000977	41023100	\N	USD	api	2025-11-08 15:17:06.083638+08
511f8018-1165-4941-a24d-e7285ac8e8e0	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-10-31	528.88000488	529.32000732	515.09997559	517.80999756	34006400	\N	USD	api	2025-11-08 15:17:06.08398+08
7a0ea510-61db-4aa0-aafb-2b924addf10d	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-11-03	519.80999756	524.96002197	514.59002686	517.03002930	22374700	\N	USD	api	2025-11-08 15:17:06.084326+08
7342c8dc-0e04-4918-ad34-3a58a6dc45aa	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-11-04	511.76000977	515.54998779	507.83999634	514.33001709	20958700	\N	USD	api	2025-11-08 15:17:06.084667+08
aa72d41f-99f5-4ac9-b91b-8150c3388661	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-11-05	513.29998779	514.83001709	506.57998657	507.16000366	23024300	\N	USD	api	2025-11-08 15:17:06.085004+08
a2fa2e21-6481-4fc3-b96d-ce2fc5ae45f0	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-11-06	505.66000366	505.70001221	495.80999756	497.10000610	27375300	\N	USD	api	2025-11-08 15:17:06.085354+08
3be1ccd4-1d6a-43e4-972d-9fc9db36d2c3	43fc85a9-db6d-4390-a6ef-7b4b5979fdda	2025-11-07	496.95001221	499.38000488	493.25000000	496.82000732	23980600	\N	USD	api	2025-11-08 15:17:06.085693+08
3f402407-a47b-4e6e-b583-e192f434b1b0	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-07-31	319.60998535	321.36999512	306.10000610	308.26998901	85270900	\N	USD	api	2025-11-08 15:17:06.296188+08
f2f3b8ed-a307-44d6-90b2-52dabbfbae66	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-01	306.20999146	309.30999756	297.82000732	302.63000488	89121400	\N	USD	api	2025-11-08 15:17:06.297506+08
e5e297e6-c3c0-4608-9a80-30d5bc375c1a	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-04	309.07998657	312.11999512	303.00000000	309.26000977	78683900	\N	USD	api	2025-11-08 15:17:06.298215+08
5f8ea233-5a92-4573-b517-a83686805b5a	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-05	308.95001221	312.45001221	305.50000000	308.72000122	57961300	\N	USD	api	2025-11-08 15:17:06.298864+08
72149d6c-5d3e-4a1a-8b4d-8ea893f182e1	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-06	307.89001465	320.47000122	306.92999268	319.91000366	78523600	\N	USD	api	2025-11-08 15:17:06.299343+08
db4287d1-5cdd-45bd-ad2d-599dae758d9c	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-07	319.79000854	322.39999390	316.16000366	322.26998901	66658700	\N	USD	api	2025-11-08 15:17:06.299957+08
a3f9bf65-7813-4a85-9d0f-a8a3877673eb	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-08	321.42999268	335.14999390	320.98001099	329.64999390	91200300	\N	USD	api	2025-11-08 15:17:06.300447+08
35942172-d148-4f88-bcff-aab1a65df2cd	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-11	335.00000000	346.64001465	334.14999390	339.02999878	105320200	\N	USD	api	2025-11-08 15:17:06.300913+08
8fd62a04-22a0-42d0-9566-a02b75654c18	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-12	345.00000000	345.26000977	332.94000244	340.83999634	80522100	\N	USD	api	2025-11-08 15:17:06.301417+08
55756569-863f-4853-80d9-b7f80f24ec5d	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-13	341.50000000	348.98001099	338.20001221	339.38000488	67838900	\N	USD	api	2025-11-08 15:17:06.302258+08
3bdaf723-dc94-42e1-aff7-6270516e1705	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-14	335.76000977	340.47000122	330.39999390	335.57998657	75000700	\N	USD	api	2025-11-08 15:17:06.302676+08
a8edda8b-9d34-47ad-8828-ff132bdbc6f9	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-15	337.66000366	339.29998779	327.01998901	330.55999756	74319800	\N	USD	api	2025-11-08 15:17:06.30308+08
c0ded01a-37b5-4a76-9d57-00e7a33b4d0a	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-18	329.61999512	336.26998901	329.58999634	335.16000366	56956600	\N	USD	api	2025-11-08 15:17:06.303521+08
1214f78e-228f-40a6-8458-15ff95c7cb7e	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-19	335.79000854	340.54998779	327.85000610	329.30999756	75956000	\N	USD	api	2025-11-08 15:17:06.303947+08
41d315e1-deb1-4133-88f1-724daa8e4767	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-20	329.22000122	331.36999512	314.60000610	323.89999390	77481800	\N	USD	api	2025-11-08 15:17:06.304375+08
19a1f294-0d0b-421f-8b61-6781d51ff6e8	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-21	322.07998657	324.89999390	318.67999268	320.10998535	55744400	\N	USD	api	2025-11-08 15:17:06.304863+08
97c0c4b2-dd6f-4e6c-842f-f9df0b3c8fae	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-22	321.66000366	340.25000000	319.69000244	340.01000977	94016300	\N	USD	api	2025-11-08 15:17:06.305336+08
ec036f52-2d41-45a4-a8d9-a55ef177657b	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-25	338.89999390	349.52999878	335.02999878	346.60000610	86670000	\N	USD	api	2025-11-08 15:17:06.305943+08
437a11d1-3911-4308-be9a-41149f10aa25	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-26	344.92999268	351.89999390	343.72000122	351.67001343	76651600	\N	USD	api	2025-11-08 15:17:06.306464+08
988e9ca5-318a-42f2-8a1a-1f714dfd3411	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-27	351.94000244	355.39001465	349.16000366	349.60000610	65519000	\N	USD	api	2025-11-08 15:17:06.306925+08
c552ddc2-e252-45f5-ba8b-686beb497118	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-28	350.91000366	353.54998779	340.26000977	345.98001099	67903200	\N	USD	api	2025-11-08 15:17:06.307299+08
7c699657-d169-4644-b95a-9d313204f41a	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-08-29	347.23001099	348.75000000	331.70001221	333.86999512	81145700	\N	USD	api	2025-11-08 15:17:06.307729+08
b6f0e472-239d-4816-8ba0-9a70e4cf0e77	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-02	328.23001099	333.32998657	325.60000610	329.35998535	58392000	\N	USD	api	2025-11-08 15:17:06.30934+08
30e71946-cad5-44c1-845d-8695146479ab	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-03	335.20001221	343.32998657	328.51000977	334.08999634	88733300	\N	USD	api	2025-11-08 15:17:06.310828+08
9e6a6d58-34b5-4a9a-adf0-0eb96ec19e8e	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-04	336.14999390	338.89001465	331.48001099	338.52999878	60711000	\N	USD	api	2025-11-08 15:17:06.311382+08
8d014d4b-3927-4924-beb3-71eb093e08d6	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-05	348.00000000	355.86999512	344.67999268	350.83999634	108989800	\N	USD	api	2025-11-08 15:17:06.311915+08
ae64364c-fe84-4f3c-9412-8bef67d16f80	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-08	354.64001465	358.44000244	344.83999634	346.39999390	75208300	\N	USD	api	2025-11-08 15:17:06.312646+08
b7920dbb-ea7e-4357-b49b-0636d6b70938	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-09	348.44000244	350.76998901	343.82000732	346.97000122	53816000	\N	USD	api	2025-11-08 15:17:06.313386+08
4729e348-5851-40db-8f9e-592da4608ea1	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-10	350.54998779	356.32998657	346.07000732	347.79000854	72121700	\N	USD	api	2025-11-08 15:17:06.314205+08
81d316eb-07e9-4931-b373-59ebe478b180	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-11	350.17001343	368.98999023	347.60000610	368.80999756	103756000	\N	USD	api	2025-11-08 15:17:06.314875+08
1cdc4f73-e540-48d4-bee0-97ff94c864c0	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-12	370.94000244	396.69000244	370.23999023	395.94000244	168156400	\N	USD	api	2025-11-08 15:17:06.315321+08
e18c52ef-d404-424a-bb57-bf4df114904c	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-15	423.13000488	425.70001221	402.42999268	410.04000854	163823700	\N	USD	api	2025-11-08 15:17:06.315701+08
f1a1f604-002c-4a20-8e63-3742f47cdbf1	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-16	414.50000000	423.25000000	411.42999268	421.61999512	104285700	\N	USD	api	2025-11-08 15:17:06.316017+08
88662f85-fc86-419c-8112-81f91ab4e04a	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-17	415.75000000	428.30999756	409.67001343	425.85998535	106133500	\N	USD	api	2025-11-08 15:17:06.316372+08
0ab8989a-7842-4ef1-a629-52712088736f	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-18	428.86999512	432.22000122	416.55999756	416.85000610	90454500	\N	USD	api	2025-11-08 15:17:06.316812+08
a31ca49b-478b-4af9-adc6-2be13e2dc103	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-19	421.82000732	429.47000122	421.72000122	426.07000732	93131000	\N	USD	api	2025-11-08 15:17:06.317261+08
401406b8-b780-4355-9879-c6c3aa29d15a	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-22	431.10998535	444.98001099	429.13000488	434.20999146	97108800	\N	USD	api	2025-11-08 15:17:06.317757+08
d284b755-89c8-4c8d-9427-b1584f8803ad	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-23	439.88000488	440.97000122	423.72000122	425.85000610	83422700	\N	USD	api	2025-11-08 15:17:06.318183+08
cc1607b6-ecdc-4fc1-af59-5f280dc7a6ac	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-24	429.82998657	444.20999146	429.02999878	442.79000854	93133600	\N	USD	api	2025-11-08 15:17:06.318603+08
b41eb06b-e895-4efa-9368-2f1e488ef415	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-25	435.23999023	435.35000610	419.07998657	423.39001465	96746400	\N	USD	api	2025-11-08 15:17:06.319021+08
e5465de1-87b4-461e-b381-e97403e80eb1	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-26	428.29998779	440.47000122	421.01998901	440.39999390	101628200	\N	USD	api	2025-11-08 15:17:06.319675+08
179b1e46-3472-453d-b579-c07bea1cb98b	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-29	444.35000610	450.98001099	439.50000000	443.20999146	79491500	\N	USD	api	2025-11-08 15:17:06.320119+08
24baa95f-954c-4d44-ad75-adce929c2bf1	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-09-30	441.51998901	445.00000000	433.11999512	444.72000122	74358000	\N	USD	api	2025-11-08 15:17:06.320398+08
4ad06612-7753-4424-ac90-f8addefc0032	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-01	443.79998779	462.29000854	440.75000000	459.45999146	98122300	\N	USD	api	2025-11-08 15:17:06.320677+08
e9e154ba-9107-4999-b390-4c8e3f654300	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-02	470.54000854	470.75000000	435.57000732	436.00000000	137009000	\N	USD	api	2025-11-08 15:17:06.321+08
d434220f-5158-4969-a664-5142abbbd10f	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-03	443.29000854	446.76998901	416.57998657	429.82998657	133188200	\N	USD	api	2025-11-08 15:17:06.321577+08
39bdd1f5-d6bb-4fb8-ae70-f8352bd0e420	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-06	440.75000000	453.54998779	436.69000244	453.25000000	85324900	\N	USD	api	2025-11-08 15:17:06.321998+08
31249503-ddba-4350-849e-475d3ca9af94	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-07	447.82000732	452.67999268	432.45001221	433.08999634	102296100	\N	USD	api	2025-11-08 15:17:06.322413+08
83acdfcd-d447-4819-986d-86d663e5defa	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-08	437.57000732	441.32998657	425.23001099	438.69000244	71192100	\N	USD	api	2025-11-08 15:17:06.322847+08
aef2f5ca-f2b9-407d-9681-c99a301d08bf	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-09	431.80999756	436.35000610	426.17999268	435.54000854	69339900	\N	USD	api	2025-11-08 15:17:06.323259+08
e4229efc-bf5a-4447-bbee-07f3aad2fa7a	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-10	436.54000854	443.13000488	411.45001221	413.48999023	112107900	\N	USD	api	2025-11-08 15:17:06.32367+08
12e77eef-1c48-4766-b726-75a7f862dc06	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-13	423.52999878	436.89001465	419.70001221	435.89999390	79552800	\N	USD	api	2025-11-08 15:17:06.323992+08
0b74c462-d32f-4c24-bac9-9d714e1af20f	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-14	426.79000854	434.20001221	417.85998535	429.23999023	72669400	\N	USD	api	2025-11-08 15:17:06.324345+08
91355fca-61c5-42fa-b707-0ab3e2c6868f	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-15	434.89999390	440.51000977	426.32998657	435.14999390	71558200	\N	USD	api	2025-11-08 15:17:06.324751+08
e90194a4-87f0-445c-8fef-68a9bbb10b47	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-16	434.73001099	439.35000610	421.30999756	428.75000000	77189900	\N	USD	api	2025-11-08 15:17:06.325145+08
991bfcc7-6ebc-43a6-9ac7-86bddc642ca7	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-17	425.50000000	441.45999146	423.60000610	439.30999756	89331600	\N	USD	api	2025-11-08 15:17:06.325613+08
79446220-4f20-49eb-8b84-7df35e1b6fb8	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-20	443.86999512	449.79998779	440.60998535	447.42999268	63719000	\N	USD	api	2025-11-08 15:17:06.326094+08
076c82eb-5e70-4226-a42e-6dea90865394	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-21	445.76000977	449.29998779	442.04998779	442.60000610	54412200	\N	USD	api	2025-11-08 15:17:06.326559+08
bf28e270-ed64-4e7e-aff1-b4f7b2782961	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-22	443.45001221	445.54000854	429.00000000	438.97000122	84023500	\N	USD	api	2025-11-08 15:17:06.327026+08
aa41f39a-c350-4a14-9a0a-730fe9bd608e	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-23	420.00000000	449.39999390	413.89999390	448.98001099	126709800	\N	USD	api	2025-11-08 15:17:06.32758+08
fe43f528-3096-40cd-b31b-d4df7333099b	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-24	446.82998657	451.67999268	430.17001343	433.72000122	94727800	\N	USD	api	2025-11-08 15:17:06.328051+08
5d355e5c-d64e-4809-83d6-09f3c95007d9	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-27	439.98001099	460.16000366	438.69000244	452.42001343	105867500	\N	USD	api	2025-11-08 15:17:06.32892+08
5699a9dc-edd4-49eb-947e-50857e0312f1	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-28	454.77999878	467.00000000	451.60000610	460.54998779	80185700	\N	USD	api	2025-11-08 15:17:06.329727+08
44cb2e3d-fc8c-4590-bc30-a2b58eeb4f09	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-29	462.50000000	465.70001221	452.64999390	461.51000977	67983500	\N	USD	api	2025-11-08 15:17:06.330136+08
58dd5982-460f-42d3-a19b-dca9ea04a838	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-30	451.04998779	455.05999756	439.60998535	440.10000610	72447900	\N	USD	api	2025-11-08 15:17:06.33061+08
b6964f74-be01-44c4-a993-b0b0293a5b72	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-10-31	446.75000000	458.00000000	443.69000244	456.55999756	83135800	\N	USD	api	2025-11-08 15:17:06.331053+08
a637151b-b1b0-47da-9257-38140b2684ac	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-11-03	455.98999023	474.07000732	453.79998779	468.36999512	84595200	\N	USD	api	2025-11-08 15:17:06.331427+08
7692d09f-9f17-49ae-b45a-abf094587b5b	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-11-04	454.45999146	460.22000122	443.60000610	444.26000977	87756600	\N	USD	api	2025-11-08 15:17:06.331747+08
50c5e657-dbfe-4fbb-9321-1ca7bf99d1c3	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-11-05	452.04998779	466.32998657	440.70999146	462.07000732	85573000	\N	USD	api	2025-11-08 15:17:06.3321+08
62df9f6b-5b7f-44b8-bc58-ea8e7fa3b23c	0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	2025-11-06	461.95999146	467.45001221	435.08999634	445.91000366	109622900	\N	USD	api	2025-11-08 15:17:06.332559+08
\.


--
-- Data for Name: asset_types; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.asset_types (id, code, name, category, description, is_active, created_at, location_dimension) FROM stdin;
26baf585-bfba-4af4-bc41-d9efdc05d82a	STOCK_OPTION	股票期权	STOCK_OPTION	股票期权合约，包括认购期权和认沽期权	t	2025-11-07 23:16:55.333125+08	market
761e5638-cff8-4247-bfd7-00edcd57a51a	STOCK	股票	equity	普通股票	t	2025-11-07 21:05:53.355326+08	market
759fd931-caad-408b-9b46-938bc94b62ce	ETF	交易所交易基金	fund	在交易所交易的指数基金	t	2025-11-07 21:05:53.355326+08	market
716c257e-388f-4cde-a5b6-373effe40d78	OPTION	期权	derivative	股票期权合约	t	2025-11-07 21:05:53.355326+08	market
810cc3b6-01c0-4cea-af47-b34563226fc9	FUTURE	期货	derivative	期货合约	t	2025-11-07 21:05:53.355326+08	market
53195789-6c3e-41b3-b30a-4d328126728c	MUTUAL_FUND	共同基金	fund	开放式基金	t	2025-11-07 21:05:53.355326+08	country
1317e563-bc85-418d-bd6b-bc49d6719ce5	BOND	债券	fixed_income	政府或企业债券	t	2025-11-07 21:05:53.355326+08	country
c7705c2b-9c24-449e-9015-a1ec8b826f6e	CASH	现金	cash	现金及现金等价物	t	2025-11-07 21:05:53.355326+08	country
916f709e-d2fe-4bbb-a0b5-f0e680c30c53	REIT	房地产投资信托	real_estate	房地产投资信托基金	t	2025-11-07 21:05:53.355326+08	country
a38b6c3d-61de-482d-8859-16e72f3107fd	FUND	基金	fund	\N	t	2025-11-07 21:06:31.056188+08	country
60c02f02-b096-4f08-971e-653d3b5a7ddf	BANK_WEALTH	银行理财产品	fixed_income	银行发行的理财产品，包括保本和非保本理财产品	t	2025-11-08 10:18:32.181688+08	country
9ed792c8-2fbb-4453-8380-5e957a651df3	CRYPTO	加密货币	crypto	数字货币	t	2025-11-07 21:05:53.355326+08	global
ce4ebe16-471f-4d06-b37a-6b5bdf91b018	COMMODITY	商品	commodity	贵金属、原油等商品	t	2025-11-07 21:05:53.355326+08	global
43bedcc5-84b3-461d-a29f-4f2944115e3c	ECONOMIC_INDICATOR	经济指标	economic	\N	t	2025-11-08 15:39:17.304747+08	country
3089da56-b58d-47a3-adb2-f13e4819e50a	FUTURES	期货	derivative	\N	t	2025-11-08 15:39:17.304747+08	market
4016a03f-0738-4c9a-8c77-faa1e4b87966	FOREX	外汇	forex	\N	t	2025-11-08 15:39:17.304747+08	global
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.assets (id, symbol, name, asset_type_id, currency, isin, cusip, sector, industry, description, metadata, is_active, created_at, updated_at, risk_level, lot_size, tick_size, listing_date, delisting_date, tags, created_by, updated_by, liquidity_tag, country_id) FROM stdin;
a7569e62-8eec-4468-8798-d1e948ef4679	600036	招商银行	761e5638-cff8-4247-bfd7-00edcd57a51a	CNY	\N	\N	金融	银行	招商银行股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
49589118-facc-4785-abf3-3d2d4d054f17	600519	贵州茅台	761e5638-cff8-4247-bfd7-00edcd57a51a	CNY	\N	\N	消费	白酒	贵州茅台酒股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
9dd1720a-bd8f-4810-9648-b47b516d82cb	AAPL	Apple Inc.	761e5638-cff8-4247-bfd7-00edcd57a51a	USD	\N	\N	科技	消费电子	苹果公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
43fc85a9-db6d-4390-a6ef-7b4b5979fdda	MSFT	Microsoft Corporation	761e5638-cff8-4247-bfd7-00edcd57a51a	USD	\N	\N	科技	软件	微软公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
e18a110d-3daa-4d2f-9880-c3985dce8bbf	GOOGL	Alphabet Inc.	761e5638-cff8-4247-bfd7-00edcd57a51a	USD	\N	\N	科技	互联网	谷歌母公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
0aab0dfa-ce4c-4bb0-a315-5c0c2cd82c21	TSLA	Tesla, Inc.	761e5638-cff8-4247-bfd7-00edcd57a51a	USD	\N	\N	汽车	电动汽车	特斯拉公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
87827534-5cc9-4f7e-a066-348b52e4965f	0941	中国移动	761e5638-cff8-4247-bfd7-00edcd57a51a	HKD	\N	\N	通信	电信运营	中国移动有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
e9919f45-1585-4645-8a62-036c08865605	510300	沪深300ETF	759fd931-caad-408b-9b46-938bc94b62ce	CNY	\N	\N	ETF	指数基金	华泰柏瑞沪深300ETF	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
b267651d-83dc-495e-8623-0f4c7c27662c	SPY	SPDR S&P 500 ETF	759fd931-caad-408b-9b46-938bc94b62ce	USD	\N	\N	ETF	指数基金	标普500指数ETF	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	\N	\N
2aa3f894-681b-4a75-9003-ab376a35df7e	000001	平安银行	761e5638-cff8-4247-bfd7-00edcd57a51a	CNY	\N	\N	金融	银行	中国平安银行股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	cc893a70-ae7f-47ed-a81e-97486a3b4524	d7d5c3ba-92c1-4619-891c-de4d455179ed
a6efbeb9-3af7-4565-a0b0-8a222138ca7d	000002	万科A	761e5638-cff8-4247-bfd7-00edcd57a51a	CNY	\N	\N	房地产	房地产开发	万科企业股份有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	cc893a70-ae7f-47ed-a81e-97486a3b4524	d7d5c3ba-92c1-4619-891c-de4d455179ed
a4d3853b-0417-42c2-8d5d-dd32d3659e4a	0700	腾讯控股	761e5638-cff8-4247-bfd7-00edcd57a51a	HKD	\N	\N	科技	互联网	腾讯控股有限公司	\N	t	2025-11-07 21:06:05.812344+08	2025-11-07 21:06:05.812344+08	MEDIUM	1	0.010000	\N	\N	\N	\N	\N	cc893a70-ae7f-47ed-a81e-97486a3b4524	a1f8cb91-32af-4479-89e7-0b99e7ee4057
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
-- Data for Name: countries; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.countries (id, code, name, currency, timezone, is_active, created_at, updated_at) FROM stdin;
4d8071cd-62a7-4e1d-a9cf-cd8b0f80c8e3	DEU	DEU	EUR	Europe/Berlin	t	2025-11-08 10:22:35.250429+08	2025-11-08 10:22:35.250429+08
eb7ff485-36ed-472d-b641-9d87eb7d23d4	GBR	GBR	GBP	Europe/London	t	2025-11-08 10:22:35.250429+08	2025-11-08 10:22:35.250429+08
f35b1caa-a224-4d18-8173-83ff52ed99e4	USA	美国	USD	America/New_York	t	2025-11-08 10:22:35.250429+08	2025-11-08 10:22:35.250429+08
283d96f6-dd40-4aea-9502-8c33fb593ae2	HKG	香港	HKD	Asia/Hong_Kong	t	2025-11-08 10:22:35.250429+08	2025-11-08 10:22:35.250429+08
2a4d93c3-f0c5-4459-ae56-5f7cabf4e843	JPN	JPN	JPY	Asia/Tokyo	t	2025-11-08 10:22:35.250429+08	2025-11-08 10:22:35.250429+08
d7d5c3ba-92c1-4619-891c-de4d455179ed	CHN	中国	CNY	Asia/Shanghai	t	2025-11-08 10:22:35.250429+08	2025-11-08 10:22:35.250429+08
c447b588-db26-4ef5-bac5-0e623820ecae	US	美国	USD	America/New_York	t	2025-11-08 15:28:32.452397+08	2025-11-08 15:28:32.452397+08
a1f8cb91-32af-4479-89e7-0b99e7ee4057	HK	香港	HKD	Asia/Hong_Kong	t	2025-11-08 15:28:32.452397+08	2025-11-08 15:28:32.452397+08
0f00441d-063c-41a1-8a0a-e2239412c3c0	CN	中国	CNY	Asia/Shanghai	t	2025-11-08 15:28:32.452397+08	2025-11-08 15:28:32.452397+08
7b1dccae-1542-42fe-b069-e62554e6195a	GB	英国	GBP	Europe/London	t	2025-11-08 15:28:32.452397+08	2025-11-08 15:28:32.452397+08
61ac326e-26e7-454c-a08d-858afc897667	JP	日本	JPY	Asia/Tokyo	t	2025-11-08 15:28:32.452397+08	2025-11-08 15:28:32.452397+08
3d131879-1ea4-46e2-8773-8a2a50bfc460	DE	德国	EUR	Europe/Berlin	t	2025-11-08 15:28:32.452397+08	2025-11-08 15:28:32.452397+08
f0c7ec9b-2a14-41f6-96bf-f45d4d1897e3	FR	法国	EUR	Europe/Paris	t	2025-11-08 15:28:32.452397+08	2025-11-08 15:28:32.452397+08
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
8838631b-580f-4737-879b-abcf7cf14d61	USD	CNY	2025-11-08	7.12000000	api	2025-11-08 20:00:01.092732+08
9b25eec6-d6bd-40fc-9ed4-db013508ef4d	USD	HKD	2025-11-08	7.78000000	api	2025-11-08 20:00:01.099307+08
f5abc080-7d14-4b8e-a26c-a40023d071c5	USD	SGD	2025-11-08	1.30000000	api	2025-11-08 20:00:01.10026+08
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
5a0a447b-27ba-491b-a995-09f80f5162c9	天天基金	ttjj	http://api.1234567.com.cn/fund	\N	{"features": {"fund_nav": true, "fund_holding": true, "fund_ranking": true, "manager_info": true, "fund_performance": true}, "free_plan": false, "data_types": ["fund_nav", "fund_ranking", "fund_holding"], "description": "中国最大的基金数据平台，包含基金净值、排名、持仓", "requires_api_key": true, "supports_markets": ["SSE", "SZSE"], "supports_products": ["FUND", "ETF"], "rate_limit_per_minute": 60}	60	30	f	\N	\N	\N	2025-11-07 22:02:26.557691	2025-11-07 22:02:26.557691	\N	\N
a0bac1dd-9e3d-4988-85f9-f25379e47085	Binance API	binance	https://api.binance.com/api	\N	{"features": {"kline_data": true, "trade_data": true, "order_placement": true, "real_time_prices": true, "account_management": true}, "free_plan": true, "data_types": ["real_time", "historical", "klines", "trades"], "description": "币安加密货币交易所数据，包含实时行情、交易数据", "requires_api_key": false, "supports_markets": ["CRYPTO"], "supports_products": ["CRYPTO"], "rate_limit_per_minute": 1200}	1200	15	f	\N	\N	\N	2025-11-07 22:02:26.557691	2025-11-07 22:02:26.557691	\N	\N
bf901d15-81a7-497d-88b3-d24b8ab60fe9	FRED (Federal Reserve)	fred	https://api.stlouisfed.org/fred	\N	{"features": {"historical": true, "batch_query": true}, "data_types": ["economic_indicators"], "requires_api_key": true, "supports_products": ["ECONOMIC_INDICATOR"], "supports_countries": ["US"], "rate_limit_per_minute": 120}	120	30	t	\N	\N	\N	2025-11-07 22:02:26.557691	2025-11-07 22:02:26.557691	\N	\N
d8654879-c098-491a-bd6c-db7aeb2efbbf	新浪财经	sina	http://hq.sinajs.cn	\N	{"features": {"bid_ask": true, "realtime": true, "batch_query": true}, "data_types": ["realtime", "historical"], "requires_api_key": false, "supports_products": ["STOCK", "FUND", "FUTURES", "FOREX"], "supports_countries": ["CN"], "rate_limit_per_minute": 150}	200	15	t	2025-11-08 15:17:06.335562	success	\N	2025-11-07 22:02:26.557691	2025-11-07 22:02:26.557691	\N	\N
f6fede55-c798-44fa-b5d8-66ec7afd4809	东方财富	eastmoney	http://push2.eastmoney.com/api/qt/stock/kline/get	\N	{"supports_batch": false, "timeout_seconds": 15, "supports_products": ["STOCK", "FUND"], "supports_countries": ["CN"], "rate_limit_per_minute": 100}	60	30	t	\N	\N	\N	2025-11-08 07:13:40.553711	2025-11-08 07:13:40.553711	\N	\N
7755cebe-ded0-4d2e-8ee6-286c48ccf623	Yahoo Finance	yahoo_finance	https://query1.finance.yahoo.com/v8/finance/chart/	\N	{"supports_batch": false, "timeout_seconds": 30, "supports_products": ["STOCK", "ETF", "FUND"], "supports_countries": ["US", "HK", "CN"], "rate_limit_per_minute": 60}	60	30	t	2025-11-08 20:23:36.600769	success	\N	2025-11-08 07:11:32.459892	2025-11-08 07:11:32.459892	\N	\N
\.


--
-- Data for Name: price_sync_errors; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.price_sync_errors (id, log_id, asset_id, asset_symbol, error_type, error_message, error_details, occurred_at) FROM stdin;
2c3965b6-e465-4045-a4eb-1eaf518b6ca7	d46d52f7-24e6-4464-9e72-8cb7186072cd	2aa3f894-681b-4a75-9003-ab376a35df7e	000001	other	Unsupported provider: sina	\N	2025-11-07 23:23:03.808785
39928394-6b39-4090-8b98-b3214bd5d7f9	d46d52f7-24e6-4464-9e72-8cb7186072cd	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	000002	other	Unsupported provider: sina	\N	2025-11-07 23:23:03.813878
c1a74020-91fb-4705-b529-987685d91449	d46d52f7-24e6-4464-9e72-8cb7186072cd	a7569e62-8eec-4468-8798-d1e948ef4679	600036	other	Unsupported provider: sina	\N	2025-11-07 23:23:03.815086
714f6f7f-b66a-4dba-9c03-bc8d035e556d	d46d52f7-24e6-4464-9e72-8cb7186072cd	49589118-facc-4785-abf3-3d2d4d054f17	600519	other	Unsupported provider: sina	\N	2025-11-07 23:23:03.816008
d8c8acae-fa8b-4b5b-8ab4-44ece20f525f	ff20ea3c-b3bb-4bdc-8430-ff7952e2d1d0	2aa3f894-681b-4a75-9003-ab376a35df7e	000001	other	Tushare API key not configured	\N	2025-11-07 23:28:27.103661
e97066ef-08b7-4fd5-b66b-5bf60954c067	ff20ea3c-b3bb-4bdc-8430-ff7952e2d1d0	a6efbeb9-3af7-4565-a0b0-8a222138ca7d	000002	other	Tushare API key not configured	\N	2025-11-07 23:28:27.108294
ad827849-35a8-4ec4-9491-89b83d1150d2	ff20ea3c-b3bb-4bdc-8430-ff7952e2d1d0	a7569e62-8eec-4468-8798-d1e948ef4679	600036	other	Tushare API key not configured	\N	2025-11-07 23:28:27.109941
3a454628-e1ce-45b7-8df8-9cc14092ff15	ff20ea3c-b3bb-4bdc-8430-ff7952e2d1d0	49589118-facc-4785-abf3-3d2d4d054f17	600519	other	Tushare API key not configured	\N	2025-11-07 23:28:27.111094
\.


--
-- Data for Name: price_sync_logs; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.price_sync_logs (id, task_id, data_source_id, started_at, completed_at, status, total_assets, total_records, success_count, failed_count, skipped_count, result_summary, error_message) FROM stdin;
d46d52f7-24e6-4464-9e72-8cb7186072cd	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	d8654879-c098-491a-bd6c-db7aeb2efbbf	2025-11-07 23:23:03.799605	2025-11-07 23:23:03.817978	failed	4	0	0	4	0	{"errors": [{"error": "Unsupported provider: sina", "symbol": "000001", "asset_id": "2aa3f894-681b-4a75-9003-ab376a35df7e"}, {"error": "Unsupported provider: sina", "symbol": "000002", "asset_id": "a6efbeb9-3af7-4565-a0b0-8a222138ca7d"}, {"error": "Unsupported provider: sina", "symbol": "600036", "asset_id": "a7569e62-8eec-4468-8798-d1e948ef4679"}, {"error": "Unsupported provider: sina", "symbol": "600519", "asset_id": "49589118-facc-4785-abf3-3d2d4d054f17"}], "success": false, "failed_count": 4, "total_assets": 4, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	\N
221c33f4-5fe3-415c-9978-35945e02387e	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	d8654879-c098-491a-bd6c-db7aeb2efbbf	2025-11-07 23:25:24.389492	2025-11-07 23:25:24.399941	success	4	0	0	0	0	{"errors": [], "success": true, "failed_count": 0, "total_assets": 4, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	\N
14aac112-0432-4d97-a122-6a873091cec8	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	d8654879-c098-491a-bd6c-db7aeb2efbbf	2025-11-07 23:26:34.492899	2025-11-07 23:26:34.496545	success	4	0	0	0	0	{"errors": [], "success": true, "failed_count": 0, "total_assets": 4, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	\N
952c68a8-c3be-4d31-9a86-e01b070b536c	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	d8654879-c098-491a-bd6c-db7aeb2efbbf	2025-11-07 23:30:09.246066	2025-11-07 23:30:11.56784	success	4	261	261	0	0	{"errors": [], "success": true, "failed_count": 0, "total_assets": 4, "skipped_count": 0, "success_count": 261, "total_records": 261, "duration_seconds": 2}	\N
ff20ea3c-b3bb-4bdc-8430-ff7952e2d1d0	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	\N	2025-11-07 23:28:27.087069	2025-11-07 23:28:27.113019	failed	4	0	0	4	0	{"errors": [{"error": "Tushare API key not configured", "symbol": "000001", "asset_id": "2aa3f894-681b-4a75-9003-ab376a35df7e"}, {"error": "Tushare API key not configured", "symbol": "000002", "asset_id": "a6efbeb9-3af7-4565-a0b0-8a222138ca7d"}, {"error": "Tushare API key not configured", "symbol": "600036", "asset_id": "a7569e62-8eec-4468-8798-d1e948ef4679"}, {"error": "Tushare API key not configured", "symbol": "600519", "asset_id": "49589118-facc-4785-abf3-3d2d4d054f17"}], "success": false, "failed_count": 4, "total_assets": 4, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	\N
b5d226ea-5546-4003-96b9-8217de2fd0d0	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	d8654879-c098-491a-bd6c-db7aeb2efbbf	2025-11-08 15:17:03.00095	2025-11-08 15:17:06.3348	success	10	284	284	0	0	{"errors": [], "success": true, "failed_count": 0, "total_assets": 10, "skipped_count": 0, "success_count": 284, "total_records": 284, "duration_seconds": 3}	\N
a7033f67-740f-4eb4-a71b-6c4fbe405420	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	7755cebe-ded0-4d2e-8ee6-286c48ccf623	2025-11-08 20:00:08.30219	2025-11-08 20:00:08.307126	success	0	0	0	0	0	{"errors": [], "success": true, "failed_count": 0, "total_assets": 0, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	\N
138414fc-b7ea-4a66-be8c-f1e3d3b782e2	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	7755cebe-ded0-4d2e-8ee6-286c48ccf623	2025-11-08 20:00:32.049396	2025-11-08 20:00:32.055626	success	0	0	0	0	0	{"errors": [], "success": true, "failed_count": 0, "total_assets": 0, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	\N
54974cb0-d021-46ef-a421-1f2b73e95b0d	3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	7755cebe-ded0-4d2e-8ee6-286c48ccf623	2025-11-08 20:23:36.58379	2025-11-08 20:23:36.597436	success	0	0	0	0	0	{"errors": [], "success": true, "failed_count": 0, "total_assets": 0, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	\N
\.


--
-- Data for Name: price_sync_tasks; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.price_sync_tasks (id, name, description, data_source_id, asset_type_id, asset_ids, schedule_type, cron_expression, interval_minutes, sync_days_back, overwrite_existing, is_active, last_run_at, next_run_at, last_run_status, last_run_result, created_at, updated_at, created_by, updated_by, country_id) FROM stdin;
3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f	股票价格同步	\N	7755cebe-ded0-4d2e-8ee6-286c48ccf623	761e5638-cff8-4247-bfd7-00edcd57a51a	\N	manual	\N	\N	100	t	t	2025-11-08 20:23:36.586225	\N	success	{"errors": [], "success": true, "failed_count": 0, "total_assets": 0, "skipped_count": 0, "success_count": 0, "total_records": 0, "duration_seconds": 0}	2025-11-07 23:21:30.717759	2025-11-07 23:21:30.717759	\N	\N	0f00441d-063c-41a1-8a0a-e2239412c3c0
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
474fec7c-e585-44d3-9c36-ac4371e48c12	e04747dd-bbe9-4d24-adcf-1c088e3c3491	$2b$10$sAcmhlZpJOAwYSy6be3jWOCR0Dap5auDgv7qtJwVb0akuzF6Nony2	\N	\N	\N	\N	t	2025-11-08 21:51:00+08	2025-11-07 21:51:00.705+08	2025-11-07 21:51:00.705+08
e72ab5c2-76aa-4170-97d6-08eb28d71d75	e04747dd-bbe9-4d24-adcf-1c088e3c3491	$2b$10$wgqVdQ/aWD3.Ee114P034OMtwFUrGmZSFKmtpY/JXiVKJIX.1Pv0.	\N	\N	\N	\N	t	2025-11-08 21:51:59+08	2025-11-07 21:51:59.875+08	2025-11-07 21:51:59.875+08
9a660c5f-5062-4dde-9237-f9b20e3b2525	e04747dd-bbe9-4d24-adcf-1c088e3c3491	$2b$10$lPZEw03BbOLWWr1yMA2U8.gEuLVxOfY9ZMtqx1vISHNvZHLzKPrOK	\N	\N	\N	\N	t	2025-11-08 21:52:04+08	2025-11-07 21:52:04.922+08	2025-11-07 21:52:04.922+08
f5f13a29-88b8-4b70-a313-9ba60447b4ea	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$trcqziIYTIcoO7JVqtwcuu3FGL0WPoXTYyezR.nZui24g8yQzdypW	\N	\N	\N	\N	t	2025-11-09 10:44:17+08	2025-11-08 10:44:17.188+08	2025-11-08 10:44:17.188+08
c606ada3-8d3d-49c5-8492-d793307ae54d	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$d8Rivm25Vg9Dh9TykAPH3uTy7JMNG1mtNBxTa8JygtX.lwztbITjK	\N	\N	\N	\N	t	2025-11-09 10:44:22+08	2025-11-08 10:44:22.418+08	2025-11-08 10:44:22.418+08
6b813dc2-a6b1-4213-8835-640cd23ff5ce	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$PtAgktzeC5diScSEcVoqKuXso5g0BKI0DCs0e.mG9J8SAWuvkNyga	\N	\N	\N	\N	t	2025-11-09 11:46:51+08	2025-11-08 11:46:51.327+08	2025-11-08 11:46:51.327+08
9cb3c41d-6e48-4fe2-872a-136ff2de8795	a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	$2b$10$VGLxV.yO2/GN8rUgus6sHOgaR4CAgm.sh7qWVzwU6ss2Pmrw7Wz2W	\N	\N	\N	\N	t	2025-11-09 16:05:06+08	2025-11-08 16:05:06.381+08	2025-11-08 16:05:06.381+08
0db59352-e2c6-45bc-9726-e5fc87b0c702	e04747dd-bbe9-4d24-adcf-1c088e3c3491	$2b$10$4WhkNeZNgszytcn/aHADYu.Vo/XZIHOnkqVwU1g.5XC1Ai75Vb2.q	\N	\N	\N	\N	t	2025-11-09 18:54:22+08	2025-11-08 18:54:22.366+08	2025-11-08 18:54:22.366+08
70048169-e1d7-445c-83b2-a16a14985cf2	e04747dd-bbe9-4d24-adcf-1c088e3c3491	$2b$10$WkafIl2RbvMB3nCLtixeKem96iT6jNRjtCXnnDvCLf8i62pUoz592	\N	\N	\N	\N	t	2025-11-09 18:54:27+08	2025-11-08 18:54:27.804+08	2025-11-08 18:54:27.804+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: finapp; Owner: finapp_user
--

COPY finapp.users (id, email, username, password_hash, first_name, last_name, phone, avatar_url, timezone, language, currency_preference, is_active, is_verified, email_verified_at, last_login_at, login_count, failed_login_attempts, locked_until, created_at, updated_at) FROM stdin;
a7f71f4e-b5a2-40fd-a4fb-e573b4e911ea	testapi@finapp.com	\N	$2b$12$CngaJ48leb94pf7hX/ku1euMpsLvtgcLF3q6WvYOhzTMUq5MeYs.u	Jason		+86 10 1234 5678	\N	Asia/Shanghai	zh-CN	CNY	t	t	\N	2025-11-08 16:05:06.392+08	0	0	\N	2025-11-07 21:17:24.904+08	2025-11-08 16:05:06.393+08
e04747dd-bbe9-4d24-adcf-1c088e3c3491	admin@finapp.com	\N	$2b$12$KPg1vbozHHnAzbBRBkYdOOx3Q9kYBmg44XS4JZFDK1U9st..iQpcy	Admin	User	+86 10 8765 4321	\N	UTC	zh-CN	CNY	t	t	\N	2025-11-08 18:54:27.805+08	0	0	\N	2025-11-07 21:17:25.336+08	2025-11-08 18:54:27.806+08
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
-- Name: assets assets_country_id_symbol_unique; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.assets
    ADD CONSTRAINT assets_country_id_symbol_unique UNIQUE (country_id, symbol);


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
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


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
-- Name: idx_asset_types_location_dimension; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_asset_types_location_dimension ON finapp.asset_types USING btree (location_dimension);


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
-- Name: idx_assets_country_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_country_id ON finapp.assets USING btree (country_id);


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
-- Name: idx_assets_sector; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_sector ON finapp.assets USING btree (sector);


--
-- Name: idx_assets_symbol; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_assets_symbol ON finapp.assets USING btree (symbol);


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
-- Name: idx_price_sync_tasks_country_id; Type: INDEX; Schema: finapp; Owner: finapp_user
--

CREATE INDEX idx_price_sync_tasks_country_id ON finapp.price_sync_tasks USING btree (country_id);


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
-- Name: assets assets_country_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.assets
    ADD CONSTRAINT assets_country_id_fkey FOREIGN KEY (country_id) REFERENCES finapp.countries(id) ON DELETE SET NULL;


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
-- Name: price_sync_tasks price_sync_tasks_country_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_tasks
    ADD CONSTRAINT price_sync_tasks_country_id_fkey FOREIGN KEY (country_id) REFERENCES finapp.countries(id);


--
-- Name: price_sync_tasks price_sync_tasks_data_source_id_fkey; Type: FK CONSTRAINT; Schema: finapp; Owner: finapp_user
--

ALTER TABLE ONLY finapp.price_sync_tasks
    ADD CONSTRAINT price_sync_tasks_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES finapp.price_data_sources(id) ON DELETE CASCADE;


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: caojun
--

GRANT USAGE ON SCHEMA public TO finapp_user;


--
-- Name: TABLE asset_prices; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.asset_prices TO finapp_user;


--
-- Name: TABLE asset_types; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.asset_types TO finapp_user;


--
-- Name: TABLE assets; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.assets TO finapp_user;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.audit_logs TO finapp_user;


--
-- Name: TABLE benchmark_prices; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.benchmark_prices TO finapp_user;


--
-- Name: TABLE benchmarks; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.benchmarks TO finapp_user;


--
-- Name: TABLE email_verification_tokens; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.email_verification_tokens TO finapp_user;


--
-- Name: TABLE exchange_rates; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.exchange_rates TO finapp_user;


--
-- Name: TABLE liquidity_tags; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.liquidity_tags TO finapp_user;


--
-- Name: TABLE markets; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.markets TO finapp_user;


--
-- Name: TABLE option_details; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.option_details TO finapp_user;


--
-- Name: TABLE password_reset_tokens; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.password_reset_tokens TO finapp_user;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.permissions TO finapp_user;


--
-- Name: TABLE portfolios; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.portfolios TO finapp_user;


--
-- Name: TABLE positions; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.positions TO finapp_user;


--
-- Name: TABLE report_executions; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.report_executions TO finapp_user;


--
-- Name: TABLE reports; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.reports TO finapp_user;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.role_permissions TO finapp_user;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.roles TO finapp_user;


--
-- Name: TABLE trading_accounts; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.trading_accounts TO finapp_user;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.transactions TO finapp_user;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.user_roles TO finapp_user;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.user_sessions TO finapp_user;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: caojun
--

GRANT SELECT ON TABLE public.users TO finapp_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: finapp; Owner: caojun
--

ALTER DEFAULT PRIVILEGES FOR ROLE caojun IN SCHEMA finapp GRANT SELECT,USAGE ON SEQUENCES  TO finapp_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: finapp; Owner: caojun
--

ALTER DEFAULT PRIVILEGES FOR ROLE caojun IN SCHEMA finapp GRANT SELECT ON TABLES  TO finapp_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: caojun
--

ALTER DEFAULT PRIVILEGES FOR ROLE caojun IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES  TO finapp_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: caojun
--

ALTER DEFAULT PRIVILEGES FOR ROLE caojun IN SCHEMA public GRANT SELECT ON TABLES  TO finapp_user;


--
-- PostgreSQL database dump complete
--

\unrestrict KUBZDHJIuP6O6EYuv2gWagakhWkqmVDsGTggvosSxk7EIQiqIje3COaEYZQzsEa

