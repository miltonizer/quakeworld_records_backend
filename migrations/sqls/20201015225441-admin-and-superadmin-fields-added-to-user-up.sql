ALTER TABLE public."user" ADD IF NOT EXISTS "admin" boolean NOT NULL DEFAULT false;
ALTER TABLE public."user" ADD IF NOT EXISTS "superadmin" boolean NOT NULL DEFAULT false;