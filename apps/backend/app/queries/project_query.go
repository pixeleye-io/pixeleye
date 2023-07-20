package queries

import (
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"golang.org/x/crypto/bcrypt"
)

type ProjectQueries struct {
	*sqlx.DB
}

func generateProjectSecret() (string, error) {
	return utils.GenerateRandomStringURLSafe(32)

}

func hashSecret(secret string) (string, error) {
	hashedSecret, err := bcrypt.GenerateFromPassword([]byte(secret), 14)

	return string(hashedSecret), err
}

func (q *ProjectQueries) GetUsersProjects(userID uuid.UUID) ([]models.Project, error) {
	query := `SELECT project.* FROM project JOIN project_users ON project.id = project_users.project_id WHERE project_users.user_id = $1`

	projects := []models.Project{}

	err := q.Select(&projects, query, userID)

	return projects, err
}

func (q *ProjectQueries) GetProject(id uuid.UUID) (models.Project, error) {
	project := models.Project{}

	query := `SELECT * FROM project WHERE id = $1`

	err := q.Get(&project, query, id)

	return project, err
}

func (q *ProjectQueries) CreateProject(project *models.Project) error {
	query := `INSERT INTO project (id, name, source, source_id, token) VALUES (:id, :name, :source, :source_id, :token)`

	_, err := q.NamedExec(query, project)

	return err
}
