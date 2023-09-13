---
title: Teams and Permissions
description: Pixeleye allows you to have unlimited teams and control what members can do via roles.
---

# Teams and Permissions

Pixeleye allows you to have unlimited teams and control what members can do via roles.

## Personal teams

When you sign up to Pixeleye, you will automatically be assigned to a personal team. This team is designed to hold all of your personal projects. You can add projects from any version control provider and invite other members to collaborate with you.

## Organization teams

When you add a supported vcs provider, we will automatically create an organization team for you. For example, adding org `pixeleye-io` from GitHub will create a team called `pixeleye-io`. This team will automatically sync all the collaborators from your vcs provider adding them to your Pixeleye team with the correct roles.

## Roles

### Team roles

Pixeleye teams has 4 roles:

- **Owner** - The owner of the team. They can add and remove members, change the team name and delete the team.
- **Admin** - Admins can add and remove members, change the team name and delete the team.
- **Accountant** - Accountants can view and update the team's billing information. (cloud only)
- **Member** - Members can view and edit projects.

### Project roles

Pixeleye projects has 3 roles:

- **Admin** - The owner of the project. They have full control over the project.
- **Reviewer** - Reviewers can view and approve snapshots/builds. This should be used for developers who are responsible for code reviews.
- **Viewer** - Viewers can view snapshots/builds. This should be used for stakeholders who need to view the project but not make any changes.

> Note: The admin & owner team roles override any project roles. Anyone with such team access will be treaded as an admin for all projects within that team.
