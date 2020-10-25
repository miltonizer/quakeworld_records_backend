ALTER TABLE public.user DROP CONSTRAINT IF EXISTS user_unique_username;
ALTER TABLE public.user DROP CONSTRAINT IF EXISTS user_unique_email;

ALTER TABLE public.user ADD CONSTRAINT user_unique_username UNIQUE (username);
ALTER TABLE public.user ADD CONSTRAINT user_unique_email UNIQUE (email);