import httpx
from typing import Optional, List, Dict, Any
from github import Github
from app.config.settings import settings


class GitHubService:
    def __init__(self):
        self.client_id = settings.GITHUB_CLIENT_ID
        self.client_secret = settings.GITHUB_CLIENT_SECRET
        self.redirect_uri = settings.GITHUB_REDIRECT_URI

    async def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from GitHub"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            return None

    async def get_user_email(self, access_token: str) -> Optional[str]:
        """Get primary email from GitHub"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if response.status_code == 200:
                emails = response.json()
                for email in emails:
                    if email.get("primary", False):
                        return email.get("email")
            return None

    def get_user_repositories(self, access_token: str) -> List[Dict[str, Any]]:
        """Get user repositories using PyGithub"""
        try:
            g = Github(access_token)
            user = g.get_user()
            repos = []
            
            for repo in user.get_repos():
                repos.append({
                    "id": repo.id,
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "html_url": repo.html_url,
                    "clone_url": repo.clone_url,
                    "default_branch": repo.default_branch,
                    "language": repo.language,
                    "private": repo.private,
                    "fork": repo.fork,
                    "created_at": repo.created_at.isoformat() if repo.created_at else None,
                    "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
                })
            
            return repos
        except Exception as e:
            print(f"Error fetching repositories: {e}")
            return []

    def get_repository_content(self, access_token: str, repo_full_name: str, path: str = "") -> Optional[List[Dict[str, Any]]]:
        """Get repository content for scanning"""
        try:
            g = Github(access_token)
            repo = g.get_repo(repo_full_name)
            contents = repo.get_contents(path)
            
            if not isinstance(contents, list):
                contents = [contents]
            
            result = []
            for content in contents:
                result.append({
                    "name": content.name,
                    "path": content.path,
                    "type": content.type,
                    "size": content.size,
                    "download_url": content.download_url,
                })
            
            return result
        except Exception as e:
            print(f"Error fetching repository content: {e}")
            return None

    @staticmethod
    def get_authorization_url() -> str:
        """Get GitHub OAuth authorization URL"""
        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={settings.GITHUB_CLIENT_ID}"
            f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
            f"&scope=repo,user:email"
        )