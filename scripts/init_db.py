import psycopg2

def init_postgres():
    conn = psycopg2.connect("postgresql://postgres@127.0.0.1:5432/postgres")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print("PostgreSQL Version:", cur.fetchone()[0])

    try:
        cur.execute("CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';")
        print("Created role: postgres")
    except psycopg2.errors.DuplicateObject:
        print("Role postgres already exists.")

    try:
        cur.execute("CREATE DATABASE pdf_to_audio OWNER postgres;")
        print("Created database: pdf_to_audio")
    except psycopg2.errors.DuplicateDatabase:
        print("Database pdf_to_audio already exists.")

    conn.close()

    # Now verify connection to pdf_to_audio as postgres
    p_conn = psycopg2.connect("postgresql://postgres:postgres@127.0.0.1:5432/pdf_to_audio")
    p_cur = p_conn.cursor()
    p_cur.execute("SELECT current_user, current_database();")
    user, db = p_cur.fetchone()
    print(f"Verified connection as user '{user}' to database '{db}'!")
    p_conn.close()

if __name__ == "__main__":
    init_postgres()
