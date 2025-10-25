# backend/app/services/workspace_service.py
from sqlalchemy.orm import Session
from app.models.team import Team, TeamMember, MemberRole, MemberStatus
from app.models.user import User
from app.models.repository import Repository
from app.models.team_repository import TeamRepository
from app.services.github_service import GitHubService
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class WorkspaceService:
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()

    def get_user_repositories(self, user: User) -> List[Dict[str, Any]]:
        """
        Fetch user's GitHub repositories using their stored token.
        """
        try:
            if not user.github_token:
                raise ValueError("User does not have a GitHub token. Please login with GitHub first.")
            
            repos = self.github_service.get_user_repositories(user.github_token)
            logger.info(f"Fetched {len(repos)} repositories for user {user.id}")
            return repos
        except Exception as e:
            logger.error(f"Error fetching repositories: {e}")
            raise

    def create_workspace_with_repositories(
        self,
        user_id: int,
        workspace_name: str,
        repository_ids: List[int],
        github_token: str
    ) -> Dict[str, Any]:
        """
        Create a new workspace and add selected repositories to it.
        """
        try:
            # Create new team/workspace
            team = Team(
                name=workspace_name,
                created_by=user_id
            )
            self.db.add(team)
            self.db.flush()
            logger.info(f"Created new team {team.id}")

            # Set as active workspace
            user = self.db.query(User).filter(User.id == user_id).first()
            user.active_team_id = team.id

            # Add creator as Owner in TeamMember
            team_member = TeamMember(
                team_id=team.id,
                user_id=user_id,
                role=MemberRole.owner,
                status=MemberStatus.active
            )
            self.db.add(team_member)
            logger.info(f"Added user {user_id} as Owner of team {team.id}")

            # Fetch repository details from GitHub
            all_repos = self.github_service.get_user_repositories(github_token)
            selected_repos = [r for r in all_repos if r['id'] in repository_ids]

            # Store repositories in database
            stored_repos = []
            for repo_data in selected_repos:
                # Check if repository already exists (by github_id and owner)
                existing_repo = self.db.query(Repository).filter(
                    Repository.github_id == repo_data['id'],
                    Repository.owner_id == user_id
                ).first()

                if existing_repo:
                    # Update existing repository
                    repo = existing_repo
                    repo.name = repo_data['name']
                    repo.full_name = repo_data['full_name']
                    repo.description = repo_data.get('description')
                    repo.html_url = repo_data['html_url']
                    repo.clone_url = repo_data['clone_url']
                    repo.language = repo_data.get('language')
                    repo.is_private = repo_data['private']
                    repo.default_branch = repo_data.get('default_branch', 'main')
                else:
                    # Create new repository
                    repo = Repository(
                        owner_id=user_id,
                        name=repo_data['name'],
                        full_name=repo_data['full_name'],
                        description=repo_data.get('description'),
                        html_url=repo_data['html_url'],
                        clone_url=repo_data['clone_url'],
                        language=repo_data.get('language'),
                        is_private=repo_data['private'],
                        is_fork=repo_data.get('fork', False),
                        default_branch=repo_data.get('default_branch', 'main'),
                        github_id=repo_data['id']
                    )
                    self.db.add(repo)
                    self.db.flush()

                # Link repository to team
                team_repo = TeamRepository(
                    team_id=team.id,
                    repository_id=repo.id
                )
                self.db.add(team_repo)
                stored_repos.append(repo)

            self.db.commit()

            logger.info(f"Created workspace '{workspace_name}' with {len(stored_repos)} repositories")

            return {
                "workspace_id": team.id,
                "workspace_name": team.name,
                "repository_count": len(stored_repos),
                "repositories": [
                    {
                        "id": r.id,
                        "name": r.name,
                        "full_name": r.full_name
                    }
                    for r in stored_repos
                ],
                "message": "Workspace created successfully"
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating workspace: {e}")
            raise

    def get_workspace_repositories(
        self, 
        workspace_id: int, 
        user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get all repositories in a workspace.
        """
        try:
            # Verify user has access to workspace
            team = self.db.query(Team).filter(
                Team.id == workspace_id,
                Team.created_by == user_id
            ).first()
            
            if not team:
                raise ValueError("Workspace not found or access denied")

            # Get repositories through the junction table
            team_repos = self.db.query(TeamRepository).filter(
                TeamRepository.team_id == workspace_id
            ).all()

            repos = [tr.repository for tr in team_repos]

            return [
                {
                    "id": r.id,
                    "name": r.name,
                    "full_name": r.full_name,
                    "description": r.description,
                    "html_url": r.html_url,
                    "language": r.language,
                    "is_private": r.is_private,
                    "source": r.source_type
                }
                for r in repos
            ]

        except Exception as e:
            logger.error(f"Error fetching workspace repositories: {e}")
            raise

    def get_user_workspaces(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get all workspaces for a user.
        """
        try:
            teams = self.db.query(Team).filter(Team.created_by == user_id).all()
            
            return [
                {
                    "id": team.id,
                    "name": team.name,
                    "created_at": team.created_at.isoformat() if team.created_at else None,
                    "repository_count": len(team.team_repositories)
                }
                for team in teams
            ]
        except Exception as e:
            logger.error(f"Error fetching user workspaces: {e}")
            raise

    def switch_workspace(self, user_id: int, workspace_id: int) -> Dict[str, Any]:
        """
        Switch user's active workspace.
        """
        try:
            # Verify workspace belongs to user
            team = self.db.query(Team).filter(
                Team.id == workspace_id,
                Team.created_by == user_id
            ).first()
            
            if not team:
                raise ValueError("Workspace not found or access denied")
            
            # Update user's active workspace
            user = self.db.query(User).filter(User.id == user_id).first()
            user.active_team_id = workspace_id
            self.db.commit()
            
            logger.info(f"User {user_id} switched to workspace {workspace_id}")
            
            return {
                "workspace_id": team.id,
                "workspace_name": team.name,
                "message": "Workspace switched successfully"
            }
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error switching workspace: {e}")
            raise