package queries

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type ProjectQueries struct {
	*sqlx.DB
}

func (q *ProjectQueries) GetLatestBuild(projectID string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`

	err := q.Get(&build, query, projectID)

	return build, err
}

func (q *ProjectQueries) GetTeamsProjectsAsUser(teamID string, userID string) ([]models.Project, error) {
	query := `SELECT project.*, project_users.role, team_users.role AS team_role
	FROM project
	JOIN project_users ON project.id = project_users.project_id
	JOIN team ON project.team_id = team.id
	JOIN team_users ON team.id = team_users.team_id
	WHERE project.team_id = $1
	AND (
		project_users.user_id = $2
		OR (
			team_users.user_id = $2
			AND (
				team_users.role = 'admin'
				OR team_users.role = 'owner'
			)
		)
	)`

	projects := []models.Project{}

	if err := q.Select(&projects, query, teamID, userID); err != nil {
		return projects, err
	}

	return projects, nil
}

// TODO - not sure we need this query and some others in this file
func (q *ProjectQueries) GetUsersProjects(userID string) ([]models.Project, error) {
	query := `SELECT project.* FROM project JOIN project_users ON project.id = project_users.project_id WHERE project_users.user_id = $1`

	projects := []models.Project{}

	err := q.Select(&projects, query, userID)

	return projects, err
}

// There is no access control on this query, so becareful where you use it
func (q *ProjectQueries) GetProject(id string) (models.Project, error) {
	project := models.Project{}

	query := `SELECT * FROM project WHERE id = $1`

	err := q.Get(&project, query, id)

	return project, err
}

func (q *ProjectQueries) GetProjectAsUser(id string, userID string) (models.Project, error) {
	project := models.Project{}

	query := `SELECT project.*, project_users.role, team_users.role AS team_role
	FROM project
	JOIN project_users ON project.id = project_users.project_id
	JOIN team ON project.team_id = team.id
	JOIN team_users ON team.id = team_users.team_id
	WHERE project.id = $1
	AND (
		project_users.user_id = $2
		OR (
			team_users.user_id = $2
			AND (
				team_users.role = 'admin'
				OR team_users.role = 'owner'
			)
		)
	)`

	err := q.Get(&project, query, id)

	if err == sql.ErrNoRows {
		return project, fmt.Errorf("project not found")
	}

	return project, err
}

// TODO - remove this query once we have the concept of teams
func (q *ProjectQueries) GetProjects() ([]models.Project, error) {
	query := `SELECT project.*, build.updated_at AS latest_activity FROM project LEFT JOIN build ON project.id = build.project_id AND build.build_number = (SELECT MAX(build_number) FROM build WHERE build.project_id = project.id)`

	projects := []models.Project{}

	err := q.Select(&projects, query)

	return projects, err
}

func (q *ProjectQueries) CreateProject(project *models.Project, userID string) error {
	query := `INSERT INTO project (id, team_id, name, source, source_id, token, created_at, updated_at, url, token) VALUES (:id, :team_id, :name, :source, :source_id, :token, :created_at, :updated_at, :url, :token)`
	setUsersQuery := `INSERT INTO project_users (project_id, user_id, role) VALUES (:project_id, :user_id, :role)`

	time := time.Now()
	project.CreatedAt = time
	project.UpdatedAt = time

	userOnProject := models.ProjectMember{
		ProjectID: project.ID,
		UserID:    userID,
		Role:      "admin",
	}

	ctx := context.Background()
	tx, err := q.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	defer tx.Rollback()

	if _, err = tx.NamedExecContext(ctx, query, project); err != nil {
		return err
	}

	if _, err = tx.NamedExecContext(ctx, setUsersQuery, userOnProject); err != nil {
		return err
	}

	return tx.Commit()
}

func (q *ProjectQueries) UpdateProject(project *models.Project) error {
	query := `UPDATE project SET name = :name, source = :source, source_id = :source_id, token = :token WHERE id = :id`

	project.UpdatedAt = time.Now()

	_, err := q.NamedExec(query, project)

	return err
}
