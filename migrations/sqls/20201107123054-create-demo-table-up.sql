DROP TABLE IF EXISTS public."demo";

CREATE TABLE public.demo (
	id serial NOT NULL,
	path varchar NOT NULL,
	create_timestamp timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	create_user int4 NOT NULL,
	md5sum varchar NOT NULL,
	CONSTRAINT demo_pk PRIMARY KEY (id),
	CONSTRAINT demo_fk_user FOREIGN KEY (create_user) REFERENCES "user"(id)
);