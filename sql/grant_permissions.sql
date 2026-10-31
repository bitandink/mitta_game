GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE
  public.game_passengers,
  public.game_progress,
  public.passenger_credentials
TO service_role;