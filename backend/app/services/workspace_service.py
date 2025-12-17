# backend/app/services/workspace_service.py
from sqlalchemy.orm import Session
from app.models.team import Team, TeamMember, MemberRole, MemberStatus
from app.models.user import User
from app.models.repository import Repository
from app.models.team_repository import TeamRepository
from app.services.github_service import GitHubService
from typing import List, Dict, Any, Optional
import logging
import traceback

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
            if not user. github_token:
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
            user.active_team_id = team. id

            # Add creator as Owner in TeamMember
            team_member = TeamMember(
                team_id=team.id,
                user_id=user_id,
                role=MemberRole.owner,
                status=MemberStatus.active
            )
            self.db.add(team_member)
            logger. info(f"Added user {user_id} as Owner of team {team.id}")

            # Fetch repository details from GitHub
            all_repos = self.github_service.get_user_repositories(github_token)
            selected_repos = [r for r in all_repos if r['id'] in repository_ids]

            # Store repositories in database
            stored_repos = []
            for repo_data in selected_repos:
                # Check if repository already exists (by github_id and owner)
                existing_repo = self.db.query(Repository).filter(
                    Repository.github_id == repo_data['id'],
                    Repository. owner_id == user_id
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
                        default_branch=repo_data.get('default_branch', 'main'),
                        github_id=repo_data['id']
                    )
                    self.db.add(repo)
                    self.db.flush()
                
                stored_repos.append(repo)
                logger.info(f"Stored repository {repo.id} - {repo.name}")

            # Link repositories to team
            for repo in stored_repos:
                team_repo = TeamRepository(
                    team_id=team.id,
                    repository_id=repo.id
                )
                self.db.add(team_repo)
                logger.info(f"✅ Linked repository {repo. id} ({repo.name}) to team {team.id}")

            self.db.commit()
            
            return {
                'workspace_id': team.id,
                'workspace_name': team.name,
                'repository_count': len(stored_repos),
                'message': f'Workspace created with {len(stored_repos)} repositories'
            }
            
        except Exception as e: 
            self.db.rollback()
            logger.error(f"Error creating workspace: {e}")
            raise

    def get_user_workspaces(self, user_id: int) -> List[Dict[str, Any]]: 
        """
        Get all workspaces for a user. 
        """
        try: 
            # Get all teams where user is a member
            team_members = self.db.query(TeamMember).filter(
                TeamMember.user_id == user_id,
                TeamMember.status == MemberStatus.active
            ).all()
            
            workspaces = []
            for tm in team_members:
                team = tm.team
                
                # Count repositories
                repo_count = self.db.query(TeamRepository).filter(
                    TeamRepository.team_id == team. id
                ).count()
                
                # Count members
                member_count = self. db.query(TeamMember).filter(
                    TeamMember.team_id == team.id,
                    TeamMember. status == MemberStatus.active
                ).count()
                
                workspaces.append({
                    'id': team.id,
                    'name': team.name,
                    'owner_id': team.created_by,
                    'created_at': team.created_at.isoformat() if team.created_at else None,
                    'updated_at': team.updated_at.isoformat() if team.updated_at else None,
                    'repository_count': repo_count,
                    'member_count': member_count,
                    'plan': 'Pro Trial'
                })
            
            return workspaces
            
        except Exception as e:
            logger. error(f"Error getting user workspaces: {e}")
            raise

    def switch_workspace(self, user_id: int, workspace_id: int) -> Dict[str, Any]:
        """
        Switch active workspace for a user.
        """
        try:
            # Verify user has access to workspace
            member = self.db.query(TeamMember).filter(
                TeamMember.team_id == workspace_id,
                TeamMember.user_id == user_id,
                TeamMember.status == MemberStatus.active
            ).first()
            
            if not member: 
                raise ValueError("User is not a member of this workspace")
            
            # Update user's active workspace
            user = self.db. query(User).filter(User.id == user_id).first()
            user.active_team_id = workspace_id
            self.db.commit()
            
            return {
                'message':  'Workspace switched successfully',
                'workspace_id': workspace_id
            }
            
        except Exception as e:
            self.db.rollback()
            logger. error(f"Error switching workspace:  {e}")
            raise

    # ✅ Get workspace repositories
    def get_workspace_repositories(
        self,
        workspace_id: int,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get all repositories associated with a workspace.
        """
        try:
            logger.info(f"🔍 Getting repositories for workspace {workspace_id}, user {user_id}")
            
            # Verify user has access to this workspace
            member = self.db.query(TeamMember).filter(
                TeamMember.team_id == workspace_id,
                TeamMember.user_id == user_id,
                TeamMember.status == MemberStatus.active
            ).first()
            
            if not member: 
                raise ValueError(f"User {user_id} is not a member of workspace {workspace_id}")
            
            # Get all repository IDs linked to this workspace
            team_repos = self.db.query(TeamRepository).filter(
                TeamRepository.team_id == workspace_id
            ).all()
            
            logger.info(f"📦 Found {len(team_repos)} team_repository entries")
            
            if not team_repos:
                logger.info(f"No repositories found for workspace {workspace_id}")
                return []
            
            # Get full repository details
            repo_ids = [tr.repository_id for tr in team_repos]
            repositories = self.db.query(Repository).filter(
                Repository.id.in_(repo_ids)
            ).all()
            
            logger.info(f"✅ Retrieved {len(repositories)} repository details")
            
            # Format response
            result = []
            for repo in repositories:
                result.append({
                    'id': repo.id,
                    'github_id': repo.github_id,
                    'name': repo.name,
                    'full_name': repo.full_name,
                    'description': repo.description,
                    'html_url': repo.html_url,
                    'clone_url': repo.clone_url,
                    'language': repo.language,
                    'is_private': repo.is_private,
                    'is_archived': repo.is_archived if hasattr(repo, 'is_archived') else False,
                    'default_branch': repo.default_branch,
                    'created_at':  repo.created_at.isoformat() if repo.created_at else None,
                    'updated_at': repo.updated_at.isoformat() if repo.updated_at else None
                })
            
            return result
            
        except ValueError: 
            raise
        except Exception as e: 
            logger.error(f"❌ Error fetching workspace repositories: {e}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to fetch workspace repositories: {str(e)}")

    # ✅ Get available repositories (not in workspace)
    def get_available_repositories(self, user_id: int, workspace_id: int) -> List[Dict[str, Any]]: 
        """
        Get repositories that can be added to workspace (not already in it).
        """
        try:
            logger.info(f"🔍 Getting available repositories for user {user_id}, workspace {workspace_id}")
            
            # Get all user's repositories from database
            all_repos = self.db.query(Repository).filter(
                Repository.owner_id == user_id
            ).all()
            
            logger.info(f"📦 User has {len(all_repos)} total repositories")
            
            # Get repositories already in workspace
            workspace_repo_ids = self.db.query(TeamRepository. repository_id).filter(
                TeamRepository.team_id == workspace_id
            ).all()
            workspace_repo_ids = [r[0] for r in workspace_repo_ids]
            
            logger.info(f"📦 Workspace already has {len(workspace_repo_ids)} repositories")
            
            # Filter out repositories already in workspace
            available_repos = [
                {
                    'id': repo.id,
                    'github_id': repo.github_id,
                    'name': repo.name,
                    'full_name': repo.full_name,
                    'description': repo.description,
                    'language': repo.language,
                    'is_private': repo.is_private,
                    'html_url': repo.html_url
                }
                for repo in all_repos
                if repo.id not in workspace_repo_ids
            ]
            
            logger. info(f"✅ Found {len(available_repos)} available repositories")
            return available_repos
            
        except Exception as e:
            logger. error(f"❌ Error getting available repositories: {e}")
            logger.error(traceback.format_exc())
            raise

    # ✅ Add repository to workspace
    def add_repository_to_workspace(
        self,
        workspace_id: int,
        repository_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Add an existing repository to a workspace.
        """
        try:
            logger.info(f"➕ Adding repository {repository_id} to workspace {workspace_id}")
            
            # Verify user is admin/owner of workspace
            member = self.db.query(TeamMember).filter(
                TeamMember.team_id == workspace_id,
                TeamMember.user_id == user_id,
                TeamMember.status == MemberStatus.active
            ).first()
            
            if not member or member.role. value not in ['Owner', 'Admin']:
                raise ValueError("Only workspace owners and admins can add repositories")
            
            # Check if repository exists and belongs to user
            repository = self.db.query(Repository).filter(
                Repository.id == repository_id,
                Repository.owner_id == user_id
            ).first()
            
            if not repository:
                raise ValueError("Repository not found or you don't have access")
            
            # Check if already linked
            existing_link = self.db.query(TeamRepository).filter(
                TeamRepository.team_id == workspace_id,
                TeamRepository.repository_id == repository_id
            ).first()
            
            if existing_link:
                raise ValueError("Repository is already in this workspace")
            
            # Create link
            team_repo = TeamRepository(
                team_id=workspace_id,
                repository_id=repository_id
            )
            self.db.add(team_repo)
            self.db.commit()
            
            logger.info(f"✅ Successfully added repository {repository_id} to workspace {workspace_id}")
            
            return {
                'message':  'Repository added successfully',
                'repository_id': repository_id,
                'workspace_id':  workspace_id
            }
            
        except ValueError: 
            self.db.rollback()
            raise
        except Exception as e: 
            self.db.rollback()
            logger.error(f"❌ Error adding repository to workspace: {e}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to add repository:  {str(e)}")

    async def handle_workspace_oauth_callback(
        self,
        user_id: int,
        code: str,
        state: str
    ) -> Dict[str, Any]:
        """
        Handle OAuth callback for workspace creation.
        """
        # This would handle the OAuth flow
        # Implementation depends on your OAuth setup
        pass