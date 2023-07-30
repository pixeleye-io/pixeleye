CREATE FUNCTION increment_build() RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(max(build_number) + 1, 0) INTO NEW.build_number
  FROM build
  WHERE project_id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Automatically increment build number
CREATE TRIGGER set_build_number
BEFORE INSERT ON build
FOR EACH ROW
EXECUTE PROCEDURE increment_build();