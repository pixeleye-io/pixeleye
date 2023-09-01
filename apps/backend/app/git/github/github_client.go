package git_github

import (
	"net/http"
	"strconv"

	"github.com/bradleyfalzon/ghinstallation"
	"github.com/google/go-github/github"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

type GithubClient struct {
	*github.Client
}

func NewGithubInstallClient(installationID string) (*GithubClient, error) {

	appID, err := utils.GetEnvInt("GITHUB_APP_ID")
	if err != nil {
		return nil, err
	}

	key, err := utils.GetEnvStr("GITHUB_PRIVATE_KEY")
	if err != nil {
		return nil, err
	}

	installationIDInt, err := strconv.Atoi(installationID)

	if err != nil {
		return nil, err
	}

	itr, err := ghinstallation.New(http.DefaultTransport, int64(appID), int64(installationIDInt), []byte(key))

	if err != nil {
		return nil, err
	}

	client := github.NewClient(&http.Client{Transport: itr})

	return &GithubClient{
		Client: client,
	}, nil
}

func NewGithubAppClient() (*GithubClient, error) {

	appID, err := utils.GetEnvInt("GITHUB_APP_ID")
	if err != nil {
		return nil, err
	}

	key, err := utils.GetEnvStr("GITHUB_PRIVATE_KEY")
	if err != nil {
		return nil, err
	}

	atr, err := ghinstallation.NewAppsTransport(http.DefaultTransport, int64(appID), []byte(key))

	if err != nil {
		return nil, err
	}

	client := github.NewClient(&http.Client{Transport: atr})

	return &GithubClient{
		Client: client,
	}, nil
}
