create extension if not exists pgcrypto;


-- =========================================
-- PROFILES
-- =========================================

create table if not exists profiles (

    id uuid primary key,

    display_name text,

    preferences jsonb
        not null
        default '{}'::jsonb,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now()

);


-- =========================================
-- CONVERSATIONS
-- =========================================

create table if not exists conversations (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null,

    title text
        default 'محادثة جديدة',

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now()

);


-- =========================================
-- MESSAGES
-- =========================================

create table if not exists messages (

    id uuid primary key
        default gen_random_uuid(),

    conversation_id uuid
        references conversations(id)
        on delete cascade,

    user_id uuid not null,

    role text not null,

    content text not null,

    created_at timestamptz
        not null
        default now()

);


-- =========================================
-- MEMORIES
-- =========================================

create table if not exists memories (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null,

    memory_type text,

    memory_key text,

    memory_value text,

    confidence numeric
        default 1.0,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now()

);


-- =========================================
-- INDEXES
-- =========================================

create index if not exists
conversations_user_id_idx
on conversations(user_id);


create index if not exists
messages_user_id_idx
on messages(user_id);


create index if not exists
messages_conversation_idx
on messages(conversation_id);


create index if not exists
memories_user_id_idx
on memories(user_id);


-- =========================================
-- RLS
-- =========================================

alter table profiles
enable row level security;

alter table conversations
enable row level security;

alter table messages
enable row level security;

alter table memories
enable row level security;
