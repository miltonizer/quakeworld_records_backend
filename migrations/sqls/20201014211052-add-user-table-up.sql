DROP TABLE IF EXISTS public."user";

CREATE TABLE public."user" (
	id serial NOT NULL,
	username varchar NOT NULL,
	email varchar NOT NULL,
	"password" varchar NOT NULL
);