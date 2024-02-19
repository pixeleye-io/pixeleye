package git_github

import (
	"net/http"
	"strconv"

	"github.com/bradleyfalzon/ghinstallation/v2"
	"github.com/google/go-github/v59/github"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

type GithubAppClient struct {
	*github.Client
	InstallationID string
}

func NewGithubInstallClient(installationID string) (*GithubAppClient, error) {

	appID, err := utils.GetEnvInt("GITHUB_APP_ID")
	if err != nil {
		return nil, err
	}

	key, err := utils.GetEnvStr("GITHUB_APP_PRIVATE_KEY")
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

	return &GithubAppClient{
		Client:         client,
		InstallationID: installationID,
	}, nil
}

func NewGithubAppClient() (*GithubAppClient, error) {

	appID, err := utils.GetEnvInt("GITHUB_APP_ID")
	if err != nil {
		return nil, err
	}

	key, err := utils.GetEnvStr("GITHUB_APP_PRIVATE_KEY")
	if err != nil {
		return nil, err
	}

	atr, err := ghinstallation.NewAppsTransport(http.DefaultTransport, int64(appID), []byte(key))

	if err != nil {
		return nil, err
	}

	client := github.NewClient(&http.Client{Transport: atr})

	return &GithubAppClient{
		Client: client,
	}, nil
}
