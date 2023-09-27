package git_github

import (
	"strconv"
	"testing"

	"math/rand"

	"slices"

	"github.com/google/go-github/v55/github"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/app/queries"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

func generateUser() models.User {

	userID, err := nanoid.New()

	if err != nil {
		panic(err)
	}

	githubID := strconv.Itoa(rand.Intn(100))

	timeNow := utils.CurrentTime()

	return models.User{
		Email:       userID + "@pixeleye.io",
		ID:          userID,
		CreatedAt:   timeNow,
		UpdatedAt:   timeNow,
		AuthID:      userID,
		GithubID:    githubID,
		GitLabID:    "",
		BitbucketID: "",
		Name:        "name: " + userID,
		Avatar:      "",
	}
}

func generateCurrentMembers(count int) []queries.UserOnProject {
	var members []queries.UserOnProject
	for i := 0; i < count; i++ {
		user := generateUser()
		members = append(members, queries.UserOnProject{
			Role:     "member",
			RoleSync: true,
			User:     &user,
		})
	}
	return members
}

func generateGitMembers(count int, users []queries.UserOnProject) []*github.User {
	var members []*github.User
	for i := 0; i < count; i++ {
		user := users[i]
		id, err := strconv.ParseInt(user.GithubID, 10, 64)
		if err != nil {
			panic(err)
		}
		members = append(members, &github.User{
			ID: &id,
		})
	}
	return members
}

func TestFindMembersToRemove(t *testing.T) {

	members1 := generateCurrentMembers(1)
	members2 := generateCurrentMembers(2)
	members3 := generateCurrentMembers(3)

	tests := []struct {
		name           string
		currentMembers []queries.UserOnProject
		gitMembers     []*github.User
		want           []string
	}{
		{
			name:           "1 git member also on team",
			currentMembers: members1,
			gitMembers:     generateGitMembers(1, members1),
			want:           []string{},
		},
		{
			name:           "2 git members also on team",
			currentMembers: members2,
			gitMembers:     generateGitMembers(2, members2),
			want:           []string{},
		},
		{
			name:           "3 git members also on team",
			currentMembers: members3,
			gitMembers:     generateGitMembers(3, members3),
			want:           []string{},
		},
		{
			name:           "1 git member not on team",
			currentMembers: []queries.UserOnProject{},
			gitMembers:     generateGitMembers(1, members1),
			want:           []string{},
		},
		{
			name:           "2 git members not on team",
			currentMembers: []queries.UserOnProject{},
			gitMembers:     generateGitMembers(0, members2),
			want:           []string{},
		},
		{
			name:           "3 git members not on team",
			currentMembers: []queries.UserOnProject{},
			gitMembers:     generateGitMembers(0, members3),
			want:           []string{},
		},
		{
			name:           "1 team member not on git",
			currentMembers: members1,
			gitMembers:     generateGitMembers(0, members1),
			want:           []string{members1[0].ID},
		},
		{
			name:           "2 team members not on git",
			currentMembers: members2,
			gitMembers:     generateGitMembers(0, members2),
			want:           []string{members2[0].ID, members2[1].ID},
		},
		{
			name:           "3 team members not on git",
			currentMembers: members3,
			gitMembers:     generateGitMembers(0, members3),
			want:           []string{members3[0].ID, members3[1].ID, members3[2].ID},
		},
		{
			name:           "1 team member not on git, 1 git member not on team",
			currentMembers: members1,
			gitMembers:     generateGitMembers(1, members2),
			want:           []string{members1[0].ID},
		},
		{
			name:           "2 team members not on git, 1 git member not on team",
			currentMembers: members2,
			gitMembers:     generateGitMembers(1, members3),
			want:           []string{members2[0].ID, members2[1].ID},
		},
		{
			name:           "3 team members not on git, 1 git member not on team",
			currentMembers: members3,
			gitMembers:     generateGitMembers(1, members1),
			want:           []string{members3[0].ID, members3[1].ID, members3[2].ID},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := findMembersToRemove(tt.currentMembers, tt.gitMembers); slices.Compare(got, tt.want) != 0 {
				t.Errorf("FindMembersToRemove() = %v, want %v", got, tt.want)
			}
		})
	}
}
